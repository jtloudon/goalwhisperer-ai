# Theme System Migration - Test Plan

## Phase 1: Setup ✓ COMPLETE

### Actions Taken
- [x] Created `frontend/src/theme.css` with purple palette
- [x] Imported theme.css into App.css
- [x] Updated body background to use `var(--bg-gradient)`
- [x] Updated text colors to use `var(--text-primary)`
- [x] Updated font-family to use `var(--font-body)`

### Test Checklist
- [x] Servers running without errors
- [x] Vite HMR detected changes
- [x] No console errors
- [ ] Manual: Background shows purple-tinted gradient
- [ ] Manual: Typography renders correctly
- [ ] Manual: No visual regressions

---

## Phase 2: Component Migration

### Components to Migrate (27 instances)

#### 1. TopNav.css (3 instances) - PRIORITY: HIGH
**Lines to change:**
- Line 48: `color: #a855f7;` → `color: var(--primary);`
- Line 53: `color: #a855f7;` → `color: var(--primary);`
- Line 64: `background: #a855f7;` → `background: var(--primary);`

**Test after migration:**
- [ ] Nav links are purple colored
- [ ] Active indicator is purple
- [ ] Hover states work correctly

---

#### 2. Sidebar.css (1 instance) - PRIORITY: HIGH
**Lines to change:**
- Line 15: `background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);` → `background: var(--primary-gradient-solid);`

**Test after migration:**
- [ ] Sidebar gradient displays correctly
- [ ] Colors match brand palette

---

#### 3. ClaudePanel.css (5 instances) - PRIORITY: CRITICAL
**Lines to change:**
- Line 27: `#8b5cf6 66%,` → Keep (part of agent gradient)
- Line 222: `background: #a855f7;` → `background: var(--primary);`
- Line 228: `background: #9333ea;` → `background: var(--primary-dark);`
- Line 454: `color: #a855f7 !important;` → `color: var(--primary) !important;`
- Line 455: `border: 1px solid #a855f7 !important;` → `border: 1px solid var(--primary) !important;`

**Note:** Line 27 might be part of agent identity - verify before changing

**Test after migration:**
- [ ] Agent messages display correctly
- [ ] Agent gradient preserved (purple/pink/blue)
- [ ] Button colors correct
- [ ] Border colors correct

---

#### 4. Dashboard.css (3 instances) - PRIORITY: HIGH
**Lines to change:**
- Line 58: `color: #a855f7;` → `color: var(--primary);`
- Line 119: `color: #a855f7;` → `color: var(--primary);`
- Line 141: `color: #a855f7;` → `color: var(--primary);`

**Test after migration:**
- [ ] Dashboard accent colors correct
- [ ] KPI stats display properly
- [ ] Progress indicators use brand color

---

#### 5. Page.css (10 instances) - PRIORITY: HIGH
**Lines to change:**
- Line 21: `color: #a855f7 !important;` → `color: var(--primary) !important;`
- Line 108: `background: linear-gradient(90deg, #7c3aed 0%, #c4b5fd 100%);` → `background: var(--primary-gradient);`
- Line 158: `color: #a855f7;` → `color: var(--primary);`
- Line 218: `color: #a855f7;` → `color: var(--primary);`
- Line 267: `color: #a855f7;` → `color: var(--primary);`
- Line 276: `color: #a855f7;` → `color: var(--primary);`
- Line 302: `color: #a855f7;` → `color: var(--primary);`
- Line 348: `color: #a855f7;` → `color: var(--primary);`
- Line 631: `color: #a855f7;` → `color: var(--primary);`
- Line 710: `background: #a855f7;` → `background: var(--primary);`
- Line 741: `color: #a855f7;` → `color: var(--primary);`

**Test after migration:**
- [ ] Page headers correct color
- [ ] Progress bars use brand gradient
- [ ] Links styled correctly
- [ ] Pills/tags use brand color
- [ ] Buttons have correct background

---

#### 6. WinsTrendline.css (1 instance) - PRIORITY: MEDIUM
**Lines to change:**
- Line 31: `color: #8b5cf6;` → `color: var(--primary);`

**Test after migration:**
- [ ] Wins trendline renders correctly
- [ ] Chart colors match brand

---

#### 7. WinsTrendline.jsx (1 instance) - PRIORITY: MEDIUM
**Lines to change:**
- Line 46: `<stop offset="100%" stopColor="#a855f7" />` → `<stop offset="100%" stopColor="var(--primary)" />`

**Test after migration:**
- [ ] SVG gradient renders (note: CSS variables may not work in SVG attributes)
- [ ] Alternative: Use inline style or data attribute

---

#### 8. Objectives.jsx (4 instances) - PRIORITY: HIGH
**Lines to change:**
- Line 110: `background: '#a855f7',` → `background: 'var(--primary)',`
- Line 132: `borderTop: '5px solid #a855f7'` → `borderTop: '5px solid var(--primary)'`
- Line 210: `background: '#a855f7',` → `background: 'var(--primary)',`
- Line 232: `borderTop: '5px solid #a855f7'` → `borderTop: '5px solid var(--primary)'`

**Test after migration:**
- [ ] Objective cards render correctly
- [ ] Border colors use brand color
- [ ] Background colors correct

---

## Phase 3: Final Validation

### Visual Regression Checklist
- [ ] **Navigation**
  - [ ] Brand logo/text displays correctly
  - [ ] Nav links styled with purple
  - [ ] Active states visible
  - [ ] Hover states work

- [ ] **Sidebar**
  - [ ] Purple gradient background
  - [ ] Text readable
  - [ ] Icons visible

- [ ] **Dashboard**
  - [ ] KPIs use purple accents
  - [ ] Progress bars show purple gradient
  - [ ] Charts use brand colors
  - [ ] Wins trendline displays correctly

- [ ] **Claude Panel**
  - [ ] Agent name shows purple/pink/blue gradient (agent identity)
  - [ ] Agent messages have purple theme
  - [ ] Buttons use purple background
  - [ ] User messages distinct from agent

- [ ] **Objectives Page**
  - [ ] Cards have purple accents
  - [ ] Progress bars purple
  - [ ] Borders use brand color

- [ ] **Overall**
  - [ ] Background gradient visible (purple tones)
  - [ ] Typography uses Inter font where specified
  - [ ] No broken styling
  - [ ] Consistent purple theme throughout
  - [ ] Agent identity preserved (same purple/pink gradient across all apps)

---

## Rollback Plan

If issues occur:
```bash
git checkout main
git branch -D feature/theme-system
```

Or partial rollback:
```bash
git restore <specific-file>
```

---

## Success Criteria

- ✓ All 27 hardcoded colors replaced with CSS variables
- ✓ Visual appearance identical or improved
- ✓ No console errors
- ✓ Responsive design intact
- ✓ Agent identity consistent
- ✓ Easy to change entire color scheme by editing theme.css
