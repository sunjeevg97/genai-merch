# Contributing to GenAI-Merch

Thank you for your interest in contributing to GenAI-Merch! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- A Supabase account
- (Optional) Stripe, Printful, and OpenAI accounts for full feature testing

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/genai-merch.git
   cd genai-merch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables in `.env.local`. At minimum, you need:
   - Supabase credentials (URL, anon key, service role key)
   - Database URL

   For full functionality, also configure:
   - Stripe keys
   - OpenAI API key
   - Printful API key
   - Resend API key

4. **Set up the database**
   ```bash
   # Install Supabase CLI
   brew install supabase/tap/supabase

   # Login to Supabase
   supabase login --token YOUR_ACCESS_TOKEN

   # Link your project
   supabase link --project-ref YOUR_PROJECT_REF

   # Push database schema
   npm run db:generate
   supabase db push --linked
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000).

## Creating a New Feature

We use Claude Code to streamline feature development:

1. **Use `/start-feature` command in Claude Code**
   - This creates a feature branch and template documentation

2. **Follow the feature template in `docs/features/`**
   - Document your feature's purpose, architecture, and API changes

3. **Write code following our standards** (see [CLAUDE.md](CLAUDE.md))
   - Follow TypeScript best practices
   - Use existing patterns from the codebase
   - Add proper error handling

4. **Test thoroughly**
   - Manual testing in development
   - Test authentication flows
   - Test database operations
   - Verify third-party integrations

5. **Use `/ship-feature` command to complete**
   - This handles final checks and PR creation

## Code Style

### General Principles

- **TypeScript strict mode** - All code must pass strict type checking
- **Functional components with hooks** - Use React functional components, avoid class components
- **Tailwind for styling** - Use Tailwind CSS utility classes, avoid custom CSS when possible
- **shadcn/ui for UI components** - Use shadcn/ui components for consistent design
- **Descriptive variable names** - Use clear, self-documenting names
- **Comprehensive error handling** - Handle errors gracefully with user-friendly messages

### Code Organization

- Place shared components in `src/components/`
- Place route-specific components in the route directory
- Use `src/lib/` for utility functions and API clients
- Keep components small and focused on a single responsibility

### TypeScript Guidelines

```typescript
// ✅ Good - Explicit types
interface UserData {
  id: string;
  email: string;
  name: string | null;
}

async function getUser(userId: string): Promise<UserData> {
  // Implementation
}

// ❌ Bad - Implicit any
function getUser(userId) {
  // Implementation
}
```

### Component Structure

```typescript
// ✅ Good - Functional component with proper typing
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function CustomButton({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ Bad - Missing types
export function CustomButton({ label, onClick, disabled }) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}
```

### Error Handling

```typescript
// ✅ Good - Comprehensive error handling
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  console.error("API call failed:", error);
  return {
    success: false,
    error: error instanceof Error ? error.message : "An unexpected error occurred"
  };
}

// ❌ Bad - Unhandled errors
const result = await apiCall(); // Could throw
```

### Styling with Tailwind

```typescript
// ✅ Good - Tailwind utilities
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-gray-900">Title</h2>
</div>

// ❌ Bad - Inline styles
<div style={{ display: 'flex', padding: '16px', background: 'white' }}>
  <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Title</h2>
</div>
```

## Git Workflow

### Branch Naming

- Feature branches: `feature/description` (e.g., `feature/ai-design-generator`)
- Bug fixes: `fix/description` (e.g., `fix/auth-redirect-loop`)
- Documentation: `docs/description` (e.g., `docs/api-documentation`)

### Creating a Feature Branch

```bash
# Create feature branches from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Commit Messages

Write clear, descriptive commit messages following this format:

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**

```bash
# Good commit messages
git commit -m "feat: add AI design generation with DALL-E 3"
git commit -m "fix: resolve authentication redirect loop on sign out"
git commit -m "docs: update setup instructions in README"

# Bad commit messages
git commit -m "updates"
git commit -m "fix bug"
git commit -m "WIP"
```

### Pull Request Process

1. **Ensure your branch is up to date**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Squash commits before merging**
   ```bash
   # Squash all commits into one
   git rebase -i main
   # Mark commits as 'squash' except the first one
   ```

3. **Push your branch**
   ```bash
   git push origin your-feature-branch
   ```

4. **Create a Pull Request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what the PR does and why
   - Include screenshots for UI changes
   - Request review from maintainers

5. **Update CHANGELOG.md**
   - Add an entry under "Unreleased" section
   - Include the change type and description
   - Link to the PR and any related issues

### Code Review

- Be respectful and constructive in reviews
- Address all review comments
- Update your PR based on feedback
- Re-request review after making changes

## Testing Guidelines

### Manual Testing Checklist

Before submitting a PR, test the following:

- [ ] Feature works as expected in development
- [ ] No console errors or warnings
- [ ] Responsive design works on mobile and desktop
- [ ] Authentication flows work correctly
- [ ] Database operations complete successfully
- [ ] Error states display appropriate messages
- [ ] Loading states are shown during async operations

### Testing Third-Party Integrations

If your changes affect integrations:

- **Supabase**: Test auth flows, database queries, and storage
- **Stripe**: Test checkout flow in test mode
- **Printful**: Verify product catalog and order submission
- **OpenAI**: Test AI design generation with various prompts

## Documentation

### Code Comments

- Add comments for complex logic
- Document why, not what
- Use JSDoc for public functions and components

```typescript
/**
 * Generates a custom apparel design using AI
 *
 * @param prompt - Natural language description of the desired design
 * @param style - Design style (modern, vintage, minimalist, etc.)
 * @returns URL of the generated design image
 */
export async function generateDesign(prompt: string, style: string): Promise<string> {
  // Implementation
}
```

### Feature Documentation

For significant features, create documentation in `docs/features/`:

```markdown
# Feature Name

## Overview
Brief description of the feature

## Architecture
How the feature is implemented

## API Endpoints
List of new/modified API routes

## Database Changes
Schema changes if any

## Configuration
Required environment variables or settings
```

## Getting Help

- Check existing [issues](https://github.com/YOUR_ORG/genai-merch/issues)
- Join our community discussions
- Review the [architecture documentation](docs/architecture.md)
- Read the [project constitution](CLAUDE.md)

## Questions?

If you have questions about contributing, please:
- Open a discussion in GitHub Discussions
- Contact the maintainers
- Review existing documentation

Thank you for contributing to GenAI-Merch!
