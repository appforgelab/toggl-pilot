import { get } from "./api.js";
import { entries } from "./commands/entries.js";

interface Me {
  id: number;
  email: string;
  fullname: string;
  default_workspace_id: number;
}

async function me() {
  const user = await get<Me>("/me");
  console.log(`Authenticated as: ${user.fullname} (${user.email})`);
  console.log(`Default workspace: ${user.default_workspace_id}`);
}

const command = process.argv[2];
const args = process.argv.slice(2);

switch (command) {
  case "me":
    me();
    break;
  case "entries":
    entries(args);
    break;
  default:
    console.log("Usage: tsx src/index.ts <command>");
    console.log("Commands: me, entries [-d DATE]");
}
