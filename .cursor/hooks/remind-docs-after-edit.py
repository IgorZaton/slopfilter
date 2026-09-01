#!/usr/bin/env python3
"""After file edits, remind about docs sync when non-doc code changed."""
import json
import sys
from pathlib import Path

payload = json.load(sys.stdin)
# Cursor afterFileEdit typically includes file_path / path
path = (
    payload.get("file_path")
    or payload.get("path")
    or payload.get("file")
    or ""
)
p = Path(str(path))
suffix = p.suffix.lower()
name = p.name.lower()

doc_like = suffix in {".md", ".mdx", ".rst", ".txt", ".adoc"} or name in {
    "readme", "changelog", "license"
}
# Ignore rule/skill/hook self-edits
ignore = any(part in {".cursor", ".github", ".claude", ".windsurf", ".continue", ".codex"} for part in p.parts)

if path and not doc_like and not ignore:
    print(json.dumps({
        "additional_context": (
            "Docs sync check: if this edit changed user-facing behavior, setup, "
            "commands, configuration, defaults, or workflows, update README/docs "
            "in the same change (or explicitly state why docs are unaffected)."
        )
    }))
else:
    print(json.dumps({}))
