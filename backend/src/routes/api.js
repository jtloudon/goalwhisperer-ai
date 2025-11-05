import express from 'express';
import PATHS from '../config/paths.js';
import {
  parseAnnualObjectives,
  parseAllAnnualObjectives,
  parseProgressSummary,
  parseCompletedItems,
  parseWeeklyPlans,
  generateDashboardData,
} from '../services/parser.js';
import { chatWithClaude } from '../services/claude.js';

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
    const progress = await parseProgressSummary(PATHS.tracking.progress);
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

            // Find the KR
            const kr = objective.keyResults.find(kr => kr.id === action.krId);
            if (kr) {
              action.krTitle = kr.title;
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
      parseProgressSummary(PATHS.tracking.progress),
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
      const [objectivesData, weeklyPlans, completed] = await Promise.all([
        parseAllAnnualObjectives(PATHS.objectives.dir).catch(() => null),
        parseWeeklyPlans(PATHS.plans).catch(() => []),
        parseCompletedItems(PATHS.tracking.completed).catch(() => []),
      ]);

      context = {
        objectives: objectivesData?.current?.objectives || [],
        weeklyPlans: weeklyPlans.slice(0, 3), // Last 3 weeks
        completed: completed.slice(0, 5), // Recent completions
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
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() });
});

export default router;
