# SNS Topic for email notifications
resource "aws_sns_topic" "absaflow_notifications" {
  name = "absaflow-notifications"
}

# Email subscription
resource "aws_sns_topic_subscription" "email_sub" {
  topic_arn = aws_sns_topic.absaflow_notifications.arn
  protocol  = "email"
  endpoint  = "mihlalidataweb@gmail.com"
}

# Notify Lambda function
resource "aws_lambda_function" "notify_email" {
  function_name = "absaflow-notify-email"
  runtime       = "dotnet8"
  handler       = "InvoiceProcessing::InvoiceProcessing.Functions.NotifyFunction::FunctionHandler"
  role          = aws_iam_role.lambda_exec_role.arn
  filename      = "${path.module}/build/dummy.zip"
  timeout       = 15
  memory_size   = 256

  environment {
    variables = merge(local.common_env_vars, {
      SNS_TOPIC_ARN = aws_sns_topic.absaflow_notifications.arn
    })
  }
}

# API Gateway route: POST /api/notify/email
resource "aws_apigatewayv2_integration" "notify_lambda_int" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.notify_email.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "post_notify_email" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /api/notify/email"
  target    = "integrations/${aws_apigatewayv2_integration.notify_lambda_int.id}"
}

resource "aws_lambda_permission" "apigw_invoke_notify" {
  statement_id  = "AllowExecutionFromAPIGateway-notify"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notify_email.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# SNS publish permission for the Lambda
resource "aws_iam_policy" "sns_publish_policy" {
  name = "absaflow-sns-publish"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "SNSPublish"
      Effect = "Allow"
      Action = ["sns:Publish"]
      Resource = aws_sns_topic.absaflow_notifications.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_sns_attach" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.sns_publish_policy.arn
}
