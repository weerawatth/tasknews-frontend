import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../styles.css';

// ฟังก์ชันสำหรับแปลงวันที่เป็นรูปแบบไทย (วัน เดือน ปี)
const formatThaiDate = (date) => {
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const d = new Date(date);
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear() + 543; // เพิ่ม 543 เพื่อแปลงเป็น พ.ศ.
  return `${day} ${month} ${year}`;
};

// ฟังก์ชันสร้างตัวเลือกเวลาแบบ 24 ชั่วโมง (ทุก 15 นาที)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const hourStr = String(hour).padStart(2, '0');
      const minuteStr = String(minute).padStart(2, '0');
      options.push(`${hourStr}:${minuteStr}`);
    }
  }
  return options;
};

function ControlSection() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    date: '',
    time: '',
    newsId: '',
    indicator: '',
    command: '',
    from: '',
    to: '',
    title: '',
    status: 'ตามเวลา'
  });
  const [editTask, setEditTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const timeOptions = generateTimeOptions();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('กรุณาเข้าสู่ระบบก่อน');
      const res = await axios.get('https://tasknews-backend.onrender.com/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched tasks:', res.data);
      setTasks(res.data.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)));
    } catch (err) {
      console.error('Error fetching tasks:', err.message, err.response?.data);
      Swal.fire('เกิดข้อผิดพลาด!', err.response?.data?.message || 'ไม่สามารถดึงข้อมูลงานได้: ' + err.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const taskData = {
        date: form.date,
        time: form.time || '', // ส่งค่าว่างถ้าไม่เลือกเวลา
        newsId: form.newsId || '',
        indicator: form.indicator || '',
        command: form.command || '',
        from: form.from || '',
        to: form.to || '',
        title: form.title,
        status: form.status
      };
      console.log('Submitting task data:', taskData); // ตรวจสอบข้อมูลก่อนส่ง
      let res;
      if (editTask) {
        res = await axios.put(`https://tasknews-backend.onrender.com/api/tasks/${editTask._id}`, taskData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Edit response:', res.data);
        Swal.fire('สำเร็จ!', 'แก้ไขงานเรียบร้อย', 'success');
        setEditTask(null);
      } else {
        res = await axios.post('https://tasknews-backend.onrender.com/api/tasks', taskData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Add response:', res.data);
        Swal.fire('สำเร็จ!', 'เพิ่มงานเรียบร้อย', 'success');
      }
      setForm({ date: '', time: '', newsId: '', indicator: '', command: '', from: '', to: '', title: '', status: 'ตามเวลา' });
      fetchTasks();
    } catch (err) {
      console.error('Error submitting task:', err.message, err.response?.data);
      Swal.fire('เกิดข้อผิดพลาด!', err.response?.data?.message || 'ไม่สามารถบันทึกงานได้', 'error');
    }
  };

  const handleEdit = (task) => {
    setEditTask(task);
    setForm({
      date: task.date || '',
      time: task.time || '',
      newsId: task.newsId || '',
      indicator: task.indicator || '',
      command: task.command || '',
      from: task.from || '',
      to: task.to || '',
      title: task.title || '',
      status: task.status || 'ตามเวลา'
    });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: 'คุณแน่ใจหรือไม่ที่จะลบงานนี้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`https://tasknews-backend.onrender.com/api/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('ลบสำเร็จ!', 'งานถูกลบเรียบร้อย', 'success');
        fetchTasks();
      } catch (err) {
        Swal.fire('เกิดข้อผิดพลาด!', err.response?.data?.message || 'ไม่สามารถลบงานได้', 'error');
      }
    }
  };

  const handlePopupSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const taskData = {
        date: editTask.date,
        time: editTask.time || '',
        newsId: editTask.newsId || '',
        indicator: editTask.indicator || '',
        command: editTask.command || '',
        from: editTask.from || '',
        to: editTask.to || '',
        title: editTask.title,
        status: editTask.status
      };
      console.log('Submitting edited task data:', taskData);
      const res = await axios.put(`https://tasknews-backend.onrender.com/api/tasks/${editTask._id}`, taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Edit response:', res.data);
      Swal.fire('สำเร็จ!', 'แก้ไขงานเรียบร้อย', 'success');
      setEditTask(null);
      fetchTasks();
    } catch (err) {
      console.error('Error submitting edited task:', err.message, err.response?.data);
      Swal.fire('เกิดข้อผิดพลาด!', err.response?.data?.message || 'ไม่สามารถแก้ไขงานได้', 'error');
    }
  };

  const filterTasks = (tasks) => {
    if (!searchTerm) return tasks;
    return tasks.filter(task => 
      (task.title && task.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.command && task.command.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.from && task.from.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.to && task.to.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(tasks.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const filteredTasks = filterTasks(tasks);
  const paginatedTasks = getPaginatedData(filteredTasks);

  return (
    <div className="container">
      <h1>ศูนย์ควบคุมบ่งการส่วนหน้า</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="date" 
          value={form.date} 
          onChange={(e) => setForm({ ...form, date: e.target.value })} 
          required
        />
        <select
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
        >
          <option value="">-- เลือกเวลา --</option>
          {timeOptions.map((time) => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
        <input 
          placeholder="ข่าวที่" 
          value={form.newsId} 
          onChange={(e) => setForm({ ...form, newsId: e.target.value })} 
        />
        <input 
          placeholder="บ่งการที่" 
          value={form.indicator} 
          onChange={(e) => setForm({ ...form, indicator: e.target.value })} 
        />
        <input 
          placeholder="คำสั่ง-สถานการณ์" 
          value={form.command} 
          onChange={(e) => setForm({ ...form, command: e.target.value })} 
        />
        <input 
          placeholder="จาก" 
          value={form.from} 
          onChange={(e) => setForm({ ...form, from: e.target.value })} 
        />
        <input 
          placeholder="ถึง" 
          value={form.to} 
          onChange={(e) => setForm({ ...form, to: e.target.value })} 
        />
        <textarea 
          placeholder="เรื่อง" 
          value={form.title} 
          onChange={(e) => setForm({ ...form, title: e.target.value })} 
          rows="3"
          required
        />
        <select 
          value={form.status} 
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="ตามเวลา">ตามเวลา</option>
          <option value="เริ่มเมื่อพร้อม">เริ่มเมื่อพร้อม</option>
          <option value="รอฟัง">รอฟัง</option>
        </select>
        <button type="submit" className="btn btn-add">
          <i className="fas fa-plus"></i> เพิ่มงาน
        </button>
      </form>

      <div className="controls">
        <input
          type="text"
          placeholder="ค้นหางาน (เรื่อง, คำสั่ง, จาก, ถึง)"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>วันที่</th>
            <th>เวลา</th>
            <th>ข่าวที่</th>
            <th>บ่งการที่</th>
            <th>คำสั่ง</th>
            <th>จาก</th>
            <th>ถึง</th>
            <th>เรื่อง</th>
            <th>สถานะ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {paginatedTasks.length === 0 ? (
            <tr><td colSpan="10">ไม่มีงานในขณะนี้</td></tr>
          ) : (
            paginatedTasks.map(task => (
              <tr key={task._id}>
                <td>{formatThaiDate(task.date)}</td>
                <td>{task.time || '-'}</td>
                <td>{task.newsId || '-'}</td>
                <td>{task.indicator || '-'}</td>
                <td>{task.command || '-'}</td>
                <td>{task.from || '-'}</td>
                <td>{task.to || '-'}</td>
                <td>{task.title || '-'}</td>
                <td className={`status-${task.status}`}>{task.status}</td>
                <td className="action-buttons">
                  <button className="btn btn-edit" onClick={() => handleEdit(task)} title="แก้ไข">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="btn btn-delete" onClick={() => handleDelete(task._id)} title="ลบ">
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button
          className="btn btn-pagination"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ก่อนหน้า
        </button>
        <span>หน้า {currentPage} / {totalPages}</span>
        <button
          className="btn btn-pagination"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          ถัดไป
        </button>
      </div>

      {editTask && (
        <div className="popup">
          <h2>แก้ไขงาน: {editTask.title}</h2>
          <form onSubmit={handlePopupSubmit}>
            <input 
              type="date" 
              value={editTask.date} 
              onChange={(e) => setEditTask({ ...editTask, date: e.target.value })} 
              required
            />
            <select
              value={editTask.time}
              onChange={(e) => setEditTask({ ...editTask, time: e.target.value })}
            >
              <option value="">-- เลือกเวลา --</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
            <input 
              placeholder="ข่าวที่" 
              value={editTask.newsId} 
              onChange={(e) => setEditTask({ ...editTask, newsId: e.target.value })} 
            />
            <input 
              placeholder="บ่งการที่" 
              value={editTask.indicator} 
              onChange={(e) => setEditTask({ ...editTask, indicator: e.target.value })} 
            />
            <input 
              placeholder="คำสั่ง-สถานการณ์" 
              value={editTask.command} 
              onChange={(e) => setEditTask({ ...editTask, command: e.target.value })} 
            />
            <input 
              placeholder="จาก" 
              value={editTask.from} 
              onChange={(e) => setEditTask({ ...editTask, from: e.target.value })} 
            />
            <input 
              placeholder="ถึง" 
              value={editTask.to} 
              onChange={(e) => setEditTask({ ...editTask, to: e.target.value })} 
            />
            <textarea 
              placeholder="เรื่อง" 
              value={editTask.title} 
              onChange={(e) => setEditTask({ ...editTask, title: e.target.value })} 
              rows="3"
              required
            />
            <select 
              value={editTask.status} 
              onChange={(e) => setEditTask({ ...editTask, status: e.target.value })}
            >
              <option value="ตามเวลา">ตามเวลา</option>
              <option value="เริ่มเมื่อพร้อม">เริ่มเมื่อพร้อม</option>
              <option value="รอฟัง">รอฟัง</option>
            </select>
            <div className="popup-buttons">
              <button type="submit" className="btn btn-add">
                <i className="fas fa-save"></i> บันทึก
              </button>
              <button type="button" className="btn btn-cancel" onClick={() => setEditTask(null)}>
                <i className="fas fa-times"></i> ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ControlSection;