# CryptoChap Testing Strategy

## Overview
Comprehensive testing strategy ensuring reliability, security, and performance of the CryptoChap platform.

## Testing Pyramid

### 1. Unit Tests (70% coverage target)
- **Framework**: Jest + React Testing Library
- **Coverage**: Functions, components, utilities
- **Mocking**: External APIs, blockchain interactions

### 2. Integration Tests (20% coverage target)
- **Framework**: Jest + Supertest
- **Scope**: API endpoints, database interactions
- **Environment**: Test database, mocked external services

### 3. End-to-End Tests (10% coverage target)
- **Framework**: Playwright
- **Scope**: Complete user flows
- **Environment**: Staging environment

## Test Categories

### Security Tests
```typescript
describe('Security Tests', () => {
  test('should reject invalid webhook signatures', async () => {
    const invalidSignature = 'invalid_signature';
    const result = await request(app)
      .post('/api/whatsapp/webhook')
      .set('x-hub-signature-256', invalidSignature)
      .send(testPayload);

    expect(result.status).toBe(401);
  });

  test('should validate input sanitization', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const result = sanitizeInput(maliciousInput);
    expect(result).not.toContain('<script>');
  });
});
```

### Performance Tests
```typescript
describe('Performance Tests', () => {
  test('should handle concurrent requests', async () => {
    const promises = Array(100).fill().map(() =>
      request(app).get('/api/wallet/balance')
    );

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.status === 200).length;
    expect(successCount).toBeGreaterThan(95);
  });

  test('should respond within 200ms for balance queries', async () => {
    const start = Date.now();
    await request(app).get('/api/wallet/balance');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(200);
  });
});
```

### Blockchain Integration Tests
```typescript
describe('Blockchain Integration', () => {
  test('should handle transaction failures gracefully', async () => {
    // Mock network failure
    mockProvider.sendTransaction.mockRejectedValue(new Error('Network error'));

    const result = await transactionService.sendTransaction(testTx);
    expect(result.status).toBe('failed');
    expect(result.error).toContain('Network error');
  });

  test('should validate wallet addresses', () => {
    const validAddress = '0x742d35Cc6634C0532925a3b8D0C18C67b93a8E93';
    const invalidAddress = 'invalid_address';

    expect(validateAddress(validAddress)).toBe(true);
    expect(validateAddress(invalidAddress)).toBe(false);
  });
});
```

## Test Data Management

### Test Fixtures
```typescript
// test/fixtures/users.ts
export const testUsers = {
  validUser: {
    phone: '+1234567890',
    walletAddress: '0x742d35Cc6634C0532925a3b8D0C18C67b93a8E93',
    usdcBalance: '100.50',
    ethBalance: '0.005'
  },
  newUser: {
    phone: '+0987654321',
    walletAddress: '0x1234567890123456789012345678901234567890'
  }
};

// test/fixtures/transactions.ts
export const testTransactions = {
  successfulTransfer: {
    from: '0x742d35Cc6634C0532925a3b8D0C18C67b93a8E93',
    to: '0x1234567890123456789012345678901234567890',
    amount: '10.00',
    currency: 'USDC',
    txHash: '0xabc123def456'
  }
};
```

### Test Database
```typescript
// test/setup/database.ts
import { Client } from 'pg';

export async function setupTestDatabase() {
  const client = new Client({
    host: process.env.TEST_DB_HOST,
    database: process.env.TEST_DB_NAME,
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD
  });

  await client.connect();

  // Create test schema
  await client.query(`
    CREATE TABLE IF NOT EXISTS test_users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE,
      wallet_address VARCHAR(42) UNIQUE
    );
  `);

  return client;
}

export async function teardownTestDatabase(client: Client) {
  await client.query('DROP TABLE IF EXISTS test_users');
  await client.end();
}
```

## Mock Services

### WhatsApp Service Mock
```typescript
// test/mocks/whatsappService.ts
export const mockWhatsAppService = {
  sendMessage: jest.fn().mockResolvedValue({
    messaging_product: 'whatsapp',
    contacts: [{ input: '+1234567890', wa_id: '1234567890' }],
    messages: [{ id: 'test_message_id' }]
  }),

  verifyWebhook: jest.fn().mockReturnValue(true),

  sendTemplateMessage: jest.fn().mockResolvedValue({
    messaging_product: 'whatsapp',
    messages: [{ id: 'template_message_id' }]
  })
};
```

### Blockchain Provider Mock
```typescript
// test/mocks/blockchainProvider.ts
export const mockProvider = {
  getBalance: jest.fn().mockResolvedValue(ethers.parseEther('1.0')),

  getTransactionReceipt: jest.fn().mockResolvedValue({
    status: 1,
    blockNumber: 12345,
    gasUsed: ethers.parseUnits('21000', 'wei')
  }),

  sendTransaction: jest.fn().mockResolvedValue({
    hash: '0x1234567890abcdef',
    wait: jest.fn().mockResolvedValue({ status: 1 })
  }),

  call: jest.fn().mockResolvedValue('0x0000000000000000000000000000000000000000000000000de0b6b3a7640000')
};
```

## Test Execution Strategy

### Local Development
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/wallet.test.ts

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Performance Benchmarks

### Response Time Targets
- **API Response Time**: < 200ms (95th percentile)
- **Page Load Time**: < 2 seconds
- **Transaction Processing**: < 30 seconds
- **WhatsApp Response**: < 5 seconds

### Load Testing
```typescript
// test/performance/loadTest.ts
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  vus: 100, // 100 virtual users
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'] // Error rate should be below 10%
  }
};

export default function () {
  const response = http.get('http://localhost:3000/api/wallet/balance');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  });
}
```

## Security Testing

### Penetration Testing Checklist
- [ ] SQL Injection prevention
- [ ] XSS vulnerability testing
- [ ] CSRF protection verification
- [ ] Rate limiting effectiveness
- [ ] Authentication bypass attempts
- [ ] Authorization testing
- [ ] Input validation testing
- [ ] Session management testing

### Automated Security Scans
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run OWASP ZAP baseline scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'
```

## Accessibility Testing

### WCAG Compliance Tests
```typescript
// test/accessibility/a11y.test.ts
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  test('ChatInterface should have no accessibility violations', async () => {
    const { container } = render(<ChatInterface />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('MessageBubble should support keyboard navigation', () => {
    const { getByRole } = render(<MessageBubble message={testMessage} />);
    const button = getByRole('button');

    // Test keyboard interaction
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

## Test Reporting

### Coverage Reports
```json
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Results Dashboard
```typescript
// test/utils/testReporter.ts
export class TestReporter {
  static generateReport(results: TestResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.numTotalTests,
        passed: results.numPassedTests,
        failed: results.numFailedTests,
        coverage: results.coverage
      },
      details: results.testResults.map(result => ({
        file: result.testFilePath,
        duration: result.perfStats.runtime,
        tests: result.testResults.map(test => ({
          name: test.fullName,
          status: test.status,
          duration: test.duration
        }))
      }))
    };

    // Save report to file
    fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));
    return report;
  }
}
```

This testing strategy ensures comprehensive coverage of functionality, security, and performance requirements for the CryptoChap platform.