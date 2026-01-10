# MCP Server Setup Guide

This project is configured with multiple Model Context Protocol (MCP) servers to enhance Claude's capabilities.

## Configured MCP Servers

### 1. **GitHub MCP**
- **Purpose**: Repository operations, PR management, issue tracking
- **Package**: `@modelcontextprotocol/server-github`
- **Capabilities**:
  - Create/update files
  - Manage pull requests
  - Search code and issues
  - Manage branches

### 2. **Stripe MCP**
- **Purpose**: Payment processing and Stripe API operations
- **Package**: `@stripe/agent-toolkit`
- **Capabilities**:
  - Manage products and prices
  - Handle subscriptions
  - Process refunds
  - View customer data
  - Create checkout sessions

### 3. **Supabase MCP**
- **Purpose**: Database queries and operations
- **Package**: `@supabase/mcp-server-supabase`
- **Capabilities**:
  - Query database tables
  - Execute RLS policies
  - Manage auth users
  - Storage operations

### 4. **Playwright MCP**
- **Purpose**: Browser automation and testing
- **Package**: `@executeautomation/playwright-mcp-server`
- **Capabilities**:
  - Automated browser testing
  - Screenshot capture
  - Form interaction testing
  - Navigation testing

### 5. **Puppeteer MCP**
- **Purpose**: Headless browser automation
- **Package**: `@modelcontextprotocol/server-puppeteer`
- **Capabilities**:
  - Web scraping
  - PDF generation
  - Screenshot automation
  - Browser testing

### 6. **Sequential Thinking MCP**
- **Purpose**: Enhanced reasoning and step-by-step problem solving
- **Package**: `@modelcontextprotocol/server-sequential-thinking`
- **Capabilities**:
  - Break down complex problems
  - Step-by-step reasoning
  - Enhanced planning

### 7. **Brave Search MCP**
- **Purpose**: Web search capabilities
- **Package**: `@modelcontextprotocol/server-brave-search`
- **Capabilities**:
  - Real-time web search
  - Current information lookup
  - Research assistance

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# GitHub MCP (if not already set)
GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"

# Stripe MCP (already configured)
STRIPE_SECRET_KEY="sk_test_your_key_here"

# Supabase MCP (already configured)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# Brave Search MCP (optional - for web search)
BRAVE_API_KEY="your_brave_api_key_here"
```

## Getting API Keys

### GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `read:org`, `read:user`
4. Copy the token and add to `.env.local`

### Brave Search API Key (Optional)
1. Sign up at https://brave.com/search/api/
2. Get your API key from the dashboard
3. Add to `.env.local`

## Activating MCP Servers

The MCP servers are configured in `.mcp.json` and will be automatically loaded by Claude Code when:

1. You restart your Claude Code session, or
2. Claude Code detects the `.mcp.json` file

## Testing MCP Servers

Once configured, you can test each server by asking Claude to:

- **GitHub**: "List the recent commits in this repository"
- **Stripe**: "Show me the products in my Stripe account"
- **Supabase**: "Query the Product table and show me 5 products"
- **Playwright**: "Take a screenshot of the homepage"
- **Sequential Thinking**: "Help me plan a complex feature implementation"
- **Brave Search**: "Search for the latest Next.js 14 documentation"

## Troubleshooting

### MCP Server Not Found
If Claude can't access an MCP server:
1. Ensure the environment variable is set in `.env.local`
2. Restart your Claude Code session
3. Check that npx can access the package: `npx -y @package/name --version`

### Permission Errors
- GitHub: Verify your PAT has the required scopes
- Stripe: Ensure you're using the secret key (not publishable key)
- Supabase: Verify service role key (not anon key)

### Package Installation Issues
If npx fails to install a package:
```bash
# Clear npx cache
npx clear-npx-cache

# Or manually install globally
npm install -g @package/name
```

## Notes on Missing MCPs

Some requested MCPs weren't available in official repositories:
- **Context7**: Not found in npm registry
- **Firecrawl**: Not available as MCP server (use Puppeteer/Playwright instead)
- **Serena**: Not found in official MCP registry

I've included **Brave Search** as a web research alternative, and **Sequential Thinking** for enhanced reasoning capabilities.

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use service role keys carefully** - Only for server-side operations
3. **Rotate API keys regularly** - Especially for production
4. **Use test/sandbox keys** - For development (Stripe test keys, etc.)

## Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Claude Code MCP Guide](https://github.com/anthropics/claude-code)
- [GitHub MCP Server](https://github.com/modelcontextprotocol/servers)
- [Stripe Agent Toolkit](https://docs.stripe.com/agents)
