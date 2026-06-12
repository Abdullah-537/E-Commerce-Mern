import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../store/api/baseApi';
import { useSelector } from 'react-redux';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        // Silently fail if not supported yet
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const markAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  if (!isAuthenticated) {
    return (
      <li className="nav-item dropdown feather-icon-wait" style={{height: '40px'}}>
        <a 
          className="nav-link px-2 icon-indicator icon-indicator-sm"
          href="#" 
          role="button" 
          onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        >
          <span className="fas fa-bell text-body-tertiary fs-8"></span>
        </a>
        
        {isOpen && (
          <div 
            className="dropdown-menu dropdown-menu-end notification-dropdown-menu py-0 shadow border navbar-dropdown-caret mt-2 show"
            style={{ position: 'absolute', right: 0, width: 320, zIndex: 1050 }}
          >
            <div className="card position-relative border-0">
              <div className="card-header p-2">
                <h5 className="text-body-emphasis mb-0">Notifications</h5>
              </div>
              <div className="card-body p-4 text-center">
                <p className="text-body-tertiary mb-3">Login to receive notifications</p>
                <Link to="/login" className="btn btn-primary btn-sm" onClick={() => setIsOpen(false)}>Sign In</Link>
              </div>
            </div>
          </div>
        )}
        
        {isOpen && (
          <div 
            className="position-fixed top-0 start-0 w-100 h-100" 
            style={{ zIndex: 1040 }} 
            onClick={() => setIsOpen(false)}
          />
        )}
      </li>
    );
  }
  return (
    <li className="nav-item dropdown feather-icon-wait" style={{height: '40px'}}>
      <a 
        className={`nav-link px-2 icon-indicator icon-indicator-sm ${unreadCount > 0 ? 'icon-indicator-danger' : ''}`}
        id="navbarTopDropdownNotification" 
        href="#" 
        role="button" 
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
      >
        <span className="fas fa-bell text-body-tertiary fs-8"></span>
        {unreadCount > 0 && <span className="icon-indicator-number" style={{ top: -2, right: 0 }}>{unreadCount}</span>}
      </a>
      
      {isOpen && (
        <div 
          className="dropdown-menu dropdown-menu-end notification-dropdown-menu py-0 shadow border navbar-dropdown-caret mt-2 show"
          style={{ position: 'absolute', right: 0, width: 320, zIndex: 1050 }}
        >
          <div className="card position-relative border-0">
            <div className="card-header p-2">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="text-body-emphasis mb-0">Notifications</h5>
                <button className="btn btn-link p-0 fs-9 fw-normal" type="button" onClick={markAllAsRead}>Mark all as read</button>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="scrollbar-overlay" style={{ height: '20rem', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-body-tertiary fs-9">No notifications yet.</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n._id} 
                      className={`px-3 py-3 notification-card position-relative border-bottom ${!n.isRead ? 'unread bg-body-highlight' : 'read'}`}
                      onClick={() => markAsRead(n._id, n.isRead)}
                    >
                      {n.link ? (
                        <Link to={n.link} className="text-decoration-none" onClick={() => setIsOpen(false)}>
                          <div className="d-flex flex-column">
                            <h6 className={`mb-1 fs-9 ${!n.isRead ? 'fw-bold text-body-emphasis' : 'text-body'}`}>{n.title}</h6>
                            <p className="fs-9 text-body-secondary mb-1 lh-sm">{n.message}</p>
                            <span className="fs-10 text-body-tertiary">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                        </Link>
                      ) : (
                        <div className="d-flex flex-column cursor-pointer">
                          <h6 className={`mb-1 fs-9 ${!n.isRead ? 'fw-bold text-body-emphasis' : 'text-body'}`}>{n.title}</h6>
                          <p className="fs-9 text-body-secondary mb-1 lh-sm">{n.message}</p>
                          <span className="fs-10 text-body-tertiary">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100" 
          style={{ zIndex: 1040 }} 
          onClick={() => setIsOpen(false)}
        />
      )}
    </li>
  );
}
