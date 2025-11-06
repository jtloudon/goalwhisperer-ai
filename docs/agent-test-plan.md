# AI Agent Test Suite

This document defines test scenarios to validate the AI agent's ability to manage OKR data through tools.

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
**Tool:** ❌ **NOT AVAILABLE** - Need to implement `add_key_result_to_objective`

**Test Steps:**
1. User: "Add a new KR to objective 2: Launch beta version by Dec 31"
2. Agent should call (missing tool) with:
   - objectiveNumber: "2"
   - keyResult: { title, target, targetDate }
3. Verify KR appears under objective 2
4. Verify objective progress recalculates

**Expected Result:** ❌ Currently fails - tool doesn't exist

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
**Tool:** ❌ **NOT AVAILABLE** - Would need delete + add

**Test Steps:**
1. User: "Move KR 2.3 to objective 1"
2. Agent would need to:
   - Delete KR 2.3 from objective 2
   - Add same KR to objective 1
3. Verify KR appears under objective 1
4. Verify both objective progress values recalculate

**Expected Result:** ❌ Currently requires manual workaround

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
**Tool:** ❌ **NOT AVAILABLE** - Need to implement `update_action_in_weekly_plan`

**Test Steps:**
1. User: "Change action 2 in week of Nov 7 to map to KR 1.2 instead"
2. Agent should call (missing tool) with:
   - weekStart: "2025-11-07"
   - actionNumber: 2
   - updates: { mapsTo: "KR 1.2" }
3. Verify action's mapsTo field updates

**Expected Result:** ❌ Currently fails - tool doesn't exist

---

#### 3.4 Move Weekly Action from One Week to Another
**Tool:** ❌ **NOT AVAILABLE** - Would need remove + add

**Test Steps:**
1. User: "Move action 3 from week of Nov 7 to week of Nov 14"
2. Agent would need to:
   - Remove action 3 from Nov 7 plan
   - Add same action to Nov 14 plan
3. Verify action appears in Nov 14
4. Verify action removed from Nov 7

**Expected Result:** ❌ Currently requires manual workaround

---

## Test Execution Checklist

Before marking agent as "production ready", verify:

- [ ] All ✅ scenarios work consistently
- [ ] Agent actually invokes tools (doesn't just claim it did)
- [ ] Agent waits for tool confirmation before responding
- [ ] Progress percentages calculate correctly after changes
- [ ] Status indicators update correctly (ahead/on-track/at-risk/blocked)
- [ ] UI auto-refreshes within 5 seconds showing changes
- [ ] Scroll position preserved during auto-refresh
- [ ] No duplicate entries or data corruption

## Missing Tools to Implement

1. **`add_key_result_to_objective`**
   - Input: objectiveNumber, keyResult object
   - Output: Success/failure with new KR ID

2. **`update_action_in_weekly_plan`**
   - Input: weekStart, actionNumber, updates (title/mapsTo/description)
   - Output: Success/failure

## Known Limitations

- Moving items between objectives/weeks requires manual workaround (delete + add)
- No bulk operations (e.g., "delete all actions from this week")
- No undo/rollback capability
- Agent reliability depends on proper tool invocation (monitoring needed)

## Test Automation Notes

For future automated testing:
- Could create test markdown files in `/tests/fixtures/`
- Run agent commands programmatically
- Compare expected vs actual markdown output
- Validate JSON parsing of modified files
