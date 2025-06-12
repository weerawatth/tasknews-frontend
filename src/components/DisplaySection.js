import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../styles.css';

function DisplaySection({ onTaskUpdate }) {
  const [controlTasks, setControlTasks] = useState([]);
  const [committeeTasks, setCommitteeTasks] = useState([]);
  const [filter, setFilter] = useState('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');
  const [controlPage, setControlPage] = useState(1);
  const [committeePage, setCommitteePage] = useState(1);
  const [latestControlId, setLatestControlId] = useState(null);
  const [latestCommitteeId, setLatestCommitteeId] = useState(null);
  const itemsPerPage = 4;

  const user = JSON.parse(localStorage.getItem('user')) || { role: 'guest' };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        Swal.fire('ข้อผิดพลาด!', 'กรุณาเข้าสู่ระบบก่อน', 'error');
        return;
      }

      const [controlRes, committeeRes] = await Promise.all([
        axios.get('https://tasknews-backend.onrender.com/api/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('https://tasknews-backend.onrender.com/api/committee', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const sortedControlTasks = controlRes.data.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || '1970-01-01');
        const dateB = new Date(b.createdAt || b.date || '1970-01-01');
        return dateB - dateA;
      });
      const sortedCommitteeTasks = committeeRes.data
        .filter(task => task.taskId)
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.startTime || '1970-01-01');
          const dateB = new Date(b.createdAt || b.startTime || '1970-01-01');
          return dateB - dateA;
        });

      const newLatestControl = sortedControlTasks[0]?._id;
      const newLatestCommittee = sortedCommitteeTasks[0]?._id;

      if (newLatestControl && newLatestControl !== latestControlId) {
        setLatestControlId(newLatestControl);
        setTimeout(() => setLatestControlId(null), 60000);
      }
      if (newLatestCommittee && newLatestCommittee !== latestCommitteeId) {
        setLatestCommitteeId(newLatestCommittee);
        setTimeout(() => setLatestCommitteeId(null), 60000);
      }

      setControlTasks(sortedControlTasks);
      setCommitteeTasks(sortedCommitteeTasks);
    } catch (err) {
      console.error('Error fetching data:', err.message, err.response?.data);
      Swal.fire('เกิดข้อผิดพลาด!', `ไม่สามารถดึงข้อมูลได้: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const formatThaiDate = (date) => {
    if (!date) return '-';
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const d = new Date(date);
    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  const filterTasks = (tasks, term) => {
    if (!term) return tasks;
    return tasks.filter(task => task.title?.toLowerCase().includes(term.toLowerCase()) || false);
  };

  const filterCommitteeTasks = (tasks, term) => {
    if (!term) return tasks;
    return tasks.filter(task => task.taskId?.title?.toLowerCase().includes(term.toLowerCase()) || false);
  };

  const getPaginatedData = (data, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const controlTotalPages = Math.ceil(controlTasks.length / itemsPerPage);
  const committeeTotalPages = Math.ceil(committeeTasks.length / itemsPerPage);

  const handleControlPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= controlTotalPages) setControlPage(newPage);
  };

  const handleCommitteePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= committeeTotalPages) setCommitteePage(newPage);
  };

  const showTaskDetails = (task, type) => {
    const html = type === 'control' ? `
      <p><strong>วันที่:</strong> ${formatThaiDate(task.date)}</p>
      <p><strong>เวลา:</strong> ${task.time || '-'}</p>
      <p><strong>เรื่อง:</strong> ${task.title || '-'}</p>
      <p><strong>สถานะ:</strong> ${task.status}</p>
    ` : `
      <p><strong>วันที่:</strong> ${task.taskId ? formatThaiDate(task.taskId.date) : '-'}</p>
      <p><strong>เวลาเริ่ม:</strong> ${task.startTime ? new Date(task.startTime).toLocaleTimeString('th-TH', { hour12: false }) : '-'}</p>
      <p><strong>เวลาเสร็จ:</strong> ${task.endTime ? new Date(task.endTime).toLocaleTimeString('th-TH', { hour12: false }) : '-'}</p>
      <p><strong>เรื่อง:</strong> ${task.taskId?.title || '-'}</p>
      <p><strong>สถานะ:</strong> ${task.status || '-'}</p>
      <p><strong>หมายเหตุ:</strong> ${task.notes || '-'}</p>
    `;
    Swal.fire({
      title: 'รายละเอียด',
      html,
      confirmButtonText: 'ตกลง',
      allowOutsideClick: false
    });
  };

  const clearData = async (type) => {
    const result = await Swal.fire({
      title: `ยืนยันการล้างข้อมูล${type === 'control' ? 'ส่วนควบคุม' : 'ส่วนคณะกรรมการ'}?`,
      text: 'ข้อมูลทั้งหมดจะถูกลบออกจากระบบ',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ล้างเลย!',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        if (type === 'control') {
          await axios.delete('https://tasknews-backend.onrender.com/api/tasks', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setControlTasks([]);
          setControlPage(1);
        } else if (type === 'committee') {
          await axios.delete('https://tasknews-backend.onrender.com/api/committee', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCommitteeTasks([]);
          setCommitteePage(1);
        }
        Swal.fire('สำเร็จ!', 'ข้อมูลถูกลบเรียบร้อย', 'success');
        await fetchData();
      } catch (err) {
        Swal.fire('เกิดข้อผิดพลาด!', `ไม่สามารถล้างข้อมูลได้: ${err.response?.data?.message || err.message}`, 'error');
      }
    }
  };

  const filteredControlTasks = filterTasks(
    controlTasks.filter(task => filter === 'ทั้งหมด' || task.status === filter),
    searchTerm
  );
  const filteredCommitteeTasks = filterCommitteeTasks(
    committeeTasks.filter(task => filter === 'ทั้งหมด' || task.status === filter),
    searchTerm
  );
  const paginatedControlTasks = getPaginatedData(filteredControlTasks, controlPage);
  const paginatedCommitteeTasks = getPaginatedData(filteredCommitteeTasks, committeePage);

  return (
    <div className="container">
      <h1>รายงานผลการปฏิบัติ</h1>
      <div className="controls">
        <select onChange={(e) => setFilter(e.target.value)} value={filter}>
          <option value="ทั้งหมด">ทั้งหมด</option>
          <option value="ตามเวลา">ตามเวลา</option>
          <option value="เริ่มเมื่อพร้อม">เริ่มเมื่อพร้อม</option>
          <option value="รอฟัง">รอฟัง</option>
        </select>
        <input
          type="text"
          placeholder="ค้นหา..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <section className="task-section desktop-only">
        <h2>
          ศูนย์ควบคุมบ่งการส่วนหน้า
          {user.role === 'admin' && (
            <button className="btn btn-delete" onClick={() => clearData('control')}>
              ล้างข้อมูล
            </button>
          )}
        </h2>
        <div className="table-wrapper">
          <table className="desktop-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เวลา</th>
                <th>เรื่อง</th>
                <th>การปฏิบัติ</th>
              </tr>
            </thead>
            <tbody>
              {paginatedControlTasks.length === 0 ? (
                <tr><td colSpan="4">ไม่มีงานในขณะนี้</td></tr>
              ) : (
                paginatedControlTasks.map(task => (
                  <tr
                    key={task._id}
                    className={`status-${task.status}`}
                    onClick={() => showTaskDetails(task, 'control')}
                  >
                    <td>{formatThaiDate(task.date)}</td>
                    <td>{task.time || '-'}</td>
                    <td>{task.title || '-'}</td>
                    <td>{task.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button
            onClick={() => handleControlPageChange(controlPage - 1)}
            disabled={controlPage === 1}
          >
            ก่อนหน้า
          </button>
          <span>หน้า {controlPage} / {controlTotalPages}</span>
          <button
            onClick={() => handleControlPageChange(controlPage + 1)}
            disabled={controlPage === controlTotalPages}
          >
            ถัดไป
          </button>
        </div>
      </section>

      <section className="task-section">
        <h2>
          ลำดับการปฏิบัติของกรรมการ
          {user.role === 'admin' && (
            <button className="btn btn-delete" onClick={() => clearData('committee')}>
              ล้างข้อมูล
            </button>
          )}
        </h2>
        <div className="table-wrapper">
          <table className="desktop-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เวลาเริ่มต้น</th>
                <th>เวลาสิ้นสุด</th>
                <th>เรื่อง</th>
                <th>การปฎิบัติ</th>
                <th>สถานะการดำเนินการ</th>
                <th>รายงานผลการปฏิบัติ</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCommitteeTasks.length === 0 ? (
                <tr><td colSpan="7">ไม่มีงานในขณะนี้</td></tr>
              ) : (
                paginatedCommitteeTasks.map(task => {
                  const isActive = task.startTime && !task.endTime;
                  return (
                    <tr
                      key={task._id}
                      className={`${isActive ? 'blink' : ''} status-${task.status}`}
                      onClick={() => showTaskDetails(task, 'committee')}
                    >
                      <td>{task.taskId ? formatThaiDate(task.taskId.date) : '-'}</td>
                      <td>{task.startTime ? new Date(task.startTime).toLocaleTimeString('th-TH', { hour12: false }) : '-'}</td>
                      <td>{task.endTime ? new Date(task.endTime).toLocaleTimeString('th-TH', { hour12: false }) : '-'}</td>
                      <td>{task.taskId?.title || '-'}</td>
                      <td>{task.status || '-'}</td>
                      <td>{task.startTime ? (task.endTime ? 'ปฏิบัติเสร็จสิ้น' : 'กำลังปฏิบัติ') : '-'}</td>
                      <td>{task.notes || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="mobile-cards">
            {paginatedCommitteeTasks.length === 0 ? (
              <div className="no-data">ไม่มีงานในขณะนี้</div>
            ) : (
              paginatedCommitteeTasks.map(task => {
                const isActive = task.startTime && !task.endTime;
                return (
                  <div
                    key={task._id}
                    className={`card ${isActive ? 'blink' : ''} status-${task.status}`}
                    onClick={() => showTaskDetails(task, 'committee')}
                  >
                    <div className="card-item">
                      <span className="card-label">วันที่:</span>
                      <span>{task.taskId ? formatThaiDate(task.taskId.date) : '-'}</span>
                    </div>
                    <div className="card-item">
                      <span className="card-label">เวลาเริ่มต้น:</span>
                      <span>{task.startTime ? new Date(task.startTime).toLocaleTimeString('th-TH', { hour12: false }) : '-'}</span>
                    </div>
                    <div className="card-item">
                      <span className="card-label">เวลาสิ้นสุด:</span>
                      <span>{task.endTime ? new Date(task.endTime).toLocaleTimeString('th-TH', { hour12: false }) : '-'}</span>
                    </div>
                    <div className="card-item">
                      <span className="card-label">เรื่อง:</span>
                      <span>{task.taskId?.title || '-'}</span>
                    </div>
                    <div className="card-item">
                      <span className="card-label">การปฏิบัติ:</span>
                      <span>{task.status || '-'}</span>
                    </div>
                    <div className="card-item">
                      <span className="card-label">สถานะการดำเนินการ:</span>
                      <span>{task.startTime ? (task.endTime ? 'ปฏิบัติเสร็จสิ้น' : 'กำลังปฏิบัติ') : '-'}</span>
                    </div>
                    <div className="card-item">
                      <span className="card-label">รายงานผลการปฏิบัติ:</span>
                      <span>{task.notes || '-'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="pagination">
          <button
            onClick={() => handleCommitteePageChange(committeePage - 1)}
            disabled={committeePage === 1}
          >
            ก่อนหน้า
          </button>
          <span>หน้า {committeePage} / {committeeTotalPages}</span>
          <button
            onClick={() => handleCommitteePageChange(committeePage + 1)}
            disabled={committeePage === committeeTotalPages}
          >
            ถัดไป
          </button>
        </div>
      </section>
    </div>
  );
}

export default DisplaySection;