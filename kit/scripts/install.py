#!/usr/bin/env python3
"""Preview or copy the file-based AI OS kit. Python 3.9+, standard library only."""

import argparse
from pathlib import Path
import sys


KIT = Path(__file__).resolve().parents[1]
SKILLS = ("mcc-setup", "mcc-context", "mcc-capture", "mcc-project")


def check_path(path):
    """Reject symlinks and non-directory parents before any writes."""
    for parent in (path, *path.parents):
        if parent.is_symlink():
            raise ValueError(f"Symlink route is not supported: {parent}")
        if parent != path and parent.exists() and not parent.is_dir():
            raise ValueError(f"Parent is not a directory: {parent}")


def plan(workspace):
    if not workspace.is_absolute() or ".." in workspace.parts:
        raise ValueError("Use an absolute workspace path without '..'.")
    check_path(workspace)
    if workspace.exists() and not workspace.is_dir():
        raise ValueError(f"Workspace is not a directory: {workspace}")
    distribution = KIT if KIT.parent.name == ".mcc" else KIT.parent
    if workspace == distribution or distribution in workspace.parents:
        raise ValueError("Choose a personal workspace outside the distribution.")

    files = []
    for source in sorted(KIT.rglob("*")):
        if "__pycache__" in source.parts or source.suffix == ".pyc":
            continue
        if source.is_symlink():
            raise ValueError(f"Unexpected symlink in kit: {source}")
        if source.is_file():
            files.append((workspace / ".mcc/kit" / source.relative_to(KIT),
                          source.read_bytes(), False))
    for name in SKILLS:
        source = KIT / "skills" / name / "SKILL.md"
        content = source.read_text(encoding="utf-8").replace(
            "(../../", "(../../../.mcc/kit/")
        files.append((workspace / ".agents/skills" / name / "SKILL.md",
                      content.encode("utf-8"), False))
    for name in ("workspace", "context", "connections"):
        files.append((workspace / ".mcc" / f"{name}.md",
                      (KIT / "templates" / f"{name}.md").read_bytes(), True))
    files.append((workspace / "AGENTS.md",
                  (KIT / "hosts/codex.md.in").read_bytes(), True))

    actions = []
    for destination, content, editable in files:
        check_path(destination)
        if destination.exists():
            if not destination.is_file():
                raise ValueError(f"Expected a file: {destination}")
            if editable or destination.read_bytes() == content:
                actions.append(("preserve", destination, content))
            else:
                raise ValueError(f"Customized or different kit file: {destination}. "
                                 "Preserved; review the difference before retrying.")
        else:
            actions.append(("create", destination, content))
    return actions


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workspace", type=Path)
    parser.add_argument("--apply", action="store_true", help="Copy missing files; default is preview only")
    args = parser.parse_args()
    try:
        actions = plan(args.workspace)
        if args.apply:
            for action, destination, content in actions:
                if action == "create":
                    check_path(destination)
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    # Exclusive creation preserves a file created since the preview.
                    with destination.open("xb") as output:
                        output.write(content)
        label = "Applied" if args.apply else "Preview only"
        for action, destination, _ in actions:
            print(f"{action}: {destination.relative_to(args.workspace)}")
        print(f"{label}: {args.workspace}")
        print("Next: follow mcc-setup to personalize the route map, check the "
              "AGENTS.md route, and perform the first task. Copying is not onboarding.")
        return 0
    except (OSError, ValueError) as error:
        print(f"Setup stopped: {error}", file=sys.stderr)
        print("Existing files were not replaced. If copying had begun, inspect "
              "the partial workspace, correct the specific cause and rerun.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
