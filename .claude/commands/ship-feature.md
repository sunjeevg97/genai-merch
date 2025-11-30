---
name: ship-feature
description: Complete and ship a feature with quality checks
---

# Ship Feature

Complete a feature and prepare it for merging with comprehensive quality checks.

## Pre-Flight Checks

### 1. Run Type Checking
```bash
npm run type-check
```
- Ensure no TypeScript errors
- Fix any type issues before proceeding

### 2. Run Linter
```bash
npm run lint
```
- Check for code quality issues
- If errors found, run `npm run lint:fix` to auto-fix

### 3. Run Build
```bash
npm run build
```
- Ensure production build succeeds
- Check for any build-time errors

### 4. Review Code Quality
- Check for console.log statements
- Verify error handling is in place
- Ensure all TODOs are addressed or documented
- Confirm no sensitive data is committed

## Documentation Updates

### 5. Update CHANGELOG.md
- Add entry under "Unreleased" section
- Follow format:
  ```markdown
  ### Added
  - Feature description with PR link

  ### Changed
  - Any breaking changes

  ### Fixed
  - Bug fixes
  ```

### 6. Update Feature Documentation
- Mark feature as complete in docs/features/{name}.md
- Add implementation notes
- Document any deviations from original plan

## Commit and Ship

### 7. Commit All Changes
```bash
git add .
git commit -m "feat: descriptive commit message"
```
- Follow conventional commits format
- Include ticket/issue number if applicable

### 8. Ask User: Merge Strategy
- **Option A**: Merge directly to main
  ```bash
  git checkout main
  git merge feature/{name}
  git push origin main
  ```

- **Option B**: Create Pull Request
  ```bash
  git push origin feature/{name}
  # Then create PR via GitHub CLI or web interface
  ```

### 9. Clean Up (after merge)
```bash
git branch -d feature/{name}
```

## Post-Ship

- Update project documentation if needed
- Notify team members
- Monitor for any issues
- Close related issues/tickets

## Example Usage

```
User: /ship-feature
```

## Quality Checklist

Before shipping, ensure:
- [ ] Type check passes (`npm run type-check`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] All tests pass (when implemented)
- [ ] Code reviewed (if team environment)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No console.log or debugging code
- [ ] Environment variables documented
- [ ] Database migrations created (if needed)
