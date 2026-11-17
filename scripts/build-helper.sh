#!/usr/bin/env bash
# Builds the tiny macOS helper that reports window positions (so snow can land on windows).
# Run on a Mac with Xcode Command Line Tools installed: xcode-select --install
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname)" != "Darwin" ]]; then
  echo "build-helper: skipping (not macOS). Snow will still pile up on the Dock."
  exit 0
fi
mkdir -p build/bin
SRC=build/helper/window-watcher.swift
swiftc -O -target arm64-apple-macos11 "$SRC" -o build/bin/window-watcher-arm64
swiftc -O -target x86_64-apple-macos10.15 "$SRC" -o build/bin/window-watcher-x64
lipo -create build/bin/window-watcher-arm64 build/bin/window-watcher-x64 -output build/bin/window-watcher
rm build/bin/window-watcher-arm64 build/bin/window-watcher-x64
echo "build-helper: built build/bin/window-watcher (universal)"
