import { test, expect } from '@playwright/test';

test.describe('Git Sources Management', () => {

  test.beforeEach(async ({ page }) => {
    // Go to the app
    await page.goto('/');

    // Wait for either the setup form, the login form, or a dashboard element to appear
    await page.waitForSelector('#passwordRepeat, #username, button:has-text("Add from Git")', { state: 'visible' });

    // Quick check to see where we landed
    const isSetup = await page.locator('#passwordRepeat').isVisible();
    const isLogin = await page.locator('#username').isVisible();

    if (isSetup) {
      await page.fill('#username', 'doc');
      await page.fill('#password', 'aibolit@');
      await page.fill('#passwordRepeat', 'aibolit@');
      await page.click('button[type="submit"]');
      await page.getByRole('button', { name: /Add from Git/i }).waitFor();
    } else if (isLogin) {
      await page.fill('#username', 'doc');
      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.fill('aibolit@');
      await page.click('button[type="submit"]');
      await page.getByRole('button', { name: /Add from Git/i }).waitFor();
    } else {
      // Already logged in / on dashboard
      await page.getByRole('button', { name: /Add from Git/i }).waitFor();
    }
  });

  test('should add, verify, and delete a git source', async ({ page }) => {
    // We are already on the Dashboard Home after beforeEach

    // Click "Add from Git" button
    const addFromGitBtn = page.getByRole('button', { name: /Add from Git/i });
    await expect(addFromGitBtn).toBeVisible();
    await addFromGitBtn.click();

    // Wait for the modal
    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();

    const testStackName = 'uptime-kuma-test';

    // Fill in the details
    await page.fill('#stackName', testStackName);
    await page.fill('#url', 'https://github.com/louislam/uptime-kuma.git');
    // Branch defaults to empty now, which uses the remote's default branch
    await page.fill('#branch', '');

    // Click Clone
    await page.getByRole('button', { name: 'Clone' }).click();

    // Verify Success Toast (Assuming vue-toastification)
    const successToast = page.locator('.Vue-Toastification__toast--success');
    await expect(successToast).toBeVisible({ timeout: 15000 }); // Cloning might take a few seconds

    // Wait for modal to disappear
    await expect(modal).toBeHidden();

    // Verify it appears in the StackList sidebar
    // Click on the newly added stack in the sidebar
    const stackLink = page.locator(`.stack-list a:has-text("${testStackName}")`);
    await expect(stackLink).toBeVisible();
    await stackLink.click();

    // Verify we are on the Compose view for this stack
    await expect(page).toHaveURL(new RegExp(`/compose/${testStackName}`));

    // Verify Fetch and Pull buttons exist
    const fetchBtn = page.getByRole('button', { name: /Fetch/i });
    const pullBtn = page.getByRole('button', { name: /Pull/i });

    await expect(fetchBtn).toBeVisible();
    await expect(pullBtn).toBeVisible();

    // Test Fetch functionality
    await fetchBtn.click();

    // Wait for a toast (info or success)
    const toast = page.locator('.Vue-Toastification__toast').first();
    await expect(toast).toBeVisible({ timeout: 10000 });

    // Now, clean up: Delete the stack
    const deleteBtn = page.getByRole('button', { name: /Delete/i });
    await deleteBtn.click();

    // Confirm deletion (assuming a SweetAlert or BModal confirmation)
    const confirmDeleteBtn = page.getByRole('button', { name: /Yes/i, exact: false }).or(page.getByRole('button', { name: /Delete/i, exact: true }));
    await confirmDeleteBtn.nth(0).click();

    // Verify we are redirected back or the stack is removed
    await expect(stackLink).toBeHidden();
  });

});
