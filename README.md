# Lolla Engine

Lolla Engine is a cross-platform desktop application built with Electron.

## Features
- Cross-platform support
- Modular engine architecture
- Integrated ChatSection

## Installation

```bash
npm install
```

## Running the Application

```bash
npm start
```

## Publishing to GitHub Packages

This project is configured to be published to GitHub Packages. To publish a new version:

1. Ensure you have a personal access token (PAT) with `write:packages` scope.
2. Authenticate with GitHub Packages:
   ```bash
   npm login --scope=@TugraYaka --registry=https://npm.pkg.github.com
   ```
3. Publish:
   ```bash
   npm publish
   ```
