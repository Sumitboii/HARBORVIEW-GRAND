import { test, expect } from '@playwright/test';

test.describe('Hotel Assistant E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('.option-chip');
  });

  test('should load the chat interface', async ({ page }) => {
    // Check for welcome message
    await expect(page.getByText(/Welcome to Harborview Grand/i).first()).toBeVisible();
    
    // Check for input field
    await expect(page.getByRole('textbox')).toBeVisible();
    
    // Check for send button
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
  });

  test('should send a message and receive a response', async ({ page }) => {
    // Type a question and press enter
    await page.getByRole('textbox').fill('What time is check-in?');
    await page.getByRole('textbox').press('Enter');
    
    // Wait for concierge response bubble
    await expect(page.locator('.bubble.assistant').nth(1)).toBeVisible({ timeout: 15000 });
  });

  test('should show availability form', async ({ page }) => {
    // Dispatch click on the availability option chip
    await page.locator('.option-chip:has-text("Do you have rooms available")').dispatchEvent('click');
    
    // Check for form elements
    await expect(page.locator('.availability-form')).toBeVisible({ timeout: 8000 });
    await expect(page.getByLabel('Check-in date')).toBeVisible();
    await expect(page.getByLabel('Check-out date')).toBeVisible();
    await expect(page.getByLabel('Number of adults')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check availability' })).toBeVisible();
  });

  test('should handle error state gracefully', async ({ page }) => {
    // Mock a network error on the chat endpoint
    await page.addInitScript(() => {
      window.originalFetch = window.fetch;
      window.fetch = async (url, ...args) => {
        if (typeof url === 'string' && url.includes('/api/chat')) {
          throw new Error('Network error');
        }
        return window.originalFetch(url, ...args);
      };
    });
    
    // Reload page with mocked fetch
    await page.reload();
    await page.waitForSelector('.option-chip');
    
    // Try to send a message
    await page.getByRole('textbox').fill('test');
    await page.getByRole('textbox').press('Enter');
    
    // Should show error message
    await expect(page.getByText(/couldn't reach the assistant service/i)).toBeVisible({ timeout: 10000 });
  });
});
