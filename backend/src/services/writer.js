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
    // Read existing file or create new one
    let content;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist - create it with header
        const year = new Date().getFullYear();
        content = `# ${year} Annual Objectives\n\nTrack your annual goals and key results.\n\n`;
        // Ensure directory exists
        const path = await import('path');
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      } else {
        throw error;
      }
    }
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

    // Validate that all key results have numeric targets
    for (const kr of objective.keyResults) {
      if (typeof kr.target !== 'number' || kr.target <= 0) {
        throw new Error(`Key result "${kr.title}" must have a numeric target value greater than 0 (got: ${kr.target}). The UI requires numeric targets to display progress.`);
      }
    }

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
      const direction = kr.direction || 'increase';
      // Default baseline to 0 if not provided (for increase goals)
      const baseline = kr.baseline !== undefined && kr.baseline !== null ? kr.baseline : 0;
      newContent += `#### KR ${newObjId}.${krNum}: ${kr.title}\n`;
      newContent += `- **Status**: ${status}\n`;
      newContent += `- **Direction**: ${direction}\n`;
      newContent += `- **Baseline**: ${baseline}\n`;
      newContent += `- **Target**: ${kr.target}\n`;
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
    // Ensure directory exists
    await fs.mkdir(plansDir, { recursive: true });

    const fileName = `${plansDir}/plan-${plan.weekStart}.md`;

    // Check if file already exists
    try {
      await fs.access(fileName);
      // File exists - return error telling AI to use update instead
      throw new Error(`A weekly plan for ${plan.weekStart} already exists. Use update_weekly_plan instead of add_weekly_plan to modify it.`);
    } catch (err) {
      // File doesn't exist, continue with creation
      if (err.message.includes('already exists')) {
        throw err; // Re-throw our custom error
      }
      // ENOENT is expected when file doesn't exist
    }

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
    // Read existing file or create new one
    let content;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist - create it with header
        content = `# Completed Items\n\nTrack completed tasks and milestones.\n\n`;
        // Ensure directory exists
        const path = await import('path');
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      } else {
        throw error;
      }
    }

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
 * @param {string} progressFilePath - Optional: Path to progress summary file for auto-adding wins
 * @returns {Promise<Object>} Result with success status
 */
export async function updateKeyResultProgress(filePath, krId, updates, progressFilePath = null) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');

    // Convert krId format (kr-1.2) to markdown format (KR 1.2)
    const idMatch = krId.match(/kr-(\d+)\.(\d+)/);
    if (!idMatch) {
      throw new Error(`Invalid KR ID format: ${krId}`);
    }
    const markdownKrId = `KR ${idMatch[1]}.${idMatch[2]}`;

    // Get current progress to detect major jumps
    let oldProgress = 0;
    const progressMatch = content.match(new RegExp(`#### ${markdownKrId}:.*?- \\*\\*Progress\\*\\*: (\\d+)%`, 's'));
    if (progressMatch) {
      oldProgress = parseInt(progressMatch[1]);
    }

    // Extract KR title for win tracking
    const titleRegex = new RegExp(`#### ${markdownKrId}: (.+?)\\n`);
    const titleMatch = content.match(titleRegex);
    const krTitle = titleMatch ? titleMatch[1] : 'Key Result';

    // Update current value
    if (updates.current !== undefined) {
      const currentRegex = new RegExp(`(#### ${markdownKrId}:.*?- \\*\\*Current\\*\\*: )(\\d+)`, 's');
      content = content.replace(currentRegex, `$1${updates.current}`);
    }

    // Update progress
    if (updates.progress !== undefined) {
      const progressRegex = new RegExp(`(#### ${markdownKrId}:.*?- \\*\\*Progress\\*\\*: )(\\d+)%`, 's');
      content = content.replace(progressRegex, `$1${updates.progress}%`);
    }

    await fs.writeFile(filePath, content);

    // Auto-add win for major progress jumps (25% or more increase)
    let autoWinAdded = false;
    if (progressFilePath && updates.progress !== undefined) {
      const progressJump = updates.progress - oldProgress;
      const hitsMilestone =
        (oldProgress < 25 && updates.progress >= 25) ||
        (oldProgress < 50 && updates.progress >= 50) ||
        (oldProgress < 75 && updates.progress >= 75) ||
        (oldProgress < 100 && updates.progress >= 100);

      if (progressJump >= 25 || hitsMilestone) {
        try {
          await addWin(progressFilePath, `${markdownKrId}: ${krTitle} reached ${updates.progress}%`);
          autoWinAdded = true;
        } catch (winError) {
          console.warn('Failed to auto-add win for progress jump:', winError.message);
        }
      }
    }

    return {
      success: true,
      message: `Successfully updated progress for ${krId}`,
      autoWinAdded,
    };
  } catch (error) {
    console.error('Error updating KR progress:', error);
    throw new Error(`Failed to update KR progress: ${error.message}`);
  }
}

/**
 * Update key result details (title, target date, status, etc.)
 * @param {string} filePath - Path to the annual objectives markdown file
 * @param {string} krId - Key result ID (e.g., "kr-1.1")
 * @param {Object} updates - Updates to apply
 * @param {string} updates.title - New KR title
 * @param {string} updates.targetDate - New target date
 * @param {string} updates.status - New status (in-progress, complete)
 * @param {number} updates.target - New target value
 * @returns {Promise<Object>} Result with success status
 */
export async function updateKeyResult(filePath, krId, updates) {
  try {
    // Validate target if provided
    if (updates.target !== undefined) {
      if (typeof updates.target !== 'number' || updates.target <= 0) {
        throw new Error(`Target must be a numeric value greater than 0 (got: ${updates.target}). The UI requires numeric targets to display progress. Please provide a number like 5 for "5 lbs" or 3 for "3%".`);
      }
    }

    let content = await fs.readFile(filePath, 'utf-8');

    // Convert krId format (kr-1.2) to markdown format (KR 1.2)
    // Extract numbers from kr-X.Y format
    const idMatch = krId.match(/kr-(\d+)\.(\d+)/);
    if (!idMatch) {
      throw new Error(`Invalid KR ID format: ${krId}`);
    }
    const markdownKrId = `KR ${idMatch[1]}.${idMatch[2]}`;

    // Update title
    if (updates.title !== undefined) {
      const titleRegex = new RegExp(`(#### ${markdownKrId}: )([^\n]+)`);
      content = content.replace(titleRegex, `$1${updates.title}`);
    }

    // Update status
    if (updates.status !== undefined) {
      const status = updates.status === 'complete' ? 'complete' : 'in-progress';
      const statusRegex = new RegExp(`(#### ${markdownKrId}:.*?- \\*\\*Status\\*\\*: )(.+?)\\n`, 's');
      content = content.replace(statusRegex, `$1${status}\n`);
    }

    // Update direction
    if (updates.direction !== undefined) {
      const direction = updates.direction === 'decrease' ? 'decrease' : 'increase';
      const directionRegex = new RegExp(`(#### ${markdownKrId}:.*?- \\*\\*Direction\\*\\*: )(.+?)\\n`, 's');
      content = content.replace(directionRegex, `$1${direction}\n`);
    }

    // Update baseline
    if (updates.baseline !== undefined) {
      const baselineRegex = new RegExp(`(#### ${markdownKrId}:.*?- \\*\\*Baseline\\*\\*: )(.+?)\\n`, 's');
      if (baselineRegex.test(content)) {
        // Baseline field exists, update it
        content = content.replace(baselineRegex, `$1${updates.baseline}\n`);
      } else {
        // Baseline field doesn't exist, add it after Direction
        const directionRegex = new RegExp(`(#### ${markdownKrId}:.*?- \\*\\*Direction\\*\\*: .+?\\n)`, 's');
        content = content.replace(directionRegex, `$1- **Baseline**: ${updates.baseline}\n`);
      }
    }

    // Update target
    if (updates.target !== undefined) {
      const targetRegex = new RegExp(`(#### ${markdownKrId}:.*?- \\*\\*Target\\*\\*: )(.+?)\\n`, 's');
      content = content.replace(targetRegex, `$1${updates.target}\n`);
    }

    // Update target date
    if (updates.targetDate !== undefined) {
      const dateRegex = new RegExp(`(#### ${markdownKrId}:.*?- \\*\\*Target Date\\*\\*: )(.+?)\\n`, 's');
      content = content.replace(dateRegex, `$1${updates.targetDate}\n`);
    }

    await fs.writeFile(filePath, content);

    return {
      success: true,
      message: `Successfully updated ${krId}`,
    };
  } catch (error) {
    console.error('Error updating KR:', error);
    throw new Error(`Failed to update KR: ${error.message}`);
  }
}

/**
 * Complete a key result (mark as complete regardless of progress %)
 * @param {string} filePath - Path to the annual objectives markdown file
 * @param {string} krId - Key result ID (e.g., "kr-1.2")
 * @param {boolean} setProgressTo100 - Optional: set progress to 100% when completing (default: false)
 * @param {string} progressFilePath - Optional: Path to progress summary file for auto-adding wins
 * @returns {Promise<Object>} Result with success status
 */
export async function completeKeyResult(filePath, krId, setProgressTo100 = false, progressFilePath = null) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');

    // Convert krId format (kr-1.2) to markdown format (KR 1.2)
    const idMatch = krId.match(/kr-(\d+)\.(\d+)/);
    if (!idMatch) {
      throw new Error(`Invalid KR ID format: ${krId}`);
    }
    const markdownKrId = `KR ${idMatch[1]}.${idMatch[2]}`;

    // Extract KR title for win tracking
    const titleRegex = new RegExp(`#### ${markdownKrId}: (.+?)\\n`);
    const titleMatch = content.match(titleRegex);
    const krTitle = titleMatch ? titleMatch[1] : 'Key Result';

    // Extract target value to set Current = Target when completing
    const targetRegex = new RegExp(`#### ${markdownKrId}:.*?- \\*\\*Target\\*\\*: (\\d+(?:\\.\\d+)?)`, 's');
    const targetMatch = content.match(targetRegex);
    const targetValue = targetMatch ? parseFloat(targetMatch[1]) : null;

    // Update status to complete
    const statusRegex = new RegExp(`(#### ${markdownKrId}:.*?- \\*\\*Status\\*\\*: )(.+?)\\n`, 's');
    content = content.replace(statusRegex, `$1complete\n`);

    // Set Current = Target (if target exists)
    if (targetValue !== null) {
      const currentRegex = new RegExp(`(#### ${markdownKrId}:.*?- \\*\\*Current\\*\\*: )([\\d.]+)`, 's');
      content = content.replace(currentRegex, `$1${targetValue}`);
    }

    // Optionally set progress to 100%
    if (setProgressTo100) {
      const progressRegex = new RegExp(`(#### ${markdownKrId}:.*?- \\*\\*Progress\\*\\*: )(\\d+)%`, 's');
      content = content.replace(progressRegex, `$1100%`);
    }

    await fs.writeFile(filePath, content);

    // Auto-add win if progress file path provided
    if (progressFilePath) {
      try {
        await addWin(progressFilePath, `Completed ${markdownKrId}: ${krTitle}`);
      } catch (winError) {
        console.warn('Failed to auto-add win:', winError.message);
        // Don't fail the entire operation if win tracking fails
      }
    }

    return {
      success: true,
      message: `Successfully completed ${markdownKrId}`,
      autoWinAdded: !!progressFilePath,
    };
  } catch (error) {
    console.error('Error completing KR:', error);
    throw new Error(`Failed to complete KR: ${error.message}`);
  }
}

/**
 * Delete an entire objective and all its key results
 * @param {string} filePath - Path to the annual objectives markdown file
 * @param {string} objectiveNumber - Objective display number (e.g., "1", "2", "3") - this is the number shown in the markdown "Objective N:"
 * @returns {Promise<Object>} Result with success status
 */
export async function deleteObjective(filePath, objectiveNumber) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');

    // Extract just the number - accept "1", "obj-1", or "Objective 1"
    let objNumber;
    if (objectiveNumber.match(/^\d+$/)) {
      // Already just a number like "1"
      objNumber = objectiveNumber;
    } else if (objectiveNumber.match(/^obj-(\d+)$/)) {
      // Format like "obj-1"
      objNumber = objectiveNumber.match(/^obj-(\d+)$/)[1];
    } else if (objectiveNumber.match(/^objective\s+(\d+)$/i)) {
      // Format like "Objective 1"
      objNumber = objectiveNumber.match(/^objective\s+(\d+)$/i)[1];
    } else {
      throw new Error(`Invalid objective format: ${objectiveNumber}. Use format like "1", "obj-1", or "Objective 1"`);
    }

    // Find the objective section to delete by its DISPLAY number
    // Pattern: ## Objective N: ... up to next ## Objective or end of file
    const objectiveRegex = new RegExp(
      `## Objective ${objNumber}:.*?(?=\\n## Objective \\d+:|$)`,
      's'
    );

    const match = content.match(objectiveRegex);
    if (!match) {
      throw new Error(`Objective ${objNumber} not found in the markdown`);
    }

    // Remove the objective section
    content = content.replace(objectiveRegex, '');

    // Clean up any extra blank lines
    content = content.replace(/\n{3,}/g, '\n\n');

    await fs.writeFile(filePath, content);

    return {
      success: true,
      message: `Successfully deleted Objective ${objNumber}`,
    };
  } catch (error) {
    console.error('Error deleting objective:', error);
    throw new Error(`Failed to delete objective: ${error.message}`);
  }
}

/**
 * Delete a single key result from an objective
 * @param {string} filePath - Path to the annual objectives markdown file
 * @param {string} krId - Key result identifier (e.g., "1.2", "kr-1.2", or "KR 1.2")
 * @returns {Promise<Object>} Result with success status
 */
export async function deleteKeyResult(filePath, krId) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');

    // Normalize KR ID format - accept "1.2", "kr-1.2", or "KR 1.2"
    let objNum, krNum;

    if (krId.match(/^(\d+)\.(\d+)$/)) {
      // Format like "1.2"
      const match = krId.match(/^(\d+)\.(\d+)$/);
      objNum = match[1];
      krNum = match[2];
    } else if (krId.match(/^kr-(\d+)\.(\d+)$/i)) {
      // Format like "kr-1.2" or "KR-1.2"
      const match = krId.match(/^kr-(\d+)\.(\d+)$/i);
      objNum = match[1];
      krNum = match[2];
    } else if (krId.match(/^kr\s+(\d+)\.(\d+)$/i)) {
      // Format like "KR 1.2"
      const match = krId.match(/^kr\s+(\d+)\.(\d+)$/i);
      objNum = match[1];
      krNum = match[2];
    } else {
      throw new Error(`Invalid KR format: ${krId}. Use format like "1.2", "kr-1.2", or "KR 1.2"`);
    }

    const markdownKrId = `KR ${objNum}.${krNum}`;

    // Find the KR section to delete
    // Pattern: #### KR X.Y: ... up to next #### or ## or end
    const krRegex = new RegExp(
      `#### ${markdownKrId}:.*?(?=\\n####|\\n##|$)`,
      's'
    );

    const match = content.match(krRegex);
    if (!match) {
      throw new Error(`${markdownKrId} not found in the markdown`);
    }

    // Remove the KR section
    content = content.replace(krRegex, '');

    // Clean up any extra blank lines
    content = content.replace(/\n{3,}/g, '\n\n');

    await fs.writeFile(filePath, content);

    return {
      success: true,
      message: `Successfully deleted ${markdownKrId}`,
    };
  } catch (error) {
    console.error('Error deleting KR:', error);
    throw new Error(`Failed to delete KR: ${error.message}`);
  }
}

/**
 * Add a new key result to an existing objective
 * @param {string} filePath - Path to the annual objectives markdown file
 * @param {string} objectiveNumber - The objective number (e.g., "1", "2", "3")
 * @param {Object} keyResult - Key result data
 * @param {string} keyResult.title - KR title
 * @param {string} keyResult.target - Target value or description
 * @param {number} keyResult.current - Current progress value (default: 0)
 * @param {string} keyResult.targetDate - Target completion date (YYYY-MM-DD)
 * @param {string} keyResult.status - Status: "in-progress" or "complete" (default: "in-progress")
 * @returns {Promise<Object>} Result with success status and new KR ID
 */
export async function addKeyResultToObjective(filePath, objectiveNumber, keyResult) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Find the objective section
    const objectivePattern = new RegExp(`^## Objective ${objectiveNumber}:`);
    let objectiveIndex = -1;
    let nextObjectiveIndex = lines.length;

    for (let i = 0; i < lines.length; i++) {
      if (objectivePattern.test(lines[i])) {
        objectiveIndex = i;
      } else if (objectiveIndex !== -1 && /^## Objective \d+:/.test(lines[i])) {
        nextObjectiveIndex = i;
        break;
      }
    }

    if (objectiveIndex === -1) {
      throw new Error(`Objective ${objectiveNumber} not found`);
    }

    // Count existing KRs to determine next KR number
    let maxKrNum = 0;
    for (let i = objectiveIndex; i < nextObjectiveIndex; i++) {
      const match = lines[i].match(new RegExp(`^#### KR ${objectiveNumber}\\.(\\d+):`));
      if (match) {
        maxKrNum = Math.max(maxKrNum, parseInt(match[1]));
      }
    }

    const newKrNum = maxKrNum + 1;
    const newKrId = `${objectiveNumber}.${newKrNum}`;

    // Validate that target is numeric
    if (typeof keyResult.target !== 'number' || keyResult.target <= 0) {
      throw new Error(`Key result "${keyResult.title}" must have a numeric target value greater than 0 (got: ${keyResult.target}). The UI requires numeric targets to display progress.`);
    }

    // Find insertion point (after last KR or after "### Key Results" header)
    let insertIndex = nextObjectiveIndex;
    for (let i = nextObjectiveIndex - 1; i > objectiveIndex; i--) {
      if (lines[i].trim().startsWith('####') || lines[i].trim() === '### Key Results') {
        insertIndex = i + 1;
        // Skip past the KR content to find the blank line after it
        while (insertIndex < nextObjectiveIndex && lines[insertIndex].trim() !== '') {
          insertIndex++;
        }
        break;
      }
    }

    // Build new KR markdown
    const status = keyResult.status === 'complete' ? 'complete' : 'in-progress';
    const direction = keyResult.direction || 'increase';
    const current = keyResult.current || 0;
    const target = keyResult.target;
    // Default baseline to 0 if not provided (for increase goals)
    const baseline = keyResult.baseline !== undefined && keyResult.baseline !== null ? keyResult.baseline : 0;
    const progress = Math.min(100, Math.round((current / target) * 100));

    const newKrLines = [
      '',
      `#### KR ${newKrId}: ${keyResult.title}`,
      `- **Status**: ${status}`,
      `- **Direction**: ${direction}`,
      `- **Baseline**: ${baseline}`,
      `- **Target**: ${target}`,
      `- **Current**: ${current}`,
      `- **Progress**: ${progress}%`,
      `- **Target Date**: ${keyResult.targetDate}`,
      ''
    ];

    // Insert the new KR
    lines.splice(insertIndex, 0, ...newKrLines);

    await fs.writeFile(filePath, lines.join('\n'));

    return {
      success: true,
      krId: `kr-${newKrId}`,
      message: `Successfully added KR ${newKrId} to Objective ${objectiveNumber}`,
    };
  } catch (error) {
    console.error('Error adding KR to objective:', error);
    throw new Error(`Failed to add KR to objective: ${error.message}`);
  }
}

/**
 * Add a single action to an existing weekly plan
 * @param {string} plansDir - Path to the plans directory
 * @param {string} weekStart - Week start date (YYYY-MM-DD) to identify the plan
 * @param {Object} action - Action to add
 * @param {string} action.title - Action title
 * @param {string} action.mapsTo - Optional: Which KR this maps to
 * @param {string} action.description - Optional: Detailed description
 * @returns {Promise<Object>} Result with success status
 */
export async function addActionToWeeklyPlan(plansDir, weekStart, action) {
  try {
    const fileName = `${plansDir}/plan-${weekStart}.md`;

    // Check if file exists
    try {
      await fs.access(fileName);
    } catch {
      throw new Error(`Weekly plan for ${weekStart} not found`);
    }

    // Read existing file
    const content = await fs.readFile(fileName, 'utf-8');

    // Build new action markdown
    let newAction = `\n## ${action.title}\n\n`;
    if (action.mapsTo) {
      newAction += `**Maps to**: ${action.mapsTo}\n\n`;
    }
    if (action.description) {
      newAction += `${action.description}\n\n`;
    }

    // Append new action to existing content
    const updatedContent = content + newAction;

    // Write updated file
    await fs.writeFile(fileName, updatedContent);

    return {
      success: true,
      fileName,
      message: `Successfully added action to weekly plan for ${weekStart}`,
    };
  } catch (error) {
    console.error('Error adding action to weekly plan:', error);
    throw new Error(`Failed to add action to weekly plan: ${error.message}`);
  }
}

/**
 * Update an existing weekly plan (replaces all actions)
 * @param {string} plansDir - Path to the plans directory
 * @param {string} weekStart - Week start date (YYYY-MM-DD) to identify the plan
 * @param {Object} updates - Updated plan data
 * @param {string} updates.weekEnd - Optional new week end date
 * @param {Array} updates.actions - Optional new actions array (replaces all existing actions)
 * @returns {Promise<Object>} Result with success status
 */
export async function updateWeeklyPlan(plansDir, weekStart, updates) {
  try {
    const fileName = `${plansDir}/plan-${weekStart}.md`;

    // Check if file exists
    try {
      await fs.access(fileName);
    } catch {
      throw new Error(`Weekly plan for ${weekStart} not found`);
    }

    // Read existing file to get current data
    const content = await fs.readFile(fileName, 'utf-8');
    const titleMatch = content.match(/# Weekly Plan: (.+?) to (.+)/);

    const currentWeekEnd = titleMatch ? titleMatch[2] : null;
    const weekEnd = updates.weekEnd || currentWeekEnd;

    // Build updated plan markdown
    let newContent = `# Weekly Plan: ${weekStart} to ${weekEnd}\n\n`;

    if (updates.actions && Array.isArray(updates.actions)) {
      updates.actions.forEach((action) => {
        newContent += `## ${action.title}\n\n`;
        if (action.mapsTo) {
          newContent += `**Maps to**: ${action.mapsTo}\n\n`;
        }
        if (action.description) {
          newContent += `${action.description}\n\n`;
        }
      });
    } else {
      throw new Error('Actions array is required for update');
    }

    // Write updated file
    await fs.writeFile(fileName, newContent);

    return {
      success: true,
      fileName,
      message: `Successfully updated weekly plan for ${weekStart}`,
    };
  } catch (error) {
    console.error('Error updating weekly plan:', error);
    throw new Error(`Failed to update weekly plan: ${error.message}`);
  }
}

/**
 * Delete a weekly plan file
 * @param {string} plansDir - Path to the plans directory
 * @param {string} weekStart - Week start date (YYYY-MM-DD) of the plan to delete
 * @returns {Promise<Object>} Result with success status
 */
export async function deleteWeeklyPlan(plansDir, weekStart) {
  try {
    const fileName = `${plansDir}/plan-${weekStart}.md`;

    // Check if file exists
    try {
      await fs.access(fileName);
    } catch {
      throw new Error(`Weekly plan for ${weekStart} not found`);
    }

    await fs.unlink(fileName);

    return {
      success: true,
      message: `Successfully deleted weekly plan for ${weekStart}`,
    };
  } catch (error) {
    console.error('Error deleting weekly plan:', error);
    throw new Error(`Failed to delete weekly plan: ${error.message}`);
  }
}

/**
 * Remove specific actions from a weekly plan by action numbers
 * @param {string} plansDir - Path to the plans directory
 * @param {string} weekStart - Week start date (YYYY-MM-DD)
 * @param {Array<number>} actionNumbers - Array of action numbers to remove (1-indexed)
 * @returns {Promise<Object>} Result with success status
 */
export async function removeActionsFromWeeklyPlan(plansDir, weekStart, actionNumbers) {
  try {
    const fileName = `${plansDir}/plan-${weekStart}.md`;

    // Check if file exists
    try {
      await fs.access(fileName);
    } catch {
      throw new Error(`Weekly plan for ${weekStart} not found`);
    }

    // Read existing file
    const content = await fs.readFile(fileName, 'utf-8');
    const lines = content.split('\n');

    // Parse actions (sections starting with ##)
    const actions = [];
    let currentAction = null;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        // New action starts
        if (currentAction) {
          actions.push(currentAction);
        }
        currentAction = { lines: [line] };
      } else if (currentAction) {
        // Part of current action
        currentAction.lines.push(line);
      }
    }

    // Push last action
    if (currentAction) {
      actions.push(currentAction);
    }

    // Remove specified actions (convert to 0-indexed)
    const actionsToKeep = actions.filter((_, index) =>
      !actionNumbers.includes(index + 1)
    );

    if (actionsToKeep.length === actions.length) {
      return {
        success: false,
        message: `No actions were removed. Action numbers may be invalid: ${actionNumbers.join(', ')}`,
      };
    }

    // Extract header (first line before any ## actions)
    const headerLines = [];
    for (const line of lines) {
      if (line.startsWith('## ')) break;
      headerLines.push(line);
    }

    // Rebuild content
    let newContent = headerLines.join('\n') + '\n';
    actionsToKeep.forEach(action => {
      newContent += action.lines.join('\n') + '\n';
    });

    // Write updated file
    await fs.writeFile(fileName, newContent.trim() + '\n');

    const removedCount = actions.length - actionsToKeep.length;
    return {
      success: true,
      fileName,
      removedCount,
      message: `Successfully removed ${removedCount} action(s) from weekly plan for ${weekStart}`,
    };
  } catch (error) {
    console.error('Error removing actions from weekly plan:', error);
    throw new Error(`Failed to remove actions from weekly plan: ${error.message}`);
  }
}

/**
 * Update a specific action in a weekly plan
 * @param {string} plansDir - Path to the plans directory
 * @param {string} weekStart - Week start date (YYYY-MM-DD)
 * @param {number} actionNumber - Action number to update (1-indexed)
 * @param {Object} updates - Fields to update
 * @param {string} updates.title - Optional: New title
 * @param {string} updates.mapsTo - Optional: New mapsTo value
 * @param {string} updates.description - Optional: New description
 * @param {string} progressFilePath - Optional: Path to progress summary file for auto-adding wins
 * @param {string} completedItemsPath - Optional: Path to completed items file for tracking completions
 * @returns {Promise<Object>} Result with success status
 */
export async function updateActionInWeeklyPlan(plansDir, weekStart, actionNumber, updates, progressFilePath = null, completedItemsPath = null) {
  try {
    const fileName = `${plansDir}/plan-${weekStart}.md`;

    // Check if file exists
    try {
      await fs.access(fileName);
    } catch {
      throw new Error(`Weekly plan for ${weekStart} not found`);
    }

    // Read existing file
    const content = await fs.readFile(fileName, 'utf-8');
    const lines = content.split('\n');

    // Parse actions (sections starting with ##)
    const actions = [];
    let currentAction = null;
    let actionStartLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('## ')) {
        // New action starts
        if (currentAction) {
          actions.push({ ...currentAction, endLine: i - 1 });
        }
        currentAction = {
          startLine: i,
          titleLine: i,
          mapsToLine: -1,
          descriptionStart: -1,
          descriptionEnd: -1,
          lines: [line]
        };
        actionStartLine = i;
      } else if (currentAction) {
        // Part of current action
        if (line.startsWith('**Maps to**:')) {
          currentAction.mapsToLine = i;
        } else if (currentAction.mapsToLine !== -1 && line.trim() !== '' && !line.startsWith('**')) {
          // Description content
          if (currentAction.descriptionStart === -1) {
            currentAction.descriptionStart = i;
          }
          currentAction.descriptionEnd = i;
        }
        currentAction.lines.push(line);
      }
    }

    // Push last action
    if (currentAction) {
      actions.push({ ...currentAction, endLine: lines.length - 1 });
    }

    // Validate action number
    if (actionNumber < 1 || actionNumber > actions.length) {
      throw new Error(`Invalid action number: ${actionNumber}. Valid range: 1-${actions.length}`);
    }

    const action = actions[actionNumber - 1];

    // Get original title to check if we're adding [DONE]
    const originalTitle = lines[action.titleLine].replace(/^## /, '');
    const wasNotDone = !originalTitle.startsWith('✅ ') && !originalTitle.startsWith('[DONE] ');

    // Apply updates
    if (updates.title) {
      // Simply use the title as provided - if agent wants checkmark, it's in the title
      lines[action.titleLine] = `## ${updates.title}`;
    }

    if (updates.mapsTo !== undefined) {
      if (action.mapsToLine !== -1) {
        // Update existing mapsTo line
        if (updates.mapsTo === null || updates.mapsTo === '') {
          // Remove mapsTo line
          lines.splice(action.mapsToLine, 2); // Remove mapsTo and blank line
        } else {
          lines[action.mapsToLine] = `**Maps to**: ${updates.mapsTo}`;
        }
      } else if (updates.mapsTo) {
        // Add new mapsTo line after title
        lines.splice(action.titleLine + 1, 0, '', `**Maps to**: ${updates.mapsTo}`);
      }
    }

    if (updates.description !== undefined) {
      // Remove old description if exists
      if (action.descriptionStart !== -1) {
        const deleteCount = action.descriptionEnd - action.descriptionStart + 1;
        lines.splice(action.descriptionStart, deleteCount);
      }

      // Add new description if provided
      if (updates.description) {
        const insertPoint = action.mapsToLine !== -1 ? action.mapsToLine + 2 : action.titleLine + 2;
        lines.splice(insertPoint, 0, '', updates.description);
      }
    }

    // Write updated file
    await fs.writeFile(fileName, lines.join('\n'));

    // Auto-add win and completion if marking action as done
    let autoWinAdded = false;
    let autoCompletionAdded = false;
    if (updates.title && wasNotDone) {
      const newTitle = updates.title;
      const isNowDone = newTitle.startsWith('✅ ') || newTitle.startsWith('[DONE] ');

      if (isNowDone) {
        const cleanTitle = newTitle.replace(/^(✅ |\[DONE\] )/, '');

        // Add win to progress summary
        if (progressFilePath) {
          try {
            await addWin(progressFilePath, cleanTitle);
            autoWinAdded = true;
          } catch (winError) {
            console.warn('Failed to auto-add win:', winError.message);
          }
        }

        // Add to completed items if action maps to a KR
        if (completedItemsPath && action.mapsToLine !== -1) {
          try {
            const mapsToLine = lines[action.mapsToLine];
            const krMatch = mapsToLine.match(/KR (\d+\.\d+)/);
            if (krMatch) {
              const krId = `kr-${krMatch[1]}`;
              const today = new Date().toISOString().split('T')[0];
              await addCompletion(completedItemsPath, {
                krId,
                date: today,
                description: cleanTitle,
              });
              autoCompletionAdded = true;
            }
          } catch (completionError) {
            console.warn('Failed to auto-add completion:', completionError.message);
          }
        }
      }
    }

    return {
      success: true,
      fileName,
      actionNumber,
      message: `Successfully updated action ${actionNumber} in weekly plan for ${weekStart}`,
      autoWinAdded,
      autoCompletionAdded,
    };
  } catch (error) {
    console.error('Error updating action in weekly plan:', error);
    throw new Error(`Failed to update action in weekly plan: ${error.message}`);
  }
}

/**
 * Add a win to the progress summary file with date stamp
 * @param {string} filePath - Path to the progress summary markdown file
 * @param {string} winDescription - Description of the win to add
 * @returns {Promise<Object>} Result with success status
 */
export async function addWin(filePath, winDescription) {
  try {
    // Read existing file or create new one
    let content;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist - create it with basic structure
        const week = new Date();
        const weekStr = week.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        content = `# Weekly Progress Summary\n\n## Week of ${weekStr}\n\n### Overview\nTracking progress on your objectives and key results.\n\n## Wins This Week 🎉\n\n`;
        // Ensure directory exists
        const path = await import('path');
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
      } else {
        throw error;
      }
    }

    // Find the "Wins This Week" section
    const winsHeaderRegex = /## Wins This Week 🎉/;
    const winsHeaderMatch = content.match(winsHeaderRegex);

    if (!winsHeaderMatch) {
      throw new Error('Could not find "## Wins This Week 🎉" section in progress summary');
    }

    // Find the position right after the header and blank line
    const headerIndex = content.indexOf(winsHeaderMatch[0]);
    const afterHeaderIndex = headerIndex + winsHeaderMatch[0].length;

    // Find the next line after the header (skip the blank line)
    let insertIndex = afterHeaderIndex;
    while (insertIndex < content.length && content[insertIndex] === '\n') {
      insertIndex++;
    }

    // Generate date stamp in YYYY-MM-DD format
    const now = new Date();
    const dateStamp = now.toISOString().split('T')[0];

    // Check for duplicate wins with same date
    // Normalize both strings for comparison (lowercase, remove punctuation)
    const normalizeText = (text) => text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const normalizedNewWin = normalizeText(winDescription);

    // Extract existing wins for today
    const winPattern = /^- (.+?) \[(\d{4}-\d{2}-\d{2})\]/gm;
    let match;
    const todaysWins = [];
    while ((match = winPattern.exec(content)) !== null) {
      if (match[2] === dateStamp) {
        todaysWins.push(normalizeText(match[1]));
      }
    }

    // Check if this win already exists today
    if (todaysWins.some(existingWin => existingWin === normalizedNewWin)) {
      return {
        success: true,
        message: `Win already exists for today: "${winDescription}"`,
        duplicate: true,
      };
    }

    // Build the new win entry with date stamp at the end
    const winEntry = `- ${winDescription} [${dateStamp}]\n`;

    // Insert the win at the top of the wins list
    content = content.slice(0, insertIndex) + winEntry + content.slice(insertIndex);

    // Write back to file
    await fs.writeFile(filePath, content);

    return {
      success: true,
      message: `Successfully added win: "${winDescription}" with date ${dateStamp}`,
    };
  } catch (error) {
    console.error('Error adding win:', error);
    throw new Error(`Failed to add win: ${error.message}`);
  }
}

/**
 * Save a check-in summary to the check-in history file
 * @param {string} filePath - Path to the check-in history markdown file
 * @param {Object} summary - Check-in summary data
 * @param {string} summary.weekStart - Week start date (YYYY-MM-DD)
 * @param {string} summary.weekEnd - Week end date (YYYY-MM-DD)
 * @param {string} summary.completions - What was completed this week
 * @param {string} summary.updates - What was updated (progress, blockers, adjustments)
 * @param {string} summary.nextWeekFocus - Focus areas for next week
 * @param {string} summary.insights - Key insights or flags from the AI
 * @returns {Promise<Object>} Result with success status
 */
export async function saveCheckinSummary(filePath, summary) {
  try {
    // Ensure directory exists
    const path = await import('path');
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Check if file exists, create if not
    let content = '';
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (err) {
      // File doesn't exist, create header
      content = '# Check-in History\n\n';
    }

    // Generate date stamp
    const now = new Date();
    const dateStamp = now.toISOString().split('T')[0];
    const timeStamp = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Build check-in entry
    let entry = `## Check-in: ${summary.weekStart} to ${summary.weekEnd}\n`;
    entry += `**Date**: ${dateStamp} at ${timeStamp}\n\n`;

    if (summary.completions) {
      entry += `### What Was Completed\n${summary.completions}\n\n`;
    }

    if (summary.updates) {
      entry += `### Updates Made\n${summary.updates}\n\n`;
    }

    if (summary.nextWeekFocus) {
      entry += `### Next Week Focus\n${summary.nextWeekFocus}\n\n`;
    }

    if (summary.insights) {
      entry += `### Insights\n${summary.insights}\n\n`;
    }

    entry += '---\n\n';

    // Prepend new entry (most recent first)
    const headerEndIndex = content.indexOf('\n\n') + 2;
    content = content.slice(0, headerEndIndex) + entry + content.slice(headerEndIndex);

    // Write to file
    await fs.writeFile(filePath, content);

    return {
      success: true,
      message: `Successfully saved check-in summary for week ${summary.weekStart}`,
    };
  } catch (error) {
    console.error('Error saving check-in summary:', error);
    throw new Error(`Failed to save check-in summary: ${error.message}`);
  }
}
