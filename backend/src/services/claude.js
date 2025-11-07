import Anthropic from '@anthropic-ai/sdk';
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
} from './writer.js';
import PATHS from '../config/paths.js';

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
              target: { type: 'number', description: 'Target value as a NUMBER (required for UI display). Examples: 10 for "10 items", 5 for "5 lbs", 3 for "3%". Never use strings like "N/A" or "3%".' },
              current: { type: 'number', description: 'Current progress value' },
              progress: { type: 'number', description: 'Progress percentage (0-100)' },
              targetDate: { type: 'string', description: 'Target completion date (YYYY-MM-DD)' },
            },
            required: ['title', 'target', 'targetDate'],
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
    description: 'Update key result details including title, status, target value, or target date. Use this when the user wants to CHANGE or MODIFY or UPDATE the title, description, wording, status, target value, or due date of a key result. IMPORTANT: If the user changes a numeric value that appears in BOTH the title and target (e.g., "by 2%" → "by 3%"), you MUST update BOTH fields. Examples: "change the title", "update KR 1.2 to say...", "rename KR 1.3", "change the target date", "update kr 3.2 to target 3%" (must update both title and target).',
    input_schema: {
      type: 'object',
      properties: {
        krId: { type: 'string', description: 'Key result ID (e.g., "kr-1.2")' },
        title: { type: 'string', description: 'New title for the key result' },
        status: { type: 'string', enum: ['in-progress', 'complete'], description: 'New status' },
        target: { type: 'number', description: 'New target value as a NUMBER (required for UI display). Examples: 10 for "10 items", 5 for "5 lbs", 3 for "3%".' },
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
            target: { type: 'number', description: 'Target value as a NUMBER (required for UI display). Examples: 10 for "10 items", 5 for "5 lbs", 3 for "3%". Never use strings like "N/A" or "3%".' },
            current: { type: 'number', description: 'Current progress value (default: 0)' },
            targetDate: { type: 'string', description: 'Target completion date (YYYY-MM-DD)' },
            status: { type: 'string', enum: ['in-progress', 'complete'], description: 'Status (default: in-progress)' },
          },
          required: ['title', 'target', 'targetDate'],
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
    description: 'Remove specific actions from a weekly plan by their action numbers. Use this when the user wants to delete or remove specific actions from a week. Examples: "remove action 3 from this week", "delete actions 2 and 5 from week of Oct 31". IMPORTANT: Action numbers are 1-indexed (first action is 1, not 0) and correspond to the order shown in the UI.',
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
    description: 'Update a specific action in a weekly plan (change title, mapsTo, or description). Use this when the user wants to modify an existing action. Examples: "change action 2 in week of Nov 7 to map to KR 1.2", "update action 3 title to...", "change what action 1 maps to".',
    input_schema: {
      type: 'object',
      properties: {
        weekStart: { type: 'string', description: 'Week start date (YYYY-MM-DD) of the plan' },
        actionNumber: { type: 'number', description: 'Action number to update (1-indexed)' },
        updates: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Optional: New title for the action' },
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
    description: 'Add a win to the Recent Wins section of the progress summary. Use this AUTOMATICALLY when: (1) A key result is completed, (2) Significant progress is made on a KR (e.g., 0% → 50% or 50% → 100%), (3) User reports completing a meaningful action or achievement, (4) User expresses celebration or positive sentiment about an accomplishment. Examples: User says "I finished KR 1.2!" → auto-add win; User says "Just shipped my first app" → auto-add win; User completes a major milestone → auto-add win. DO NOT ask for permission - add wins autonomously when detected.',
    input_schema: {
      type: 'object',
      properties: {
        winDescription: {
          type: 'string',
          description: 'Description of the win. Should be concise and celebratory. Can include emojis (✅, 🏆, 🎉) to emphasize significance. Examples: "✅ Completed KR 1.2: Build 3 full-stack projects", "🏆 Shipped first production app", "✅ Received promotion to Director level"',
        },
      },
      required: ['winDescription'],
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
          { current: toolInput.current, progress: toolInput.progress }
        );

      case 'update_key_result':
        return await updateKeyResult(
          PATHS.objectives.annual,
          toolInput.krId,
          {
            title: toolInput.title,
            status: toolInput.status,
            target: toolInput.target,
            targetDate: toolInput.targetDate,
          }
        );

      case 'complete_key_result':
        return await completeKeyResult(
          PATHS.objectives.annual,
          toolInput.krId,
          toolInput.setProgressTo100 || false
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
          toolInput.updates
        );

      case 'add_win':
        return await addWin(PATHS.tracking.progress, toolInput.winDescription);

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
    let systemPrompt = `You are an AI assistant helping the user manage their goals and objectives using the OKR (Objectives and Key Results) framework.

You help users:
- Think critically about their objectives and how to measure success
- Break down large goals into measurable key results
- Plan weekly actions that align with their objectives
- Analyze progress and provide insights
- Coach them on effective goal-setting strategies

AVAILABLE TOOLS - You have these tools to modify the user's goal files:

OBJECTIVES & KEY RESULTS:
- add_objective: Create new objective with key results
- add_key_result_to_objective: Add new KR to existing objective
- update_key_result: Change KR title, status, target, or date
- update_progress: Update KR current value and progress percentage
- complete_key_result: Mark a KR as complete
- delete_objective: Remove entire objective by number (e.g., "Objective 3")
- delete_key_result: Remove specific KR by ID (e.g., "KR 1.2")

WEEKLY PLANS:
- add_weekly_plan: Create NEW weekly plan (only if week doesn't exist)
- add_action_to_weekly_plan: Add ONE action to existing plan
- update_action_in_weekly_plan: Change action title/mapsTo/description
- remove_actions_from_weekly_plan: Remove specific actions by numbers (e.g., [6, 7])
- update_weekly_plan: Replace ALL actions (destructive - use cautiously)
- delete_weekly_plan: Delete entire weekly plan

WINS TRACKING:
- add_win: Add wins to Recent Wins section (use AUTOMATICALLY - no permission needed)

CRITICAL RULES FOR TOOL USAGE:
1. You MUST actually invoke tools when the user requests changes - simply saying "I've done it" is NEVER acceptable
2. ALWAYS wait for tool result confirmation before responding to the user
3. NEVER tell the user you've made a change unless you actually called a tool and received a success response
4. Action numbers are 1-indexed (first action = 1) matching what the user sees in the UI
5. When user says "remove action 6 and 7" → call remove_actions_from_weekly_plan with actionNumbers: [6, 7]
6. To add a single action to existing plan → use add_action_to_weekly_plan (NOT update_weekly_plan)
7. Only use update_weekly_plan when user wants to completely rewrite all actions for a week
8. ALL KEY RESULTS MUST have numeric 'target' values (not "N/A" or strings like "3%") - the UI requires this to display progress
9. When user wants to change a target value that's embedded in the KR title (e.g., "by 2%" → "by 3%"), you MUST update BOTH the title AND the target field

WIN DETECTION & AUTONOMOUS TRACKING:
You should AUTOMATICALLY call add_win (without asking permission) when you detect:
1. **KR Completion**: Anytime complete_key_result is called → add win celebrating the completion
2. **Major Progress Jumps**: When progress goes from 0% → 50%+, or 50% → 100%
3. **Significant Achievements**: User reports completing meaningful actions, shipping features, or reaching milestones
4. **Celebratory Language**: User uses words like "finished", "completed", "shipped", "achieved", "done", or celebration emojis (🎉, 🏆, ✅)
5. **External Recognition**: Promotions, awards, positive feedback, new opportunities

Format wins concisely with appropriate emojis:
- ✅ for completions and checkoffs
- 🏆 for major achievements and milestones
- 🎉 for celebrations and successes
- Keep descriptions brief but specific

Be concise, actionable, and supportive. Ask clarifying questions when needed.`;

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
