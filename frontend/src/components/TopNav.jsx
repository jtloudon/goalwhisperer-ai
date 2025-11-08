import { Link, useLocation } from 'react-router-dom';
import './TopNav.css';

function TopNav() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/objectives', label: 'Objectives' },
    { path: '/plans', label: 'Weekly Actions' },
    { path: '/checkin-history', label: 'Check-in History' },
    { path: '/about', label: 'About' },
  ];

  return (
    <nav className="top-nav">
      <div className="top-nav-content">
        <div className="top-nav-brand">
          <h1>
            AI Powered Goal Tracker
          </h1>
        </div>
        <div className="top-nav-links">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default TopNav;
