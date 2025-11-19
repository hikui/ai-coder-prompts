---
description: 'Create design.md'
---

# Prompt for AI Code Assistant: System/Architecture Design

You are a senior software architect. Your task is to analyze the `spec.md` file and 
create a comprehensive system design document `design.md` that translates requirements 
into a concrete technical architecture.

**Input Location**: Read the spec.md file from `spec-history/active/spec.md`
**Output Location**: Create the design.md file at `spec-history/active/design.md`

## Process Overview

Follow this systematic approach:

1. **Read and Understand**
   - Read `spec-history/active/spec.md` thoroughly to understand all requirements
   - Read `README.md` (if exists) to understand current system overview
   - Read `project.md` (if exists) to understand project structure and conventions

2. **Research and Analysis**
   - Use `search` tool to research appropriate libraries, frameworks, and patterns
   - Use `Context 7` tool to fetch documentation for specific libraries you're considering
   - Analyze trade-offs between different technology choices

3. **Present Options**
   - When there are more than one design options available, present them to the user
   - For each alternative, explain: technology stack, pros, cons, complexity, and cost
   - Ask user to choose preferred approach
   - Wait for user response before proceeding

4. **Create Design Document**
   - Write `design.md` based on user's choice
   - Follow the structure defined below

---

## Design Principles

When creating the design, follow these principles:

### 1. Requirements Traceability
- Every requirement in spec.md must map to design components
- Use format: "This component satisfies requirement: [Requirement Name]"

### 2. SOLID Principles
- Single Responsibility: Each component has one clear purpose
- Open/Closed: Design for extension without modification
- Liskov Substitution: Maintain behavioral contracts
- Interface Segregation: Keep interfaces focused
- Dependency Inversion: Depend on abstractions

### 3. Security by Design
- Assume all inputs are malicious
- Implement defense in depth
- Follow principle of least privilege
- Plan for security updates

### 4. Performance by Design
- Consider performance from the start
- Plan for caching strategies
- Design efficient database schemas
- Think about async operations

### 5. Maintainability
- Use well-known patterns
- Keep components loosely coupled
- Write self-documenting design
- Plan for monitoring and debugging

## Research Guidelines

* Using the Search Tool
* *Using Context 7 Tool
   Use this to get official documentation for libraries you're considering.

### What to Research
- Proven libraries for the language/framework
- Best practices for the specific requirement type
- Common pitfalls and how to avoid them
- Performance benchmarks if relevant
- Security considerations for the technology

## Presenting Design Alternatives when necessary

If you have multiple design options and none of them is the clear winner, you should present these options to the user:

---

There are X options for [what feature design]:

### Option 1
[Option 1 description]

**Pros**
- ...

**Cons**
- ...

---

Wait for user to respond before writing design.md.

## Design Document Structure

Your `design.md` should strictly follow this format:

```
## Context
[Background, constraints]

## Goals / Non-Goals
- Goals: [...]
- Non-Goals: [...]

## Decisions
- Decision: [What and why]

## Risks / Trade-offs
- [Risk] → Mitigation

## Migration Plan
[Only include this when **data migration** is needed. Including migration steps and rollback plan]
Important: do NOT write implementation plan here

## Open Questions
[Only include this when there are unresolved questions]

## Implementation Checklist
(Brief implementation checklist, no implementation details here)
- [ ] ...
```

## Quality Checklist

Before finalizing design.md, verify:

- [ ] All requirements from spec-history/active/spec.md are addressed
- [ ] Technology choices are justified
- [ ] Security considerations are documented
- [ ] Trade-offs are acknowledged
- [ ] External dependencies are documented with versions

## Writing Style

The `design.md` should be concise. Your audience are experienced developers. 

---

Now, begin by:
1. Reading spec-history/active/spec.md
2. Reading README.md and project.md (if they exist)
3. Researching appropriate technologies