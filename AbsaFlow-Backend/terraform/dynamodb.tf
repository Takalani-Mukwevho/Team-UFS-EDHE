resource "aws_dynamodb_table" "invoices" {
  name         = "absaflow-invoices"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "InvoiceNumber"

  attribute {
    name = "InvoiceNumber"
    type = "S"
  }
}

resource "aws_dynamodb_table" "buyers" {
  name         = "absaflow-buyers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "BuyerId"

  attribute {
    name = "BuyerId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "smes" {
  name         = "absaflow-smes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "SmeId"

  attribute {
    name = "SmeId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "extraction_cache" {
  name         = "absaflow-extraction-cache"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "DocumentHash"

  attribute {
    name = "DocumentHash"
    type = "S"
  }
}