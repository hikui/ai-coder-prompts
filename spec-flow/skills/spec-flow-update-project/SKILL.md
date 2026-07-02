---
name: spec-flow-update-project
description: Analyze the current codebase and create or update project.md, the persistent project context used by the spec-flow spec, design, and implementation phases. Use before running spec-flow in a repository, or whenever project conventions have changed.
---

# Update Project Documentation

Analyze this codebase and create or update `project.md` in the repository root. This
file is the persistent context that every spec-flow phase (spec, design, implement)
reads, so it should reflect what's actually in the code: evidence-based, not invented.

## Process

1. **Check for existing `project.md`.** If it exists, read it and plan to enhance it
   while preserving hand-written sections and useful existing insights.
2. **Analyze the codebase.** Explore the directory structure; read key config files
   such as `package.json`, `tsconfig.json`, `requirements.txt`, and similar files;
   read 5-10 representative source files across modules; check test files; review
   `README`, `CONTRIBUTING`, CI, Docker, and environment config when present.
3. **Recognize patterns.** Identify architectural patterns, naming conventions, code
   organization, and dependency management. If most files follow a pattern, document
   it as a convention and note exceptions.
4. **Write or update `project.md`.** Keep claims tied to observed evidence. Use paths
   and short examples where they help future agents follow the project accurately.

## Template

```md
## Purpose
[Project purpose and goals]

## Tech Stack
- [Primary technologies with specific versions, e.g. React 18.2.0]

## Project Conventions
### Code Style
[Formatting rules, naming conventions, with real examples]

### Architecture Patterns
[Architectural decisions and patterns observed]

### Testing Strategy
[Testing approach and structure]

### Git Workflow
[Branching strategy and commit conventions]

## Domain Context
[Domain knowledge an assistant needs]

## Important Constraints
[Technical, business, or regulatory constraints]

## External Dependencies
[Key external services, APIs, systems, with links to docs]
```

## Guidelines

- **Be evidence-based.** Only document what you observe; cite file paths and concise
  snippets. If unsure, say "appears to use" rather than asserting.
- **Be specific.** Include versions, actual conventions, and real test structure.
- **Handle gaps honestly.** If a section's info is not found, state "Not found in
  current analysis" and recommend documenting it. Do not make assumptions.
- **When updating**, verify existing claims are still accurate, refresh versions, add
  missing sections, and keep valuable existing content.
