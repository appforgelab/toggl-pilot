import "dotenv/config";

export const config = {
  get apiToken() {
    const token = process.env.TOGGL_API_TOKEN;
    if (!token || token === "your_token_here") {
      throw new Error("TOGGL_API_TOKEN not set. Copy .env.example to .env and add your token.");
    }
    return token;
  },
};
