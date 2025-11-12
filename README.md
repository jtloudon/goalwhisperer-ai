# GoalWhisperer AI

**Your personal AI-powered goal tracking system.** Track objectives, visualize progress, and get AI coaching—all with local-first privacy and markdown-based data.

![GoalWhisperer AI](https://via.placeholder.com/800x400/764ba2/ffffff?text=GoalWhisperer+AI)

---

## ⚡ Quick Start (5 minutes)

### 1. Clone & Install
```bash
git clone https://github.com/jtloudon/goalwhisperer-ai.git
cd goalwhisperer-ai
npm run install:all
```

### 2. Choose Your Path

#### 🎯 Option A: Try Demo Data (Fastest)
Perfect for seeing what the app can do before setting up your goals.

```bash
DATA_DIR=./demo npm run dev
```

**Then open:** http://localhost:5173

You'll see a coffee shop owner's goals—completely fake data to explore features!

#### 🧪 Option A.2: Test New User Experience
Simulate a brand new user with empty data (for testing or development).

```bash
DATA_DIR=./demo-new-user npm run dev
# or use the npm script:
npm run dev:newuser
```

This runs the app with empty directories to test:
- New user onboarding flows
- Automatic file/directory creation
- Empty state handling

#### 🚀 Option B: Interactive Setup Wizard
Guided setup that helps you create your first goal.

```bash
npm run setup
```

The wizard will:
- Create your data folder structure
- Help you write your first objective
- Set up the AI coach (optional)

Then run:
```bash
npm run dev
```

#### 📝 Option C: Manual Setup
For those who prefer full control.

```bash
# 1. Copy demo structure
cp -r demo personal

# 2. Edit your goals
nano personal/objectives/annual-2025.md

# 3. Run the app
npm run dev
```

---

## 🎯 Features

### Core Tracking
- **📊 Dashboard** - Visual overview of all objectives and recent wins
- **🎯 Objectives** - Annual goals with measurable Key Results
- **📅 Weekly Actions** - Break goals into weekly action items
- **📈 Progress Tracking** - Automatic progress calculation and visualization
- **✅ Check-in History** - Reflect on what's working each week

### AI Coach (Optional)
- **💬 Conversational Interface** - Chat with Claude Sonnet 4.5 about your goals
- **🤖 Smart Updates** - "Mark action 3 complete", "Update KR 1.2 to 75%"
- **📝 Weekly Check-ins** - Guided reflection and insights
- **🎯 Goal Creation** - Natural language objective setting

### Privacy & Data
- **🏠 Local-First** - All data stays on your machine
- **📁 Markdown Storage** - Human-readable, version control friendly
- **🔒 No Cloud Required** - Works offline (AI features need API key)
- **📤 Git-Friendly** - Track goals alongside your code

---

## 📖 How It Works

GoalWhisperer uses a simple markdown structure:

```
personal/
├── objectives/
│   └── annual-2025.md        # Your yearly goals
├── plans/
│   └── plan-2025-11-10.md   # Weekly action items
└── tracking/
    ├── completed-items.md    # What you've accomplished
    ├── checkin-history.md    # Weekly reflections
    └── progress-summary.md   # Current status
```

Example objective:
```markdown
## Objective 1: Launch My Side Business

**Description**: Build and launch a sustainable side business

**Progress**: 45%

### Key Results

#### KR 1.1: Acquire 100 customers
- **Status**: in-progress
- **Target**: 100
- **Current**: 45
- **Progress**: 45%
- **Target Date**: 2025-12-31
```

The app parses these files and creates beautiful visualizations!

---

## 🛠️ Setup Details

### Prerequisites
- **Node.js 18+** ([download](https://nodejs.org/))
- **Anthropic API Key** (optional, for AI features) - [Get one here](https://console.anthropic.com/)

### Enable AI Coach

1. Get API key from https://console.anthropic.com/
2. Edit `backend/.env`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
3. Restart: `npm run dev`

### Validate Your Data

Check if your markdown files are formatted correctly:

```bash
npm run validate
```

This will show errors like:
- Missing required fields
- Invalid date formats
- Non-numeric target values
- Structural issues

---

## 🎨 Screenshots

### Dashboard View
Clean overview of objectives, progress, and recent wins.

### AI Coach Panel
Chat naturally about your goals—"Show my progress" or "Create a new objective".

### Weekly Actions
See all action items organized by objective with completion tracking.

---

## 💡 Tips & Best Practices

### Writing Good Objectives
✅ **Good:** "Launch sustainable coffee shop business"
❌ **Too vague:** "Do business stuff"

### Measurable Key Results
✅ **Good:** "Acquire 100 customers by Dec 31"
❌ **Not measurable:** "Get some customers"

### Weekly Planning
- Keep actions to 3-5 per week
- Map each action to a specific Key Result
- Mark complete as you finish them

### Using the AI Coach
- Be specific: "Mark action 2 complete from this week"
- Ask for help: "What should I focus on this week?"
- Weekly check-ins: "Let's do my weekly check-in"

---

## 🏗️ Tech Stack

- **Frontend:** React 18 + Vite + React Router
- **Backend:** Node.js + Express
- **AI:** Claude Sonnet 4.5 (Anthropic)
- **Data:** Markdown files (no database!)
- **Styling:** Vanilla CSS with gradient accents

---

## 📦 Project Structure

```
goalwhisperer-ai/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   └── App.jsx
├── backend/               # API server
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Parser & AI logic
│   │   └── server.js
├── demo/                  # Sample data (coffee shop owner)
│   ├── objectives/
│   ├── plans/
│   └── tracking/
├── scripts/               # Setup & validation tools
│   ├── setup.js          # Interactive wizard
│   └── validate-data.js  # Data checker
└── personal/             # YOUR data (gitignored)
```

---

## 🚀 Development

### Available Scripts

```bash
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Frontend only (port 5173)
npm run dev:backend      # Backend only (port 3001)
npm run build            # Build for production
npm run setup            # Interactive setup wizard
npm run validate         # Check markdown data
```

### Running with Different Data

```bash
# Use demo data
DATA_DIR=./demo npm run dev

# Use personal data (default)
npm run dev

# Use custom location
DATA_DIR=/path/to/data npm run dev
```

---

## 🤝 Contributing

This is a personal portfolio project, but I welcome:
- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements

Please open an issue to discuss!

---

## 📄 License

MIT License - Feel free to use this for your own goals!

---

## 👤 Author

**Jesse Loudon**
- Portfolio project demonstrating full-stack + AI integration
- [GitHub](https://github.com/jtloudon)

---

## 🎯 Why GoalWhisperer?

Traditional goal tracking tools are either:
- **Too complex** (enterprise OKR software)
- **Too simple** (todo lists)
- **Not private** (cloud-only services)

GoalWhisperer gives you:
✅ **Structure** of OKR methodology
✅ **Simplicity** of markdown files
✅ **Intelligence** of AI coaching
✅ **Privacy** of local-first architecture

**Your goals. Your data. Your machine.**

---

## 📚 Additional Resources

- **Demo Data:** See `demo/` folder for examples
- **Data Format:** Check `demo/objectives/annual-2025.md` for template
- **Troubleshooting:** Run `npm run validate` to check data

---

*Made with ❤️ and Claude Sonnet 4.5*
