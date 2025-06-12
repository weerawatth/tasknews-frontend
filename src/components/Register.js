import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://tasknews-backend.onrender.com/api/auth/register', form);
      if (res.data.message === 'สมัครสมาชิกสำเร็จ') {
        alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        history.push('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ');
    }
  };

  return (
    <div className="login-container">
      <h1>สมัครสมาชิก</h1>
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
        <button type="submit" className="btn btn-login">สมัครสมาชิก</button>
      </form>
       
    </div>
  );
}

export default Register;