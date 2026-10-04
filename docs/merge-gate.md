# Proposed merge verification gate

This configuration is prepared, not active. The `Website verification` hosted
job runs the complete `npm run check` sequence, then emits exact PR head/base and
run/attempt evidence. There are no conditional test jobs or path filters. Existing
push/PR triggers are preserved. Standard public-repository runners are included,
but pushing can also trigger Vercel previews: confirm their authorization and
cost before pushing. A PR does not authorize a deployment.

The proposed [main-ruleset.json](main-ruleset.json) targets only
`refs/heads/main`: require a PR, resolved review threads, an up-to-date
**Merge verification** status, and block deletion/force pushes. It has no bypass
actors, no mandatory approving reviewer count and permits the existing merge
methods. Human merge approval remains separate. GitHub's required statuses are
AND conditions, so one attended status permits either hosted or complete local
evidence without disabling protection when Actions cannot start.

## Local verification and status preparation

Use Node 24, Python 3 (standard library only), `npm ci` and the previously installed
Playwright Chromium shell. Commit the final change and fetch current `main`.
At merge completion, the full base SHA must be an ancestor of the PR head.
From the repository root:

```sh
python3 scripts/merge_verification.py --repo syncularity/website --run-local --base <base>
```

This executes `npm run check` once (types, Node animation tests, merge-helper
regressions, production build and Chromium smoke). It requires a clean checkout
and writes a completion report and full log under ignored
`artifacts/merge-verification/`. Keep those paths and head/base in the PR body.
Do not hand-author reports, use another tree's report or replace the full check
with individual test passes. Existing browser port ownership/refusals still apply.

On the open, ready company-branch PR, preview the status:

```sh
python3 scripts/merge_verification.py --repo syncularity/website --pr <number> --local-report <report.json>
```

Omit `--local-report` to validate successful hosted `Website verification`
evidence instead. This command only reads GitHub and prints a payload. It does
not start a runner. Dirty trees, different head/base/tree, partial results,
pending hosted runs and executed failed/cancelled runs are refused. Confirmed
pre-start failures with zero jobs permit complete local fallback. Hosted failure
is never rewritten as a passing hosted result. New head/base requires new proof.
Only the latest local attempt for this head/base/tree can support a status; newer
failed or pending attempts invalidate older passes. Keep the original report in
this checkout's `artifacts/merge-verification/` directory.
Strict up-to-date protection complements the helper's exact-base checks. The
last PR read and status write are not atomic; inspect current base/status in the
merge UI before an approved merge.

## Exact approval needed

Immediately before activation, obtain approval to create **Verified main merges**
in **syncularity/website**, using the exact JSON above. Re-read repository and
organization guards first, preserve any new rules, and confirm the intended PR
status can be prepared before requiring it. Do not alter access, billing,
Vercel settings or other repositories.

Separately obtain action-time approval to publish **one success commit status**,
context `Merge verification`, on the named PR's exact head SHA, from the named
passing report/run. Then rerun its preparation command with `--publish`. This
approves no merge, deployment, workflow dispatch, persistent token or app grant.

The required status accepts **any source**, so existing repository writers can
publish it without a new GitHub App. Writers can spoof statuses; the helper and
local JSON are trusted attended evidence, not cryptographic attestation. Binding
to Actions would block the local fallback. A restricted status-publishing app
would need a separately approved access design. Public-repository rulesets are
included; that fact does not authorize runner/deployment usage.

GitHub documentation: [rules and status sources](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets),
[ruleset API](https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset).
