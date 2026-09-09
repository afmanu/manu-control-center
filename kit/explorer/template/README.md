# Local knowledge explorer

This optional view reads only the sources in your private `brain.config.json`.
Run `node build.mjs` to inspect counts and notices, then `node serve.mjs` to open the loopback viewer. Node.js 22+ is required; the renderer is prebuilt and needs no npm installation to run. Stop the server with Ctrl+C in its terminal. Use `node serve.mjs --port 4641` when your chosen port is occupied; never stop another service.

Use Search, Sources, Inventory, Read note, Play demo, Cinema and Pause motion. The globe shows selected notes; the replay represents connectivity, not historical chronology. Missing targets may be outside the selected sources. Inspection hints do not establish knowledge quality or unread status. Sources remain unchanged.

To rebuild the renderer after editing `src/`, use the locked optional development dependencies with `npm ci` and `npm run build:js`. The AI OS itself does not need them. Retain `THIRD-PARTY-NOTICES.txt` and `AIS-OS-LICENSE.txt`. Keep config, generated `data/`, logs and source content private. This view is not a deployment target.
