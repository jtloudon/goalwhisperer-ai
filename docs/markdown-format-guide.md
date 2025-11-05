# Markdown Format Guide

This guide documents the **exact markdown structure** required for OKR data files. The parser (`backend/src/services/parser.js`) expects specific patterns - deviating from these formats will cause parsing failures.

---

## File Naming Conventions

### Objectives Files
- **Annual**: `annual-YYYY.md` (e.g., `annual-2025.md`)
- **Quarterly**: `YYYY-qN.md` (e.g., `2025-q4.md`)
- **Location**: `personal/objectives/`

### Weekly Plans
- **Pattern**: `YYYY-week-N-qN.md` (e.g., `2025-week-12-q2.md`)
- **Location**: `personal/plans/`
- **Regex Match**: Parser expects exactly this pattern with leading zero omitted for week numbers

### Tracking Files
- **Progress Summary**: `progress-summary.md`
- **Completed Items**: `completed-items.md`
- **Location**: `personal/tracking/`

---

## 1. Annual Objectives File

**File**: `personal/objectives/annual-YYYY.md`

### Required Structure

```markdown
# Annual Objectives YYYY

## Personal Objectives

### Objective N: [Title of Objective]
**Why this matters**: [Description of why this objective is important]

**Key Results:**

- **KR N.M**: [Key Result Title] - Target: [Date]
  - Measurement: [Type]
  - Weight: [Number]%
  - Current Progress: [Current]/[Target] ([Percentage]%)

- **KR N.M**: [Another Key Result] - Target: [Date] ✅ COMPLETE
  - Measurement: [Type]
  - Weight: [Number]%
  - Current Progress: [Current]/[Target] ([Percentage]% - [note])

**Overall Objective Progress**: [Number]%

---

### Objective N+1: [Next Objective Title]
...

---

*Last Updated: [Month Day, Year]*
```

### Parser Expectations

#### Objective Header
- **Format**: `### Objective N: Title`
- **Regex**: `/### Objective (\d+): (.+)/`
- **Captures**: Objective number (N) and title
- Creates `id: "obj-N"` and `number: N`

#### Why This Matters
- **Format**: `**Why this matters**: Description text`
- Stored in `description` field
- Must appear immediately after objective header

#### Key Results
- **Format**: `- **KR N.M**: Title - Target: Date`
- **With completion**: `- **KR N.M**: Title - Target: Date ✅ COMPLETE`
- **Regex**: `/\*\*KR (\d+)\.(\d+)\*\*: (.+?) - Target: (.+?)( ✅ COMPLETE)?$/`
- **Captures**:
  - Objective number (N)
  - KR number (M)
  - Title
  - Target date
  - Completion status (optional)

#### Measurement Type
- **Format**: `  - Measurement: [Type]`
- **Valid types**: metric, incremental, milestone, boolean
- **Common values**:
  - `Metric` - numerical count
  - `Incremental` - multi-step features
  - `Milestone` - binary complete/incomplete
  - Stored as lowercase in parser

#### Weight
- **Format**: `  - Weight: N%`
- **Regex**: `/Weight: (\d+)%/`
- Must be numeric with % symbol

#### Current Progress
- **Format**: `  - Current Progress: X/Y (Z%)`
- **Regex**: `/Current Progress: (\d+)\/(\d+).*\((\d+)%\)/`
- **Captures**: current value, target value, percentage
- Example: `Current Progress: 8/10 (80%)`

#### Overall Objective Progress
- **Format**: `**Overall Objective Progress**: N%`
- **Regex**: `/(\d+)%/`
- Must appear at end of objective section (before `---`)

### Example

```markdown
# Annual Objectives 2025

## Personal Objectives

### Objective 1: Launch Personal Learning Platform
**Why this matters**: Build technical skills in modern web development while creating a portfolio piece that demonstrates full-stack capabilities.

**Key Results:**

- **KR 1.1**: Complete 5 online courses in React and Node.js - Target: Mar 31, 2025 ✅ COMPLETE
  - Measurement: Metric (numerical count to 5)
  - Weight: 30%
  - Current Progress: 5/5 (100%)

- **KR 1.2**: Build and deploy 3 full-stack projects to portfolio - Target: Jun 30, 2025
  - Measurement: Incremental (3 projects complete and documented)
  - Weight: 40%
  - Current Progress: 1/3 (33%)

- **KR 1.3**: Contribute to 2 open source projects - Target: Sep 30, 2025
  - Measurement: Metric (numerical count to 2)
  - Weight: 30%
  - Current Progress: 0/2 (0%)

**Overall Objective Progress**: 43%

---

### Objective 2: Improve Health and Fitness
**Why this matters**: Establish sustainable habits that improve energy levels and overall well-being.

**Key Results:**

- **KR 2.1**: Exercise 4 times per week for 12 consecutive weeks - Target: May 15, 2025
  - Measurement: Milestone
  - Weight: 50%
  - Current Progress: 0/1 (0%)

- **KR 2.2**: Complete a 10K race - Target: Aug 30, 2025
  - Measurement: Milestone
  - Weight: 50%
  - Current Progress: 0/1 (0%)

**Overall Objective Progress**: 0%

---

*Last Updated: March 15, 2025*
```

---

## 2. Progress Summary File

**File**: `personal/tracking/progress-summary.md`

### Required Structure

```markdown
# Progress Summary - Week N, QN YYYY
*Generated: [Month Day, Year]*

## Quick Overview
- **Total Objectives**: N
- **Overall Progress**: N% ↗️
- **On Track**: N ✓ | **At Risk**: N

---

## Objective N: [Title]
**Progress: N%** | Status: ✓ On Track ↗️ Accelerating

### Key Results:
[KR details...]

### Recent Completions (Last 3 Weeks):
[Completion list...]

---

## Wins This Week 🎉

- 🏆 [Major win description]
- ✅ [Completion item]
- ✅ [Another completion]

---

*Next check-in: Week N+1, QN YYYY (Date)*
```

### Parser Expectations

#### Title Line
- **Format**: `# Progress Summary - Week N, QN YYYY`
- **Regex**: `/# Progress Summary - Week (\d+), Q(\d+) (\d+)/`
- **Captures**: week number, quarter number, year
- Sets `summary.week`, `summary.quarter`, `summary.year`

#### Generated Date
- **Format**: `*Generated: Month Day, Year*`
- **Regex**: `/\*Generated: (.+?)\*/`
- Stored in `summary.generatedDate`

#### Overview Stats
- **Overall Progress**: `**Overall Progress**: N%`
  - **Regex**: `/Overall Progress\*\*: (\d+)%/`
- **On Track**: `**On Track**: N`
  - **Regex**: `/On Track\*\*: (\d+)/`
- **At Risk**: `**At Risk**: N`
  - **Regex**: `/At Risk\*\*: (\d+)/`

#### Wins Section
- **Format**: `## Wins This Week 🎉` followed by bullet list
- **Regex**: `/## Wins This Week 🎉\n\n([\s\S]+?)(\n\n##|\n\n---|\Z)/`
- Each win must start with `- ` (dash space)
- Parser extracts all lines starting with `-` and trims whitespace

### Example

```markdown
# Progress Summary - Week 12, Q2 2025
*Generated: March 24, 2025*

## Quick Overview
- **Total Objectives**: 2
- **Overall Progress**: 22% ↗️
- **On Track**: 2 ✓ | **At Risk**: 0

---

## Objective 1: Launch Personal Learning Platform
**Progress: 43%** | Status: ✓ On Track

### Key Results:
- KR 1.1: Complete 5 online courses ✅ COMPLETE (100%)
- KR 1.2: Build 3 full-stack projects (33% - 1/3 complete)
- KR 1.3: Contribute to 2 open source projects (0%)

---

## Wins This Week 🎉

- ✅ Completed final React advanced patterns course
- ✅ Deployed first portfolio project to production
- ✅ Started planning second portfolio project architecture
- 🏆 Received positive feedback on deployed project from peers

---

*Next check-in: Week 13, Q2 2025 (March 31)*
```

---

## 3. Completed Items File

**File**: `personal/tracking/completed-items.md`

### Required Structure

```markdown
# Completed Items Log

Track all completed actions and progress toward Key Results.

---

## Objective N: [Title]

### KR N.M: [Key Result Title] (Target: Date)
**Current Progress: X/Y (Z%)** [✅ COMPLETE]
**Last Updated: YYYY-MM-DD**

- [YYYY-MM-DD] ✓ [Description of completion]
  - [Optional indented details]
  - [More details]

- [YYYY-MM-DD] ⚠️ [Another completion with warning]

- [YYYY-MM-DD] 🔄 [Completion in progress]

---

## Objective N+1: [Next Objective]
...

---

*Last Updated: Month Day, Year*
```

### Parser Expectations

#### Objective Header
- **Format**: `## Objective N: Title`
- **Regex**: `/## Objective (\d+): (.+)/`
- **Captures**: objective number and title
- Creates `id: "obj-N"`

#### Key Result Header
- **Format**: `### KR N.M: Title`
- **Regex**: `/### KR (\d+\.\d+): (.+)/`
- **Captures**: KR number (N.M) and title
- Creates `id: "kr-N.M"`

#### Completion Entry
- **Format**: `- [YYYY-MM-DD] [Symbol] Description`
- **Regex**: `/- \[(\d{4}-\d{2}-\d{2})\] (✓|⚠️|🔄) (.+)/`
- **Valid symbols**:
  - `✓` - completed
  - `⚠️` - warning/concern
  - `🔄` - in progress
- **Captures**: date (ISO format), status symbol, description
- Must use ISO date format: `YYYY-MM-DD`

### Example

```markdown
# Completed Items Log

Track all completed actions and progress toward Key Results.

---

## Objective 1: Launch Personal Learning Platform

### KR 1.1: Complete 5 online courses in React and Node.js (Target: Mar 31, 2025)
**Current Progress: 5/5 (100%)** ✅ COMPLETE
**Last Updated: 2025-03-20**

- [2025-01-15] ✓ Completed "React Fundamentals" course
  - 40 hours of video content
  - Built 5 practice projects
  - Passed final assessment with 95%

- [2025-02-10] ✓ Completed "Advanced React Patterns" course
  - Learned hooks, context, and performance optimization
  - Built custom hooks library

- [2025-03-05] ✓ Completed "Node.js Backend Development" course
  - RESTful API design
  - Database integration with PostgreSQL

- [2025-03-12] ✓ Completed "Full-Stack Integration" course

- [2025-03-20] ✓ Completed "Testing and Deployment" course

---

### KR 1.2: Build and deploy 3 full-stack projects to portfolio (Target: Jun 30, 2025)
**Current Progress: 1/3 (33%)**
**Last Updated: 2025-03-24**

- [2025-02-01] ✓ Started planning first project: Task management app
  - Created wireframes and user stories
  - Designed database schema

- [2025-03-18] ✓ Deployed first project: Task management app
  - React frontend with Material-UI
  - Node.js/Express backend
  - PostgreSQL database
  - Deployed to Vercel and Railway

- [2025-03-24] 🔄 Started planning second project: Recipe finder app
  - Researching API options
  - Sketching initial designs

---

### KR 1.3: Contribute to 2 open source projects (Target: Sep 30, 2025)
**Current Progress: 0/2 (0%)**
**Last Updated: 2025-03-15**

- [2025-03-15] 🔄 Identified potential projects to contribute to
  - Reviewing React component libraries
  - Looking for "good first issue" tags

---

## Objective 2: Improve Health and Fitness

### KR 2.1: Exercise 4 times per week for 12 consecutive weeks (Target: May 15, 2025)
**Current Progress: 0/1 (0%)**
**Last Updated: 2025-03-10**

- [2025-03-10] ✓ Created workout schedule and accountability system
  - Monday/Wednesday: Running
  - Tuesday/Thursday: Strength training
  - Tracking in fitness app

---

*Last Updated: March 24, 2025*
```

---

## 4. Weekly Plans File

**File**: `personal/plans/YYYY-week-N-qN.md`

### Required Structure

```markdown
# Week N, QN YYYY - Weekly Plan
*[Month Day - Month Day, Year]*

## Objective Focus
**Objective N: [Title]**

**Context**: [Brief context for this week]

---

## Key Actions This Week

### 1. [Action Title]
**Maps to**: [Which KR this supports]
**Why this matters**:
- [Reason 1]
- [Reason 2]

**Success Criteria**:
- [Criterion 1]
- [Criterion 2]

**Time estimate**: [Duration]

---

### 2. [Next Action Title]
...

---

## Capacity Check
**Actions planned**: N

**Total estimated time**: X-Y hours over the week

---

*Created: Month Day, Year*
```

### Parser Expectations

#### Title Line
- **Format**: `# Week N, QN YYYY - Weekly Plan`
- **Regex**: `/# Week \d+, Q\d+ \d+ - Weekly Plan/`
- Parser extracts week/quarter from **filename**, not title
- Title used for validation only

#### Date Range
- **Format**: `*Month Day - Month Day, Year*` (immediately after title)
- **Regex**: `/# Week \d+, Q\d+ \d+ - Weekly Plan\n\*(.+?)\*/`
- Stored in `plan.dateRange`

#### Filename Pattern
- **Regex**: `/2025-week-(\d+)-q(\d+)\.md/`
- **Captures**: week number and quarter number
- **Critical**: Parser relies on filename, not title content

#### Action Items
- **Format**: `### N. Action Title`
- **Regex**: `/### \d+\. (.+)/`
- Parser extracts only the title (simplified extraction)
- Full action details (maps to, why, success criteria) are preserved but not parsed

### Example

```markdown
# Week 12, Q2 2025 - Weekly Plan
*March 24 - March 30, 2025*

## Objective Focus
**Objective 1: Launch Personal Learning Platform**

**Context**: First portfolio project deployed successfully. This week focuses on starting the second project and exploring open source contribution opportunities.

---

## Key Actions This Week

### 1. Design architecture for Recipe Finder app
**Maps to**: KR 1.2 (Build 3 full-stack projects)
**Why this matters**:
- Second portfolio project demonstrates ability to work with external APIs
- Recipe domain is relatable and shows practical application
- Good opportunity to practice responsive design

**Success Criteria**:
- Complete database schema design
- Select and test recipe API
- Create wireframes for main screens
- Set up project repository

**Time estimate**: 3-4 hours

---

### 2. Research open source contribution opportunities
**Maps to**: KR 1.3 (Contribute to 2 open source projects)
**Why this matters**:
- Need to identify projects that match skill level
- Contributing to open source demonstrates collaboration skills
- Good way to learn from experienced developers

**Success Criteria**:
- Identify 3-5 potential projects with active maintainers
- Review contribution guidelines for each
- Set up local development environment for top choice
- Find at least one "good first issue" to tackle

**Time estimate**: 2-3 hours

---

### 3. Continue consistent workout schedule
**Maps to**: KR 2.1 (Exercise 4x per week)
**Why this matters**:
- Building sustainable habit (currently on week 2 of 12)
- Energy levels directly impact productivity

**Success Criteria**:
- Complete 4 workouts this week (2 runs, 2 strength sessions)
- Log all workouts in tracking app
- Maintain 7+ hours of sleep per night

**Time estimate**: 4 hours total (1 hour per workout)

---

## Capacity Check
**Actions planned**: 3

**Time estimates**:
- Action 1: 3-4 hours
- Action 2: 2-3 hours
- Action 3: 4 hours

**Total estimated time**: 9-11 hours over the week
**Assessment**: Moderate load - manageable with current schedule

---

*Created: March 24, 2025*
```

---

## Common Mistakes & Troubleshooting

### 1. Objective/KR Numbering
**Wrong**: `### Objective One: Title` or `KR 1-1:`
**Right**: `### Objective 1: Title` and `**KR 1.1**:`
- Parser expects **numeric IDs only**
- Use dot notation for KRs (N.M), not dashes

### 2. Progress Format
**Wrong**: `Current Progress: 8 of 10 (80%)`
**Right**: `Current Progress: 8/10 (80%)`
- Must use forward slash `/` separator
- Parentheses around percentage are required

### 3. Target Date Format
**Wrong**: `- **KR 1.1** Complete 5 courses, Target: Mar 31`
**Right**: `- **KR 1.1**: Complete 5 courses - Target: Mar 31, 2025`
- Colon after KR number is required
- Dash before "Target:" is required (space-dash-space)
- Include full date with year

### 4. Completion Markers
**Wrong**: `- **KR 1.1**: Title - Target: Date (COMPLETE)`
**Right**: `- **KR 1.1**: Title - Target: Date ✅ COMPLETE`
- Must use `✅ COMPLETE` at end of line (emoji + space + text)
- Parser looks for exact string ` ✅ COMPLETE` (leading space required)

### 5. Date Format in Completed Items
**Wrong**: `- [Mar 15, 2025] ✓ Description`
**Right**: `- [2025-03-15] ✓ Description`
- Must use ISO format: YYYY-MM-DD
- Parser regex requires 4-digit year, 2-digit month, 2-digit day

### 6. Wins Section
**Wrong**: `## Wins This Week` (missing emoji)
**Right**: `## Wins This Week 🎉`
- Parser expects exact header with emoji
- Each win must start with `- ` (dash + space)

### 7. Weekly Plan Filename
**Wrong**: `week-12-q2-2025.md` or `2025-w12-q2.md`
**Right**: `2025-week-12-q2.md`
- Parser regex is strict: `YYYY-week-N-qN.md`
- No leading zeros for week number

### 8. Measurement Types
**Wrong**: `- Measurement: Count` or `- Type: Metric`
**Right**: `- Measurement: Metric`
- Parser expects line to contain "Measurement:" (capital M)
- Store as lowercase internally, but format matters for parsing

---

## Template Files

### Quick Start: Annual Objectives Template

```markdown
# Annual Objectives 2025

## Personal Objectives

### Objective 1: [Your Objective Title]
**Why this matters**: [Why this objective is important to you]

**Key Results:**

- **KR 1.1**: [Specific, measurable outcome] - Target: [Month Day, Year]
  - Measurement: Metric
  - Weight: 33%
  - Current Progress: 0/[target number] (0%)

- **KR 1.2**: [Another measurable outcome] - Target: [Month Day, Year]
  - Measurement: Incremental
  - Weight: 33%
  - Current Progress: 0/[total steps] (0%)

- **KR 1.3**: [Third measurable outcome] - Target: [Month Day, Year]
  - Measurement: Milestone
  - Weight: 34%
  - Current Progress: 0/1 (0%)

**Overall Objective Progress**: 0%

---

*Last Updated: [Month Day, Year]*
```

### Quick Start: Weekly Plan Template

```markdown
# Week N, QN 2025 - Weekly Plan
*[Start Date - End Date, 2025]*

## Objective Focus
**Objective 1: [Your Objective Title]**

**Context**: [What's happening this week that's relevant]

---

## Key Actions This Week

### 1. [Action Title]
**Maps to**: KR [N.M]
**Why this matters**:
- [Reason 1]
- [Reason 2]

**Success Criteria**:
- [Measurable criterion 1]
- [Measurable criterion 2]

**Time estimate**: [Hours/minutes]

---

## Capacity Check
**Actions planned**: 1
**Total estimated time**: [X-Y hours] over the week

---

*Created: [Month Day, Year]*
```

---

## Parser File Locations

If you need to debug parsing issues, the relevant code is in:

- **Parser service**: `backend/src/services/parser.js`
  - `parseAnnualObjectives()` - lines 8-98
  - `parseProgressSummary()` - lines 103-158
  - `parseCompletedItems()` - lines 163-214
  - `parseWeeklyPlans()` - lines 219-267

- **API routes**: `backend/src/routes/api.js`
- **Path configuration**: `backend/src/config/paths.js`

---

## Testing Your Format

To verify your markdown files are parsable:

1. **Run the parser test script**:
   ```bash
   cd backend
   node test-parser.js
   ```

2. **Check API endpoints**:
   ```bash
   # Start the backend server
   npm run dev

   # Test parsing endpoints
   curl http://localhost:3001/api/objectives/annual
   curl http://localhost:3001/api/tracking/progress
   curl http://localhost:3001/api/tracking/completed
   curl http://localhost:3001/api/plans
   ```

3. **View in frontend**:
   - Dashboard: `http://localhost:5173/` - shows if overview stats parsed correctly
   - Objectives: `http://localhost:5173/objectives` - validates objective structure
   - Plans: `http://localhost:5173/plans` - confirms weekly plan parsing

---

**Last Updated**: November 5, 2025
