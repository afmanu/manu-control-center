"""Focused checks for copying, preservation and generated skill resources."""

from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / "kit/scripts/install.py"


class KitCopyChecks(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="mcc-copy-")
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name).resolve()
        self.workspace = self.base / "Personal workspace"

    def run_helper(self, apply=False, helper=HELPER):
        return subprocess.run([sys.executable, str(helper), str(self.workspace)] +
                              (["--apply"] if apply else []),
                              text=True, capture_output=True)

    def install(self):
        result = self.run_helper(True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def snapshot(self):
        return {p.relative_to(self.workspace): p.read_bytes()
                for p in self.workspace.rglob("*") if p.is_file()}

    def test_preview_does_not_create_workspace(self):
        result = self.run_helper()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(self.workspace.exists())

    def test_adoption_and_repeat_preserve_personal_files(self):
        self.workspace.mkdir()
        (self.workspace / "AGENTS.md").write_text("# Custom rules\nKeep original metadata.\n")
        (self.workspace / "personal.md").write_text("Original note\n")
        self.install()
        self.assertEqual((self.workspace / "AGENTS.md").read_text(),
                         "# Custom rules\nKeep original metadata.\n")
        (self.workspace / ".mcc/workspace.md").write_text("# Customized routes\n")
        before = self.snapshot()
        self.install()
        self.assertEqual(before, self.snapshot())
        # The installed helper is also usable without the distribution checkout.
        result = self.run_helper(True, self.workspace / ".mcc/kit/scripts/install.py")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(before, self.snapshot())

    def test_managed_conflict_stops_before_any_copy(self):
        target = self.workspace / ".agents/skills/mcc-project/SKILL.md"
        target.parent.mkdir(parents=True)
        target.write_text("My customized procedure\n")
        before = self.snapshot()
        result = self.run_helper(True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Customized or different kit file", result.stderr)
        self.assertEqual(before, self.snapshot())

    def test_symlink_cannot_redirect_writes(self):
        outside = self.base / "outside"
        outside.mkdir()
        self.workspace.mkdir()
        (self.workspace / ".mcc").symlink_to(outside, target_is_directory=True)
        result = self.run_helper(True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(list(outside.iterdir()), [])
        self.assertFalse((self.workspace / ".agents").exists())

    def test_partial_copy_can_resume(self):
        self.install()
        missing = self.workspace / ".agents/skills/mcc-context/SKILL.md"
        original = missing.read_bytes()
        missing.unlink()
        (self.workspace / ".mcc/context.md").write_text("Keep this context\n")
        self.install()
        self.assertEqual(missing.read_bytes(), original)
        self.assertEqual((self.workspace / ".mcc/context.md").read_text(), "Keep this context\n")

    def test_generated_skills_resolve_canonical_resources(self):
        self.install()
        skills = sorted((self.workspace / ".agents/skills").glob("*/SKILL.md"))
        self.assertEqual(len(skills), 4)
        for skill in skills:
            canonical = ROOT / "kit/skills" / skill.parent.name / "SKILL.md"
            expected = canonical.read_text().replace("(../../", "(../../../.mcc/kit/")
            self.assertEqual(skill.read_text(), expected)
            for route in re.findall(r"\]\(([^)]+)\)", skill.read_text()):
                self.assertTrue((skill.parent / route).resolve().is_file(), route)

    def test_distribution_is_not_a_personal_destination(self):
        result = subprocess.run([sys.executable, str(HELPER), str(ROOT), "--apply"],
                                capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("outside the distribution", result.stderr)


if __name__ == "__main__":
    unittest.main()
