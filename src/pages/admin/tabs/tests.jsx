// src/pages/admin/tabs/tests.jsx
// Shows all unit tests and E2E tests with coverage summary

export default function Tab_TESTS({ C, Card }) {
  const UNIT_GROUPS = [('parseQty', ['parses whole number', 'parses fraction character', 'parses mixed number', 'parses fraction with slash', 'returns null for no quantity', 'handles asterisk prefix']), ('toNiceNumber', ['returns whole numbers as strings', 'converts common fractions', 'combines whole + fraction', 'handles non-standard fractions']), ('scaleIngredient', ['scales whole number', 'ratio 1 returns unchanged', 'scales to fraction', 'produces nice fractions', 'no quantity passes through unchanged']), ('scaleNutrition', ['ratio 1 unchanged', 'scales number, preserves unit', 'handles non-numeric gracefully']), ('parseStepTime', ['parses plain minutes', 'parses hours', 'parses range as midpoint', 'parses half an hour', 'returns null for no time', 'returns null for very short times']), ('formatTime', ['formats minutes and seconds', 'formats hours', 'zero']), ('extractCoreName', ['removes quantity', 'removes unit words', 'removes prep instructions', 'removes asterisk', 'handles fraction chars']), ('isAvailable', ['exact match', 'partial match - ingredient in fridge item', 'not available', 'substring match']), ('buildGroceryList', ['splits into have and need', 'empty fridge — everything in need', 'removes asterisk from need items']), ('buildShareText', ['includes meal name', 'includes at most 6 ingredients', 'includes at most 3 steps', 'includes Jiff attribution']), ('mealKey', ['generates consistent key', 'collapses whitespace']), ('getDietaryLabel', ['handles plain string', 'handles JS array', 'handles JSON string', 'handles Postgres wire format', 'handles null/undefined', 'handles multiple values'])];
  const E2E_TESTS   = ['1. Landing loads with correct stats', '2. Fridge section present', '3. Pantry section present', '4. 3-column layout shows Meal Type Servings Time', '5. Cuisine shows Indian Regional and International sections', '6. Tamil Nadu in Indian Regional section', '7. No AI chip in header', '8. CTA button says Jiff it now', '9. Avatar dropdown appears on click', '10. Favourites button always visible', '11. Fridge animation shows during generation', '12. Recipe generation returns 5 meal cards', '13. Grocery panel opens from recipe card', '14. Blinkit links shown (India-only app)', '15. Generated meals saved to localStorage history', '16. Week Plan loads', '17. Week Plan shows profile redirect when no preferences', '18. Week Plan shows meal type selector when profile set', '19. Week Plan has Back to app nav', '20. Week Plan has Goal Planner link in nav', '21. Goal Plans loads', '22. Goal Plans shows profile preferences not fridge input', '23. Goal Plans has Blinkit in grocery (India)', '24. Profile tabs do not include Cuisine tab', '25. Profile shows Cooking Skill label', '26. Profile Back to app nav', '27. Profile pantry tab has quick-add staples', '28. Sidebar shows Dietary not Cuisines', '29. Sidebar shows Cooking Skill label', '30. Country is always IN', '31. Pricing shows INR for all users', '32. History page loads and shows entries from localStorage', '33. Admin requires login', '34. Admin login with correct key', '35. Admin has all 6 tabs', '36. Admin Tools shows reset trial', '37. Admin Tools shows broadcast', '38. Tamil translation shows fridge label in Tamil', '39. Stats page loads', '40. API docs page loads', '41. All main pages load without JS errors', '42. Error boundary shows on crash', '43. vercel.json uses rewrites not builds', '44. PWA manifest is valid', '45. Surprise me button visible for logged-in users', '46. Seasonal ingredient nudge appears in header area', '47. Star rating appears on recipe cards after generation', '48. Share card button present on recipe cards', '49. Streak badge shows after setting streak in localStorage', '50. Voice input button present in fridge section', '51. Recipe rating saves to localStorage', '52. SUPABASE_SETUP.md has 4 phases documented', '53. Grocery panel opens and shows items after generation', '54. Goal Plans page loads without crashing', '55. Seasonal picker shows Blinkit/Zepto/Swiggy order options', '56. Dietary preference in sidebar shows clean text', '57. FridgePhotoUpload shows Camera and Add photo buttons', '58. Voice input 🎤 button visible inside ingredient box', '59. Recipe rating shows label after clicking star', '60. All 8 pages load without JS errors', '61. Dietary Preferences card not in sidebar', '62. Your Preferences Dietary shows clean text', '63. Rating stars visible on collapsed recipe card', '64. Planner header does not have active Week plan chip', '65. Dietary preference shows human-readable label', '66. getDietaryLabel handles JS array format correctly', '67. Camera button present and shows correct label', '68. Notification bell present in header', '69. Only one share button per recipe card', '70. Share dropdown shows WhatsApp, copy, download options', '71. Camera button not visible on desktop', '72. Translate 🌐 button appears in ingredient input', '73. Insights page loads without errors', '74. Insights shows empty state when no meal history', '75. Insights header nav link visible to logged-in users', '76. FamilySelector appears when family members set in profile', '77. Profile page has Family tab', '78. Admin has separate Crashes tab', '79. Admin Crashes tab content loads', '80. Admin Releases tab logs a release', '81. GroceryPanel shows Blinkit/Zepto/Swiggy delivery buttons', '82. Smart recommendations strip shows after rating', '83. Profile Settings tab has nutrition goals', '84. WhatsApp webhook responds to GET verification', '85. Sign-in gate has close/dismiss button', '86. Little Chefs page loads correctly', '87. Little Chefs age groups visible', '88. Little Chefs nav link in header', '89. Admin has Status tab', '90. Admin CI/CD tab shows pipeline'];
  const totalUnit = UNIT_GROUPS.reduce((s,[,ts])=>s+ts.length,0);

  return (
    <>
      {/* Summary */}
      <Card title="Test coverage summary">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:8}}>
          {[
            [totalUnit, 'Unit tests', 'src/lib utilities', C.jiff],
            [UNIT_GROUPS.length, 'Test groups', 'describe() blocks', C.green],
            [E2E_TESTS.length, 'E2E tests', 'Playwright + browser', C.purple],
          ].map(([val,label,sub,color])=>(
            <div key={label} style={{background:C.warm,border:'1px solid '+C.border,borderRadius:10,padding:'12px 14px'}}>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:700,color}}>{val}</div>
              <div style={{fontSize:12,fontWeight:500,color:C.ink,marginTop:2}}>{label}</div>
              <div style={{fontSize:10,color:C.muted,fontWeight:300}}>{sub}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,padding:'8px 12px',background:'rgba(28,10,0,0.02)',borderRadius:8,fontSize:11,color:C.muted}}>
          Run unit tests: <code style={{color:C.jiff}}>npx jest tests/unit/lib.test.js</code>
          &nbsp;·&nbsp;
          Run E2E: <code style={{color:C.jiff}}>npx playwright test</code>
        </div>
      </Card>

      {/* Unit tests */}
      <Card title={\`Unit tests — \${totalUnit} tests across \${UNIT_GROUPS.length} modules\`}>
        <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12}}>
          Pure function tests in <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'1px 4px',borderRadius:3}}>tests/unit/lib.test.js</code> — no browser, runs in milliseconds.
        </div>
        {UNIT_GROUPS.map(([group, tests])=>(
          <div key={group} style={{marginBottom:12}}>
            <div style={{fontSize:11,letterSpacing:'1.5px',textTransform:'uppercase',color:C.jiff,fontWeight:500,marginBottom:4}}>
              {group}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {tests.map((t,i)=>(
                <span key={i} style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'rgba(29,158,117,0.08)',color:'#1D9E75',border:'1px solid rgba(29,158,117,0.2)'}}> ✓ {t}</span>
              ))}
            </div>
          </div>
        ))}
      </Card>

      {/* E2E tests */}
      <Card title={\`E2E tests — \${E2E_TESTS.length} tests (Playwright)\`}>
        <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12}}>
          End-to-end browser tests in <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'1px 4px',borderRadius:3}}>tests/jiff.spec.js</code> — runs against live URL.
        </div>
        <div style={{columns:2,columnGap:16}}>
          {E2E_TESTS.map((t,i)=>(
            <div key={i} style={{fontSize:10,color:C.muted,padding:'2px 0',breakInside:'avoid'}}> ✓ {t}</div>
          ))}
        </div>
      </Card>
    </>
  );
}
