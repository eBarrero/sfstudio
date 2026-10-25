#!/usr/bin/env bash

set -euo pipefail

pbi_name="${1:-}"

if [[ ! "$pbi_name" =~ ^PBI-[0-9]{3}$ ]]; then
    echo "Uso: $0 PBI-NNN"
    echo "Ejemplo: $0 PBI-005"
    exit 1
fi

if ! repository_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Error: no estás dentro de un repositorio Git."
    exit 1
fi

cd "$repository_root"

if [[ -n "$(git status --porcelain)" ]]; then
    echo "Error: el repositorio contiene cambios sin guardar:"
    git status --short
    exit 1
fi

feature_branch="feature/$pbi_name"

echo "Actualizando referencias remotas..."
git fetch --prune origin

if git show-ref --verify --quiet "refs/heads/$feature_branch"; then
    echo "Error: la rama local '$feature_branch' ya existe."
    echo "Para continuar en ella: git switch '$feature_branch'"
    exit 1
fi

if git show-ref --verify --quiet "refs/remotes/origin/$feature_branch"; then
    echo "Error: la rama remota 'origin/$feature_branch' ya existe."
    echo "Para recuperarla: git switch --track 'origin/$feature_branch'"
    exit 1
fi

echo "Actualizando dev..."
git switch dev
git merge --ff-only origin/dev

if [[ "$(git rev-parse dev)" != "$(git rev-parse origin/dev)" ]]; then
    echo "Error: dev contiene commits locales que no están en origin/dev."
    echo "Revisa el estado antes de crear la rama."
    exit 1
fi

echo "Creando $feature_branch..."
git switch -c "$feature_branch"

echo
echo "Rama preparada correctamente:"
git status --short --branch