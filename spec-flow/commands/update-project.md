---
description: Analyze the codebase and create/update project.md — the persistent context the spec-flow phases read.
---

# Update Project Documentation

Analyze this codebase and create or update `project.md` in the repository root. This
file is the persistent context that every spec-flow phase (spec, design, implement)
reads, so it should reflect what's actually in the code — evidence-based, not invented.

## Process

1. **Check for existing `project.md`.** If it exists, read it and plan to enhance it
   (preserve hand-written sections and insights); otherwise create it from scratch.
2. **Analyze the codebase.** Explore the directory structure; read key config files
   (package.json, tsconfig.json, requirements.txt, etc.); read 5-10 representative
   source files across modules; check test files; review README/CONTRIBUTING and CI,
   Docker, and env config.
3. **Recognize patterns.** Identify architectural patterns, naming conventions, code
   organization, and dependency management. If 80%+ of files follow a pattern, document
   it as a convention and note exceptions.

## Template

```
## Purpose
[Project purpose and goals]

## Tech Stack
- [Primary technologies with specific versions, e.g. React 18.2.0]

## Project Conventions
### Code Style
[Formatting rules, naming conventions — with real examples]
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
[Key external services, APIs, systems — with links to docs]
```

## Guidelines

- **Be evidence-based.** Only document what you observe; cite file paths and snippets.
  If unsure, say "appears to use" rather than asserting.
- **Be specific.** Versions, actual conventions with examples, real test structure —
  not "uses React" or "has tests".
- **Handle gaps honestly.** If a section's info isn't found, state "Not found in
  current analysis" and recommend documenting it. Don't make assumptions.
- **When updating**, verify existing claims are still accurate, refresh versions, add
  missing sections, and keep valuable existing content.
