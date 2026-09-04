output "api_endpoint" {
  description = "API Gateway HTTP base URL"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "invoice_bucket" {
  description = "S3 Upload Bucket Name"
  value       = aws_s3_bucket.invoice_uploads.bucket
}