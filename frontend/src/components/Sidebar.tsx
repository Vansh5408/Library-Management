import React from 'react';
import '../styles/Sidebar.css';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  onClick?: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  onLogout?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeItem,
  onItemClick,
  userName,
  userEmail,
  userRole,
  onLogout,
  collapsed = false,
  onToggleCollapse,
}) => {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">📚</span>
          {!collapsed && <span className="logo-text">Library</span>}
        </div>
        {onToggleCollapse && (
          <button className="collapse-btn" onClick={onToggleCollapse} aria-label="Toggle sidebar">
            {collapsed ? '→' : '←'}
          </button>
        )}
      </div>

      {/* User Profile */}
      {(userName || userEmail) && (
        <div className="sidebar-user">
          <div className="user-avatar">
            {userName?.charAt(0).toUpperCase() || '👤'}
          </div>
          {!collapsed && (
            <div className="user-details">
              <span className="user-name">{userName}</span>
              <span className="user-role">
                {userRole === 'admin' ? '👨‍💼 Admin' : '👤 User'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Items */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {items.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
                onClick={() => {
                  onItemClick(item.id);
                  item.onClick?.();
                }}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      {onLogout && (
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <span className="nav-icon">🚪</span>
            {!collapsed && <span className="nav-label">Logout</span>}
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
