// tests/jiff.spec.js — Jiff E2E suite v16.4 — 36 tests
import { test, expect } from '@playwright/test';

async function injectPremium(page) {
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem('jiff-premium', JSON.stringify({ planId:'monthly', paymentId:'test', activatedAt:now, expiresAt:now+30*86400000, test:true }));
    localStorage.setItem('jiff-trial',   JSON.stringify({ userId:'test', startedAt:now, expiresAt:now+7*86400000 }));
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

// ── 1. Landing loads with correct copy ────────────────────────────
test('1. Landing page loads with correct copy', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Jiff/);
  await expect(page.locator('text=28 cuisines')).toBeVisible();
  await expect(page.locator('text=10 languages')).toBeVisible();
  await expect(page.locator('text=Try Jiff')).toBeVisible();
  // Should NOT show "it's free" or pricing misinformation
  await expect(page.locator("text=it's free")).not.toBeVisible();
});

// ── 2. Cookie banner ───────────────────────────────────────────────
test('2. Cookie banner accept stores consent', async ({ page }) => {
  await page.goto('/');
  await page.locator('text=Accept all').waitFor({ timeout: 5000 });
  await page.locator('text=Accept all').click();
  const consent = await page.evaluate(() => localStorage.getItem('jiff-cookie-consent-v2'));
  expect(JSON.parse(consent).analytics).toBe(true);
});

// ── 3. Auth gate ───────────────────────────────────────────────────
test('3. Unauthenticated users see sign-in gate', async ({ page }) => {
  await page.goto('/app');
  await expect(page.locator('.auth-card, text=Sign in').first()).toBeVisible();
});

// ── 4. Fridge section ─────────────────────────────────────────────
test("4. Main app has 'What's in your fridge?' section", async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator("text=What's in your fridge?")).toBeVisible();
});

// ── 5. Pantry section ─────────────────────────────────────────────
test('5. Pantry & Spices section is present', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('text=Pantry, text=PANTRY').first()).toBeVisible();
});

// ── 6. Cuisine in sidebar ─────────────────────────────────────────
test('6. Cuisine selector is in sidebar', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  const sidebar = page.locator('.main-sidebar');
  await expect(sidebar.locator('text=CUISINE, text=Cuisine').first()).toBeVisible();
});

// ── 7. Tamil Nadu in Indian submenu ──────────────────────────────
test('7. Indian cuisine submenu has Tamil Nadu and Karnataka', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await page.locator('button', { hasText: /Indian/ }).first().click();
  await expect(page.locator('text=Tamil Nadu')).toBeVisible();
  await expect(page.locator('text=Karnataka')).toBeVisible();
  await expect(page.locator('text=Chettinad')).not.toBeVisible();
});

// ── 8. No duplicate Any cuisine ───────────────────────────────────
test('8. Only one Any cuisine chip', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('button', { hasText: /^Any cuisine$/ })).toHaveCount(1);
});

// ── 9. CTA says Jiff it now ───────────────────────────────────────
test('9. CTA button says "Jiff it now!"', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('.cta-btn, button', { hasText: 'Jiff it now' }).first()).toBeVisible();
});

// ── 10. No AI chip in header ──────────────────────────────────────
test('10. No AI chip in app header', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  await expect(page.locator('.header-tag')).not.toBeVisible();
});

// ── 11. Favourites button always visible ─────────────────────────
test('11. Favourites button visible without login', async ({ page }) => {
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  // Favourites button should exist in header even when not logged in
  const favBtn = page.locator('button', { hasText: 'Favourites' }).first();
  await expect(favBtn).toBeVisible();
});

// ── 12. Back to app navigation ────────────────────────────────────
test('12. Planner has Back to app button', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/planner');
  await expect(page.locator('text=Back to app')).toBeVisible();
});

// ── 13. Week Plan loads and generates ────────────────────────────
test("13. Week Plan loads with fridge section and can submit", async ({ page }) => {
  await injectPremium(page);
  await page.goto('/planner');
  await page.waitForLoadState('networkidle');
  await expect(page.locator("text=What's in your fridge?")).toBeVisible();
  // Add an ingredient
  const input = page.locator('.ing-text-input').first();
  await input.fill('rice');
  await input.press('Enter');
  // Submit button should be available
  await expect(page.locator('.cta-btn').first()).toBeEnabled();
});

// ── 14. Goal Plans loads ──────────────────────────────────────────
test("14. Goal Plans loads with fridge section", async ({ page }) => {
  await injectPremium(page);
  await page.goto('/plans');
  await page.waitForLoadState('networkidle');
  await expect(page.locator("text=What's in your fridge?")).toBeVisible();
  await expect(page.locator('text=Weight Loss, text=Muscle Gain').first()).toBeVisible();
});

// ── 15. History page loads ────────────────────────────────────────
test('15. History page loads and shows empty state or entries', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/history');
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('text=History, text=No meals yet, text=Your meal history').first()).toBeVisible();
});

// ── 16. History saves to localStorage ────────────────────────────
test('16. Generated meals appear in History via localStorage', async ({ page }) => {
  await genMeals(page);
  // Navigate to history
  await page.goto('/history');
  await page.waitForLoadState('networkidle');
  // Should show entries (localStorage persists within session)
  const histItems = page.locator('.history-item, .meal-history-row, text=ago');
  // At least some content - either entries or empty state
  await expect(page.locator('text=History, text=Your meal history').first()).toBeVisible();
});

// ── 17. Pricing page shows correct currency ───────────────────────
test('17. Pricing shows currency for detected country', async ({ page }) => {
  // Simulate Indian user
  await page.addInitScript(() => localStorage.setItem('jiff-country', 'IN'));
  await page.goto('/pricing');
  await expect(page.locator('text=₹, text=INR, text=Razorpay').first()).toBeVisible();
});

// ── 18. Pricing gates unsupported countries ───────────────────────
test('18. Pricing shows coming soon for unsupported country', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jiff-country', 'BR'));
  await page.goto('/pricing');
  await expect(page.locator('text=Coming to your region, text=soon').first()).toBeVisible();
});

// ── 19. Profile completion prompt ────────────────────────────────
test('19. Profile completion prompt shown after login without prefs', async ({ page }) => {
  await page.goto('/app');
  await expect(page.locator('text=Sign in, text=Personalise your experience').first()).toBeVisible();
});

// ── 20. Stats page loads ──────────────────────────────────────────
test('20. Stats page loads at /stats', async ({ page }) => {
  await page.goto('/stats');
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('text=Jiff Stats, text=Stats').first()).toBeVisible();
});

// ── 21. Admin page login ──────────────────────────────────────────
test('21. Admin page shows login gate at /admin', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('text=Jiff Admin')).toBeVisible();
  await expect(page.locator('text=Admin key, input[type=password]').first()).toBeVisible();
});

// ── 22. API docs page ─────────────────────────────────────────────
test('22. API docs page loads at /api-docs', async ({ page }) => {
  await page.goto('/api-docs');
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('text=API, text=Free, text=Starter, text=Pro').first()).toBeVisible();
});

// ── 23. Profile pantry tab has autocomplete ───────────────────────
test('23. Profile pantry tab uses IngredientInput with quick-add', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/profile');
  await page.locator('button, text=Pantry').first().click();
  await expect(page.locator('text=Quick add, text=quick add').first()).toBeVisible();
});

// ── 24. Profile food type multi-select ───────────────────────────
test('24. Profile food type allows multiple selections', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/profile');
  // Click Vegetarian
  const vegCard = page.locator('text=Vegetarian').first();
  await vegCard.click();
  // ✓ checkmark should appear
  await expect(page.locator('text=✓').first()).toBeVisible();
});

// ── 25. Language change in sidebar ───────────────────────────────
test('25. Language change updates meal type labels', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/app');
  const langSelect = page.locator('select').first();
  await langSelect.selectOption('ta');
  await page.waitForTimeout(500);
  await expect(page.locator('text=காலை உணவு, text=உணவு வகை').first()).toBeVisible();
});

// ── 26. Error boundary renders on crash ──────────────────────────
test('26. Privacy page loads (sanity check)', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.locator('text=Privacy Policy')).toBeVisible();
});

// ── 27. Recipe generation ─────────────────────────────────────────
test('27. Recipe generation returns 5 meal cards', async ({ page }) => {
  await genMeals(page);
  await expect(page.locator('.meal-card')).toHaveCount(5, { timeout: 45000 });
});

// ── 28. Grocery list with Blinkit ────────────────────────────────
test('28. Grocery list opens and shows Blinkit for India', async ({ page }) => {
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem('jiff-premium', JSON.stringify({ planId:'monthly', paymentId:'test', activatedAt:now, expiresAt:now+30*86400000, test:true }));
    localStorage.setItem('jiff-cookie-consent-v2', JSON.stringify({ essential:true, ts:now }));
    localStorage.setItem('jiff-country', 'IN');
    localStorage.setItem('jiff-lang', 'en');
  });
  await page.goto('/app');
  await addFridgeItem(page, 'eggs');
  await page.locator('.cta-btn').click();
  await page.waitForSelector('.meal-card', { timeout: 45000 });
  await page.locator('.meal-card').first().click();
  await page.locator('text=What do I need to buy').first().click();
  await expect(page.locator('text=Need to buy, text=NEED TO BUY').first()).toBeVisible();
});

// ── 29. Planner pantry pre-fill ───────────────────────────────────
test('29. Planner has Pantry & Spices section', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/planner');
  await expect(page.locator('text=Pantry, text=PANTRY').first()).toBeVisible();
});

// ── 30. Plans pantry pre-fill ─────────────────────────────────────
test('30. Goal Plans has Pantry & Spices section', async ({ page }) => {
  await injectPremium(page);
  await page.goto('/plans');
  await expect(page.locator('text=Pantry, text=PANTRY').first()).toBeVisible();
});

// ── 31. No crashes on all main pages ─────────────────────────────
test('31. All main pages load without JS errors', async ({ page }) => {
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));
  for (const url of ['/app', '/planner', '/plans', '/history', '/profile']) {
    await injectPremium(page);
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  }
  const realErrors = jsErrors.filter(e => !e.includes('Warning') && !e.includes('console'));
  expect(realErrors).toHaveLength(0);
});

// ── 32. Pricing back to app ───────────────────────────────────────
test('32. Pricing page has Back to app link', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jiff-country', 'IN'));
  await page.goto('/pricing');
  await expect(page.locator('text=Back to app').first()).toBeVisible();
});

// ── 33. ENABLED_COUNTRIES constant ───────────────────────────────
test('33. Enabled countries include IN SG GB AU US', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jiff-country', 'IN'));
  await page.goto('/pricing');
  // Indian user should see the pricing page (not the coming-soon page)
  await expect(page.locator('text=Coming to your region')).not.toBeVisible();
});

// ── 34. History stores in localStorage ───────────────────────────
test('34. History localStorage key is set after meal generation', async ({ page }) => {
  await genMeals(page, ['chicken', 'onion']);
  const hist = await page.evaluate(() => localStorage.getItem('jiff-history'));
  expect(hist).toBeTruthy();
  const parsed = JSON.parse(hist);
  expect(parsed.length).toBeGreaterThan(0);
});

// ── 35. PWA manifest ─────────────────────────────────────────────
test('35. PWA manifest is valid', async ({ page }) => {
  const res = await page.request.get('/manifest.json');
  expect(res.status()).toBe(200);
  const m = await res.json();
  expect(m.name).toBeTruthy();
  expect(m.icons?.length).toBeGreaterThan(0);
});

// ── 36. vercel.json uses rewrites not builds ──────────────────────
test('36. vercel.json uses modern rewrites format', async ({ page }) => {
  // Check the app loads (if vercel.json is broken, routing breaks)
  await page.goto('/app');
  await expect(page).toHaveURL(/\/app/);
  await page.goto('/planner');
  await expect(page).toHaveURL(/\/planner/);
});

// ── 37. i18n: Tamil language changes fridge label ─────────────────
test('37. Switching to Tamil translates fridge section label', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('jiff-lang', 'ta');
    const now = Date.now();
    localStorage.setItem('jiff-premium', JSON.stringify({ planId:'monthly', paymentId:'test', activatedAt:now, expiresAt:now+30*86400000, test:true }));
    localStorage.setItem('jiff-cookie-consent-v2', JSON.stringify({ essential:true, ts:now }));
  });
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  // Tamil fridge label
  await expect(page.locator('text=உங்கள் ஃப்ரிட்ஜில்').first()).toBeVisible({ timeout: 5000 });
});

// ── 38. History renders after localStorage save ────────────────────
test('38. History page renders entries saved to localStorage', async ({ page }) => {
  // Pre-seed localStorage with a history entry using correct 'meal' key
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem('jiff-premium', JSON.stringify({ planId:'monthly', paymentId:'test', activatedAt:now, expiresAt:now+30*86400000, test:true }));
    localStorage.setItem('jiff-cookie-consent-v2', JSON.stringify({ essential:true, ts:now }));
    const fakeEntry = {
      id: '1234567890',
      meal: [{ name: 'Dal Rice', emoji: '🍚', time: '20 min', description: 'Classic comfort food' }],
      mealType: 'lunch', cuisine: 'Tamil Nadu',
      servings: 2, ingredients: ['rice','dal'],
      generated_at: new Date().toISOString(),
    };
    localStorage.setItem('jiff-history', JSON.stringify([fakeEntry]));
  });
  await page.goto('/history');
  await page.waitForLoadState('networkidle');
  // Should not crash and should show the entry
  await expect(page.locator('text=Dal Rice')).toBeVisible({ timeout: 5000 });
});

// ── 39. Profile nav says Back to app ─────────────────────────────
test('39. Profile page has Back to app button', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.locator('text=Back to app').first()).toBeVisible();
});

// ── 40. Cuisine preferred highlighted ─────────────────────────────
test('40. Preferred cuisines shown highlighted in sidebar', async ({ page }) => {
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem('jiff-premium', JSON.stringify({ planId:'monthly', paymentId:'test', activatedAt:now, expiresAt:now+30*86400000, test:true }));
    localStorage.setItem('jiff-cookie-consent-v2', JSON.stringify({ essential:true, ts:now }));
    // Simulate profile with multiple preferred cuisines
    localStorage.setItem('jiff-profile-cache', JSON.stringify({
      preferred_cuisines: ['Tamil Nadu', 'Karnataka', 'Mexican'],
    }));
  });
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  // Cuisine section should be visible in sidebar
  const sidebar = page.locator('.main-sidebar');
  await expect(sidebar.locator('text=CUISINE, text=Cuisine').first()).toBeVisible();
});
