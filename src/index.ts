import { get } from "./api.js";

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

switch (command) {
  case "me":
    me();
    break;
  default:
    console.log("Usage: tsx src/index.ts <command>");
    console.log("Commands: me");
}
