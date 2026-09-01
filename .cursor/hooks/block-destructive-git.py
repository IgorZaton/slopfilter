#!/usr/bin/env python3
"""Ask before destructive git commands. Reads Cursor-style JSON from stdin."""
import json
import re
import sys

DANGEROUS = re.compile(
    r"""(?xi)
    \bgit\s+(
        push\s+.*--force|
        push\s+-f\b|
        reset\s+--hard|
        clean\s+-[a-zA-Z]*f|
        branch\s+-[dD]\s|
        checkout\s+--\s|
        restore\s+--source|
        filter-branch|
        rebase\s+.*--force
    )
    """
)

payload = json.load(sys.stdin)
command = payload.get("command") or payload.get("tool_input", {}).get("command") or ""

if DANGEROUS.search(command or ""):
    print(json.dumps({
        "permission": "ask",
        "user_message": "Destructive git command detected. Review before allowing.",
        "agent_message": "Hook blocked automatic execution of a potentially destructive git command. Wait for user approval.",
    }))
else:
    print(json.dumps({"permission": "allow"}))
