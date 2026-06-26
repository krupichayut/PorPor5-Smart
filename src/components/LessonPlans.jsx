import { useState } from 'react';
import { ClipboardList, Plus, Trash2, Pencil, Upload, CheckSquare, Square, FileEdit, Check } from 'lucide-react';

export default function LessonPlans({ activeClassId, classes, lessonPlans, setLessonPlans, readOnly }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const [editingPlanId, setEditingPlanId] = useState(null);
  
  const [week, setWeek] = useState('');
  const [topic, setTopic] = useState('');
  const [hours, setHours] = useState(1);
  
  const [importText, setImportText] = useState('');
  
  const [postRecord, setPostRecord] = useState('');

  const activeClass = classes.find(c => c.id === activeClassId);
  const classPlans = lessonPlans.filter(p => p.classId === activeClassId);

  // Sort by week assuming week might be a number or string like "1-2"
  // For simplicity, we just sort them by the order they were added (which is preserved in array) or try to parse week.
  // We will leave them in the order they are in the array for now.

  const handleAddPlan = (e) => {
    e.preventDefault();
    if (!week.trim() || !topic.trim()) return;

    if (editingPlanId) {
      setLessonPlans(lessonPlans.map(p => 
        p.id === editingPlanId ? { ...p, week, topic, hours: Number(hours) } : p
      ));
    } else {
      const newPlan = {
        // eslint-disable-next-line react-hooks/purity
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        classId: activeClassId,
        week,
        topic,
        hours: Number(hours),
        isTaught: false,
        postRecord: ''
      };
      setLessonPlans([...lessonPlans, newPlan]);
    }

    closeAddModal();
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setEditingPlanId(null);
    setWeek('');
    setTopic('');
    setHours(1);
  };

  const openEditModal = (plan) => {
    setEditingPlanId(plan.id);
    setWeek(plan.week);
    setTopic(plan.topic);
    setHours(plan.hours);
    setIsAddModalOpen(true);
  };

  const handleDelete = (planId) => {
    if (confirm('แน่ใจหรือไม่ว่าต้องการลบแผนการสอนนี้?')) {
      setLessonPlans(lessonPlans.filter(p => p.id !== planId));
    }
  };

  const handleToggleTaught = (planId, currentStatus) => {
    if (readOnly) return;
    setLessonPlans(lessonPlans.map(p => 
      p.id === planId ? { ...p, isTaught: !currentStatus } : p
    ));
  };

  const handleImport = (e) => {
    e.preventDefault();
    if (!importText.trim()) return;

    const rows = importText.split('\n');
    const newPlans = [];
    rows.forEach(row => {
      if (!row.trim()) return;
      const cols = row.split('\t');
      if (cols.length >= 2) {
        newPlans.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          classId: activeClassId,
          week: cols[0].trim(),
          topic: cols[1].trim(),
          hours: cols[2] ? Number(cols[2].trim()) : 1,
          isTaught: false,
          postRecord: ''
        });
      }
    });

    setLessonPlans([...lessonPlans, ...newPlans]);
    setIsImportModalOpen(false);
    setImportText('');
  };

  const openRecordModal = (plan) => {
    setEditingPlanId(plan.id);
    setPostRecord(plan.postRecord || '');
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = (e) => {
    e.preventDefault();
    setLessonPlans(lessonPlans.map(p => 
      p.id === editingPlanId ? { ...p, postRecord } : p
    ));
    setIsRecordModalOpen(false);
    setEditingPlanId(null);
    setPostRecord('');
  };

  const totalHours = classPlans.reduce((sum, p) => sum + Number(p.hours || 0), 0);
  const taughtHours = classPlans.filter(p => p.isTaught).reduce((sum, p) => sum + Number(p.hours || 0), 0);

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">แผนการสอนและบันทึกหลังสอน</h2>
            <p className="page-subtitle">จัดการตารางแผนการสอน เช็คสถานะการสอน และบันทึกหลังสอน</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <ClipboardList size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">แผนการสอน: {activeClass?.subject}</h2>
          <p className="page-subtitle">
            ชั้น {activeClass?.name} • สอนแล้ว {taughtHours} / {totalHours} ชั่วโมง
          </p>
        </div>
        {!readOnly && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsImportModalOpen(true)}>
              <Upload size={18} />
              นำเข้าจาก Excel
            </button>
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={18} />
              เพิ่มแผนการสอน
            </button>
          </div>
        )}
      </div>

      <div className="card">
        {classPlans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <ClipboardList size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>ยังไม่มีข้อมูลแผนการสอน {!readOnly && 'กรุณากด "เพิ่มแผนการสอน" หรือ "นำเข้าจาก Excel"'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>สอนแล้ว</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>สัปดาห์ที่</th>
                  <th>เนื้อหา / หัวข้อที่สอน</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>ชั่วโมง</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>บันทึกหลังสอน</th>
                  {!readOnly && <th style={{ width: '100px', textAlign: 'center' }}>จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {classPlans.map((plan) => (
                  <tr key={plan.id} style={{ backgroundColor: plan.isTaught ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                    <td style={{ textAlign: 'center', cursor: readOnly ? 'default' : 'pointer' }} onClick={() => handleToggleTaught(plan.id, plan.isTaught)}>
                      {plan.isTaught ? (
                        <CheckSquare size={20} color="#10b981" />
                      ) : (
                        <Square size={20} color="var(--text-muted)" />
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>{plan.week}</td>
                    <td style={{ fontWeight: 500, color: plan.isTaught ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {plan.topic}
                    </td>
                    <td style={{ textAlign: 'center' }}>{plan.hours}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className={`btn-icon ${plan.postRecord ? 'has-record' : ''}`} 
                        onClick={() => openRecordModal(plan)}
                        title={plan.postRecord ? 'แก้ไขบันทึกหลังสอน' : 'เขียนบันทึกหลังสอน'}
                        style={{ color: plan.postRecord ? 'var(--primary-color)' : 'var(--text-muted)' }}
                      >
                        {plan.postRecord ? <Check size={18} /> : <FileEdit size={18} />}
                        {plan.postRecord && <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>มีบันทึก</span>}
                      </button>
                    </td>
                    {!readOnly && (
                      <td style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button className="btn-icon" style={{ color: 'var(--primary-color)' }} onClick={() => openEditModal(plan)}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn-icon" style={{ color: 'var(--danger-color)' }} onClick={() => handleDelete(plan.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingPlanId ? 'แก้ไขแผนการสอน' : 'เพิ่มแผนการสอน'}</h3>
              <button className="btn-icon" onClick={closeAddModal}>×</button>
            </div>
            <form onSubmit={handleAddPlan}>
              <div className="form-group">
                <label className="form-label">สัปดาห์ที่ (เช่น 1, 1-2)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">เนื้อหา / หัวข้อที่สอน</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">จำนวนชั่วโมง</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeAddModal}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">{editingPlanId ? 'บันทึกการแก้ไข' : 'เพิ่มแผนการสอน'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">นำเข้าแผนการสอนจาก Excel</h3>
              <button className="btn-icon" onClick={() => setIsImportModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleImport}>
              <div className="form-group">
                <label className="form-label">
                  คัดลอกข้อมูล 3 คอลัมน์จาก Excel (สัปดาห์ที่, เนื้อหา, จำนวนชั่วโมง) มาวางที่นี่
                </label>
                <textarea 
                  className="form-input" 
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows="8"
                  placeholder="1&#9;ปฐมนิเทศ / โครงสร้างวิชา&#9;2&#10;2&#9;การบวกและการลบ&#9;2&#10;3&#9;การคูณและการหาร&#9;4"
                  required
                  autoFocus
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  * ข้อมูลแต่ละคอลัมน์จะถูกเว้นด้วย Tab อัตโนมัติเวลา Copy มาจาก Excel หรือ Word
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsImportModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={!importText.trim()}>นำเข้าข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Modal */}
      {isRecordModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">บันทึกหลังสอน</h3>
              <button className="btn-icon" onClick={() => setIsRecordModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveRecord}>
              <div className="form-group">
                <label className="form-label">บันทึกผลการจัดการเรียนรู้ ปัญหา/อุปสรรค และแนวทางแก้ไข</label>
                <textarea 
                  className="form-input" 
                  value={postRecord}
                  onChange={(e) => setPostRecord(e.target.value)}
                  rows="10"
                  placeholder="นักเรียนส่วนใหญ่เข้าใจเนื้อหา มีนักเรียน 2 คนที่ยังสับสนเรื่อง... ได้ทำการสอนเสริมหลังเลิกเรียนแล้ว"
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRecordModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกข้อความ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
