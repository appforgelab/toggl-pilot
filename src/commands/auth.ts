import { getWithToken } from '../api.js';
import { setConfigVar } from '../config.js';

interface Me {
  fullname: string;
  email: string;
}

export async function auth(args: string[]) {
  const token = args[0];
  if (!token) {
    console.error('Usage: tgp auth <api-token>');
    console.error('Get your token at https://track.toggl.com/profile');
    process.exit(1);
  }

  try {
    const user = await getWithToken<Me>('/me', token);
    const file = setConfigVar('TOGGL_API_TOKEN', token);
    console.log(`Config saved to ${file}`);
    console.log(`Authenticated as ${user.fullname} (${user.email})`);
  } catch (e) {
    console.error(`Authentication failed: ${(e as Error).message}`);
    process.exit(1);
  }
}
