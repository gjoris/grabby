# Testing Strategy

## Coverage Goals

While 100% coverage is ideal, for an Electron app we focus on:

### High Priority (Target: 90%+ coverage)
- ✅ React components (UI logic)
- ✅ Custom hooks (state management)
- ✅ Service layer (API calls)
- ✅ Type definitions

### Medium Priority (Target: 70%+ coverage)
- ⚠️ Utility functions
- ⚠️ Download parsing logic
- ⚠️ Version management

### Low Priority (Target: 50%+ coverage)
- ⚠️ Main process code (requires Electron test environment)
- ⚠️ IPC handlers (integration tests)
- ⚠️ Binary management (requires mocking file system)

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/renderer/__tests__/
├── setup.ts              # Test setup and mocks
├── components/           # Component tests
├── hooks/               # Hook tests
└── services/            # Service tests
```

## Writing Tests

### Component Tests
- Test rendering
- Test user interactions
- Test prop changes
- Test accessibility

### Hook Tests
- Test state changes
- Test side effects
- Test error handling

### Service Tests
- Test API calls
- Test error handling
- Test data transformation

## Notes

- Main process code is difficult to test without a full Electron test environment
- Binary downloads and external processes (yt-dlp, ffmpeg) are mocked
- Focus on business logic and user interactions
