"""Exercise refusal of stale, partial and failed merge evidence without GitHub writes."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve()
while not (ROOT / '.git').exists():
    ROOT = ROOT.parent
HELPER = ROOT / ('scripts/review/merge_verification.py' if (ROOT / 'scripts/review').exists()
                 else 'scripts/merge_verification.py')
spec = importlib.util.spec_from_file_location('merge_verification', HELPER)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class LocalEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.expected = dict(repo='syncularity/content-pipeline', head='a' * 40,
                             base='b' * 40, tree='c' * 40)
        self.report = dict(version=1, **self.expected, status='passed',
                           command=gate.local_command(self.expected['repo'], self.expected['base']))

    def test_complete_canonical_gate_is_accepted(self):
        gate.validate_local(self.report, self.expected)
        expected = {**self.expected, 'repo': 'syncularity/website'}
        gate.validate_local({**self.report, **expected, 'command': ['npm', 'run', 'check']}, expected)

    def test_stale_identity_and_incomplete_or_fast_results_are_refused(self):
        for key, value in [('head', 'd' * 40), ('base', 'd' * 40), ('tree', 'd' * 40),
                           ('repo', 'syncularity/website'), ('status', 'running'),
                           ('status', 'failed'), ('command', ['pnpm', 'test']), ('version', 0)]:
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                gate.validate_local({**self.report, key: value}, self.expected)
        with self.assertRaises(ValueError):
            gate.validate_local(None, self.expected)

    def test_origin_dirty_and_nonancestor_checkouts_are_refused(self):
        def read(*args):
            return {('remote', 'get-url', 'origin'): 'https://github.com/syncularity/website.git',
                    ('status', '--porcelain', '--untracked-files=normal'): '',
                    ('rev-parse', 'HEAD'): 'a' * 40, ('rev-parse', 'b' * 40): 'b' * 40,
                    ('merge-base', 'b' * 40, 'a' * 40): 'b' * 40,
                    ('rev-parse', 'HEAD^{tree}'): 'c' * 40}[args]
        with patch.object(gate, 'git', side_effect=read):
            self.assertEqual(gate.identity('syncularity/website', 'b' * 40)['head'], 'a' * 40)
            with self.assertRaises(ValueError):
                gate.identity('syncularity/content-pipeline', 'b' * 40)
        for target, bad in [(('status', '--porcelain', '--untracked-files=normal'), ' M page.tsx'),
                            (('merge-base', 'b' * 40, 'a' * 40), 'd' * 40)]:
            with patch.object(gate, 'git', side_effect=lambda *a: bad if a == target else read(*a)):
                with self.assertRaises(ValueError):
                    gate.identity('syncularity/website', 'b' * 40)


class HostedEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.expected = dict(repo='syncularity/website', head='a' * 40, base='b' * 40, tree='c' * 40)
        self.run = dict(id=7, workflow_id=2, head_sha='a' * 40, event='pull_request',
                        path='.github/workflows/check.yml', status='completed', conclusion='success',
                        run_attempt=1, html_url='https://github.com/syncularity/website/actions/runs/7')
        self.record = dict(head='a' * 40, base='b' * 40, run=7, attempt=1)

    def test_latest_run_wins_and_executed_failure_is_never_waived(self):
        bad = {**self.run, 'id': 8, 'conclusion': 'failure'}
        def fetch(repo, path):
            if path.startswith('actions/runs?'):
                return dict(workflow_runs=[self.run, bad])
            return dict(total_count=1, jobs=[dict(conclusion='failure')])
        with self.assertRaises(ValueError):
            gate.matching_runs('syncularity/website', 'a' * 40, fetch)

    def test_confirmed_zero_job_start_failure_allows_local_fallback(self):
        bad = {**self.run, 'conclusion': 'startup_failure'}
        def fetch(repo, path):
            return dict(workflow_runs=[bad]) if path.startswith('actions/runs?') else dict(total_count=0, jobs=[])
        runs = gate.matching_runs('syncularity/website', 'a' * 40, fetch)
        with self.assertRaises(ValueError):
            gate.validate_hosted('syncularity/website', self.expected, runs, fetch)

    def test_pending_cancelled_and_mismatched_runs_are_refused(self):
        for override in [dict(status='queued'), dict(conclusion='cancelled'), dict(head_sha='d' * 40)]:
            def fetch(repo, path):
                return dict(workflow_runs=[{**self.run, **override}]) if path.startswith('actions/runs?') else dict(total_count=0, jobs=[])
            with self.subTest(override=override), self.assertRaises(ValueError):
                gate.matching_runs('syncularity/website', 'a' * 40, fetch)

    def test_exact_hosted_aggregate_and_provenance(self):
        def fetch(repo, path, raw=False):
            if raw:
                return 'timestamp MERGE_EVIDENCE ' + json.dumps(self.record)
            return dict(total_count=1, jobs=[dict(id=9, name='Website verification', conclusion='success')])
        self.assertEqual(gate.validate_hosted('syncularity/website', self.expected, [self.run], fetch), self.run['html_url'])
        for key, value in [('base', 'd' * 40), ('head', 'd' * 40), ('run', 6), ('attempt', 2)]:
            original = copy.deepcopy(self.record)
            self.record[key] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                gate.validate_hosted('syncularity/website', self.expected, [self.run], fetch)
            self.record = original
        with self.assertRaises(ValueError):
            gate.validate_hosted('syncularity/website', self.expected, [], fetch)

    def test_no_matching_runs_still_permits_complete_local_validation(self):
        self.assertEqual(gate.matching_runs('syncularity/website', 'a' * 40,
                                          lambda repo, path: dict(workflow_runs=[])), [])

class PreparationTests(unittest.TestCase):
    def test_preview_never_writes_and_moving_pr_is_refused(self):
        from contextlib import redirect_stdout
        import io
        import tempfile
        expected = dict(repo='syncularity/website', head='a' * 40, base='b' * 40, tree='c' * 40)
        pr = dict(state='open', draft=False, html_url='https://github.com/syncularity/website/pull/1',
                  head=dict(sha='a' * 40, repo=dict(full_name='syncularity/website')),
                  base=dict(sha='b' * 40, ref='main'))
        report = dict(version=1, **expected, status='passed', command=['npm', 'run', 'check'], startedAt=1)
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'report.json'
            path.write_text(json.dumps(report))
            argv = ['merge_verification.py', '--repo', 'syncularity/website', '--pr', '1', '--local-report', str(path)]
            with patch.object(gate, 'REPORT_DIRECTORY', Path(temp)), patch('sys.argv', argv), patch.object(gate, 'identity', return_value=expected), \
                    patch.object(gate, 'matching_runs', return_value=[]), \
                    patch.object(gate, 'github', return_value=pr), patch.object(gate.subprocess, 'run') as write:
                out = io.StringIO()
                with redirect_stdout(out):
                    gate.main()
                self.assertFalse(json.loads(out.getvalue())['published'])
                write.assert_not_called()
            moved = copy.deepcopy(pr)
            moved['head']['sha'] = 'd' * 40
            with patch.object(gate, 'REPORT_DIRECTORY', Path(temp)), patch('sys.argv', argv + ['--publish']), patch.object(gate, 'identity', return_value=expected), \
                    patch.object(gate, 'matching_runs', return_value=[]), \
                    patch.object(gate, 'github', side_effect=[pr, moved]), patch.object(gate.subprocess, 'run') as write:
                with self.assertRaises(ValueError):
                    gate.main()
                write.assert_not_called()


    def test_newer_failed_or_pending_attempt_invalidates_an_older_local_pass(self):
        import tempfile
        expected = dict(repo='syncularity/website', head='a' * 40, base='b' * 40, tree='c' * 40)
        with tempfile.TemporaryDirectory() as temp, patch.object(gate, 'REPORT_DIRECTORY', Path(temp)):
            old = Path(temp) / 'old.json'
            new = Path(temp) / 'new.json'
            old.write_text(json.dumps(dict(**expected, status='passed', startedAt=1)))
            gate.validate_latest_local(old, expected)
            for status in ('running', 'failed', 'passed'):
                new.write_text(json.dumps(dict(**expected, status=status, startedAt=2)))
                with self.subTest(status=status), self.assertRaises(ValueError):
                    gate.validate_latest_local(old, expected)
                if status == 'passed':
                    gate.validate_latest_local(new, expected)
                else:
                    with self.assertRaises(ValueError):
                        gate.validate_latest_local(new, expected)

    def test_failed_canonical_run_cannot_leave_a_pass_report(self):
        import os
        import tempfile
        import subprocess
        expected = dict(repo='syncularity/website', head='a' * 40, base='b' * 40, tree='c' * 40)
        before = Path.cwd()
        with tempfile.TemporaryDirectory() as temp:
            try:
                os.chdir(temp)
                with patch.object(gate, 'identity', return_value=expected), \
                        patch.object(gate.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, ['npm', 'run', 'check'])):
                    with self.assertRaises(subprocess.CalledProcessError):
                        gate.run_local('syncularity/website', 'b' * 40)
                reports = list(Path('artifacts/merge-verification').glob('*.json'))
                self.assertEqual(len(reports), 1)
                self.assertEqual(json.loads(reports[0].read_text())['status'], 'failed')
            finally:
                os.chdir(before)


if __name__ == '__main__':
    unittest.main()
