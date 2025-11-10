import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root directory (3 levels up from backend/src/config/)
const PROJECT_ROOT = path.join(__dirname, '../../..');

// Data directory (personal MD files)
// If DATA_DIR is relative (e.g., ./demo), resolve it from project root
// If DATA_DIR is absolute, use it as-is
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(PROJECT_ROOT, process.env.DATA_DIR)
  : path.join(PROJECT_ROOT, 'personal');

export const PATHS = {
  objectives: {
    dir: path.join(DATA_DIR, 'objectives'),
    annual: path.join(DATA_DIR, 'objectives/annual-2025.md'),
    quarterly: path.join(DATA_DIR, 'objectives/2025-q4.md'),
  },
  tracking: {
    completed: path.join(DATA_DIR, 'tracking/completed-items.md'),
    progress: path.join(DATA_DIR, 'tracking/progress-summary.md'),
    checkinHistory: path.join(DATA_DIR, 'tracking/checkin-history.md'),
  },
  plans: path.join(DATA_DIR, 'plans'),
};

export default PATHS;
