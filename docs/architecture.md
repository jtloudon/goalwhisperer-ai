# Architecture & Design

## Design Principles

**Local-First Data**
Markdown files as single source of truth—version control friendly, human-readable, tool-agnostic. No vendor lock-in, no cloud dependency.

**API-Driven Backend**
RESTful architecture separating data access from presentation. Backend parses markdown, validates structure, and exposes clean JSON APIs.

**Stateless AI Integration**
Claude Sonnet 4.5 as conversational layer without persisting chat history. Each interaction is self-contained, tool-use pattern updates markdown files directly.

**Progressive Enhancement**
Core functionality works offline. AI features require API key but degrade gracefully—you can always edit markdown files manually.

---

## System Architecture

```
┌─────────────────┐
│  React Frontend │ ← User interface, progress visualizations
└────────┬────────┘
         │
         ├── HTTP API ──→ ┌──────────────────┐
         │                │  Express Backend │ ← Markdown parser, data validation
         │                └────────┬─────────┘
         │                         │
         │                         ├── File System (./personal/*.md)
         │                         └── Claude API (optional)
         │
         └── Voice API ──→ Browser Speech Recognition (Chrome/Edge/Safari)
                          OR OpenAI Whisper (fallback for Firefox)
```

---

## Data Flow

### Reading Data (Dashboard Load)
1. Frontend requests `/api/dashboard`
2. Backend reads `annual-2025.md`, `progress-summary.md`, etc.
3. Parser converts markdown → JSON objects
4. Frontend renders progress bars, charts, wins
5. Auto-refresh every 5 seconds (polling)

### Voice Input Flow
1. User clicks 🎤 microphone button
2. **Chrome/Edge/Safari:** Native Web Speech API (real-time transcription)
3. **Firefox:** Audio → OpenAI Whisper API → text
4. Text appears in chat input as user speaks

### AI Update Flow
1. User: "Mark action 2 complete for week of Nov 11"
2. Frontend sends message → `/api/chat`
3. Backend invokes Claude with conversation history + 18 tools
4. Claude calls `update_action_in_weekly_plan` tool
5. Writer service updates `plan-2025-11-11.md` (adds `[DONE]` prefix)
6. Backend returns Claude's response
7. Frontend auto-refreshes → shows updated state

### Startup Flow (GoalWhisperer.app)
1. **Port cleanup** - Check ports 3001 and 5173 with `lsof`
2. **Kill conflicts** - Terminate existing processes if ports busy (`kill -9`)
3. **Start servers** - Launch both frontend and backend via `npm run dev`
4. **Wait for readiness** - Poll ports until both services respond
5. **Open browser** - Launch Safari to http://localhost:5173
6. **Display logs** - Show server output in terminal window

**Benefits:**
- No manual port management required
- Handles stale processes from previous sessions
- Visual feedback during startup process
- Single-click launch experience

---

## Key Architectural Decisions

### Why Markdown Instead of Database?

**Reasoning:**
- **Human-readable:** Can edit with any text editor, anywhere
- **Git-friendly:** Version control works natively (diff/merge/history)
- **No vendor lock-in:** Just text files—portable to any system
- **Easy backup:** Copy folder to Dropbox/iCloud/USB drive
- **Debugging:** Open file to see exactly what's stored

**Trade-offs:**
- ❌ No relational queries (can't easily "find all KRs due this month across all objectives")
- ❌ No ACID transactions (file writes could theoretically conflict)
- ✅ But: Personal use case = single user, low write frequency, high portability value

### Why Local-First Instead of Cloud?

**Reasoning:**
- **Privacy:** Sensitive goals stay on your machine
- **Speed:** No network latency for reads
- **Offline:** Works without internet (except AI features)
- **Cost:** No server hosting, no database fees

**Trade-offs:**
- ❌ No cross-device sync (must manually sync files)
- ❌ No mobile app (would need local file access)
- ✅ But: Target user = developers comfortable with git/file sync

### Why Stateless AI (No Chat History Persistence)?

**Reasoning:**
- **Simplicity:** No database, no session management
- **Privacy:** Conversations aren't stored anywhere
- **Cost:** Each request is self-contained (no historical context to send = lower token cost)

**Trade-offs:**
- ❌ AI doesn't "remember" previous conversations
- ❌ User must be explicit in each request
- ✅ But: OKR context loaded fresh each time from markdown files (truth source)

### Why Tool-Use Pattern Instead of Text Parsing?

**Reasoning:**
- **Reliability:** Structured tool calls > regex parsing of AI responses
- **Type safety:** Tool parameters validated by Claude
- **Extensibility:** Easy to add new operations (just add new tool)

**Implementation:**
```javascript
// Claude has 18+ tools it can invoke:
{
  name: "update_progress",
  description: "Update the current value and progress percentage for a Key Result",
  input_schema: {
    type: "object",
    properties: {
      kr_id: { type: "string", description: "Key Result ID (e.g., 'kr-1.2')" },
      new_current: { type: "number", description: "New current value" }
    },
    required: ["kr_id", "new_current"]
  }
}
```

When user says "Update KR 1.2 to 75", Claude:
1. Identifies intent → use `update_progress` tool
2. Extracts parameters → `{ kr_id: "kr-1.2", new_current: 75 }`
3. Backend executes tool → updates markdown file
4. Claude receives result → confirms to user

---

## Component Architecture

### Frontend (`/frontend/src`)

**Pages:**
- `Dashboard.jsx` - Overview, progress bars, recent wins
- `Objectives.jsx` - Detail view of all objectives and KRs
- `Plans.jsx` - Weekly action items organized by objective
- `CheckinHistory.jsx` - Historical weekly reflections

**Components:**
- `ClaudePanel.jsx` - AI chat interface with voice input
- `WinsTrendline.jsx` - Recharts visualization of wins over time
- `EmptyState.jsx` - New user onboarding UI
- `TopNav.jsx` - Navigation between pages

**State Management:**
- No Redux/Zustand—simple `useState` + prop drilling
- API polling every 5 seconds for live updates
- Voice state managed in `ClaudePanel` component

### Backend (`/backend/src`)

**Services:**
- `parser.js` (736 lines) - Markdown → JSON conversion
  - Parses objectives, KRs, weekly plans, tracking files
  - Calculates progress percentages (direction-aware)
  - Extracts dates, maps actions to KRs

- `claude.js` (797 lines) - AI integration
  - Defines 18+ tools for CRUD operations
  - Manages conversation flow (quick status vs weekly check-in)
  - Validates tool parameters before file writes

- `writer.js` - JSON → Markdown updates
  - Preserves markdown formatting during updates
  - Handles concurrent writes (rare in single-user context)

**Routes:**
- `GET /api/dashboard` - Overview data
- `GET /api/objectives` - Full objective details
- `GET /api/plans` - Weekly action items
- `POST /api/chat` - Claude conversation endpoint
- `POST /api/transcribe` - OpenAI Whisper (Firefox fallback)

---

## Security Considerations

### API Key Management
- `.env` file (gitignored) stores Anthropic/OpenAI keys
- Backend never exposes keys to frontend
- Keys only used for server-side API calls

### Input Validation
- Markdown parser sanitizes user input
- Tool parameters validated before file writes
- No SQL injection risk (no database)
- No XSS risk (React auto-escapes by default)

### File System Access
- Backend restricted to `DATA_DIR` path (configurable)
- No arbitrary file reads/writes outside data directory
- Path traversal prevented by `path.join()` validation

---

## Performance Characteristics

### Read Performance
- **Cold start:** ~100ms (parse all markdown files)
- **Incremental:** 5-second polling updates only changed sections
- **Bottleneck:** File I/O (mitigated by small file sizes)

### Write Performance
- **Tool execution:** ~50ms (update single markdown file)
- **AI response time:** 2-5 seconds (Claude API latency)
- **Voice transcription:** Real-time (browser) or ~1s (Whisper)

### Scalability Limits
- **Objectives:** Tested up to 10 objectives, ~30 KRs (no performance issues)
- **Weekly plans:** 52 files per year (negligible)
- **Wins:** Hundreds of entries (linear scan acceptable)

**Not designed for:**
- ❌ Multi-user/team collaboration (single-user architecture)
- ❌ Thousands of objectives (markdown parsing would slow)
- ❌ Real-time sync across devices (polling-based, not websockets)

---

## Future Architecture Improvements

**Potential Enhancements:**
1. **Incremental parsing** - Only re-parse changed files (watch for file modifications)
2. **Caching layer** - Redis/in-memory cache for parsed markdown
3. **WebSocket updates** - Real-time UI updates instead of polling
4. **Multi-device sync** - Integrate with Dropbox/iCloud File Provider APIs
5. **Offline AI** - Local LLM (e.g., Llama) for privacy-first AI features

**Why not implemented:**
- Current performance is sufficient for single-user personal use
- Added complexity not justified for MVP scope
- Prioritizing core UX (voice interaction) over optimization
