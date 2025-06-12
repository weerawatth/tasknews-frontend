import React from 'react';
import { Link, useHistory } from 'react-router-dom';

function Navbar({ user, setUser }) {
  const history = useHistory();

  const handleLogout = () => {
    setUser(null); // ล้าง state
    localStorage.removeItem('user'); // ล้าง localStorage
    history.push('/');
  };

  const menuItems = {
    admin: [
      { path: '/control', label: 'ศูนย์ควบคุมบ่งการส่วนหน้า' },
      { path: '/committee', label: 'คณะกรรมการ' },
      { path: '/display', label: 'Dashboard' },
      { path: '/users', label: 'การจัดการผู้ใช้' },
    ],
    user: [{ path: '/committee', label: 'คณะกรรมการ' },
           { path: '/display', label: 'Dashboard' },],
    guest: [{ path: '/display', label: 'Dashboard' }],
  };

  return (
    <nav className="navbar">
      <ul>
        {user && menuItems[user.role].map(item => (
          <li key={item.path}>
            <Link to={item.path}>{item.label}</Link>
          </li>
        ))}
      </ul>
      {user && (
        <div className="user-info">
          <span>สวัสดี: {user.username} ({user.role})</span>
          <button className="btn btn-logout" onClick={handleLogout}>ออกจากระบบ</button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;