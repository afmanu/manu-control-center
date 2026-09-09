#!/usr/bin/env python3
"""Focused checks for the optional local view; Node 22+ required."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

REPO = Path(__file__).resolve().parents[1]
SCAFFOLD = REPO / 'kit/explorer/scaffold.mjs'


class ExplorerTests(unittest.TestCase):
    def test_selected_graph_and_source_preservation(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder).resolve()
            notes = root / 'notes'
            notes.mkdir()
            fixtures = {'a.md': '# Alpha\n\n[Evidence](b.md) and [[Missing]].\n',
                        'b.md': '# Beta\n\nConfirmed synthetic evidence.\n',
                        'index.md': '# Index\n\n[Start](a.md)\n',
                        '.hidden.md': '# Hidden\n'}
            for name, content in fixtures.items():
                (notes / name).write_text(content)
            before = {name: hashlib.sha256((notes / name).read_bytes()).hexdigest() for name in fixtures}
            (root / 'outside.md').write_text('# Outside selected sources\n')
            config = root / 'setup.json'
            config.write_text(json.dumps({'name': 'Synthetic OS', 'sources': [{'id': 'notes', 'label': 'Notes', 'paths': ['notes']}]}))
            command = ['node', str(SCAFFOLD), '--root', str(root), '--config', str(config)]
            subprocess.run(command, check=True, capture_output=True)
            app = root / '.mcc/views/brain'
            subprocess.run(['node', 'build.mjs'], cwd=app, check=True, capture_output=True)
            graph = json.loads((app / 'data/graph.json').read_text())
            self.assertEqual({node['title'] for node in graph['nodes']}, {'Alpha', 'Beta'})
            self.assertEqual(len(graph['links']), 1)
            self.assertEqual(len(graph['inventory']['navigation']), 1)
            alpha = next(node for node in graph['nodes'] if node['title'] == 'Alpha')
            self.assertIn('Missing', str(alpha['broken']))
            self.assertTrue(all('stale' not in node['flags'] for node in graph['nodes']))
            self.assertEqual(before, {name: hashlib.sha256((notes / name).read_bytes()).hexdigest() for name in fixtures})
            self.assertNotEqual(subprocess.run(command, capture_output=True).returncode, 0)
            self.assertTrue((app / 'dist/app.js').is_file())
            self.assertTrue((app / 'AIS-OS-LICENSE.txt').is_file())

    def test_symlink_output_rejected_without_external_writes(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder).resolve()
            outside = root / 'outside'
            outside.mkdir()
            workspace = root / 'workspace'
            workspace.mkdir()
            (workspace / '.mcc').symlink_to(outside, target_is_directory=True)
            config = root / 'config.json'
            config.write_text(json.dumps({'name': 'Synthetic OS', 'sources': [{'id': 'notes', 'paths': ['notes']}]}))
            result = subprocess.run(['node', str(SCAFFOLD), '--root', str(workspace), '--config', str(config)], capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn(b'Symlink output route', result.stderr)
            self.assertEqual(list(outside.iterdir()), [])


if __name__ == '__main__':
    unittest.main()
