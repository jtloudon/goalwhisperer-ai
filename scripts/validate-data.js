#!/usr/bin/env node

/**
 * GoalWhisperer AI - Data Validation Tool
 * Checks markdown files for common issues
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const errors = [];
const warnings = [];
const info = [];

function addError(file, message) {
  errors.push({ file, message });
}

function addWarning(file, message) {
  warnings.push({ file, message });
}

function addInfo(file, message) {
  info.push({ file, message });
}

async function validate() {
  print('\n╔════════════════════════════════════════╗', 'cyan');
  print('║   GoalWhisperer AI - Data Validator   ║', 'cyan');
  print('╚════════════════════════════════════════╝\n', 'cyan');

  const dataDir = process.env.DATA_DIR || './personal';
  const fullPath = path.resolve(dataDir);

  if (!fs.existsSync(fullPath)) {
    print(`❌ Data directory not found: ${dataDir}`, 'red');
    print('   Run "npm run dev" and the app will guide you through creating your first goal.\n', 'yellow');
    process.exit(1);
  }

  print(`📂 Validating data in: ${dataDir}\n`, 'bright');

  // Validate structure
  validateStructure(fullPath);

  // Validate objectives
  await validateObjectives(path.join(fullPath, 'objectives'));

  // Validate plans
  await validatePlans(path.join(fullPath, 'plans'));

  // Validate tracking
  await validateTracking(path.join(fullPath, 'tracking'));

  // Print results
  printResults();
}

function validateStructure(dataDir) {
  const requiredDirs = ['objectives', 'plans', 'tracking'];

  requiredDirs.forEach(dir => {
    const dirPath = path.join(dataDir, dir);
    if (!fs.existsSync(dirPath)) {
      addError('structure', `Missing required directory: ${dir}/`);
    } else {
      addInfo('structure', `✓ Found ${dir}/ directory`);
    }
  });
}

async function validateObjectives(objDir) {
  if (!fs.existsSync(objDir)) return;

  const files = fs.readdirSync(objDir).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    addWarning('objectives', 'No objective files found');
    return;
  }

  files.forEach(file => {
    const filePath = path.join(objDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for objectives
    const objectives = content.match(/^## Objective \d+:/gm);
    if (!objectives || objectives.length === 0) {
      addError(file, 'No objectives found (should match "## Objective N:")');
    } else {
      addInfo(file, `✓ Found ${objectives.length} objective(s)`);
    }

    // Check Key Results
    const keyResults = content.match(/^#### KR \d+\.\d+:/gm);
    if (!keyResults || keyResults.length === 0) {
      addWarning(file, 'No Key Results found');
    } else {
      addInfo(file, `✓ Found ${keyResults.length} Key Result(s)`);
    }

    // Validate KR fields
    const krSections = content.split(/^#### KR \d+\.\d+:/gm).slice(1);
    krSections.forEach((kr, index) => {
      const krNum = index + 1;
      const requiredFields = ['Status', 'Direction', 'Baseline', 'Target', 'Current', 'Progress', 'Target Date'];

      requiredFields.forEach(field => {
        if (!kr.includes(`**${field}**:`)) {
          addError(file, `KR ${krNum} missing field: ${field}`);
        }
      });

      // Check if Target is numeric
      const targetMatch = kr.match(/\*\*Target\*\*:\s*(.+)/);
      if (targetMatch) {
        const targetValue = targetMatch[1].trim();
        if (isNaN(parseFloat(targetValue))) {
          addError(file, `KR ${krNum} Target must be numeric, got: "${targetValue}"`);
        }
      }

      // Check if Current is numeric
      const currentMatch = kr.match(/\*\*Current\*\*:\s*(.+)/);
      if (currentMatch) {
        const currentValue = currentMatch[1].trim();
        if (isNaN(parseFloat(currentValue))) {
          addError(file, `KR ${krNum} Current must be numeric, got: "${currentValue}"`);
        }
      }

      // Check status values
      const statusMatch = kr.match(/\*\*Status\*\*:\s*(.+)/);
      if (statusMatch) {
        const status = statusMatch[1].trim();
        const validStatuses = ['in-progress', 'complete', 'blocked'];
        if (!validStatuses.includes(status)) {
          addWarning(file, `KR ${krNum} Status "${status}" should be one of: ${validStatuses.join(', ')}`);
        }
      }

      // Check direction values
      const directionMatch = kr.match(/\*\*Direction\*\*:\s*(.+)/);
      if (directionMatch) {
        const direction = directionMatch[1].trim();
        const validDirections = ['increase', 'decrease'];
        if (!validDirections.includes(direction)) {
          addError(file, `KR ${krNum} Direction must be "increase" or "decrease", got: "${direction}"`);
        }
      }

      // Check if Baseline is numeric
      const baselineMatch = kr.match(/\*\*Baseline\*\*:\s*(.+)/);
      if (baselineMatch) {
        const baselineValue = baselineMatch[1].trim();
        if (isNaN(parseFloat(baselineValue))) {
          addError(file, `KR ${krNum} Baseline must be numeric, got: "${baselineValue}"`);
        }
      }
    });
  });
}

async function validatePlans(plansDir) {
  if (!fs.existsSync(plansDir)) return;

  const files = fs.readdirSync(plansDir).filter(f => f.match(/^plan-\d{4}-\d{2}-\d{2}\.md$/));

  if (files.length === 0) {
    addWarning('plans', 'No weekly plan files found');
    return;
  }

  addInfo('plans', `✓ Found ${files.length} plan file(s)`);

  files.forEach(file => {
    const filePath = path.join(plansDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Check date format in filename
    const dateMatch = file.match(/plan-(\d{4}-\d{2}-\d{2})\.md/);
    if (!dateMatch) {
      addError(file, 'Filename should be: plan-YYYY-MM-DD.md');
    }

    // Check for header
    if (!content.match(/^# Weekly Plan:/m)) {
      addWarning(file, 'Missing header "# Weekly Plan:"');
    }

    // Check for action items
    const actions = content.match(/^## /gm);
    if (!actions || actions.length === 0) {
      addWarning(file, 'No action items found (should start with "##")');
    } else {
      addInfo(file, `✓ Found ${actions.length} action(s)`);
    }

    // Check for "Maps to" references
    const mapsTo = content.match(/\*\*Maps to\*\*:/g);
    if (actions && (!mapsTo || mapsTo.length < actions.length)) {
      addWarning(file, 'Some actions missing "**Maps to**: KR X.X" reference');
    }
  });
}

async function validateTracking(trackingDir) {
  if (!fs.existsSync(trackingDir)) return;

  const requiredFiles = ['completed-items.md', 'checkin-history.md', 'progress-summary.md'];

  requiredFiles.forEach(file => {
    const filePath = path.join(trackingDir, file);
    if (!fs.existsSync(filePath)) {
      addWarning('tracking', `Missing ${file}`);
    } else {
      addInfo('tracking', `✓ Found ${file}`);

      // Validate file content
      const content = fs.readFileSync(filePath, 'utf8');

      if (file === 'completed-items.md') {
        validateCompletedItems(content, file);
      } else if (file === 'checkin-history.md') {
        validateCheckinHistory(content, file);
      } else if (file === 'progress-summary.md') {
        validateProgressSummary(content, file);
      }
    }
  });
}

function validateCompletedItems(content, file) {
  // Check for main header
  if (!content.match(/^# Completed Items/m)) {
    addWarning(file, 'Missing main header "# Completed Items"');
  }

  // Check for date sections (## YYYY-MM-DD)
  const dateSections = content.match(/^## \d{4}-\d{2}-\d{2}/gm);
  if (!dateSections || dateSections.length === 0) {
    addWarning(file, 'No date sections found (should be "## YYYY-MM-DD")');
  } else {
    addInfo(file, `✓ Found ${dateSections.length} date section(s)`);

    // Validate each date section has items
    const sections = content.split(/^## \d{4}-\d{2}-\d{2}/gm).slice(1);
    sections.forEach((section, index) => {
      const items = section.match(/^- .+/gm);
      if (!items || items.length === 0) {
        addWarning(file, `Date section ${index + 1} has no completed items`);
      }
    });
  }
}

function validateCheckinHistory(content, file) {
  // Check for main header
  if (!content.match(/^# Check-in History/m)) {
    addWarning(file, 'Missing main header "# Check-in History"');
  }

  // Check for check-in sections
  const checkins = content.match(/^## Check-in: \d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}/gm);
  if (checkins && checkins.length > 0) {
    addInfo(file, `✓ Found ${checkins.length} check-in(s)`);

    // Validate each check-in has required sections
    const sections = content.split(/^## Check-in: \d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}/gm).slice(1);
    sections.forEach((section, index) => {
      const checkinNum = index + 1;
      const requiredSections = ['### What Was Completed', '### Updates Made', '### Next Week Focus', '### Insights'];

      requiredSections.forEach(reqSection => {
        if (!section.includes(reqSection)) {
          addWarning(file, `Check-in ${checkinNum} missing section: ${reqSection}`);
        }
      });

      // Check for date line
      if (!section.match(/\*\*Date\*\*: \d{4}-\d{2}-\d{2}/)) {
        addWarning(file, `Check-in ${checkinNum} missing "**Date**: YYYY-MM-DD" line`);
      }
    });
  }
}

function validateProgressSummary(content, file) {
  // Check for main header
  if (!content.match(/^# Weekly Progress Summary/m)) {
    addWarning(file, 'Missing main header "# Weekly Progress Summary"');
  }

  // Check for week sections
  const weekSections = content.match(/^## Week of \d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}/gm);
  if (weekSections && weekSections.length > 0) {
    addInfo(file, `✓ Found ${weekSections.length} week section(s)`);

    // Validate each week has required sections
    const sections = content.split(/^## Week of \d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}/gm).slice(1);
    sections.forEach((section, index) => {
      const weekNum = index + 1;
      const requiredSections = ['### Overview', '### Progress Highlights', '### Statistics'];

      requiredSections.forEach(reqSection => {
        if (!section.includes(reqSection)) {
          addWarning(file, `Week ${weekNum} missing section: ${reqSection}`);
        }
      });

      // Check for wins section
      if (!section.includes('## Wins This Week')) {
        addWarning(file, `Week ${weekNum} missing "## Wins This Week" section`);
      }
    });
  }
}

function printResults() {
  print('\n═══════════════════════════════════════\n', 'cyan');

  // Print errors
  if (errors.length > 0) {
    print(`❌ ERRORS (${errors.length}):\n`, 'red');
    errors.forEach(err => {
      print(`   ${err.file}:`, 'bright');
      print(`   ${err.message}\n`, 'red');
    });
  }

  // Print warnings
  if (warnings.length > 0) {
    print(`⚠️  WARNINGS (${warnings.length}):\n`, 'yellow');
    warnings.forEach(warn => {
      print(`   ${warn.file}:`, 'bright');
      print(`   ${warn.message}\n`, 'yellow');
    });
  }

  // Print summary
  print('═══════════════════════════════════════\n', 'cyan');

  if (errors.length === 0 && warnings.length === 0) {
    print('✅ All checks passed! Your data looks good.\n', 'green');
  } else {
    print('📋 Summary:', 'bright');
    print(`   ${info.length} items validated`, 'cyan');
    print(`   ${errors.length} errors found`, errors.length > 0 ? 'red' : 'green');
    print(`   ${warnings.length} warnings found\n`, warnings.length > 0 ? 'yellow' : 'green');

    if (errors.length > 0) {
      print('Please fix the errors above before running the app.\n', 'yellow');
      print('💡 Tip: Use demo/ files as reference for correct format.\n', 'cyan');
      process.exit(1);
    }
  }
}

// Run validation
validate().catch(err => {
  print(`\n❌ Validation failed: ${err.message}\n`, 'red');
  process.exit(1);
});
