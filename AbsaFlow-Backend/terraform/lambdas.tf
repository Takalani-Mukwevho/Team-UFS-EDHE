locals {
  common_env_vars = {
    BUCKET_NAME            = aws_s3_bucket.invoice_uploads.bucket
    TABLE_INVOICES         = aws_dynamodb_table.invoices.name
    TABLE_BUYERS           = aws_dynamodb_table.buyers.name
    TABLE_SMES             = aws_dynamodb_table.smes.name
    TABLE_EXTRACTION_CACHE = aws_dynamodb_table.extraction_cache.name
  }
}

# 1. Invoice Extraction Lambda
resource "aws_lambda_function" "extract_invoice" {
  function_name = "absaflow-extract-invoice"
  runtime       = "dotnet8"
  handler       = "AbsaFlow.Functions::AbsaFlow.Functions.Handlers.ExtractInvoiceHandler::FunctionHandler"
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
  handler       = "AbsaFlow.Functions::AbsaFlow.Functions.Handlers.VerifyInvoiceHandler::FunctionHandler"
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
  handler       = "AbsaFlow.Functions::AbsaFlow.Functions.Handlers.RiskFundingHandler::FunctionHandler"
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
  handler       = "AbsaFlow.Functions::AbsaFlow.Functions.Handlers.DemoOrchestratorHandler::FunctionHandler"
  role          = aws_iam_role.lambda_exec_role.arn
  filename      = "${path.module}/build/dummy.zip"
  timeout       = 60
  memory_size   = 512

  environment {
    variables = local.common_env_vars
  }
}