#!/bin/bash
# scripts/build-payroll.sh - Compile circuit and generate witness

set -e

echo "🔧 Building payroll Noir circuit..."

cd circuits/payroll

# 1. Compile the circuit
echo "📝 Compiling circuit..."
nargo compile

# 2. Execute to generate witness
echo "📊 Generating witness..."
nargo execute

echo ""
echo "✅ Circuit build complete!"
echo "  📁 Circuit: circuits/payroll/target/payroll.json"
echo "  📁 Witness: circuits/payroll/target/payroll.gz"

cd ../..