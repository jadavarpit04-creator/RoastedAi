#!/bin/bash

set -e

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NEXTJS_PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check Next.js project directory exists
if [ ! -d "$NEXTJS_PROJECT_DIR" ]; then
    echo "Error: Next.js project directory not found: $NEXTJS_PROJECT_DIR"
    exit 1
fi

echo "Building Next.js app..."
echo "Project path: $NEXTJS_PROJECT_DIR"

cd "$NEXTJS_PROJECT_DIR" || exit 1

# Set environment variables
export NEXT_TELEMETRY_DISABLED=1

BUILD_DIR="/tmp/build_fullstack_$BUILD_ID"
echo "Build directory: $BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Install dependencies
echo "Installing dependencies..."
bun install

# Build Next.js app
echo "Building Next.js app..."
bun run build

# Build mini-services (if exists)
if [ -d "$NEXTJS_PROJECT_DIR/mini-services" ]; then
    echo "Building mini-services..."
    if [ -f "$SCRIPT_DIR/mini-services-install.sh" ]; then
        sh "$SCRIPT_DIR/mini-services-install.sh"
    fi
    if [ -f "$SCRIPT_DIR/mini-services-build.sh" ]; then
        sh "$SCRIPT_DIR/mini-services-build.sh"
    fi

    if [ -f "$SCRIPT_DIR/mini-services-start.sh" ]; then
        echo "Copying mini-services-start.sh to $BUILD_DIR"
        cp "$SCRIPT_DIR/mini-services-start.sh" "$BUILD_DIR/mini-services-start.sh"
        chmod +x "$BUILD_DIR/mini-services-start.sh"
    fi
else
    echo "No mini-services directory, skipping"
fi

# Copy build outputs
echo "Collecting build artifacts to $BUILD_DIR..."

if [ -d ".next/standalone" ]; then
    echo "  - Copying .next/standalone"
    cp -r .next/standalone "$BUILD_DIR/next-service-dist/"
fi

if [ -d ".next/static" ]; then
    echo "  - Copying .next/static"
    mkdir -p "$BUILD_DIR/next-service-dist/.next"
    cp -r .next/static "$BUILD_DIR/next-service-dist/.next/"
fi

if [ -d "public" ]; then
    echo "  - Copying public"
    cp -r public "$BUILD_DIR/next-service-dist/"
fi

# Copy database
if [ -f "./db/custom.db" ]; then
    echo "Copying database..."
    mkdir -p "$BUILD_DIR/db"
    cp -r ./db/. "$BUILD_DIR/db/"

    echo "Syncing database schema..."
    DATABASE_URL="file:$BUILD_DIR/db/custom.db" bun run db:push
    echo "Database ready"
    ls -lah "$BUILD_DIR/db"
else
    echo "Warning: No database file found at ./db/custom.db"
fi

# Copy Caddyfile (if exists)
if [ -f "Caddyfile" ]; then
    echo "  - Copying Caddyfile"
    cp Caddyfile "$BUILD_DIR/"
fi

# Copy start script
echo "  - Copying start.sh to $BUILD_DIR"
cp "$SCRIPT_DIR/start.sh" "$BUILD_DIR/start.sh"
chmod +x "$BUILD_DIR/start.sh"

# Package
PACKAGE_FILE="${BUILD_DIR}.tar.gz"
echo ""
echo "Packaging to $PACKAGE_FILE..."
cd "$BUILD_DIR" || exit 1
tar -czf "$PACKAGE_FILE" .
cd - > /dev/null || exit 1

echo ""
echo "Build complete! Package: $PACKAGE_FILE"
ls -lh "$PACKAGE_FILE"
