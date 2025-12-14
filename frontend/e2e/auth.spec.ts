import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Finance App/);
});

test('redirects to login for protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
});
