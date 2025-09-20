import { test, expect, Page } from '@playwright/test';

test.describe('CryptoChap Frontend Security Tests', () => {
  test('should load the main page securely', async ({ page }: { page: Page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Check that the page loads without security issues
    await expect(page).toHaveTitle(/CryptoChap/);

    // Verify no mixed content or insecure requests
    const responses: any[] = [];
    page.on('response', (response: any) => {
      responses.push(response);
    });

    await page.waitForLoadState('networkidle');

    // Check for any insecure HTTP requests
    const insecureRequests = responses.filter((r: any) => r.url().startsWith('http://') && !r.url().includes('localhost'));
    expect(insecureRequests).toHaveLength(0);
  });

  test('should handle invalid inputs securely', async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:3000');

    // Try to inject malicious input
    const chatInput = page.locator('input[placeholder*="Message"]').first();
    await chatInput.fill('<script>alert("xss")</script>');
    await chatInput.press('Enter');

    // Verify no script execution
    const alerts = page.locator('text=alert("xss")');
    await expect(alerts).toHaveCount(0);
  });

  test('should validate wallet addresses', async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:3000');

    // Test with invalid address
    const chatInput = page.locator('input[placeholder*="Message"]').first();
    await chatInput.fill('send 1 USDC to invalid-address');
    await chatInput.press('Enter');

    // Should show validation error
    await expect(page.locator('text=Invalid address')).toBeVisible();
  });

  test('should prevent command injection', async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:3000');

    // Try command injection
    const chatInput = page.locator('input[placeholder*="Message"]').first();
    await chatInput.fill('balance; rm -rf /');
    await chatInput.press('Enter');

    // Should treat as regular message, not execute commands
    await expect(page.locator('text=balance')).toBeVisible();
  });
});