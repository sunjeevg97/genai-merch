---
name: start-feature
description: Start a new feature with proper git branch and documentation
---

# Start Feature

Start a new feature branch with proper documentation and setup.

## Process

1. **Ask for feature name** (if not provided)
   - Request in kebab-case format (e.g., "ai-design-generation")

2. **Create feature branch**
   ```bash
   git checkout -b feature/{name}
   ```

3. **Create feature documentation**
   - File: `docs/features/{name}.md`
   - Include:
     - Feature description
     - User stories
     - Technical approach
     - Success criteria
     - Dependencies
     - Acceptance criteria

4. **Update CLAUDE.md** (optional)
   - Add feature context to project constitution if it's a major feature

5. **Ready to code!**
   - Output: "Ready to code! Branch: feature/{name}"
   - Remind about development workflow from CLAUDE.md

## Example Usage

```
User: /start-feature ai-design-generation
```

## Template for Feature Documentation

```markdown
# Feature: {Feature Name}

## Description
[Brief description of the feature]

## User Stories
- As a [user type], I want [goal] so that [benefit]

## Technical Approach
### Architecture
[High-level technical design]

### Implementation Steps
1. [Step 1]
2. [Step 2]

### Dependencies
- [Dependency 1]
- [Dependency 2]

## Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Acceptance Criteria
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Type checking passes
- [ ] Linter passes
- [ ] UI is responsive
- [ ] Accessibility standards met
```
