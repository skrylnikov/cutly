# Release Notes

## Version 0.1.1

### 🐛 Bug Fixes

- Fixed latest tag
- Fixed display name rendering in login button

### 📝 Documentation

- Updated readme

---

## Version 0.1.0 - Initial Release

This is the first release of Cutly - a URL shortener service. This version introduces the core functionality of the application.

### ✨ Core Features

- **URL Shortening**: Create short links from long URLs with configurable length (2 to 10 characters)
- **Redirects**: Automatic redirection from short links to original URLs
- **Click Tracking**: Record information about each click, including IP address and User-Agent
- **Optional Authentication**: Support for OIDC authentication (Google, Auth0, Keycloak, and other OIDC-compliant providers)
- **Modern UI**: User interface built with Mantine UI with copy-to-clipboard functionality for short links
- **Link Length Configuration**: Interactive slider to choose short link length with display of possible combinations

### 🛠 Technical Features

- **Stack**: TanStack Start, React, Prisma, SQLite
- **Runtime**: Bun
- **Database**: SQLite with automatic migrations
- **Docker**: Ready-to-use configuration for deployment via Docker Compose
- **URL Validation**: Automatic normalization and validation of URLs before creating short links
- **Deduplication**: Automatic return of existing short link for already shortened URLs

### 📦 Deployment

- Local development support via Bun
- Docker image for containerization
- Docker Compose configuration for quick deployment
- Configuration through environment variables

### ⚠️ Important Notice

**This release is not yet ready for production use.** This is an early version intended for testing and development. Before using in production, it is recommended to:

- Conduct full functionality testing
- Set up database backups
- Configure monitoring and logging
- Perform security audit
- Optimize performance for high loads

### 📝 Known Limitations

- SQLite database may become a bottleneck under high load
- No admin panel for link management
- No statistics and analytics for links
- No API for programmatic access
- No user management and access control

---

**Release Date**: 2025-11-30  
**License**: MIT

