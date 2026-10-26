#!/usr/bin/env sh
set -eu

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

need curl
need uname
need chmod
need mkdir
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
tmp="${TMPDIR:-/tmp}/flisk.$$"
engine_tmp="${TMPDIR:-/tmp}/flisk-engine.$$.tar.gz"
sums_tmp="${TMPDIR:-/tmp}/flisk-checksums.$$.txt"
trap 'rm -f "$tmp" "$engine_tmp" "$sums_tmp"' EXIT

download() {
  src="$1"
  dest="$2"
  n=0
  while [ "$n" -lt 8 ]; do
    if curl -fsSL "$src" -o "$dest"; then
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

# verify FILE ASSET_NAME required|optional
# checksums.txt lines are "<sha256>  <name>" (or "<sha256> *<name>").
# Older releases list only the binaries, so the engine is checked only
# when its line is present.
verify() {
  expected="$(awk -v n="$2" '$2 == n || $2 == "*" n { print $1; exit }' "$sums_tmp")"
  if [ -z "$expected" ]; then
    [ "$3" = "required" ] && fail "checksums.txt has no entry for $2"
    echo "Note: this release has no checksum for $2; skipping its verification." >&2
    return 0
  fi
  actual="$(sha256_of "$1")"
  [ "$actual" = "$expected" ] || fail "checksum mismatch for $2 (expected $expected, got $actual)"
}

echo "Installing ${asset}..."
download "$url" "$tmp" || fail "download failed: $url"
chmod +x "$tmp"

# The compiled binary has no source checkout to find engine/ in, so it
# looks for a flisk-cli/ folder next to itself (see
# cli/src/generator/template-engine.ts, vendorFliskExtension). Without this,
# `flisk project`/`flisk up` fail with "Flisk extension not found".
echo "Installing bundled engine..."
download "$engine_url" "$engine_tmp" || fail "download failed: $engine_url"

echo "Verifying checksums..."
download "$checksums_url" "$sums_tmp" || fail "download failed: $checksums_url"
verify "$tmp" "$asset" required
verify "$engine_tmp" "$engine_asset" optional

mv "$tmp" "${install_dir}/${BIN_NAME}"
rm -rf "${install_dir}/flisk-cli"
mkdir -p "${install_dir}/flisk-cli"
tar -xzf "$engine_tmp" -C "${install_dir}/flisk-cli" --strip-components=1
rm -f "$engine_tmp"

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
