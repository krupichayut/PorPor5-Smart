import { useState } from 'react';
import { Award, Plus, Trash2, Calculator, Edit2 } from 'lucide-react';

export default function Scores({ students, activeClassId, classes, scores, setScores, scoreColumns, setScoreColumns, indicators, readOnly }) {
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnMax, setNewColumnMax] = useState(10);
  const [newColumnIndicatorId, setNewColumnIndicatorId] = useState('');
  const [newColumnType, setNewColumnType] = useState('collected'); // 'collected' or 'exam'
  const [newColumnTerm, setNewColumnTerm] = useState('all'); // '1', '2', 'all'
  
  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  
  const classScoreColumns = scoreColumns.filter(c => c.classId === activeClassId);
  const classIndicators = indicators ? indicators.filter(i => i.classId === activeClassId) : [];
  
  // Calculate max possible raw scores
  const totalMaxCollected = classScoreColumns.filter(c => c.type !== 'exam').reduce((sum, col) => sum + col.maxScore, 0);
  const totalMaxExam = classScoreColumns.filter(c => c.type === 'exam').reduce((sum, col) => sum + col.maxScore, 0);

  // Class Ratios
  const collectedRatio = activeClass?.collectedRatio || 80;
  const examRatio = activeClass?.examRatio || 20;

  // Flatten indicators for dropdown
  const allIndicatorsList = [];
  classIndicators.forEach(unit => {
    unit.items.forEach(item => {
      allIndicatorsList.push({ ...item, unitName: unit.name });
    });
  });

  const handleOpenAddModal = () => {
    setEditingColumnId(null);
    setNewColumnName('');
    setNewColumnMax(10);
    setNewColumnIndicatorId('');
    setNewColumnType('collected');
    setNewColumnTerm('all');
    setIsColumnModalOpen(true);
  };

  const handleOpenEditModal = (col) => {
    setEditingColumnId(col.id);
    setNewColumnName(col.name);
    setNewColumnMax(col.maxScore);
    setNewColumnIndicatorId(col.indicatorId || '');
    setNewColumnType(col.type || 'collected');
    setNewColumnTerm(col.term || 'all');
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = (e) => {
    e.preventDefault();
    if (!newColumnName.trim() || newColumnMax <= 0) return;
    
    if (editingColumnId) {
      setScoreColumns(scoreColumns.map(col => 
        col.id === editingColumnId 
          ? { ...col, name: newColumnName, maxScore: Number(newColumnMax), indicatorId: newColumnIndicatorId || null, type: newColumnType, term: newColumnTerm }
          : col
      ));
    } else {
      const newCol = {
        id: Date.now().toString(),
        classId: activeClassId,
        name: newColumnName,
        maxScore: Number(newColumnMax),
        indicatorId: newColumnIndicatorId || null,
        type: newColumnType,
        term: newColumnTerm
      };
      setScoreColumns([...scoreColumns, newCol]);
    }
    
    setIsColumnModalOpen(false);
  };

  const handleScoreChange = (studentId, columnId, value) => {
    if (readOnly) return;
    const numValue = value === '' ? '' : Number(value);
    
    const column = scoreColumns.find(c => c.id === columnId);
    if (numValue !== '' && numValue > column.maxScore) {
      alert(`คะแนนต้องไม่เกิน ${column.maxScore}`);
      return;
    }
    if (numValue !== '' && numValue < 0) return;

    const existingIndex = scores.findIndex(s => s.studentId === studentId && s.columnId === columnId);
    
    let newScores = [...scores];
    if (existingIndex >= 0) {
      if (value === '') {
        newScores.splice(existingIndex, 1);
      } else {
        newScores[existingIndex] = { ...newScores[existingIndex], score: numValue };
      }
    } else if (value !== '') {
      newScores.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        studentId,
        columnId,
        score: numValue
      });
    }
    
    setScores(newScores);
  };

  const handleDeleteColumn = (columnId) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบช่องคะแนนนี้? ข้อมูลคะแนนทั้งหมดในช่องนี้จะหายไป')) {
      setScoreColumns(scoreColumns.filter(c => c.id !== columnId));
      setScores(scores.filter(s => s.columnId !== columnId));
    }
  };

  const calculateStudentScores = (studentId) => {
    let rawCollected = 0;
    let rawExam = 0;

    classScoreColumns.forEach(col => {
      const record = scores.find(s => s.studentId === studentId && s.columnId === col.id);
      if (record) {
        if (col.type === 'exam') {
          rawExam += record.score;
        } else {
          rawCollected += record.score;
        }
      }
    });

    // Scale calculations
    let scaledCollected = 0;
    if (totalMaxCollected > 0) {
      scaledCollected = (rawCollected / totalMaxCollected) * collectedRatio;
    }

    let scaledExam = 0;
    if (totalMaxExam > 0) {
      scaledExam = (rawExam / totalMaxExam) * examRatio;
    }

    const totalScaled = scaledCollected + scaledExam;

    return {
      rawCollected,
      rawExam,
      totalRaw: rawCollected + rawExam,
      scaledCollected: Number(scaledCollected.toFixed(2)),
      scaledExam: Number(scaledExam.toFixed(2)),
      totalScaled: Math.round(totalScaled) // Round to nearest integer for final grade
    };
  };

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">บันทึกคะแนน</h2>
            <p className="page-subtitle">บันทึกคะแนนเก็บและสอบ พร้อมระบบแปลงสัดส่วนอัตโนมัติ</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <Award size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">บันทึกคะแนน: {activeClass?.name}</h2>
          <p className="page-subtitle">จัดการคะแนนเก็บและคะแนนสอบ</p>
        </div>
        {!readOnly && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            เพิ่มช่องคะแนน
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
            <Calculator size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>สรุปคะแนนเก็บดิบ (สัดส่วน {collectedRatio})</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>คะแนนเต็มรวม {totalMaxCollected} คะแนน</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: 'var(--radius-md)' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>สรุปคะแนนสอบดิบ (สัดส่วน {examRatio})</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>คะแนนเต็มรวม {totalMaxExam} คะแนน</div>
          </div>
        </div>
      </div>

      <div className="card">
        {classStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <p>ยังไม่มีข้อมูลนักเรียนในห้องนี้ กรุณาเพิ่มนักเรียนก่อน</p>
          </div>
        ) : classScoreColumns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <Award size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>ยังไม่มีช่องกรอกคะแนน {!readOnly && 'กรุณากดปุ่ม "เพิ่มช่องคะแนน"'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ width: '60px', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: 'var(--bg-tertiary)', zIndex: 1, verticalAlign: 'middle' }}>เลขที่</th>
                  <th rowSpan={2} style={{ position: 'sticky', left: '60px', backgroundColor: 'var(--bg-tertiary)', zIndex: 1, verticalAlign: 'middle' }}>ชื่อ - นามสกุล</th>
                  {classScoreColumns.map(col => {
                    const indicator = allIndicatorsList.find(i => i.id === col.indicatorId);
                    return (
                      <th rowSpan={2} key={col.id} style={{ textAlign: 'center', minWidth: '100px', backgroundColor: col.type === 'exam' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <div>
                            <div>{col.name}</div>
                            {indicator && <div style={{ fontSize: '0.7rem', color: 'var(--primary-color)' }}>{indicator.code}</div>}
                            <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                              {col.type === 'exam' ? '(สอบ)' : '(เก็บ)'} เต็ม {col.maxScore}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--primary-color)', marginTop: '2px', backgroundColor: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                              {col.term === '1' ? 'เทอม 1' : col.term === '2' ? 'เทอม 2' : 'ตลอดปี'}
                            </div>
                          </div>
                          {!readOnly && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <button className="btn-icon" style={{ padding: '2px', color: 'var(--text-muted)' }} onClick={() => handleOpenEditModal(col)}>
                                <Edit2 size={12} />
                              </button>
                              <button className="btn-icon" style={{ padding: '2px', color: 'var(--danger-color)', opacity: 0.5 }} onClick={() => handleDeleteColumn(col.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th colSpan={3} style={{ textAlign: 'center', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)' }}>คะแนนที่แปลงสัดส่วนแล้ว (Scaled)</th>
                </tr>
                <tr>
                  <th style={{ textAlign: 'center', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', fontSize: '0.875rem' }}>เก็บ ({collectedRatio})</th>
                  <th style={{ textAlign: 'center', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', fontSize: '0.875rem' }}>สอบ ({examRatio})</th>
                  <th style={{ textAlign: 'center', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)', fontSize: '0.875rem' }}>รวม 100</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => {
                  const studentScores = calculateStudentScores(s.id);
                  return (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', position: 'sticky', left: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 1 }}>{index + 1}</td>
                      <td style={{ fontWeight: 500, position: 'sticky', left: '60px', backgroundColor: 'var(--bg-secondary)', zIndex: 1 }}>{s.name}</td>
                      {classScoreColumns.map(col => {
                        const record = scores.find(record => record.studentId === s.id && record.columnId === col.id);
                        return (
                          <td key={col.id} style={{ textAlign: 'center', backgroundColor: col.type === 'exam' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                            <input 
                              type="number"
                              min="0"
                              max={col.maxScore}
                              value={record ? record.score : ''}
                              onChange={(e) => handleScoreChange(s.id, col.id, e.target.value)}
                              disabled={readOnly}
                              style={{ 
                                width: '60px', 
                                padding: '4px', 
                                textAlign: 'center', 
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                fontFamily: 'inherit'
                              }}
                            />
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#4f46e5', backgroundColor: 'var(--bg-primary)' }}>
                        <div title={`ดิบ: ${studentScores.rawCollected}/${totalMaxCollected}`}>{studentScores.scaledCollected}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#f87171', backgroundColor: 'var(--bg-primary)' }}>
                        <div title={`ดิบ: ${studentScores.rawExam}/${totalMaxExam}`}>{studentScores.scaledExam}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-color)', backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                        {studentScores.totalScaled}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isColumnModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingColumnId ? 'แก้ไขช่องคะแนน' : 'เพิ่มช่องคะแนน'}</h3>
              <button className="btn-icon" onClick={() => setIsColumnModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveColumn}>
              <div className="form-group">
                <label className="form-label">ประเภทคะแนน</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="scoreType" 
                      value="collected" 
                      checked={newColumnType === 'collected'}
                      onChange={() => setNewColumnType('collected')}
                    />
                    คะแนนเก็บ
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="scoreType" 
                      value="exam" 
                      checked={newColumnType === 'exam'}
                      onChange={() => setNewColumnType('exam')}
                    />
                    คะแนนสอบ
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ภาคเรียน</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="scoreTerm" 
                      value="all" 
                      checked={newColumnTerm === 'all'}
                      onChange={() => setNewColumnTerm('all')}
                    />
                    ตลอดปี / ใช้ร่วมกัน
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="scoreTerm" 
                      value="1" 
                      checked={newColumnTerm === '1'}
                      onChange={() => setNewColumnTerm('1')}
                    />
                    เทอม 1
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="scoreTerm" 
                      value="2" 
                      checked={newColumnTerm === '2'}
                      onChange={() => setNewColumnTerm('2')}
                    />
                    เทอม 2
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">ชื่อช่องคะแนน (เช่น สอบกลางภาค, ชิ้นงานที่ 1)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">ผูกกับตัวชี้วัด (ไม่บังคับ)</label>
                <select 
                  className="form-select"
                  value={newColumnIndicatorId}
                  onChange={(e) => setNewColumnIndicatorId(e.target.value)}
                >
                  <option value="">-- ไม่ระบุตัวชี้วัด --</option>
                  {allIndicatorsList.map(ind => (
                    <option key={ind.id} value={ind.id}>
                      {ind.code} ({ind.unitName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">คะแนนเต็มดิบ (Raw Max Score)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={newColumnMax}
                  onChange={(e) => setNewColumnMax(Number(e.target.value))}
                  min="1"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsColumnModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={!newColumnName.trim() || newColumnMax <= 0}>
                  {editingColumnId ? 'บันทึกการแก้ไข' : 'เพิ่มช่องคะแนน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
