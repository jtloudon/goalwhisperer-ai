# AI-Powered OKR System

A local-first OKR tracking web application with markdown-based data storage. Visualize your objectives, key results, weekly plans, and progress in a clean dashboard interface.

## Current Features (Phase 6 - Complete)

- 📊 **Dashboard** - Overview stats, objectives, recent completions, and wins
- 🎯 **Objectives Page** - Detailed annual objectives with KR progress tracking
- 📅 **Plans Page** - Weekly plans timeline with action items
- ✅ **Completed Page** - Completion history organized by objective and KR
- 📈 **Progress Page** - Current week progress summary
- 💬 **AI Goal Coach** - Conversational OKR management powered by Claude Sonnet 4.5
- 🛡️ **Robust Validation** - Input validation with error feedback loop for data integrity
- 📁 **Markdown-Based** - All data stored in human-readable markdown files
- 🏠 **Local-First** - Runs on your machine, complete privacy

## Recent Updates (Nov 6, 2024)

**Phase 6: Agent Reliability & Data Validation**
- Fixed critical issue where chat agent claimed to make changes without actually calling tools
- Implemented three-layer validation system for numeric targets:
  1. Tool schema enforcement (type-level validation)
  2. Runtime validation with helpful error messages
  3. Error logging and feedback to agent
- Upgraded from Claude Haiku to Claude Sonnet 4.5 for more reliable tool calling
- Enhanced system prompts with explicit rules about tool invocation and data requirements
- Added model version display in chat interface for transparency
- Fixed issues where KR progress wasn't displaying due to non-numeric target values

**Key Technical Improvements:**
- All key results now require numeric `target` values for proper UI display
- Agent validates and rejects invalid inputs (e.g., "X lbs", "N/A") with clear error messages
- Agent now reliably updates both title AND target fields when values are embedded in both
- Comprehensive error feedback loop ensures data integrity

## Planned Features (Future Phases)

- 📊 **Enhanced Visualizations** - Better charts, animations, loading states
- 🔄 **Progress Tracking** - Historical trend analysis and insights

## Tech Stack

- **Frontend**: React + Vite + vanilla CSS
- **Backend**: Node.js + Express
- **Data**: Markdown files (parsed to JSON)
- **AI**: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

## Setup

### Prerequisites

- Node.js 18+ installed
- Claude API key ([get one here](https://console.anthropic.com/)) - only needed for Phase 3 (chat feature)

### Installation

```bash
# Install dependencies for both frontend and backend
npm install

# Your OKR markdown files should be in the personal/ folder:
personal/
  objectives/
    annual-2025.md
    2025-q4.md
  plans/
    2025-week-N-q4.md
  tracking/
    completed-items.md
    progress-summary.md

# The .env file is already configured to point to personal/
# (API key only needed later for chat feature)
```

### Running the App

```bash
# Start both frontend and backend concurrently
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

## Usage

**Current functionality:**

1. **View Dashboard** - See overview stats, recent wins
2. **Browse Pages** - Use sidebar navigation to explore:
   - **Objectives** - Annual goals with detailed KR breakdowns
   - **Weekly Actions** - Current and past weekly action plans with status tracking
   - **Completed** - Historical completion log
   - **About** - System information
3. **Auto-Refresh** - Pages auto-refresh every 5 seconds to reflect markdown file changes

### Working with the Chat Agent

The AI Goal Coach panel (powered by Claude) can help you manage your weekly actions. Here's how to use it:

**Marking Actions Complete:**

When you want to mark a weekly action as complete, reference it by number:
- "Close action 3" or "Mark action 2 as done"
- The agent will add ✅ to the beginning of that action's title in the markdown file

**How it works:**
1. Actions are numbered sequentially (1, 2, 3...) on the Weekly Actions page
2. The agent needs to:
   - Identify the weekly plan file (e.g., `personal/plans/plan-2025-10-31.md`)
   - Count actions in the order they appear in the file
   - Use the Edit tool to add `✅ ` at the start of the action title (e.g., `## Design app` → `## ✅ Design app`)
3. The page will auto-refresh and show the completed action with a checkmark and strikethrough

**CRITICAL for the agent:**
- **YOU MUST USE THE EDIT TOOL.** Simply saying "I've marked it complete" or "I've updated the file" is NOT enough. You must actually invoke the Edit tool with the file path and the exact old_string/new_string parameters.
- **ONLY modify the action title line (the `##` heading).** Do NOT touch the `**Maps to**:` line or any other content below the action title.
- **Verify your work:** After using the Edit tool, the system will confirm the edit was successful. If you don't see this confirmation, the file was NOT modified.
- Example of correct workflow:
  ```
  1. User says: "Mark action 1 complete from week 10/7"
  2. You read: personal/plans/plan-2025-10-07.md
  3. You identify action 1: "## Create career/current-profile.md"
  4. You use Edit tool:
     - old_string: "## Create career/current-profile.md"
     - new_string: "## ✅ Create career/current-profile.md"
  5. System confirms: "File has been updated"
  6. You tell user: "I've marked action 1 complete"

  (Keep everything else unchanged, including the **Maps to**: line)
  ```

**Coming soon:**
- **Enhanced Chat Features** - More conversational OKR management
- **Enhanced Visualizations** - Better charts, animations, and visual polish

## Project Structure

```
okr-web-app/
├── frontend/          # React application (Vite + React Router)
│   ├── src/
│   │   ├── components/  # Sidebar, etc.
│   │   ├── pages/       # Dashboard, Objectives, Plans, etc.
│   │   └── App.jsx
├── backend/           # Node.js API server
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Markdown parser
│   │   └── config/      # File paths
├── personal/          # Your OKR data (gitignored)
│   ├── objectives/
│   ├── plans/
│   └── tracking/
├── docs/              # Technical documentation
│   └── project-plan.md  # Phase-by-phase build plan
├── .env               # Configuration
├── .gitignore         # Excludes personal/ folder
├── package.json       # Root dependencies and scripts
└── README.md
```

## Demo Data (Coming Soon)

A `/demo` folder with sanitized example data will be added for others to try the app without personal information.

## Development

Built as a portfolio project demonstrating:
- Full-stack development (React + Node.js)
- AI integration (Claude API)
- Product thinking (conversational UX)
- Systems design (markdown-based data layer)

## License

MIT

## Author

Jesse Loudon - [GitHub](https://github.com/jtloudon)
