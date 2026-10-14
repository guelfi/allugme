#!/usr/bin/env bash
# Shared proxy updates use the same lock as the OCI domain deployment helper.
set -Eeuo pipefail
live=/var/www/nginx/nginx.conf
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec 9>/tmp/nginx-domains-deploy.lock
flock -n 9 || { echo 'Another shared Nginx deployment is running' >&2; exit 1; }
work="$(mktemp -d /tmp/allugme-nginx.XXXXXXXX)"
trap 'rm -rf "$work"' EXIT
sudo -n cat "$live" > "$work/snapshot.conf"
expected="$(sha256sum "$work/snapshot.conf" | cut -d ' ' -f 1)"
python3 "$script_dir/apply-nginx-allugme.py" "$work/snapshot.conf" \
  "$script_dir/nginx-allugme.locations.conf" "$script_dir/nginx-allugme.domain.conf" \
  --output "$work/candidate.conf"
sudo -n docker cp "$work/candidate.conf" nginx-proxy:/tmp/allugme-nginx-candidate.conf
sudo -n docker exec nginx-proxy nginx -t -c /tmp/allugme-nginx-candidate.conf
actual="$(sudo -n sha256sum "$live" | cut -d ' ' -f 1)"
[[ "$actual" == "$expected" ]] || { echo 'Live Nginx changed since snapshot; refusing stale candidate' >&2; exit 1; }
backup="${live}.before-allugme-$(date -u +%Y%m%dT%H%M%SZ)-$$"
sudo -n cp -p "$live" "$backup"
rollback() {
  local status=$?
  trap - ERR
  echo "Nginx update failed; restoring $backup" >&2
  sudo -n tee "$live" < "$backup" >/dev/null
  sudo -n docker exec nginx-proxy nginx -t
  sudo -n docker exec nginx-proxy nginx -s reload
  exit "$status"
}
trap rollback ERR
# In-place write preserves the inode of the proxy's single-file bind mount.
sudo -n tee "$live" < "$work/candidate.conf" >/dev/null
sudo -n docker exec nginx-proxy nginx -t
sudo -n docker exec nginx-proxy nginx -s reload
trap - ERR
printf 'Allugme Nginx applied; rollback source: %s\n' "$backup"
