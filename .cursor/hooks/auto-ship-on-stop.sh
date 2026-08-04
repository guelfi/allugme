#!/usr/bin/env bash
# Se houver mudanças locais ao finalizar o agente, solicita follow-up do fluxo auto-ship.
set -euo pipefail
cat >/dev/null

root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${root}" ]]; then
  echo '{}'
  exit 0
fi

cd "$root"

if [[ -n "$(git status --porcelain 2>/dev/null || true)" ]]; then
  cat <<'EOF'
{
  "followup_message": "Há mudanças locais não publicadas. Execute agora o fluxo auto-ship (regra auto-ship-on-finish): atualizar main, criar branch cursor/*, commit, push, abrir PR, aguardar CI, mergear (se autoaprovação for bloqueada pelo GitHub, siga após CI verde), git pull em main, acompanhar CD Deploy to OCI, e reportar URLs. Não peça confirmação."
}
EOF
  exit 0
fi

echo '{}'
exit 0
