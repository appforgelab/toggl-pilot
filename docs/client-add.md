# `client-add` — Create a Client

Creates a new client in your workspace.

## Usage

```bash
tgp client-add "Client Name" [--notes "Some notes"]
```

## Output

```text
Created: Acme Corp (id: 123456789)
```

## Arguments

| Argument        | Description             |
| --------------- | ----------------------- |
| `"Client Name"` | Name for the new client |

## Flags

| Flag             | Description                   |
| ---------------- | ----------------------------- |
| `--notes <text>` | Optional notes for the client |

## Examples

```bash
tgp client-add "Acme Corp"
tgp client-add "Acme Corp" --notes "Primary billing contact"
```
