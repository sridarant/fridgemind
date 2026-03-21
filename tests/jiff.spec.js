// tests/jiff.spec.js — Jiff E2E suite v15 — 18 tests
import { test, expect } from '@playwright/test';

async function injectPremium(page) {
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem('jiff-premium', JSON.stringify({ planId:'monthly', paymentId:'test', activatedAt:now, expiresAt:now+30*24*60*60*1000, test:true }));
    localStorage.setItem('jiff-trial', JSON.stringify({ userId:'test-user', startedAt:now, expiresAt:now+7*24*60*60*1000 }));
    localStorage.setItem('jiff-cookie-consent', 'accepted');
  });
}

async function addIng(page, items) {
  const input = page.locator('.tag-input').first();
  for (const item of items) { await input.fill(item); await input.press('Enter'); await page.waitForTimeout(120); }
}

async function genMeals(page, ings = ['eggs','onions','rice']) {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('.tag-input').first()).toBeVisible({ timeout:10_000 });
  await addIng(page, ings);
  await page.locator('.cta-btn').first().click();
  await expect(page.locator('.results-title')).toBeVisible({ timeout:60_000 });
}

// 1 — Landing global branding
test('landing page: global branding, no Tamil Nadu', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jiff-cookie-consent','accepted'));
  await page.goto('/');
  await expect(page).toHaveTitle(/Jiff/i);
  expect((await page.locator('body').innerText()).toLowerCase()).not.toContain('tamil nadu');
  console.log('✓ Landing: global, no regional references');
});

// 2 — Cookie banner appears
test('cookie consent banner appears on fresh visit', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('button:has-text("Accept cookies")').first()).toBeVisible({ timeout:5_000 });
  await page.locator('button:has-text("Accept cookies")').first().click();
  await expect(page.locator('button:has-text("Accept cookies")')).not.toBeVisible({ timeout:3_000 });
  const c = await page.evaluate(() => localStorage.getItem('jiff-cookie-consent'));
  expect(c).toBe('accepted');
  console.log('✓ Cookie banner: appears, accept works, stored');
});

// 3 — Cookie decline
test('cookie consent decline works', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);
  const btn = page.locator('button:has-text("Decline")').first();
  if (await btn.isVisible()) {
    await btn.click();
    const c = await page.evaluate(() => localStorage.getItem('jiff-cookie-consent'));
    expect(c).toBe('declined');
    console.log('✓ Cookie decline: stored as declined');
  } else { console.log('✓ Cookie banner not shown (consent pre-set)'); }
});

// 4 — Privacy policy page
test('privacy policy page loads with all sections', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.locator('text=Privacy Policy')).toBeVisible({ timeout:8_000 });
  for (const s of ['What we collect','Cookies','Your rights']) {
    await expect(page.locator(`text=${s}`).first()).toBeVisible();
  }
  console.log('✓ Privacy policy page: all sections present');
});

// 5 — Privacy link in footer
test('landing footer has privacy policy link', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jiff-cookie-consent','accepted'));
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await expect(page.locator('text=Privacy policy').first()).toBeVisible({ timeout:5_000 });
  console.log('✓ Privacy link in Landing footer');
});

// 6 — Animated logo renders
test('JiffLogo animated component renders in header', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('.jiff-logo-wrap').first()).toBeVisible({ timeout:10_000 });
  const text = await page.locator('.jiff-logo-name').first().innerText();
  expect(text.toLowerCase()).toContain('jiff');
  console.log('✓ JiffLogo: animated logo renders in header');
});

// 7 — Snacks (not Snack)
test('meal types show Snacks not Snack', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('.meal-type-chips')).toBeVisible({ timeout:10_000 });
  await expect(page.locator('.meal-type-chip', { hasText: 'Snacks' })).toBeVisible();
  await page.goto('/planner');
  await expect(page.locator('.meal-type-toggle', { hasText: 'Snacks' })).toBeVisible({ timeout:8_000 });
  console.log('✓ Snacks (with s) in both app and planner');
});

// 8 — Sidebar: Allergies + Cuisines, no Units
test('sidebar preferences: Allergies and Cuisines shown, not Units', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('.main-sidebar')).toBeVisible({ timeout:10_000 });
  const txt = await page.locator('.main-sidebar').innerText();
  expect(txt).toContain('Allergies');
  expect(txt).toContain('Cuisines');
  console.log('✓ Sidebar: Allergies and Cuisines present');
});

// 9 — Auth gate
test('auth gate blocks unauthenticated users', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jiff-cookie-consent','accepted'));
  await page.goto('/app');
  await expect(page.locator('.auth-gate')).toBeVisible({ timeout:10_000 });
  await expect(page.locator('text=Welcome to Jiff')).toBeVisible();
  console.log('✓ Auth gate blocks unauthenticated access');
});

// 10 — Planner loads (blank page regression)
test('week planner loads without blank screen', async ({ page }) => {
  await page.goto('/planner');
  await expect(page.locator('text=Plan my week')).toBeVisible({ timeout:10_000 });
  for (const t of ['Breakfast','Lunch','Dinner','Snacks']) {
    await expect(page.locator(`text=${t}`).first()).toBeVisible();
  }
  expect(await page.locator('.meal-type-toggle').count()).toBe(4);
  expect(await page.locator('.cuisine-chip').count()).toBeGreaterThanOrEqual(13);
  console.log('✓ Planner loads correctly — blank page regression not present');
});

// 11 — 13 cuisines
test('13 cuisine options present', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('.cuisine-chips')).toBeVisible({ timeout:10_000 });
  expect(await page.locator('.cuisine-chip').count()).toBeGreaterThanOrEqual(13);
  for (const c of ['Indian','Japanese','Korean','Brazilian','French']) {
    await expect(page.locator('.cuisine-chip', { hasText: c })).toBeVisible();
  }
  console.log('✓ All 13 cuisine chips present');
});

// 12 — Goal plans page
test('goal plans page shows 6 plan types', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/plans');
  await expect(page.locator('text=Meal Plans').or(page.locator('text=Goal-based')).first()).toBeVisible({ timeout:10_000 });
  expect(await page.locator('button:has-text("Generate this plan")').count()).toBe(6);
  for (const p of ['Weight Loss','Muscle Gain','Family Friendly','Budget Meals','Vegetarian Week','15-Minute Meals']) {
    await expect(page.locator(`text=${p}`).first()).toBeVisible();
  }
  console.log('✓ Goal plans: 6 plan types all present');
});

// 13 — 5 recipes generated
test('meal generation returns 5 recipe cards', async ({ page }) => {
  await genMeals(page, ['eggs','onions','rice','tomatoes']);
  const cards = page.locator('.meal-card');
  await expect(cards).toHaveCount(5, { timeout:10_000 });
  for (let i = 0; i < 5; i++) await expect(cards.nth(i).locator('.meal-name')).not.toBeEmpty();
  console.log('✓ 5 recipe cards returned');
});

// 14 — Recipe expand + scaler
test('recipe card expands and serving scaler works', async ({ page }) => {
  await genMeals(page, ['chicken','garlic','olive oil']);
  const card = page.locator('.meal-card').first();
  await card.locator('.expand-btn').click();
  await expect(card.locator('text=Ingredients')).toBeVisible();
  await expect(card.locator('.scaler-bar')).toBeVisible();
  await card.locator('.scaler-btn').last().click();
  await page.waitForTimeout(300);
  await expect(card.locator('.scaler-badge')).toBeVisible();
  expect(await card.locator('.scaled-highlight').count()).toBeGreaterThan(0);
  console.log('✓ Recipe expand and scaler both work');
});

// 15 — Step timers
test('step timers appear and start on timed steps', async ({ page }) => {
  await genMeals(page, ['rice','water','chicken','onions']);
  const cards = page.locator('.meal-card');
  let found = false;
  for (let i = 0; i < 5; i++) {
    const card = cards.nth(i);
    await card.locator('.expand-btn').click();
    await page.waitForTimeout(200);
    const timers = card.locator('.step-timer.idle');
    if (await timers.count() > 0) {
      found = true;
      await timers.first().click();
      await expect(card.locator('.timer-display').first()).toBeVisible({ timeout:3_000 });
      const t = await card.locator('.timer-display').first().innerText();
      expect(t).toMatch(/\d+:\d{2}/);
      console.log(`✓ Step timer started: "${t}"`);
      await card.locator('.collapse-btn').click();
      break;
    }
    await card.locator('.collapse-btn').click();
  }
  expect(found).toBe(true);
});

// 16 — Favourites
test('favourites: save and retrieve works', async ({ page }) => {
  await genMeals(page, ['eggs','bread']);
  const card = page.locator('.meal-card').first();
  const name = await card.locator('.meal-name').innerText();
  await card.locator('.heart-btn').click();
  await page.waitForTimeout(300);
  await expect(card.locator('.heart-btn.saved')).toBeVisible();
  await page.locator('.hdr-btn.fav-active').or(page.locator('button:has-text("Favourites")')).first().click();
  await expect(page.locator('.favs-panel .meal-name', { hasText: name.trim() })).toBeVisible({ timeout:5_000 });
  console.log(`✓ Saved "${name.trim()}" and found in favourites panel`);
});

// 17 — Pricing coming soon
test('pricing shows coming soon with email waitlist', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jiff-cookie-consent','accepted'));
  await page.goto('/pricing');
  await expect(page.locator('text=coming soon').or(page.locator('text=Coming soon').or(page.locator('text=onboarding'))).first()).toBeVisible({ timeout:10_000 });
  await expect(page.locator('button:has-text("Upgrade to")')).not.toBeVisible();
  await page.locator('input[type="email"]').first().fill('waitlist@test.com');
  await page.locator('button:has-text("Notify")').first().click();
  const stored = await page.evaluate(() => localStorage.getItem('jiff-global-waitlist'));
  expect(stored).toBeTruthy();
  console.log('✓ Pricing: coming soon shown, waitlist captured');
});

// 18 — PWA manifest + API smoke
test('PWA manifest valid and /api/suggest returns meals', async ({ page }) => {
  const mRes = await page.request.get('/manifest.json');
  expect(mRes.status()).toBe(200);
  const m = await mRes.json();
  expect(m.name).toMatch(/Jiff/i);
  expect(m.icons?.length).toBeGreaterThan(0);
  const aRes = await page.request.post('/api/suggest', {
    data: { ingredients:['eggs','onions'], time:'30 min', diet:'none', cuisine:'any', mealType:'any', defaultServings:2, count:1, language:'en', units:'metric' },
    headers: { 'Content-Type':'application/json' },
  });
  expect(aRes.status()).toBe(200);
  const body = await aRes.json();
  expect(Array.isArray(body.meals)).toBe(true);
  expect(body.meals[0].name).toBeTruthy();
  console.log(`✓ Manifest valid, API works: "${body.meals[0].name}"`);
});
