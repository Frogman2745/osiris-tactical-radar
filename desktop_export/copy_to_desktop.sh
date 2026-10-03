#!/usr/bin/env bash
set -e

# ==============================================================================
# OSIRIS: Copy Executive Package Directly to Local Desktop
# Author: Nicholas Marnocha (Froghaus Studios · @Frogman2745)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DESKTOP="$HOME/Desktop/OSIRIS_EXECUTIVE_PACKAGE"

if [ -d "$SCRIPT_DIR/desktop_export" ]; then
  SOURCE_DIR="$SCRIPT_DIR/desktop_export"
else
  SOURCE_DIR="$SCRIPT_DIR"
fi

echo "=================================================================="
echo "📁 Copying OSIRIS Executive Package to Desktop..."
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_DESKTOP"
echo "=================================================================="

# Create destination on Desktop
mkdir -p "$TARGET_DESKTOP"

# Copy all files from desktop_export
cp -R "$SOURCE_DIR/"* "$TARGET_DESKTOP/"

echo ""
echo "✅ SUCCESS! Complete OSIRIS package is now saved on your Desktop at:"
echo "   $TARGET_DESKTOP"
echo ""
echo "You can move, edit, copy records, and open these files anytime."
echo "=================================================================="
