#!/usr/bin/env bash
# Intencionalmente sem followup_message: a regra alwaysApply
# (.cursor/rules/auto-ship-on-finish.mdc) já manda perguntar ao usuário.
# Um followup aqui gerava loop (dirty tree → pergunta → stop → followup…).
set -euo pipefail
cat >/dev/null
echo '{}'
exit 0
