#!/usr/bin/env node

/**
 * GoalWhisperer AI - Interactive Setup Wizard
 * Helps new users get started with their goals
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${prompt}${colors.reset}`, resolve);
  });
}

async function setup() {
  print('\n╔═══════════════════════════════════════╗', 'magenta');
  print('║   GoalWhisperer AI - Setup Wizard    ║', 'magenta');
  print('╚═══════════════════════════════════════╝\n', 'magenta');

  print('Welcome! This wizard will help you get started.\n', 'bright');

  // Check if personal folder already exists
  const personalDir = path.join(__dirname, '..', 'personal');
  const personalExists = fs.existsSync(personalDir);

  if (personalExists) {
    print('⚠️  Found existing personal/ folder', 'yellow');
    const overwrite = await question('Do you want to start fresh? This will backup your existing data. (y/N): ');

    if (overwrite.toLowerCase() === 'y') {
      const backupDir = `${personalDir}_backup_${Date.now()}`;
      fs.renameSync(personalDir, backupDir);
      print(`✅ Backed up to: ${path.basename(backupDir)}\n`, 'green');
    } else {
      print('\n✅ Keeping existing data. Setup complete!\n', 'green');
      rl.close();
      return;
    }
  }

  // Ask user what they want to do
  print('How would you like to start?\n');
  print('1. Use demo data (coffee shop example - quick preview)');
  print('2. Copy demo structure and customize it (recommended)');
  print('3. Create from scratch (for experienced users)\n');

  const choice = await question('Enter your choice (1-3): ');

  switch (choice.trim()) {
    case '1':
      await setupDemoMode();
      break;
    case '2':
      await setupFromTemplate();
      break;
    case '3':
      await setupFromScratch();
      break;
    default:
      print('❌ Invalid choice. Please run setup again.\n', 'yellow');
  }

  // Setup .env file
  await setupEnvironment();

  print('\n╔═══════════════════════════════════════╗', 'green');
  print('║        Setup Complete! 🎉            ║', 'green');
  print('╚═══════════════════════════════════════╝\n', 'green');

  print('Next steps:', 'bright');
  print('1. Run: npm run dev', 'cyan');
  print('2. Open: http://localhost:5173', 'cyan');
  print('3. Start tracking your goals!\n', 'cyan');

  rl.close();
}

async function setupDemoMode() {
  print('\n📦 Setting up demo mode...', 'cyan');
  print('You chose to try demo data first. Good choice!\n');
  print('To run with demo data, use:', 'bright');
  print('  DATA_DIR=./demo npm run dev\n', 'cyan');
  print('The demo includes a coffee shop owner\'s goals.');
  print('Perfect for exploring features before creating your own.\n');
}

async function setupFromTemplate() {
  print('\n📋 Copying template structure...', 'cyan');

  const demoDir = path.join(__dirname, '..', 'demo');
  const personalDir = path.join(__dirname, '..', 'personal');

  // Copy demo structure
  copyDirRecursive(demoDir, personalDir);

  print('✅ Template copied to personal/\n', 'green');
  print('Next: Edit these files with YOUR goals:', 'bright');
  print('  - personal/objectives/annual-2025.md', 'yellow');
  print('  - personal/plans/plan-YYYY-MM-DD.md\n', 'yellow');

  const customize = await question('Would you like guidance on creating your first objective? (Y/n): ');

  if (customize.toLowerCase() !== 'n') {
    await guideFirstObjective();
  }
}

async function setupFromScratch() {
  print('\n🚀 Creating fresh structure...', 'cyan');

  const personalDir = path.join(__dirname, '..', 'personal');

  // Create directory structure
  fs.mkdirSync(path.join(personalDir, 'objectives'), { recursive: true });
  fs.mkdirSync(path.join(personalDir, 'plans'), { recursive: true });
  fs.mkdirSync(path.join(personalDir, 'tracking'), { recursive: true });

  print('✅ Created folder structure\n', 'green');

  await guideFirstObjective();
}

async function guideFirstObjective() {
  print('\n📝 Let\'s create your first objective!\n', 'bright');

  const objTitle = await question('What is your main goal? (e.g., "Launch My Side Business"): ');
  const objDesc = await question('Brief description: ');

  print('\nNow, let\'s add a Key Result (a measurable milestone):\n');
  const krTitle = await question('Key Result description: ');
  const krTarget = await question('Target number to achieve: ');
  const krDate = await question('Target date (YYYY-MM-DD): ');

  const objectiveContent = `# Annual Objectives 2025

## Objective 1: ${objTitle}

**Description**: ${objDesc}

**Progress**: 0%

### Key Results

#### KR 1.1: ${krTitle}
- **Status**: in-progress
- **Target**: ${krTarget}
- **Current**: 0
- **Progress**: 0%
- **Target Date**: ${krDate}
`;

  const personalDir = path.join(__dirname, '..', 'personal');
  const objectivePath = path.join(personalDir, 'objectives', 'annual-2025.md');

  fs.mkdirSync(path.dirname(objectivePath), { recursive: true });
  fs.writeFileSync(objectivePath, objectiveContent);

  print('\n✅ Created your first objective!', 'green');
  print(`   Saved to: personal/objectives/annual-2025.md\n`, 'green');

  // Create initial tracking files
  const trackingDir = path.join(personalDir, 'tracking');
  fs.mkdirSync(trackingDir, { recursive: true });

  fs.writeFileSync(path.join(trackingDir, 'completed-items.md'), '# Completed Items\n\n');
  fs.writeFileSync(path.join(trackingDir, 'checkin-history.md'), '# Check-in History\n\n');
  fs.writeFileSync(path.join(trackingDir, 'progress-summary.md'), '# Weekly Progress Summary\n\n');

  print('💡 Tip: You can add more objectives and KRs by editing the file.', 'yellow');
  print('    Use demo/objectives/annual-2025.md as a reference.\n', 'yellow');
}

async function setupEnvironment() {
  print('\n🔑 Setting up environment configuration...', 'cyan');

  const envPath = path.join(__dirname, '..', 'backend', '.env');
  const envExamplePath = path.join(__dirname, '..', 'backend', '.env.example');

  if (!fs.existsSync(envPath)) {
    // Copy .env.example to .env
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envExample);
    print('✅ Created backend/.env file\n', 'green');
  }

  const needsAI = await question('Do you want to enable the AI Coach? (y/N): ');

  if (needsAI.toLowerCase() === 'y') {
    print('\nTo enable AI features:', 'yellow');
    print('1. Get an API key from: https://console.anthropic.com/', 'yellow');
    print('2. Edit backend/.env and add your key:', 'yellow');
    print('   ANTHROPIC_API_KEY=sk-ant-your-key-here\n', 'yellow');
  } else {
    print('✅ You can enable AI Coach later by editing backend/.env\n', 'green');
  }
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.name !== 'README.md') {
      // Skip README when copying
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Run the setup
setup().catch(err => {
  print(`\n❌ Error: ${err.message}\n`, 'yellow');
  rl.close();
  process.exit(1);
});
