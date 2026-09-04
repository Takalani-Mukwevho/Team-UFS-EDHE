variable "aws_region" {
  type        = string
  description = "Target AWS region"
  default     = "af-south-1" # or eu-west-1 / us-east-1 depending on Textract/Bedrock regional availability
}