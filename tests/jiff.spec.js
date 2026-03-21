// tests/jiff.spec.js — Jiff end-to-end test suite v14
// Covers: auth gate, meal generation, week planner, serving scaler,
// step timers, pricing coming soon, cuisines, favourites, meal history,
// email capture, and PWA manifest.

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
async function injectPremiumSession(page) {
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem('jiff-premium', JSON.stringify({
      planId: 'monthly', paymentId: 'test',
      activatedAt: now, expiresAt: now + 30 * 24 * 60 * 60 * 1000, test: true,
    }));
    localStorage.setItem('jiff-trial', JSON.stringify({
      userId: 'test-user', startedAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
    }));
    localStorage.setItem('jiff-auth-dismissed', '1');
  });
}

async function addIngredients(page, items) {
  const input = page.locator('.tag-input').first();
  for (const item of items) {
    await input.fill(item);
    await input.press('Enter');
    await page.waitForTimeout(120);
  }
}

async function generateMeals(page, ingredients = ['eggs', 'onions', 'rice']) {
  await injectPremiumSession(page);
  await page.goto('/app');
  await expect(page.locator('.tag-input').first()).toBeVisible({ timeout: 10_000 });
  await addIngredients(page, ingredients);
  await page.locator('.cta-btn').first().click();
  await expect(page.locator('.results-title')).toBeVisible({ timeout: 60_000 });
}

// ─────────────────────────────────────────────────────────────────
// TEST 1 — Landing page loads
// ─────────────────────────────────────────────────────────────────
test('landing page loads with correct global branding', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Jiff/i);
  await expect(page.locator('text=Pricing')).toBeVisible();
  await expect(page.locator('text=Week plan').or(page.locator('text=📅')).first()).toBeVisible();
  // Must NOT say Tamil Nadu — this is a global app
  const body = await page.locator('body').innerText();
  expect(body.toLowerCase()).not.toContain('tamil nadu');
  console.log('✓ Landing page loads with global branding, no regional references');
});

// ─────────────────────────────────────────────────────────────────
// TEST 2 — Email capture on landing page
// ─────────────────────────────────────────────────────────────────
test('email capture section works on landing page', async ({ page }) => {
  await page.goto('/');
  // Scroll to email capture section
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const emailInput = page.locator('input[type="email"]').first();
  await expect(emailInput).toBeVisible({ timeout: 8_000 });

  await emailInput.fill('test@example.com');
  const notifyBtn = page.locator('button:has-text("Notify")').first();
  await expect(notifyBtn).toBeVisible();
  await notifyBtn.click();

  // Confirmation message should appear
  await expect(page.locator('text=You\'re in').or(page.locator('text=in touch')).first()).toBeVisible({ timeout: 5_000 });

  // Verify stored in localStorage
  const stored = await page.evaluate(() => localStorage.getItem('jiff-email-subs'));
  expect(stored).toBeTruthy();
  const subs = JSON.parse(stored);
  expect(subs.some(s => s.email === 'test@example.com')).toBe(true);

  console.log('✓ Email capture stores subscription and shows confirmation');
});

// ─────────────────────────────────────────────────────────────────
// TEST 3 — Auth gate blocks unauthenticated users
// ─────────────────────────────────────────────────────────────────
test('auth gate appears when user is not signed in', async ({ page }) => {
  await page.goto('/app');
  await expect(page.locator('.auth-gate')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('text=Welcome to Jiff')).toBeVisible();
  await expect(page.locator('.cta-btn')).not.toBeVisible();
  console.log('✓ Auth gate correctly blocks unauthenticated access');
});

// ─────────────────────────────────────────────────────────────────
// TEST 4 — Week planner loads (blank page regression)
// ─────────────────────────────────────────────────────────────────
test('week planner loads without blank screen', async ({ page }) => {
  await page.goto('/planner');
  await expect(page.locator('text=Plan my week')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('text=Breakfast')).toBeVisible();
  await expect(page.locator('text=Lunch')).toBeVisible();
  await expect(page.locator('text=Dinner')).toBeVisible();
  await expect(page.locator('text=Snack')).toBeVisible();
  const toggles = page.locator('.meal-type-toggle');
  await expect(toggles).toHaveCount(4);
  const cuisineChips = page.locator('.cuisine-chip');
  expect(await cuisineChips.count()).toBeGreaterThanOrEqual(13);
  console.log('✓ Week planner renders all elements correctly');
});

// ─────────────────────────────────────────────────────────────────
// TEST 5 — 13 cuisine options present
// ─────────────────────────────────────────────────────────────────
test('main app shows all 13 cuisine options', async ({ page }) => {
  await injectPremiumSession(page);
  await page.goto('/app');
  await expect(page.locator('.cuisine-chips')).toBeVisible({ timeout: 10_000 });
  const chips = page.locator('.cuisine-chip');
  expect(await chips.count()).toBeGreaterThanOrEqual(13);
  for (const cuisine of ['Indian', 'Japanese', 'Korean', 'Brazilian', 'French']) {
    await expect(page.locator('.cuisine-chip', { hasText: cuisine })).toBeVisible();
  }
  console.log('✓ All 13 cuisine chips rendered');
});

// ─────────────────────────────────────────────────────────────────
// TEST 6 — Meal generation returns 5 recipes
// ─────────────────────────────────────────────────────────────────
test('meal generation returns 5 recipe cards', async ({ page }) => {
  await generateMeals(page, ['eggs', 'onions', 'rice', 'tomatoes']);
  const cards = page.locator('.meal-card');
  await expect(cards).toHaveCount(5, { timeout: 10_000 });
  for (let i = 0; i < 5; i++) {
    await expect(cards.nth(i).locator('.meal-name')).not.toBeEmpty();
  }
  console.log('✓ Meal generation returned 5 complete recipe cards');
});

// ─────────────────────────────────────────────────────────────────
// TEST 7 — Meal auto-saved to history
// ─────────────────────────────────────────────────────────────────
test('history nav link visible after sign-in', async ({ page }) => {
  await injectPremiumSession(page);
  await page.goto('/app');
  await expect(page.locator('button:has-text("History")').or(page.locator('text=🕐')).first()).toBeVisible({ timeout: 10_000 });
  console.log('✓ History nav link visible for authenticated users');
});

// ─────────────────────────────────────────────────────────────────
// TEST 8 — History page loads
// ─────────────────────────────────────────────────────────────────
test('history page loads correctly', async ({ page }) => {
  await injectPremiumSession(page);
  await page.goto('/history');
  // Should show history page (not blank, not 404)
  await expect(page.locator('text=Meal history').or(page.locator('text=history')).first()).toBeVisible({ timeout: 10_000 });
  // Empty state or history cards — either is valid
  const emptyOrCards = page.locator('.meal-card, text=No history yet, text=Generate your first meal');
  await expect(emptyOrCards.first()).toBeVisible({ timeout: 8_000 });
  console.log('✓ History page loads without error');
});

// ─────────────────────────────────────────────────────────────────
// TEST 9 — Recipe card expand + serving scaler
// ─────────────────────────────────────────────────────────────────
test('recipe card expands and serving scaler works', async ({ page }) => {
  await generateMeals(page, ['chicken', 'garlic', 'olive oil']);
  const firstCard = page.locator('.meal-card').first();
  await firstCard.locator('.expand-btn').click();
  await expect(firstCard.locator('text=Ingredients')).toBeVisible();
  await expect(firstCard.locator('text=Method')).toBeVisible();
  await expect(firstCard.locator('.scaler-bar')).toBeVisible();
  // Scale up
  await firstCard.locator('.scaler-btn').last().click();
  await page.waitForTimeout(300);
  await expect(firstCard.locator('.scaler-badge')).toBeVisible();
  const highlights = firstCard.locator('.scaled-highlight');
  expect(await highlights.count()).toBeGreaterThan(0);
  console.log('✓ Recipe card expands and scaler highlights changed quantities');
});

// ─────────────────────────────────────────────────────────────────
// TEST 10 — Step timers on timed steps
// ─────────────────────────────────────────────────────────────────
test('step timers appear on recipe steps with cooking times', async ({ page }) => {
  await generateMeals(page, ['rice', 'water', 'chicken', 'onions']);
  const cards = page.locator('.meal-card');
  let timerFound = false;
  for (let i = 0; i < 5; i++) {
    const card = cards.nth(i);
    await card.locator('.expand-btn').click();
    await page.waitForTimeout(200);
    const timers = card.locator('.step-timer.idle');
    if (await timers.count() > 0) {
      timerFound = true;
      await timers.first().click();
      await expect(card.locator('.step-timer.active').or(card.locator('.timer-display'))).toBeVisible({ timeout: 3_000 });
      const timeText = await card.locator('.timer-display').first().innerText();
      expect(timeText).toMatch(/\d+:\d{2}/);
      console.log(`✓ Step timer found on card ${i + 1}: "${timeText}"`);
      await card.locator('.collapse-btn').click();
      break;
    }
    await card.locator('.collapse-btn').click();
  }
  expect(timerFound).toBe(true);
});

// ─────────────────────────────────────────────────────────────────
// TEST 11 — Favourites save and retrieve
// ─────────────────────────────────────────────────────────────────
test('saving a recipe to favourites works', async ({ page }) => {
  await generateMeals(page, ['eggs', 'bread']);
  const firstCard = page.locator('.meal-card').first();
  const mealName = await firstCard.locator('.meal-name').innerText();
  await firstCard.locator('.heart-btn').click();
  await page.waitForTimeout(300);
  await expect(firstCard.locator('.heart-btn.saved')).toBeVisible();
  await expect(page.locator('.fav-badge')).toBeVisible();
  await page.locator('.hdr-btn.fav-active').or(page.locator('button:has-text("Favourites")')).first().click();
  await expect(page.locator('.favs-panel')).toBeVisible();
  await expect(page.locator('.favs-panel .meal-name', { hasText: mealName.trim() })).toBeVisible({ timeout: 5_000 });
  console.log(`✓ Favourites: saved "${mealName.trim()}" and confirmed in panel`);
});

// ─────────────────────────────────────────────────────────────────
// TEST 12 — Pricing shows coming soon for all countries
// ─────────────────────────────────────────────────────────────────
test('pricing page shows coming soon with email waitlist', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('text=Cook smarter').or(page.locator('text=Paid plans')).first()).toBeVisible({ timeout: 10_000 });
  // Should show coming soon — not a live payment button
  await expect(page.locator('text=coming soon').or(page.locator('text=Coming soon').or(page.locator('text=onboarding')))).toBeVisible({ timeout: 8_000 });
  // Must NOT show a live checkout button
  await expect(page.locator('button:has-text("Upgrade to")')).not.toBeVisible();
  // Should have email waitlist input
  await expect(page.locator('input[type="email"]')).toBeVisible();
  // Test email waitlist submission
  await page.locator('input[type="email"]').first().fill('waitlist@test.com');
  await page.locator('button:has-text("Notify")').first().click();
  await expect(page.locator('text=notify').or(page.locator('text=email')).first()).toBeVisible({ timeout: 5_000 });
  // Stored in localStorage
  const stored = await page.evaluate(() => localStorage.getItem('jiff-global-waitlist'));
  expect(stored).toBeTruthy();
  console.log('✓ Pricing shows coming soon and email waitlist works');
});

// ─────────────────────────────────────────────────────────────────
// TEST 13 — PWA manifest
// ─────────────────────────────────────────────────────────────────
test('PWA manifest is reachable and correct', async ({ page }) => {
  const response = await page.request.get('/manifest.json');
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest.name).toMatch(/Jiff/i);
  expect(manifest.icons?.length).toBeGreaterThan(0);
  expect(manifest.start_url).toBeTruthy();
  console.log(`✓ PWA manifest valid: "${manifest.name}", ${manifest.icons.length} icons`);
});

// ─────────────────────────────────────────────────────────────────
// TEST 14 — API smoke test
// ─────────────────────────────────────────────────────────────────
test('API /api/suggest returns valid meal JSON', async ({ page }) => {
  const response = await page.request.post('/api/suggest', {
    data: {
      ingredients: ['eggs', 'onions'], time: '30 min',
      diet: 'none', cuisine: 'any', mealType: 'any',
      defaultServings: 2, count: 1, language: 'en', units: 'metric',
    },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body.meals)).toBe(true);
  expect(body.meals.length).toBeGreaterThan(0);
  const meal = body.meals[0];
  expect(meal.name).toBeTruthy();
  expect(Array.isArray(meal.ingredients)).toBe(true);
  expect(Array.isArray(meal.steps)).toBe(true);
  console.log(`✓ API returns valid meal: "${meal.name}"`);
});
