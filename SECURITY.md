# Security Policy

## Supported versions

Only the latest release receives security fixes.

## Reporting a vulnerability

Please report a vulnerability privately through GitHub Security Advisories instead of opening a public issue. Include the affected version, a minimal reproduction, and the expected impact. Do not attach sensitive real-world documents; use a synthetic sample.

## Security model

- Files are untrusted input and are never evaluated as JavaScript.
- DOCX alternative HTML chunks, comments, and tracked changes are not rendered.
- External resources referenced by DOCX files are removed.
- Manifest V3 CSP restricts scripts, workers, connections, images, and fonts to packaged or in-memory resources.
- The manifest requests no extension or host permissions.
- Dependencies are bundled locally and checked with `npm audit` before release.

PDF and DOCX parsers are complex. A malformed file may still exhaust browser memory or trigger a bug in an upstream parser. Keep the browser and FilePassport updated.
