resource "aws_apigatewayv2_api" "http_api" {
  name          = "absaflow-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["*"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# Helper module pattern via integration mapping
locals {
  endpoints = {
    "POST /api/invoices/extract" = aws_lambda_function.extract_invoice
    "POST /api/invoices/verify"  = aws_lambda_function.verify_invoice
    "POST /api/invoices/funding" = aws_lambda_function.risk_funding
    "POST /api/demo/run"         = aws_lambda_function.demo_orchestrator
  }
}

resource "aws_apigatewayv2_integration" "lambda_int" {
  for_each               = local.endpoints
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = each.value.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "routes" {
  for_each  = local.endpoints
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.lambda_int[each.key].id}"
}

resource "aws_lambda_permission" "apigw_invoke" {
  for_each      = local.endpoints
  statement_id  = "AllowExecutionFromAPIGateway-${each.value.function_name}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}