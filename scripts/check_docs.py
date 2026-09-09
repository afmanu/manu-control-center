#!/usr/bin/env python3
"""Check the kit's Markdown links and fences using the Python standard library."""

from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
LINK = re.compile(r"\[[^\]\n]+\]\((<[^>]+>|[^)\s]+)(?:\s+\"[^\"]*\")?\)")
FENCE = re.compile(r"^\s{0,3}(`{3,}|~{3,})(.*)$")


def prose(text):
    """Keep line numbers while excluding fenced examples from link checks."""
    fence = None
    for number, line in enumerate(text.splitlines(), 1):
        match = FENCE.match(line)
        if match:
            marker, suffix = match.groups()
            if fence is None:
                fence = marker
            elif marker[0] == fence[0] and len(marker) >= len(fence) and not suffix.strip():
                fence = None
            yield number, ""
        else:
            yield number, line if fence is None else ""
    if fence:
        raise ValueError("Unclosed code fence")


def anchors(text):
    seen = {}
    result = set()
    for _, line in prose(text):
        heading = re.match(r"^#{1,6}\s+(.+?)\s*#*\s*$", line)
        if not heading:
            continue
        title = heading[1].lower()
        slug = re.sub(r"[^\w\s-]", "", title).replace(" ", "-")
        count = seen.get(slug, 0)
        seen[slug] = count + 1
        result.add(f"{slug}-{count}" if count else slug)
    return result


def check(root):
    files = sorted(root.glob("*.md"))
    for name in ("docs", "references", "kit"):
        if (root / name).exists():
            files.extend(sorted((root / name).rglob("*.md")))
    errors = []
    links = 0
    for path in files:
        try:
            for number, line in prose(path.read_text()):
                for match in LINK.finditer(line):
                    target = match[1].strip("<>")
                    parts = urlsplit(target)
                    if parts.scheme or parts.netloc:
                        continue
                    destination = (path.parent / unquote(parts.path)).resolve() if parts.path else path
                    if not destination.is_relative_to(root):
                        errors.append(f"{path.relative_to(root)}:{number}: non-portable local link: {target}")
                    elif not destination.exists():
                        errors.append(f"{path.relative_to(root)}:{number}: missing target: {target}")
                    elif parts.fragment and destination.suffix == ".md":
                        if unquote(parts.fragment) not in anchors(destination.read_text()):
                            errors.append(f"{path.relative_to(root)}:{number}: missing heading: {target}")
                    links += 1
        except ValueError as error:
            errors.append(f"{path.relative_to(root)}: {error}")
    return files, links, errors


if __name__ == "__main__":
    files, links, errors = check(ROOT)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)
    print(f"Documentation checks passed: {len(files)} Markdown files, {links} local links.")
