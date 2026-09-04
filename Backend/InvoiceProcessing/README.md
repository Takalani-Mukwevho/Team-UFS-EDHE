# Invoice Processing Lambda Functions

.NET 8 AWS Lambda functions for SME invoice processing, verification, and funding decisions.

## Project Structure

```
src/InvoiceProcessing/
├── InvoiceProcessing.csproj     # Project file with AWS Lambda dependencies
├── Program.cs                   # Entry point
├── appsettings.json             # Configuration
├── README.md                    # This file
│
├── Models/                      # Data models
│   ├── Invoice.cs               # Invoice, ExtractedData, LineItem
│   ├── Buyer.cs                 # Buyer, PaymentHistory, CreditRating
│   ├── SME.cs                   # SME business profile
│   ├── FundingDecision.cs       # FundingDecision, RiskScore, RiskFactor
│   └── ExtractionCache.cs       # ExtractionCache for Textract results
│
├── Functions/                   # Lambda function handlers
│   ├── UploadFunction.cs        # Invoice upload with cache check
│   ├── VerifyFunction.cs        # Invoice verification
│   ├── FundFunction.cs          # Funding decision
│   └── DemoFunction.cs          # End-to-end demo
│
├── Services/                    # Business logic layer
│   ├── ICacheService.cs         # Cache service interface
│   ├── CacheService.cs          # DynamoDB cache implementation
│   ├── ITextractService.cs      # Textract service interface
│   ├── TextractService.cs       # AWS Textract integration
│   ├── IVerificationService.cs  # Verification service interface
│   ├── VerificationService.cs   # SME + invoice + buyer + duplicate checks
│   ├── IRiskEngineService.cs    # Risk engine interface
│   ├── RiskEngineService.cs     # Risk scoring and funding decisions
│   ├── IBedrockService.cs       # Bedrock AI interface
│   ├── BedrockService.cs        # Claude AI integration
│   ├── IDynamoService.cs        # DynamoDB service interface
│   └── DynamoService.cs         # DynamoDB CRUD operations
│
└── MockData/                    # Demo/test data
    ├── buyers.csv               # Mock buyer data
    ├── smes.csv                 # Mock SME data
    └── demo-invoices.json       # 3 demo invoices with extracted data
```

## API Endpoints

| Function | Trigger | Description |
|----------|---------|-------------|
| UploadFunction | POST /upload | Upload PDF/JPEG/PNG, check cache, extract with Textract |
| VerifyFunction | POST /verify/{invoiceId} | Verify SME, invoice, buyer, check duplicates |
| FundFunction | POST /fund/{invoiceId} | Risk assessment + funding decision |
| DemoFunction | POST /demo | Run all 3 demo invoices end-to-end |

## How It Works

```
Upload PDF/JPEG/PNG → S3 → Check ExtractionCache
                     ├─ HIT  → return cached JSON
                     └─ MISS → Textract → store in Cache → return JSON
                                      ↓
                              Verify (SME + invoice + buyer + duplicate)
                                      ↓
                              Risk Score + Funding Decision
                                      ↓
                          (Optional) Bedrock: "Summarize this decision"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| S3_BUCKET_NAME | S3 bucket for uploaded documents | invoice-uploads |
| INVOICE_TABLE_NAME | DynamoDB invoices table | Invoices |
| BUYER_TABLE_NAME | DynamoDB buyers table | Buyers |
| SME_TABLE_NAME | DynamoDB SMEs table | SMEs |
| CACHE_TABLE_NAME | DynamoDB cache table | ExtractionCache |
| BEDROCK_MODEL_ID | Bedrock model for AI summaries | anthropic.claude-3-haiku-20240307-v1:0 |

## Build & Deploy

```bash
# Build
cd src/InvoiceProcessing
dotnet build

# Package for Lambda
dotnet publish -c Release -o ./publish

# Deploy with SAM CLI
sam deploy --guided
```

## Local Testing

```bash
# Run tests
dotnet test

# Invoke function locally
dotnet lambda invoke-function UploadFunction --payload '{"smeId":"sme-001","buyerId":"buyer-001","fileName":"test.pdf","fileBase64":"..."}'
```
