# Optional local 3D knowledge view

The AIS-OS globe renderer is bundled prebuilt with its source and licenses. It runs with Node.js 22+ and a browser with WebGL, without npm installation. It is a read-only view of selected local sources; the OS works without launching it.

Choose the workspace, display name and source folders from the user's request and existing routes. Save a private setup JSON outside the distribution, for example:

```json
{"name":"Harbor OS","port":4640,"sources":[
  {"id":"knowledge","label":"Knowledge","paths":["knowledge"],"staleDays":null},
  {"id":"projects","label":"Projects","paths":["projects"],"staleDays":null}
]}
```

Paths are relative to the selected workspace. Only use real selected paths; this example is not permission to scan them. Categories support unique lowercase IDs, labels, optional hex colors and exclusions. Default age flags are disabled. The optional curated Codex-memory adapter requires an explicitly selected memory root and a disclosed cross-project scope; ordinary use reads Markdown/text only. Remote systems require a separately authorized local export.

From the installed kit, with real absolute paths substituted:

```text
node explorer/scaffold.mjs --root /absolute/workspace --config /absolute/setup.json --out .mcc/views/brain
```

The copier refuses an occupied destination. In the created view folder run `node build.mjs`, inspect actual counts/notices, then `node serve.mjs`. Open its printed loopback address. Stop that terminal process with Ctrl+C when finished. Reuse an existing private config to refresh; never overwrite unrelated files or terminate an unrelated server to claim a port.

Search and select a note, read it, follow an explicit connection, filter a category and restore all sources. Inventory shows exact selected counts and unresolved links. Play demo replays real connectivity; Cinema and Pause motion control presentation. Check desktop/narrow views and reduced motion when assessing compatibility. The sphere, central orb and replay come from the reference; language and source interpretation follow this OS. Short or isolated notes can still be useful, and no visible flag authorizes merging or deletion.

The view skips hidden subdirectories, symlinks, archives and dependency/generated folders; navigation notes are inventoried separately. It supports simple scalar frontmatter, Markdown links and wikilinks, with title mentions labeled separately. Unsupported or out-of-scope targets remain unverified. It does not prove complete Obsidian parsing or a live account connection. Keep generated config/data/logs outside the public repository. [Source notices](../THIRD-PARTY-NOTICES.md) identify the pinned reference and bundled dependency licenses.
