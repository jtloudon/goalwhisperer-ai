# AI Agent Test Suite

This document defines test scenarios to validate the AI agent's ability to manage OKR data through tools.

**Last Updated:** November 13, 2025

## Implementation Status

✅ **All 16 agent tools implemented**
- 7 tools for Objectives & Key Results management
- 6 tools for Weekly Plans management
- 3 tools for Wins & Check-in History tracking

✅ **Voice input production-ready**
- Real-time streaming (Chrome/Edge/Safari) - TESTED
- Auto-stop on silence - TESTED
- iMessage-style UI with animated icons - TESTED
- Firefox fallback (Whisper) - UNTESTED (needs OpenAI key)

✅ **Advanced features**
- Automatic win detection with duplicate prevention
- Direction support (increase/decrease goals)
- Baseline calculations with target=0 support
- Flexible ID format acceptance
- Check-in history with auto-expand/collapse

## Test Categories

### 1. Objective Management

#### 1.1 Add Objective with Key Results
**Tool:** `add_objective`

**Test Steps:**
1. User: "Create a new objective: Improve engineering velocity with 3 key results"
2. Agent should call `add_objective` with:
   - title
   - description
   - keyResults array (3 items with title, target, targetDate)
3. Verify new objective appears in UI
4. Verify objective progress = 0% initially

**Expected Result:** ✅ New objective appears with all KRs

---

#### 1.2 Delete Objective and All KRs
**Tool:** `delete_objective`

**Test Steps:**
1. User: "Delete objective 3"
2. Agent should call `delete_objective` with `objectiveNumber: "3"`
3. Verify objective and all its KRs are removed
4. Verify remaining objectives maintain correct numbering

**Expected Result:** ✅ Objective removed completely

---

#### 1.3 Add KR to Existing Objective
**Tool:** ✅ `add_key_result_to_objective`

**Test Steps:**
1. User: "Add a new KR to objective 2: Launch beta version by Dec 31"
2. Agent should call `add_key_result_to_objective` with:
   - objectiveNumber: "2"
   - keyResult: { title, target, targetDate, baseline, direction }
3. Verify KR appears under objective 2 with correct numbering
4. Verify objective progress recalculates

**Expected Result:** ✅ KR added with auto-calculated number

---

### 2. Key Result Management

#### 2.1 Delete KR from Existing Objective
**Tool:** `delete_key_result`

**Test Steps:**
1. User: "Delete KR 2.3"
2. Agent should call `delete_key_result` with `krId: "2.3"`
3. Verify KR is removed
4. Verify objective progress recalculates based on remaining KRs

**Expected Result:** ✅ KR removed, progress updates

---

#### 2.2 Change Existing KR (Title/Target/Date)
**Tool:** `update_key_result`

**Test Steps:**
1. User: "Change KR 1.2 title to 'Complete portfolio redesign'"
2. Agent should call `update_key_result` with:
   - krId: "1.2"
   - title: "Complete portfolio redesign"
3. Verify KR title updates in UI

**Expected Result:** ✅ KR updates correctly

---

#### 2.3 Update KR Progress
**Tool:** `update_progress`

**Test Steps:**
1. User: "Update KR 1.2 progress to 75%"
2. Agent should call `update_progress` with:
   - krId: "1.2"
   - progress: 75
   - current: (calculated value)
3. Verify KR shows 75% progress
4. Verify parent objective progress recalculates as average of all KRs

**Expected Result:** ✅ Progress updates, objective recalculates

---

#### 2.4 Move KR from One Objective to Another
**Tool:** ✅ **Multi-step workflow** - Agent uses delete + add

**Test Steps:**
1. User: "Move KR 2.3 to objective 1"
2. Agent executes:
   - Delete KR 2.3 from objective 2
   - Add same KR to objective 1
3. Verify KR appears under objective 1
4. Verify both objective progress values recalculate

**Expected Result:** ✅ Agent handles multi-step workflow (TESTED: demo-new-user Nov 13)

---

### 3. Weekly Actions Management

#### 3.1 Add Weekly Action
**Tool:** `add_action_to_weekly_plan`

**Test Steps:**
1. User: "Add action 'Review PRs' to week of Nov 7, maps to KR 2.1"
2. Agent should call `add_action_to_weekly_plan` with:
   - weekStart: "2025-11-07"
   - action: { title: "Review PRs", mapsTo: "KR 2.1" }
3. Verify action appears in that week's plan
4. Verify action numbering is sequential

**Expected Result:** ✅ Action added to plan

---

#### 3.2 Remove Weekly Action
**Tool:** `remove_actions_from_weekly_plan`

**Test Steps:**
1. User: "Remove action 3 from week of Nov 7"
2. Agent should call `remove_actions_from_weekly_plan` with:
   - weekStart: "2025-11-07"
   - actionNumbers: [3]
3. Verify action 3 is removed
4. Verify remaining actions renumber correctly

**Expected Result:** ✅ Action removed (added today)

---

#### 3.3 Change Weekly Action (Title or MapsTo)
**Tool:** ✅ `update_action_in_weekly_plan`

**Test Steps:**
1. User: "Change action 2 in week of Nov 7 to map to KR 1.2 instead"
2. Agent should call `update_action_in_weekly_plan` with:
   - weekStart: "2025-11-07"
   - actionNumber: 2
   - updates: { mapsTo: "KR 1.2" }
3. Verify action's mapsTo field updates

**Expected Result:** ✅ Action updates correctly

---

#### 3.4 Move Weekly Action from One Week to Another
**Tool:** ✅ **Multi-step workflow** - Agent uses remove + add

**Test Steps:**
1. User: "Move action 3 from week of Nov 7 to week of Nov 14"
2. Agent executes:
   - Remove action 3 from Nov 7 plan
   - Add same action to Nov 14 plan
3. Verify action appears in Nov 14
4. Verify action removed from Nov 7

**Expected Result:** ✅ Agent handles multi-step workflow (TESTED)

---

### 4. Wins Management

#### 4.1 Manually Add Win
**Tool:** `add_win`

**Test Steps:**
1. User: "Add win: Closed major enterprise deal worth $500k"
2. Agent should call `add_win` with:
   - text: "Closed major enterprise deal worth $500k"
3. Verify win appears in Recent Wins section with today's date
4. Verify wins trendline updates

**Expected Result:** ✅ Win added immediately (no permission needed)

---

#### 4.2 Automatic Win on KR Completion
**Tool:** `complete_key_result` (triggers automatic win)

**Test Steps:**
1. User: "Mark KR 1.2 as complete"
2. Agent should call `complete_key_result` with krId: "1.2"
3. Verify KR status changes to complete
4. Verify win automatically added to Recent Wins
5. Verify duplicate prevention if win already exists

**Expected Result:** ✅ KR marked complete, win auto-added with source tracking

---

#### 4.3 Automatic Win on Major Progress Jump
**Tool:** `update_progress` (triggers automatic win on 25%+ jump)

**Test Steps:**
1. User: "Update KR 2.1 progress from 50% to 85%"
2. Agent should call `update_progress`
3. Verify progress updates to 85%
4. Verify win automatically added for major milestone
5. Verify duplicate prevention using 70% similarity threshold

**Expected Result:** ✅ Progress updates, win auto-added for milestone

---

#### 4.4 Duplicate Win Prevention
**Tool:** Automatic validation in `add_win`

**Test Steps:**
1. Add win: "Launched new product feature"
2. Try to add similar win: "Launched the new product feature"
3. Verify system detects 70%+ similarity using Jaccard algorithm
4. Verify duplicate is prevented

**Expected Result:** ✅ Duplicate rejected, original preserved

---

### 5. Check-in History

#### 5.1 Save Weekly Check-in Summary
**Tool:** `save_checkin_summary` (MANDATORY)

**Test Steps:**
1. User completes weekly check-in conversation
2. Agent MUST call `save_checkin_summary` with:
   - weekStart: "2025-11-07"
   - summary: (detailed check-in text)
3. Verify check-in saved to tracking/checkin-history.md
4. Verify most recent check-in auto-expands in UI
5. Verify past check-ins are collapsible

**Expected Result:** ✅ Check-in saved and displayed in history page

---

#### 5.2 View Check-in History
**UI Feature:** Check-in History page

**Test Steps:**
1. Navigate to Check-in History page
2. Verify most recent check-in is expanded by default
3. Verify older check-ins are collapsed
4. Click to expand/collapse past check-ins
5. Verify auto-refresh every 5 seconds
6. Verify scroll position preserved on refresh

**Expected Result:** ✅ History displayed chronologically with proper expand/collapse

---

### 6. Voice Input

#### 6.1 Real-Time Voice Input (Chrome/Edge/Safari)
**Feature:** Web Speech API - FREE

**Test Steps:**
1. Open app in Chrome, Edge, or Safari
2. Click microphone icon in text input
3. Allow microphone access
4. Speak: "How am I doing on my objectives?"
5. Verify text appears in real-time as you speak
6. Pause for 2-3 seconds
7. Verify recording auto-stops
8. Verify microphone icon changes to animated wave during recording
9. Review text and click Send

**Expected Result:** ✅ Real-time transcription with auto-stop (TESTED in Chrome/Safari)

---

#### 6.2 Voice Fallback Mode (Firefox)
**Feature:** OpenAI Whisper API

**Test Steps:**
1. Open app in Firefox
2. Click microphone icon
3. Allow microphone access
4. Speak message
5. Click "Stop Recording"
6. Wait 2-4 seconds for transcription
7. Verify text appears in input field

**Expected Result:** ⚠️ UNTESTED - Requires OpenAI API key configuration

---

#### 6.3 Voice UI Elements
**Feature:** iMessage-style voice icon

**Test Steps:**
1. Verify gray microphone icon visible in bottom-right of text input
2. Click microphone to start recording
3. Verify icon changes to animated purple wave
4. Verify wave animation is smooth
5. When recording stops, verify icon returns to gray microphone
6. Verify no blue focus outline after stopping

**Expected Result:** ✅ Clean UI with smooth icon transitions (TESTED)

---

### 7. Advanced Features

#### 7.1 Direction & Baseline Support
**Tools:** `add_objective`, `add_key_result_to_objective`, `update_key_result`

**Test Steps - Increase Goals:**
1. Create KR with direction: "increase", baseline: 10, target: 50
2. Verify progress bar shows 0% at baseline (10)
3. Update progress to current: 30
4. Verify progress = 50% ((30-10)/(50-10) = 50%)

**Test Steps - Decrease Goals:**
1. Create KR with direction: "decrease", baseline: 30000, target: 0
2. Example: "Pay off $30k loan to $0"
3. Update progress to current: 15000
4. Verify progress = 50% ((30000-15000)/(30000-0) = 50%)

**Expected Result:** ✅ Both increase and decrease directions calculate correctly

---

#### 7.2 Flexible ID Format Support
**Tools:** All KR-related tools

**Test Steps:**
1. Try updating KR with format "1.2"
2. Try updating KR with format "kr-1.2"
3. Try updating KR with format "KR 1.2"
4. Verify all formats work identically

**Expected Result:** ✅ All ID formats accepted and normalized

---

#### 7.3 Complete Action with Auto-Win
**Tool:** `update_action_in_weekly_plan` with markComplete: true

**Test Steps:**
1. User: "Mark action 3 as complete for week of Nov 7"
2. Agent calls `update_action_in_weekly_plan` with markComplete: true
3. Verify action gets [DONE] prefix
4. Verify win automatically added
5. Verify completion tracked in recent completions

**Expected Result:** ✅ Action marked done, win added, completion tracked

---

## Test Execution Checklist

Before marking agent as "production ready", verify:

### Core Functionality
- [x] All ✅ scenarios work consistently (TESTED: demo-new-user Nov 13)
- [x] Agent actually invokes tools (doesn't just claim it did)
- [x] Agent waits for tool confirmation before responding
- [x] Progress percentages calculate correctly after changes (TESTED: KR 1.3=26%, 2.2=20%)
- [x] Status indicators update correctly (ahead/on-track/at-risk/blocked)
- [x] UI auto-refreshes within 5 seconds showing changes
- [x] Scroll position preserved during auto-refresh
- [x] No duplicate entries or data corruption

### Voice Input
- [x] Real-time voice works in Chrome
- [x] Real-time voice works in Safari
- [x] Auto-stop on silence works properly
- [x] Voice icon transitions smoothly
- [ ] Fallback mode works in Firefox (UNTESTED - needs OpenAI key)

### Wins & Check-ins
- [x] Manual wins added successfully (TESTED: via action/KR completions)
- [x] Auto-wins trigger on KR completion (TESTED: KR 1.2, 2.1 completions)
- [x] Auto-wins trigger on objective/action completion (TESTED: 6 actions completed)
- [x] Duplicate win prevention works (70% threshold) (TESTED: prompt updated, working)
- [x] Check-in summaries saved to history (TESTED: 2 check-ins saved)
- [x] Check-in history displays correctly with expand/collapse

### Advanced Features
- [x] Direction increase/decrease both work (TESTED: increase=KR 1.1, decrease=1.3,2.1,2.2)
- [x] Baseline calculations correct for both directions (TESTED: car loan, weight, body fat)
- [x] Target=0 works for decrease goals (TESTED: KR 1.3 car loan to $0)
- [x] Flexible ID formats (1.2, kr-1.2, KR 1.2) all accepted
- [x] Action completion triggers win + completion tracking (TESTED: 6 actions in completed-items.md)
- [x] KR auto-closes when current value reaches target (TESTED: KR 1.2, 2.1 at 100%)

## Complete Tool Inventory

All 16 agent tools are implemented and available:

### Objectives & Key Results (7 tools)
1. **`add_objective`** - Create new objective with key results
2. **`delete_objective`** - Remove entire objective
3. **`add_key_result_to_objective`** ✅ - Add KR to existing objective
4. **`update_key_result`** - Change KR properties (title, status, direction, baseline, target, date)
5. **`update_progress`** - Update KR current value and progress %
6. **`complete_key_result`** - Mark KR as complete (auto-adds win)
7. **`delete_key_result`** - Remove specific KR

### Weekly Plans (6 tools)
8. **`add_weekly_plan`** - Create new weekly plan
9. **`add_action_to_weekly_plan`** - Add single action
10. **`update_action_in_weekly_plan`** ✅ - Mark complete or change properties
11. **`remove_actions_from_weekly_plan`** - Remove specific actions
12. **`update_weekly_plan`** - Replace all actions (destructive)
13. **`delete_weekly_plan`** - Delete entire plan

### Tracking & History (3 tools)
14. **`add_win`** - Add win to Recent Wins (no permission needed)
15. **`save_checkin_summary`** - Save weekly check-in to history (MANDATORY)
16. *(Automatic)* - Auto-win detection on KR completion, progress jumps, action completion

## Known Limitations

- No dedicated move tools (agent handles via multi-step delete + add workflows) ✅
- No bulk operations beyond `update_weekly_plan` (replaces all actions)
- No undo/rollback capability
- Agent reliability depends on proper tool invocation (monitoring needed)
- Firefox voice fallback (Whisper API) requires OpenAI API key configuration
- Duplicate win prevention uses 70% similarity threshold (tuned and working)

## Test Automation Notes

For future automated testing:
- Could create test markdown files in `/tests/fixtures/`
- Run agent commands programmatically
- Compare expected vs actual markdown output
- Validate JSON parsing of modified files
