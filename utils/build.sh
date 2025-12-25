#!/bin/bash
# Build script for Wordle Extension
# Creates a distributable zip file with only the required extension files

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_DIR/dist"
ZIP_NAME="wordle-extension.zip"

echo "Building Wordle Extension..."

# Create/clean build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Files to include in the extension
FILES=(
    "manifest.json"
    "popup.html"
    "popup.css"
    "popup.js"
    "analytics.html"
    "analytics.css"
    "analytics.js"
    "logic.js"
    "words.js"
    "icon-v2-16.png"
    "icon-v2-48.png"
    "icon-v2-128.png"
)

# Copy files to build directory
for file in "${FILES[@]}"; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        cp "$PROJECT_DIR/$file" "$BUILD_DIR/"
        echo "  ✓ $file"
    else
        echo "  ✗ Missing: $file"
        exit 1
    fi
done

# Create zip file
cd "$BUILD_DIR"
zip -q "$ZIP_NAME" "${FILES[@]}"
mv "$ZIP_NAME" "$PROJECT_DIR/"

echo ""
echo "Build complete!"
echo "Distribution zip: $PROJECT_DIR/$ZIP_NAME"
echo "You can upload this to the Chrome Web Store or share it directly."
