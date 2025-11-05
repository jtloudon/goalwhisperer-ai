import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory (personal MD files)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../personal');

export const PATHS = {
  objectives: {
    dir: path.join(DATA_DIR, 'objectives'),
    annual: path.join(DATA_DIR, 'objectives/annual-2025.md'),
    quarterly: path.join(DATA_DIR, 'objectives/2025-q4.md'),
  },
  tracking: {
    completed: path.join(DATA_DIR, 'tracking/completed-items.md'),
    progress: path.join(DATA_DIR, 'tracking/progress-summary.md'),
  },
  plans: path.join(DATA_DIR, 'plans'),
};

export default PATHS;
