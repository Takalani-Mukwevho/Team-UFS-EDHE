#!/bin/bash
set -euo pipefail

# =============================================================================
# AbsaFlow DynamoDB Seed Script
# =============================================================================
# Seeds DynamoDB tables from CSV/JSON files in ../Data/
# Run: cd terraform && bash seed-dynamodb.sh
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$REPO_ROOT/Data"

echo "=============================================================================="
echo "                     ABSAFLOW DYNAMODB SEED SCRIPT"
echo "=============================================================================="
echo ""

AWS_REGION="${AWS_REGION:-af-south-1}"
INVOICES_TABLE="${INVOICES_TABLE:-absaflow-invoices}"
BUYERS_TABLE="${BUYERS_TABLE:-absaflow-buyers}"
SMES_TABLE="${SMES_TABLE:-absaflow-smes}"

echo "Target region: $AWS_REGION"
echo "Tables: $INVOICES_TABLE, $BUYERS_TABLE, $SMES_TABLE"
echo ""

# Check tools
command -v aws &>/dev/null || { echo "ERROR: AWS CLI not installed"; exit 1; }
command -v python3 &>/dev/null || { echo "ERROR: Python3 not installed"; exit 1; }

# =============================================================================
# SEED ALL TABLES via Python (handles CSV/JSON correctly)
# =============================================================================
python3 << 'PYTHON_SCRIPT'
import csv
import json
import subprocess
import sys
import os

data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'Data')
region = os.environ.get('AWS_REGION', 'af-south-1')

def run_aws(args):
    cmd = ['aws'] + args + ['--region', region]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0, result.stderr

def seed_buyers():
    print("--- Seeding Buyers Table ---")
    table = os.environ.get('BUYERS_TABLE', 'absaflow-buyers')
    filepath = os.path.join(data_dir, 'buyers.csv')
    count = 0
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            item = {
                "BuyerId": {"S": row["BuyerId"]},
                "CompanyName": {"S": row["CompanyName"]},
                "RegistrationNumber": {"S": row["RegistrationNumber"]},
                "Industry": {"S": row["Industry"]},
                "ContactEmail": {"S": row["ContactEmail"]},
                "ContactPhone": {"S": row["ContactPhone"]},
                "Address": {"S": row["Address"]},
                "CreditRating": {"S": row["CreditRating"]},
                "IsActive": {"BOOL": row["IsActive"].lower() == "true"},
                "CreatedAt": {"S": "2026-09-04T00:00:00Z"},
                "PaymentHistory": {"S": json.dumps({
                    "totalInvoicesPaid": int(row["TotalInvoicesPaid"]),
                    "totalInvoicesOutstanding": int(row["TotalInvoicesOutstanding"]),
                    "averagePaymentDays": int(row["AveragePaymentDays"]),
                    "latePayments": int(row["LatePayments"]),
                    "totalAmountPaid": float(row["TotalAmountPaid"])
                })}
            }
            ok, err = run_aws(['dynamodb', 'put-item', '--table-name', table, '--item', json.dumps(item)])
            status = "OK" if ok else "FAIL"
            print(f"  [{status}] {row['BuyerId']} ({row['CompanyName']})")
            if not ok:
                print(f"    Error: {err.strip()}", file=sys.stderr)
            count += 1
    print(f"  Total: {count} buyers\n")
    return count

def seed_smes():
    print("--- Seeding SMEs Table ---")
    table = os.environ.get('SMES_TABLE', 'absaflow-smes')
    filepath = os.path.join(data_dir, 'smes.csv')
    count = 0
    with open(filepath, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            item = {
                "SmeId": {"S": row["SmeId"]},
                "CompanyName": {"S": row["CompanyName"]},
                "RegistrationNumber": {"S": row["RegistrationNumber"]},
                "Industry": {"S": row["Industry"]},
                "YearsInOperation": {"N": row["YearsInOperation"]},
                "AnnualRevenue": {"N": row["AnnualRevenue"]},
                "ContactEmail": {"S": row["ContactEmail"]},
                "ContactPhone": {"S": row["ContactPhone"]},
                "Address": {"S": row["Address"]},
                "BankAccountNumber": {"S": row["BankAccountNumber"]},
                "IsVerified": {"BOOL": row["IsVerified"].lower() == "true"},
                "CreatedAt": {"S": "2026-09-04T00:00:00Z"}
            }
            if row.get("VerificationDate", "").strip():
                item["VerificationDate"] = {"S": row["VerificationDate"]}
            ok, err = run_aws(['dynamodb', 'put-item', '--table-name', table, '--item', json.dumps(item)])
            status = "OK" if ok else "FAIL"
            print(f"  [{status}] {row['SmeId']} ({row['CompanyName']})")
            if not ok:
                print(f"    Error: {err.strip()}", file=sys.stderr)
            count += 1
    print(f"  Total: {count} SMEs\n")
    return count

def seed_invoices():
    print("--- Seeding Invoices Table ---")
    table = os.environ.get('INVOICES_TABLE', 'absaflow-invoices')
    filepath = os.path.join(data_dir, 'demo-invoices.json')
    with open(filepath, 'r') as f:
        invoices = json.load(f)
    count = 0
    for inv in invoices:
        item = {
            "InvoiceId": {"S": inv["invoiceId"]},
            "SmeId": {"S": inv["smeId"]},
            "BuyerId": {"S": inv["buyerId"]},
            "InvoiceNumber": {"S": inv["invoiceNumber"]},
            "Amount": {"N": str(inv["amount"])},
            "Currency": {"S": inv.get("currency", "ZAR")},
            "IssueDate": {"S": inv["issueDate"]},
            "DueDate": {"S": inv["dueDate"]},
            "Status": {"S": "Extracted"},
            "S3Key": {"S": f"invoices/{inv['smeId']}/20240115/{inv['invoiceNumber']}.pdf"},
            "DocumentHash": {"S": f"hash-{inv['invoiceId']}"},
            "CreatedAt": {"S": "2026-09-04T00:00:00Z"},
            "UpdatedAt": {"S": "2026-09-04T00:00:00Z"},
            "ExtractedData": {"S": json.dumps(inv.get("extractedData", {}))}
        }
        ok, err = run_aws(['dynamodb', 'put-item', '--table-name', table, '--item', json.dumps(item)])
        status = "OK" if ok else "FAIL"
        print(f"  [{status}] {inv['invoiceId']} ({inv['invoiceNumber']})")
        if not ok:
            print(f"    Error: {err.strip()}", file=sys.stderr)
        count += 1
    print(f"  Total: {count} invoices\n")
    return count

# Run all seeds
seed_buyers()
seed_smes()
seed_invoices()

print("=" * 71)
print("                     SEED COMPLETE")
print("=" * 71)
print()
print("Tables seeded:")
print("  - absaflow-buyers (buyers.csv)")
print("  - absaflow-smes (smes.csv)")
print("  - absaflow-invoices (demo-invoices.json)")
PYTHON_SCRIPT
