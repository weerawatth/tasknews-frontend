import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Login({ setUser }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      console.log('Form is empty, request not sent');
      return;
    }

    try {
      console.log('Sending login request to https://tasknews-backend.onrender.com/api/auth/login');
      console.log('Form data:', form);
      const res = await axios.post('https://tasknews-backend.onrender.com/api/auth/login', form, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Login response:', res.data);
      if (res.data.message === 'Login successful') {
        const token = res.data.token;
        localStorage.setItem('token', token);
        const decodedToken = jwtDecode(token);
        setUser({ username: decodedToken.username, role: decodedToken.role });
        console.log('User set:', decodedToken);

        switch (decodedToken.role) {
          case 'admin':
            history.push('/control');
            break;
          case 'user':
            history.push('/committee');
            break;
          case 'guest':
            history.push('/display');
            break;
          default:
            history.push('/');
        }
      } else {
        setError('การตอบกลับจากเซิร์ฟเวอร์ไม่ถูกต้อง');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    }
  };

  return (
    <div className="login-container">
     <h1>ระบบติดตามสถานการณ์ฝึก</h1>
     <h3>ลงชื่อเข้าสู่ระบบ</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="ชื่อผู้ใช้"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit" className="btn btn-login">เข้าสู่ระบบ</button>
      </form>
  
    </div>
  );
}

export default Login;