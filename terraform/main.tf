terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# --- Issue 10: S3 Bucket for Invoices ---
resource "aws_s3_bucket" "invoice_uploads" {
  bucket_prefix = "absaflow-invoices-"
  force_destroy = true
}

resource "aws_s3_bucket_cors_configuration" "invoice_s3_cors" {
  bucket = aws_s3_bucket.invoice_uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}