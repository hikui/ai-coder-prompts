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

The script will interactively prompt you to:
1. **Select source directory** (default: `./prompts`)
2. **Choose target AI tools**:
   - 1 = Claude Code
   - 2 = Gemini CLI
   - 3 = GitHub Copilot
   - 4 = Cursor
   - 5 = All of the above
3. **Specify output directory** (default: `./output`)

**Example run:**
```bash
$ node scripts/sync.js
Enter source prompts directory (default: ./prompts): [Enter]
Select target(s) (comma-separated numbers or 5 for all): 5
Enter base output directory (default: ./output): [Enter]
```

This will create tool-specific prompt formats:
- **Claude Code**: `.md` files with YAML frontmatter in `output/claude-code/commands/`
- **GitHub Copilot**: `.prompt.md` files in `output/github-copilot/prompts/`
- **Cursor**: `.md` files in `output/cursor/commands/`
- **Gemini CLI**: `.toml` files in `output/gemini/commands/`

### 2. Install Prompts to Your AI Tool

After generating the prompts, copy them to the appropriate location for your AI tool:

#### **GitHub Copilot**

1. Copy the generated files to your repository:
   ```bash
   mkdir -p .github/prompts
   cp output/github-copilot/prompts/* .github/prompts/
   ```

2. **Usage**: In GitHub Copilot Chat, reference prompts with:
   ```
   #prompt:update-project
   #prompt:make-spec Add user authentication
   #prompt:make-design
   #prompt:implement
   ```

#### **Cursor**

**Project-level commands** (specific to current project):
```bash
mkdir -p .cursor/commands
cp output/cursor/commands/* .cursor/commands/
```

**User-level commands** (available in all projects):
```bash
mkdir -p ~/.cursor/commands
cp output/cursor/commands/* ~/.cursor/commands/
```

**Usage**: In Cursor Agent chat, type `/` to see all available commands:
```
/update-project
/make-spec Add user authentication
/make-design
/implement
```

#### **Claude Code**

**Project-level commands**:
```bash
mkdir -p .claude/commands
cp output/claude-code/commands/* .claude/commands/
```

**User-level commands**:
```bash
mkdir -p ~/.claude/commands
cp output/claude-code/commands/* ~/.claude/commands/
```

**Usage**: Use as slash commands in Claude Code:
```
/update-project
/make-spec <your requirements>
/make-design
/implement
```

#### **Gemini CLI**

**Project-level commands**:
```bash
mkdir -p .gemini/commands
cp output/gemini/commands/* .gemini/commands/
```

**User-level commands**:
```bash
mkdir -p ~/.gemini/commands
cp output/gemini/commands/* ~/.gemini/commands/
```

**Usage**: Reference commands in Gemini CLI as configured per your setup.

## Available Prompts

### `/update-project`
**Purpose**: Analyze and document your codebase structure, conventions, and context.

**Output**: Creates or updates `project.md` in the project root with comprehensive project documentation including:
- Directory structure and organization
- Code conventions and patterns
- Dependencies and configuration
- Architecture overview

### `/make-spec <your requirements>`
**Purpose**: Transform high-level requirements into detailed technical specifications.

**Usage**: `/make-spec Add user authentication with JWT tokens`

**Output**: Generates `spec-history/active/spec.md` containing:
- Functional requirements breakdown
- Technical constraints and assumptions
- API specifications and data models
- Acceptance criteria

### `/make-design`
**Purpose**: Create technical design based on existing specifications.

**Prerequisites**: Requires `spec-history/active/spec.md` and `project.md`

**Output**: Produces `spec-history/active/design.md` with:
- System architecture decisions
- Component interactions and data flow
- Database schema and API design
- Implementation strategy

### `/implement`
**Purpose**: Generate code implementation following the established design.

**Prerequisites**: Requires `spec-history/active/spec.md`, `spec-history/active/design.md`, and `project.md`

**Output**: Creates actual code files implementing the specified features

### `/make-archive`
**Purpose**: Archive the current active specifications and design documents to a timestamped historical folder.

**Prerequisites**: Requires `spec-history/active/spec.md` (and optionally `spec-history/active/design.md`)

**Output**: Moves active spec and design files to `spec-history/{yyyy-MM-dd}-{sequence}-{title}/`
- Archives are automatically dated and sequenced
- Title is extracted from the specification content
- Active folder is cleared for new work

## Document Organization

This workflow uses a structured approach to manage specifications and designs:

### Active Documents
- **Location**: `spec-history/active/`
- **Files**: `spec.md`, `design.md`
- **Purpose**: Contains the current working specification and design documents

### Historical Archives
- **Location**: `spec-history/{yyyy-MM-dd}-{sequence}-{title}/`
- **Format**: Date-sequenced folders with descriptive titles
- **Purpose**: Preserves historical versions of specifications and designs
- **Examples**: 
  - `spec-history/2024-11-19-01-user-authentication/`
  - `spec-history/2024-11-19-02-payment-integration/`
  - `spec-history/2024-12-01-01-api-rate-limiting/`

### Project Documentation
- **Location**: Project root
- **File**: `project.md`
- **Purpose**: Central project documentation that persists across all spec/design iterations

## Recommended Workflow

### Initial Setup
1. **Document Your Project**
   ```
   /update-project
   ```

### For Each Feature/Requirement
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

5. **Archive Completed Work** (Optional but Recommended)
   ```
   /make-archive
   ```
   This archives the spec and design to a historical folder, clearing the active workspace for the next feature.

### Workflow Benefits
- **Traceability**: Historical archives maintain a complete record of all feature specifications
- **Clean Workspace**: Active folder always contains only current work
- **Easy Reference**: Date-sequenced archives make it easy to find past decisions
- **Version History**: Each feature's spec and design are preserved with timestamps

## License

This project is open source and available under the [MIT License](LICENSE).