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
    print('   Run "npm run setup" to create your data folder.\n', 'yellow');
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
      const requiredFields = ['Status', 'Target', 'Current', 'Progress', 'Target Date'];

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
    }
  });
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
