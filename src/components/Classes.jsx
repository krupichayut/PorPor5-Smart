import { useState } from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';

export default function Classes({ classes, setClasses, activeClassId, setActiveClassId, readOnly }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newCollectedRatio, setNewCollectedRatio] = useState(80);
  const [newExamRatio, setNewExamRatio] = useState(20);

  const handleAddClass = (e) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassSubject.trim()) return;
    if (Number(newCollectedRatio) + Number(newExamRatio) !== 100) {
      alert('สัดส่วนคะแนนเก็บและคะแนนสอบรวมกันต้องเท่ากับ 100');
      return;
    }

    const newClass = {
      id: Date.now().toString(),
      name: newClassName,
      subject: newClassSubject,
      collectedRatio: Number(newCollectedRatio),
      examRatio: Number(newExamRatio),
      studentCount: 0
    };

    setClasses([...classes, newClass]);
    setNewClassName('');
    setNewClassSubject('');
    setNewCollectedRatio(80);
    setNewExamRatio(20);
    setIsModalOpen(false);
  };

  const handleDeleteClass = (id) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบห้องเรียนนี้? ข้อมูลนักเรียนทั้งหมดในห้องนี้จะถูกลบไปด้วย')) {
      setClasses(classes.filter(c => c.id !== id));
      if (activeClassId === id) {
        setActiveClassId(null);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">จัดการห้องเรียน</h2>
          <p className="page-subtitle">จัดการห้องเรียนและรายวิชาทั้งหมด</p>
        </div>
        {!readOnly && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            เพิ่มห้องเรียน
          </button>
        )}
      </div>

      <div className="card">
        {classes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>ยังไม่มีข้อมูลห้องเรียน</p>
            {!readOnly && (
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setIsModalOpen(true)}>
                เพิ่มห้องเรียนแรกของคุณ
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ห้องเรียน / ชั้น</th>
                  <th>รายวิชา</th>
                  <th style={{ textAlign: 'center' }}>สัดส่วน (เก็บ : สอบ)</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c.id} style={{ backgroundColor: activeClassId === c.id ? 'var(--primary-light)' : 'transparent' }}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>{c.subject}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
                        {c.collectedRatio || 80} : {c.examRatio || 20}
                      </span>
                    </td>
                    <td>
                      {activeClassId === c.id ? (
                        <span className="badge badge-success">กำลังเลือกทำงาน</span>
                      ) : (
                        <button 
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => setActiveClassId(c.id)}
                        >
                          เลือกห้องนี้
                        </button>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!readOnly && (
                        <button className="btn-icon" onClick={() => handleDeleteClass(c.id)} style={{ color: 'var(--danger-color)' }}>
                          <Trash2 size={18} />
                        </button>
                      )}
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
              <h3 className="modal-title">เพิ่มห้องเรียนใหม่</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddClass}>
              <div className="form-group">
                <label className="form-label">ชื่อห้องเรียน / ชั้น (เช่น ม.4/1, ป.5/2)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="เช่น ม.4/1"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">รายวิชา (เช่น คณิตศาสตร์เพิ่มเติม, วิทยาศาสตร์)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                  placeholder="เช่น คณิตศาสตร์เพิ่มเติม"
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ gridColumn: 'span 2', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>ตั้งค่าสัดส่วนคะแนน (ต้องรวมได้ 100)</div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">คะแนนเก็บ</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newCollectedRatio}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewCollectedRatio(val);
                      setNewExamRatio(100 - val);
                    }}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">คะแนนสอบ</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newExamRatio}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewExamRatio(val);
                      setNewCollectedRatio(100 - val);
                    }}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={!newClassName.trim() || !newClassSubject.trim()}>บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
