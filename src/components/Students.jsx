import { useState } from 'react';
import { Users, Plus, Trash2, Edit } from 'lucide-react';

export default function Students({ students, setStudents, activeClassId, classes }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addMode, setAddMode] = useState('single');
  const [bulkData, setBulkData] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editNumber, setEditNumber] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [editName, setEditName] = useState('');
  
  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);

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

  const handleBulkAdd = (e) => {
    e.preventDefault();
    if (!bulkData.trim() || !activeClassId) return;

    const lines = bulkData.split('\n');
    let currentNumber = classStudents.length + 1;
    const newStudents = [];
    const timestamp = Date.now();

    lines.forEach((line, idx) => {
      // split by tab or multiple spaces
      const parts = line.split(/\t| {2,}/);
      if (parts.length >= 2) {
        const sid = parts[0].trim();
        const sname = parts[1].trim();
        if (sid && sname) {
          newStudents.push({
            id: `${timestamp}-${idx}`,
            classId: activeClassId,
            studentId: sid,
            name: sname,
            number: currentNumber++
          });
        }
      } else if (parts.length === 1 && parts[0].trim()) {
         const sname = parts[0].trim();
         newStudents.push({
            id: `${timestamp}-${idx}`,
            classId: activeClassId,
            studentId: `TMP${currentNumber}`,
            name: sname,
            number: currentNumber++
          });
      }
    });

    if (newStudents.length > 0) {
      setStudents([...students, ...newStudents]);
      setIsModalOpen(false);
      setBulkData('');
    } else {
      alert("ไม่พบข้อมูลที่ถูกต้อง กรุณาตรวจสอบรูปแบบ (รหัสประจำตัว [Tab] ชื่อ-นามสกุล)");
    }
  };

  const handleDeleteStudent = (id) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบนักเรียนคนนี้?')) {
      // Re-calculate numbers after deletion to keep them sequential if desired
      const newStudentsList = students.filter(s => s.id !== id);
      setStudents(newStudentsList);
    }
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setEditNumber(student.number);
    setEditStudentId(student.studentId);
    setEditName(student.name);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editStudentId.trim() || !editName.trim() || !editNumber) return;

    const updatedStudents = students.map(s => {
      if (s.id === editingStudent.id) {
        return {
          ...s,
          studentId: editStudentId,
          name: editName,
          number: Number(editNumber)
        };
      }
      return s;
    });

    setStudents(updatedStudents);
    setIsEditModalOpen(false);
    setEditingStudent(null);
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
                {classStudents.map((s) => (
                  <tr key={s.id}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>{s.number}</td>
                    <td>{s.studentId}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={() => handleEditClick(s)} style={{ color: 'var(--primary-color)', marginRight: '0.5rem' }}>
                        <Edit size={18} />
                      </button>
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
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">เพิ่มรายชื่อนักเรียน</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <button 
                type="button"
                style={{ flex: 1, padding: '0.75rem', background: 'none', border: 'none', borderBottom: addMode === 'single' ? '2px solid var(--primary-color)' : '2px solid transparent', color: addMode === 'single' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: addMode === 'single' ? 600 : 400, cursor: 'pointer' }}
                onClick={() => setAddMode('single')}
              >
                เพิ่มทีละคน
              </button>
              <button 
                type="button"
                style={{ flex: 1, padding: '0.75rem', background: 'none', border: 'none', borderBottom: addMode === 'bulk' ? '2px solid var(--primary-color)' : '2px solid transparent', color: addMode === 'bulk' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: addMode === 'bulk' ? 600 : 400, cursor: 'pointer' }}
                onClick={() => setAddMode('bulk')}
              >
                เพิ่มหลายคน (ก๊อปปี้จาก Excel)
              </button>
            </div>

            {addMode === 'single' ? (
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
            ) : (
              <form onSubmit={handleBulkAdd}>
                <div className="form-group">
                  <label className="form-label">วางข้อมูลรายชื่อนักเรียน (ลากคลุมจาก Excel แล้ว Paste ลงที่นี่ได้เลย)</label>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    * รูปแบบ: <strong>รหัสประจำตัว</strong> [ช่องว่าง/Tab] <strong>ชื่อ-นามสกุล</strong> (ถ้ามีแต่ชื่อ ระบบจะสร้างรหัสชั่วคราวให้)
                  </div>
                  <textarea 
                    className="form-input" 
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder="12345    เด็กชายเอ รักเรียน&#10;12346    เด็กหญิงบี ขยัน"
                    rows="8"
                    autoFocus
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary" disabled={!bulkData.trim()}>เพิ่มรายชื่อทั้งหมด</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">แก้ไขข้อมูลนักเรียน</h3>
              <button className="btn-icon" onClick={() => setIsEditModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">เลขที่</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">รหัสประจำตัวนักเรียน</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editStudentId}
                  onChange={(e) => setEditStudentId(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">ชื่อ - นามสกุล</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกการแก้ไข</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
