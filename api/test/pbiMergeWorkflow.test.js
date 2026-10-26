const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { mkdtempSync, writeFileSync, chmodSync, readFileSync, existsSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const helper = resolve(__dirname, '../../scripts/mergePbiAfterCi.sh');

function runMerge(overrides = {}) {
    const directory = mkdtempSync(join(tmpdir(), 'sfstudio-pbi-merge-'));
    const gh = join(directory, 'gh');
    const git = join(directory, 'git');
    const sleep = join(directory, 'sleep');
    const ghScript = `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1 $2" == 'pr checks' ]]; then
  if [[ " $* " == *' --watch '* ]]; then
    [[ "__DOLLAR__{TEST_WATCH_STATE:-pass}" == pass ]]
    exit
  fi
  if [[ "$*" == *bucket* ]]; then
    echo "__DOLLAR__{TEST_CI_STATE:-pass}"
    exit 0
  fi
  count=0
  if [[ -f "$TEST_COUNTER_FILE" ]]; then count="$(cat "$TEST_COUNTER_FILE")"; fi
  echo "$((count + 1))" > "$TEST_COUNTER_FILE"
  if [[ "$count" -eq 0 ]]; then echo 0; else echo 1; fi
  exit 0
fi
if [[ "$1 $2" == 'pr view' ]]; then echo dev; exit 0; fi
if [[ "$1 $2" == 'pr merge' ]]; then echo "$*" >> "$TEST_MERGE_LOG"; exit 0; fi
exit 1
`;
    writeFileSync(gh, ghScript.replaceAll('__DOLLAR__', '$'));
    const gitScript = `#!/usr/bin/env bash
if [[ "$1" == ls-remote ]]; then
  printf '%s\\trefs/heads/dev\\n' "__DOLLAR__{TEST_BASE_SHA:-base123}"
  exit 0
fi
exit 1
`;
    writeFileSync(git, gitScript.replaceAll('__DOLLAR__', '$'));
    writeFileSync(sleep, '#!/usr/bin/env bash\nexit 0\n');
    for (const file of [gh, git, sleep]) chmodSync(file, 0o755);
    const mergeLog = join(directory, 'merge.log');
    const result = spawnSync('bash', [helper, 'https://example.test/pull/1', 'base123', 'head123'], {
        encoding: 'utf8',
        env: {
            ...process.env,
            PATH: `${directory}:${process.env.PATH}`,
            TEST_COUNTER_FILE: join(directory, 'counter'),
            TEST_MERGE_LOG: mergeLog,
            ...overrides,
        },
    });
    const merges = existsSync(mergeLog) ? readFileSync(mergeLog, 'utf8') : '';
    rmSync(directory, { recursive: true, force: true });
    return { result, merges };
}

describe('PBI merge after CI', () => {
    it('waits for pull_request CI and merges the verified head into dev', () => {
        const { result, merges } = runMerge();
        assert.equal(result.status, 0, result.stderr);
        assert.match(merges, /pr merge https:\/\/example\.test\/pull\/1 --merge --match-head-commit head123/);
    });

    it('leaves the PR open when CI fails', () => {
        const { result, merges } = runMerge({ TEST_WATCH_STATE: 'fail' });
        assert.notEqual(result.status, 0);
        assert.equal(merges, '');
    });

    it('requires the pull_request validation itself to pass', () => {
        const { result, merges } = runMerge({ TEST_CI_STATE: 'fail' });
        assert.notEqual(result.status, 0);
        assert.equal(merges, '');
    });

    it('leaves the PR open when dev advances after validation', () => {
        const { result, merges } = runMerge({ TEST_BASE_SHA: 'new-base' });
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /dev cambió/);
        assert.equal(merges, '');
    });
});
