resource "aws_dynamodb_table" "invoices" {
  name         = "absaflow-invoices"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "InvoiceId"

  attribute {
    name = "InvoiceId"
    type = "S"
  }

  attribute {
    name = "SmeId"
    type = "S"
  }

  attribute {
    name = "BuyerId"
    type = "S"
  }

  global_secondary_index {
    name            = "SmeId-index"
    hash_key        = "SmeId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "BuyerId-index"
    hash_key        = "BuyerId"
    projection_type = "ALL"
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
  hash_key     = "CacheKey"

  attribute {
    name = "CacheKey"
    type = "S"
  }

  attribute {
    name = "DocumentHash"
    type = "S"
  }

  global_secondary_index {
    name            = "DocumentHash-index"
    hash_key        = "DocumentHash"
    projection_type = "ALL"
  }
}