import fs from 'fs/promises';
import matter from 'gray-matter';
import { marked } from 'marked';

/**
 * Parse annual objectives file
 * Standard format: ## Objective N: Title with #### KR N.M: Title
 */
export async function parseAnnualObjectives(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  // Extract year from filename (e.g., annual-2025.md -> 2025)
  const yearMatch = filePath.match(/annual-(\d{4})\.md/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;

  const objectives = [];
  let currentObj = null;
  let currentKR = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Objective: ## Objective N: Title
    if (line.startsWith('## Objective ')) {
      if (currentObj) objectives.push(currentObj);

      const match = line.match(/## Objective (\d+): (.+)/);
      currentObj = {
        id: `obj-${match[1]}`,
        number: parseInt(match[1]),
        title: match[2],
        keyResults: [],
        progress: 0,
      };
      currentKR = null;
    }

    // Description: **Description**: text
    else if (line.startsWith('**Description**:')) {
      if (currentObj) {
        currentObj.description = line.replace('**Description**:', '').trim();
      }
    }

    // Objective Progress: **Progress**: X%
    else if (line.startsWith('**Progress**:') && currentObj && !currentKR) {
      const progressMatch = line.match(/Progress\*\*: (\d+)%/);
      if (progressMatch) {
        currentObj.progress = parseInt(progressMatch[1]);
      }
    }

    // Key Result: #### KR N.M: Title
    else if (line.match(/^#### KR \d+\.\d+:/)) {
      const krMatch = line.match(/#### KR (\d+)\.(\d+): (.+)/);
      if (krMatch && currentObj) {
        currentKR = {
          id: `kr-${krMatch[1]}.${krMatch[2]}`,
          number: `${krMatch[1]}.${krMatch[2]}`,
          title: krMatch[3],
          targetDate: null,
          status: 'in-progress',
          progress: 0,
          current: 0,
          target: 0,
        };
        currentObj.keyResults.push(currentKR);
      }
    }

    // KR Status: - **Status**: in-progress | complete
    else if (line.startsWith('- **Status**:') && currentKR) {
      const statusMatch = line.match(/Status\*\*: (.+)/);
      if (statusMatch) {
        currentKR.status = statusMatch[1].trim();
      }
    }

    // KR Target: - **Target**: numeric or text
    else if (line.startsWith('- **Target**:') && currentKR) {
      const targetMatch = line.match(/Target\*\*: (.+)/);
      if (targetMatch) {
        const val = targetMatch[1].trim();
        currentKR.target = isNaN(val) ? 0 : parseInt(val);
      }
    }

    // KR Current: - **Current**: numeric value
    else if (line.startsWith('- **Current**:') && currentKR) {
      const currentMatch = line.match(/Current\*\*: (.+)/);
      if (currentMatch) {
        currentKR.current = parseInt(currentMatch[1].trim()) || 0;
      }
    }

    // KR Progress: - **Progress**: X%
    else if (line.startsWith('- **Progress**:') && currentKR) {
      const progressMatch = line.match(/Progress\*\*: (\d+)%/);
      if (progressMatch) {
        currentKR.progress = parseInt(progressMatch[1]);
      }
    }

    // KR Target Date: - **Target Date**: YYYY-MM-DD
    else if (line.startsWith('- **Target Date**:') && currentKR) {
      const dateMatch = line.match(/Target Date\*\*: (.+)/);
      if (dateMatch) {
        currentKR.targetDate = dateMatch[1].trim();
      }
    }
  }

  // Push last objective
  if (currentObj) objectives.push(currentObj);

  return { objectives, year };
}

/**
 * Parse all annual objectives files
 */
export async function parseAllAnnualObjectives(objectivesDir) {
  const files = await fs.readdir(objectivesDir);
  const annualFiles = files.filter(f => f.match(/^annual-\d{4}\.md$/));

  const allYears = [];

  for (const file of annualFiles) {
    const filePath = `${objectivesDir}/${file}`;
    const result = await parseAnnualObjectives(filePath);
    allYears.push(result);
  }

  // Sort by year descending (newest first)
  allYears.sort((a, b) => b.year - a.year);

  // Determine current year and split into current vs completed
  const currentYear = new Date().getFullYear();
  const current = allYears.find(y => y.year === currentYear);
  const completed = allYears.filter(y => y.year < currentYear);

  return {
    current: current || null,
    completed: completed,
  };
}

/**
 * Parse progress summary file
 */
export async function parseProgressSummary(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  const summary = {
    week: 0,
    quarter: 4,
    year: 2025,
    generatedDate: null,
    overview: {},
    objectives: [],
    flags: [],
    wins: [],
  };

  // Extract week from title
  const titleMatch = content.match(/# Progress Summary - Week (\d+), Q(\d+) (\d+)/);
  if (titleMatch) {
    summary.week = parseInt(titleMatch[1]);
    summary.quarter = parseInt(titleMatch[2]);
    summary.year = parseInt(titleMatch[3]);
  }

  // Extract generated date
  const dateMatch = content.match(/\*Generated: (.+?)\*/);
  if (dateMatch) {
    summary.generatedDate = dateMatch[1];
  }

  // Extract overview stats
  const overallMatch = content.match(/Overall Progress\*\*: (\d+)%/);
  if (overallMatch) {
    summary.overview.overallProgress = parseInt(overallMatch[1]);
  }

  const onTrackMatch = content.match(/On Track\*\*: (\d+)/);
  if (onTrackMatch) {
    summary.overview.onTrack = parseInt(onTrackMatch[1]);
  }

  const atRiskMatch = content.match(/At Risk\*\*: (\d+)/);
  if (atRiskMatch) {
    summary.overview.atRisk = parseInt(atRiskMatch[1]);
  }

  // Extract wins
  const winsSection = content.match(/## Wins This Week 🎉\n\n([\s\S]+?)(\n\n##|\n\n---|\Z)/);
  if (winsSection) {
    const winLines = winsSection[1].split('\n');
    summary.wins = winLines
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());
  }

  return summary;
}

/**
 * Parse completed items file
 */
export async function parseCompletedItems(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  const objectives = [];
  let currentObj = null;
  let currentKR = null;

  for (const line of lines) {
    // New objective
    if (line.startsWith('## Objective ')) {
      if (currentObj) objectives.push(currentObj);

      const match = line.match(/## Objective (\d+): (.+)/);
      currentObj = {
        id: `obj-${match[1]}`,
        title: match[2],
        keyResults: [],
      };
    }

    // New KR
    else if (line.startsWith('### KR ')) {
      const krMatch = line.match(/### KR (\d+\.\d+): (.+)/);
      if (krMatch && currentObj) {
        currentKR = {
          id: `kr-${krMatch[1]}`,
          title: krMatch[2],
          completions: [],
        };
        currentObj.keyResults.push(currentKR);
      }
    }

    // Completion entry
    else if (line.match(/^- \[\d{4}-\d{2}-\d{2}\]/) && currentKR) {
      const completionMatch = line.match(/- \[(\d{4}-\d{2}-\d{2})\] (✓|⚠️|🔄) (.+)/);
      if (completionMatch) {
        currentKR.completions.push({
          date: completionMatch[1],
          status: completionMatch[2],
          description: completionMatch[3],
        });
      }
    }
  }

  // Push last objective
  if (currentObj) objectives.push(currentObj);

  return objectives;
}

/**
 * Parse all weekly plans
 * Standard format: plan-YYYY-MM-DD.md with date-based identification
 */
export async function parseWeeklyPlans(plansDir) {
  const files = await fs.readdir(plansDir);
  const planFiles = files.filter(f => f.match(/plan-\d{4}-\d{2}-\d{2}\.md/));

  const plans = [];

  for (const file of planFiles) {
    const content = await fs.readFile(`${plansDir}/${file}`, 'utf-8');
    const lines = content.split('\n');

    const plan = {
      file,
      dateRange: '',
      actions: [],
    };

    // Extract date range from title: # Weekly Plan: YYYY-MM-DD to YYYY-MM-DD
    const titleMatch = content.match(/# Weekly Plan: (.+?) to (.+)/);
    if (titleMatch) {
      plan.dateRange = `${titleMatch[1]} to ${titleMatch[2]}`;
    }

    // Parse actions: ## Title format
    let i = 0;
    // Skip header line
    while (i < lines.length && !lines[i].startsWith('## ')) i++;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('## ')) {
        const title = line.replace('## ', '').trim();
        const action = {
          title,
          mapsTo: null,
          objectiveId: null,
          krId: null,
        };

        // Look ahead for Maps to field
        i++;
        while (i < lines.length && !lines[i].startsWith('## ')) {
          const contentLine = lines[i];

          const mapsToMatch = contentLine.match(/\*\*Maps to\*\*:\s*(.+)/);
          if (mapsToMatch) {
            action.mapsTo = mapsToMatch[1].trim();

            // Extract KR reference (e.g., "KR 1.2")
            const krMatch = action.mapsTo.match(/KR (\d+)\.(\d+)/);
            if (krMatch) {
              action.objectiveId = `obj-${krMatch[1]}`;
              action.krId = `kr-${krMatch[1]}.${krMatch[2]}`;
            }
          }

          i++;
        }

        plan.actions.push(action);
      } else {
        i++;
      }
    }

    plans.push(plan);
  }

  // Sort by date descending (newest first)
  plans.sort((a, b) => b.dateRange.localeCompare(a.dateRange));

  return plans;
}

/**
 * Generate dashboard data
 */
export async function generateDashboardData(objectives, progressSummary, completedItems) {
  const dashboard = {
    overview: {
      totalObjectives: objectives.length,
      overallProgress: progressSummary.overview.overallProgress || 0,
      onTrack: progressSummary.overview.onTrack || 0,
      atRisk: progressSummary.overview.atRisk || 0,
      currentWeek: progressSummary.week,
      currentQuarter: progressSummary.quarter,
    },
    objectives: objectives.map(obj => ({
      id: obj.id,
      title: obj.title,
      progress: obj.progress,
      status: obj.progress >= 90 ? 'ahead' : obj.progress >= 70 ? 'on-track' : obj.progress >= 40 ? 'at-risk' : 'blocked',
      keyResults: obj.keyResults,
    })),
    recentCompletions: [],
    wins: progressSummary.wins || [],
  };

  // Extract last 5 completions across all KRs
  const allCompletions = [];
  for (const obj of completedItems) {
    for (const kr of obj.keyResults) {
      for (const completion of kr.completions) {
        allCompletions.push({
          ...completion,
          objectiveId: obj.id,
          krId: kr.id,
          krTitle: kr.title,
        });
      }
    }
  }

  // Sort by date desc and take last 5
  allCompletions.sort((a, b) => new Date(b.date) - new Date(a.date));
  dashboard.recentCompletions = allCompletions.slice(0, 5);

  return dashboard;
}

export default {
  parseAnnualObjectives,
  parseAllAnnualObjectives,
  parseProgressSummary,
  parseCompletedItems,
  parseWeeklyPlans,
  generateDashboardData,
};
