# ASAP DoD: Flisk CLI install smoke

Date: 2026-09-17
Last checked: 2026-09-17T11:01:30Z

## Definition of done

- Published Quick Start page serves the one-line installer.
- `https://flisk.sh/install.sh` returns HTTP 200.
- Fresh Ubuntu container can install the CLI using the published command.
- `flisk --version` prints `1.1.0`.
- `flisk project --yes` creates `.tdk/project.json` and `.tdk/.tdk-out/Tiltfile`.
- `flisk resource api --type backend --stack pre-alpha --path services/pre-alpha/api` creates `services/pre-alpha/api/service.json`.
- `flisk project --check` passes.
- `flisk up pre-alpha` requires the documented Tilt prerequisite.
- Docker Compose example can run `flisk --version`, `flisk project --yes`, `flisk resource ...`, and `flisk project --check`.
- Docker Compose example can create two services, set `api.dependsOn = ["database"]`, and `flisk status --verbose` discovers both resources.

## Container proof

```sh
docker run --rm ubuntu:24.04 sh -lc '
  set -eux
  apt-get update >/dev/null
  apt-get install -y curl ca-certificates sudo >/dev/null
  curl -fsSL https://flisk.sh/install.sh | sh
  flisk --version
  mkdir /tmp/my-service
  cd /tmp/my-service
  flisk project --yes
  printf "\n" | flisk resource api --type backend --stack pre-alpha --path services/pre-alpha/api
  test -f .tdk/project.json
  test -f .tdk/.tdk-out/Tiltfile
  test -f services/pre-alpha/api/service.json
  flisk project --check
'
```

Result: passed.

## Docker Compose proof

```sh
git clone --depth 1 https://github.com/flisk-sh/tdk-docker-compose-example.git
cd tdk-docker-compose-example
docker compose run --rm flisk flisk --version
docker compose run --rm flisk flisk project --yes
printf "\n" | docker compose run --rm -T flisk flisk resource api --type backend --stack pre-alpha --path services/pre-alpha/api
docker compose run --rm flisk flisk project --check
test -f .tdk/project.json
test -f .tdk/.tdk-out/Tiltfile
test -f services/pre-alpha/api/service.json
```

Result: passed when run from a Docker-shared workspace path.

## Dependency proof

```sh
git clone --depth 1 https://github.com/flisk-sh/tdk-docker-compose-example.git
cd tdk-docker-compose-example
docker compose build --no-cache
docker compose run --rm flisk flisk project --yes
printf "\n" | docker compose run --rm -T flisk flisk resource database --type backend --stack pre-alpha --path services/pre-alpha/database
printf "\n" | docker compose run --rm -T flisk flisk resource api --type backend --stack pre-alpha --path services/pre-alpha/api
docker compose run --rm -T flisk sh -lc 'node -e "
const fs = require(\"fs\");
const file = \"services/pre-alpha/api/service.json\";
const service = JSON.parse(fs.readFileSync(file, \"utf8\"));
service.dependsOn = [\"database\"];
fs.writeFileSync(file, JSON.stringify(service, null, 2) + \"\\n\");
"'
docker compose run --rm flisk flisk project --check
docker compose run --rm flisk flisk status --verbose
```

Result: passed. `flisk status --verbose` discovered `2 resources` in `pre-alpha`, and `services/pre-alpha/api/service.json` contained `dependsOn: ["database"]`.

## Current limitation

`flisk up pre-alpha` correctly requires Tilt. In a minimal Ubuntu smoke container without Tilt installed, it fails with `Executable not found in $PATH: "tilt"`. This matches the Quick Start prerequisite.

## Fixes made during smoke

- Published `tdk-cli-releases` release `v1.1.0`.
- Embedded CLI templates into the compiled Bun binary so `flisk project --yes` works without source files.
- Updated Quick Start from stale `flisk init` / `flisk generate` commands to current `flisk project` / `flisk resource` flow.
