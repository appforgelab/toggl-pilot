import { writeFileSync, statSync } from 'node:fs';
import { getWithToken } from '../api.js';
import { getConfigFile } from '../paths.js';

interface Me {
  fullname: string;
  email: string;
}

export async function auth(args: string[]) {
  const token = args[0];
  if (!token) {
    console.error('Usage: tgt auth <api-token>');
    console.error('Get your token at https://track.toggl.com/profile');
    process.exit(1);
  }

  try {
    const user = await getWithToken<Me>('/me', token);
    const file = getConfigFile();
    writeFileSync(file, `TOGGL_API_TOKEN=${token}\n`, { mode: 0o600 });
    console.log(`Config saved to ${file}`);
    console.log(`Authenticated as ${user.fullname} (${user.email})`);

    try {
      const st = statSync(file);
      const mode = st.mode & 0o777;
      if (process.platform !== 'win32' && mode !== 0o600) {
        console.warn(
          `Warning: config file permissions are ${mode.toString(8)}. Consider running: chmod 600 ${file}`
        );
      }
    } catch {
      // skip permission check
    }
  } catch (e) {
    console.error(`Authentication failed: ${(e as Error).message}`);
    process.exit(1);
  }
}
