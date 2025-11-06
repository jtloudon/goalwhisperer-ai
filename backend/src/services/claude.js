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
  addActionToWeeklyPlan,
  updateWeeklyPlan,
  deleteWeeklyPlan,
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
              target: { type: 'string', description: 'Target value or description' },
              current: { type: 'number', description: 'Current progress value' },
              progress: { type: 'number', description: 'Progress percentage (0-100)' },
              targetDate: { type: 'string', description: 'Target completion date (YYYY-MM-DD)' },
            },
            required: ['title', 'targetDate'],
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
    description: 'Update key result details including title, status, target value, or target date. Use this when the user wants to CHANGE or MODIFY or UPDATE the title, description, wording, status, target value, or due date of a key result. Examples: "change the title", "update KR 1.2 to say...", "rename KR 1.3", "change the target date".',
    input_schema: {
      type: 'object',
      properties: {
        krId: { type: 'string', description: 'Key result ID (e.g., "kr-1.2")' },
        title: { type: 'string', description: 'New title for the key result' },
        status: { type: 'string', enum: ['in-progress', 'complete'], description: 'New status' },
        target: { type: 'string', description: 'New target value or description' },
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

      case 'delete_weekly_plan':
        return await deleteWeeklyPlan(PATHS.plans, toolInput.weekStart);

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

You have the ability to update the user's goal files directly using tools. When the user asks you to create objectives, add plans, or update progress, use the appropriate tool.

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
        model: 'claude-3-haiku-20240307',
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
