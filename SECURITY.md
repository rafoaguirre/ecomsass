# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Email:** [rafoaguirre@gmail.com](mailto:rafoaguirre@gmail.com)

Please include:

- A description of the vulnerability
- Steps to reproduce the issue
- Any relevant logs or screenshots

I will acknowledge receipt within 48 hours and provide an estimated timeline for a fix.

## Scope

This policy applies to the EcomSaaS monorepo and all packages within it.

## Security Measures

- **Authentication**: Supabase Auth with JWT token verification
- **Authorization**: Role-based access control (RBAC) with server-controlled role assignment via `app_metadata`
- **API Protection**: Helmet security headers, CORS allowlist, global rate limiting
- **Payment Security**: Stripe webhook signature verification, no raw card data handled (PCI-compliant via Stripe Elements)
- **Secret Management**: CI secret scanning via Gitleaks, environment-based secrets with Infisical support
- **Database**: Row-Level Security (RLS) policies on all tables, column-level restrictions on sensitive fields
