import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'user' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', form);
      setForm({ username: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  const handleEdit = async (id) => {
    const { username, password, role } = promptForUserDetails(users.find(u => u._id === id));
    if (username && password && role) {
      await axios.put(`http://localhost:5000/api/auth/users/${id}`, { username, password, role });
      fetchUsers();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('ยืนยันการลบผู้ใช้?')) {
      await axios.delete(`http://localhost:5000/api/auth/users/${id}`);
      fetchUsers();
    }
  };

  const promptForUserDetails = (user = {}) => {
    const username = prompt('ชื่อผู้ใช้:', user.username || '');
    const password = prompt('รหัสผ่าน:', user.password || '');
    const role = prompt('บทบาท (admin, user, guest):', user.role || 'user');
    return { username, password, role };
  };

  return (
    <div className="container">
      <h1>การจัดการผู้ใช้</h1>
      <form onSubmit={handleSubmit} className="user-form">
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
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="guest">Guest</option>
        </select>
        <button type="submit" className="btn btn-add">เพิ่มผู้ใช้</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>ชื่อผู้ใช้</th>
            <th>รหัสผ่าน</th>
            <th>บทบาท</th>
            <th>วันที่สร้าง</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td>{user.username}</td>
              <td>{user.password}</td>
              <td>{user.role}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <button className="btn btn-edit" onClick={() => handleEdit(user._id)}>แก้ไข</button>
                <button className="btn btn-delete" onClick={() => handleDelete(user._id)}>ลบ</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagement;