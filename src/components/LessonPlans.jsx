import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, Pencil, Upload, CheckSquare, Square, FileEdit, Check, Printer } from 'lucide-react';
import PrintPostTeachingRecord from './PrintPostTeachingRecord';

export default function LessonPlans({ activeClassId, classes, lessonPlans, setLessonPlans, readOnly, appSettings }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const [editingPlanId, setEditingPlanId] = useState(null);
  const [printingPlan, setPrintingPlan] = useState(null);
  
  const [week, setWeek] = useState('');
  const [topic, setTopic] = useState('');
  const [hours, setHours] = useState(1);
  
  const [importText, setImportText] = useState('');
  
  const [recordData, setRecordData] = useState({
    date: '', k: '', p: '', a: '', problems: '', passedCount: '', passedPercent: '', failedCount: '', failedPercent: '', failedNames: ''
  });

  const activeClass = classes.find(c => c.id === activeClassId);
  const classPlans = lessonPlans.filter(p => p.classId === activeClassId);

  useEffect(() => {
    if (printingPlan) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printingPlan]);

  useEffect(() => {
    const handleAfterPrint = () => setPrintingPlan(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

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
    if (typeof plan.postRecord === 'object' && plan.postRecord !== null) {
      setRecordData({
        date: plan.postRecord.date || '',
        k: plan.postRecord.k || '',
        p: plan.postRecord.p || '',
        a: plan.postRecord.a || '',
        problems: plan.postRecord.problems || '',
        passedCount: plan.postRecord.passedCount || '',
        passedPercent: plan.postRecord.passedPercent || '',
        failedCount: plan.postRecord.failedCount || '',
        failedPercent: plan.postRecord.failedPercent || '',
        failedNames: plan.postRecord.failedNames || ''
      });
    } else {
      setRecordData({
        date: '', k: '', p: '', a: '',
        problems: typeof plan.postRecord === 'string' ? plan.postRecord : '',
        passedCount: '', passedPercent: '', failedCount: '', failedPercent: '', failedNames: ''
      });
    }
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = (e) => {
    e.preventDefault();
    setLessonPlans(lessonPlans.map(p => 
      p.id === editingPlanId ? { ...p, postRecord: recordData } : p
    ));
    setIsRecordModalOpen(false);
    setEditingPlanId(null);
  };

  const handleRecordChange = (e) => {
    setRecordData({
      ...recordData,
      [e.target.name]: e.target.value
    });
  };

  const handlePrint = (plan) => {
    setPrintingPlan(plan);
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
        <div className="empty-state">
          <ClipboardList size={48} />
          <h3>ไม่มีการเลือกห้องเรียน</h3>
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header no-print">
        <div>
          <h2 className="page-title">แผนการสอน: {activeClass?.subject}</h2>
          <p className="page-subtitle">
            ชั้น {activeClass?.name} • สอนแล้ว {taughtHours} / {totalHours} ชั่วโมง
          </p>
        </div>
        {!readOnly && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload size={18} />นำเข้าจาก Excel
            </button>
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={18} />เพิ่มแผนการสอน
            </button>
          </div>
        )}
      </div>

      <div className="hairline-cell no-print">
        {classPlans.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} />
            <h3>ไม่พบข้อมูลแผนการสอน</h3>
            <p>{!readOnly ? 'กรุณากด "เพิ่มแผนการสอน" หรือ "นำเข้าจาก Excel"' : 'ยังไม่มีข้อมูล'}</p>
          </div>
        ) : (
            <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
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
                  <tr key={plan.id} style={{ backgroundColor: plan.isTaught ? 'var(--bg-tertiary)' : 'transparent' }}>
                    <td style={{ textAlign: 'center', cursor: readOnly ? 'default' : 'pointer' }} onClick={() => handleToggleTaught(plan.id, plan.isTaught)}>
                      {plan.isTaught ? (
                        <CheckSquare size={20} color="var(--success)" />
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
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button 
                          className={`btn-icon ${plan.postRecord ? 'has-record' : ''}`} 
                          onClick={() => openRecordModal(plan)}
                          title={plan.postRecord ? 'แก้ไขบันทึกหลังสอน' : 'เขียนบันทึกหลังสอน'}
                          aria-label={plan.postRecord ? 'แก้ไขบันทึกหลังสอน' : 'เขียนบันทึกหลังสอน'}
                          style={{ color: plan.postRecord ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
                        >
                          {plan.postRecord ? <Check size={18} /> : <FileEdit size={18} />}
                        </button>
                        {plan.postRecord && (
                          <button 
                            className="btn-icon" 
                            onClick={() => handlePrint(plan)}
                            title="พิมพ์บันทึก"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <Printer size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                    {!readOnly && (
                      <td style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button className="btn-icon" style={{ color: 'var(--accent-cyan)' }} onClick={() => openEditModal(plan)} aria-label="แก้ไขแผนการสอน">
                          <Pencil size={16} />
                        </button>
                        <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(plan.id)} aria-label="ลบแผนการสอน">
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
        <div className="modal-overlay no-print">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingPlanId ? 'แก้ไขแผนการสอน' : 'เพิ่มแผนการสอน'}</h3>
              <button type="button" className="btn-icon" onClick={closeAddModal} aria-label="ปิด">×</button>
            </div>
            <form onSubmit={handleAddPlan}>
              <div className="form-group">
                <label className="form-label">สัปดาห์ที่ (เช่น 1, 1-2)</label>
                <input 
                  type="text" 
                  className="form-control" 
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
                  className="form-control" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">จำนวนชั่วโมง</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeAddModal}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">{editingPlanId ? 'บันทึกการแก้ไข' : 'เพิ่มแผนการสอน'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="modal-overlay no-print">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">นำเข้าแผนการสอนจาก Excel</h3>
              <button type="button" className="btn-icon" onClick={() => setIsImportModalOpen(false)} aria-label="ปิด">×</button>
            </div>
            <form onSubmit={handleImport}>
              <div className="form-group">
                <label className="form-label">
                  คัดลอกข้อมูล 3 คอลัมน์จาก Excel (สัปดาห์ที่, เนื้อหา, จำนวนชั่วโมง) มาวางที่นี่
                </label>
                <textarea 
                  className="form-control" 
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows="8"
                  placeholder="1&#9;ปฐมนิเทศ / โครงสร้างวิชา&#9;2&#10;2&#9;การบวกและการลบ&#9;2&#10;3&#9;การคูณและการหาร&#9;4"
                  required
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsImportModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={!importText.trim()}>นำเข้าข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Modal */}
      {isRecordModalOpen && (
        <div className="modal-overlay no-print">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">บันทึกผลหลังการสอน (รูปแบบราชการ)</h3>
              <button type="button" className="btn-icon" onClick={() => setIsRecordModalOpen(false)} aria-label="ปิด">×</button>
            </div>
            <form onSubmit={handleSaveRecord}>
              
              <div className="form-group">
                <label className="form-label">วันที่สอน (สำหรับแสดงในเอกสาร)</label>
                <input type="date" name="date" className="form-control" value={recordData.date} onChange={handleRecordChange} required />
              </div>

              <div className="hairline-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">จำนวนนักเรียนที่ผ่าน (คน)</label>
                  <input type="number" name="passedCount" className="form-control" value={recordData.passedCount} onChange={handleRecordChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">คิดเป็นร้อยละ</label>
                  <input type="number" name="passedPercent" className="form-control" value={recordData.passedPercent} onChange={handleRecordChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">จำนวนนักเรียนที่ไม่ผ่าน (คน)</label>
                  <input type="number" name="failedCount" className="form-control" value={recordData.failedCount} onChange={handleRecordChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">คิดเป็นร้อยละ</label>
                  <input type="number" name="failedPercent" className="form-control" value={recordData.failedPercent} onChange={handleRecordChange} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">รายชื่อนักเรียนที่ไม่ผ่าน (คนละ 1 บรรทัด)</label>
                <textarea name="failedNames" className="form-control" rows="3" value={recordData.failedNames} onChange={handleRecordChange} placeholder="เด็กชายสมมติ รักเรียน&#10;เด็กหญิงสมศรี ดีใจ" />
              </div>

              <div className="form-group">
                <label className="form-label">๒. นักเรียนมีความรู้ความเข้าใจ (K)</label>
                <textarea name="k" className="form-control" rows="2" value={recordData.k} onChange={handleRecordChange} />
              </div>
              <div className="form-group">
                <label className="form-label">๓. นักเรียนมีความรู้เกิดทักษะ (P)</label>
                <textarea name="p" className="form-control" rows="2" value={recordData.p} onChange={handleRecordChange} />
              </div>
              <div className="form-group">
                <label className="form-label">๔. นักเรียนมีเจตคติ ค่านิยม คุณธรรมจริยธรรม (A)</label>
                <textarea name="a" className="form-control" rows="2" value={recordData.a} onChange={handleRecordChange} />
              </div>
              <div className="form-group">
                <label className="form-label">ปัญหา/อุปสรรค /แนวทางแก้ไข</label>
                <textarea name="problems" className="form-control" rows="3" value={recordData.problems} onChange={handleRecordChange} />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsRecordModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกข้อความ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invisible Print Layout */}
      {printingPlan && (
        <PrintPostTeachingRecord plan={printingPlan} appSettings={appSettings} activeClass={activeClass} />
      )}
    </div>
  );
}
