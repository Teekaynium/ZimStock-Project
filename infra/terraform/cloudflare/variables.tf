variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the Pages project."
  type        = string
}

variable "project_name" {
  description = "Cloudflare Pages project name for the web app."
  type        = string
}

variable "production_branch" {
  description = "Git branch name treated as the production deployment branch."
  type        = string
  default     = "main"
}
