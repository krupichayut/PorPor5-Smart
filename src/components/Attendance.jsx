import { useState } from 'react';
import { Calendar, Plus, Check, X, Clock, FileText, Trash2, Star } from 'lucide-react';

export default function Attendance({ students, activeClassId, classes, attendance, setAttendance }) {
  const [newDate, setNewDate] = useState('');
  const [isHoliday, setIsHoliday] = useState(false);
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
    
    // Add default 'present' or 'holiday' for all students on this date if they don't have a record
    const newRecords = [...attendance];
    
    classStudents.forEach(student => {
      const exists = newRecords.find(r => r.studentId === student.id && r.date === newDate);
      if (!exists) {
        newRecords.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          classId: activeClassId,
          studentId: student.id,
          date: newDate,
          status: isHoliday ? 'holiday' : 'present' // present, absent, late, leave, holiday
        });
      }
    });
    
    setAttendance(newRecords);
    setIsModalOpen(false);
    setNewDate('');
    setIsHoliday(false);
  };

  const handleDeleteDate = (dateToDelete) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลการเช็คชื่อของวันที่ ${new Date(dateToDelete).toLocaleDateString('th-TH')}?`)) {
      setAttendance(attendance.filter(a => !(a.classId === activeClassId && a.date === dateToDelete)));
    }
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
      case 'holiday': return <div className="badge" style={{ backgroundColor: '#fef08a', color: '#854d0e' }}><Star size={14} style={{ marginRight: '4px' }}/> วันหยุด</div>;
      default: return null;
    }
  };

  const cycleStatus = (currentStatus) => {
    // If it's a holiday, let it cycle out to present just in case they want to override a specific student on a holiday.
    const statuses = ['present', 'absent', 'late', 'leave', 'holiday'];
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
                  <th style={{ width: '60px', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: 'var(--bg-tertiary)', zIndex: 2 }}>เลขที่</th>
                  <th style={{ position: 'sticky', left: '60px', backgroundColor: 'var(--bg-tertiary)', zIndex: 2, minWidth: '200px' }}>ชื่อ - นามสกุล</th>
                  {dates.map(date => (
                    <th key={date} style={{ textAlign: 'center', minWidth: '100px', position: 'relative' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span>{new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                        <button 
                          onClick={() => handleDeleteDate(date)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', opacity: 0.7, padding: '2px' }}
                          title="ลบวันที่นี้"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', minWidth: '60px', backgroundColor: '#f1f5f9' }}>เต็ม</th>
                  <th style={{ textAlign: 'center', minWidth: '60px', color: '#10b981', backgroundColor: '#ecfdf5' }}>มา</th>
                  <th style={{ textAlign: 'center', minWidth: '60px', color: '#64748b', backgroundColor: '#f1f5f9' }}>ลา</th>
                  <th style={{ textAlign: 'center', minWidth: '60px', color: '#ef4444', backgroundColor: '#fef2f2' }}>ขาด</th>
                  <th style={{ textAlign: 'center', minWidth: '60px', color: '#f59e0b', backgroundColor: '#fffbeb' }}>สาย</th>
                  <th style={{ textAlign: 'center', minWidth: '80px', backgroundColor: '#f8fafc' }}>ร้อยละ %</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => {
                  const presentCount = classAttendance.filter(a => a.studentId === s.id && a.status === 'present').length;
                  const leaveCount = classAttendance.filter(a => a.studentId === s.id && a.status === 'leave').length;
                  const absentCount = classAttendance.filter(a => a.studentId === s.id && a.status === 'absent').length;
                  const lateCount = classAttendance.filter(a => a.studentId === s.id && a.status === 'late').length;
                  const holidayCount = classAttendance.filter(a => a.studentId === s.id && a.status === 'holiday').length;
                  
                  const totalDays = dates.length;
                  // In Thai schools, late and holidays are counted as present for the final attended count
                  const actualAttended = presentCount + lateCount + holidayCount; 
                  const percentage = totalDays > 0 ? Math.round((actualAttended / totalDays) * 100) : 0;
                  
                  return (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1, borderRight: '1px solid var(--border-color)' }}>{index + 1}</td>
                      <td style={{ fontWeight: 500, position: 'sticky', left: '60px', backgroundColor: 'white', zIndex: 1, borderRight: '1px solid var(--border-color)' }}>{s.name}</td>
                      {dates.map(date => {
                        const record = classAttendance.find(a => a.studentId === s.id && a.date === date);
                        return (
                          <td key={date} style={{ textAlign: 'center', padding: '0.25rem' }}>
                            <button 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', justifyContent: 'center', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                              onClick={() => handleUpdateStatus(s.id, date, cycleStatus(record?.status || 'present'))}
                              title="คลิกเพื่อเปลี่ยนสถานะ"
                            >
                              {getStatusIcon(record?.status || 'present')}
                            </button>
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: 600, backgroundColor: '#f1f5f9' }}>{totalDays}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#10b981', backgroundColor: '#ecfdf5' }} title={`มา ${presentCount} วัน, วันหยุด ${holidayCount} วัน`}>{presentCount + holidayCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9' }}>{leaveCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#ef4444', backgroundColor: '#fef2f2' }}>{absentCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#f59e0b', backgroundColor: '#fffbeb' }}>{lateCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: percentage < 80 ? '#ef4444' : 'var(--primary-color)', backgroundColor: '#f8fafc' }}>
                        {percentage}%
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
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem' }}>
                <input 
                  type="checkbox" 
                  id="isHoliday"
                  checked={isHoliday}
                  onChange={(e) => setIsHoliday(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="isHoliday" style={{ margin: 0, cursor: 'pointer', fontWeight: 500 }}>
                  กำหนดให้เป็นวันหยุดพิเศษ (ทุกคนจะได้สถานะ "วันหยุด" และถือว่ามาเรียน)
                </label>
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
