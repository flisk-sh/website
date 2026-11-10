// Sample data for the FliskOS demo. Captured from FliskOS 0.2.0 and Flisk CLI 1.4.45 on 2026-11-09 against two small local projects,
// then edited: paths and the user name are replaced, each project shows as running with its own platform ports, and the agent
// thread is shortened. See /docs/claims/#console. Regenerate by hand; scripts/sync-console.mjs does not touch this file.
window.FLISK_SAMPLE = {
 "projects": [
  {
   "id": "project-8c64250758",
   "name": "menu-app",
   "path": "~/code/menu-app",
   "tiltRunning": true,
   "resources": [
    {
     "name": "web",
     "stack": null,
     "type": "frontend",
     "port": 4722,
     "url": "http://localhost:4722",
     "containerPort": 4722,
     "hostPort": null,
     "directUrl": "http://localhost:4722",
     "extraPorts": [],
     "status": "ready"
    },
    {
     "name": "api",
     "stack": null,
     "type": "backend",
     "port": 4721,
     "url": "http://localhost:4721",
     "containerPort": 4721,
     "hostPort": null,
     "directUrl": "http://localhost:4721",
     "extraPorts": [],
     "status": "ready"
    }
   ],
   "stacks": [],
   "ports": [
    {
     "name": "ingress-http",
     "port": 8081
    },
    {
     "name": "ingress-https",
     "port": 8443
    },
    {
     "name": "tilt-ui",
     "port": 10350
    },
    {
     "name": "postgres",
     "port": 15433
    }
   ],
   "tokens": {
    "generatedTokens": 0,
    "authoredTokens": 4372,
    "savedPct": 0,
    "truncated": false
   },
   "conflicts": []
  },
  {
   "id": "project-4b981136d4",
   "name": "orders-app",
   "path": "~/code/orders-app",
   "tiltRunning": true,
   "resources": [
    {
     "name": "web",
     "stack": null,
     "type": "backend",
     "port": 4712,
     "url": "http://localhost:4712",
     "containerPort": 4712,
     "hostPort": null,
     "directUrl": "http://localhost:4712",
     "extraPorts": [],
     "status": "unknown",
     "statusReason": "not running"
    },
    {
     "name": "api",
     "stack": null,
     "type": "backend",
     "port": 4711,
     "url": "http://localhost:4711",
     "containerPort": 4711,
     "hostPort": null,
     "directUrl": "http://localhost:4711",
     "extraPorts": [],
     "status": "unknown",
     "statusReason": "not running"
    }
   ],
   "stacks": [],
   "ports": [
    {
     "name": "ingress-http",
     "port": 8082
    },
    {
     "name": "ingress-https",
     "port": 8444
    },
    {
     "name": "tilt-ui",
     "port": 10351
    },
    {
     "name": "postgres",
     "port": 15434
    }
   ],
   "tokens": {
    "generatedTokens": 0,
    "authoredTokens": 484,
    "savedPct": 0,
    "truncated": false
   },
   "conflicts": []
  }
 ],
 "doctor": {
  "menu": {
   "score": 100,
   "passed": 15,
   "warnings": 0,
   "failed": 0,
   "total": 15,
   "ready": true,
   "checks": [
    {
     "name": "Runtime",
     "status": "pass",
     "message": "Local processes: 2 services declare a command, so Docker, Compose and Tilt are not needed",
     "fix": ""
    },
    {
     "name": "Service commands",
     "status": "pass",
     "message": "Every service command starts a program that is installed",
     "fix": ""
    },
    {
     "name": "Service toolchains",
     "status": "pass",
     "message": "Every service that names a toolchain finds that version on PATH",
     "fix": ""
    },
    {
     "name": "WSL project location",
     "status": "skipped",
     "message": "Not running in WSL2 - skipped project filesystem check",
     "fix": ""
    },
    {
     "name": "Flisk installs",
     "status": "pass",
     "message": "One flisk install on PATH",
     "fix": ""
    },
    {
     "name": "Flisk version",
     "status": "skipped",
     "message": "flisk 1.4.45 (no minFliskVersion or pinnedFliskVersion in .flisk/project.json)",
     "fix": ""
    },
    {
     "name": "Service Repositories",
     "status": "skipped",
     "message": "No external repositories configured",
     "fix": ""
    },
    {
     "name": "Duplicate resource names",
     "status": "pass",
     "message": "Every resource has a unique appName",
     "fix": ""
    },
    {
     "name": "dependsOn",
     "status": "pass",
     "message": "Every dependsOn is a list of service names",
     "fix": ""
    },
    {
     "name": "Service dependencies",
     "status": "pass",
     "message": "Every dependsOn names a service of this project",
     "fix": ""
    },
    {
     "name": "Postgres volume",
     "status": "pass",
     "message": "No Postgres 18+ image mounts its volume at /var/lib/postgresql/data",
     "fix": ""
    },
    {
     "name": "Circular dependencies",
     "status": "pass",
     "message": "No service depends on itself through dependsOn",
     "fix": ""
    },
    {
     "name": "Service ports",
     "status": "pass",
     "message": "Every declared port is valid",
     "fix": ""
    },
    {
     "name": "schemaVersion",
     "status": "pass",
     "message": "Every service.json has a supported schemaVersion",
     "fix": ""
    },
    {
     "name": "Duplicate resource ports",
     "status": "pass",
     "message": "No two routed resources use the same port",
     "fix": ""
    },
    {
     "name": "Public Environment Secrets",
     "status": "pass",
     "message": "No secret-looking values detected in public environment variables",
     "fix": ""
    },
    {
     "name": "Remote hosts in env",
     "status": "pass",
     "message": "Every host in the env points at the local stack",
     "fix": ""
    },
    {
     "name": "Service Health",
     "status": "pass",
     "message": "Every running service answers",
     "fix": ""
    }
   ],
   "at": "2026-11-09T20:30:00.131Z"
  },
  "broken": {
   "score": 93,
   "passed": 14,
   "warnings": 0,
   "failed": 1,
   "total": 15,
   "ready": false,
   "checks": [
    {
     "name": "Service Health",
     "status": "fail",
     "message": "web: no answer from http://localhost:4712/health\n    api: no answer from http://localhost:4711/health",
     "fix": "Read the service output in .flisk/native/logs/<service>.log, or the flisk up terminal"
    },
    {
     "name": "Runtime",
     "status": "pass",
     "message": "Local processes: 2 services declare a command, so Docker, Compose and Tilt are not needed",
     "fix": ""
    },
    {
     "name": "Service commands",
     "status": "pass",
     "message": "Every service command starts a program that is installed",
     "fix": ""
    },
    {
     "name": "Service toolchains",
     "status": "pass",
     "message": "Every service that names a toolchain finds that version on PATH",
     "fix": ""
    },
    {
     "name": "WSL project location",
     "status": "skipped",
     "message": "Not running in WSL2 - skipped project filesystem check",
     "fix": ""
    },
    {
     "name": "Flisk installs",
     "status": "pass",
     "message": "One flisk install on PATH",
     "fix": ""
    },
    {
     "name": "Flisk version",
     "status": "skipped",
     "message": "flisk 1.4.45 (no minFliskVersion or pinnedFliskVersion in .flisk/project.json)",
     "fix": ""
    },
    {
     "name": "Service Repositories",
     "status": "skipped",
     "message": "No external repositories configured",
     "fix": ""
    },
    {
     "name": "Duplicate resource names",
     "status": "pass",
     "message": "Every resource has a unique appName",
     "fix": ""
    },
    {
     "name": "dependsOn",
     "status": "pass",
     "message": "Every dependsOn is a list of service names",
     "fix": ""
    },
    {
     "name": "Service dependencies",
     "status": "pass",
     "message": "Every dependsOn names a service of this project",
     "fix": ""
    },
    {
     "name": "Postgres volume",
     "status": "pass",
     "message": "No Postgres 18+ image mounts its volume at /var/lib/postgresql/data",
     "fix": ""
    },
    {
     "name": "Circular dependencies",
     "status": "pass",
     "message": "No service depends on itself through dependsOn",
     "fix": ""
    },
    {
     "name": "Service ports",
     "status": "pass",
     "message": "Every declared port is valid",
     "fix": ""
    },
    {
     "name": "schemaVersion",
     "status": "pass",
     "message": "Every service.json has a supported schemaVersion",
     "fix": ""
    },
    {
     "name": "Duplicate resource ports",
     "status": "pass",
     "message": "No two routed resources use the same port",
     "fix": ""
    },
    {
     "name": "Public Environment Secrets",
     "status": "pass",
     "message": "No secret-looking values detected in public environment variables",
     "fix": ""
    },
    {
     "name": "Remote hosts in env",
     "status": "pass",
     "message": "Every host in the env points at the local stack",
     "fix": ""
    }
   ],
   "at": "2026-11-09T20:30:00.316Z"
  },
  "fixed": {
   "score": 100,
   "passed": 15,
   "warnings": 0,
   "failed": 0,
   "total": 15,
   "ready": true,
   "checks": [
    {
     "name": "Runtime",
     "status": "pass",
     "message": "Local processes: 2 services declare a command, so Docker, Compose and Tilt are not needed",
     "fix": ""
    },
    {
     "name": "Service commands",
     "status": "pass",
     "message": "Every service command starts a program that is installed",
     "fix": ""
    },
    {
     "name": "Service toolchains",
     "status": "pass",
     "message": "Every service that names a toolchain finds that version on PATH",
     "fix": ""
    },
    {
     "name": "WSL project location",
     "status": "skipped",
     "message": "Not running in WSL2 - skipped project filesystem check",
     "fix": ""
    },
    {
     "name": "Flisk installs",
     "status": "pass",
     "message": "One flisk install on PATH",
     "fix": ""
    },
    {
     "name": "Flisk version",
     "status": "skipped",
     "message": "flisk 1.4.45 (no minFliskVersion or pinnedFliskVersion in .flisk/project.json)",
     "fix": ""
    },
    {
     "name": "Service Repositories",
     "status": "skipped",
     "message": "No external repositories configured",
     "fix": ""
    },
    {
     "name": "Duplicate resource names",
     "status": "pass",
     "message": "Every resource has a unique appName",
     "fix": ""
    },
    {
     "name": "dependsOn",
     "status": "pass",
     "message": "Every dependsOn is a list of service names",
     "fix": ""
    },
    {
     "name": "Service dependencies",
     "status": "pass",
     "message": "Every dependsOn names a service of this project",
     "fix": ""
    },
    {
     "name": "Postgres volume",
     "status": "pass",
     "message": "No Postgres 18+ image mounts its volume at /var/lib/postgresql/data",
     "fix": ""
    },
    {
     "name": "Circular dependencies",
     "status": "pass",
     "message": "No service depends on itself through dependsOn",
     "fix": ""
    },
    {
     "name": "Service ports",
     "status": "pass",
     "message": "Every declared port is valid",
     "fix": ""
    },
    {
     "name": "schemaVersion",
     "status": "pass",
     "message": "Every service.json has a supported schemaVersion",
     "fix": ""
    },
    {
     "name": "Duplicate resource ports",
     "status": "pass",
     "message": "No two routed resources use the same port",
     "fix": ""
    },
    {
     "name": "Public Environment Secrets",
     "status": "pass",
     "message": "No secret-looking values detected in public environment variables",
     "fix": ""
    },
    {
     "name": "Remote hosts in env",
     "status": "pass",
     "message": "Every host in the env points at the local stack",
     "fix": ""
    },
    {
     "name": "Service Health",
     "status": "pass",
     "message": "Every running service answers",
     "fix": ""
    }
   ],
   "at": "2026-11-09T20:35:23.217Z"
  }
 },
 "logs": {
  "menu-app/api": {
   "lines": [
    {
     "time": "2026-11-09T20:29:00.265Z",
     "resource": "api",
     "level": null,
     "source": null,
     "text": "menu API listening on http://localhost:4721"
    }
   ]
  },
  "menu-app/web": {
   "lines": [
    {
     "time": "2026-11-09T20:29:00.528Z",
     "resource": "web",
     "level": null,
     "source": null,
     "text": "website listening on http://localhost:4722"
    }
   ]
  },
  "orders-app/api": {
   "lines": [
    {
     "time": "2026-11-09T20:29:01.085Z",
     "resource": "api",
     "level": null,
     "source": null,
     "text": "api: DATABASE_URL is not set"
    }
   ]
  },
  "orders-app/web": {
   "lines": []
  }
 },
 "cli": {
  "minVersion": null,
  "installUrl": "https://github.com/flisk-sh/flisk#install",
  "version": "1.4.45",
  "program": "flisk",
  "label": "Flisk CLI",
  "state": "supported",
  "lifecycle": true,
  "message": null
 },
 "meta": {
  "defaultParent": "~/code",
  "roots": [
   "~/code"
  ],
  "templates": [
   "restaurant",
   "saas",
   "erp",
   "user-management",
   "ecommerce",
   "example"
  ],
  "resourceTypes": [
   "backend",
   "frontend",
   "worker",
   "mcp",
   "bring-your-own",
   "sdk",
   "agent"
  ]
 },
 "state": {
  "pins": {
   "projects": [],
   "resources": []
  },
  "hidden": [],
  "collapsed": [],
  "closedStacks": [],
  "scanRoots": [],
  "aiInspect": false
 },
 "disk": {
  "freeGb": 120,
  "dockerResponding": true,
  "items": []
 },
 "agents": {
  "providers": [
   {
    "id": "claude",
    "label": "Claude Code",
    "installed": true,
    "version": "2.1.267",
    "transport": "stream",
    "modes": {
     "plan": "Plan mode: reads and plans, no edits or commands.",
     "edit": "Edits files. Shell commands run only if your Claude Code settings allow them."
    },
    "install": "https://claude.com/product/claude-code",
    "login": "claude auth login"
   },
   {
    "id": "codex",
    "label": "Codex",
    "installed": false,
    "version": null,
    "transport": "stream",
    "modes": {
     "plan": "Read-only sandbox.",
     "edit": "Edits files and runs commands inside the project sandbox, without network."
    },
    "install": "https://developers.openai.com/codex/cli",
    "login": "codex login"
   },
   {
    "id": "cursor",
    "label": "Cursor Agent",
    "installed": false,
    "version": null,
    "transport": "stream",
    "modes": {
     "plan": "Plan mode: reads and proposes, no edits.",
     "edit": "Edits files. Shell commands run only if your Cursor settings allow them."
    },
    "install": "https://cursor.com/cli",
    "login": "cursor-agent login"
   },
   {
    "id": "grok",
    "label": "Grok Build",
    "installed": false,
    "version": null,
    "transport": "acp",
    "modes": {
     "plan": "Reads freely. Every edit or command it asks for is refused.",
     "edit": "File edits it asks for are allowed. Commands are refused."
    },
    "install": "https://x.ai/cli",
    "login": "grok login"
   },
   {
    "id": "fx",
    "label": "fx",
    "installed": false,
    "version": null,
    "transport": "acp",
    "modes": {
     "plan": "Reads freely. Every edit or command it asks for is refused.",
     "edit": "File edits it asks for are allowed. Commands are refused."
    },
    "install": "https://fx.sh",
    "login": "fx login"
   }
  ]
 },
 "threads": [
  {
   "id": "a4b2a49e9321",
   "project": "project-4b981136d4",
   "projectName": "orders-app",
   "provider": "claude",
   "providerLabel": "Claude Code",
   "mode": "plan",
   "title": "Why is the api service not healthy?",
   "createdAt": 1794256340307,
   "updatedAt": 1794256429027,
   "state": "done",
   "version": 27,
   "turns": 1
  }
 ],
 "thread": {
  "id": "a4b2a49e9321",
  "project": "project-4b981136d4",
  "projectName": "orders-app",
  "provider": "claude",
  "mode": "plan",
  "title": "Why is the api service not healthy?",
  "createdAt": 1794256340307,
  "updatedAt": 1794256429027,
  "version": 27,
  "turns": [
   {
    "id": "d8d369817fd8",
    "prompt": "The api service is not healthy. Find out why and say what the smallest fix is. Keep it short.",
    "withStack": true,
    "state": "done",
    "startedAt": 1794256340307,
    "endedAt": 1794256428493,
    "events": [
     {
      "kind": "user",
      "text": "The api service is not healthy. Find out why and say what the smallest fix is. Keep it short."
     },
     {
      "kind": "tool",
      "title": "Bash \u00b7 ls -la && find . -maxdepth 3 -not -path '*/node_modules*' -not -path '*/.git/*' | head -60",
      "status": "done",
      "output": "total 8\ndrwxr-xr-x@ 6 dev  wheel  192 Nov  9 21:29 .\ndrwxr-xr-x@ 4 dev  wheel  128 Nov  9 21:29 ..\ndrwxr-xr-x@ 4 dev  wheel  128 Nov  9 21:29 .flisk\ndrwxr-xr-x@ 4 dev  wheel  128 Nov  9 21:29 api\n-rw-r--r--@ 1 dev  wheel   37 Nov  9 21:29 package.json\ndrwxr-xr-x@ 4 dev  wheel  128 Nov  9 21:29 web\n.\n./.flisk\n./web\n./package.json\n./api\n./.flisk/native\n./.flisk/project.json\n./web/service.json\n./web/server.mjs\n./api/service.json\n./api/server.mjs\n./.flisk/native/logs\n./.flisk/native/.gitignore"
     },
     {
      "kind": "tool",
      "title": "Bash \u00b7 echo \"=== .flisk/project.json ===\" && cat .flisk/project.json && echo \"=== package.json ===\" && cat package.json && echo \"=== api/service.json ===\" && cat api/s\u2026",
      "status": "done",
      "output": "=== .flisk/project.json ===\n{\n  \"version\": \"1.0\",\n  \"project\": {\n    \"name\": \"orders-app\",\n    \"version\": \"1.0.0\"\n  },\n  \"phases\": {\n    \"pre_alpha\": {\n      \"name\": \"Pre-Alpha\",\n      \"description\": \"Core infrastructure and MVP services\",\n      \"enabledStacks\": [\n        \"proxy\",\n        \"database-management\"\n      ]\n    },\n    \"alpha\": {\n      \"name\": \"Alpha\",\n      \"description\": \"Essential business services\",\n      \"enabledStacks\": []\n    },\n    \"beta\": {\n      \"name\": \"Beta\",\n      \"description\": \"Extended features\",\n      \"enabledStacks\": []\n    },\n    \"out_of_scope\": {\n      \"name\": \"Out of Scope\",\n      \"description\": \"Future releases\",\n      \"enabledStacks\": []\n    }\n  },\n  \"optional_infra\": {\n    \"monitoring\": false,\n    \"elk\": false,\n    \"debezium\": false,\n    \"golden_image\": true,\n    \"verdaccio\": false\n  },\n  \"discovery\": {\n    \"paths\": [\n      \"services/*/*\"\n    ]\n  },\n  \"overrides\": {}\n}\n=== package.json ===\n{\"name\":\"orders-app\",\"private\":true}\n=== api/service.json ===\n{\"schemaVersion\":1,\"appName\":\"api\",\"appType\":\"backend\",\"port\":4711,\"command\":\"node server.mjs\",\"healthCheckPath\":\"/health\"}\n=== api/server.mjs ===\nimport { createServer } from \"node:http\";\nconst databaseUrl = process.env.DATABASE_URL;\nif (!databaseUrl) console.error(\"api: DATABASE_URL is not set\");\ncreateServer((req, res) => {\n  if (req.url === \"/health\") { res.writeHead(databaseUrl ? 200 : 503); return res.end(databaseUrl ? \"ok\" : \"no database\"); }\n  res.end(\"api\");\n}).listen(Number(process.env.PORT));\n=== web/service.json ===\n{\"schemaVersion\":1,\"appName\":\"web\",\"appType\":\"backend\",\"port\":4712,\"command\":\"node server.mjs\",\"healthCheckPath\":\"/health\"}\n=== web/server.mjs ===\nimport { createServer } from \"node:http\";\ncreateServer(async (req, res) => {\n  if (req.url === \"/health\") {\n    const up = await fetch(\"http://localhost:4711/health\").then((r) => r.ok, () => false);\n    res.writeHead(up ? 200 : 503); return res.end(up ? \"ok\" : \"api down\");\n  }\n  res.end(\"web\");\n}).listen(Number(process\u2026"
     },
     {
      "kind": "tool",
      "title": "Bash \u00b7 ls -la .flisk/native/logs/ && for f in .flisk/native/logs/*; do echo \"=== $f ===\"; tail -40 \"$f\"; done",
      "status": "done",
      "output": "total 8\ndrwxr-xr-x@ 3 dev  wheel   96 Nov  9 21:29 .\ndrwxr-xr-x@ 4 dev  wheel  128 Nov  9 21:30 ..\n-rw-r--r--@ 1 dev  wheel   54 Nov  9 21:29 api.log\n=== .flisk/native/logs/api.log ===\n2026-11-09T20:29:01.085Z api: DATABASE_URL is not set"
     },
     {
      "kind": "tool",
      "title": "Load the Flisk MCP tools",
      "status": "done",
      "output": ""
     },
     {
      "kind": "tool",
      "title": "mcp__flisk__resource_list",
      "status": "done",
      "output": "{\"schemaVersion\":1,\"data\":{\"resources\":[{\"name\":\"web\",\"stack\":null,\"type\":\"backend\",\"port\":4712,\"path\":\"~/code/orders-app/web/service.json\"},{\"name\":\"api\",\"stack\":null,\"type\":\"backend\",\"port\":4711,\"path\":\"~/code/orders-app/api/service.json\"}]},\"errors\":[]}"
     },
     {
      "kind": "tool",
      "title": "mcp__flisk__config_explain",
      "status": "done",
      "output": "{\"schemaVersion\":1,\"data\":{\"file\":\"api/service.json\",\"ownership\":\"user-owned\",\"isEditedNow\":false,\"reason\":\"Flisk input: the service manifest that generated service files are built from.\",\"source\":null,\"driftOnUp\":\"none\",\"next\":[\"Edit it, then run `flisk up` to regenerate the service's outputs.\"]},\"errors\":[]}"
     },
     {
      "kind": "text",
      "text": "**Why:** `api/server.mjs:2-5` returns 503 `\"no database\"` when `DATABASE_URL` is unset, and `.flisk/native/logs/api.log` contains exactly that: `api: DATABASE_URL is not set`. Nothing supplies it \u2014 `api/service.json` has no `params`/`secrets`, and `flisk resource list` shows only `web` and `api`, no database resource. (`web` is only failing because its `/health` proxies to `api`.)\n\n**Smallest fix:** add one field to `api/service.json`, then `flisk up`:\n\n```json\n\"params\": {\"DATABASE_URL\": \"postgres://orders:orders@localhost:5432/orders\"}\n```\n\nThe server never connects \u2014 it just checks the var is non-empty \u2014 so no database needs to run."
     }
    ],
    "dropped": 0,
    "error": null,
    "session": "158dc72a-7670-49de-b12a-c64e07a6f063",
    "costUsd": 0.917055,
    "durationMs": 82904
   }
  ],
  "providerLabel": "Claude Code",
  "state": "done"
 },
 "apps": {
  "apps": [
   {
    "id": "pages",
    "name": "Pages",
    "url": "https://pages.flisk.si",
    "blurb": "Your agent builds a page. One command makes it a public link.",
    "actions": [],
    "note": null
   },
   {
    "id": "citable",
    "name": "Citable",
    "url": "https://citable.flisk.si",
    "blurb": "Can AI answers cite your site? A score out of 100 and the fixes.",
    "actions": [],
    "note": null
   },
   {
    "id": "helpdock",
    "name": "Helpdock",
    "url": "https://helpdock.flisk.si",
    "blurb": "A repo's docs as a help center and an MCP server for your agent.",
    "actions": [],
    "note": null
   },
   {
    "id": "cmd",
    "name": "Command Comparer",
    "url": "https://cmd.flisk.si",
    "blurb": "Flisk commands next to Compose, Tilt, Terraform and more.",
    "actions": [],
    "note": null
   },
   {
    "id": "roadmap",
    "name": "DevEx Roadmap",
    "url": "https://roadmap.flisk.si",
    "blurb": "Community map of local DevEx tools, with a source for every dot.",
    "actions": [],
    "note": null
   },
   {
    "id": "demo",
    "name": "Demos",
    "url": "https://demo.flisk.si",
    "blurb": "Reply @grok bubbles on X and get a running local stack.",
    "actions": [],
    "note": null
   }
  ]
 },
 "appsProject": {
  "apps": [
   {
    "id": "pages",
    "name": "Pages",
    "url": "https://pages.flisk.si",
    "blurb": "Your agent builds a page. One command makes it a public link.",
    "actions": [
     {
      "kind": "agent",
      "label": "Make a page with an agent",
      "prompt": "Build a one-page explainer of the orders-app stack (its services, how they connect and how to run it with Flisk) as ./flisk-page/index.html, with no external scripts. Do not publish it; I will run `npx -y @flisk-sh/pages publish ./flisk-page --wait` myself."
     },
     {
      "kind": "copy",
      "label": "Copy publish command",
      "value": "npx -y @flisk-sh/pages publish ./flisk-page --wait"
     }
    ],
    "note": null
   },
   {
    "id": "citable",
    "name": "Citable",
    "url": "https://citable.flisk.si",
    "blurb": "Can AI answers cite your site? A score out of 100 and the fixes.",
    "actions": [],
    "note": "Start a frontend to check it locally."
   },
   {
    "id": "helpdock",
    "name": "Helpdock",
    "url": "https://helpdock.flisk.si",
    "blurb": "A repo's docs as a help center and an MCP server for your agent.",
    "actions": [],
    "note": "Push this project to GitHub to get its help center."
   },
   {
    "id": "cmd",
    "name": "Command Comparer",
    "url": "https://cmd.flisk.si",
    "blurb": "Flisk commands next to Compose, Tilt, Terraform and more.",
    "actions": [],
    "note": null
   },
   {
    "id": "roadmap",
    "name": "DevEx Roadmap",
    "url": "https://roadmap.flisk.si",
    "blurb": "Community map of local DevEx tools, with a source for every dot.",
    "actions": [],
    "note": null
   },
   {
    "id": "demo",
    "name": "Demos",
    "url": "https://demo.flisk.si",
    "blurb": "Reply @grok bubbles on X and get a running local stack.",
    "actions": [],
    "note": null
   }
  ]
 },
 "configLog": {
  "status": null,
  "entries": []
 }
};
