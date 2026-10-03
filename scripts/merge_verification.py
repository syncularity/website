"""Prepare one merge status from exact hosted or complete local verification.

All GitHub calls are reads unless --publish is explicitly supplied. This helper
uses existing gh access; it never dispatches Actions or changes repository rules.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import uuid

CONTEXT = "Merge verification"
REPORT_DIRECTORY = Path("artifacts/merge-verification")
CONFIG = {
    "syncularity/content-pipeline": {
        "workflow": ".github/workflows/dashboard-release.yml", "job": "CI passed",
        "command": ["pnpm", "verify:affected"], "marker": "CI_ATTESTATION ",
    },
    "syncularity/website": {
        "workflow": ".github/workflows/check.yml", "job": "Website verification",
        "command": ["npm", "run", "check"], "marker": "MERGE_EVIDENCE ",
    },
}


def git(*args):
    return subprocess.check_output(["git", *args], text=True).strip()


def github(repo, path, raw=False):
    output = subprocess.check_output(["gh", "api", f"repos/{repo}/{path}"], text=True)
    return output if raw else json.loads(output)


def identity(repo, base):
    if git("remote", "get-url", "origin") != f"https://github.com/{repo}.git":
        raise ValueError("origin must be the selected company repository")
    if git("status", "--porcelain", "--untracked-files=normal"):
        raise ValueError("Verification requires a clean checkout")
    head = git("rev-parse", "HEAD")
    if git("rev-parse", base) != base or len(base) != 40:
        raise ValueError("Use a full comparison commit SHA")
    if git("merge-base", base, head) != base:
        raise ValueError("Refresh the branch to the intended base before merge verification")
    return {"repo": repo, "head": head, "base": base, "tree": git("rev-parse", "HEAD^{tree}")}


def local_command(repo, base):
    command = CONFIG[repo]["command"].copy()
    if repo.endswith("/content-pipeline"):
        command += ["--base", base, "--fresh"]
    return command


def run_local(repo, base):
    before = identity(repo, base)
    directory = REPORT_DIRECTORY
    directory.mkdir(parents=True, exist_ok=True)
    report_path = directory / (uuid.uuid4().hex + ".json")
    log_path = report_path.with_suffix(".log")
    report = {"version": 1, **before, "command": local_command(repo, base), "status": "running", "startedAt": time.time_ns()}
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    try:
        with log_path.open("w") as log:
            subprocess.run(report["command"], check=True, stdout=log, stderr=subprocess.STDOUT)
        if identity(repo, base) != before:
            raise ValueError("Revision changed during verification")
        report["status"] = "passed"
    finally:
        if report["status"] == "running":
            report["status"] = "failed"
        report_path.write_text(json.dumps(report, indent=2) + "\n")
        print(f"Local report: {report_path}; log: {log_path}", file=sys.stderr)
    return report_path


def validate_local(report, expected):
    if not isinstance(report, dict) or report.get("version") != 1 or report.get("status") != "passed":
        raise ValueError("Local verification is incomplete or failed")
    if any(report.get(key) != value for key, value in expected.items()):
        raise ValueError("Local report does not match this repository, head, base and tree")
    if report.get("command") != local_command(expected["repo"], expected["base"]):
        raise ValueError("Local report must execute the complete canonical gate")


def validate_latest_local(path, expected):
    if path.parent.resolve() != REPORT_DIRECTORY.resolve() or path.is_symlink():
        raise ValueError("Use this checkout's original merge-verification report")
    matching = []
    for candidate in REPORT_DIRECTORY.glob("*.json"):
        record = json.loads(candidate.read_text())
        if any(record.get(key) != value for key, value in expected.items()):
            continue
        started = record.get("startedAt")
        if not isinstance(started, int) or isinstance(started, bool) or started <= 0:
            raise ValueError("Local attempt history is missing its start identity; rerun verification")
        matching.append((started, candidate.resolve(), record))
    if not matching:
        raise ValueError("No original local attempt matches this revision")
    latest = max(matching, key=lambda item: item[0])
    if latest[1] != path.resolve() or latest[2].get("status") != "passed":
        raise ValueError("Use the latest successful local attempt; never waive a newer failure or pending run")


def matching_runs(repo, head, fetch=github):
    runs, page = [], 1
    while True:
        listing = fetch(repo, f"actions/runs?head_sha={head}&event=pull_request&per_page=100&page={page}")
        batch = listing["workflow_runs"]
        runs.extend(batch)
        if len(batch) < 100:
            break
        page += 1
        if page > 10:
            raise ValueError("Too many runs to establish unambiguous evidence")
    # Every PR workflow matters for executed-failure protection.
    latest = {}
    for run in runs:
        if run.get("head_sha") != head or run.get("event") != "pull_request":
            raise ValueError("Unexpected run identity")
        key = run["workflow_id"]
        if key not in latest or run["id"] > latest[key]["id"]:
            latest[key] = run
    for run in latest.values():
        if run.get("status") != "completed":
            raise ValueError("Hosted verification is still pending; do not race an executing run")
        if run.get("conclusion") in ("failure", "timed_out", "cancelled", "action_required", "startup_failure"):
            jobs = fetch(repo, f"actions/runs/{run['id']}/attempts/{run['run_attempt']}/jobs?per_page=100")
            # Quota/pre-start failures have no runner jobs. Never waive an
            # executed failed/cancelled attempt, even if only setup executed.
            if (run.get("conclusion") not in ("failure", "startup_failure")
                    or jobs.get("total_count") != 0 or jobs.get("jobs") != []):
                raise ValueError("Latest hosted run did not pass; resolve or inspect it before attesting")
    return list(latest.values())


def validate_hosted(repo, expected, runs, fetch=github):
    config = CONFIG[repo]
    candidates = [run for run in runs if run.get("path") == config["workflow"]]
    if len(candidates) != 1 or candidates[0].get("conclusion") != "success":
        raise ValueError("No unique successful hosted workflow for this head")
    run = candidates[0]
    jobs = fetch(repo, f"actions/runs/{run['id']}/attempts/{run['run_attempt']}/jobs?per_page=100")
    if jobs["total_count"] != len(jobs["jobs"]):
        raise ValueError("Incomplete hosted job evidence")
    gates = [job for job in jobs["jobs"] if job.get("name") == config["job"] and job.get("conclusion") == "success"]
    if len(gates) != 1:
        raise ValueError("Successful aggregate job is missing")
    log = fetch(repo, f"actions/jobs/{gates[0]['id']}/logs", raw=True)
    records = [json.loads(line.split(config["marker"], 1)[1])
               for line in log.splitlines() if config["marker"] in line]
    if len(records) != 1:
        raise ValueError("Missing or ambiguous exact hosted evidence")
    record = records[0]
    for key in ("head", "base"):
        if record.get(key) != expected[key]:
            raise ValueError("Hosted evidence has a different head or base")
    if record.get("run") != run["id"] or record.get("attempt") != run["run_attempt"]:
        raise ValueError("Hosted evidence has a different run or attempt")
    return run["html_url"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", choices=CONFIG, required=True)
    parser.add_argument("--run-local", action="store_true")
    parser.add_argument("--base", help="Full base SHA, required for --run-local")
    parser.add_argument("--pr", type=int)
    parser.add_argument("--local-report", type=Path)
    parser.add_argument("--publish", action="store_true", help="One status write; requires explicit action-time approval")
    parser.add_argument("--emit-hosted", action="store_true", help="Website workflow's final successful step")
    args = parser.parse_args()
    if args.emit_hosted:
        if args.repo != "syncularity/website" or os.environ.get("GITHUB_EVENT_NAME") != "pull_request":
            parser.error("Hosted emission is only for the website PR workflow")
        print("MERGE_EVIDENCE " + json.dumps({"head": os.environ["PR_HEAD"], "base": os.environ["PR_BASE"],
              "run": int(os.environ["GITHUB_RUN_ID"]), "attempt": int(os.environ["GITHUB_RUN_ATTEMPT"])}))
        return
    if args.run_local:
        if not args.base or args.pr or args.publish or args.local_report:
            parser.error("--run-local requires --base and cannot publish or accept previous reports")
        run_local(args.repo, args.base)
        return
    if not args.pr or args.base:
        parser.error("Status preparation requires --pr; --base is only for --run-local")
    pr = github(args.repo, f"pulls/{args.pr}")
    if (pr["state"] != "open" or pr["draft"] or pr["base"]["ref"] != "main"
            or pr["head"]["repo"]["full_name"] != args.repo):
        raise ValueError("Use an open, ready company-branch PR targeting main")
    expected = identity(args.repo, pr["base"]["sha"])
    if expected["head"] != pr["head"]["sha"]:
        raise ValueError("Checkout HEAD differs from PR head")
    runs = matching_runs(args.repo, expected["head"])
    if args.local_report:
        validate_local(json.loads(args.local_report.read_text()), expected)
        validate_latest_local(args.local_report, expected)
        source, url = "complete local", pr["html_url"]
    else:
        source = "hosted aggregate"
        url = validate_hosted(args.repo, expected, runs)
    payload = {"state": "success", "context": CONTEXT, "target_url": url,
               "description": f"{source}; base {expected['base'][:12]}; head {expected['head'][:12]}"}
    # Re-read immediately before the write; a new head/base invalidates evidence.
    current = github(args.repo, f"pulls/{args.pr}")
    if (current["state"] != "open" or current["draft"]
            or any(current[side]["sha"] != pr[side]["sha"] for side in ("head", "base"))
            or identity(args.repo, expected["base"]) != expected):
        raise ValueError("PR or checkout moved while preparing evidence; verify the new revision")
    matching_runs(args.repo, expected["head"])
    if args.local_report:
        validate_latest_local(args.local_report, expected)
    if args.publish:
        subprocess.run(["gh", "api", "--method", "POST", f"repos/{args.repo}/statuses/{expected['head']}",
                        "--input", "-"], input=json.dumps(payload), text=True, check=True, stdout=subprocess.DEVNULL)
        print(f"Published {CONTEXT} for {expected['head']}")
    else:
        print(json.dumps({"repository": args.repo, "head": expected["head"], "payload": payload,
                          "published": False}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, TypeError, OSError, subprocess.CalledProcessError) as error:
        raise SystemExit(str(error)) from error
