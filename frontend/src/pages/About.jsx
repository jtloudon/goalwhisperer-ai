import './Page.css';

function About() {
  return (
    <div className="page-content">
      <h1>About AI Powered Goal Tracker</h1>

      <section>
        <h2>Overview</h2>
        <p>
          This is an AI-powered OKR management system that uses conversational
          interfaces and real-time visualization to help you track and achieve your goals.
        </p>
      </section>

      <section>
        <h2>Features</h2>
        <ul>
          <li>Real-time dashboard with progress tracking</li>
          <li>Conversational check-ins with Claude AI</li>
          <li>Markdown-based data storage (human-readable)</li>
          <li>Auto-updates when data changes</li>
          <li>Local-first (runs on your machine)</li>
        </ul>
      </section>

      <section>
        <h2>Tech Stack</h2>
        <ul>
          <li><strong>Frontend:</strong> React + Vite + React Router</li>
          <li><strong>Backend:</strong> Node.js + Express</li>
          <li><strong>AI:</strong> Claude API (Anthropic)</li>
          <li><strong>Data:</strong> Markdown files</li>
        </ul>
      </section>

      <section>
        <h2>How It Works</h2>
        <ol>
          <li>Your OKR data is stored in markdown files</li>
          <li>The backend API parses these files into structured data</li>
          <li>The frontend displays your data with beautiful visualizations</li>
          <li>Chat with Claude AI to create objectives, update progress, and manage weekly plans</li>
          <li>All pages auto-refresh every 5 seconds to reflect changes</li>
        </ol>
      </section>

      <section>
        <h2>Development Status</h2>
        <p><strong>Current Phase:</strong> Phase 6 - Agent Reliability & Testing (Complete)</p>
        <ul>
          <li>Phase 1: Core Dashboard & Data Parsing <span className="status-complete">✓ Complete</span></li>
          <li>Phase 2: Multi-page Navigation <span className="status-complete">✓ Complete</span></li>
          <li>Phase 3: AI Chat Integration <span className="status-complete">✓ Complete</span></li>
          <li>Phase 4: Goal Management Tools <span className="status-complete">✓ Complete</span></li>
          <li>Phase 5: Enhancement & Refinement <span className="status-complete">✓ Complete</span></li>
          <li>Phase 6: Agent Reliability & Testing <span className="status-complete">✓ Complete</span></li>
        </ul>
        <p>
          <strong>Agent Capabilities:</strong> 9/10 operation scenarios supported with comprehensive tool coverage.
          See <code>docs/agent-test-plan.md</code> for testing framework.
        </p>
      </section>

      <section>
        <h2>Portfolio Project</h2>
        <p>
          Built by Jesse Loudon as a portfolio demonstration of full-stack development,
          AI integration, and product thinking. View the source code on{' '}
          <a href="https://github.com/jtloudon" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>.
        </p>
      </section>
    </div>
  );
}

export default About;
