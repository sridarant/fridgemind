// src/lib/sharing.js — Recipe share text formatting
// Pure functions — no React dependencies.

/**
 * Build a WhatsApp-formatted share text for a meal.
 * Includes name, description, first 6 ingredients, first 3 steps, nutrition.
 */
export function buildShareText(meal) {
  return [
    `⚡ *Jiff Recipe*`,
    ``,
    `${meal.emoji} *${meal.name}*`,
    meal.description,
    ``,
    `*Ingredients:*`,
    meal.ingredients?.slice(0, 6).join(', ') || '',
    ``,
    `*Steps:*`,
    meal.steps?.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n') || '',
    ``,
    `🔥 ${meal.calories} cal  |  💪 ${meal.protein}`,
    ``,
    `_Made with ⚡ Jiff — jiff.app_`,
  ].join('\n');
}
