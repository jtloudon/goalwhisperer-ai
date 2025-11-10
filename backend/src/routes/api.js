import express from 'express';
import PATHS from '../config/paths.js';
import {
  parseAnnualObjectives,
  parseAllAnnualObjectives,
  parseProgressSummary,
  parseCompletedItems,
  parseWeeklyPlans,
  generateDashboardData,
  parseCheckinHistory,
} from '../services/parser.js';
import { chatWithClaude, generateGreeting } from '../services/claude.js';
import {
  addObjective,
  addWeeklyPlan,
  addCompletion,
  updateKeyResultProgress,
  updateActionInWeeklyPlan,
} from '../services/writer.js';

const router = express.Router();

/**
 * GET /api/objectives/annual
 * Returns parsed annual objectives (current and completed years)
 */
router.get('/objectives/annual', async (req, res) => {
  try {
    const result = await parseAllAnnualObjectives(PATHS.objectives.dir);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error parsing annual objectives:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tracking/progress
 * Returns current progress summary
 */
router.get('/tracking/progress', async (req, res) => {
  try {
    const progress = await parseProgressSummary(PATHS.tracking.progress, PATHS.plans);
    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('Error parsing progress summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tracking/completed
 * Returns completed items
 */
router.get('/tracking/completed', async (req, res) => {
  try {
    const completed = await parseCompletedItems(PATHS.tracking.completed);
    res.json({ success: true, data: completed });
  } catch (error) {
    console.error('Error parsing completed items:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/tracking/checkin-history
 * Returns check-in history
 */
router.get('/tracking/checkin-history', async (req, res) => {
  try {
    const history = await parseCheckinHistory(PATHS.tracking.checkinHistory);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error parsing check-in history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/plans
 * Returns all weekly plans with enriched objective/KR data
 */
router.get('/plans', async (req, res) => {
  try {
    const [plans, objectivesData] = await Promise.all([
      parseWeeklyPlans(PATHS.plans),
      parseAnnualObjectives(PATHS.objectives.annual),
    ]);

    // Extract objectives array from the result
    const objectives = objectivesData.objectives;

    // Enrich actions with objective and KR details
    for (const plan of plans) {
      for (const action of plan.actions) {
        if (action.objectiveId && action.krId) {
          // Find the objective
          const objective = objectives.find(obj => obj.id === action.objectiveId);
          if (objective) {
            action.objectiveTitle = objective.title;
            action.objectiveNumber = objective.number;

            // Find the KR
            const kr = objective.keyResults.find(kr => kr.id === action.krId);
            if (kr) {
              action.krTitle = kr.title;
              action.krNumber = kr.number;
            }
          }
        }
      }
    }

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Error parsing plans:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/dashboard
 * Returns aggregated dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [objectivesData, progressSummary, completedItems] = await Promise.all([
      parseAnnualObjectives(PATHS.objectives.annual),
      parseProgressSummary(PATHS.tracking.progress, PATHS.plans),
      parseCompletedItems(PATHS.tracking.completed),
    ]);

    // Extract objectives array from the result
    const objectives = objectivesData.objectives;

    const dashboard = await generateDashboardData(objectives, progressSummary, completedItems);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/claude/greeting
 * Get contextual greeting and suggested actions
 */
router.get('/claude/greeting', async (req, res) => {
  try {
    // Check if user has objectives
    const objectivesData = await parseAllAnnualObjectives(PATHS.objectives.dir).catch(() => null);
    const hasObjectives = objectivesData?.current?.objectives?.length > 0;

    const greeting = generateGreeting(hasObjectives, {
      objectives: objectivesData?.current?.objectives || []
    });

    res.json({
      success: true,
      data: greeting,
    });
  } catch (error) {
    console.error('Error generating greeting:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/claude/chat
 * Chat with Claude AI assistant
 * Body: { messages: [{role, content}], includeContext: boolean }
 */
router.post('/claude/chat', async (req, res) => {
  try {
    const { messages, includeContext = true } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: messages array required',
      });
    }

    // Gather context if requested
    let context = {};
    if (includeContext) {
      const [objectivesData, weeklyPlans, completed, dashboardData] = await Promise.all([
        parseAllAnnualObjectives(PATHS.objectives.dir).catch(() => null),
        parseWeeklyPlans(PATHS.plans).catch(() => []),
        parseCompletedItems(PATHS.tracking.completed).catch(() => []),
        generateDashboardData().catch(() => null),
      ]);

      context = {
        objectives: objectivesData?.current?.objectives || [],
        weeklyPlans: weeklyPlans.slice(0, 10), // Last 10 weeks
        completed: completed.slice(0, 5), // Recent completions
        wins: dashboardData?.wins || [], // Recent wins for duplicate detection
      };
    }

    const response = await chatWithClaude(messages, context);

    res.json({
      success: true,
      data: {
        message: response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in Claude chat:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/objectives/add
 * Add a new objective with key results
 * Body: { title, description, keyResults: [{title, status, target, current, progress, targetDate}] }
 */
router.post('/objectives/add', async (req, res) => {
  try {
    const { title, description, keyResults } = req.body;

    if (!title || !description || !keyResults || !Array.isArray(keyResults)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, keyResults',
      });
    }

    const result = await addObjective(PATHS.objectives.annual, {
      title,
      description,
      keyResults,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding objective:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plans/add
 * Add a weekly plan
 * Body: { weekStart, weekEnd, actions: [{title, mapsTo, description}] }
 */
router.post('/plans/add', async (req, res) => {
  try {
    const { weekStart, weekEnd, actions } = req.body;

    if (!weekStart || !weekEnd || !actions || !Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: weekStart, weekEnd, actions',
      });
    }

    const result = await addWeeklyPlan(PATHS.plans, {
      weekStart,
      weekEnd,
      actions,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding weekly plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/tracking/complete
 * Add a completion
 * Body: { objectiveId, krId, date, description }
 */
router.post('/tracking/complete', async (req, res) => {
  try {
    const { objectiveId, krId, date, description } = req.body;

    if (!objectiveId || !krId || !date || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: objectiveId, krId, date, description',
      });
    }

    const result = await addCompletion(PATHS.tracking.completed, {
      objectiveId,
      krId,
      date,
      description,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding completion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/objectives/update-progress
 * Update progress on a key result
 * Body: { krId, current, progress }
 */
router.post('/objectives/update-progress', async (req, res) => {
  try {
    const { krId, current, progress } = req.body;

    if (!krId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: krId',
      });
    }

    const result = await updateKeyResultProgress(
      PATHS.objectives.annual,
      krId,
      { current, progress }
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/plans/update-action
 * Update a specific action in a weekly plan
 * Body: { weekStart, actionNumber, updates: {title, mapsTo, description} }
 */
router.post('/plans/update-action', async (req, res) => {
  try {
    const { weekStart, actionNumber, updates } = req.body;

    if (!weekStart || !actionNumber || !updates) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: weekStart, actionNumber, updates',
      });
    }

    const result = await updateActionInWeeklyPlan(
      PATHS.plans,
      weekStart,
      actionNumber,
      updates
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating action in weekly plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() });
});

export default router;
