# Accessibility Testing Suite

## Testing Structure

- accessibility.test.tsx (main axe-core tests)
- keyboard-navigation.test.tsx (focus management)
- screen-reader.test.tsx (ARIA validation)
- wcag-compliance.test.tsx (color contrast, etc.)

## Required Dependencies

- axe-core
- @axe-core/react
- jest-axe
- @testing-library/react

## CI Integration

- GitHub Actions accessibility step
- Zero violations requirement
- Cross-browser validation
