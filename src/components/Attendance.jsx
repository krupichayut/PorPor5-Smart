import { useState } from 'react';
import { Calendar, Plus, Check, X, Clock, FileText } from 'lucide-react';

export default function Attendance({ students, activeClassId, classes, attendance, setAttendance }) {
  const [newDate, setNewDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  
  // Filter attendance records for current class
  const classAttendance = attendance.filter(a => a.classId === activeClassId);
  
  // Get unique dates
  const dates = [...new Set(classAttendance.map(a => a.date))].sort();

  const handleAddDate = (e) => {
    e.preventDefault();
    if (!newDate) return;
    
    // Add default 'present' for all students on this date if they don't have a record
    const newRecords = [...attendance];
    
    classStudents.forEach(student => {
      const exists = newRecords.find(r => r.studentId === student.id && r.date === newDate);
      if (!exists) {
        newRecords.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          classId: activeClassId,
          studentId: student.id,
          date: newDate,
          status: 'present' // present, absent, late, leave
        });
      }
    });
    
    setAttendance(newRecords);
    setIsModalOpen(false);
    setNewDate('');
  };

  const handleUpdateStatus = (studentId, date, status) => {
    const updatedRecords = attendance.map(record => {
      if (record.studentId === studentId && record.date === date) {
        return { ...record, status };
      }
      return record;
    });
    setAttendance(updatedRecords);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'present': return <div className="badge badge-success"><Check size={14} style={{ marginRight: '4px' }}/> มา</div>;
      case 'absent': return <div className="badge badge-danger"><X size={14} style={{ marginRight: '4px' }}/> ขาด</div>;
      case 'late': return <div className="badge badge-warning"><Clock size={14} style={{ marginRight: '4px' }}/> สาย</div>;
      case 'leave': return <div className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}><FileText size={14} style={{ marginRight: '4px' }}/> ลา</div>;
      default: return null;
    }
  };

  const cycleStatus = (currentStatus) => {
    const statuses = ['present', 'absent', 'late', 'leave'];
    const currentIndex = statuses.indexOf(currentStatus);
    return statuses[(currentIndex + 1) % statuses.length];
  };

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">เช็คเวลาเรียน</h2>
            <p className="page-subtitle">บันทึกการ มา ขาด ลา สาย</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">เช็คเวลาเรียน: {activeClass?.name}</h2>
          <p className="page-subtitle">คลิกที่สถานะในตารางเพื่อเปลี่ยน (มา &rarr; ขาด &rarr; สาย &rarr; ลา)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          เพิ่มวันเช็คชื่อ
        </button>
      </div>

      <div className="card">
        {classStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <p>ยังไม่มีข้อมูลนักเรียนในห้องนี้ กรุณาเพิ่มนักเรียนก่อนทำการเช็คชื่อ</p>
          </div>
        ) : dates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>ยังไม่มีการเช็คชื่อ กรุณากดปุ่ม "เพิ่มวันเช็คชื่อ"</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: 'var(--bg-tertiary)', zIndex: 1 }}>เลขที่</th>
                  <th style={{ position: 'sticky', left: '60px', backgroundColor: 'var(--bg-tertiary)', zIndex: 1 }}>ชื่อ - นามสกุล</th>
                  {dates.map(date => (
                    <th key={date} style={{ textAlign: 'center', minWidth: '120px' }}>
                      {new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </th>
                  ))}
                  <th style={{ textAlign: 'center' }}>รวมมาเรียน</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => {
                  const presentCount = classAttendance.filter(a => a.studentId === s.id && a.status === 'present').length;
                  const lateCount = classAttendance.filter(a => a.studentId === s.id && a.status === 'late').length;
                  const totalPresentStr = `${presentCount} (+${lateCount} สาย)`;
                  
                  return (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', position: 'sticky', left: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 1 }}>{index + 1}</td>
                      <td style={{ fontWeight: 500, position: 'sticky', left: '60px', backgroundColor: 'var(--bg-secondary)', zIndex: 1 }}>{s.name}</td>
                      {dates.map(date => {
                        const record = classAttendance.find(a => a.studentId === s.id && a.date === date);
                        return (
                          <td key={date} style={{ textAlign: 'center' }}>
                            <button 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', justifyContent: 'center' }}
                              onClick={() => handleUpdateStatus(s.id, date, cycleStatus(record?.status || 'present'))}
                            >
                              {getStatusIcon(record?.status || 'present')}
                            </button>
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--primary-color)' }}>
                        {totalPresentStr}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">เพิ่มวันเช็คชื่อ</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddDate}>
              <div className="form-group">
                <label className="form-label">วันที่</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={!newDate}>เพิ่มวันที่</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
