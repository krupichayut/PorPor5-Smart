import { useState } from 'react';
import { BookOpen, Plus, Trash2, Search, CheckCircle2 } from 'lucide-react';

export default function Classes({ classes, setClasses, activeClassId, setActiveClassId, readOnly }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newMidtermWeight, setNewMidtermWeight] = useState(10);
  const [newFinalWeight, setNewFinalWeight] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClass = (e) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassSubject.trim()) return;
    if (Number(newMidtermWeight) + Number(newFinalWeight) >= 100) {
      alert('น้ำหนักคะแนนสอบรวมกันต้องไม่เกิน 100 (เผื่อน้ำหนักให้คะแนนเก็บด้วย)');
      return;
    }

    const newClass = {
      id: Date.now().toString(),
      name: newClassName,
      subject: newClassSubject,
      midtermWeight: Number(newMidtermWeight),
      finalWeight: Number(newFinalWeight),
      studentCount: 0
    };

    setClasses([...classes, newClass]);
    setNewClassName('');
    setNewClassSubject('');
    setNewMidtermWeight(10);
    setNewFinalWeight(10);
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
    <div className="animate-fade-in class-gallery">
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

      <div className="card class-gallery-shell">
        {classes.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={64} className="empty-state-icon" />
            <h3>ยังไม่มีข้อมูลห้องเรียน</h3>
            <p>คุณสามารถเริ่มต้นใช้งานระบบได้โดยการสร้างห้องเรียนและรายวิชาแรกของคุณ</p>
            {!readOnly && (
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setIsModalOpen(true)}>
                <Plus size={18} />
                เพิ่มห้องเรียนแรกของคุณ
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="studio-list-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="ค้นหาชื่อห้องเรียน หรือ รายวิชา..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                แสดง {filteredClasses.length} จาก {classes.length} รายการ
              </div>
            </div>

            {filteredClasses.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                <Search size={48} className="empty-state-icon" style={{ opacity: 0.3 }} />
                <h3>ไม่พบห้องเรียน</h3>
                <p>ไม่มีห้องเรียนที่ตรงกับ "{searchTerm}"</p>
              </div>
            ) : (
              <div className="table-container class-gallery-table">
                <table className="table">
              <thead>
                <tr>
                  <th>ห้องเรียน / ชั้น</th>
                  <th>รายวิชา</th>
                  <th style={{ textAlign: 'center' }}>สอบกลางภาค</th>
                  <th style={{ textAlign: 'center' }}>สอบปลายภาค</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map(c => (
                  <tr key={c.id} style={{ backgroundColor: activeClassId === c.id ? 'var(--primary-light)' : 'transparent' }}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>{c.subject}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        {c.midtermWeight ?? 10} คะแนน
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                        {c.finalWeight ?? 10} คะแนน
                      </span>
                    </td>
                    <td>
                      {activeClassId === c.id ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> กำลังเลือกทำงาน
                        </span>
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
          </>
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
                <div style={{ gridColumn: 'span 2', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>ตั้งค่าน้ำหนักคะแนนสอบ (คะแนนเก็บจะคิดจากผลรวมของหน่วยการเรียนรู้)</div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">น้ำหนักสอบกลางภาค</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newMidtermWeight}
                    onChange={(e) => setNewMidtermWeight(Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">น้ำหนักสอบปลายภาค</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newFinalWeight}
                    onChange={(e) => setNewFinalWeight(Number(e.target.value))}
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
