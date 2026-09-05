locals {
  common_env_vars = {
    S3_BUCKET_NAME    = aws_s3_bucket.invoice_uploads.bucket
    INVOICE_TABLE_NAME  = aws_dynamodb_table.invoices.name
    BUYER_TABLE_NAME    = aws_dynamodb_table.buyers.name
    SME_TABLE_NAME      = aws_dynamodb_table.smes.name
    CACHE_TABLE_NAME    = aws_dynamodb_table.extraction_cache.name
  }
}

# 1. Invoice Extraction Lambda
resource "aws_lambda_function" "extract_invoice" {
  function_name = "absaflow-extract-invoice"
  runtime       = "dotnet8"
  handler       = "InvoiceProcessing::InvoiceProcessing.Functions.UploadFunction::FunctionHandler"
  role          = aws_iam_role.lambda_exec_role.arn
  filename      = "${path.module}/build/dummy.zip"
  timeout       = 30
  memory_size   = 512

  environment {
    variables = local.common_env_vars
  }
}

# 2. Verification Lambda
resource "aws_lambda_function" "verify_invoice" {
  function_name = "absaflow-verify-invoice"
  runtime       = "dotnet8"
  handler       = "InvoiceProcessing::InvoiceProcessing.Functions.VerifyFunction::FunctionHandler"
  role          = aws_iam_role.lambda_exec_role.arn
  filename      = "${path.module}/build/dummy.zip"
  timeout       = 15
  memory_size   = 256

  environment {
    variables = local.common_env_vars
  }
}

# 3. Risk Engine & Funding Decision Lambda
resource "aws_lambda_function" "risk_funding" {
  function_name = "absaflow-risk-funding"
  runtime       = "dotnet8"
  handler       = "InvoiceProcessing::InvoiceProcessing.Functions.FundFunction::FunctionHandler"
  role          = aws_iam_role.lambda_exec_role.arn
  filename      = "${path.module}/build/dummy.zip"
  timeout       = 15
  memory_size   = 256

  environment {
    variables = local.common_env_vars
  }
}

# 4. Demo Orchestrator Lambda
resource "aws_lambda_function" "demo_orchestrator" {
  function_name = "absaflow-demo-orchestrator"
  runtime       = "dotnet8"
  handler       = "InvoiceProcessing::InvoiceProcessing.Functions.DemoFunction::FunctionHandler"
  role          = aws_iam_role.lambda_exec_role.arn
  filename      = "${path.module}/build/dummy.zip"
  timeout       = 60
  memory_size   = 512

  environment {
    variables = local.common_env_vars
  }
}

# 5. AI Extraction Lambda (Bedrock Claude)
resource "aws_lambda_function" "ai_extract" {
  function_name = "absaflow-ai-extract"
  runtime       = "dotnet8"
  handler       = "InvoiceProcessing::InvoiceProcessing.Functions.AiExtractFunction::FunctionHandler"
  role          = aws_iam_role.lambda_exec_role.arn
  filename      = "${path.module}/build/lambda.zip"
  timeout       = 60
  memory_size   = 512

  environment {
    variables = merge(local.common_env_vars, {
      BEDROCK_EXTRACTION_MODEL = "anthropic.claude-3-5-sonnet-20241022-v2:0"
      BEDROCK_FALLBACK_MODEL   = "anthropic.claude-3-haiku-20240307-v1:0"
    })
  }
}

# 6. Narrative Storage Lambda (DynamoDB read/write)
resource "aws_lambda_function" "narrative_store" {
  function_name = "absaflow-narrative-store"
  runtime       = "dotnet8"
  handler       = "InvoiceProcessing::InvoiceProcessing.Functions.NarrativeFunction::FunctionHandler"
  role          = aws_iam_role.lambda_exec_role.arn
  filename      = "${path.module}/build/lambda.zip"
  timeout       = 15
  memory_size   = 256

  environment {
    variables = merge(local.common_env_vars, {
      NARRATIVE_TABLE_NAME = aws_dynamodb_table.narratives.name
    })
  }
}

# 7. AI Risk Narrative Lambda (Bedrock Claude)
resource "aws_lambda_function" "ai_narrative" {
  function_name = "absaflow-ai-narrative"
  runtime       = "dotnet8"
  handler       = "InvoiceProcessing::InvoiceProcessing.Functions.AiNarrativeFunction::FunctionHandler"
  role          = aws_iam_role.lambda_exec_role.arn
  filename      = "${path.module}/build/lambda.zip"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = merge(local.common_env_vars, {
      BEDROCK_NARRATIVE_MODEL = "anthropic.claude-3-haiku-20240307-v1:0"
    })
  }
}