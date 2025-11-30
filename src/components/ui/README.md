# shadcn/ui Components

This directory contains UI components from [shadcn/ui](https://ui.shadcn.com), a collection of beautifully designed, accessible, and customizable React components built with Radix UI and Tailwind CSS.

## What is shadcn/ui?

shadcn/ui is not a traditional component library. Instead, it's a collection of re-usable components that you can copy and paste into your project. The components are:

- **Yours to own**: Components live in your codebase, not hidden in node_modules
- **Customizable**: Built with Radix UI and Tailwind CSS, easy to customize
- **Accessible**: Built with accessibility in mind using Radix UI primitives
- **Type-safe**: Written in TypeScript with full type support
- **Composable**: Designed to be composed together to build complex UIs

## Installed Components

The following components are currently installed in this project:

- `button` - Button component with multiple variants
- `input` - Form input component
- `card` - Card container with header, content, and footer sections
- `dropdown-menu` - Dropdown menu for actions and navigation
- `dialog` - Modal dialog component
- `form` - Form components with validation (uses react-hook-form + zod)
- `label` - Accessible form label
- `table` - Table component for data display
- `sonner` - Toast notifications (replaces deprecated toast component)
- `tabs` - Tabbed interface component
- `badge` - Badge component for labels and status indicators
- `select` - Select dropdown component
- `textarea` - Multi-line text input

## Adding New Components

To add a new component from shadcn/ui:

```bash
npx shadcn@latest add [component-name]
```

For example:
```bash
npx shadcn@latest add accordion
```

You can also add multiple components at once:
```bash
npx shadcn@latest add accordion alert avatar
```

## Using Components

Import components from `@/components/ui`:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hello World</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## Customization

All components use CSS variables defined in `src/app/globals.css` for theming. You can customize:

- Colors (primary, secondary, accent, etc.)
- Border radius
- Fonts
- Other design tokens

Components can also be directly modified in this directory since they're part of your codebase.

## Documentation

For detailed documentation on each component, including props, examples, and composition patterns:

**Official Documentation**: [https://ui.shadcn.com](https://ui.shadcn.com)

Browse all available components: [https://ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)

## Best Practices

1. **Use composition**: Combine components to build complex UIs
2. **Follow variants**: Use the built-in variant system for consistency
3. **Maintain accessibility**: Components are accessible by default, keep it that way
4. **Customize thoughtfully**: Modify components when needed, but maintain consistency
5. **Type safety**: Leverage TypeScript types provided with each component

## Project-Specific Guidelines

Per the GenAI-Merch coding standards (see CLAUDE.md):

- Always use shadcn/ui components where possible
- Only create custom components when shadcn/ui doesn't provide a suitable option
- Use Tailwind CSS for all styling (no custom CSS files)
- Follow the component composition patterns established in the codebase
