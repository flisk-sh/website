#!/usr/bin/env sh
set -eu

# Everything runs from main(), called on the last line, so a connection that
# drops halfway through `curl ... | sh` runs nothing instead of half a script.

OWNER="flisk-sh"
REPO="releases"
BIN_NAME="flisk"

fail() {
  echo "flisk install: $*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

download() {
  src="$1"
  dest="$2"
  n=0
  while [ "$n" -lt 8 ]; do
    # HTTPS only, redirects included (GitHub sends release downloads on to
    # its CDN), and TLS 1.2 or newer.
    if curl --proto '=https' --proto-redir '=https' --tlsv1.2 -fsSL "$src" -o "$dest"; then
      return 0
    fi
    n=$((n + 1))
    sleep $((n * 2))
  done
  return 1
}

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    fail "missing required command: sha256sum or shasum"
  fi
}

# verify FILE ASSET_NAME
# checksums.txt lines are "<sha256>  <name>" (or "<sha256> *<name>").
# A file with no line in checksums.txt is refused, never installed unchecked.
verify() {
  expected="$(awk -v n="$2" '$2 == n || $2 == "*" n { print $1; exit }' "$sums_tmp")"
  [ -n "$expected" ] || fail "checksums.txt has no entry for $2; refusing to install it unverified"
  actual="$(sha256_of "$1")"
  [ "$actual" = "$expected" ] || fail "checksum mismatch for $2 (expected $expected, got $actual)"
}

main() {
  need curl
  need uname
  need chmod
  need mkdir
  need mktemp
  need tar
  need awk

  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"

  case "$os" in
    linux) platform="linux" ;;
    darwin) platform="darwin" ;;
    *) fail "unsupported OS: $os" ;;
  esac

  case "$arch" in
    x86_64|amd64) cpu="amd64" ;;
    arm64|aarch64) cpu="arm64" ;;
    *) fail "unsupported CPU: $arch" ;;
  esac

  asset="flisk-${platform}-${cpu}"
  url="https://github.com/${OWNER}/${REPO}/releases/latest/download/${asset}"

  # Fixed filename (no version in it), so this always resolves to whatever
  # release is currently "latest" - unlike the per-release zip, which is
  # named with its own tag and can't be found this way.
  engine_asset="flisk-cli-engine.tar.gz"
  engine_url="https://github.com/${OWNER}/${REPO}/releases/latest/download/${engine_asset}"

  checksums_url="https://github.com/${OWNER}/${REPO}/releases/latest/download/checksums.txt"

  # Never runs sudo. Uses FLISK_INSTALL_DIR if set, else /usr/local/bin when
  # it's writable, else ~/.local/bin.
  install_dir="${FLISK_INSTALL_DIR:-}"
  if [ -n "$install_dir" ]; then
    mkdir -p "$install_dir" 2>/dev/null || true
    [ -w "$install_dir" ] || fail "$install_dir is not writable. Pick another FLISK_INSTALL_DIR, or download the script and run it with sudo yourself."
  elif [ -w /usr/local/bin ]; then
    install_dir="/usr/local/bin"
  else
    install_dir="${HOME}/.local/bin"
    mkdir -p "$install_dir"
  fi

  # A private directory from mktemp, not a guessable name in a shared /tmp
  # that another user could create first and swap after verification.
  work="$(mktemp -d "${TMPDIR:-/tmp}/flisk-install.XXXXXX")" || fail "could not create a temporary directory"
  trap 'rm -rf "$work"' EXIT
  tmp="${work}/${asset}"
  engine_tmp="${work}/${engine_asset}"
  sums_tmp="${work}/checksums.txt"

  echo "Installing ${asset}..."
  download "$url" "$tmp" || fail "download failed: $url"

  # The compiled binary has no source checkout to find engine/ in, so it
  # looks for a flisk-cli/ folder next to itself (see
  # cli/src/generator/template-engine.ts, vendorFliskExtension). Without this,
  # `flisk project`/`flisk up` fail with "Flisk extension not found".
  echo "Installing bundled engine..."
  download "$engine_url" "$engine_tmp" || fail "download failed: $engine_url"

  echo "Verifying checksums..."
  download "$checksums_url" "$sums_tmp" || fail "download failed: $checksums_url"
  verify "$tmp" "$asset"
  verify "$engine_tmp" "$engine_asset"

  chmod +x "$tmp"
  mv "$tmp" "${install_dir}/${BIN_NAME}"
  rm -rf "${install_dir}/flisk-cli"
  mkdir -p "${install_dir}/flisk-cli"
  tar -xzf "$engine_tmp" -C "${install_dir}/flisk-cli" --strip-components=1

  echo "Installed: ${install_dir}/${BIN_NAME}"
  "${install_dir}/${BIN_NAME}" --version || true

  case ":${PATH}:" in
    *":${install_dir}:"*)
      found="$(command -v "$BIN_NAME" 2>/dev/null || true)"
      if [ -n "$found" ] && [ "$found" != "${install_dir}/${BIN_NAME}" ]; then
        echo "Warning: ${found} comes first on your PATH and will run instead of this install." >&2
      fi
      ;;
    *)
      echo
      echo "${install_dir} is not on your PATH. Add this to your shell profile:"
      echo "  export PATH=\"${install_dir}:\$PATH\""
      ;;
  esac
  echo "Next: flisk doctor"
  echo "For AI agents, configure your MCP client to launch flisk mcp over local stdio:"
  echo "  https://github.com/flisk-sh/flisk/blob/main/docs/agent-tooling/README.md"
}

main "$@"
