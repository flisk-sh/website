# Positioning: what Flisk is

> Single source of truth for how we describe Flisk. Change it here first, then update the places listed at the bottom.
> Written 2026-11-09. Competitor numbers are GitHub stars on that date.

## In one sentence

**Flisk is the local runtime your AI coding agent can start, check and fix, for any stack.**

## Who it is for

A developer who uses Claude Code, Cursor or Codex on an app with more than one service (a frontend, an API, a database or a worker) and is tired of wiring it up and restarting it by hand.

## The job

Get a multi-service app running on my machine, and keep it running while an agent changes it.

## What they use today

| Instead of | Stars | Where Flisk differs |
|---|---|---|
| Docker Compose with Compose Watch | 38.7k | Compose runs containers and updates them on save. Flisk imports a Compose file and adds an agent surface (MCP tools, skills, `AGENTS.md`). We must say this plainly: Compose Watch already updates on save. |
| Process Compose, Overmind, PM2 | 2.9k, 3.8k, 43.3k | They start processes. Flisk also checks health, routes, and exposes it all to an agent. Overmind has had no push since April 2025. |
| Tilt | 10.1k | Flisk is built on Tilt for the Docker path. Tilt does not give an agent a way to drive it. |
| Encore, Supabase CLI, Aspire | 12.7k, 2.5k, 6.4k | Each runs a whole app locally and is moving toward agents. Each is tied to its own framework or backend. Flisk takes the stack you already have. |
| devenv, Devbox | 7.8k, 12.4k | They set up environments and tools. They do not run and check your services for an agent. |

Cloud development environments (Gitpod, Codespaces, Coder, Daytona, Okteto) are a different buyer and job. We do not argue against them on the homepage.

## Why Flisk

1. **Any stack.** It reads a Compose file or runs plain commands (Node, Python, Go, Bun). No framework to adopt.
2. **An agent surface.** `flisk connect claude|cursor|codex` adds an MCP server, skills and an `AGENTS.md`. The agent can check the machine, start the stack, read health and logs, and stop it.
3. **Free and local.** MIT core, no account, nothing leaves the machine.

## Proof we have

- 2026-11-09, CLI 1.4.45, plain local processes, using only the MCP tools: `doctor` passed, `up` started two services, `status` showed both unhealthy, `logs` named the cause (`DATABASE_URL is not set`), the code was fixed, `down` and `up` restarted the stack, and `status` showed both ready and answering. One run, a two-service app.
- The homepage terminal replays real output (see `/docs/claims/#homepage-terminal`).

## Known gaps. Do not hide these

- `resource_restart` needs Docker and Tilt. In plain-process mode it returns `TILT_NOT_RUNNING`, so an agent has to stop and start the whole stack.
- Plain-process mode has no reload on save. Only the Docker and Tilt path updates containers.
- In plain-process mode `status` still lists Traefik, Postgres and Tilt ports, although `doctor` reports Docker is not used.
- We have not verified an isolated stack per agent or per git worktree. Supabase CLI offers it (public alpha). Do not claim it until it works and is shown.
- There is no evidence yet of outside users beyond the five listed adopters. The 36-star count shows it.

## The test for any claim

If we cannot show it in one 60-second recording, we do not put it in a headline. The next proof to produce is a recording of an agent building a three-service app, Flisk running it, and the agent fixing a failing health check.

## Approved short forms

| Where | Text |
|---|---|
| GitHub description | The local runtime your AI coding agent can start, check and fix. One command runs your multi-service app from a Compose file or plain commands, and an MCP server gives Claude Code, Cursor and Codex its health, logs and controls. MIT, no account. |
| Homepage title | Flisk: your whole app on your laptop, with one command |
| Homepage headline | Your whole app on your laptop, with one command. The AI-agent angle moves to the line below. |
| Homepage subline | Run your whole app on your machine, from a Compose file or plain commands. Your agent reads its health and logs, and fixes what breaks. |
| Footer | your whole app on your laptop, with one command. |
| Agents page headline | Your coding agent can start, check and fix the whole stack. |

## Places to keep in step

`index.html` (title, description, headline, subline), `_config.yml` (tagline, description), `_includes/footer.html`, `agents/index.html` (headline), `llms.txt` and `llms-full.txt` (lead line), and the GitHub repository description and topics of `flisk-sh/flisk`.
