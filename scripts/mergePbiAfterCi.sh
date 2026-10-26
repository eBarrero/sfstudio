#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 3 ]]; then
    echo "Uso: $0 PR_URL BASE_SHA HEAD_SHA" >&2
    exit 2
fi

pr_url="$1"
expected_base_sha="$2"
expected_head_sha="$3"

# GitHub can take a few seconds to register the pull_request workflow.
ci_found=false
for ((attempt = 0; attempt < 60; attempt++)); do
    count="$(gh pr checks "$pr_url" --json name,event,workflow \
        --jq '[.[] | select(.workflow == "CI" and .name == "validate" and .event == "pull_request")] | length' \
        2>/dev/null || true)"
    if [[ "$count" =~ ^[1-9][0-9]*$ ]]; then
        ci_found=true
        break
    fi
    sleep 5
done

if [[ "$ci_found" != true ]]; then
    echo "La CI del Pull Request no apareció en cinco minutos; el PR sigue abierto." >&2
    exit 1
fi

gh pr checks "$pr_url" --watch --fail-fast

ci_bucket="$(gh pr checks "$pr_url" --json name,event,workflow,bucket \
    --jq '[.[] | select(.workflow == "CI" and .name == "validate" and .event == "pull_request")] | if length == 1 then .[0].bucket else "missing" end')"
if [[ "$ci_bucket" != pass ]]; then
    echo "La CI del Pull Request no terminó correctamente; el PR sigue abierto." >&2
    exit 1
fi

pr_base="$(gh pr view "$pr_url" --json baseRefName --jq '.baseRefName')"
if [[ "$pr_base" != dev ]]; then
    echo "El Pull Request ya no apunta a dev; no se fusionó." >&2
    exit 1
fi

current_base_sha="$(git ls-remote origin refs/heads/dev | awk '{print $1}')"
if [[ -z "$current_base_sha" || "$current_base_sha" != "$expected_base_sha" ]]; then
    echo "dev cambió mientras corría la CI; actualiza la rama y vuelve a validar antes de fusionar." >&2
    exit 1
fi

gh pr merge "$pr_url" --merge --match-head-commit "$expected_head_sha"
