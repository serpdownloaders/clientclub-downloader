const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const REPO_URLS = process.env.REPO_URLS_JSON
  ? JSON.parse(process.env.REPO_URLS_JSON)
  : [
      'https://github.com/serpapps/kajabi-video-downloader',
      'https://github.com/serpapps/loom-video-downloader',
    ];

const RESULTS_FILE = path.join(__dirname, '..', 'packagist-submitted.json');

test.describe('Submit packages to Packagist', () => {
  const successful = [];

  test.afterAll(() => {
    if (successful.length > 0) {
      let existing = [];
      if (fs.existsSync(RESULTS_FILE)) {
        existing = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
      }
      const merged = [...new Set([...existing, ...successful])];
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(merged, null, 2));
      console.log('\n✅ Successfully submitted Packagist URLs:');
      successful.forEach((url) => console.log(' -', url));
    }
  });

  for (const repoUrl of REPO_URLS) {
    test(`Submit ${repoUrl}`, async ({ page }) => {
      // Derive the expected Packagist package URL from the GitHub repo URL.
      // e.g. https://github.com/serpapps/kajabi-video-downloader
      //   -> https://packagist.org/packages/serpapps/kajabi-video-downloader
      const repoPath = new URL(repoUrl).pathname.replace(/^\//, '').replace(/\/$/, '');
      const packagistUrl = `https://packagist.org/packages/${repoPath}`;

      await page.goto('https://packagist.org/packages/submit');

      const urlInput = page.getByRole('textbox', { name: 'Repository URL (Git/Svn/Hg)' });
      await urlInput.click();
      await urlInput.fill(repoUrl);

      await page.getByRole('button', { name: 'Check' }).click();

      // Wait for the Submit button to become enabled after Packagist validates the repo.
      const submitButton = page.getByRole('button', { name: 'Submit' });
      await expect(submitButton).toBeEnabled({ timeout: 30_000 });
      await submitButton.click();

      // Give Packagist a moment to process the submission, then verify the package page.
      await page.goto(packagistUrl);
      await page.waitForLoadState('networkidle');

      // Confirm the package page loaded – it should have an <h1> with the package name.
      const packageSlug = repoPath.split('/').pop();
      await expect(page.locator('h1')).toContainText(packageSlug, { timeout: 15_000 });

      successful.push(packagistUrl);
      console.log(`✅ Submitted: ${packagistUrl}`);
    });
  }
});
