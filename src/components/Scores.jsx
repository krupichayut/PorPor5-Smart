import { useState } from 'react';
import { Award, Plus, Trash2, Calculator, Edit2, Filter } from 'lucide-react';

export default function Scores({ students, activeClassId, classes, scores, setScores, scoreColumns, setScoreColumns, indicators, readOnly, studentPoints, setStudentPoints }) {
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnMax, setNewColumnMax] = useState(10);
  const [newColumnType, setNewColumnType] = useState('collected'); // 'collected', 'midterm', 'final'
  const [newColumnUnitId, setNewColumnUnitId] = useState('');
  const [newColumnIndicatorId, setNewColumnIndicatorId] = useState('');
  
  const [viewTerm, setViewTerm] = useState('1'); // '1', '2', 'all'
  const [viewUnit, setViewUnit] = useState('all'); // 'all', or unitId

  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  
  const classScoreColumns = scoreColumns.filter(c => c.classId === activeClassId);
  const classUnits = indicators ? indicators.filter(i => i.classId === activeClassId) : [];
  
  const midtermWeight = activeClass?.midtermWeight || 10;
  const finalWeight = activeClass?.finalWeight || 10;
  const totalUnitsWeight = classUnits.reduce((sum, u) => sum + u.weight, 0);
  const totalClassWeight = totalUnitsWeight + midtermWeight + finalWeight;

  const currentUnitIndicators = classUnits.find(u => u.id === newColumnUnitId)?.items || [];

  const handleOpenAddModal = () => {
    setEditingColumnId(null);
    setNewColumnName('');
    setNewColumnMax(10);
    setNewColumnType('collected');
    setNewColumnUnitId('');
    setNewColumnIndicatorId('');
    setIsColumnModalOpen(true);
  };

  const handleOpenEditModal = (col) => {
    setEditingColumnId(col.id);
    setNewColumnName(col.name);
    setNewColumnMax(col.maxScore);
    setNewColumnType(col.type || 'collected');
    setNewColumnUnitId(col.unitId || '');
    setNewColumnIndicatorId(col.indicatorId || '');
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = (e) => {
    e.preventDefault();
    if (!newColumnName.trim() || newColumnMax <= 0) return;
    if (newColumnType === 'collected' && !newColumnUnitId) {
      alert('กรุณาเลือกหน่วยการเรียนรู้');
      return;
    }
    
    if (editingColumnId) {
      setScoreColumns(scoreColumns.map(col => 
        col.id === editingColumnId 
          ? { 
              ...col, 
              name: newColumnName, 
              maxScore: Number(newColumnMax), 
              type: newColumnType,
              unitId: newColumnType === 'collected' ? newColumnUnitId : null,
              indicatorId: newColumnIndicatorId || null 
            }
          : col
      ));
    } else {
      const newCol = {
        id: Date.now().toString(),
        classId: activeClassId,
        name: newColumnName,
        maxScore: Number(newColumnMax),
        type: newColumnType,
        unitId: newColumnType === 'collected' ? newColumnUnitId : null,
        indicatorId: newColumnIndicatorId || null
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
    
    // --- Reward Points Calculation ---
    const oldScoreRecord = existingIndex >= 0 ? scores[existingIndex] : null;
    const oldAwardedPoints = oldScoreRecord?.awardedPoints || 0;
    
    let newAwardedPoints = 0;
    if (numValue !== '') {
      const percentage = (numValue / column.maxScore) * 100;
      if (percentage >= 100) newAwardedPoints = 5;
      else if (percentage >= 90) newAwardedPoints = 3;
      else if (percentage >= 80) newAwardedPoints = 2;
    }
    
    const pointsDiff = newAwardedPoints - oldAwardedPoints;
    if (pointsDiff !== 0 && studentPoints && setStudentPoints) {
      const spIndex = studentPoints.findIndex(sp => sp.studentId === studentId);
      let newStudentPoints = [...studentPoints];
      if (spIndex >= 0) {
        newStudentPoints[spIndex] = { ...newStudentPoints[spIndex], points: Math.max(0, newStudentPoints[spIndex].points + pointsDiff) };
      } else {
        newStudentPoints.push({
        // eslint-disable-next-line react-hooks/purity
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          studentId,
          points: Math.max(0, pointsDiff)
        });
      }
      setStudentPoints(newStudentPoints);
    }
    // ---------------------------------

    let newScores = [...scores];
    if (existingIndex >= 0) {
      if (value === '') {
        newScores.splice(existingIndex, 1);
      } else {
        newScores[existingIndex] = { ...newScores[existingIndex], score: numValue, awardedPoints: newAwardedPoints };
      }
    } else if (value !== '') {
      newScores.push({
        // eslint-disable-next-line react-hooks/purity
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        studentId,
        columnId,
        score: numValue,
        awardedPoints: newAwardedPoints
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

  // ----- Calculation Functions -----
  const getUnitScore = (studentId, unitId) => {
    const unitCols = classScoreColumns.filter(c => c.unitId === unitId && c.type === 'collected');
    const unitMaxRaw = unitCols.reduce((sum, col) => sum + col.maxScore, 0);
    const unitRaw = unitCols.reduce((sum, col) => {
      const s = scores.find(s => s.studentId === studentId && s.columnId === col.id);
      return sum + (s ? s.score : 0);
    }, 0);
    const unitWeight = classUnits.find(u => u.id === unitId)?.weight || 0;
    const scaled = unitMaxRaw > 0 ? (unitRaw / unitMaxRaw) * unitWeight : 0;
    return { raw: unitRaw, maxRaw: unitMaxRaw, weight: unitWeight, scaled: Number(scaled.toFixed(2)) };
  };

  const getExamScore = (studentId, type) => {
    const examCols = classScoreColumns.filter(c => c.type === type);
    const examMaxRaw = examCols.reduce((sum, col) => sum + col.maxScore, 0);
    const examRaw = examCols.reduce((sum, col) => {
      const s = scores.find(s => s.studentId === studentId && s.columnId === col.id);
      return sum + (s ? s.score : 0);
    }, 0);
    const examWeight = type === 'midterm' ? midtermWeight : finalWeight;
    const scaled = examMaxRaw > 0 ? (examRaw / examMaxRaw) * examWeight : 0;
    return { raw: examRaw, maxRaw: examMaxRaw, weight: examWeight, scaled: Number(scaled.toFixed(2)) };
  };

  const getGrade = (score) => {
    if (score >= 80) return '4.0';
    if (score >= 75) return '3.5';
    if (score >= 70) return '3.0';
    if (score >= 65) return '2.5';
    if (score >= 60) return '2.0';
    if (score >= 55) return '1.5';
    if (score >= 50) return '1.0';
    return '0';
  };

  const getGradeColor = (grade) => {
    switch(grade) {
      case '4.0': return '#10b981';
      case '3.5': return '#34d399';
      case '3.0': return '#3b82f6';
      case '2.5': return '#60a5fa';
      case '2.0': return '#f59e0b';
      case '1.5': return '#fbbf24';
      case '1.0': return '#f97316';
      case '0': return '#ef4444';
      default: return 'inherit';
    }
  };

  // Build the view structure
  const getUnitTerm = (u) => u.term || '1';
  
  let displayUnits = classUnits.filter(u => 
    viewTerm === 'all' || getUnitTerm(u) === viewTerm || getUnitTerm(u) === 'all'
  );
  
  if (viewUnit !== 'all') {
    displayUnits = displayUnits.filter(u => u.id === viewUnit);
  }

  const showMidterm = (viewTerm === '1' || viewTerm === 'all') && viewUnit === 'all';
  const showFinal = (viewTerm === '2' || viewTerm === 'all') && viewUnit === 'all';

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">บันทึกคะแนน</h2>
            <p className="page-subtitle">บันทึกคะแนนตามโครงสร้างหน่วยการเรียนรู้</p>
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
          <p className="page-subtitle">จัดการคะแนนเก็บตามหน่วยและคะแนนสอบ</p>
        </div>
        {!readOnly && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            เพิ่มช่องคะแนน
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--primary-color)', borderRadius: 'var(--radius-full)' }}>
            <Calculator size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>น้ำหนักคะแนนรวม (ที่ตั้งค่าไว้)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: totalClassWeight !== 100 ? 'var(--danger-color)' : 'var(--text-primary)' }}>
              {totalClassWeight} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>คะแนน</span> {totalClassWeight !== 100 && <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--danger-color)' }}>(ควรปรับให้ครบ 100)</span>}
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: '0', display: 'flex' }}>
          <div style={{ flex: 1, padding: '1.5rem', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} /> เลือกภาคเรียน
            </div>
            <select 
              className="form-select" 
              value={viewTerm}
              onChange={(e) => {
                setViewTerm(e.target.value);
                setViewUnit('all'); // Reset unit filter when term changes
              }}
            >
              <option value="1">เทอม 1 (หน่วย + กลางภาค)</option>
              <option value="2">เทอม 2 (หน่วย + ปลายภาค)</option>
              <option value="all">ทั้งปีการศึกษา</option>
            </select>
          </div>
          <div style={{ flex: 1, padding: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} /> เลือกแสดงผลระดับหน่วย
            </div>
            <select 
              className="form-select" 
              value={viewUnit}
              onChange={(e) => setViewUnit(e.target.value)}
            >
              <option value="all">แสดงทุกหน่วยในเทอมนี้ + สอบ</option>
              {classUnits
                .filter(u => viewTerm === 'all' || getUnitTerm(u) === viewTerm || getUnitTerm(u) === 'all')
                .map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {classStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <p>ยังไม่มีข้อมูลนักเรียนในห้องนี้ กรุณาเพิ่มนักเรียนก่อน</p>
          </div>
        ) : (
          <>
            {classUnits.length === 0 && (
              <div style={{ backgroundColor: 'var(--badge-warning-bg)', color: 'var(--warning-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Award size={24} />
                <div>
                  <strong>ยังไม่ได้สร้างหน่วยการเรียนรู้:</strong> หากต้องการเพิ่ม "ช่องคะแนนเก็บ" กรุณาไปสร้างหน่วยการเรียนรู้ที่เมนู <strong>โครงสร้างรายวิชา</strong> ก่อน
                </div>
              </div>
            )}
            <div className="table-container">
            <table className="table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ width: '60px', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: 'var(--bg-tertiary)', zIndex: 3, verticalAlign: 'middle' }}>เลขที่</th>
                  <th rowSpan={2} style={{ position: 'sticky', left: '60px', backgroundColor: 'var(--bg-tertiary)', zIndex: 3, verticalAlign: 'middle', minWidth: '150px' }}>ชื่อ - นามสกุล</th>
                  
                  {/* Unit Groups */}
                  {displayUnits.map(unit => {
                    const unitCols = classScoreColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
                    return (
                      <th key={unit.id} colSpan={Math.max(1, unitCols.length) + 1} style={{ textAlign: 'center', borderLeft: '2px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                        <div style={{ color: 'var(--primary-color)' }}>{unit.name}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>น้ำหนัก: {unit.weight} คะแนน</div>
                      </th>
                    );
                  })}
                  
                  {/* Exams Groups */}
                  {showMidterm && (
                    <th colSpan={Math.max(1, classScoreColumns.filter(c => c.type === 'midterm').length) + 1} style={{ textAlign: 'center', borderLeft: '2px solid var(--border-color)', backgroundColor: 'rgba(255, 23, 68, 0.15)' }}>
                      <div style={{ color: 'var(--danger-color)' }}>สอบกลางภาค</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>น้ำหนัก: {midtermWeight} คะแนน</div>
                    </th>
                  )}
                  {showFinal && (
                    <th colSpan={Math.max(1, classScoreColumns.filter(c => c.type === 'final').length) + 1} style={{ textAlign: 'center', borderLeft: '2px solid var(--border-color)', backgroundColor: 'rgba(255, 145, 0, 0.15)' }}>
                      <div style={{ color: 'var(--warning-color)' }}>สอบปลายภาค</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>น้ำหนัก: {finalWeight} คะแนน</div>
                    </th>
                  )}
                  
                  {/* Summary */}
                  <th rowSpan={2} style={{ textAlign: 'center', borderLeft: '2px solid var(--primary-color)', backgroundColor: 'rgba(0, 229, 255, 0.15)', color: 'var(--primary-color)', verticalAlign: 'middle' }}>
                    รวมเทอม {viewTerm !== 'all' ? viewTerm : 'ทั้งหมด'}
                  </th>
                  {viewTerm === 'all' && (
                    <th rowSpan={2} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', verticalAlign: 'middle', width: '60px' }}>
                      เกรด
                    </th>
                  )}
                </tr>
                <tr>
                  {/* Unit Columns */}
                  {displayUnits.map(unit => {
                    const unitCols = classScoreColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
                    const colsElements = unitCols.length > 0 ? unitCols.map(col => (
                      <th key={col.id} style={{ textAlign: 'center', minWidth: '80px', borderLeft: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontWeight: 'normal' }}>
                        <div>{col.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(เต็ม {col.maxScore})</div>
                        {!readOnly && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '4px' }}>
                            <button className="btn-icon" style={{ padding: '2px', color: 'var(--text-muted)' }} onClick={() => handleOpenEditModal(col)}><Edit2 size={12} /></button>
                            <button className="btn-icon" style={{ padding: '2px', color: 'var(--danger-color)', opacity: 0.5 }} onClick={() => handleDeleteColumn(col.id)}><Trash2 size={12} /></button>
                          </div>
                        )}
                      </th>
                    )) : [
                      <th key={`empty-${unit.id}`} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 'normal', fontStyle: 'italic', fontSize: '0.75rem' }}>
                        (ยังไม่มีช่อง)
                      </th>
                    ];

                    return [
                      ...colsElements,
                      <th key={`total-${unit.id}`} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', backgroundColor: 'rgba(99, 102, 241, 0.05)', color: 'var(--primary-color)' }}>
                        <div style={{ fontSize: '0.75rem' }}>แปลงแล้ว</div>
                        <div>(/{unit.weight})</div>
                      </th>
                    ];
                  })}

                  {/* Midterm Columns */}
                  {showMidterm && (() => {
                    const examCols = classScoreColumns.filter(c => c.type === 'midterm');
                    const colsElements = examCols.length > 0 ? examCols.map(col => (
                      <th key={col.id} style={{ textAlign: 'center', minWidth: '80px', borderLeft: '1px solid var(--border-color)', backgroundColor: 'rgba(239, 68, 68, 0.02)', fontWeight: 'normal' }}>
                        <div>{col.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(เต็ม {col.maxScore})</div>
                        {!readOnly && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '4px' }}>
                            <button className="btn-icon" style={{ padding: '2px', color: 'var(--text-muted)' }} onClick={() => handleOpenEditModal(col)}><Edit2 size={12} /></button>
                            <button className="btn-icon" style={{ padding: '2px', color: 'var(--danger-color)', opacity: 0.5 }} onClick={() => handleDeleteColumn(col.id)}><Trash2 size={12} /></button>
                          </div>
                        )}
                      </th>
                    )) : [
                      <th key="empty-midterm" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 'normal', fontStyle: 'italic', fontSize: '0.75rem' }}>
                        (ยังไม่มีช่อง)
                      </th>
                    ];

                    return [
                      ...colsElements,
                      <th key="total-midterm" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444' }}>
                        <div style={{ fontSize: '0.75rem' }}>แปลงแล้ว</div>
                        <div>(/{midtermWeight})</div>
                      </th>
                    ];
                  })()}

                  {/* Final Columns */}
                  {showFinal && (() => {
                    const examCols = classScoreColumns.filter(c => c.type === 'final');
                    const colsElements = examCols.length > 0 ? examCols.map(col => (
                      <th key={col.id} style={{ textAlign: 'center', minWidth: '80px', borderLeft: '1px solid var(--border-color)', backgroundColor: 'rgba(220, 38, 38, 0.02)', fontWeight: 'normal' }}>
                        <div>{col.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(เต็ม {col.maxScore})</div>
                        {!readOnly && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '4px' }}>
                            <button className="btn-icon" style={{ padding: '2px', color: 'var(--text-muted)' }} onClick={() => handleOpenEditModal(col)}><Edit2 size={12} /></button>
                            <button className="btn-icon" style={{ padding: '2px', color: 'var(--danger-color)', opacity: 0.5 }} onClick={() => handleDeleteColumn(col.id)}><Trash2 size={12} /></button>
                          </div>
                        )}
                      </th>
                    )) : [
                      <th key="empty-final" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 'normal', fontStyle: 'italic', fontSize: '0.75rem' }}>
                        (ยังไม่มีช่อง)
                      </th>
                    ];

                    return [
                      ...colsElements,
                      <th key="total-final" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', backgroundColor: 'rgba(220, 38, 38, 0.05)', color: '#dc2626' }}>
                        <div style={{ fontSize: '0.75rem' }}>แปลงแล้ว</div>
                        <div>(/{finalWeight})</div>
                      </th>
                    ];
                  })()}
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => {
                  let studentViewTotal = 0;
                  
                  return (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', position: 'sticky', left: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 2 }}>{index + 1}</td>
                      <td style={{ fontWeight: 500, position: 'sticky', left: '60px', backgroundColor: 'var(--bg-secondary)', zIndex: 2 }}>{s.name}</td>
                      
                      {/* Unit Cells */}
                      {displayUnits.map(unit => {
                        const unitCols = classScoreColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
                        const uScore = getUnitScore(s.id, unit.id);
                        studentViewTotal += uScore.scaled;
                        
                        const colsElements = unitCols.length > 0 ? unitCols.map(col => {
                          const record = scores.find(r => r.studentId === s.id && r.columnId === col.id);
                          return (
                            <td key={col.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                              <input 
                                type="number"
                                min="0"
                                max={col.maxScore}
                                value={record ? record.score : ''}
                                onChange={(e) => handleScoreChange(s.id, col.id, e.target.value)}
                                disabled={readOnly}
                                style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit' }}
                              />
                            </td>
                          );
                        }) : [
                          <td key={`empty-cell-${unit.id}`} style={{ borderLeft: '1px solid var(--border-color)' }}></td>
                        ];

                        return [
                          ...colsElements,
                          <td key={`total-cell-${unit.id}`} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', backgroundColor: 'rgba(99, 102, 241, 0.05)', fontWeight: 600, color: 'var(--primary-color)' }}>
                            <div title={`ดิบ: ${uScore.raw}/${uScore.maxRaw}`}>{Math.round(uScore.scaled)}</div>
                          </td>
                        ];
                      })}

                      {/* Midterm Cells */}
                      {showMidterm && (() => {
                        const examCols = classScoreColumns.filter(c => c.type === 'midterm');
                        const mScore = getExamScore(s.id, 'midterm');
                        studentViewTotal += mScore.scaled;

                        const colsElements = examCols.length > 0 ? examCols.map(col => {
                          const record = scores.find(r => r.studentId === s.id && r.columnId === col.id);
                          return (
                            <td key={col.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                              <input 
                                type="number"
                                min="0"
                                max={col.maxScore}
                                value={record ? record.score : ''}
                                onChange={(e) => handleScoreChange(s.id, col.id, e.target.value)}
                                disabled={readOnly}
                                style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit' }}
                              />
                            </td>
                          );
                        }) : [
                          <td key="empty-midterm-cell" style={{ borderLeft: '1px solid var(--border-color)' }}></td>
                        ];

                        return [
                          ...colsElements,
                          <td key="total-midterm-cell" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', backgroundColor: 'rgba(239, 68, 68, 0.05)', fontWeight: 600, color: '#ef4444' }}>
                            <div title={`ดิบ: ${mScore.raw}/${mScore.maxRaw}`}>{Math.round(mScore.scaled)}</div>
                          </td>
                        ];
                      })()}

                      {/* Final Cells */}
                      {showFinal && (() => {
                        const examCols = classScoreColumns.filter(c => c.type === 'final');
                        const fScore = getExamScore(s.id, 'final');
                        studentViewTotal += fScore.scaled;

                        const colsElements = examCols.length > 0 ? examCols.map(col => {
                          const record = scores.find(r => r.studentId === s.id && r.columnId === col.id);
                          return (
                            <td key={col.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                              <input 
                                type="number"
                                min="0"
                                max={col.maxScore}
                                value={record ? record.score : ''}
                                onChange={(e) => handleScoreChange(s.id, col.id, e.target.value)}
                                disabled={readOnly}
                                style={{ width: '50px', padding: '4px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit' }}
                              />
                            </td>
                          );
                        }) : [
                          <td key="empty-final-cell" style={{ borderLeft: '1px solid var(--border-color)' }}></td>
                        ];

                        return [
                          ...colsElements,
                          <td key="total-final-cell" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', backgroundColor: 'rgba(220, 38, 38, 0.05)', fontWeight: 600, color: '#dc2626' }}>
                            <div title={`ดิบ: ${fScore.raw}/${fScore.maxRaw}`}>{Math.round(fScore.scaled)}</div>
                          </td>
                        ];
                      })()}

                      {/* Summary Cell */}
                      <td style={{ textAlign: 'center', borderLeft: '2px solid var(--primary-color)', backgroundColor: 'rgba(99, 102, 241, 0.1)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-color)' }}>
                        {Math.round(studentViewTotal)}
                      </td>
                      {viewTerm === 'all' && (
                        <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', fontWeight: 'bold', fontSize: '1.1rem', color: getGradeColor(getGrade(Math.round(studentViewTotal))) }}>
                          {getGrade(Math.round(studentViewTotal))}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
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
                    คะแนนเก็บตามหน่วย
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="scoreType" 
                      value="midterm" 
                      checked={newColumnType === 'midterm'}
                      onChange={() => setNewColumnType('midterm')}
                    />
                    สอบกลางภาค
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="scoreType" 
                      value="final" 
                      checked={newColumnType === 'final'}
                      onChange={() => setNewColumnType('final')}
                    />
                    สอบปลายภาค
                  </label>
                </div>
              </div>

              {newColumnType === 'collected' && (
                <div className="form-group">
                  <label className="form-label">สังกัดหน่วยการเรียนรู้ (จำเป็น)</label>
                  {classUnits.length === 0 ? (
                    <div style={{ color: '#ef4444', fontSize: '0.875rem', padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                      ❌ ยังไม่มีหน่วยการเรียนรู้: กรุณาไปที่เมนู โครงสร้างรายวิชา เพื่อสร้างหน่วยการเรียนรู้ก่อนเพิ่มคะแนนเก็บ
                    </div>
                  ) : (
                    <select 
                      className="form-select"
                      value={newColumnUnitId}
                      onChange={(e) => {
                        setNewColumnUnitId(e.target.value);
                        setNewColumnIndicatorId('');
                      }}
                      required
                    >
                      <option value="">-- เลือกหน่วยการเรียนรู้ --</option>
                      {classUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} (น้ำหนัก {unit.weight})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">ชื่อช่องคะแนน (เช่น ชิ้นงานที่ 1, สมุดประจำตัว)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {newColumnType === 'collected' && newColumnUnitId && (
                <div className="form-group">
                  <label className="form-label">ผูกกับตัวชี้วัดในหน่วย (ไม่บังคับ)</label>
                  <select 
                    className="form-select"
                    value={newColumnIndicatorId}
                    onChange={(e) => setNewColumnIndicatorId(e.target.value)}
                  >
                    <option value="">-- ไม่ระบุตัวชี้วัด --</option>
                    {currentUnitIndicators.map(ind => (
                      <option key={ind.id} value={ind.id}>
                        {ind.code}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                <button type="submit" className="btn btn-primary" disabled={!newColumnName.trim() || newColumnMax <= 0 || (newColumnType === 'collected' && !newColumnUnitId)}>
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
