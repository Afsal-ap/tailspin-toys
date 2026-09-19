import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the correct title', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle('Tailspin Toys - Crowdfunding your new favorite game!');
  });

  test('should display the main heading', async ({ page }) => {
    // Check that the main page heading is present
    await expect(page.getByRole('heading', { name: 'Welcome to Tailspin Toys', exact: true })).toBeVisible();
  });

  test('should display the site branding in header', async ({ page }) => {
    // Check that the site branding is present in the header (no longer an h1)
    await expect(page.getByText('Tailspin Toys').first()).toBeVisible();
  });

  test('should display the welcome message', async ({ page }) => {
    // Check that the welcome message is present using more specific locator
    await expect(page.getByText('Find your next game! And maybe even back one! Explore our collection!')).toBeVisible();
  });

  test('should paginate the featured games list', async ({ page }) => {
    const visibleGameCards = page.locator('[data-testid="game-card"]:visible');

    await expect(visibleGameCards).toHaveCount(6);
    await expect(page.getByTestId('pagination-page-2')).toBeVisible();

    await page.getByTestId('pagination-page-2').click();

    await expect(page.getByTestId('pagination-page-2')).toHaveAttribute('aria-current', 'page');
    await expect(visibleGameCards).toHaveCount(6);
    await expect(page.getByTestId('pagination-summary')).toContainText('Showing 7-');
  });
});
