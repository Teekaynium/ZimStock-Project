# Cloudflare Pages

This Terraform config creates the Cloudflare Pages project that hosts `web/`.

## Prerequisites

- Terraform `>= 1.6`
- A Cloudflare API token with Pages edit permissions exported as `CLOUDFLARE_API_TOKEN`
- Your Cloudflare account ID

## Create the Pages project

```bash
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

## GitHub Actions setup

After `terraform apply`, add these repository settings so the daily pipeline can redeploy the site:

- secret `CLOUDFLARE_API_TOKEN`
- secret `CLOUDFLARE_ACCOUNT_ID`
- variable `CLOUDFLARE_PAGES_PROJECT_NAME`

The existing daily notebook workflow now rebuilds `web/` and deploys it to Cloudflare Pages after a successful run.
