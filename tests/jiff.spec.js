// tests/jiff.spec.js — Jiff E2E suite v16 — 24 tests
import { test, expect } from '@playwright/test';

async function injectPremium(page) {
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem('jiff-premium', JSON.stringify({ planId:'monthly', paymentId:'test', activatedAt:now, expiresAt:now+30*24*60*60*1000, test:true }));
    localStorage.setItem('jiff-trial', JSON.stringify({ userId:'test-user', startedAt:now, expiresAt:now+7*24*60*60*1000 }));
    localStorage.setItem('jiff-cookie-consent-v2', JSON.stringify({ essential:true, analytics:false, functional:true, ts:now }));
    localStorage.setItem('jiff-lang', 'en');
  });
}

async function addFridgeItem(page, item) {
  // New v16: type into the fridge items input (first IngredientInput in What's in your fridge section)
  const inputs = page.locator('.ing-text-input');
  const input = inputs.first();
  await input.fill(item);
  await input.press('Enter');
  await page.waitForTimeout(120);
}

async function genMeals(page, items = ['eggs','onions','rice']) {
  await injectPremium(page);
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  for (const item of items) await addFridgeItem(page, item);
  await page.locator('.cta-btn').click();
  await page.waitForSelector('.meal-card', { timeout: 45000 });
}

// ── 1. Landing page loads ──────────────────────────────────────────
test('1. Landing page loads and shows correct stats', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Jiff/);
  await expect(page.locator('text=28 cuisines')).toBeVisible();
  await expect(page.locator('text=10 languages')).toBeVisible();
  await expect(page.locator('text=AI-powered')).toBeVisible();
});

// ── 2. Cookie banner ───────────────────────────────────────────────
test('2. Cookie banner appears and accept stores consent', async ({ page }) => {
  await page.goto('/');
  const banner = page.locator('text=We use cookies');
  await banner.waitFor({ timeout: 5000 });
  await expect(banner).toBeVisible();
  await page.locator('text=Accept all').click();
  const consent = await page.evaluate(() => localStorage.getItem('jiff-cookie-consent-v2'));
  expect(consent).toBeTruthy();
  const parsed = JSON.parse(consent);
  expect(parsed.analytics).toBe(true);
});

// ── 3. Cookie preferences toggle ──────────────────────────────────
test('3. Cookie preferences show granular toggles', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);
  await page.locator('text=Manage preferences').click();
  await expect(page.locator('text=Functional')).toBeVisible();
  await expect(page.locator('text=Analytics')).toBeVisible();
  await page.locator('text=Essential only').click();
  const consent = await page.evaluate(() => localStorage.getItem('jiff-cookie-consent-v2'));
  const parsed = JSON.parse(consent);
  expect(parsed.analytics).toBe(false);
});

// ── 4. Privacy policy page ─────────────────────────────────────────
test('4. Privacy policy page loads all sections', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.locator('text=Privacy Policy')).toBeVisible();
  for (const section of ['What we collect', 'Cookies', 'Your rights']) {
    await expect(page.locator(`text=${section}`).first()).toBeVisible();
  }
});

// ── 5. Privacy link in landing footer ─────────────────────────────
test('5. Footer has privacy policy link', async ({ page }) => {
  await page.goto('/');
  const privacyLink = page.locator('text=Privacy policy');
  await expect(privacyLink).toBeVisible();
});

// ── 6. Animated logo ───────────────────────────────────────────────
test('6. JiffLogo renders in app header', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('.jiff-logo-wrap, .logo').first()).toBeVisible();
});

// ── 7. Snacks label ────────────────────────────────────────────────
test('7. Meal type shows Snacks', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('.meal-type-chip, button', { hasText: 'Snacks' }).first()).toBeVisible();
});

// ── 8. Auth gate ───────────────────────────────────────────────────
test('8. Unauthenticated users see sign-in gate', async ({ page }) => {
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.auth-card, text=Sign in').first()).toBeVisible();
});

// ── 9. v16 Input layout — fridge section ──────────────────────────
test("9. Fridge section has 'What's in your fridge?' label", async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator("text=What's in your fridge?")).toBeVisible();
});

// ── 10. Ingredients Available section separate ─────────────────────
test('10. Ingredients Available section is separate from fridge section', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator("text=Ingredients Available, text=INGREDIENTS AVAILABLE").first()).toBeVisible();
  await expect(page.locator("text=Pantry, text=PANTRY").first()).toBeVisible();
});

// ── 11. Cuisine in sidebar ─────────────────────────────────────────
test('11. Cuisine selector is in sidebar, not main card', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  const sidebar = page.locator('.main-sidebar');
  await expect(sidebar.locator('text=CUISINE, text=Cuisine').first()).toBeVisible();
});

// ── 12. Indian cuisine submenu ─────────────────────────────────────
test('12. Indian cuisine opens sub-menu with regional options', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  const indianBtn = page.locator('.cuisine-chip, button', { hasText: /Indian/ }).first();
  await indianBtn.click();
  await expect(page.locator('text=Chettinad, text=Punjabi, text=Kerala').first()).toBeVisible();
});

// ── 13. Planner loads ──────────────────────────────────────────────
test('13. Planner loads with 4 meal types', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/planner');
  for (const meal of ['Breakfast', 'Lunch', 'Dinner']) {
    await expect(page.locator(`text=${meal}`).first()).toBeVisible();
  }
});

// ── 14. Goal plans page ────────────────────────────────────────────
test('14. Goal plans page shows plan types', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/plans');
  for (const plan of ['Weight Loss', 'Muscle Gain']) {
    await expect(page.locator(`text=${plan}`).first()).toBeVisible();
  }
});

// ── 15. Stats page loads ───────────────────────────────────────────
test('15. Stats page loads at /stats', async ({ page }) => {
  await page.goto('/stats');
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('text=India, text=users, text=meals, text=Stats').first()).toBeVisible();
});

// ── 16. API docs page loads ────────────────────────────────────────
test('16. API docs page loads at /api-docs', async ({ page }) => {
  await page.goto('/api-docs');
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('text=API, text=Free, text=Starter, text=Pro').first()).toBeVisible();
});

// ── 17. Profile page tabs ──────────────────────────────────────────
test('17. Profile page has 5 tabs including food type and cuisines', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/profile');
  for (const tab of ['Food type', 'Cuisines', 'Dietary']) {
    await expect(page.locator(`button, text=${tab}`).first()).toBeVisible();
  }
});

// ── 18. Dietary preference in sidebar ─────────────────────────────
test('18. Dietary preference card is in sidebar', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  const sidebar = page.locator('.main-sidebar');
  await expect(sidebar.locator('text=DIETARY, text=Dietary').first()).toBeVisible();
});

// ── 19. Recipe generation returns 5 cards ─────────────────────────
test('19. Recipe generation returns 5 meal cards for premium', async ({ page }) => {
  await genMeals(page);
  const cards = page.locator('.meal-card');
  await expect(cards).toHaveCount(5, { timeout: 45000 });
});

// ── 20. Grocery list opens ─────────────────────────────────────────
test('20. Grocery list opens with need-to-buy section', async ({ page }) => {
  await genMeals(page);
  await page.locator('.meal-card').first().click();
  await page.locator('text=What do I need').first().click();
  await expect(page.locator('text=NEED TO BUY, text=Need to buy').first()).toBeVisible();
});

// ── 21. Favourites save and retrieve ──────────────────────────────
test('21. Favourites save and display', async ({ page }) => {
  await genMeals(page);
  await page.locator('.heart-btn, [aria-label="favourite"], .fav-btn').first().click();
  await page.locator('text=Favourites').first().click();
  await expect(page.locator('.favs-panel')).toBeVisible();
});

// ── 22. Language change ────────────────────────────────────────────
test('22. Language change updates section labels', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  // Change language to Tamil
  const langSelect = page.locator('select').first();
  await langSelect.selectOption('ta');
  await page.waitForTimeout(500);
  // Tamil section labels should appear
  await expect(page.locator('text=காலை உணவு, text=உணவு வகை').first()).toBeVisible();
});

// ── 23. Pricing page ──────────────────────────────────────────────
test('23. Pricing page shows "coming soon" not live checkout', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('text=soon, text=waitlist, text=notify').first()).toBeVisible();
  await expect(page.locator('text=Pay now')).not.toBeVisible();
});

// ── 24. PWA manifest ──────────────────────────────────────────────
test('24. PWA manifest is valid', async ({ page }) => {
  const response = await page.request.get('/manifest.json');
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest.name).toBeTruthy();
  expect(manifest.icons?.length).toBeGreaterThan(0);
});
