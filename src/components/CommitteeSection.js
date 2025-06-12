import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../styles.css';

const formatThaiDate = (date) => {
  if (!date) return '-';
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const d = new Date(date);
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
};

function CommitteeSection() {
  const [tasks, setTasks] = useState([]);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const committeeRes = await axios.get('http://localhost:5000/api/committee', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched tasks from /api/tasks:', res.data);
      console.log('Fetched committee tasks from /api/committee:', committeeRes.data);

      const committeeMap = new Map(committeeRes.data.map(ct => [ct.taskId?._id?.toString(), ct]));
      const activeTasks = res.data
        .map(task => {
          const committeeTask = committeeMap.get(task._id.toString());
          return {
            ...task,
            committeeId: committeeTask?._id || null,
            startTime: committeeTask?.startTime || null,
            endTime: committeeTask?.endTime || null,
            notes: committeeTask?.notes || null,
            isCompleted: committeeTask?.endTime ? true : false,
            from: task.from || '-',
            to: task.to || '-'
          };
        })
        .filter(task => !task.endTime)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // เรียงจากใหม่ไปเก่า

      setTasks(activeTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err.message, err.response?.data);
      Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถดึงข้อมูลได้', 'error');
    }
  };

  const startTask = async (task) => {
    try {
      const token = localStorage.getItem('token');
      let committeeId = task.committeeId;
      if (!committeeId) {
        const committeeTask = { taskId: task._id, startTime: new Date(), status: task.status };
        const res = await axios.post('http://localhost:5000/api/committee', committeeTask, {
          headers: { Authorization: `Bearer ${token}` }
        });
        committeeId = res.data._id;
      }

      setTimer(0);
      let localTimer = 0;
      const timerInterval = setInterval(() => {
        localTimer += 1;
        setTimer(localTimer);
      }, 1000);

      const swalTimer = Swal.fire({
        title: `${task.title}`,
        html: `<p>เวลา: <span id="swal-timer">${Math.floor(localTimer / 60)} นาที ${localTimer % 60} วินาที</span></p>`,
        showConfirmButton: true,
        confirmButtonText: 'ดำเนินการต่อ',
        allowOutsideClick: false,
        didOpen: () => {
          const timerElement = document.getElementById('swal-timer');
          const updateTimer = setInterval(() => {
            timerElement.textContent = `${Math.floor(localTimer / 60)} นาที ${localTimer % 60} วินาที`;
          }, 1000);
          Swal.getPopup().dataset.timerId = updateTimer;
        },
        willClose: () => {
          const updateTimer = Swal.getPopup().dataset.timerId;
          if (updateTimer) clearInterval(updateTimer);
          clearInterval(timerInterval);
        }
      });

      await swalTimer;
      await fetchTasks();
    } catch (err) {
      console.error('Error starting task:', err.message);
      Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถเริ่มงานได้', 'error');
    }
  };

  const endTask = async (taskId, committeeId) => {
    try {
      const token = localStorage.getItem('token');
      const { value: notes } = await Swal.fire({
        title: 'รายงานผลการปฏิบัติ',
        input: 'textarea',
        inputPlaceholder: 'บันทึกรายงาน',
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก',
        inputValidator: (value) => !value && 'กรุณากรอกรายงานผล!'
      });

      if (notes) {
        const updatedTask = { endTime: new Date(), notes };
        await axios.put(`http://localhost:5000/api/committee/${committeeId}`, updatedTask, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchTasks();
      }
    } catch (err) {
      console.error('Error ending task:', err.message);
      Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถจบภารกิจได้', 'error');
    }
  };

  return (
    <div className="container">
      <h1>ตารางลำดับการปฏิบัติ</h1>
      <button className="btn btn-refresh" onClick={fetchTasks}>รีเฟรชข้อมูล</button>
      <div className="tasks-container">
        {tasks.length === 0 ? (
          <p className="no-data">ไม่มีงานในขณะนี้</p>
        ) : (
          <>
            {/* ตารางสำหรับเดสก์ท็อป */}
            <div className="table-wrapper desktop-only">
              <table>
                <thead>
                  <tr>
                    <th className="col-date">วันที่</th>
                    <th className="col-time">เวลา</th>
                    <th className="col-from">จาก</th>
                    <th className="col-to">ถึง</th>
                    <th className="col-title">เรื่อง</th>  
                    <th className="col-status">สถานะ</th>
                    <th className="col-progress">สถานะการปฏิบัติ</th>
                    <th className="col-actions">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task._id} className={`status-${task.status}`}>
                      <td>{formatThaiDate(task.date)}</td>
                      <td>{task.time || '-'}</td>
                      <td>{task.from}</td>
                      <td>{task.to}</td>
                      <td>{task.title || '-'}</td>
                      <td>{task.status}</td>
                      <td>{task.startTime ? 'กำลังปฏิบัติ' : 'ยังไม่เริ่ม'}</td>
                      <td className="action-buttons">
                        {!task.startTime && (
                          <button className="btn btn-start" onClick={() => startTask(task)}>
                            เริ่ม
                          </button>
                        )}
                        {task.startTime && !task.endTime && (
                          <button className="btn btn-end" onClick={() => endTask(task._id, task.committeeId)}>
                            จบภารกิจ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* การ์ดสำหรับมือถือ */}
            <div className="card-container mobile-only">
              {tasks.map(task => (
                <div key={task._id} className={`task-card status-${task.status}`}>
                  <h3>{task.title || '-'}</h3>
                  <p><strong>วันที่:</strong> {formatThaiDate(task.date)}</p>
                  <p><strong>เวลา:</strong> {task.time || '-'}</p>
                  <p><strong>จาก:</strong> {task.from}</p>
                  <p><strong>ถึง:</strong> {task.to}</p>
                  <p><strong>สถานะ:</strong> {task.status}</p>
                  <p><strong>สถานะการปฏิบัติ:</strong> {task.startTime ? 'กำลังปฏิบัติ' : 'ยังไม่เริ่ม'}</p>
                  <div className="action-buttons">
                    {!task.startTime && (
                      <button className="btn btn-start" onClick={() => startTask(task)}>
                        เริ่ม
                      </button>
                    )}
                    {task.startTime && !task.endTime && (
                      <button className="btn btn-end" onClick={() => endTask(task._id, task.committeeId)}>
                        จบภารกิจ
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CommitteeSection;