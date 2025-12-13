# GenAI-Merch Product Roadmap

This roadmap outlines the development phases, sprints, and key deliverables for the GenAI-Merch platform.

## Phase 1: MVP Launch (8 Weeks)

### ✅ Sprint 1-2: Foundation (COMPLETE)

**Weeks 1-2 | Status: COMPLETE**

**Deliverables:**
- ✅ Project setup and configuration
  - Next.js 14 with TypeScript
  - Supabase integration
  - Prisma ORM setup
  - Tailwind CSS + shadcn/ui
- ✅ Database schema design
  - User, Organization, OrganizationMember
  - BrandProfile, Design, Order, GroupOrder
- ✅ Authentication system
  - Supabase Auth integration
  - Sign up / Sign in pages
  - Protected routes
  - Session management
- ✅ Deployment infrastructure
  - Vercel configuration
  - Environment variable management
  - Database migrations via Supabase CLI
- ✅ Documentation
  - README.md with setup instructions
  - CONTRIBUTING.md with development guidelines
  - Architecture documentation
  - Environment variable templates

**Outcome:** Solid foundation ready for feature development

---

### 🔄 Sprint 3-4: Design Studio MVP (IN PROGRESS)

**Weeks 3-4 | Status: IN PROGRESS**

**Goal:** Enable users to create custom apparel designs with logo uploads

**Deliverables:**
- [ ] Canvas-based design editor
  - Fabric.js integration
  - Interactive logo positioning
  - Resize and rotation controls
  - Undo/redo functionality
- [ ] File upload system
  - Supabase Storage integration
  - Client-side validation (type, size)
  - Server-side DPI validation
  - Image optimization
- [ ] Mockup system
  - T-shirt mockups (front, back, side)
  - Multiple color variants
  - Print area boundaries
- [ ] Design management
  - Save designs to database
  - Load existing designs
  - Auto-save functionality
  - Design list/gallery view
- [ ] API routes
  - POST /api/designs
  - GET /api/designs
  - GET /api/designs/[id]
  - PATCH /api/designs/[id]
  - DELETE /api/designs/[id]
  - POST /api/uploads/logo

**Success Metrics:**
- Users can upload and position logos
- Designs save with full metadata
- No critical bugs or console errors

**Feature Doc:** [docs/features/design-studio-mvp.md](features/design-studio-mvp.md)

---

### ⏳ Sprint 5-6: Checkout & Print-on-Demand Integration

**Weeks 5-6 | Status: PLANNED**

**Goal:** Enable users to order physical merchandise

**Deliverables:**
- [ ] Stripe payment integration
  - Checkout session creation
  - Payment confirmation webhooks
  - Order status updates
- [ ] Printful integration
  - Product catalog sync
  - Order submission to Printful
  - Fulfillment status webhooks
  - Shipping notifications
- [ ] Shopping cart
  - Add designs to cart
  - Product variant selection (size, color)
  - Quantity management
  - Cart persistence
- [ ] Order management
  - Order history page
  - Order status tracking
  - Shipping information display
  - Receipt/invoice generation
- [ ] Email notifications
  - Resend integration
  - Order confirmation emails
  - Shipping notification emails
  - Order status updates

**Success Metrics:**
- Complete checkout flow works end-to-end
- Orders successfully submitted to Printful
- Email notifications sent reliably

---

### ⏳ Sprint 7-8: Group Storefront

**Weeks 7-8 | Status: PLANNED**

**Goal:** Enable group ordering for teams and events

**Deliverables:**
- [ ] Group order creation
  - Create group order campaign
  - Set deadline and pricing
  - Configure available products
  - Generate shareable link
- [ ] Group storefront
  - Public storefront page
  - Join group order flow
  - Individual customization options
  - Participant list
- [ ] Deadline management
  - Countdown timer
  - Automatic closure at deadline
  - Bulk order submission
  - Coordinator notifications
- [ ] Group coordination
  - Invite team members
  - Track participation
  - Manage group settings
  - Export participant list
- [ ] Bulk fulfillment
  - Aggregate individual orders
  - Submit bulk order to Printful
  - Individual shipping addresses
  - Tracking per participant

**Success Metrics:**
- Groups can create and share storefronts
- Multiple users can join and order
- Bulk orders process correctly

---

## Phase 2: Enhanced Features (4 Weeks)

### ⏳ Sprint 9-10: AI Design Generation

**Weeks 9-10 | Status: PLANNED**

**Goal:** Enable AI-powered design creation with DALL-E 3

**Deliverables:**
- [ ] AI prompt interface
  - Natural language prompt input
  - Style selector
  - Design parameter controls
- [ ] DALL-E 3 integration
  - OpenAI API integration
  - Image generation
  - Design optimization for print
- [ ] Design refinement
  - Regenerate variations
  - Edit AI-generated designs
  - Combine with uploaded logos
- [ ] AI design gallery
  - Browse community designs
  - Save favorites
  - Remix existing designs

**Success Metrics:**
- AI generates print-ready designs
- 80% of generated designs meet DPI requirements
- Users can refine and customize AI designs

---

### ⏳ Sprint 11-12: Organization & Brand Management

**Weeks 11-12 | Status: PLANNED**

**Goal:** Multi-tenant organization features

**Deliverables:**
- [ ] Organization dashboard
  - Create organization
  - Invite team members
  - Role-based permissions (owner, admin, member)
  - Organization settings
- [ ] Brand profile management
  - Upload brand logo
  - Define color palette
  - Set brand fonts
  - Brand guidelines
- [ ] Design library
  - Organization-wide design storage
  - Shared templates
  - Brand asset library
  - Access controls
- [ ] Team collaboration
  - Share designs within org
  - Comment on designs
  - Approval workflows
  - Design version history

**Success Metrics:**
- Organizations can manage team members
- Brand profiles enforce consistent branding
- Teams collaborate on designs

---

## Phase 3: Scale & Optimize (Ongoing)

### ⏳ Performance Optimization

**Timeline: Ongoing**

**Focus Areas:**
- [ ] Image optimization
  - WebP format with fallbacks
  - CDN integration
  - Lazy loading
- [ ] Database optimization
  - Query optimization
  - Proper indexing
  - Connection pooling
- [ ] Caching strategy
  - Redis for product catalog
  - Edge caching for static assets
  - API response caching
- [ ] Code splitting
  - Route-based splitting
  - Component lazy loading
  - Bundle size optimization

---

### ⏳ Mobile Experience

**Timeline: TBD**

**Focus Areas:**
- [ ] Responsive design studio
  - Touch-optimized controls
  - Mobile canvas interactions
  - Simplified mobile UI
- [ ] Mobile app (React Native)
  - Native mobile experience
  - Push notifications
  - Mobile file uploads

---

### ⏳ Advanced Features

**Timeline: TBD**

**Focus Areas:**
- [ ] Advanced design tools
  - Text overlay with custom fonts
  - Image filters and effects
  - Multiple logos per design
  - Layer management
- [ ] Product expansion
  - Hoodies, sweatshirts
  - Hats and accessories
  - Bags and totes
  - Stickers and prints
- [ ] Analytics dashboard
  - Sales metrics
  - Popular designs
  - User engagement
  - Revenue tracking
- [ ] Marketing features
  - Design contests
  - Referral program
  - Promotional codes
  - Social sharing

---

## Success Metrics (Overall)

### Phase 1 Targets
- 100 active users
- 500 designs created
- 50 completed orders
- <2s average page load time
- >95% uptime

### Phase 2 Targets
- 500 active users
- 10 active organizations
- 1,000 designs created
- 200 completed orders
- 50% AI-generated designs

### Phase 3 Targets
- 2,000 active users
- 50 active organizations
- 5,000 designs created
- 1,000 completed orders
- Mobile app launched

---

## Release Schedule

### Version 1.0 (MVP) - End of Sprint 8
- Core design studio
- Checkout and fulfillment
- Group ordering
- Essential features only

### Version 1.1 - End of Sprint 10
- AI design generation
- Enhanced design tools
- Performance improvements

### Version 1.2 - End of Sprint 12
- Organization management
- Brand profiles
- Team collaboration

### Version 2.0 - TBD
- Mobile app
- Advanced analytics
- Product expansion

---

## Risks & Mitigation

### Technical Risks
- **Risk**: Fabric.js performance issues on large canvases
  - **Mitigation**: Implement canvas size limits, optimize rendering

- **Risk**: Printful API rate limiting
  - **Mitigation**: Implement request queuing, caching

- **Risk**: File upload size/bandwidth costs
  - **Mitigation**: Enforce strict size limits, compress uploads

### Business Risks
- **Risk**: Low user adoption
  - **Mitigation**: Focus on group ordering use case, target teams/events

- **Risk**: Print quality issues
  - **Mitigation**: Strict DPI validation, clear quality guidelines

- **Risk**: Fulfillment delays from Printful
  - **Mitigation**: Set clear expectations, provide tracking

---

## Changelog

### 2024-01-01
- ✅ Sprint 1-2 completed: Foundation and documentation
- 🔄 Sprint 3-4 started: Design Studio MVP

---

## Notes

- This roadmap is a living document and will be updated as priorities shift
- Dates are estimates and may change based on team velocity
- Feature scope may be adjusted based on user feedback
- Sprint numbers are 2-week periods (1 sprint = 2 weeks)
