#!/usr/bin/env python3
"""Idempotent: ensure Allugme API/front locations exist in nginx.conf."""

from __future__ import annotations

import re
import sys
from pathlib import Path

MARKER_BEGIN = "# BEGIN ALLUGME (managed by Allugme CD)"
MARKER_END = "# END ALLUGME (managed by Allugme CD)"

MANAGED_BLOCK_RE = re.compile(
    re.escape(MARKER_BEGIN) + r".*?" + re.escape(MARKER_END) + r"\n?",
    re.DOTALL,
)

LEGACY_LOCATION_RE = re.compile(
    r"(?ms)^[ \t]*#\s*Alugue\.me[^\n]*\n|"
    r"^[ \t]*location\s*(?:=\s*)?(?:\^~\s*)?/allugme(?:/swagger|/api|/t)?/?\s*\{.*?\n[ \t]*\}\n"
)


def load_fragment(path: Path) -> str:
    lines = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("# Fragmento") or line.startswith("# Paths"):
            continue
        lines.append(line)
    fragment = "\n".join(lines).rstrip() + "\n"
    return f"    {MARKER_BEGIN}\n{fragment}    {MARKER_END}\n"


def strip_allugme_blocks(text: str) -> str:
    text = MANAGED_BLOCK_RE.sub("", text)
    prev = None
    while prev != text:
        prev = text
        text = LEGACY_LOCATION_RE.sub("", text)
    return text


def insert_before(text: str, block: str, pattern: str) -> tuple[str, bool]:
    m = re.search(pattern, text, flags=re.MULTILINE)
    if not m:
        return text, False
    idx = m.start()
    return text[:idx] + block + "\n" + text[idx:], True


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: apply-nginx-allugme.py <nginx.conf> <fragment.conf>", file=sys.stderr)
        return 2

    nginx_path = Path(sys.argv[1])
    fragment_path = Path(sys.argv[2])
    original = nginx_path.read_text(encoding="utf-8")
    block = load_fragment(fragment_path)

    updated = strip_allugme_blocks(original)

    updated, ok_ip = insert_before(updated, block, r"^[ \t]*location\s+/driverhub/\s*\{")
    if not ok_ip:
        updated, ok_ip = insert_before(updated, block, r"^[ \t]*location\s+/hako/\s*\{")
    if not ok_ip:
        updated, ok_ip = insert_before(updated, block, r"^[ \t]*location\s+/unisystem/\s*\{")

    ssl_server = re.search(
        r"(?ms)server\s*\{\s*listen\s+443\s+ssl;.*?server_name\s+batuara\.org\.br.*?(?=^\s*server\s*\{|\Z)",
        updated,
    )
    if ssl_server:
        server_text = ssl_server.group(0)
        if MARKER_BEGIN not in server_text:
            patched_server, ok_ssl = insert_before(
                server_text,
                block,
                r"^[ \t]*location\s+/\s*\{",
            )
            if ok_ssl:
                updated = updated[: ssl_server.start()] + patched_server + updated[ssl_server.end() :]

    if updated == original:
        print("nginx.conf already up to date for Allugme")
        return 0

    backup = nginx_path.with_suffix(nginx_path.suffix + ".bak-allugme")
    backup.write_text(original, encoding="utf-8")
    nginx_path.write_text(updated, encoding="utf-8")
    print(f"Updated {nginx_path} (backup: {backup})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
