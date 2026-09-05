# Query Lambda function for GET endpoints
resource "aws_lambda_function" "query_data" {
  function_name = "absaflow-query-data"
  runtime       = "dotnet8"
  handler       = "InvoiceProcessing::InvoiceProcessing.Functions.QueryFunction::FunctionHandler"
  role          = aws_iam_role.lambda_exec_role.arn
  filename      = "${path.module}/build/dummy.zip"
  timeout       = 15
  memory_size   = 256

  environment {
    variables = local.common_env_vars
  }
}

# Add query routes to API Gateway
resource "aws_apigatewayv2_integration" "query_lambda_int" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.query_data.arn
  payload_format_version = "2.0"
}

# GET /api/invoices
resource "aws_apigatewayv2_route" "get_invoices" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/invoices"
  target    = "integrations/${aws_apigatewayv2_integration.query_lambda_int.id}"
}

# GET /api/invoices/{invoiceId}
resource "aws_apigatewayv2_route" "get_invoice_by_id" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/invoices/{invoiceId}"
  target    = "integrations/${aws_apigatewayv2_integration.query_lambda_int.id}"
}

# GET /api/invoices/sme/{smeId}
resource "aws_apigatewayv2_route" "get_invoices_by_sme" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/invoices/sme/{smeId}"
  target    = "integrations/${aws_apigatewayv2_integration.query_lambda_int.id}"
}

# GET /api/invoices/buyer/{buyerId}
resource "aws_apigatewayv2_route" "get_invoices_by_buyer" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/invoices/buyer/{buyerId}"
  target    = "integrations/${aws_apigatewayv2_integration.query_lambda_int.id}"
}

# GET /api/buyers
resource "aws_apigatewayv2_route" "get_buyers" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/buyers"
  target    = "integrations/${aws_apigatewayv2_integration.query_lambda_int.id}"
}

# GET /api/buyers/{buyerId}
resource "aws_apigatewayv2_route" "get_buyer_by_id" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/buyers/{buyerId}"
  target    = "integrations/${aws_apigatewayv2_integration.query_lambda_int.id}"
}

# GET /api/smes
resource "aws_apigatewayv2_route" "get_smes" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/smes"
  target    = "integrations/${aws_apigatewayv2_integration.query_lambda_int.id}"
}

# GET /api/smes/{smeId}
resource "aws_apigatewayv2_route" "get_sme_by_id" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /api/smes/{smeId}"
  target    = "integrations/${aws_apigatewayv2_integration.query_lambda_int.id}"
}

# POST /api/invoices/{invoiceId}/status (persist decisions)
resource "aws_apigatewayv2_route" "put_invoice_status" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/invoices/{invoiceId}/status"
  target    = "integrations/${aws_apigatewayv2_integration.query_lambda_int.id}"
}

# Lambda permission for API Gateway to invoke query function
resource "aws_lambda_permission" "apigw_invoke_query" {
  statement_id  = "AllowExecutionFromAPIGateway-query"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.query_data.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
