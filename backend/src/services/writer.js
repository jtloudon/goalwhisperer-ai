import fs from 'fs/promises';

/**
 * Add a new objective with key results to the annual objectives file
 * @param {string} filePath - Path to the annual objectives markdown file
 * @param {Object} objective - Objective data
 * @param {string} objective.title - Objective title
 * @param {string} objective.description - Objective description
 * @param {Array} objective.keyResults - Array of key result objects
 * @returns {Promise<Object>} Result with success status and new objective ID
 */
export async function addObjective(filePath, objective) {
  try {
    // Read existing file
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Find the highest objective ID
    let maxId = 0;
    for (const line of lines) {
      const match = line.match(/^## Objective (\d+):/);
      if (match) {
        maxId = Math.max(maxId, parseInt(match[1]));
      }
    }

    const newObjId = maxId + 1;
    const newObjIdStr = `obj-${newObjId}`;

    // Build new objective markdown
    let newContent = `\n## Objective ${newObjId}: ${objective.title}\n\n`;
    newContent += `**Description**: ${objective.description}\n\n`;
    newContent += `**Progress**: 0%\n\n`;
    newContent += `### Key Results\n\n`;

    // Add key results
    objective.keyResults.forEach((kr, index) => {
      const krNum = index + 1;
      // Normalize status to valid values
      const status = kr.status === 'complete' ? 'complete' : 'in-progress';
      newContent += `#### KR ${newObjId}.${krNum}: ${kr.title}\n`;
      newContent += `- **Status**: ${status}\n`;
      newContent += `- **Target**: ${kr.target || 'N/A'}\n`;
      newContent += `- **Current**: ${kr.current || 0}\n`;
      newContent += `- **Progress**: ${kr.progress || 0}%\n`;
      newContent += `- **Target Date**: ${kr.targetDate}\n\n`;
    });

    // Append to file
    await fs.appendFile(filePath, newContent);

    return {
      success: true,
      objectiveId: newObjIdStr,
      message: `Successfully added Objective ${newObjId} with ${objective.keyResults.length} key results`,
    };
  } catch (error) {
    console.error('Error adding objective:', error);
    throw new Error(`Failed to add objective: ${error.message}`);
  }
}

/**
 * Add a weekly plan to the plans directory
 * @param {string} plansDir - Path to the plans directory
 * @param {Object} plan - Plan data
 * @param {string} plan.weekStart - Week start date (YYYY-MM-DD)
 * @param {string} plan.weekEnd - Week end date (YYYY-MM-DD)
 * @param {Array} plan.actions - Array of action objects
 * @returns {Promise<Object>} Result with success status
 */
export async function addWeeklyPlan(plansDir, plan) {
  try {
    const fileName = `${plansDir}/plan-${plan.weekStart}.md`;

    // Build plan markdown
    let content = `# Weekly Plan: ${plan.weekStart} to ${plan.weekEnd}\n\n`;

    plan.actions.forEach((action) => {
      content += `## ${action.title}\n\n`;
      if (action.mapsTo) {
        content += `**Maps to**: ${action.mapsTo}\n\n`;
      }
      if (action.description) {
        content += `${action.description}\n\n`;
      }
    });

    // Write file
    await fs.writeFile(fileName, content);

    return {
      success: true,
      fileName,
      message: `Successfully created weekly plan for ${plan.weekStart}`,
    };
  } catch (error) {
    console.error('Error adding weekly plan:', error);
    throw new Error(`Failed to add weekly plan: ${error.message}`);
  }
}

/**
 * Add a completion to the completed items file
 * @param {string} filePath - Path to the completed items markdown file
 * @param {Object} completion - Completion data
 * @param {string} completion.objectiveId - Objective ID (e.g., "obj-1")
 * @param {string} completion.krId - Key result ID (e.g., "kr-1.1")
 * @param {string} completion.date - Completion date (YYYY-MM-DD)
 * @param {string} completion.description - What was completed
 * @returns {Promise<Object>} Result with success status
 */
export async function addCompletion(filePath, completion) {
  try {
    // Read existing file
    let content = await fs.readFile(filePath, 'utf-8');

    // Find the KR section or create it
    const krSectionRegex = new RegExp(`### ${completion.krId}:.*?\\n`, 'i');

    // Build completion entry
    const completionEntry = `- **${completion.date}** ✅ ${completion.description}\n`;

    if (krSectionRegex.test(content)) {
      // Add to existing KR section
      const insertIndex = content.search(krSectionRegex);
      const nextLineIndex = content.indexOf('\n', insertIndex) + 1;
      content = content.slice(0, nextLineIndex) + completionEntry + content.slice(nextLineIndex);
    } else {
      // Need to create the KR section - append to end
      content += `\n### ${completion.krId}: Key Result\n${completionEntry}\n`;
    }

    // Write back
    await fs.writeFile(filePath, content);

    return {
      success: true,
      message: `Successfully added completion for ${completion.krId}`,
    };
  } catch (error) {
    console.error('Error adding completion:', error);
    throw new Error(`Failed to add completion: ${error.message}`);
  }
}

/**
 * Update progress on a key result
 * @param {string} filePath - Path to the annual objectives markdown file
 * @param {string} krId - Key result ID (e.g., "kr-1.1")
 * @param {Object} updates - Updates to apply
 * @param {number} updates.current - New current value
 * @param {number} updates.progress - New progress percentage
 * @returns {Promise<Object>} Result with success status
 */
export async function updateKeyResultProgress(filePath, krId, updates) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');

    // Update current value
    if (updates.current !== undefined) {
      const currentRegex = new RegExp(`(#### ${krId}:.*?- \\*\\*Current\\*\\*: )(\\d+)`, 's');
      content = content.replace(currentRegex, `$1${updates.current}`);
    }

    // Update progress
    if (updates.progress !== undefined) {
      const progressRegex = new RegExp(`(#### ${krId}:.*?- \\*\\*Progress\\*\\*: )(\\d+)%`, 's');
      content = content.replace(progressRegex, `$1${updates.progress}%`);
    }

    await fs.writeFile(filePath, content);

    return {
      success: true,
      message: `Successfully updated progress for ${krId}`,
    };
  } catch (error) {
    console.error('Error updating KR progress:', error);
    throw new Error(`Failed to update KR progress: ${error.message}`);
  }
}
