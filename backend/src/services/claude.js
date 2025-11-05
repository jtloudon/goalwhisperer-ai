import Anthropic from '@anthropic-ai/sdk';
import {
  addObjective,
  addWeeklyPlan,
  addCompletion,
  updateKeyResultProgress,
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
    description: 'Create a weekly plan with specific actions. Use this when the user wants to plan their week.',
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
    name: 'update_progress',
    description: 'Update progress on a key result. Use this when the user reports progress or completion of work.',
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
];

// Execute tool calls
async function executeTool(toolName, toolInput) {
  try {
    switch (toolName) {
      case 'add_objective':
        return await addObjective(PATHS.objectives.annual, toolInput);

      case 'add_weekly_plan':
        return await addWeeklyPlan(PATHS.plans, toolInput);

      case 'update_progress':
        return await updateKeyResultProgress(
          PATHS.objectives.annual,
          toolInput.krId,
          { current: toolInput.current, progress: toolInput.progress }
        );

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
