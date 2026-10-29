#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
    echo "Uso: $0 PBI-NNN \"Mensaje de commit\" [\"Cuerpo del PR\"]"
    echo
    echo "Ejemplo:"
    echo "$0 PBI-005 \"feat(PBI-005): usa rutas relativas para la API\""
    exit 1
fi

pbi_name="$1"
commit_message="$2"
pr_body="${3:-}"

if [[ ! "$pbi_name" =~ ^PBI-[0-9]{3}$ ]]; then
    echo "Error: el identificador debe tener el formato PBI-NNN."
    exit 1
fi

if [[ -z "$commit_message" ]]; then
    echo "Error: el mensaje del commit no puede estar vacío."
    exit 1
fi

for command_name in git gh npm; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "Error: no se encuentra el comando '$command_name'."
        exit 1
    fi
done

if ! repository_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Error: no estás dentro de un repositorio Git."
    exit 1
fi

cd "$repository_root"

expected_branch="feature/$pbi_name"
current_branch="$(git branch --show-current)"

if [[ "$current_branch" != "$expected_branch" ]]; then
    echo "Error: estás en la rama '$current_branch'."
    echo "La PBI debe terminarse desde '$expected_branch'."
    exit 1
fi

if [[ -z "$(git status --porcelain)" ]]; then
    echo "Error: no hay cambios para incluir en el commit."
    exit 1
fi

echo "Cambios que se incluirán:"
git status --short
echo

read -r -p "¿Quieres validar, publicar y fusionar la PBI en dev tras pasar CI? [s/N] " confirmation

if [[ ! "$confirmation" =~ ^[sS]$ ]]; then
    echo "Operación cancelada."
    exit 0
fi

echo
echo "Comprobando autenticación de GitHub..."
gh auth status

echo
echo "Actualizando referencias remotas..."
git fetch --prune origin

if ! git show-ref --verify --quiet refs/remotes/origin/dev; then
    echo "Error: no existe la referencia origin/dev."
    exit 1
fi

if ! git merge-base --is-ancestor origin/dev HEAD; then
    echo "Error: la rama no contiene la versión actual de origin/dev."
    echo "Actualiza la feature desde dev y vuelve a ejecutar el script."
    exit 1
fi

base_sha="$(git rev-parse origin/dev)"

echo
echo "Ejecutando validaciones..."
npm run typecheck
npm run lint
npm test
npm run build
npm run audit

echo
echo "Preparando el commit..."
git add --all
git diff --cached --check

if git diff --cached --quiet; then
    echo "Error: no hay cambios preparados para el commit."
    exit 1
fi

git commit -m "$commit_message"
head_sha="$(git rev-parse HEAD)"

echo
echo "Publicando $expected_branch..."
git push -u origin "$expected_branch"

if [[ -z "$pr_body" ]]; then
    pr_body="Implementa $pbi_name. Validación local superada: typecheck, lint, tests, build y audit."
fi

existing_pr="$(
    gh pr list \
        --base dev \
        --head "$expected_branch" \
        --state open \
        --json url \
        --jq '.[0].url // empty'
)"

if [[ -n "$existing_pr" ]]; then
    echo
    echo "Ya existe un Pull Request abierto:"
    echo "$existing_pr"
    pr_url="$existing_pr"
else
    echo
    echo "Creando Pull Request hacia dev..."

    pr_url="$(
        gh pr create \
            --base dev \
            --head "$expected_branch" \
            --title "$commit_message" \
            --body "$pr_body"
    )"
fi

echo
echo "Esperando la CI del Pull Request antes de fusionar..."
bash "$repository_root/scripts/mergePbiAfterCi.sh" "$pr_url" "$base_sha" "$head_sha"

echo
echo "PBI terminada correctamente."
echo "Commit: $(git rev-parse --short HEAD)"
echo "Pull Request fusionado en dev: $pr_url"
