import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/objectives', label: 'Objectives' },
    { path: '/plans', label: 'Weekly Actions' },
    { path: '/completed', label: 'Completed Actions' },
    { path: '/about', label: 'About' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>
          AI Powered<br />
          Goal Tracker
        </h2>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
