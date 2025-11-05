import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization of Anthropic client
function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

/**
 * Chat with Claude using conversation history
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

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    return response.content[0].text;
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
