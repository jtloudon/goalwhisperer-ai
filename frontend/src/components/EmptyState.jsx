import './EmptyState.css';

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <div className="empty-state-icon">🎯</div>
        <h1>Welcome to GoalWhisperer AI!</h1>
        <p className="empty-state-subtitle">
          Your personal AI-powered goal tracking system
        </p>

        <div className="empty-state-section">
          <h2>Get Started in 3 Ways:</h2>

          <div className="option-cards">
            <div className="option-card">
              <div className="option-number">1</div>
              <h3>Try Demo Data</h3>
              <p>Explore features with example goals (coffee shop owner)</p>
              <div className="code-block">
                <code>DATA_DIR=./demo npm run dev</code>
              </div>
              <span className="option-badge">⚡ Fastest</span>
            </div>

            <div className="option-card recommended">
              <div className="option-number">2</div>
              <h3>Interactive Setup</h3>
              <p>Guided wizard to create your first goal</p>
              <div className="code-block">
                <code>npm run setup</code>
              </div>
              <span className="option-badge recommended-badge">✨ Recommended</span>
            </div>

            <div className="option-card">
              <div className="option-number">3</div>
              <h3>Manual Setup</h3>
              <p>Copy template and customize yourself</p>
              <div className="code-block">
                <code>cp -r demo personal</code>
              </div>
              <span className="option-badge">🛠️ Full Control</span>
            </div>
          </div>
        </div>

        <div className="empty-state-help">
          <h3>Need Help?</h3>
          <ul>
            <li>📖 Check the <a href="https://github.com/jtloudon/goalwhisperer-ai/blob/main/README.md" target="_blank" rel="noopener noreferrer">README</a> for detailed instructions</li>
            <li>💡 Look at <code>demo/objectives/annual-2025.md</code> for examples</li>
            <li>✅ Run <code>npm run validate</code> to check your data format</li>
          </ul>
        </div>

        <div className="empty-state-footer">
          <p>Once you have data set up, restart the dev server:</p>
          <div className="code-block">
            <code>npm run dev</code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmptyState;
