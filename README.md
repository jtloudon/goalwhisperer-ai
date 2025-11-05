# AI-Powered OKR System

A local-first OKR tracking web application with markdown-based data storage. Visualize your objectives, key results, weekly plans, and progress in a clean dashboard interface.

## Current Features (Phase 2 - Complete)

- 📊 **Dashboard** - Overview stats, objectives, recent completions, and wins
- 🎯 **Objectives Page** - Detailed annual objectives with KR progress tracking
- 📅 **Plans Page** - Weekly plans timeline with action items
- ✅ **Completed Page** - Completion history organized by objective and KR
- 📈 **Progress Page** - Current week progress summary
- 📁 **Markdown-Based** - All data stored in human-readable markdown files
- 🏠 **Local-First** - Runs on your machine, complete privacy

## Planned Features (Phase 3-5)

- 💬 **Conversational Check-ins** - Natural language OKR management via Claude AI (Phase 3)
- 🔄 **Auto-Updates** - Dashboard refreshes automatically when markdown files change (Phase 4)
- 📊 **Enhanced Visualizations** - Better charts, animations, loading states (Phase 5)

## Tech Stack

- **Frontend**: React + Vite + vanilla CSS
- **Backend**: Node.js + Express
- **Data**: Markdown files (parsed to JSON)
- **AI**: Claude API (planned for Phase 3)

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

**Current functionality (Phase 2):**

1. **View Dashboard** - See overview stats, objectives summary, recent completions, and wins
2. **Browse Pages** - Use sidebar navigation to explore:
   - **Objectives** - Annual goals with detailed KR breakdowns
   - **Plans** - Weekly action plans timeline
   - **Completed** - Historical completion log
   - **Progress** - Current week progress summary
   - **About** - System information
3. **Refresh Data** - Click refresh button on dashboard to reload from markdown files

**Coming soon:**
- **Chat with Claude** (Phase 3) - Conversational check-ins and file updates
- **Auto-Refresh** (Phase 4) - Watch markdown files and update dashboard automatically
- **Enhanced UI** (Phase 5) - Better charts, animations, and visual polish

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
