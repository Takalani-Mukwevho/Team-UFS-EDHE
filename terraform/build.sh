#!/bin/bash
set -euo pipefail

# Build script for AbsaFlow Lambda deployment packages
# Run from the repo root: ./terraform/build.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$REPO_ROOT/Backend/InvoiceProcessing"
BUILD_DIR="$SCRIPT_DIR/build"

echo "=== AbsaFlow Lambda Build ==="
echo "Repo root: $REPO_ROOT"
echo "Build dir: $BUILD_DIR"
echo ""

# Clean previous build
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Publish .NET project
echo "--- Publishing .NET project ---"
dotnet publish "$BACKEND_DIR/InvoiceProcessing.csproj" \
  -c Release \
  -o "$BUILD_DIR/publish" \
  --nologo

# Package each Lambda function
# For a single-assembly deployment, all functions ship in one package.
# Each Lambda handler points to a different class in the same assembly.
echo "--- Creating deployment package ---"
cd "$BUILD_DIR/publish"
zip -r "$BUILD_DIR/lambda-deploy.zip" . -x "*.DS_Store"
cd "$SCRIPT_DIR"

# Terraform expects the zip at ${path.module}/build/dummy.zip
# We copy our package there so `terraform apply` works out of the box
cp "$BUILD_DIR/lambda-deploy.zip" "$BUILD_DIR/dummy.zip"

echo ""
echo "=== Build Complete ==="
echo "Package: $BUILD_DIR/lambda-deploy.zip"
echo "Terraform stub: $BUILD_DIR/dummy.zip"
echo ""
echo "Next steps:"
echo "  cd terraform && terraform init && terraform plan"
