# Demo Data

This folder contains **sample data** to demonstrate GoalWhisperer AI's capabilities. All data is fictional and created for demonstration purposes only.

## Demo Persona

**Alex Rivera** - An entrepreneur launching a sustainable coffee shop while pursuing personal wellness and language learning goals.

## What's Included

### Objectives (3 Active Goals)
1. **Launch Sustainable Coffee Shop Business** - Community-focused café with local partnerships
2. **Develop Personal Wellness Practice** - Half-marathon training, meditation, and yoga
3. **Master Italian Language** - Achieving conversational fluency through structured learning

### Weekly Plans (4 Weeks)
- October 28 - November 3
- November 4 - 10
- November 11 - 17
- November 18 - 24

### Progress Tracking
- **Check-in History**: 3 weekly check-ins with detailed reflections
- **Completed Items**: 25+ completed actions with dates
- **Progress Summary**: Current week overview and insights

## Using Demo Data

To run GoalWhisperer AI with demo data instead of your personal data:

```bash
DATA_DIR=./demo npm run dev
```

The app will load the demo data and you can explore all features without affecting your personal goals.

## Data Format

All data follows the markdown-based format used throughout GoalWhisperer AI:

- **Objectives**: Annual goals with Key Results (KRs) and progress tracking
- **Plans**: Weekly action items mapped to specific Key Results
- **Tracking**: Check-ins, completed items, and progress summaries

## Creating Your Own Data

You can use these demo files as templates for creating your own goals:

1. Copy the structure from `demo/objectives/annual-2025.md`
2. Modify objectives, KRs, and targets to match your goals
3. Create weekly plans in the `plans/` folder
4. Track progress through check-ins in the `tracking/` folder

## Notes

- All progress percentages and dates are realistic but fictional
- Demo data shows various KR states: complete, in-progress, at different completion levels
- Check-ins demonstrate the AI coach's analysis and insights features
