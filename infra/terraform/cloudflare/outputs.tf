output "pages_project_name" {
  description = "Cloudflare Pages project name."
  value       = cloudflare_pages_project.web.name
}

output "pages_project_subdomain" {
  description = "Default Cloudflare Pages hostname."
  value       = cloudflare_pages_project.web.subdomain
}
