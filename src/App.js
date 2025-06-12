import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ControlSection from './components/ControlSection';
import CommitteeSection from './components/CommitteeSection';
import DisplaySection from './components/DisplaySection';
import UserManagement from './components/UserManagement';
import Navbar from './components/Navbar';
import './styles.css';

function App() {
  const [user, setUser] = useState(() => {
    // ดึง user จาก localStorage ถ้ามี
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    // อัปเดต localStorage เมื่อ user เปลี่ยน
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const ProtectedRoute = ({ component: Component, allowedRoles, ...rest }) => (
    <Route
      {...rest}
      render={props => {
        console.log('Current user in ProtectedRoute:', user); // Debug
        return user && allowedRoles.includes(user.role) ? (
          <>
            <Navbar user={user} setUser={setUser} />
            <Component {...props} />
          </>
        ) : (
          <Redirect to="/" />
        );
      }}
    />
  );

  return (
    <Router>
      <Switch>
        <Route path="/" exact render={props => <Login {...props} setUser={setUser} />} />
        <Route path="/register" component={Register} />
        <ProtectedRoute path="/control" component={ControlSection} allowedRoles={['admin']} />
        <ProtectedRoute path="/committee" component={CommitteeSection} allowedRoles={['admin', 'user']} />
        <ProtectedRoute path="/display" component={DisplaySection} allowedRoles={['admin', 'user', 'guest']} />
        <ProtectedRoute path="/users" component={UserManagement} allowedRoles={['admin']} />
      </Switch>
    </Router>
  );
}

export default App;