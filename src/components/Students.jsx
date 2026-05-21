import { useState } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';

export default function Students({ students, setStudents, activeClassId, classes }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  
  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId);

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!newStudentId.trim() || !newStudentName.trim() || !activeClassId) return;

    const newStudent = {
      id: Date.now().toString(),
      classId: activeClassId,
      studentId: newStudentId, // เลขประจำตัว
      name: newStudentName,
      number: classStudents.length + 1 // เลขที่รันตามลำดับที่เพิ่ม
    };

    setStudents([...students, newStudent]);
    setNewStudentId('');
    setNewStudentName('');
    setIsModalOpen(false);
  };

  const handleDeleteStudent = (id) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบนักเรียนคนนี้?')) {
      // Re-calculate numbers after deletion to keep them sequential if desired
      const newStudentsList = students.filter(s => s.id !== id);
      setStudents(newStudentsList);
    }
  };

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">จัดการนักเรียน</h2>
            <p className="page-subtitle">เพิ่ม แก้ไข ลบ รายชื่อนักเรียน</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">จัดการนักเรียน: {activeClass?.name}</h2>
          <p className="page-subtitle">วิชา {activeClass?.subject} • จำนวนนักเรียน {classStudents.length} คน</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          เพิ่มนักเรียน
        </button>
      </div>

      <div className="card">
        {classStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>ยังไม่มีข้อมูลนักเรียนในห้องนี้</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setIsModalOpen(true)}>
              เพิ่มนักเรียนคนแรก
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>เลขที่</th>
                  <th>รหัสประจำตัว</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th style={{ textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => (
                  <tr key={s.id}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td>{s.studentId}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={() => handleDeleteStudent(s.id)} style={{ color: 'var(--danger-color)' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">เพิ่มรายชื่อนักเรียน</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label className="form-label">เลขประจำตัวนักเรียน</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  placeholder="เช่น 12345"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">ชื่อ - นามสกุล</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="เช่น เด็กชายรักเรียน ขยันยิ่ง"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={!newStudentId.trim() || !newStudentName.trim()}>เพิ่มนักเรียน</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
