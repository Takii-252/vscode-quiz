from __future__ import annotations

import re

ALIAS_MAP = {
    "cmd": "Meta",
    "command": "Meta",
    "meta": "Meta",
    "win": "Meta",
    "windows": "Meta",
    "⌘": "Meta",
    "ctrl": "Control",
    "control": "Control",
    "ctl": "Control",
    "^": "Control",
    "alt": "Alt",
    "option": "Alt",
    "opt": "Alt",
    "⌥": "Alt",
    "shift": "Shift",
    "⇧": "Shift",
    "enter": "Enter",
    "return": "Enter",
    "esc": "Escape",
    "del": "Delete",
    "space": "Space",
    "spacebar": "Space",
}

MODIFIER_ORDER = {"Meta": 1, "Control": 2, "Alt": 3, "Shift": 4}


def _canonical_token(token: str) -> str:
    cleaned = token.strip()
    if not cleaned:
        return ""
    lower = cleaned.lower()
    if lower in ALIAS_MAP:
        return ALIAS_MAP[lower]
    if re.fullmatch(r"f([1-9]|1[0-2])", lower):
        return lower.upper()
    if len(cleaned) == 1:
        return cleaned.upper()
    return cleaned.capitalize()


def _sort_key(token: str) -> tuple[int, str]:
    if token in MODIFIER_ORDER:
        return (MODIFIER_ORDER[token], token)
    return (100, token)


def normalize_shortcut(value: list[str] | str) -> str:
    if isinstance(value, list):
        raw_tokens = value
    else:
        raw_tokens = re.split(r"[+\s]+", value)

    normalized_tokens = [_canonical_token(token) for token in raw_tokens]
    normalized_tokens = [token for token in normalized_tokens if token]
    deduped = list(dict.fromkeys(normalized_tokens))
    ordered = sorted(deduped, key=_sort_key)
    return "+".join(ordered)


def to_display_shortcut(normalized: str, os_type: str) -> str:
    if not normalized:
        return ""

    tokens = normalized.split("+")
    if os_type == "mac":
        mac_map = {
            "Meta": "⌘",
            "Control": "⌃",
            "Alt": "⌥",
            "Shift": "⇧",
            "Enter": "↩",
            "Escape": "⎋",
            "Delete": "⌫",
            "Space": "Space",
        }
        rendered = [mac_map.get(token, token) for token in tokens]
        return "+".join(rendered)

    win_map = {
        "Meta": "Win",
        "Control": "Ctrl",
        "Alt": "Alt",
        "Shift": "Shift",
    }
    rendered = [win_map.get(token, token) for token in tokens]
    return "+".join(rendered)

