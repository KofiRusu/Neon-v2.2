## 🎨 UI Component Task

**Component Name**: [e.g., CampaignDashboard, AgentStatusCard, MetricsWidget]

**Type**: [ ] Page [ ] Component [ ] Widget [ ] Layout [ ] Modal

**Priority**: [ ] Critical [ ] High [ ] Medium [ ] Low

**Sprint**: [Sprint Number - e.g., Sprint 02]

**Milestone**: [e.g., Phase 3: UI Integration]

---

## 📍 **Location & Routing**

**Pages/Routes**:

- [ ] `/dashboard` - Main dashboard page
- [ ] `/campaigns` - Campaign management
- [ ] `/agents` - Agent overview
- [ ] `/analytics` - Analytics dashboard
- [ ] Other: [Custom route path]

**Component Path**:

- [ ] `src/app/[route]/page.tsx` - Page component
- [ ] `src/components/[component-name]/` - Reusable component
- [ ] `src/components/ui/[ui-element]/` - UI library component

---

## 🎯 **Functionality Requirements**

### Core Features:

- [ ] Data display (tables, charts, metrics)
- [ ] Agent integration (real-time updates)
- [ ] User interactions (forms, buttons, navigation)
- [ ] State management (loading, error states)
- [ ] Data filtering and search
- [ ] Export/import capabilities

### User Experience:

- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Dark mode support
- [ ] Loading animations and skeletons
- [ ] Microinteractions and hover effects
- [ ] Keyboard navigation support
- [ ] Screen reader accessibility

### Performance:

- [ ] Code splitting and lazy loading
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] Render performance < 100ms
- [ ] Core Web Vitals compliance

---

## 🎨 **Design Requirements**

**Design System Compliance**:

- [ ] Uses design tokens (colors, typography, spacing)
- [ ] Follows component patterns
- [ ] Consistent with brand guidelines
- [ ] Matches Figma/design specifications

**Visual Elements**:

- [ ] Icons and illustrations
- [ ] Color scheme and theming
- [ ] Typography hierarchy
- [ ] Spacing and layout grid
- [ ] Animation and transitions

**Design References**:

- Figma: [Link to design file]
- Style guide: [Link to style guide]
- Design assets: [Link to assets folder]

---

## 🔗 **Integration Requirements**

### Backend Integration:

- [ ] tRPC API calls
- [ ] Real-time data updates
- [ ] WebSocket connections
- [ ] Error handling and fallbacks
- [ ] Loading states management

### State Management:

- [ ] React Query/tRPC state
- [ ] Local component state
- [ ] Global state (Zustand/Redux)
- [ ] Form state management
- [ ] URL state synchronization

### Agent Integration:

- [ ] Agent status monitoring
- [ ] Agent configuration UI
- [ ] Agent output display
- [ ] Agent control actions
- [ ] Agent performance metrics

---

## ✅ **Completion Criteria**

### Visual Requirements:

- ✅ Matches design specifications exactly
- ✅ Responsive across all device sizes
- ✅ Dark mode implementation complete
- ✅ Loading and error states designed
- ✅ Accessibility standards met (WCAG 2.1 AA)

### Technical Requirements:

- ✅ TypeScript types defined
- ✅ Component props documented
- ✅ Unit tests written (>80% coverage)
- ✅ Integration tests passing
- ✅ Performance benchmarks met

### User Experience:

- ✅ Intuitive navigation and workflow
- ✅ Fast loading times (<2s)
- ✅ Smooth animations and transitions
- ✅ Keyboard and screen reader support
- ✅ Cross-browser compatibility

### Integration:

- ✅ tRPC integration working
- ✅ Real-time updates functioning
- ✅ Agent data flowing correctly
- ✅ Error handling graceful
- ✅ Production deployment tested

---

## 📱 **Device Testing**

### Desktop:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile:

- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Samsung Internet
- [ ] Firefox Mobile

### Tablet:

- [ ] iPad (Safari)
- [ ] Android tablet
- [ ] Surface tablet

---

## 🧪 **Testing Strategy**

### Visual Testing:

- [ ] Chromatic visual regression tests
- [ ] Cross-browser screenshots
- [ ] Mobile device testing
- [ ] Dark mode validation
- [ ] Print styles (if applicable)

### Functional Testing:

- [ ] User interaction flows
- [ ] Form validation
- [ ] Data loading and error states
- [ ] Agent integration scenarios
- [ ] Performance testing

### Accessibility Testing:

- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Color contrast validation
- [ ] Focus management
- [ ] ARIA labels and roles

---

## 📊 **Performance Targets**

**Core Web Vitals**:

- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

**Bundle Size**:

- Component bundle: < 50KB gzipped
- Page bundle: < 200KB gzipped
- Image assets: Optimized WebP/AVIF

**Runtime Performance**:

- Initial render: < 100ms
- Re-render: < 16ms (60fps)
- Memory usage: < 50MB

---

## 🔍 **Code Quality**

### Code Standards:

- [ ] TypeScript strict mode
- [ ] ESLint rules passing
- [ ] Prettier formatting applied
- [ ] Component composition patterns
- [ ] Custom hooks extracted

### Documentation:

- [ ] Component props documented
- [ ] Usage examples provided
- [ ] Storybook stories created
- [ ] README with setup instructions
- [ ] API integration guide

### Testing:

- [ ] Unit tests for all functions
- [ ] Integration tests for user flows
- [ ] Snapshot tests for UI consistency
- [ ] Performance benchmarks
- [ ] Accessibility test suite

---

## 🚀 **Deployment Checklist**

### Pre-Deployment:

- [ ] Design review approved
- [ ] Code review completed
- [ ] All tests passing
- [ ] Performance audit clean
- [ ] Accessibility audit passed

### Staging:

- [ ] Feature branch deployed
- [ ] QA testing completed
- [ ] Stakeholder approval
- [ ] User acceptance testing
- [ ] Performance validation

### Production:

- [ ] Production deployment successful
- [ ] Monitoring alerts configured
- [ ] User feedback collection
- [ ] Analytics tracking active
- [ ] Documentation updated

---

## 📝 **Additional Notes**

**Special Considerations**:
[Add any special requirements, design constraints, or technical limitations]

**User Research**:

- [ ] User interviews conducted
- [ ] A/B testing planned
- [ ] Analytics goals defined
- [ ] Success metrics identified

**Related Issues**:

- Related to #[issue-number]
- Depends on #[issue-number]
- Blocks #[issue-number]

**Resources**:

- Design files: [Link to Figma/Sketch]
- User flows: [Link to user journey maps]
- Technical specs: [Link to technical requirements]
- Brand guidelines: [Link to brand assets]

---

/label ~frontend ~ui-ux ~needs-design-review
/milestone %"[Milestone Name]"
/due [YYYY-MM-DD]
/assign @[designer] @[developer]
