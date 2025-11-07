# AI Coder Prompts

A collection of specialized AI prompts designed for structured, specification-based software development. These prompts enable a systematic approach to building software by breaking down the development process into clear, manageable phases.

## Overview

This repository provides AI coder prompts that implement a **spec-driven development workflow**, helping you:

- Document and understand existing codebases
- Create detailed technical specifications
- Design robust system architectures
- Implement features systematically

The workflow follows a proven methodology: **Analyze → Specify → Design → Implement**

## Quick Start

### 1. Sync Prompts to Your AI Tools

Use the sync script to generate prompts in formats compatible with various AI coding tools:

```bash
node scripts/sync.js
```

This will create tool-specific prompt formats for:
- **Claude Projects** (`.md` with YAML frontmatter)
- **GitHub Copilot** (`.prompt.md` files)  
- **Cursor** (plain `.md` files)
- **Gemini CLI** (`.toml` files)

### 2. Import Prompts to Your AI Tool

After syncing, import the generated prompts into your preferred AI coding assistant and use them as slash commands.

## Available Prompts

### `/update-project`
**Purpose**: Analyze and document your codebase structure, conventions, and context.

**Output**: Creates or updates `project.md` with comprehensive project documentation including:
- Directory structure and organization
- Code conventions and patterns
- Dependencies and configuration
- Architecture overview

### `/make-spec <your requirements>`
**Purpose**: Transform high-level requirements into detailed technical specifications.

**Usage**: `/make-spec Add user authentication with JWT tokens`

**Output**: Generates `spec.md` containing:
- Functional requirements breakdown
- Technical constraints and assumptions
- API specifications and data models
- Acceptance criteria

### `/make-design`
**Purpose**: Create technical design based on existing specifications.

**Prerequisites**: Requires `spec.md` and `project.md`

**Output**: Produces `design.md` with:
- System architecture decisions
- Component interactions and data flow
- Database schema and API design
- Implementation strategy

### `/implement`
**Purpose**: Generate code implementation following the established design.

**Prerequisites**: Requires `spec.md`, `design.md`, and `project.md`

**Output**: Creates actual code files implementing the specified features

## Recommended Workflow

1. **Document Your Project**
   ```
   /update-project
   ```

2. **Define Requirements**
   ```
   /make-spec <describe your feature or requirement>
   ```

3. **Create Technical Design**
   ```
   /make-design
   ```

4. **Implement the Solution**
   ```
   /implement
   ```

## License

This project is open source and available under the [MIT License](LICENSE).