#!/usr/bin/env python3
"""Read-only local skill/resource diagnostics; actual host use is a separate check."""
import argparse
import json
from pathlib import Path
import re
import sys

# Diagnostics must not create __pycache__ in the inspected installation.
sys.dont_write_bytecode = True
from urllib.parse import unquote, urlsplit


def prose(text):
    fence = None
    for line in text.splitlines():
        match = re.match(r'^\s{0,3}(`{3,}|~{3,})(.*)$', line)
        if match:
            marker, suffix = match.groups()
            if fence is None:
                fence = marker
            elif marker[0] == fence[0] and len(marker) >= len(fence) and not suffix.strip():
                fence = None
        elif fence is None:
            yield line


def check(workspace, host, scope=None, extra_roots=()):
    from install import SKILLS
    kit = workspace / '.mcc/kit'
    hosts = ('codex', 'claude') if host == 'both' else (host,)
    errors, definitions, entries, instructions = [], [], [], []
    roots = [(h, workspace / ('.agents' if h == 'codex' else '.claude') / 'skills') for h in hosts]
    roots += [('extra', Path(p)) for p in extra_roots]
    # Each host has its own discovery namespace; generated entries across hosts are intentional.
    identities = {}
    for selected, root in roots:
        if not root.is_dir():
            errors.append(f'Missing skill directory: {root}')
            continue
        for directory in sorted(root.iterdir()):
            skill = directory / 'SKILL.md'
            if not skill.is_file():
                if directory.is_symlink():
                    errors.append(f'Unresolved skill symlink: {directory}')
                continue
            text = skill.read_text(encoding='utf-8')
            header = re.match(r'^---\s*\n(.*?)\n---(?:\s*\n|$)', text, re.S)
            name = re.search(r'^name:\s*[\'"]?([a-z0-9-]+)[\'"]?\s*$', header[1], re.M) if header else None
            if not name:
                errors.append(f'Missing or unsupported skill name: {skill}')
                continue
            name = name[1]
            entries.append({'host': selected, 'name': name, 'entry': str(skill), 'canonical': str(skill.resolve())})
            for namespace in hosts if selected == 'extra' else (selected,):
                identities.setdefault((namespace, name), set()).add(str(skill.resolve()))
            definitions.append(skill)
        if selected != 'extra':
            for name in SKILLS:
                canonical, entry = kit / 'skills' / name / 'SKILL.md', root / name / 'SKILL.md'
                if not canonical.is_file() or not entry.is_file():
                    errors.append(f'Missing core definition/entry: {selected}/{name}')
                    continue
                expected = canonical.read_text().replace('(../../', '(../../../.mcc/kit/')
                if selected == 'claude':
                    expected = expected.replace('.agents/skills/', '.claude/skills/')
                if entry.read_text() != expected:
                    errors.append(f'Core entry differs; inspect intentional adaptation or customization: {entry}')
    for (namespace, name), paths in identities.items():
        if len(paths) > 1:
            errors.append(f'Ambiguous identity {namespace}/{name}: ' + ', '.join(sorted(paths)))
    if not kit.is_dir():
        errors.append(f'Missing installed kit: {kit}')
    resources = list(kit.rglob('*.md')) + definitions
    for file in resources:
        for line in prose(file.read_text(encoding='utf-8')):
            for target in re.findall(r'\[[^\]\n]+\]\((<[^>]+>|[^)\s]+)\)', line):
                parts = urlsplit(target.strip('<>'))
                if parts.scheme or parts.netloc or not parts.path:
                    continue
                destination = (file.parent / unquote(parts.path)).resolve()
                if not destination.exists():
                    errors.append(f'Missing resource: {file} -> {target}')
    target = (workspace / (scope or '.')).resolve()
    if not target.is_relative_to(workspace.resolve()):
        errors.append('Scope must remain inside the selected workspace.')
    else:
        folders = [workspace.resolve()]
        for part in target.relative_to(workspace.resolve()).parts:
            folders.append(folders[-1] / part)
        for folder in folders:
            for name in ('AGENTS.md', 'AGENTS.override.md', 'CLAUDE.md', 'CLAUDE.local.md'):
                if (folder / name).is_file():
                    instructions.append(str(folder / name))
    return {'scope': str(target), 'entries': entries, 'instruction_candidates': instructions,
            'errors': errors, 'limit': 'Local files only. Host precedence, managed/global/plugin instructions and useful execution require actual host inspection.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workspace', type=Path)
    parser.add_argument('--host', choices=('codex', 'claude', 'both'), default='codex')
    parser.add_argument('--scope')
    parser.add_argument('--skill-root', action='append', type=Path, default=[])
    args = parser.parse_args()
    try:
        result = check(args.workspace.resolve(), args.host, args.scope, args.skill_root)
        print(json.dumps(result, indent=2))
        return bool(result['errors'])
    except (OSError, ValueError) as error:
        print(f'Inspection failed: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
