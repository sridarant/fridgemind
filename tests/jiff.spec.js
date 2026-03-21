// tests/jiff.spec.js — Jiff end-to-end test suite
// Covers: auth gate, meal generation, week planner, serving scaler,
// step timers, pricing, cuisines, favourites, and PWA manifest.

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────
// Helper: inject premium + trial state into localStorage
// This bypasses the sign-in gate without needing a real account.
// ─────────────────────────────────────────────────────────────────
async function injectPremiumSession(page) {
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem('jiff-premium', JSON.stringify({
      planId:      'monthly',
      paymentId:   'test',
      activatedAt: now,
      expiresAt:   now + 30 * 24 * 60 * 60 * 1000,
      test:        true,
    }));
    localStorage.setItem('jiff-trial', JSON.stringify({
      userId:    'test-user',
      startedAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
    }));
    // Dismiss the auth-dismissed flag so sign-in prompt doesn't show
    localStorage.setItem('jiff-auth-dismissed', '1');
  });
}

// Helper: add ingredients to the tag input
async function addIngredients(page, items) {
  const input = page.locator('.tag-input').first();
  for (const item of items) {
    await input.fill(item);
    await input.press('Enter');
    await page.waitForTimeout(150); // small pause between tags
  }
}

// ─────────────────────────────────────────────────────────────────
// TEST 1 — Landing page
// ─────────────────────────────────────────────────────────────────
test('landing page loads with correct branding and nav', async ({ page }) => {
  await page.goto('/');

  // Title and branding
  await expect(page).toHaveTitle(/Jiff/i);
  await expect(page.locator('text=Meals in a Jiff').first()).toBeVisible();

  // Nav links present
  await expect(page.locator('text=Pricing')).toBeVisible();
  await expect(page.locator('text=Week plan').or(page.locator('text=📅')).first()).toBeVisible();

  // Hero CTA
  await expect(page.locator('text=Quick meal').or(page.locator('text=Jiff a meal')).first()).toBeVisible();

  console.log('✓ Landing page renders correctly');
});

// ─────────────────────────────────────────────────────────────────
// TEST 2 — Auth gate blocks unauthenticated users
// ─────────────────────────────────────────────────────────────────
test('auth gate appears when user is not signed in', async ({ page }) => {
  await page.goto('/app');

  // The auth overlay must be visible
  await expect(page.locator('.auth-gate')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('text=Welcome to Jiff')).toBeVisible();
  await expect(page.locator('text=7-day trial').or(page.locator('text=free')).first()).toBeVisible();

  // The main input card must NOT be visible behind the gate
  await expect(page.locator('.cta-btn')).not.toBeVisible();

  console.log('✓ Auth gate correctly blocks unauthenticated access');
});

// ─────────────────────────────────────────────────────────────────
// TEST 3 — Week planner loads (regression: blank page bug)
// ─────────────────────────────────────────────────────────────────
test('week planner loads without blank screen', async ({ page }) => {
  await page.goto('/planner');

  // These must all be visible — if any are missing it's a blank page
  await expect(page.locator('text=Plan my week')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('text=Breakfast')).toBeVisible();
  await expect(page.locator('text=Lunch')).toBeVisible();
  await expect(page.locator('text=Dinner')).toBeVisible();
  await expect(page.locator('text=Snack')).toBeVisible();

  // Meal type toggles render
  const toggles = page.locator('.meal-type-toggle');
  await expect(toggles).toHaveCount(4);

  // Serving controls render
  await expect(page.locator('.serving-controls')).toBeVisible();

  // 13 cuisine chips render
  const cuisineChips = page.locator('.cuisine-chip');
  const count = await cuisineChips.count();
  expect(count).toBeGreaterThanOrEqual(13);

  console.log('✓ Week planner renders all elements correctly (blank page bug not present)');
});

// ─────────────────────────────────────────────────────────────────
// TEST 4 — 13 cuisine chips on main app
// ─────────────────────────────────────────────────────────────────
test('main app shows all 13 cuisine options', async ({ page }) => {
  await injectPremiumSession(page);
  await page.goto('/app');

  // Wait for app to load past auth gate
  await expect(page.locator('.cuisine-chips')).toBeVisible({ timeout: 10_000 });

  const chips = page.locator('.cuisine-chip');
  const count = await chips.count();
  expect(count).toBeGreaterThanOrEqual(13);

  // Spot-check key cuisines
  await expect(page.locator('.cuisine-chip', { hasText: 'Indian' })).toBeVisible();
  await expect(page.locator('.cuisine-chip', { hasText: 'Japanese' })).toBeVisible();
  await expect(page.locator('.cuisine-chip', { hasText: 'Korean' })).toBeVisible();
  await expect(page.locator('.cuisine-chip', { hasText: 'Brazilian' })).toBeVisible();

  console.log(`✓ All ${count} cuisine chips rendered`);
});

// ─────────────────────────────────────────────────────────────────
// TEST 5 — Meal generation returns 5 recipes
// ─────────────────────────────────────────────────────────────────
test('meal generation returns 5 recipe cards', async ({ page }) => {
  await injectPremiumSession(page);
  await page.goto('/app');

  // Wait for input form
  await expect(page.locator('.tag-input').first()).toBeVisible({ timeout: 10_000 });

  // Add ingredients
  await addIngredients(page, ['eggs', 'onions', 'rice', 'tomatoes']);

  // Set meal type to Any (default)
  // Click generate
  await page.locator('.cta-btn').first().click();

  // Wait for loading spinner to appear then results
  await expect(page.locator('.spinner')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('.results-title')).toBeVisible({ timeout: 60_000 });

  // Should have 5 cards
  const cards = page.locator('.meal-card');
  await expect(cards).toHaveCount(5, { timeout: 10_000 });

  // Each card should have a meal name and meta
  for (let i = 0; i < 5; i++) {
    await expect(cards.nth(i).locator('.meal-name')).not.toBeEmpty();
    await expect(cards.nth(i).locator('.meal-meta')).toBeVisible();
  }

  console.log('✓ Meal generation returned 5 complete recipe cards');
});

// ─────────────────────────────────────────────────────────────────
// TEST 6 — Recipe card expand shows full recipe
// ─────────────────────────────────────────────────────────────────
test('recipe card expands to show ingredients, steps and scaler', async ({ page }) => {
  await injectPremiumSession(page);
  await page.goto('/app');
  await expect(page.locator('.tag-input').first()).toBeVisible({ timeout: 10_000 });

  await addIngredients(page, ['chicken', 'garlic', 'olive oil']);
  await page.locator('.cta-btn').first().click();
  await expect(page.locator('.results-title')).toBeVisible({ timeout: 60_000 });

  // Expand first card
  const firstCard = page.locator('.meal-card').first();
  await firstCard.locator('.expand-btn').click();

  // Verify recipe sections
  await expect(firstCard.locator('text=Ingredients')).toBeVisible();
  await expect(firstCard.locator('text=Method')).toBeVisible();
  await expect(firstCard.locator('text=Nutrition')).toBeVisible();

  // Verify ingredient list has items
  const ingItems = firstCard.locator('.ing-list li');
  const ingCount = await ingItems.count();
  expect(ingCount).toBeGreaterThan(0);

  // Verify steps exist
  const steps = firstCard.locator('.steps-list li');
  const stepCount = await steps.count();
  expect(stepCount).toBeGreaterThan(0);

  // Verify scaler bar is present
  await expect(firstCard.locator('.scaler-bar')).toBeVisible();

  // Collapse
  await firstCard.locator('.collapse-btn').click();
  await expect(firstCard.locator('.recipe')).not.toBeVisible();

  console.log(`✓ Recipe card expands correctly: ${ingCount} ingredients, ${stepCount} steps`);
});

// ─────────────────────────────────────────────────────────────────
// TEST 7 — Serving scaler changes ingredient quantities
// ─────────────────────────────────────────────────────────────────
test('serving scaler updates ingredient quantities with orange highlight', async ({ page }) => {
  await injectPremiumSession(page);
  await page.goto('/app');
  await expect(page.locator('.tag-input').first()).toBeVisible({ timeout: 10_000 });

  await addIngredients(page, ['pasta', 'tomatoes', 'cheese']);
  await page.locator('.cta-btn').first().click();
  await expect(page.locator('.results-title')).toBeVisible({ timeout: 60_000 });

  // Expand first card
  const firstCard = page.locator('.meal-card').first();
  await firstCard.locator('.expand-btn').click();
  await expect(firstCard.locator('.scaler-bar')).toBeVisible();

  // Get ingredient text before scaling
  const firstIngBefore = await firstCard.locator('.ing-list li').first().innerText();

  // Click + to increase servings
  const plusBtn = firstCard.locator('.scaler-btn').last();
  await plusBtn.click();
  await page.waitForTimeout(300);

  // Scaler badge should appear showing the multiplier
  await expect(firstCard.locator('.scaler-badge')).toBeVisible();

  // At least some ingredients should now have scaled-highlight class
  const highlighted = firstCard.locator('.scaled-highlight');
  const highlightCount = await highlighted.count();
  expect(highlightCount).toBeGreaterThan(0);

  console.log(`✓ Serving scaler works: ${highlightCount} ingredients highlighted after scaling`);
});

// ─────────────────────────────────────────────────────────────────
// TEST 8 — Step timers appear on timed steps
// ─────────────────────────────────────────────────────────────────
test('step timers appear on recipe steps with cooking times', async ({ page }) => {
  await injectPremiumSession(page);
  await page.goto('/app');
  await expect(page.locator('.tag-input').first()).toBeVisible({ timeout: 10_000 });

  // Use ingredients likely to produce timed steps
  await addIngredients(page, ['rice', 'water', 'onions', 'chicken']);
  await page.locator('.cta-btn').first().click();
  await expect(page.locator('.results-title')).toBeVisible({ timeout: 60_000 });

  // Check all 5 cards for timers
  let timerFound = false;
  const cards = page.locator('.meal-card');

  for (let i = 0; i < 5; i++) {
    const card = cards.nth(i);
    await card.locator('.expand-btn').click();
    await page.waitForTimeout(200);

    const timers = card.locator('.step-timer.idle');
    const count = await timers.count();

    if (count > 0) {
      timerFound = true;
      // Click a timer to start it
      await timers.first().click();
      await expect(card.locator('.step-timer.active').or(card.locator('.step-timer.ticking'))).toBeVisible({ timeout: 3_000 });

      // Timer display should show countdown
      const display = card.locator('.timer-display').first();
      await expect(display).toBeVisible();
      const timeText = await display.innerText();
      expect(timeText).toMatch(/\d+:\d{2}/); // e.g. "05:00"

      console.log(`✓ Step timer found and started on card ${i + 1}: ${count} timer(s), showing "${timeText}"`);

      // Collapse and move on
      await card.locator('.collapse-btn').click();
      break;
    }

    await card.locator('.collapse-btn').click();
  }

  // At least one timed step should exist across 5 recipes
  expect(timerFound).toBe(true);
});

// ─────────────────────────────────────────────────────────────────
// TEST 9 — Favourites: save and retrieve
// ─────────────────────────────────────────────────────────────────
test('favourites: save a recipe and verify it appears in the panel', async ({ page }) => {
  await injectPremiumSession(page);
  await page.goto('/app');
  await expect(page.locator('.tag-input').first()).toBeVisible({ timeout: 10_000 });

  await addIngredients(page, ['eggs', 'bread']);
  await page.locator('.cta-btn').first().click();
  await expect(page.locator('.results-title')).toBeVisible({ timeout: 60_000 });

  // Get the name of the first recipe
  const firstCard = page.locator('.meal-card').first();
  const mealName = await firstCard.locator('.meal-name').innerText();

  // Click the heart button on the first card
  await firstCard.locator('.heart-btn').click();
  await page.waitForTimeout(300);

  // Heart should now be "saved" (filled red)
  await expect(firstCard.locator('.heart-btn.saved')).toBeVisible();

  // Favourites badge in header should appear
  await expect(page.locator('.fav-badge')).toBeVisible();

  // Open favourites panel
  await page.locator('.hdr-btn.fav-active').or(page.locator('button:has-text("Favourites")')).first().click();
  await page.waitForTimeout(300);

  // Favourites panel should open and show the saved recipe
  await expect(page.locator('.favs-panel')).toBeVisible();
  await expect(page.locator('.favs-panel').locator('.meal-name', { hasText: mealName.trim() })).toBeVisible({ timeout: 5_000 });

  console.log(`✓ Favourites: saved "${mealName.trim()}" and confirmed in panel`);
});

// ─────────────────────────────────────────────────────────────────
// TEST 10 — Pricing page
// ─────────────────────────────────────────────────────────────────
test('pricing page shows all 3 plans with correct structure', async ({ page }) => {
  await page.goto('/pricing');

  // Hero
  await expect(page.locator('text=Cook smarter')).toBeVisible({ timeout: 10_000 });

  // All 3 plan cards
  await expect(page.locator('text=Monthly')).toBeVisible();
  await expect(page.locator('text=Annual')).toBeVisible();
  await expect(page.locator('text=Lifetime')).toBeVisible();
  await expect(page.locator('text=MOST POPULAR')).toBeVisible();

  // Feature comparison table
  await expect(page.locator('text=Unlimited')).toBeVisible();
  await expect(page.locator('text=Cloud synced')).toBeVisible();

  // Upgrade CTA button
  await expect(page.locator('button:has-text("Upgrade")')).toBeVisible();

  console.log('✓ Pricing page renders all 3 plans and feature table');
});

// ─────────────────────────────────────────────────────────────────
// TEST 11 — PWA manifest is reachable and correct
// ─────────────────────────────────────────────────────────────────
test('PWA manifest is reachable and has correct fields', async ({ page }) => {
  const response = await page.request.get('/manifest.json');
  expect(response.status()).toBe(200);

  const manifest = await response.json();

  expect(manifest.name).toMatch(/Jiff/i);
  expect(manifest.short_name).toBeTruthy();
  expect(manifest.theme_color).toBeTruthy();
  expect(manifest.icons).toBeTruthy();
  expect(manifest.icons.length).toBeGreaterThan(0);
  expect(manifest.start_url).toBeTruthy();

  console.log(`✓ PWA manifest valid: name="${manifest.name}", ${manifest.icons.length} icons`);
});

// ─────────────────────────────────────────────────────────────────
// TEST 12 — API smoke test: /api/suggest returns valid JSON
// ─────────────────────────────────────────────────────────────────
test('API /api/suggest returns valid meal JSON', async ({ page }) => {
  const response = await page.request.post('/api/suggest', {
    data: {
      ingredients: ['eggs', 'onions'],
      time: '30 min',
      diet: 'none',
      cuisine: 'any',
      mealType: 'any',
      defaultServings: 2,
      count: 1,           // request 1 to keep test fast
      language: 'en',
      units: 'metric',
    },
    headers: { 'Content-Type': 'application/json' },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.meals).toBeTruthy();
  expect(Array.isArray(body.meals)).toBe(true);
  expect(body.meals.length).toBeGreaterThan(0);

  const meal = body.meals[0];
  expect(meal.name).toBeTruthy();
  expect(meal.emoji).toBeTruthy();
  expect(Array.isArray(meal.ingredients)).toBe(true);
  expect(Array.isArray(meal.steps)).toBe(true);
  expect(meal.calories).toBeTruthy();

  console.log(`✓ API returns valid meal: "${meal.name}" with ${meal.ingredients.length} ingredients`);
});
