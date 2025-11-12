# GoalWhisperer AI - Design System Specification

**Version:** 1.0
**Last Updated:** November 12, 2025
**Status:** Living Document

> This is the authoritative design system specification for GoalWhisperer AI. All UI components, colors, typography, and patterns should follow these guidelines for consistency.

## Overview

Modern AI-inspired design system following Apple's aesthetic principles with a pink-purple-blue color palette. Focus on clarity, subtle depth, and thoughtful use of gradients.

---

## Core Design Philosophy

### Inspiration Sources
- **Apple Store gradient washes** - Organic, blurred, non-rectangular gradients at page tops
- **Apple marketing typography** - Split-color titles (gradient label + gray description)
- **Modern AI products** - Midjourney, Perplexity style (pink-purple gradients, clean hierarchy)

### Key Principles Applied
1. **Reduce gradient overload** - Use sparingly, only for key elements
2. **Subtle depth** - Lighter shadows, more breathing room
3. **Clear hierarchy** - Size, weight, and color create distinction
4. **Brand cohesion** - Pink-purple-blue palette consistently applied

---

## Color System

### Brand Gradient (Primary)
```css
/* Pink → Purple → Blue */
linear-gradient(90deg, #d946ef 0%, #6366f1 60%, #5BA3FF 100%)

/* Used for: Objective labels, AI Coach title, logo gradient text */
```

### Progress Bar Gradient
```css
/* Rose-pink → Purple (vibrant, replaces dusty old gradient) */
linear-gradient(90deg, #ec4899 0%, #a855f7 100%)

/* Applied to: All progress bars, chart trend line, current value bubbles */
```

### AI Coach Gradient Wash
```css
/* Pink → Fuchsia → Purple → Blue (top accent) */
linear-gradient(135deg, #ec4899 0%, #d946ef 33%, #8b5cf6 66%, #3b82f6 100%)
opacity: 0.5;
height: 40px;
filter: blur(12px);

/* Organic shape attempt abandoned - kept simple symmetric blur at top edge */
```

### Solid Colors

**Purple (Primary Brand)**
- `#a855f7` - Main brand purple (solid elements, nav underline, stats)
- `#764ba2` - Darker purple (buttons, legacy elements)

**Gray Scale**
- `#858a94` - Medium gray (objective title descriptions)
- `#9b87b5` - Soft purple-gray (wins text, de-emphasized content)
- `#9ca3af` - Light gray (dates, baseline/target numbers)
- `#f3f4f6` - Very light gray (assistant message background)
- `#e5e7eb` - Border gray (replaced purple borders)

**Status Colors**
- Green: `#4caf50` (complete)
- Orange: `#f59e0b` (in progress)
- Red: `#f44336` (blocked)

---

## Typography Hierarchy

### Objective Titles (Split-Color Pattern)
```css
/* "Objective 1:" - gradient */
.objective-label {
  background: linear-gradient(90deg, #d946ef 0%, #6366f1 60%, #5BA3FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* "Establish Director-Level AI Career Identity" - gray */
.objective-title-text {
  color: #858a94;
}

/* Overall size */
.objective-header h3 {
  font-size: 1.75rem;
}
```

### Progress Percentage
```css
.progress-circle {
  font-size: 1.75rem; /* Matches objective title size */
  color: gradient; /* Uses brand gradient */
}
```

### Key Result Titles
```css
.kr-title {
  font-size: 0.9rem; /* Smaller than objectives */
  font-weight: 400;  /* Lighter weight for hierarchy */
}
```

### AI Coach Header
```css
.claude-header h3 {
  font-size: 1.25rem; /* Reduced from 1.5rem - de-emphasize UI chrome */
  font-family: 'Orbitron', sans-serif;
}
```

### Dashboard Stats
```css
.stat-value {
  font-size: 2.5rem;
  color: #a855f7; /* Solid purple, not gradient */
}
```

### Wins List
```css
.win-text {
  color: #9b87b5; /* Softened from bright purple */
}

.win-date {
  font-size: 0.7rem; /* Small, de-emphasized */
  color: #9ca3af;
}
```

---

## Component Patterns

### Progress Bars
**Philosophy:** Thin, vibrant gradient bars that don't dominate

```css
.progress-bar {
  height: 4px; /* Reduced from 8px */
  border-radius: 2px;
  background: #e0e0e0; /* Track color */
}

.progress-bar-with-labels .progress-bar {
  height: 6px; /* Slightly taller when labels present */
}

.progress-fill {
  background: linear-gradient(90deg, #ec4899 0%, #a855f7 100%);
}
```

**Current Value Bubble:**
```css
background: #a855f7; /* Purple, matches progress bar end */
/* Replaced old blue #5BA3FF */
```

**Baseline/Target Numbers:**
```css
color: #9ca3af; /* Light gray to de-emphasize, purple bubble pops more */
```

### Card Shadows
**Philosophy:** Subtle depth, not heavy drop shadows

```css
/* Applied to: objective cards, stat cards, wins section */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

/* Old (too heavy): 0 2px 8px rgba(0, 0, 0, 0.1) */
```

### Status Indicators
**Philosophy:** Larger with subtle glow rings for visibility

```css
.kr-status-indicator {
  width: 12px;  /* Up from 10px */
  height: 12px;
  border-radius: 50%;
}

/* Color-matched glow rings */
.kr-status-indicator.status-complete {
  background-color: #4caf50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
}

.kr-status-indicator.status-in-progress {
  background-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}

.kr-status-indicator.status-blocked {
  background-color: #f44336;
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.15);
}
```

### Navigation Active State
```css
.nav-link.active::after {
  background: #a855f7; /* Solid purple, not gradient */
  height: 3px;
}
```

### Chat Messages (AI Coach)
**Philosophy:** Subtle backgrounds, not borders

```css
/* User messages */
.message.user .message-content {
  background: #e0d4f5; /* Light purple */
}

/* Assistant messages */
.message.assistant .message-content {
  background: #f3f4f6; /* Subtle gray */
  border: none; /* Removed purple border for cleaner look */
  font-size: 0.9rem; /* Reduced for more chat history */
}
```

### AI Coach Gradient Wash
**Final Implementation:**
```css
.claude-panel::before {
  height: 40px; /* Short strip at top */
  background: linear-gradient(135deg, #ec4899 0%, #d946ef 33%, #8b5cf6 66%, #3b82f6 100%);
  opacity: 0.4;
  filter: blur(12px);
  mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
  /* Stays above "AI Coach" title, doesn't interfere with content */
}
```

---

## Changes Made by Page/Component

### Sidebar (Left Navigation)
**Changed:**
- Header gradient: `#667eea → #764ba2` → **`#ec4899 → #8b5cf6`** (vibrant pink-purple)

### AI Coach Panel (Right Side)
**Changed:**
- Background: Full gradient → **White with top gradient accent**
- Gradient wash: Tall/organic attempts → **40px straight blur at top**
- Message borders: Purple border → **Subtle gray background** (`#f3f4f6`)
- Message font: Default → **0.9rem** (more history visible)
- Title size: 1.5rem → **1.25rem** (de-emphasize UI)
- Bottom UI: Compacted padding, moved "New Chat" to pill row

### Objectives Page
**Changed:**
- Card structure: Triple-nested cards → **Single objective card + individual KR cards**
- Objective titles: Full gradient → **Split-color** (gradient label + gray text `#858a94`)
- Title size: 1.5rem → **1.75rem** (larger, more prominent)
- Progress %: 2.75rem → **1.75rem** (matches title size)
- Progress bars: 8px → **4px** (thinner, less dominant)
- Progress gradient: Dusty `#9b7ab8 → #c8b3dc` → **Vibrant `#ec4899 → #a855f7`**
- Current value bubble: Blue `#5BA3FF` → **Purple `#a855f7`**
- Baseline/target numbers: `#666` → **`#9ca3af`** (lighter gray)
- KR titles: 1rem/500 → **0.9rem/400** (hierarchy)
- Status dots: 10px → **12px with 3px glow rings**
- Card shadows: `0 2px 8px 0.1` → **`0 1px 3px 0.08`**

### Dashboard Page
**Changed:**
- Stat values: Gradient → **Solid purple `#a855f7`**
- Card shadows: Heavy → **Subtle `0 1px 3px 0.08`**
- Chart line: Pink-blue → **Pink-purple `#ec4899 → #a855f7`**
- Wins text: Bright `#a855f7` → **Softened `#9b87b5`**
- Wins checkmarks: Purple → **Match text `#9b87b5`**
- Win dates: 0.75rem → **0.7rem, `#9ca3af`**
- Wins hover: Border change removed → **Background only**

### Top Navigation
**Changed:**
- Active underline: Gradient → **Solid purple `#a855f7`**

---

## Design Decisions & Rationale

### Why We Removed Gradients in Some Places
**Problem:** Too many gradients = visual chaos, everything competing
**Solution:** Reserve gradients for key brand moments:
- ✅ Objective labels (hierarchy)
- ✅ Progress bars (action/progress)
- ✅ AI Coach wash (brand accent)
- ✅ Logo/title text (branding)
- ❌ Stats numbers (use solid)
- ❌ Nav underline (use solid)
- ❌ Entire backgrounds (use accents)

### Why Split-Color Titles Work
**Pattern:** `Gradient label` + `Gray description`
- **Creates hierarchy** - Eye goes to colorful part first
- **Apple-inspired** - "The latest" in gradient, rest in gray
- **Readable** - Gray text easier to read than gradient text
- **Sophisticated** - Looks polished, not amateur

### Why Thin Progress Bars
**Problem:** Thick vibrant bars dominated the page
**Solution:** 4-6px bars let color show without overwhelming
- Still visible and functional
- Gradient shines through
- More space for content

### Why Subtle Shadows
**Problem:** Heavy shadows felt dated, too "material design 2014"
**Solution:** `0 1px 3px 0.08` creates gentle lift
- Modern, Apple-like flatness
- Still shows card boundaries
- Doesn't fight with content

### Why Larger Status Dots with Rings
**Problem:** 10px dots got lost, hard to see at a glance
**Solution:** 12px + 3px colored glow rings
- More visible without being bulky
- Color-matched rings reinforce meaning
- Subtle but noticeable

---

## Rejected Approaches

### ❌ Organic Gradient Shape (AI Coach)
**Tried:** Apple-style asymmetric blob with bulge on right
**Why rejected:**
- Clip-path killed blur effect
- Border-radius asymmetry looked awkward
- Too complex for minimal benefit
**Final:** Simple 40px blur at top, symmetric

### ❌ Full Panel Gradients
**Tried:** Entire AI Coach panel with gradient background
**Why rejected:**
- Overpowered content
- Made text hard to read
- Too busy
**Final:** White background + top accent only

### ❌ Gradient Text for Descriptions
**Tried:** Full objective title in gradient
**Why rejected:**
- Hard to read
- Too flashy
- Fights with progress bars
**Final:** Split-color (gradient label + gray text)

---

## Remaining Pages to Review

### Not Yet Analyzed:
1. **Weekly Actions page**
2. **Check-in History page**
3. **About page**
4. **Plans/Timeline pages** (if any)

### Recommendations to Apply Consistently:
- Use split-color pattern for section headings
- Apply subtle shadows `0 1px 3px 0.08`
- Use solid purple `#a855f7` instead of gradients where appropriate
- Ensure status indicators are 12px with glow rings
- Keep card padding/spacing consistent
- Use gray scale hierarchy (`#858a94`, `#9b87b5`, `#9ca3af`)

---

## Quick Reference: Color Usage

| Element | Color | Why |
|---------|-------|-----|
| Objective labels | Gradient (pink→purple→blue) | Brand hierarchy |
| Objective descriptions | `#858a94` gray | Readable, de-emphasized |
| Progress bars | `#ec4899 → #a855f7` | Vibrant, action-oriented |
| Progress % | Gradient | Matches objective label |
| Stats numbers | `#a855f7` solid | Avoid gradient overload |
| Nav underline | `#a855f7` solid | Clean, simple |
| KR titles | `#333` | Readable body text |
| Wins text | `#9b87b5` | Soft, not competing |
| Dates | `#9ca3af` | De-emphasized |
| Borders (general) | `#e5e7eb` | Neutral, not purple |
| Assistant messages | `#f3f4f6` bg | Subtle definition |
| User messages | `#e0d4f5` bg | Light purple |

---

## File Changes Summary

### CSS Files Modified:
- `/frontend/src/components/ClaudePanel.css` - AI Coach styling
- `/frontend/src/components/Sidebar.css` - Left nav gradient
- `/frontend/src/components/TopNav.css` - Nav underline
- `/frontend/src/pages/Dashboard.css` - Stats, wins, shadows, hierarchy
- `/frontend/src/pages/Page.css` - Objective card structure

### JSX Files Modified:
- `/frontend/src/pages/Objectives.jsx` - Split-color title structure
- `/frontend/src/components/WinsTrendline.jsx` - Chart gradient colors

### Key Patterns in Code:

**Split-Color Title:**
```jsx
<h3>
  <span className="objective-label">Objective {obj.number}:</span>
  <span className="objective-title-text"> {obj.title}</span>
</h3>
```

**Gradient Definition:**
```css
background: linear-gradient(90deg, #d946ef 0%, #6366f1 60%, #5BA3FF 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

---

## Design System Maturity

### ✅ Established:
- Color palette (pink-purple-blue)
- Typography hierarchy
- Shadow depth standard
- Status indicator pattern
- Card structure
- Gradient usage rules

### 🚧 Still Evolving:
- Responsive breakpoints (not reviewed)
- Animation/transitions (minimal so far)
- Dark mode (not considered)
- Accessibility (colors not WCAG tested)

---

## Next Session Prompt

**"Continue design system refinement for remaining pages (Weekly Actions, Check-in History, About). Apply established patterns: split-color titles, subtle shadows (0 1px 3px 0.08), solid purple accents instead of gradients, 12px status dots with rings, gray hierarchy (#858a94, #9b87b5, #9ca3af). Review typography, spacing, color usage for consistency with Objectives and Dashboard pages."**

---

*Document created: 2025-11-12*
*Last updated: 2025-11-12*
