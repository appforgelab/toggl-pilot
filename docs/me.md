# `me` — Auth Check

Verifies your API token and shows your Toggl user info.

```bash
tgp me
```

**Output:**

```text
Authenticated as: Your Name (you@example.com)
Default workspace: 12345678
```

**Errors:**

- `TOGGL_API_TOKEN not set` — copy `.env.example` to `.env` and add your token
- `Toggl API 403` — token is invalid or revoked
