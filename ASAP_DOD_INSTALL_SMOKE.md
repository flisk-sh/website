# ASAP DoD: TDK CLI install smoke

Date: 2026-09-17
Last checked: 2026-09-17T11:01:30Z

## Definition of done

- Published Quick Start page serves the one-line installer.
- `https://flisk.sh/install.sh` returns HTTP 200.
- Fresh Ubuntu container can install the CLI using the published command.
- `tdk --version` prints `1.1.0`.
- `tdk project --yes` creates `.tdk/project.json` and `.tdk/.tdk-out/Tiltfile`.
- `tdk resource api --type backend --stack pre-alpha --path services/pre-alpha/api` creates `services/pre-alpha/api/service.json`.
- `tdk project --check` passes.
- `tdk up pre-alpha` requires the documented Tilt prerequisite.
- Docker Compose example can run `tdk --version`, `tdk project --yes`, `tdk resource ...`, and `tdk project --check`.
- Docker Compose example can create two services, set `api.dependsOn = ["database"]`, and `tdk status --verbose` discovers both resources.

## Container proof

```sh
docker run --rm ubuntu:24.04 sh -lc '
  set -eux
  apt-get update >/dev/null
  apt-get install -y curl ca-certificates sudo >/dev/null
  curl -fsSL https://flisk.sh/install.sh | sh
  tdk --version
  mkdir /tmp/my-service
  cd /tmp/my-service
  tdk project --yes
  printf "\n" | tdk resource api --type backend --stack pre-alpha --path services/pre-alpha/api
  test -f .tdk/project.json
  test -f .tdk/.tdk-out/Tiltfile
  test -f services/pre-alpha/api/service.json
  tdk project --check
'
```

Result: passed.

## Docker Compose proof

```sh
git clone --depth 1 https://github.com/tdk-landscape/tdk-docker-compose-example.git
cd tdk-docker-compose-example
docker compose run --rm tdk tdk --version
docker compose run --rm tdk tdk project --yes
printf "\n" | docker compose run --rm -T tdk tdk resource api --type backend --stack pre-alpha --path services/pre-alpha/api
docker compose run --rm tdk tdk project --check
test -f .tdk/project.json
test -f .tdk/.tdk-out/Tiltfile
test -f services/pre-alpha/api/service.json
```

Result: passed when run from a Docker-shared workspace path.

## Dependency proof

```sh
git clone --depth 1 https://github.com/tdk-landscape/tdk-docker-compose-example.git
cd tdk-docker-compose-example
docker compose build --no-cache
docker compose run --rm tdk tdk project --yes
printf "\n" | docker compose run --rm -T tdk tdk resource database --type backend --stack pre-alpha --path services/pre-alpha/database
printf "\n" | docker compose run --rm -T tdk tdk resource api --type backend --stack pre-alpha --path services/pre-alpha/api
docker compose run --rm -T tdk sh -lc 'node -e "
const fs = require(\"fs\");
const file = \"services/pre-alpha/api/service.json\";
const service = JSON.parse(fs.readFileSync(file, \"utf8\"));
service.dependsOn = [\"database\"];
fs.writeFileSync(file, JSON.stringify(service, null, 2) + \"\\n\");
"'
docker compose run --rm tdk tdk project --check
docker compose run --rm tdk tdk status --verbose
```

Result: passed. `tdk status --verbose` discovered `2 resources` in `pre-alpha`, and `services/pre-alpha/api/service.json` contained `dependsOn: ["database"]`.

## Current limitation

`tdk up pre-alpha` correctly requires Tilt. In a minimal Ubuntu smoke container without Tilt installed, it fails with `Executable not found in $PATH: "tilt"`. This matches the Quick Start prerequisite.

## Fixes made during smoke

- Published `tdk-cli-releases` release `v1.1.0`.
- Embedded CLI templates into the compiled Bun binary so `tdk project --yes` works without source files.
- Updated Quick Start from stale `tdk init` / `tdk generate` commands to current `tdk project` / `tdk resource` flow.
