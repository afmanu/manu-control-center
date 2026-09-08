import { homedir } from 'node:os';
import { isAbsolute, join, normalize } from 'node:path';

/** Resolves configuration only; this does not create an instance or a directory. */
export function resolveDataDirectory(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  home: string = homedir(),
): string {
  const override = env['MANU_CONTROL_CENTER_DATA_DIR'];
  if (override !== undefined) {
    if (!override.trim() || !isAbsolute(override)) {
      throw new Error('MANU_CONTROL_CENTER_DATA_DIR must be an absolute path.');
    }
    return normalize(override);
  }
  if (platform === 'darwin') return join(home, 'Library', 'Application Support', 'manu-control-center');
  if (platform === 'win32') return join(env['LOCALAPPDATA'] || join(home, 'AppData', 'Local'), 'manu-control-center');
  const xdg = env['XDG_DATA_HOME'];
  return join(xdg && isAbsolute(xdg) ? xdg : join(home, '.local', 'share'), 'manu-control-center');
}
