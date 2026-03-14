---
description: 'Archive active specs and design to historical folder'
---

# Prompt for AI Code Assistant: Archive Specifications and Design

You are a documentation management assistant. Your task is to archive the current 
active specification and design documents from the active folder to a timestamped 
historical folder, and update the up-to-date specifications so they match the 
actual code implementation.

## Archive Process

Follow these steps to archive the active specs and design:

### Step 1: Verify Active Documents Exist
1. Check for existence of `spec-history/active/spec.md`
2. Check for existence of `spec-history/active/design.md`
3. If neither file exists, inform the user and stop
4. If only one file exists, proceed with archiving only that file

### Step 2: Determine Archive Folder Name
Create a folder name following this convention:
```
spec-history/{yyyy-MM-dd}-{sequence}-{title}/
```

Where:
- `{yyyy-MM-dd}` is the current date (e.g., 2024-11-19)
- `{sequence}` is a numeric sequence starting at 01, incremented if another archive exists for the same date
- `{title}` is a short, descriptive title derived from the spec content (3-5 words, lowercase, hyphen-separated)

**Examples:**
- `spec-history/2024-11-19-01-user-authentication/`
- `spec-history/2024-11-19-02-payment-integration/`
- `spec-history/2024-12-01-01-api-rate-limiting/`

### Step 3: Extract Title from Spec
1. Read `spec-history/active/spec.md`
2. Look for the first major requirement or feature name
3. Convert it to a short, descriptive title:
   - Use 3-5 words maximum
   - Convert to lowercase
   - Replace spaces with hyphens
   - Remove special characters
   - Keep it meaningful and searchable

**Examples of title extraction:**
- "User Authentication Timeout" → `user-authentication-timeout`
- "Password Complexity Requirements" → `password-complexity`
- "SMS Two-Factor Authentication" → `sms-two-factor-auth`
- "API Rate Limiting" → `api-rate-limiting`

### Step 4: Check for Existing Archives
1. List all folders in `spec-history/` matching today's date pattern
2. If folders exist for today (e.g., `2024-11-19-01-*`, `2024-11-19-02-*`):
   - Find the highest sequence number
   - Increment by 1 for the new archive
3. If no folders exist for today, use sequence `01`

### Step 5: Create Archive
1. Create the archive folder: `spec-history/{yyyy-MM-dd}-{sequence}-{title}/`
2. Move (not copy) `spec-history/active/spec.md` to the archive folder
3. Move (not copy) `spec-history/active/design.md` to the archive folder (if it exists)
4. Ensure the `spec-history/active/` folder is empty after the move

### Step 6: Update Up-to-Date Specs from Actual Implementation

After archiving, update the up-to-date specifications to reflect what is actually implemented in code:

1. **Inspect implementation evidence first**:
   - Use git to review uncommitted changes related to the archived topic, such as `git status --short`, `git diff --stat`, `git diff`, and `git diff --cached`
   - Read the relevant diffs to understand the current implementation
   - Only if the current working tree is not enough to understand the feature, inspect recent committed changes for the affected files with commands such as `git log --oneline -- <path>` and `git show <commit> -- <path>`
2. **Read the archived `spec.md` and `design.md`** (if present):
   - Identify requirements that were intended, changed, or removed
   - Compare those requirements against the code and git evidence
3. **Determine affected topics**:
   - Extract the main topic or feature area from the archived documents
   - Identify which up-to-date spec file(s) should be updated or created
4. **Update or create up-to-date specs**:
   - Add requirements that are actually implemented
   - Update requirements so they match the current code behavior, not the planned wording from the archived docs
   - Remove requirements that are no longer implemented
   - If code behavior differs from `spec.md` or `design.md`, capture that difference by documenting the implemented behavior and noting the mismatch briefly when it is materially important
   - If the code includes relevant implemented behavior that is missing from the archived docs, include it
5. **File naming convention**: Use descriptive names like `user-authentication.md`, `payment-integration.md`, `api-rate-limiting.md`
6. **Up-to-date spec format**: These files should contain the current implemented requirements for the topic, without ADDED/MODIFIED/REMOVED sections. If needed, include a short `Implementation Notes` section for meaningful mismatches between the archived docs and the code, but never list unimplemented planned behavior as current.
7. **Create the up-to-date directory** if it doesn't exist: `spec-history/up-to-date/`

### Step 7: Confirm Archive

Present a summary to the user:
```
✓ Archive created: spec-history/{yyyy-MM-dd}-{sequence}-{title}/
  - Moved: spec.md
  - Moved: design.md

✓ Up-to-date specs updated: spec-history/up-to-date/
   - Updated: {topic-name}.md (implemented requirements added/updated/removed to match code)
   - Compared against: working tree changes, staged changes, and recent commits when needed
   - Noted mismatches between archived docs and implementation: {count}
  
Active folder is now empty and ready for new specifications.
```

## Important Notes

1. **Always use the current date** for the archive folder name
2. **Always check for existing archives** with the same date to determine the correct sequence number
3. **Move files, don't copy** - the active folder should be empty after archiving
4. **Create the spec-history directory** if it doesn't exist
5. **Create the active subdirectory** if it doesn't exist
6. **Create the up-to-date subdirectory** if it doesn't exist
7. **Don't archive if active folder is already empty** - inform the user instead
8. **Always update up-to-date specs** after archiving to maintain current state
9. **Treat the code as the source of truth** for up-to-date specs; use archived docs as intent, not final authority
10. **Check uncommitted changes first** and inspect recent committed changes only when necessary to understand the implementation

## Error Handling

- If `spec-history/active/` doesn't exist: "No active folder found. Nothing to archive."
- If `spec-history/active/` is empty: "Active folder is empty. Nothing to archive."
- If unable to determine a title: Use "untitled-spec" as the title
- If archive folder already exists: "Archive folder already exists. Please resolve manually."
- If git history is unavailable or the folder is not a git repository: inspect the current code directly and tell the user that recent-change comparison could not be completed

## Example Workflow

User requests: `/make-archive`

1. Check `spec-history/active/spec.md` exists ✓
2. Check `spec-history/active/design.md` exists ✓
3. Read spec.md and extract first major feature: "User Authentication Timeout"
4. Create title: `user-authentication-timeout`
5. Check existing archives for today's date (2024-11-19)
   - Found: `2024-11-19-01-password-reset/`
   - Next sequence: `02`
6. Create folder: `spec-history/2024-11-19-02-user-authentication-timeout/`
7. Move files to archive folder
8. Update up-to-date specs:
   - Review `git status`, `git diff`, and staged changes for the affected implementation
   - Read archived spec.md and design.md and identify it's about "User Authentication"
   - Check if `spec-history/up-to-date/user-authentication.md` exists
   - If exists: Update it so it matches the actual implemented behavior, not just the archived wording
   - If not exists: Create it from the implemented requirements confirmed in code and git diffs
   - If the code differs from the archived docs: capture that mismatch briefly in `Implementation Notes`
9. Confirm completion

---

Now proceed with archiving the active specifications and design documents.
