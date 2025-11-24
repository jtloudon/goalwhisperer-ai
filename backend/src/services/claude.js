import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  addObjective,
  addWeeklyPlan,
  addCompletion,
  updateKeyResultProgress,
  updateKeyResult,
  completeKeyResult,
  deleteObjective,
  deleteKeyResult,
  addKeyResultToObjective,
  addActionToWeeklyPlan,
  updateWeeklyPlan,
  deleteWeeklyPlan,
  removeActionsFromWeeklyPlan,
  updateActionInWeeklyPlan,
  addWin,
  saveCheckinSummary,
} from './writer.js';
import PATHS from '../config/paths.js';

// Get current file's directory for loading agent prompts
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lazy initialization of Anthropic client
function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// Define tools that Claude can use
const tools = [
  {
    name: 'add_objective',
    description: 'Add a new objective with key results to the annual objectives file. Use this when the user wants to create a new objective.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The objective title (brief, clear statement of the goal)',
        },
        description: {
          type: 'string',
          description: 'Detailed description of what this objective aims to achieve',
        },
        keyResults: {
          type: 'array',
          description: 'Array of 2-5 measurable key results that define success for this objective',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Key result title' },
              status: { type: 'string', enum: ['in-progress', 'complete'], description: 'Current status' },
              direction: { type: 'string', enum: ['increase', 'decrease'], description: 'Goal direction: "increase" for targets you grow toward (default), "decrease" for targets you reduce toward (e.g., weight loss, costs)' },
              baseline: { type: 'number', description: 'Starting value (REQUIRED for all KRs). For increase goals, this is typically 0. For decrease goals (e.g., weight loss from 230 to 220), baseline=230' },
              target: { type: 'number', description: 'Target value as a NUMBER (required for UI display). Examples: 10 for "10 items", 5 for "5 lbs", 3 for "3%". Never use strings like "N/A" or "3%".' },
              current: { type: 'number', description: 'Current progress value' },
              progress: { type: 'number', description: 'Progress percentage (0-100)' },
              targetDate: { type: 'string', description: 'Target completion date (YYYY-MM-DD)' },
            },
            required: ['title', 'baseline', 'target', 'targetDate'],
          },
        },
      },
      required: ['title', 'description', 'keyResults'],
    },
  },
  {
    name: 'add_weekly_plan',
    description: 'Create a NEW weekly plan with specific actions. ONLY use this when creating a brand new plan for a week that doesn\'t exist yet. If a plan already exists for that week, use update_weekly_plan instead.',
    input_schema: {
      type: 'object',
      properties: {
        weekStart: { type: 'string', description: 'Week start date (YYYY-MM-DD)' },
        weekEnd: { type: 'string', description: 'Week end date (YYYY-MM-DD)' },
        actions: {
          type: 'array',
          description: 'List of actions for the week',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Action title' },
              mapsTo: { type: 'string', description: 'Which KR this maps to (e.g., "KR 1.2")' },
              description: { type: 'string', description: 'Optional detailed description' },
            },
            required: ['title'],
          },
        },
      },
      required: ['weekStart', 'weekEnd', 'actions'],
    },
  },
  {
    name: 'add_action_to_weekly_plan',
    description: 'Add a SINGLE action to an existing weekly plan without removing existing actions. Use this when the user wants to ADD a new action/goal to an existing week. Examples: "add X to the plan for week of Oct 31", "also add Y to this week\'s goals".',
    input_schema: {
      type: 'object',
      properties: {
        weekStart: { type: 'string', description: 'Week start date (YYYY-MM-DD) of the plan to add to' },
        action: {
          type: 'object',
          description: 'Single action to add to the plan',
          properties: {
            title: { type: 'string', description: 'Action title' },
            mapsTo: { type: 'string', description: 'Which KR this maps to (e.g., "KR 1.2")' },
            description: { type: 'string', description: 'Optional detailed description' },
          },
          required: ['title'],
        },
      },
      required: ['weekStart', 'action'],
    },
  },
  {
    name: 'update_weekly_plan',
    description: 'REPLACE ALL actions in an existing weekly plan. WARNING: This deletes all existing actions and replaces them with the new list. ONLY use this when the user wants to completely rewrite or restructure the entire week\'s plan. For adding a single action, use add_action_to_weekly_plan instead.',
    input_schema: {
      type: 'object',
      properties: {
        weekStart: { type: 'string', description: 'Week start date (YYYY-MM-DD) of the plan to update' },
        weekEnd: { type: 'string', description: 'Optional: New week end date (YYYY-MM-DD)' },
        actions: {
          type: 'array',
          description: 'New list of actions (replaces all existing actions)',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Action title' },
              mapsTo: { type: 'string', description: 'Which KR this maps to (e.g., "KR 1.2")' },
              description: { type: 'string', description: 'Optional detailed description' },
            },
            required: ['title'],
          },
        },
      },
      required: ['weekStart', 'actions'],
    },
  },
  {
    name: 'update_progress',
    description: 'Update ONLY the current value and progress percentage on a key result. Use this when the user reports measurable progress (e.g., "I completed 3 more items" or "I\'m now at 50%"). DO NOT use this for changing titles, dates, or status.',
    input_schema: {
      type: 'object',
      properties: {
        krId: { type: 'string', description: 'Key result ID (e.g., "kr-1.2")' },
        current: { type: 'number', description: 'New current value' },
        progress: { type: 'number', description: 'New progress percentage (0-100)' },
      },
      required: ['krId'],
    },
  },
  {
    name: 'update_key_result',
    description: 'Update key result details including title, status, DIRECTION, baseline, target value, or target date. Use this when the user wants to CHANGE or MODIFY or UPDATE the title, description, wording, status, direction, target value, or due date of a key result. IMPORTANT: If the user changes a numeric value that appears in BOTH the title and target (e.g., "by 2%" → "by 3%"), you MUST update BOTH fields. Examples: "change the title", "update KR 1.2 to say...", "rename KR 1.3", "change the target date", "update kr 3.2 to target 3%" (must update both title and target), "change KR 2.1 to decrease direction".',
    input_schema: {
      type: 'object',
      properties: {
        krId: { type: 'string', description: 'Key result ID (e.g., "kr-1.2")' },
        title: { type: 'string', description: 'New title for the key result' },
        status: { type: 'string', enum: ['in-progress', 'complete'], description: 'New status' },
        direction: { type: 'string', enum: ['increase', 'decrease'], description: 'Goal direction: "increase" for targets you grow toward (default), "decrease" for targets you reduce toward (e.g., weight loss, costs, DEBT PAYDOWN). CRITICAL: Target=0 is VALID and REQUIRED for decrease goals like "pay off debt".' },
        baseline: { type: 'number', description: 'Starting value (REQUIRED for decrease goals). Example: if losing weight from 230 to 220, baseline=230. For paying off $30k debt, baseline=30000.' },
        target: { type: 'number', description: 'New target value as a NUMBER. Can be ANY number including 0. Examples: 10 for "10 items", 5 for "5 lbs", 3 for "3%", 0 for "pay off debt completely". CRITICAL: Target=0 is VALID for decrease goals.' },
        targetDate: { type: 'string', description: 'New target date (YYYY-MM-DD)' },
      },
      required: ['krId'],
    },
  },
  {
    name: 'complete_key_result',
    description: 'Mark a key result as complete. Use this when the user says to complete, finish, or mark a KR as done. This sets the status to "complete" regardless of the current progress percentage. Examples: "complete KR 3.1", "mark KR 2.2 as done", "finish all KRs for objective 3".',
    input_schema: {
      type: 'object',
      properties: {
        krId: { type: 'string', description: 'Key result ID (e.g., "kr-1.2")' },
        setProgressTo100: { type: 'boolean', description: 'Whether to also set progress to 100% (default: false)' },
      },
      required: ['krId'],
    },
  },
  {
    name: 'delete_objective',
    description: 'Delete an entire objective and all its key results. Use this when the user wants to remove or delete an objective. IMPORTANT: Use the objective NUMBER displayed in the UI (e.g., "3" for "Objective 3"), NOT the obj-X ID. Examples: user says "delete objective 2" → use objectiveNumber: "2".',
    input_schema: {
      type: 'object',
      properties: {
        objectiveNumber: { type: 'string', description: 'The objective number displayed in the markdown (e.g., "1", "2", "3") - this is what the user sees as "Objective N:"' },
      },
      required: ['objectiveNumber'],
    },
  },
  {
    name: 'delete_key_result',
    description: 'Delete a single key result from an objective. Use this when the user wants to remove or delete a specific key result. Accept flexible formats from user. Examples: user says "delete KR 1.2" → use krId: "1.2" or "kr-1.2".',
    input_schema: {
      type: 'object',
      properties: {
        krId: { type: 'string', description: 'Key result identifier in any format: "1.2", "kr-1.2", or "KR 1.2" - all work' },
      },
      required: ['krId'],
    },
  },
  {
    name: 'add_key_result_to_objective',
    description: 'Add a new key result to an existing objective. Use this when the user wants to add a KR to an objective that already exists. Examples: "add a new KR to objective 2: Launch beta by Dec 31", "add KR to objective 1".',
    input_schema: {
      type: 'object',
      properties: {
        objectiveNumber: { type: 'string', description: 'The objective number (e.g., "1", "2", "3")' },
        keyResult: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Key result title' },
            direction: { type: 'string', enum: ['increase', 'decrease'], description: 'Goal direction: "increase" for targets you grow toward (default), "decrease" for targets you reduce toward (e.g., weight loss, costs)' },
            baseline: { type: 'number', description: 'Starting value (REQUIRED for all KRs). For increase goals, this is typically 0. For decrease goals (e.g., weight loss from 230 to 220), baseline=230' },
            target: { type: 'number', description: 'Target value as a NUMBER (required for UI display). Examples: 10 for "10 items", 5 for "5 lbs", 3 for "3%". Never use strings like "N/A" or "3%".' },
            current: { type: 'number', description: 'Current progress value (default: 0)' },
            targetDate: { type: 'string', description: 'Target completion date (YYYY-MM-DD)' },
            status: { type: 'string', enum: ['in-progress', 'complete'], description: 'Status (default: in-progress)' },
          },
          required: ['title', 'baseline', 'target', 'targetDate'],
        },
      },
      required: ['objectiveNumber', 'keyResult'],
    },
  },
  {
    name: 'delete_weekly_plan',
    description: 'Delete a weekly plan. Use this when the user wants to remove or delete a weekly plan. Examples: "delete the plan for week of Nov 7", "remove weekly plan 2025-11-07".',
    input_schema: {
      type: 'object',
      properties: {
        weekStart: { type: 'string', description: 'Week start date (YYYY-MM-DD) of the plan to delete' },
      },
      required: ['weekStart'],
    },
  },
  {
    name: 'remove_actions_from_weekly_plan',
    description: 'Remove specific actions from a weekly plan by their action numbers. CRITICAL: You MUST call this tool when user asks to delete/remove/cancel actions - do NOT just acknowledge without calling the tool. Use this when the user wants to delete or remove specific actions from a week. Examples: "remove action 3 from this week" → MUST call tool with actionNumbers: [3], "delete actions 2 and 5 from week of Oct 31" → MUST call tool with actionNumbers: [2, 5], "I decided not to do action 2" → MUST call tool with actionNumbers: [2]. IMPORTANT: Action numbers are 1-indexed (first action is 1, not 0) and correspond to the order shown in the UI.',
    input_schema: {
      type: 'object',
      properties: {
        weekStart: { type: 'string', description: 'Week start date (YYYY-MM-DD) of the plan' },
        actionNumbers: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of action numbers to remove (1-indexed). Example: [2, 5] removes actions 2 and 5',
        },
      },
      required: ['weekStart', 'actionNumbers'],
    },
  },
  {
    name: 'update_action_in_weekly_plan',
    description: 'Update a specific action in a weekly plan. CRITICAL: You MUST call this tool when user asks to complete/mark done/close an action - do NOT just acknowledge without calling the tool. To mark complete: prepend "[DONE] " to the FULL original title. To mark incomplete: provide title WITHOUT [DONE] prefix. Examples: User says "complete action 2" (title is "Set up savings") → call with {weekStart: "2025-11-10", actionNumber: 2, updates: {title: "[DONE] Set up savings"}}. User says "uncheck action 1" → call with title without [DONE] prefix.',
    input_schema: {
      type: 'object',
      properties: {
        weekStart: { type: 'string', description: 'Week start date (YYYY-MM-DD) of the plan' },
        actionNumber: { type: 'number', description: 'Action number to update (1-indexed, matches what user sees in UI)' },
        updates: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'New action title. THREE USE CASES: (1) RETITLE/CHANGE: When user asks to "change title", "retitle", "rename", or "update action name", use the EXACT new title they specify. Example: "retitle to X" means title="X". (2) COMPLETE: To mark done, use "[DONE] " + existing title. Example: existing="Research banks" → "[DONE] Research banks". (3) UNCOMPLETE: Remove [DONE] prefix. CRITICAL: Do NOT use old title when user explicitly requests a new title!' },
            mapsTo: { type: 'string', description: 'Optional: New mapsTo value (e.g., "KR 1.2")' },
            description: { type: 'string', description: 'Optional: New description' },
          },
        },
      },
      required: ['weekStart', 'actionNumber', 'updates'],
    },
  },
  {
    name: 'add_win',
    description: 'Add a win to the Recent Wins section of the progress summary. Use this AUTOMATICALLY when: (1) A key result is completed, (2) Significant progress is made on a KR (e.g., 0% to 50% or 50% to 100%), (3) User reports completing a meaningful action or achievement, (4) User expresses celebration or positive sentiment about an accomplishment. Examples: User says "I finished KR 1.2!" - auto-add win; User says "Just shipped my first app" - auto-add win; User completes a major milestone - auto-add win. DO NOT ask for permission - add wins autonomously when detected.',
    input_schema: {
      type: 'object',
      properties: {
        winDescription: {
          type: 'string',
          description: 'Description of the win. Should be concise and clear. No emojis. Examples: "Completed KR 1.2: Build 3 full-stack projects", "Shipped first production app", "Received promotion to Director level"',
        },
      },
      required: ['winDescription'],
    },
  },
  {
    name: 'save_checkin_summary',
    description: 'MANDATORY: Save a summary of the weekly check-in to the check-in history. CRITICAL: You MUST call this tool at the END of EVERY weekly check-in conversation. This is NOT optional. After completing steps 1-3 of a check-in (completions, blockers, next week planning) and updating files, you MUST call this tool before saying goodbye to the user. Without this, the check-in history will not be saved and the user will lose their record of the conversation.',
    input_schema: {
      type: 'object',
      properties: {
        weekStart: { type: 'string', description: 'Week start date (YYYY-MM-DD)' },
        weekEnd: { type: 'string', description: 'Week end date (YYYY-MM-DD)' },
        completions: { type: 'string', description: 'Summary of what was completed this week' },
        updates: { type: 'string', description: 'Summary of what was updated (progress changes, blockers addressed, etc.)' },
        nextWeekFocus: { type: 'string', description: 'Summary of focus areas for next week' },
        insights: { type: 'string', description: 'Key insights, flags, or observations from the check-in' },
      },
      required: ['weekStart', 'weekEnd'],
    },
  },
];

// Execute tool calls
async function executeTool(toolName, toolInput) {
  try {
    switch (toolName) {
      case 'add_objective':
        return await addObjective(PATHS.objectives.annual, toolInput);

      case 'add_weekly_plan':
        return await addWeeklyPlan(PATHS.plans, toolInput);

      case 'add_action_to_weekly_plan':
        return await addActionToWeeklyPlan(PATHS.plans, toolInput.weekStart, toolInput.action);

      case 'update_weekly_plan':
        return await updateWeeklyPlan(PATHS.plans, toolInput.weekStart, {
          weekEnd: toolInput.weekEnd,
          actions: toolInput.actions,
        });

      case 'update_progress':
        return await updateKeyResultProgress(
          PATHS.objectives.annual,
          toolInput.krId,
          { current: toolInput.current, progress: toolInput.progress },
          PATHS.tracking.progress // Auto-add wins for major progress jumps
        );

      case 'update_key_result':
        return await updateKeyResult(
          PATHS.objectives.annual,
          toolInput.krId,
          {
            title: toolInput.title,
            status: toolInput.status,
            direction: toolInput.direction,
            baseline: toolInput.baseline,
            target: toolInput.target,
            targetDate: toolInput.targetDate,
          }
        );

      case 'complete_key_result':
        return await completeKeyResult(
          PATHS.objectives.annual,
          toolInput.krId,
          toolInput.setProgressTo100 || false,
          PATHS.tracking.progress // Auto-add wins
        );

      case 'delete_objective':
        // Pass the display number directly - the function will handle parsing
        return await deleteObjective(PATHS.objectives.annual, toolInput.objectiveNumber);

      case 'delete_key_result':
        return await deleteKeyResult(PATHS.objectives.annual, toolInput.krId);

      case 'add_key_result_to_objective':
        return await addKeyResultToObjective(
          PATHS.objectives.annual,
          toolInput.objectiveNumber,
          toolInput.keyResult
        );

      case 'delete_weekly_plan':
        return await deleteWeeklyPlan(PATHS.plans, toolInput.weekStart);

      case 'remove_actions_from_weekly_plan':
        return await removeActionsFromWeeklyPlan(
          PATHS.plans,
          toolInput.weekStart,
          toolInput.actionNumbers
        );

      case 'update_action_in_weekly_plan':
        return await updateActionInWeeklyPlan(
          PATHS.plans,
          toolInput.weekStart,
          toolInput.actionNumber,
          toolInput.updates,
          PATHS.tracking.progress, // Auto-add wins
          PATHS.tracking.completed // Auto-add completions
        );

      case 'add_win':
        return await addWin(PATHS.tracking.progress, toolInput.winDescription, 'claude-tool');

      case 'save_checkin_summary':
        return await saveCheckinSummary(PATHS.tracking.checkinHistory, toolInput);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Chat with Claude using conversation history with tool support
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} context - Optional context data (objectives, plans, etc.)
 * @returns {Promise<string>} Claude's response
 */
export async function chatWithClaude(messages, context = {}) {
  try {
    const anthropic = getAnthropicClient();

    // Build system prompt with context
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Load system prompt from file and inject dynamic values
    const promptPath = join(__dirname, '../agents/okr-coach/system-prompt.md');
    const promptTemplate = readFileSync(promptPath, 'utf-8');
    let systemPrompt = promptTemplate
      .replace('{{TODAY_FORMATTED}}', todayFormatted)
      .replace('{{TODAY}}', today);

    // Add context if provided
    if (context.objectives && context.objectives.length > 0) {
      systemPrompt += `\n\nCurrent Objectives:\n${JSON.stringify(context.objectives, null, 2)}`;
    }
    if (context.weeklyPlans && context.weeklyPlans.length > 0) {
      systemPrompt += `\n\nRecent Weekly Plans:\n${JSON.stringify(context.weeklyPlans, null, 2)}`;
    }
    if (context.completed && context.completed.length > 0) {
      systemPrompt += `\n\nCompleted Items:\n${JSON.stringify(context.completed, null, 2)}`;
    }
    if (context.wins && context.wins.length > 0) {
      systemPrompt += `\n\nExisting Wins (check for duplicates before adding new ones):\n${JSON.stringify(context.wins, null, 2)}`;
    }

    let currentMessages = [...messages];
    let finalResponse = '';

    // Tool use loop - keep calling Claude until we get a text response
    while (true) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: systemPrompt,
        tools: tools,
        messages: currentMessages,
      });

      // Check if Claude wants to use a tool
      if (response.stop_reason === 'tool_use') {
        // Find tool use blocks
        const toolUses = response.content.filter(block => block.type === 'tool_use');
        const textBlocks = response.content.filter(block => block.type === 'text');

        // Collect any text response
        if (textBlocks.length > 0) {
          finalResponse += textBlocks.map(b => b.text).join('\n');
        }

        // Add assistant's response to messages
        currentMessages.push({
          role: 'assistant',
          content: response.content,
        });

        // Execute tools and collect results
        const toolResults = [];
        for (const toolUse of toolUses) {
          console.log(`Executing tool: ${toolUse.name}`, toolUse.input);
          const result = await executeTool(toolUse.name, toolUse.input);

          // Log the result for debugging
          if (result.error) {
            console.log(`Tool ${toolUse.name} returned error:`, result.error);
          } else {
            console.log(`Tool ${toolUse.name} succeeded:`, result.message || result.success);
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        }

        // Add tool results to messages
        currentMessages.push({
          role: 'user',
          content: toolResults,
        });

        // Continue loop to get Claude's next response
      } else {
        // No more tool use, extract final text response
        const textBlocks = response.content.filter(block => block.type === 'text');
        finalResponse += textBlocks.map(b => b.text).join('\n');
        break;
      }
    }

    return finalResponse;
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Failed to get response from Claude: ${error.message}`);
  }
}

/**
 * Get a simple completion from Claude (for one-off questions)
 * @param {string} prompt - The user's question/prompt
 * @param {Object} context - Optional context data
 * @returns {Promise<string>} Claude's response
 */
export async function getCompletion(prompt, context = {}) {
  const messages = [{ role: 'user', content: prompt }];
  return chatWithClaude(messages, context);
}

/**
 * Generate a contextual greeting - always shows persistent action buttons
 * @param {boolean} hasObjectives - Whether user has objectives set up
 * @param {Object} context - Current objectives and progress data
 * @returns {Object} Greeting message with suggested actions
 */
export function generateGreeting(hasObjectives, context = {}) {
  // Always show persistent buttons - simpler and consistent UX
  const persistentActions = [
    { label: "My Progress", value: "status", type: "primary", description: "See current progress (<1 min)" },
    { label: "Weekly Check-in", value: "checkin", type: "primary", description: "Weekly check-in (10-15 min)" }
  ];

  if (!hasObjectives) {
    // First-time user - encourage setup but still show persistent buttons
    return {
      message: "Hi! I'm your AI OKR Coach.\n\nLooks like you're new here! I can help you set up a goal tracking system using the OKR (Objectives and Key Results) framework.\n\nI can help you:\n- Check your progress and see how you're tracking\n- Do a weekly check-in (review what's done, plan next week)\n- Update key results, mark actions complete, or adjust goals\n\nWhat would you like to do?",
      suggestedActions: persistentActions,
      isFirstTime: true
    };
  }

  // Returning user
  const { objectives = [] } = context;
  const totalObjectives = objectives.length;
  const overallProgress = objectives.length > 0
    ? Math.round(objectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) / objectives.length)
    : 0;

  return {
    message: `Hi! I'm your AI OKR Coach.\n\nYou have ${totalObjectives} active objective${totalObjectives !== 1 ? 's' : ''} (${overallProgress}% overall progress).\n\nI can help you:\n- Check your progress and see how you're tracking\n- Do a weekly check-in (review what's done, plan next week)\n- Update key results, mark actions complete, or adjust goals\n\nWhat would you like to do?`,
    suggestedActions: persistentActions,
    isFirstTime: false,
    context: {
      totalObjectives,
      overallProgress
    }
  };
}
