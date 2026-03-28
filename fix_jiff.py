#!/usr/bin/env python3
# fix_jiff.py - Run this in your fridgemind repo folder to fix all 3 syntax errors
# Usage: python fix_jiff.py

import os, sys

path = 'src/pages/Jiff.jsx'
if not os.path.exists(path):
    print("ERROR: Run this script from inside the fridgemind repo folder")
    print("Expected:", os.getcwd() + "/" + path)
    sys.exit(1)

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content
fixes = 0

# Fix 1: Extra }} on Insights button (L1315 area)
if '>Insights</button>}}' in content:
    content = content.replace('>Insights</button>}}', '>Insights</button>}')
    fixes += 1
    print("Fix 1 applied: Removed extra }} on Insights button")
else:
    print("Fix 1: Already clean")

# Fix 2: Dietary profilePrefs missing closing brace
if "getDietaryLabel(profile.food_type),\n        { key: 'Cooking Skill'" in content:
    content = content.replace(
        "getDietaryLabel(profile.food_type),\n        { key: 'Cooking Skill'",
        "getDietaryLabel(profile.food_type) },\n    { key: 'Cooking Skill'"
    )
    fixes += 1
    print("Fix 2 applied: Closed Dietary profilePrefs object")
else:
    print("Fix 2: Already clean")

# Fix 3: Apostrophe in notification string
bad = "body:'Keep it up \xe2\x80\x94 you're building a great habit.'"
if bad.encode() in content.encode():
    content = content.replace(
        "body:'Keep it up \u2014 you're building a great habit.'",
        'body:"Keep it up \u2014 you\'re building a great habit."'
    )
    fixes += 1
    print("Fix 3 applied: Fixed apostrophe in notification string")
else:
    print("Fix 3: Already clean")

if content != original:
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print(f"\nSaved {fixes} fix(es) to {path}")
    print("\nNow run:")
    print("  git add src/pages/Jiff.jsx")
    print("  git commit -m 'fix: syntax errors in Jiff.jsx'")
    print("  git push")
else:
    print("\nNo changes needed - file already has all fixes applied")
    print("If Vercel still fails, run:")
    print("  git commit --allow-empty -m 'force redeploy'")
    print("  git push")
