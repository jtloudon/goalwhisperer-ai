# OKR Web App - Project Plan

*Created: October 30, 2025*

## Project Overview

**Name**: AI-Powered OKR Management System

**Purpose**: Build a local-first web application that visualizes OKR progress through dashboards and enables conversational check-ins via Claude API integration, eliminating manual file editing while maintaining markdown files as the source of truth.

**Portfolio Value**: Demonstrates full-stack development, AI integration, product thinking (conversational UX), and systems design. Perfect showcase for director-level platform thinking.

---

## Key Design Principles

1. **Local-First**: Runs on user's machine, no cloud dependency
2. **Markdown as Source of Truth**: All data stored in existing MD files
3. **Conversational Interface**: Natural language updates, no forms/checkboxes
4. **Real-Time Visualization**: Dashboard updates automatically when data changes
5. **Git-Friendly**: All changes to MD files can be committed
6. **Zero Manual Admin**: User talks, Claude handles backend operations

---

## Architecture

### High-Level Stack

```
┌─────────────────────────────────────────────┐
│           Frontend (React)                  │
│  - Dashboard with charts                   │
│  - Multi-page navigation                   │
│  - Chat interface panel                    │
│  - Real-time updates                       │
└──────────────┬──────────────────────────────┘
               │ HTTP/WebSocket
┌──────────────▼──────────────────────────────┐
│           Backend (Node.js)                 │
│  - REST API                                 │
│  - MD file parser                           │
│  - File watcher (detect changes)            │
│  - Claude API integration                   │
└──────────────┬──────────────────────────────┘
               │ File I/O
┌──────────────▼──────────────────────────────┐
│        Data Layer (Markdown Files)          │
│  /objectives/annual-2025.md                 │
│  /objectives/2025-q4.md                     │
│  /plans/2025-week-*.md                      │
│  /tracking/completed-items.md               │
│  /tracking/progress-summary.md              │
└─────────────────────────────────────────────┘
```

### Technology Choices

**Frontend:**
- **React** - Component-based UI, rich ecosystem
- **Vite** - Fast build tool, hot module replacement
- **Vanilla CSS** - Custom styling with design system
- **Recharts** - Chart/visualization library
- **React Router** - Navigation

**Backend:**
- **Node.js + Express** - Lightweight API server
- **Chokidar** - File system watcher
- **gray-matter** - Markdown frontmatter parsing
- **marked** - Markdown to HTML/JSON parsing
- **@anthropic-ai/sdk** - Claude API integration
- **Socket.io** - WebSocket for real-time updates

**Development:**
- **Concurrently** - Run frontend + backend simultaneously
- **Nodemon** - Auto-restart backend on changes

---

## Application Structure

### Navigation Layout

```
┌─────────────────────────────────────────────────────────┐
│  Logo  [Dashboard] [Objectives] [Plans] [History] [About] │ ← Top Nav
├─────────────────────────────────┬───────────────────────┤
│                                 │                       │
│  Main Content Area              │   AI Coach Panel      │
│  (Dashboard, Objectives, etc.)  │   (Fixed right side)  │
│                                 │                       │
│                                 │   [Chat messages]     │
│                                 │                       │
│                                 │   [My Progress]       │
│                                 │   [Weekly Check-in]   │
│                                 │   [New Chat →]        │
└─────────────────────────────────┴───────────────────────┘
```

### Page Definitions

#### 1. Dashboard (Landing Page) 📊

**Purpose**: At-a-glance progress visualization

**Components:**
- **Hero Stats**
  - Overall progress % (large number)
  - Weeks elapsed in quarter
  - Objectives on track / at risk count

- **Progress Over Time** (Line Chart)
  - X-axis: Weeks
  - Y-axis: Progress %
  - Line per objective

- **Objective Progress** (Horizontal Bar Chart)
  - One bar per objective
  - Color-coded (green: on track, yellow: at risk, red: blocked)
  - Shows KR breakdown on hover

- **This Week vs Last Week** (Comparison Cards)
  - Completions count
  - New flags/blockers
  - Velocity indicator

- **Recent Activity** (Timeline)
  - Last 5 completions
  - Upcoming actions from weekly plan
  - Warnings/flags

**Data Sources:**
- `tracking/progress-summary.md` (current state)
- `tracking/completed-items.md` (recent activity)
- `plans/2025-week-[current].md` (upcoming actions)

---

#### 2. Objectives 🎯

**Purpose**: View annual and quarterly objectives with KR progress

**Layout:**
- **Toggle**: Annual / Quarterly view
- **Annual View** (default):
  - List of objectives (collapsible cards)
  - Each objective shows:
    - Title
    - Overall progress % (circular progress indicator)
    - "Why this matters"
    - Key Results list with individual progress bars
    - Status (on track ✓ / at risk ⚠️)

- **Quarterly View**:
  - Monthly breakdown
  - Milestone checklist (checkboxes read-only, reflect MD file state)
  - Timeline visualization

**Data Sources:**
- `objectives/annual-2025.md`
- `objectives/2025-q4.md`

---

#### 3. Plans 📅

**Purpose**: View weekly plans over time

**Layout:**
- **Timeline View** (default):
  - Reverse chronological (newest first)
  - Collapsed cards showing:
    - Week number + date range
    - Key actions count
    - Status indicator (future / current / past)
  - Click to expand: Full plan with actions, rationale, success criteria

- **Alternative: Table View** (toggle option):
  - Columns: Week # | Date Range | Key Actions | Capacity | Status
  - Sortable/filterable

**Features:**
- Highlight current week
- Search across all plans
- Filter by date range

**Data Sources:**
- `plans/2025-week-*.md` (all files)

---

#### 4. Completed Items ✅

**Purpose**: Browse completion history

**Layout:**
- **Grouped by Objective → KR** (collapsible sections)
- Each completion shows:
  - Date
  - Status symbol (✓ / ⚠️ / 🔄)
  - Description
  - Notes (if any)

**Features:**
- Filter by date range
- Filter by KR
- Search functionality
- Export option (copy to clipboard)

**Data Source:**
- `tracking/completed-items.md`

---

#### 5. Progress Summary 📈

**Purpose**: View current progress analysis

**Layout:**
- **Current Summary** (default):
  - Formatted view of latest progress-summary.md
  - Sections highlighted (Quick Overview, Per-Objective, Health Check, Wins)
  - Callout boxes for warnings/flags

- **Archive Toggle**:
  - View past progress summaries
  - Dropdown to select week
  - Compare week-over-week

**Features:**
- Trend indicators (↗️ ↘️ →)
- Color-coded status
- Print/export friendly

**Data Source:**
- `tracking/progress-summary.md` (current + archived)

---

#### 6. About ℹ️

**Purpose**: System documentation

**Content:**
- README.md content (how the system works)
- Command reference (slash commands)
- Philosophy
- File structure explanation
- How to use the chat interface

**Data Source:**
- `README.md`
- `okr-system-spec.md`

---

### Chat Interface 💬 (AI Coach Panel)

**UI:**
- **Fixed right panel** (always visible, 440px width)
- Panel layout:
  ```
  ┌─────────────────────┐
  │ AI Coach            │ ← Header with gradient wash
  │ powered by claude   │
  ├─────────────────────┤
  │                     │
  │  [Chat transcript]  │ ← Scrollable
  │                     │
  │  User: ...          │
  │  Claude: ...        │
  │                     │
  ├─────────────────────┤
  │ [My Progress]       │ ← Persistent action pills
  │ [Weekly Check-in]   │   (solid purple buttons)
  │ [New Chat →]        │   (outlined for secondary)
  ├─────────────────────┤
  │  [Type message...]  │ ← Input
  │          [Send] →   │
  └─────────────────────┘
  ```

**Features:**
- **Persistent Action Pills** (bottom, above input):
  - "My Progress" - Quick status check
  - "Weekly Check-in" - Start guided check-in
  - "New Chat →" - Clear conversation history

- **Real-Time Indicators**:
  - Typing indicator when Claude is responding (animated dots)
  - Auto-refresh every 5 seconds for data changes

- **Session Management**:
  - Chat history persists during session
  - "New Chat" button clears conversation
  - Re-fetches greeting on clear

**Integration:**
- Uses Claude Sonnet 4.5 API (Anthropic SDK)
- Conversational context maintained throughout session
- Parses user responses → updates MD files via agent tools
- Auto-refresh mechanism detects file changes

---

## Data Flow

### Read Flow (Dashboard Display)

```
1. User opens app
2. Backend reads MD files from /objectives, /plans, /tracking
3. Parser converts MD → JSON structure
4. API serves JSON to frontend
5. React components render data as charts/tables
6. File watcher monitors for changes
7. On change: re-parse → push update via WebSocket → frontend re-renders
```

### Write Flow (Conversational Update)

```
1. User clicks "Start weekly check-in" in chat
2. Claude API: "What did you complete this week?"
3. User types natural response
4. Backend sends to Claude API with context
5. Claude parses response → structured data
6. Backend writes updates to MD files:
   - tracking/completed-items.md (add completions)
   - tracking/progress-summary.md (regenerate)
   - plans/2025-week-[next].md (create new plan)
7. File watcher detects changes
8. Re-parse → push updates via WebSocket
9. Dashboard auto-refreshes with new data
10. Chat shows confirmation: "Updated 3 files ✓"
```

---

## File Structure (Backend)

```
okr-web-app/
├── frontend/                  # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Objectives.jsx
│   │   │   ├── Plans.jsx
│   │   │   ├── Completed.jsx
│   │   │   ├── Progress.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── shared/       # Reusable components
│   │   │       ├── Chart.jsx
│   │   │       ├── ProgressBar.jsx
│   │   │       ├── Card.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── hooks/
│   │   │   ├── useOKRData.js
│   │   │   ├── useChat.js
│   │   │   └── useWebSocket.js
│   │   ├── utils/
│   │   │   └── formatters.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # Node.js API
│   ├── src/
│   │   ├── server.js          # Express app
│   │   ├── routes/
│   │   │   ├── objectives.js
│   │   │   ├── plans.js
│   │   │   ├── tracking.js
│   │   │   └── chat.js
│   │   ├── services/
│   │   │   ├── parser.js      # MD → JSON parser
│   │   │   ├── writer.js      # JSON → MD writer
│   │   │   ├── claude.js      # Claude API integration
│   │   │   └── watcher.js     # File system watcher
│   │   ├── utils/
│   │   │   └── calculations.js # Progress calculations
│   │   └── config/
│   │       └── paths.js       # MD file paths
│   ├── package.json
│   └── .env                   # Claude API key
│
├── data/                      # Symlink to existing MD files
│   → /Users/jesseloudon/Documents/claude/goals/
│
├── package.json               # Root - runs both frontend + backend
├── README.md                  # Build + run instructions
└── .gitignore
```

---

## API Design

### REST Endpoints

**Objectives:**
- `GET /api/objectives/annual` → Returns parsed annual-2025.md
- `GET /api/objectives/quarterly` → Returns parsed 2025-q4.md

**Plans:**
- `GET /api/plans` → Returns all weekly plans (sorted by date)
- `GET /api/plans/:week` → Returns specific week plan

**Tracking:**
- `GET /api/tracking/completed` → Returns completed-items.md
- `GET /api/tracking/progress` → Returns current progress-summary.md
- `GET /api/tracking/progress/archive` → Returns past summaries

**Dashboard:**
- `GET /api/dashboard` → Returns aggregated data for dashboard (stats, charts data)

**Chat:**
- `POST /api/chat/message` → Send message to Claude, get response
- `POST /api/chat/check-in` → Initiate weekly check-in flow
- `POST /api/chat/complete` → Complete check-in, update files

**About:**
- `GET /api/about` → Returns README.md content

### WebSocket Events

**Client → Server:**
- `subscribe` - Subscribe to file updates
- `unsubscribe` - Unsubscribe from updates

**Server → Client:**
- `file-updated` - Payload: `{ file: 'progress-summary.md', timestamp }`
- `data-refresh` - Payload: `{ type: 'objectives' | 'plans' | 'tracking' }`

---

## Data Models

### Parsed Objective Structure

```javascript
{
  id: "obj-1",
  title: "Establish Director-Level AI Career Identity",
  description: "Why this matters...",
  progress: 33,              // Overall % (0-100)
  status: "on-track",        // "on-track" | "at-risk" | "ahead" | "blocked"
  trend: "accelerating",     // "accelerating" | "flat" | "declining"
  keyResults: [
    {
      id: "kr-1.1",
      title: "Source 6 external director-level AI job descriptions",
      measurement: "metric",  // "metric" | "incremental" | "binary"
      target: 6,
      current: 16,
      progress: 267,          // % (can exceed 100)
      status: "complete",
      targetDate: "2025-10-31",
      completedDate: "2025-10-09",
      weight: 33              // % weight in objective
    },
    // ... more KRs
  ],
  lastUpdated: "2025-10-30"
}
```

### Parsed Completion Structure

```javascript
{
  objectiveId: "obj-1",
  krId: "kr-1.1",
  completions: [
    {
      date: "2025-10-06",
      status: "complete",     // "complete" | "reduced-scope" | "blocked"
      description: "Created career/current-profile.md as prerequisite...",
      notes: "245-line comprehensive professional profile..."
    },
    // ... more completions
  ]
}
```

### Parsed Plan Structure

```javascript
{
  week: 5,
  quarter: 4,
  year: 2025,
  dateRange: {
    start: "2025-10-31",
    end: "2025-11-06"
  },
  objective: "Objective 1: Establish Director-Level AI Career Identity",
  actions: [
    {
      title: "Clean up project structure",
      mapsTo: "KR 1.2",
      whyItMatters: "Professional organization demonstrates...",
      successCriteria: "Execute Phase 1 of reorganization plan...",
      timeEstimate: "30 minutes"
    },
    // ... more actions
  ],
  capacityCheck: {
    actionsPlanned: 3,
    totalTime: "4-6 hours",
    assessment: "Light execution week..."
  },
  context: "Major milestone achieved - received director-level title..."
}
```

### Dashboard Data Aggregate

```javascript
{
  overview: {
    totalObjectives: 1,
    overallProgress: 33,
    onTrack: 1,
    atRisk: 0,
    currentWeek: 5,
    totalWeeks: 13,
    quarterProgress: 38  // % of quarter elapsed
  },
  objectives: [ /* array of parsed objectives */ ],
  recentCompletions: [ /* last 5 completions */ ],
  upcomingActions: [ /* from current week plan */ ],
  flags: [
    {
      type: "warning" | "info" | "success",
      message: "RAG features (0/13): Engineering team execution blocked...",
      relatedTo: "kr-1.2"
    }
  ],
  trends: {
    weekOverWeek: [
      { week: 3, progress: 33 },
      { week: 4, progress: 33 },
      { week: 5, progress: 33 }
    ],
    velocity: "flat"  // "accelerating" | "flat" | "declining"
  }
}
```

---

## Build Phases

### Phase 1: Dashboard Foundation (Week 1)
**Goal**: Basic dashboard reading existing MD files

**Tasks:**
1. Set up project structure
   - Initialize React app (Vite)
   - Initialize Node.js backend (Express)
   - Configure Tailwind CSS + shadcn/ui

2. Build MD file parser
   - Parse annual-2025.md → JSON
   - Parse 2025-q4.md → JSON
   - Parse completed-items.md → JSON
   - Parse progress-summary.md → JSON

3. Create API endpoints
   - GET /api/objectives/annual
   - GET /api/tracking/progress
   - GET /api/dashboard

4. Build Dashboard page
   - Hero stats (progress %, weeks elapsed)
   - Simple progress bar per objective
   - Recent completions list

5. Set up dev environment
   - Concurrent frontend + backend startup
   - Hot reload both
   - Test with real MD files

**Deliverable**: Dashboard shows your current OKR data

**Time Estimate**: 5-7 hours

---

### Phase 2: Full Navigation (Week 1-2)
**Goal**: All pages accessible, complete read access

**Tasks:**
1. Build Objectives page
   - Annual view with collapsible objectives
   - KR progress bars
   - Toggle to quarterly view

2. Build Plans page
   - Parse all plans/*.md files
   - Timeline view (collapsible cards)
   - Sort by date (newest first)

3. Build Completed Items page
   - Grouped by Objective → KR
   - Collapsible sections
   - Date formatting

4. Build Progress Summary page
   - Display current summary with formatting
   - Highlight sections (Overview, Wins, Flags)

5. Build About page
   - Display README.md content

6. Add navigation
   - Sidebar component
   - React Router setup
   - Active page highlighting

**Deliverable**: Full navigation, all data visible

**Time Estimate**: 5-8 hours

---

### Phase 3: Chat Integration (Week 2)
**Goal**: Conversational interface with Claude API

**Tasks:**
1. Set up Claude API
   - Install @anthropic-ai/sdk
   - Configure API key (.env)
   - Test basic conversation

2. Build Chat UI
   - Floating chat button
   - Slide-in panel
   - Message list (scrollable)
   - Input field + send button

3. Build chat service
   - POST /api/chat/message endpoint
   - Maintain conversation context
   - Stream responses (typing indicator)

4. Add quick actions
   - "Start weekly check-in" button
   - "Log a completion" button
   - "Show status" button

5. Test conversation flow
   - Ask questions about OKR data
   - Get status updates
   - Natural language queries

**Deliverable**: Working chat with Claude (read-only, no file updates yet)

**Time Estimate**: 6-8 hours

---

### Phase 4: Write Capability + Real-Time Updates (Week 2-3)
**Goal**: Chat updates MD files, dashboard auto-refreshes

**Tasks:**
1. Build file writer service
   - Update completed-items.md
   - Regenerate progress-summary.md
   - Create new weekly plan
   - Preserve MD formatting

2. Implement check-in flow
   - POST /api/chat/check-in
   - Multi-turn conversation
   - Parse user completions
   - Calculate new progress
   - Write to files
   - Return confirmation

3. Add file watcher
   - Monitor /objectives, /plans, /tracking
   - Detect changes
   - Trigger re-parse

4. Set up WebSocket
   - Socket.io server + client
   - Emit file-updated events
   - Frontend subscribes to updates

5. Implement auto-refresh
   - Listen for WebSocket events
   - Re-fetch data when files change
   - Update React state
   - Re-render affected components

6. Add visual feedback
   - "Updating files..." indicator in chat
   - "Files updated ✓" confirmation
   - Dashboard refresh animation

7. Test end-to-end flow
   - Start check-in via chat
   - Answer questions naturally
   - Verify files updated correctly
   - Confirm dashboard reflects changes

**Deliverable**: Full conversational OKR management system

**Time Estimate**: 8-12 hours

---

### Phase 5: Polish & Enhancement (Week 3)
**Goal**: Production-ready for personal use

**Tasks:**
1. Improve visualizations
   - Better chart styling
   - Animations/transitions
   - Responsive design (mobile-friendly)

2. Add error handling
   - API errors (network issues)
   - Parse errors (malformed MD)
   - Claude API errors (rate limits)
   - User-friendly error messages

3. Add loading states
   - Skeleton screens
   - Loading spinners
   - Progressive enhancement

4. Improve chat UX
   - Markdown rendering in chat
   - Code block syntax highlighting
   - Copy message button
   - Export transcript

5. Add settings
   - Claude API key input (optional)
   - Theme toggle (light/dark mode)
   - Chart preferences

6. Documentation
   - README with setup instructions
   - Environment variable guide
   - Troubleshooting section

7. Testing
   - Test all user flows
   - Test with edge cases
   - Test error scenarios
   - Performance testing

**Deliverable**: Polished, production-ready app

**Time Estimate**: 6-10 hours

---

### Phase 6: Agent Reliability & Testing (Week 4) ✅ COMPLETE
**Goal**: Comprehensive tool coverage with validation and testing framework

**Tasks:**
1. Implement missing agent tools
   - add_key_result_to_objective (add KR to existing objective)
   - update_action_in_weekly_plan (modify action properties)
   - remove_actions_from_weekly_plan (granular action deletion)

2. Enhance agent system prompt
   - Complete tool catalog with usage examples
   - Critical rules for tool invocation
   - Explicit warnings against false success claims

3. Create test documentation
   - Comprehensive test plan (docs/agent-test-plan.md)
   - All 10 operation scenarios documented
   - Expected behaviors and verification steps
   - Test execution checklist

4. Fix auto-refresh reliability
   - Improved scroll position preservation using React refs
   - Fixed state update issues preventing UI refresh
   - Removed timer-based polling issues

5. Agent capability coverage
   - 9/10 test scenarios now supported
   - Add/delete/update objectives and KRs ✓
   - Add/delete/update weekly actions ✓
   - Progress auto-calculates from KR values ✓

**Deliverable**: Reliable, testable agent with 90% scenario coverage

**Time Estimate**: 8-10 hours

**Status**: ✅ Complete (Nov 6, 2025)

---

### Phase 7: Design System Implementation (Week 3) ✅ COMPLETE

**Goal**: Establish comprehensive design system for cohesive UI/UX

**Tasks:**
1. Design system documentation
   - Created comprehensive design-system.md
   - Documented colors, typography, shadows, patterns
   - Captured rejected approaches and rationale

2. Color unification
   - Standardized purple to #a855f7 throughout
   - Replaced old colors (#764ba2, #667eea)
   - Applied gray scale hierarchy (#858a94, #9b87b5, #9ca3af)
   - Neutral borders (#e5e7eb) instead of purple

3. Typography patterns
   - Split-color titles (gradient label + gray text)
   - Applied to all page headers (Dashboard, Objectives, Plans, Check-in History)
   - Consistent heading hierarchy

4. Visual polish
   - Subtle shadows: 0 1px 3px rgba(0,0,0,0.08) on all cards
   - Light gray header backgrounds (#fafafa) for visual separation
   - Status indicators: 12px with 3px colored glow rings
   - Thin progress bars (4-6px) with vibrant gradient

5. Component refinements
   - Top navigation: Lighter shadow, neutral border
   - AI Coach panel: Removed duplicate suggested actions
   - Persistent action pills: Solid purple with white text
   - Badge styling: Neutral backgrounds, strategic purple accents
   - Gradient wash: Refined to 30px height

6. Code cleanup
   - Removed legacy Progress.jsx page (unused)
   - Consolidated duplicate UI patterns
   - Updated all CSS files for consistency

7. Pages updated
   - Dashboard: Stats, wins, chart, shadows
   - Objectives: Titles, progress bars, status indicators
   - Weekly Actions: Headers, badges, borders
   - Check-in History: Headers, section styling
   - About: Headings, links, shadows

**Deliverable**: Cohesive design system applied across entire application

**Time Estimate**: 8-10 hours

**Status**: ✅ Complete (Nov 12, 2025)

---

### Phase 8: Future Enhancements

**Goal**: Improve user experience and add advanced features

**Potential Tasks:**

1. **Real-time Claude API Streaming**
   - Implement streaming responses from Claude API
   - Add Server-Sent Events (SSE) or WebSocket-based streaming
   - Display text chunks as Claude generates them (like ChatGPT)
   - Improve perceived responsiveness and engagement
   - Better user experience during long responses

2. **Advanced Visualizations**
   - Additional chart types (burndown charts, velocity charts)
   - Interactive data exploration
   - Export charts as images

3. **Multi-user Support**
   - Authentication system
   - Per-user OKR files
   - Shared team objectives

4. **Cloud Sync**
   - Optional cloud backup
   - Multi-device access
   - Conflict resolution

5. **Mobile App**
   - React Native version
   - Quick check-ins on mobile
   - Push notifications for reminders

6. **Enhanced AI Features**
   - Smart suggestions for weekly plans
   - Predictive progress analysis
   - Anomaly detection (falling behind alerts)

**Time Estimate**: TBD per feature

**Status**: Backlog

---

## Total Timeline

**Estimated Total**: 46-65 hours (4-5 weeks part-time)

**Week 1** (Oct 31 - Nov 6): ✅ COMPLETE
- Phase 1: Dashboard foundation (you can see your data!)
- Phase 2: Navigation pages (all pages working)
- Phase 6: Agent reliability + testing (comprehensive tool coverage)

**Week 2** (Nov 6 - Nov 13): ✅ COMPLETE
- Phase 3: Chat integration (can talk to Claude)
- Phase 4: Write capability + real-time updates (full system!)
- Phase 5: Polish & enhancement

**Week 3** (Nov 10 - Nov 12): ✅ COMPLETE
- Phase 7: Design system implementation

**Launch Status**: ✅ Core functionality complete, polished UI, ready for portfolio use

**Completed Features:**
- Full dashboard with charts and real-time updates
- All navigation pages (Objectives, Plans, Check-in History, About)
- AI Coach integration with Claude API
- Conversational check-ins and file updates
- Comprehensive agent tooling (9/10 scenarios)
- Cohesive design system across entire app
- Auto-refresh on data changes (5 second polling)
- Duplicate win prevention
- Persistent action pills for quick access

---

## Cost Breakdown

### Development Costs
- **$0** - You already have development tools
- **$0** - Open source libraries/frameworks
- **Time**: 30-45 hours (your choice: I build, or we build together)

### Running Costs (Annual)

**Claude API:**
- Check-ins: 4/month × $0.05 = **$0.20/month**
- Ad-hoc queries: ~20/month × $0.01 = **$0.20/month**
- **Total: ~$0.40/month = $5/year**

**Hosting:**
- **$0** - Runs locally

**Total Annual Cost: ~$5-10**

---

## Deployment (Local-First)

### Setup Instructions

**One-time setup:**
```bash
# Clone repo
git clone <repo-url>
cd okr-web-app

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your Claude API key to .env

# Link to your MD files
ln -s /Users/jesseloudon/Documents/claude/goals ./data
```

**Daily usage:**
```bash
# Start the app (both frontend + backend)
npm run dev

# Open browser
# → http://localhost:3000
```

**That's it!** Two commands, app is running.

---

## Portfolio Value (GitHub Repo)

### Repo Name
`ai-okr-system` or `conversational-okr`

### Description
"AI-powered OKR management system with conversational interface using Claude API. Natural language check-ins, real-time progress visualization, markdown-based data storage."

### README Sections
1. **Overview** - What it does, why it's valuable
2. **Features** - Dashboard, chat, auto-updates
3. **Architecture** - Tech stack, data flow diagram
4. **Setup** - Installation instructions
5. **Usage** - Screenshots, demo video
6. **Design Decisions** - Why local-first, why markdown, why conversational
7. **Future Enhancements** - Multi-user, cloud sync, mobile app

### Demo Materials
- Screenshots of dashboard
- GIF of check-in flow (chat → files update → dashboard refreshes)
- Short video walkthrough (2-3 minutes)

### Portfolio Positioning
"Built an AI-powered OKR management system demonstrating:
- **Full-stack development**: React + Node.js + WebSocket
- **AI integration**: Claude API for natural language processing
- **Product thinking**: Conversational UX eliminates admin overhead
- **Systems design**: Markdown-based data layer, local-first architecture
- **Director-level work**: Platform orchestration, not just feature coding"

**Perfect complement** to your GenAI Product Development Lifecycle repo for KR 1.2!

---

## Next Steps

### To Start Phase 1 (This Week)

1. **Create project directory**
   ```bash
   cd /Users/jesseloudon/Documents/claude/goals
   mkdir okr-web-app
   ```

2. **I initialize the project**
   - Set up React + Vite
   - Set up Node.js + Express
   - Configure Tailwind + shadcn/ui
   - Create basic structure

3. **You provide Claude API key**
   - Sign up at console.anthropic.com (if not already)
   - Generate API key
   - Add to .env file

4. **I build Phase 1**
   - MD parser
   - API endpoints
   - Dashboard page
   - You can start using while I build Phase 2

### Decision Points

**Build Approach Options:**

**Option A: I build, you review**
- Fastest (I work independently)
- You review code, provide feedback
- You test features as they're ready

**Option B: Pair programming**
- We build together in sessions
- You learn the code deeply
- Slower but educational

**Option C: You build, I guide**
- I provide code snippets + architecture
- You implement and debug
- Deepest learning, most time

**Which approach do you prefer?**

---

## Open Questions

1. **Build approach**: Option A, B, or C above?
2. **Start timing**: This week alongside Week 5 goals, or wait until next week?
3. **Claude API key**: Do you already have an Anthropic account, or need to create one?
4. **Repo visibility**: Eventually public for portfolio, or keep private?
5. **Additional features**: Anything specific you want beyond what's in this plan?

---

## Success Criteria

**Phase 1 Success**: You can open localhost:3000 and see your OKR data visualized
**Phase 4 Success**: You can check in via chat, files update, dashboard refreshes automatically
**Launch Success**: Polished app ready for portfolio, documented on GitHub

**Ultimate Success**: This becomes your preferred way to manage OKRs AND a strong portfolio piece for director-level roles

---

*This plan can evolve based on feedback and discoveries during build. Treat as living document.*
