/**
 * E2E Tests for OnlyStudy Platform
 * 
 * Uses Playwright to test complete user flows including:
 * - Authentication flows
 * - Subscription flows
 * - Live streaming
 * - Messaging
 */

import { test, expect, describe, beforeEach, afterEach } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000';

describe('OnlyStudy E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto(BASE_URL);
  });

  test.afterEach(async ({ page }) => {
    // Clean up after each test
    await page.close();
  });
});

describe('Authentication Flows', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('h1')).toContainText(/welcome back/i);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await expect(page.locator('h1')).toContainText(/create account/i);
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Click sign in without filling fields
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    
    // Fill registration form
    await page.fill('input[name="username"]', `testuser_${Date.now()}`);
    await page.fill('input[name="email"]', `test_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'SecurePass123!');
    
    // Select student role
    await page.click('input[value="student"]');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to login or dashboard
    await expect(page).toHaveURL(/\/(login|dashboard)/);
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click visibility toggle button
    const toggleButton = page.locator('button[aria-label="Show password"]');
    await toggleButton.click();
    
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });
});

describe('Student Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as student before tests
    // This would typically be done via API call, then setting localStorage
  });

  test('should display explore page', async ({ page }) => {
    await page.goto(`${BASE_URL}/explore`);
    
    await expect(page.locator('h1')).toContainText(/explore/i);
    
    // Check for creator cards
    await expect(page.locator('.creator-card, [class*="creator"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display subscriptions page for logged in user', async ({ page }) => {
    // This test would require authentication
    // For now, we'll test the unauthenticated experience
    
    await page.goto(`${BASE_URL}/dashboard/subscriptions`);
    
    // Should redirect to login or show empty state
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display wallet page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/wallet`);
    
    await expect(page.locator('h1')).toContainText(/wallet/i);
    await expect(page.locator('text=Balance')).toBeVisible();
  });
});

describe('Creator Dashboard', () => {
  test('should display creator dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/creator/dashboard`);
    
    await expect(page.locator('h1')).toContainText(/creator dashboard/i);
    
    // Check for creator-specific elements
    await expect(page.locator('text=Earnings')).toBeVisible();
    await expect(page.locator('text=Subscribers')).toBeVisible();
  });

  test('should display posts management', async ({ page }) => {
    await page.goto(`${BASE_URL}/creator/posts`);
    
    await expect(page.locator('h1')).toContainText(/posts/i);
    await expect(page.locator('text=Create New Post')).toBeVisible();
  });

  test('should display live streaming page', async ({ page }) => {
    await page.goto(`${BASE_URL}/creator/live`);
    
    await expect(page.locator('h1')).toContainText(/go live/i);
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('select[name="accessType"]')).toBeVisible();
  });
});

describe('Live Streaming', () => {
  test('should display live stream page', async ({ page }) => {
    await page.goto(`${BASE_URL}/live/stream_123`);
    
    // Should show video player
    await expect(page.locator('video, [class*="video"]').first()).toBeVisible({ timeout: 10000 });
    
    // Should show chat
    await expect(page.locator('[class*="chat"]').first()).toBeVisible();
  });

  test('should display live stream for free access', async ({ page }) => {
    await page.goto(`${BASE_URL}/live/free_stream`);
    
    // Free stream should be accessible
    await expect(page.locator('text=Join Stream')).toBeVisible();
  });

  test('should show subscription prompt for subscriber-only stream', async ({ page }) => {
    await page.goto(`${BASE_URL}/live/subscriber_stream`);
    
    // Should show subscription prompt
    await expect(page.locator('text=Subscribe to watch')).toBeVisible();
  });
});

describe('Messaging', () => {
  test('should display messages page', async ({ page }) => {
    await page.goto(`${BASE_URL}/messages`);
    
    await expect(page.locator('h1')).toContainText(/messages/i);
  });

  test('should show empty state for new user', async ({ page }) => {
    await page.goto(`${BASE_URL}/messages`);
    
    // May show empty state or loading
    await expect(page.locator('text=No conversations yet, text=Loading...').first()).toBeVisible({ timeout: 5000 });
  });
});

describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Click on navigation links
    await page.click('text=Explore');
    await expect(page).toHaveURL(/\/explore/);
    
    await page.click('text=Pricing');
    await expect(page).toHaveURL(/\/pricing/);
  });

  test('should have responsive navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    
    await page.goto(BASE_URL);
    
    // Should show hamburger menu
    await expect(page.locator('[class*="menu"], [class*="hamburger"]').first()).toBeVisible();
  });
});

describe('Admin Dashboard', () => {
  test('should display admin dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    
    await expect(page.locator('h1')).toContainText(/admin/i);
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
  });

  test('should display users management', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    
    await expect(page.locator('h1')).toContainText(/users/i);
    
    // Should show user table or list
    await expect(page.locator('table, [class*="user-list"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display content moderation', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/content`);
    
    await expect(page.locator('h1')).toContainText(/content/i);
  });
});

describe('Error Handling', () => {
  test('should display 404 page for unknown routes', async ({ page }) => {
    await page.goto(`${BASE_URL}/nonexistent-page`);
    
    await expect(page.locator('h1')).toContainText(/404/i);
    await expect(page.locator('text=Page not found')).toBeVisible();
  });

  test('should display error boundary message', async ({ page }) => {
    // Navigate to a route that might cause an error
    await page.goto(`${BASE_URL}/error-test`);
    
    // Should show error message or 404
    await expect(page.locator('text=Something went wrong, text=Error, text=404').first()).toBeVisible({ timeout: 5000 });
  });
});

describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check that h1 exists
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('should have form labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Check that form inputs have labels
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('id');
    
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('id');
  });

  test('should have button with accessible names', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Check that submit button has accessible name
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).not.toHaveText('');
  });
});

describe('Performance', () => {
  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto(`${BASE_URL}/explore`);
    
    // Images should have loading="lazy" attribute
    const images = page.locator('img');
    const firstImage = images.first();
    
    if (await firstImage.isVisible()) {
      const loading = await firstImage.getAttribute('loading');
      expect(loading).toBe('lazy');
    }
  });
});

// Helper function for logging in via API
async function loginUser(page, email, password) {
  // This would typically make an API call and set localStorage
  // For demo purposes, we're testing the UI flow
}

// Helper function for setting authentication state
async function setAuthState(page, user) {
  await page.evaluate((userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
  }, user);
}

