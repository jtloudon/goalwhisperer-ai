# API Reference

Backend API documentation for the OKR web app. This REST API serves parsed markdown data to the frontend and will be extended in Phase 3 to support Claude AI integration.

**Base URL**: `http://localhost:3001`
**Version**: 0.1.0 (Phase 2)

---

## Quick Reference

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/` | GET | API info and endpoint list | ✅ Live |
| `/api/health` | GET | Health check | ✅ Live |
| `/api/dashboard` | GET | Aggregated dashboard data | ✅ Live |
| `/api/objectives/annual` | GET | Annual objectives with KRs | ✅ Live |
| `/api/tracking/progress` | GET | Current week progress summary | ✅ Live |
| `/api/tracking/completed` | GET | Historical completion log | ✅ Live |
| `/api/plans` | GET | All weekly plans (sorted newest first) | ✅ Live |

**Phase 3 endpoints (planned)**:
- `/api/ai/check-in` - POST - Natural language OKR check-in
- `/api/ai/query` - POST - Query OKR data conversationally

---

## Response Format

All API responses follow a consistent envelope pattern:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**HTTP Status Codes**:
- `200 OK` - Successful request
- `500 Internal Server Error` - Parser error, file read error, or server error

---

## Endpoints

### 1. Root Endpoint

**`GET /`**

Returns API metadata and available endpoints.

**Response**:
```json
{
  "message": "OKR API Server",
  "version": "0.1.0",
  "endpoints": {
    "health": "/api/health",
    "dashboard": "/api/dashboard",
    "objectives": "/api/objectives/annual",
    "progress": "/api/tracking/progress",
    "completed": "/api/tracking/completed",
    "plans": "/api/plans"
  }
}
```

**Example**:
```bash
curl http://localhost:3001/
```

---

### 2. Health Check

**`GET /api/health`**

Health check endpoint for monitoring and deployment verification.

**Response**:
```json
{
  "success": true,
  "message": "OK",
  "timestamp": "2025-03-24T15:30:00.000Z"
}
```

**Example**:
```bash
curl http://localhost:3001/api/health
```

**Use Cases**:
- Docker health checks
- Load balancer monitoring
- Deployment verification
- Quick connectivity test

---

### 3. Dashboard Data

**`GET /api/dashboard`**

Returns aggregated dashboard data combining objectives, progress, and recent completions.

**Implementation Note**: This endpoint performs 3 parallel file reads and aggregates results using `Promise.all()`.

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalObjectives": 2,
      "overallProgress": 43,
      "onTrack": 2,
      "atRisk": 0,
      "currentWeek": 12,
      "currentQuarter": 2
    },
    "objectives": [
      {
        "id": "obj-1",
        "title": "Launch Personal Learning Platform",
        "progress": 43,
        "status": "at-risk",  // "ahead" | "on-track" | "at-risk" | "blocked"
        "keyResults": [
          {
            "id": "kr-1.1",
            "number": "1.1",
            "title": "Complete 5 online courses",
            "targetDate": "Mar 31, 2025",
            "status": "complete",  // "complete" | "in-progress"
            "progress": 100,
            "current": 5,
            "target": 5,
            "measurement": "metric",
            "weight": 30
          }
        ]
      }
    ],
    "recentCompletions": [
      {
        "date": "2025-03-20",
        "status": "✓",  // "✓" | "⚠️" | "🔄"
        "description": "Completed final React course",
        "objectiveId": "obj-1",
        "krId": "kr-1.1",
        "krTitle": "Complete 5 online courses"
      }
    ],
    "wins": [
      "Completed final React course",
      "Deployed first portfolio project"
    ]
  }
}
```

**Status Calculation Logic** (`backend/src/services/parser.js:286`):
```javascript
progress >= 90 ? 'ahead'
  : progress >= 70 ? 'on-track'
  : progress >= 40 ? 'at-risk'
  : 'blocked'
```

**Example**:
```bash
curl http://localhost:3001/api/dashboard
```

**Frontend Usage**:
- Dashboard page (`frontend/src/pages/Dashboard.jsx`)
- Overview cards, objective summaries, recent activity

---

### 4. Annual Objectives

**`GET /api/objectives/annual`**

Returns all annual objectives with key results and progress tracking.

**Data Source**: `personal/objectives/annual-2025.md`

**Response Schema**:
```json
{
  "success": true,
  "data": [
    {
      "id": "obj-1",
      "number": 1,
      "title": "Launch Personal Learning Platform",
      "description": "Build technical skills in modern web development",
      "keyResults": [
        {
          "id": "kr-1.1",
          "number": "1.1",
          "title": "Complete 5 online courses",
          "targetDate": "Mar 31, 2025",
          "status": "complete",
          "progress": 100,
          "current": 5,
          "target": 5,
          "measurement": "metric",
          "weight": 30
        },
        {
          "id": "kr-1.2",
          "number": "1.2",
          "title": "Build 3 full-stack projects",
          "targetDate": "Jun 30, 2025",
          "status": "in-progress",
          "progress": 33,
          "current": 1,
          "target": 3,
          "measurement": "incremental",
          "weight": 40
        }
      ],
      "progress": 43
    }
  ]
}
```

**Field Details**:
- `id` - Objective identifier (format: `obj-N`)
- `number` - Objective number (integer)
- `title` - Objective title (from markdown `### Objective N: Title`)
- `description` - From `**Why this matters**:` field
- `progress` - Overall objective progress percentage (0-100)
- `keyResults` - Array of key results
  - `measurement` - Type: "metric", "incremental", "milestone", "boolean"
  - `weight` - Percentage weight in overall objective (sum = 100%)
  - `current/target` - Numeric progress values

**Example**:
```bash
curl http://localhost:3001/api/objectives/annual
```

**Frontend Usage**:
- Objectives page (`frontend/src/pages/Objectives.jsx`)
- Dashboard objective cards

---

### 5. Progress Summary

**`GET /api/tracking/progress`**

Returns current week's progress summary with wins and status flags.

**Data Source**: `personal/tracking/progress-summary.md`

**Response Schema**:
```json
{
  "success": true,
  "data": {
    "week": 12,
    "quarter": 2,
    "year": 2025,
    "generatedDate": "March 24, 2025",
    "overview": {
      "overallProgress": 43,
      "onTrack": 2,
      "atRisk": 0
    },
    "objectives": [],  // Parsed but typically empty (detail in annual objectives)
    "flags": [],        // Reserved for future use
    "wins": [
      "Completed final React course",
      "Deployed first portfolio project",
      "Started planning second project"
    ]
  }
}
```

**Field Details**:
- `week` - Week number of year (1-52)
- `quarter` - Quarter number (1-4)
- `year` - Year (4-digit)
- `generatedDate` - Human-readable date string
- `wins` - Array of win descriptions (from `## Wins This Week 🎉` section)

**Example**:
```bash
curl http://localhost:3001/api/tracking/progress
```

**Frontend Usage**:
- Dashboard wins section
- Progress page (`frontend/src/pages/Progress.jsx`)

---

### 6. Completed Items

**`GET /api/tracking/completed`**

Returns historical log of completed actions organized by objective and key result.

**Data Source**: `personal/tracking/completed-items.md`

**Response Schema**:
```json
{
  "success": true,
  "data": [
    {
      "id": "obj-1",
      "title": "Launch Personal Learning Platform",
      "keyResults": [
        {
          "id": "kr-1.1",
          "title": "Complete 5 online courses",
          "completions": [
            {
              "date": "2025-03-20",
              "status": "✓",
              "description": "Completed 'Testing and Deployment' course"
            },
            {
              "date": "2025-03-12",
              "status": "✓",
              "description": "Completed 'Full-Stack Integration' course"
            }
          ]
        }
      ]
    }
  ]
}
```

**Status Icons**:
- `✓` - Successfully completed
- `⚠️` - Completed with warnings/concerns
- `🔄` - In progress

**Sorting**: Completions are stored in reverse chronological order (newest first) as written in markdown.

**Example**:
```bash
curl http://localhost:3001/api/tracking/completed
```

**Frontend Usage**:
- Completed page (`frontend/src/pages/Completed.jsx`)
- Dashboard recent completions (last 5 items across all KRs)

---

### 7. Weekly Plans

**`GET /api/plans`**

Returns all weekly plans sorted by week number (newest first).

**Data Source**: `personal/plans/` directory (all `YYYY-week-N-qN.md` files)

**Response Schema**:
```json
{
  "success": true,
  "data": [
    {
      "file": "2025-week-12-q2.md",
      "week": 12,
      "quarter": 2,
      "year": 2025,
      "dateRange": "March 24 - March 30, 2025",
      "actions": [
        { "title": "Design architecture for Recipe Finder app" },
        { "title": "Research open source contribution opportunities" },
        { "title": "Continue consistent workout schedule" }
      ]
    },
    {
      "file": "2025-week-11-q2.md",
      "week": 11,
      "quarter": 2,
      "year": 2025,
      "dateRange": "March 17 - March 23, 2025",
      "actions": [
        { "title": "Complete final deployment testing" }
      ]
    }
  ]
}
```

**Field Details**:
- `file` - Markdown filename
- `week/quarter/year` - Parsed from filename (not title)
- `dateRange` - Date range string from title
- `actions` - Array of action titles only (simplified extraction)

**Note**: Action details (maps to, why, success criteria) are preserved in markdown but not currently parsed. Can be extended in future phases.

**Sorting**: Plans sorted newest to oldest (`plans.sort((a, b) => b.week - a.week)`)

**Example**:
```bash
curl http://localhost:3001/api/plans
```

**Frontend Usage**:
- Plans page (`frontend/src/pages/Plans.jsx`)
- Timeline view of weekly actions

---

## Data Schemas

### Objective Schema
```typescript
{
  id: string,              // "obj-N"
  number: number,          // N
  title: string,
  description?: string,    // From "Why this matters"
  keyResults: KeyResult[],
  progress: number         // 0-100
}
```

### KeyResult Schema
```typescript
{
  id: string,              // "kr-N.M"
  number: string,          // "N.M"
  title: string,
  targetDate: string,      // Free-form date string
  status: "complete" | "in-progress",
  progress: number,        // 0-100
  current: number,         // Current value
  target: number,          // Target value
  measurement: "metric" | "incremental" | "milestone" | "boolean",
  weight: number           // Percentage (0-100)
}
```

### Completion Schema
```typescript
{
  date: string,            // ISO format: "YYYY-MM-DD"
  status: "✓" | "⚠️" | "🔄",
  description: string,
  objectiveId?: string,    // Added by dashboard aggregation
  krId?: string,           // Added by dashboard aggregation
  krTitle?: string         // Added by dashboard aggregation
}
```

### Plan Schema
```typescript
{
  file: string,            // "YYYY-week-N-qN.md"
  week: number,            // 1-52
  quarter: number,         // 1-4
  year: number,            // YYYY
  dateRange: string,       // Human-readable date range
  actions: Action[]
}
```

### Action Schema
```typescript
{
  title: string            // Action title only (details not parsed)
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

**Status Code**: `500 Internal Server Error`

### Common Errors

#### File Not Found
```json
{
  "success": false,
  "error": "ENOENT: no such file or directory, open '/path/to/file.md'"
}
```

**Cause**: Markdown file missing from `personal/` directory
**Fix**: Ensure file exists at expected path (check `backend/src/config/paths.js`)

#### Parse Error
```json
{
  "success": false,
  "error": "Cannot read properties of null (reading '1')"
}
```

**Cause**: Markdown format doesn't match expected structure
**Fix**: Validate markdown against patterns in `docs/markdown-format-guide.md`

#### Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

**Cause**: Unhandled exception in server middleware
**Debug**: Check server logs for stack trace

---

## CORS Configuration

**Current Settings**: Open CORS - allows all origins

```javascript
app.use(cors());  // backend/src/server.js:13
```

**Frontend Origin**: `http://localhost:5173` (Vite dev server)

**Production Note**: Lock down CORS to specific origins before deployment:
```javascript
app.use(cors({
  origin: ['https://yourdomain.com'],
  methods: ['GET', 'POST'],
  credentials: true
}));
```

---

## Middleware Stack

1. **CORS** - Enable cross-origin requests
2. **JSON Parser** - Parse JSON request bodies (`express.json()`)
3. **Request Logger** - Log all requests with timestamp
4. **API Routes** - Mount at `/api` prefix
5. **Error Handler** - Catch-all error middleware

**Order matters**: Middleware executes in the order defined.

---

## Adding New Endpoints (Phase 3 Pattern)

When adding Claude AI endpoints in Phase 3, follow this pattern:

### 1. Define Route in `backend/src/routes/api.js`

```javascript
/**
 * POST /api/ai/check-in
 * Natural language OKR check-in
 */
router.post('/ai/check-in', async (req, res) => {
  try {
    const { message } = req.body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Call AI service
    const response = await aiService.checkIn(message);

    res.json({ success: true, data: response });
  } catch (error) {
    console.error('AI check-in error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Create Service Module

Create `backend/src/services/ai.js` for Claude API integration:

```javascript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function checkIn(message) {
  // Implementation here
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: message }],
  });

  return response.content[0].text;
}
```

### 3. Add to Root Endpoint List

Update `backend/src/server.js:30-37` to include new endpoints in API index.

### 4. Document in This File

Add endpoint details to Quick Reference table and create detailed documentation section.

---

## Testing Endpoints

### Manual Testing with curl

**Health check**:
```bash
curl http://localhost:3001/api/health
```

**Dashboard data**:
```bash
curl http://localhost:3001/api/dashboard | jq
```

**Specific objective data**:
```bash
curl http://localhost:3001/api/objectives/annual | jq '.data[0]'
```

**Test POST endpoint** (for Phase 3):
```bash
curl -X POST http://localhost:3001/api/ai/check-in \
  -H "Content-Type: application/json" \
  -d '{"message": "What objectives am I working on this week?"}'
```

### Frontend Testing

Start both servers:
```bash
npm run dev  # Starts frontend (5173) and backend (3001)
```

Open browser console and test:
```javascript
// Fetch dashboard data
fetch('http://localhost:3001/api/dashboard')
  .then(r => r.json())
  .then(console.log);

// Check all endpoints
const endpoints = [
  '/api/health',
  '/api/dashboard',
  '/api/objectives/annual',
  '/api/tracking/progress',
  '/api/tracking/completed',
  '/api/plans'
];

endpoints.forEach(async (endpoint) => {
  const res = await fetch(`http://localhost:3001${endpoint}`);
  const data = await res.json();
  console.log(endpoint, data.success ? '✓' : '✗');
});
```

### Parser Testing

Test parser functions directly:
```bash
cd backend
node test-parser.js
```

---

## Environment Configuration

**File**: `.env` (project root)

```bash
# Server Configuration
PORT=3001

# Data Directory (optional - defaults to personal/)
DATA_DIR=/path/to/personal/data

# Phase 3: Claude AI (not yet used)
ANTHROPIC_API_KEY=your_api_key_here
```

**Loaded by**: `backend/src/server.js:7` using `dotenv`

**Path Resolution**: `backend/src/config/paths.js:8` - defaults to `personal/` if not set

---

## File Path Configuration

**File**: `backend/src/config/paths.js`

Centralizes all data file paths. Modify here to change data locations:

```javascript
export const PATHS = {
  objectives: {
    annual: path.join(DATA_DIR, 'objectives/annual-2025.md'),
    quarterly: path.join(DATA_DIR, 'objectives/2025-q4.md'),  // Not yet used
  },
  tracking: {
    completed: path.join(DATA_DIR, 'tracking/completed-items.md'),
    progress: path.join(DATA_DIR, 'tracking/progress-summary.md'),
  },
  plans: path.join(DATA_DIR, 'plans'),  // Directory, not file
};
```

**Why centralized**: Single source of truth for file paths, easier to update for different years.

---

## Parser Implementation Notes

All parsers in `backend/src/services/parser.js` use **regex-based line-by-line parsing**:

- **No markdown AST library** - keeps dependencies minimal
- **Stateful parsing** - tracks `currentObj`, `currentKR` as it walks through lines
- **Permissive on extras** - ignores unrecognized lines (flexible for adding notes)
- **Strict on structure** - exact patterns required for data extraction

**Performance**: Fast for small files (< 1000 lines). All personal OKR files fit this profile.

**Limitations**:
- Doesn't handle deeply nested structures
- Regex patterns must match exactly (see `docs/markdown-format-guide.md`)
- No validation of parsed data (trusts markdown format)

**Extension Points** (for Phase 3):
- Add validation layer before returning data
- Add caching to avoid re-parsing unchanged files
- Add file watcher integration (Chokidar already installed)

---

## Phase 3 Integration Points

When adding Claude conversational check-ins:

### Endpoint: `POST /api/ai/check-in`

**Request**:
```json
{
  "message": "I completed 2 courses this week",
  "context": {
    "week": 12,
    "quarter": 2
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "reply": "Great! That brings you to 3/5 courses for KR 1.1...",
    "updates": [
      {
        "objectiveId": "obj-1",
        "krId": "kr-1.1",
        "field": "current",
        "oldValue": 1,
        "newValue": 3
      }
    ],
    "suggestedEdits": [
      {
        "file": "personal/tracking/completed-items.md",
        "change": "Add completion entries for 2 courses"
      }
    ]
  }
}
```

**Implementation Approach**:
1. Parse natural language message with Claude
2. Load current OKR state via existing endpoints
3. Determine what needs updating
4. Generate markdown edits (or apply directly via file writes)
5. Return confirmation and suggested next steps

**Dependencies**:
- Anthropic SDK (already in `package.json`)
- Parser functions (reuse existing)
- File writing utilities (new - needs implementation)

---

## Quick Debugging Checklist

**API not responding?**
1. Check server is running: `curl http://localhost:3001/api/health`
2. Check port in use: `lsof -i :3001`
3. Review server logs for errors

**Empty/null data?**
1. Verify markdown files exist in `personal/` directory
2. Validate markdown format: `docs/markdown-format-guide.md`
3. Test parser directly: `cd backend && node test-parser.js`
4. Check file paths: `backend/src/config/paths.js`

**CORS errors?**
1. Confirm frontend origin: `http://localhost:5173`
2. Check browser console for specific error
3. Verify `cors()` middleware is enabled

**500 errors?**
1. Check server console for error details
2. Validate markdown format (most common cause)
3. Ensure all required files exist

---

## Related Documentation

- **Markdown Format Guide**: `docs/markdown-format-guide.md` - Required structure for data files
- **Project Plan**: `docs/project-plan.md` - Phase-by-phase development roadmap
- **README**: `README.md` - Quick start and overview

---

**Last Updated**: November 5, 2025
