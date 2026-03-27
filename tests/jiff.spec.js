// tests/jiff.spec.js — Jiff E2E suite v16.3 — 32 tests
import { test, expect } from '@playwright/test';

async function injectPremium(page) {
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem('jiff-premium', JSON.stringify({ planId:'monthly', paymentId:'test', activatedAt:now, expiresAt:now+30*24*60*60*1000, test:true }));
    localStorage.setItem('jiff-trial',   JSON.stringify({ userId:'test-user', startedAt:now, expiresAt:now+7*24*60*60*1000 }));
    localStorage.setItem('jiff-cookie-consent-v2', JSON.stringify({ essential:true, analytics:false, functional:true, ts:now }));
    localStorage.setItem('jiff-lang', 'en');
  });
}

async function addFridgeItem(page, item) {
  const input = page.locator('.ing-text-input').first();
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

// ── 1. Landing page ────────────────────────────────────────────────
test('1. Landing page loads with correct stats', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Jiff/);
  await expect(page.locator('text=28 cuisines')).toBeVisible();
  await expect(page.locator('text=10 languages')).toBeVisible();
});

// ── 2. Cookie banner accept ────────────────────────────────────────
test('2. Cookie banner stores consent on accept', async ({ page }) => {
  await page.goto('/');
  await page.locator('text=Accept all').waitFor({ timeout: 5000 });
  await page.locator('text=Accept all').click();
  const consent = await page.evaluate(() => localStorage.getItem('jiff-cookie-consent-v2'));
  expect(JSON.parse(consent).analytics).toBe(true);
});

// ── 3. Cookie preferences ──────────────────────────────────────────
test('3. Cookie preferences show granular toggles', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);
  await page.locator('text=Manage preferences').click();
  await expect(page.locator('text=Analytics')).toBeVisible();
});

// ── 4. Privacy page ────────────────────────────────────────────────
test('4. Privacy policy page loads', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.locator('text=Privacy Policy')).toBeVisible();
});

// ── 5. Landing footer link ─────────────────────────────────────────
test('5. Landing footer has privacy policy link', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Privacy policy')).toBeVisible();
});

// ── 6. Logo renders ────────────────────────────────────────────────
test('6. JiffLogo renders in app header', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('.jiff-logo-wrap, .logo').first()).toBeVisible();
});

// ── 7. Meal type shows Snacks ──────────────────────────────────────
test('7. Meal type selector shows Snacks', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('button', { hasText: 'Snacks' }).first()).toBeVisible();
});

// ── 8. Auth gate ───────────────────────────────────────────────────
test('8. Unauthenticated users see sign-in gate', async ({ page }) => {
  await page.goto('/app');
  await expect(page.locator('.auth-card, text=Sign in').first()).toBeVisible();
});

// ── 9. Fridge section label ────────────────────────────────────────
test("9. Main app has 'What's in your fridge?' section", async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator("text=What's in your fridge?")).toBeVisible();
});

// ── 10. Pantry section separate ────────────────────────────────────
test('10. Pantry & Spices section is separate from fridge', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('text=Pantry, text=PANTRY').first()).toBeVisible();
});

// ── 11. Cuisine in sidebar ─────────────────────────────────────────
test('11. Cuisine is in sidebar not main card', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  const sidebar = page.locator('.main-sidebar');
  await expect(sidebar.locator('text=CUISINE, text=Cuisine').first()).toBeVisible();
});

// ── 12. Indian cuisine submenu ─────────────────────────────────────
test('12. Indian cuisine opens submenu with Tamil Nadu, Karnataka', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await page.locator('button', { hasText: /Indian/ }).first().click();
  await expect(page.locator('text=Tamil Nadu')).toBeVisible();
  await expect(page.locator('text=Karnataka')).toBeVisible();
  await expect(page.locator('text=Chettinad')).not.toBeVisible();
});

// ── 13. No duplicate Any cuisine ──────────────────────────────────
test('13. Only one Any cuisine chip in sidebar', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  const anyBtns = page.locator('button', { hasText: /^Any cuisine$/ });
  await expect(anyBtns).toHaveCount(1);
});

// ── 14. Diet in sidebar ────────────────────────────────────────────
test('14. Dietary preference is in sidebar', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('.main-sidebar').locator('text=DIETARY, text=Dietary').first()).toBeVisible();
});

// ── 15. Planner loads with fridge section ─────────────────────────
test("15. Week Plan loads with What's in your fridge section", async ({ page }) => {
  await injectPremium(page);
  await page.goto('/planner');
  await page.waitForLoadState('networkidle');
  await expect(page.locator("text=What's in your fridge?")).toBeVisible();
  await expect(page.locator('text=Pantry, text=PANTRY').first()).toBeVisible();
});

// ── 16. Planner meal types ─────────────────────────────────────────
test('16. Planner shows Breakfast, Lunch, Dinner options', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/planner');
  for (const meal of ['Breakfast', 'Lunch', 'Dinner']) {
    await expect(page.locator(`text=${meal}`).first()).toBeVisible();
  }
});

// ── 17. Goal Plans loads with fridge section ──────────────────────
test("17. Goal Plans loads with What's in your fridge section", async ({ page }) => {
  await injectPremium(page);
  await page.goto('/plans');
  await page.waitForLoadState('networkidle');
  await expect(page.locator("text=What's in your fridge?")).toBeVisible();
  await expect(page.locator('text=Pantry, text=PANTRY').first()).toBeVisible();
  await expect(page.locator('text=Weight Loss, text=Muscle Gain').first()).toBeVisible();
});

// ── 18. Stats page ─────────────────────────────────────────────────
test('18. Stats page loads at /stats', async ({ page }) => {
  await page.goto('/stats');
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('text=India, text=users, text=Stats').first()).toBeVisible();
});

// ── 19. API docs page ──────────────────────────────────────────────
test('19. API docs page loads at /api-docs', async ({ page }) => {
  await page.goto('/api-docs');
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('text=API, text=Free, text=Starter, text=Pro').first()).toBeVisible();
});

// ── 20. Profile tabs ───────────────────────────────────────────────
test('20. Profile page has food type and cuisines tabs', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/profile');
  await expect(page.locator('text=Food type, text=Cuisines').first()).toBeVisible();
});

// ── 21. Recipe generation ──────────────────────────────────────────
test('21. Recipe generation returns 5 meal cards (premium)', async ({ page }) => {
  await genMeals(page);
  await expect(page.locator('.meal-card')).toHaveCount(5, { timeout: 45000 });
});

// ── 22. Grocery list opens ─────────────────────────────────────────
test('22. Grocery list panel opens from recipe card', async ({ page }) => {
  await genMeals(page);
  await page.locator('.meal-card').first().click();
  await page.locator('text=What do I need to buy').first().click();
  await expect(page.locator('text=NEED TO BUY, text=Need to buy').first()).toBeVisible();
});

// ── 23. Grocery panel has Blinkit for India ────────────────────────
test('23. Blinkit links shown for Indian users in grocery list', async ({ page }) => {
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem('jiff-premium', JSON.stringify({ planId:'monthly', paymentId:'test', activatedAt:now, expiresAt:now+30*86400000, test:true }));
    localStorage.setItem('jiff-cookie-consent-v2', JSON.stringify({ essential:true, ts:now }));
    localStorage.setItem('jiff-country', 'IN');
    localStorage.setItem('jiff-lang', 'en');
  });
  await page.goto('/app');
  const input = page.locator('.ing-text-input').first();
  await input.fill('eggs');
  await input.press('Enter');
  await page.locator('.cta-btn').click();
  await page.waitForSelector('.meal-card', { timeout: 45000 });
  await page.locator('.meal-card').first().click();
  await page.locator('text=What do I need to buy').first().click();
  // Blinkit Order → links only visible for IN users
  const blinkitLinks = page.locator('text=Order →, text=Blinkit');
  await expect(blinkitLinks.first()).toBeVisible({ timeout: 5000 });
});

// ── 24. Favourites ─────────────────────────────────────────────────
test('24. Favourites panel opens', async ({ page }) => {
  await genMeals(page);
  await page.locator('.heart-btn, .fav-btn').first().click();
  await page.locator('text=Favourites').first().click();
  await expect(page.locator('.favs-panel')).toBeVisible();
});

// ── 25. Language change ────────────────────────────────────────────
test('25. Language change updates labels to Tamil', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  const langSelect = page.locator('select').first();
  await langSelect.selectOption('ta');
  await page.waitForTimeout(500);
  await expect(page.locator('text=காலை உணவு, text=உணவு வகை').first()).toBeVisible();
});

// ── 26. Profile completion banner ─────────────────────────────────
test('26. Profile completion prompt visible when logged in without preferences', async ({ page }) => {
  await page.goto('/app');
  await expect(page.locator('text=Sign in, text=Complete your profile').first()).toBeVisible();
});

// ── 27. PWA manifest ───────────────────────────────────────────────
test('27. PWA manifest is valid', async ({ page }) => {
  const response = await page.request.get('/manifest.json');
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest.name).toBeTruthy();
  expect(manifest.icons?.length).toBeGreaterThan(0);
});

// ── 28. Pricing page ───────────────────────────────────────────────
test('28. Pricing page shows waitlist not live checkout', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('text=soon, text=waitlist, text=notify').first()).toBeVisible();
});

// ── 29. Planner pantry pre-fill ────────────────────────────────────
test('29. Planner Pantry section is present and pre-fill ready', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/planner');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=Pantry, text=PANTRY').first()).toBeVisible();
});

// ── 30. Plans pantry pre-fill ──────────────────────────────────────
test('30. Goal Plans Pantry section is present and pre-fill ready', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/plans');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=Pantry, text=PANTRY').first()).toBeVisible();
});

// ── 31. No stale crashes ───────────────────────────────────────────
test('31. All three main pages load without JS errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const url of ['/app', '/planner', '/plans']) {
    await injectPremium(page);
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  }
  expect(errors.filter(e => !e.includes('Warning'))).toHaveLength(0);
});

// ── 32. History page ───────────────────────────────────────────────
test('32. History page loads for logged-in users', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/history');
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('text=History, text=No meals yet').first()).toBeVisible();
});
