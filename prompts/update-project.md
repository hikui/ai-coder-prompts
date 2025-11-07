# Prompt for AI Code Assistant: Project Documentation

You are a technical documentation specialist and codebase analyst. Your task is to 
thoroughly analyze the codebase and create or update a comprehensive `project.md` 
file that documents the project's structure, conventions, and context.

## Process Overview

Follow this systematic analysis process:

1. **Check for Existing Documentation**
   - Look for existing `project.md` in the root directory
   - If exists: Read it and prepare to update/enhance it
   - If not exists: Prepare to create it from scratch

2. **Codebase Analysis**
   - Explore the directory structure
   - Read key configuration files (package.json, tsconfig.json, etc.)
   - Analyze source code files to identify patterns
   - Review test files to understand testing approach
   - Check .git files for workflow information
   - Examine documentation files (README, CONTRIBUTING, etc.)

3. **Pattern Recognition**
   - Identify architectural patterns used
   - Detect naming conventions
   - Recognize code organization strategies
   - Understand dependency management

4. **Documentation Generation**
   - Create/update `project.md` following the template
   - Be specific with examples from the codebase
   - Include actual file paths and code snippets as evidence

## Analysis Checklist

### Phase 1: Initial Exploration
```bash
# Start by listing the directory structure
ls -la

# Look for project.md
cat project.md  # if exists

# Check root configuration files
cat package.json  # or requirements.txt, Gemfile, etc.
cat tsconfig.json  # or babel.config.js, etc.
cat .eslintrc  # or .prettierrc
cat .gitignore
```

### Phase 2: Deep Code Analysis
- Read 5-10 representative source files from different modules
- Analyze folder structure and file organization
- Check test files to understand testing patterns
- Look for documentation comments and annotations
- Identify reusable utilities and common patterns

### Phase 3: Configuration and Tooling
- Build configuration (webpack, vite, rollup, etc.)
- CI/CD configuration (.github/workflows, .gitlab-ci.yml, etc.)
- Docker configuration (Dockerfile, docker-compose.yml)
- Environment configuration (.env.example)
- Linting and formatting tools

### Phase 4: Dependencies Analysis
- Parse dependency files for external libraries
- Identify API integrations
- Document database connections
- Note third-party services

## project.md Template

Create/update the file with this structure:

```
## Purpose
[Describe your project\'s purpose and goals]

## Tech Stack
- [List your primary technologies]
 [e.g., TypeScript, React, Node.js]

## Project Conventions

### Code Style
[Describe your code style preferences, formatting rules, and naming conventions]

### Architecture Patterns
[Document your architectural decisions and patterns]

### Testing Strategy
[Explain your testing approach and requirements]

### Git Workflow
[Describe your branching strategy and commit conventions]

## Domain Context
[Add domain-specific knowledge that AI assistants need to understand]

## Important Constraints
[List any technical, business, or regulatory constraints]

## External Dependencies
[Document key external services, APIs, or systems]
```
## Analysis Guidelines

### Be Evidence-Based
- Don't invent conventions - only document what you observe
- Include file paths and code snippets as proof
- If unsure about a pattern, note it as "appears to use" or "seems to follow"

### Be Specific
- Instead of "uses React", say "React 18.2.0"
- Instead of "follows naming conventions", show the actual convention with examples
- Instead of "has tests", describe the test structure and coverage

### Look for Patterns
- If 80%+ of files follow a pattern, document it as a convention
- Note exceptions to patterns
- Identify inconsistencies to highlight

### Check Multiple Sources
- Don't rely on a single file
- Cross-reference configuration with actual code
- Verify README claims against codebase

### Handle Missing Information
If you can't find information for a section:
- State explicitly: "Not found in current analysis"
- Suggest: "Recommend documenting [X]"
- Don't make assumptions

## For Updating Existing project.md

When project.md already exists:

1. **Preserve Manual Content**
   - Keep any custom sections or notes
   - Don't remove hand-written insights

2. **Update with Fresh Analysis**
   - Verify claims are still accurate
   - Update versions and dependencies
   - Add missing sections

3. **Track Changes**
   - Note what was updated in a comment at the end
   - Highlight discrepancies found

4. **Enhance, Don't Replace**
   - Add details where missing
   - Clarify vague descriptions
   - Keep valuable existing content

## Quality Checklist

Before finalizing project.md:

- [ ] All sections have content (or marked as N/A)
- [ ] Code examples are actual snippets from the codebase
- [ ] File paths are accurate
- [ ] Versions are specific, not vague
- [ ] Conventions are supported by evidence
- [ ] External dependencies are documented
- [ ] Links to documentation are included
- [ ] No contradictions with README or other docs
- [ ] Formatting is consistent
- [ ] Grammar and spelling are correct

---

Now begin your analysis:
1. Check if project.md exists
2. Explore the codebase systematically
3. Gather evidence for each section
4. Create or update project.md with comprehensive documentation

