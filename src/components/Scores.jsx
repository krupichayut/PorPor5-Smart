import { useState, useMemo } from 'react';
import { Award, Plus, Trash2, Calculator, Edit2, Filter, Users } from 'lucide-react';
import { getGradeColor } from '../utils/scoring';

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
  
  const midtermWeight = activeClass?.midtermWeight ?? 10;
  const finalWeight = activeClass?.finalWeight ?? 10;
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
  const scoreMap = useMemo(() => new Map(scores.map(s => [`${s.studentId}_${s.columnId}`, s.score])), [scores]);

  const getUnitScore = (studentId, unitId) => {
    const unitCols = classScoreColumns.filter(c => c.unitId === unitId && c.type === 'collected');
    const unitMaxRaw = unitCols.reduce((sum, col) => sum + col.maxScore, 0);
    const unitRaw = unitCols.reduce((sum, col) => {
      const scoreVal = scoreMap.get(`${studentId}_${col.id}`);
      return sum + (scoreVal !== undefined && scoreVal !== null ? Number(scoreVal) : 0);
    }, 0);
    const unitWeight = classUnits.find(u => u.id === unitId)?.weight || 0;
    const scaled = unitMaxRaw > 0 ? (unitRaw / unitMaxRaw) * unitWeight : 0;
    return { raw: unitRaw, maxRaw: unitMaxRaw, weight: unitWeight, scaled: Number(scaled.toFixed(2)) };
  };

  const getExamScore = (studentId, type) => {
    const examCols = classScoreColumns.filter(c => c.type === type);
    const examMaxRaw = examCols.reduce((sum, col) => sum + col.maxScore, 0);
    const examRaw = examCols.reduce((sum, col) => {
      const scoreVal = scoreMap.get(`${studentId}_${col.id}`);
      return sum + (scoreVal !== undefined && scoreVal !== null ? Number(scoreVal) : 0);
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
        <div className="empty-state">
          <Award size={48} />
          <h3>ไม่มีการเลือกห้องเรียน</h3>
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ด้านบนก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in hairline-grid">
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

      <div className="gradebook-tools" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="hairline-cell gradebook-weight-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-cyan)' }}>
            <Calculator size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>น้ำหนักคะแนนรวม (ที่ตั้งค่าไว้)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: totalClassWeight !== 100 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {totalClassWeight} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>คะแนน</span> {totalClassWeight !== 100 && <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--danger)' }}>(ควรปรับให้ครบ 100)</span>}
            </div>
          </div>
        </div>
        <div className="hairline-cell gradebook-filter-card" style={{ padding: '0', display: 'flex' }}>
          <div style={{ flex: 1, padding: '1.5rem', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} /> เลือกภาคเรียน
            </div>
            <select 
              className="form-control" 
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
              className="form-control" 
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

      <div className="hairline-cell gradebook-table-card">
        {classStudents.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>ไม่พบข้อมูลนักเรียน</h3>
            <p>ยังไม่มีข้อมูลนักเรียนในห้องนี้ กรุณาเพิ่มนักเรียนก่อนทำการบันทึกคะแนน</p>
          </div>
        ) : (
          <>
            {classUnits.length === 0 && (
              <div style={{ color: 'var(--warning)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Award size={24} />
                <div>
                  <strong>ยังไม่ได้สร้างหน่วยการเรียนรู้:</strong> หากต้องการเพิ่ม "ช่องคะแนนเก็บ" กรุณาไปสร้างหน่วยการเรียนรู้ที่เมนู <strong>โครงสร้างรายวิชา</strong> ก่อน
                </div>
              </div>
            )}
            <div className="table-container gradebook-table-container">
            <table className="data-table gradebook-table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ width: '50px', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: 'var(--bg-surface-elevated)', zIndex: 3, verticalAlign: 'middle', borderRight: '1px solid var(--border-subtle)' }}>เลขที่</th>
                  <th rowSpan={2} style={{ position: 'sticky', left: '50px', backgroundColor: 'var(--bg-surface-elevated)', zIndex: 3, verticalAlign: 'middle', minWidth: '160px', borderRight: '1px solid var(--border-subtle)' }}>ชื่อ - นามสกุล</th>
                  
                  {/* Unit Groups */}
                  {displayUnits.map(unit => {
                    const unitCols = classScoreColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
                    return (
                      <th key={unit.id} colSpan={Math.max(1, unitCols.length) + 1} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{unit.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>น้ำหนัก: {unit.weight} คะแนน</div>
                      </th>
                    );
                  })}
                  
                  {/* Exams Groups */}
                  {showMidterm && (
                    <th colSpan={Math.max(1, classScoreColumns.filter(c => c.type === 'midterm').length) + 1} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                      <div style={{ color: 'var(--warning)', fontWeight: 600 }}>สอบกลางภาค</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>น้ำหนัก: {midtermWeight} คะแนน</div>
                    </th>
                  )}
                  {showFinal && (
                    <th colSpan={Math.max(1, classScoreColumns.filter(c => c.type === 'final').length) + 1} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                      <div style={{ color: 'var(--danger)', fontWeight: 600 }}>สอบปลายภาค</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>น้ำหนัก: {finalWeight} คะแนน</div>
                    </th>
                  )}
                  
                  {/* Summary */}
                  <th rowSpan={2} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', verticalAlign: 'middle' }}>
                    รวมเทอม {viewTerm !== 'all' ? viewTerm : 'ทั้งหมด'}
                  </th>
                  {viewTerm === 'all' && (
                    <th rowSpan={2} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', verticalAlign: 'middle', width: '60px' }}>
                      เกรด
                    </th>
                  )}
                </tr>
                <tr>
                  {/* Unit Columns */}
                  {displayUnits.map(unit => {
                    const unitCols = classScoreColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
                    const colsElements = unitCols.length > 0 ? unitCols.map(col => (
                      <th key={col.id} style={{ textAlign: 'center', minWidth: '70px', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)', fontWeight: 'normal' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{col.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({col.maxScore})</div>
                        {!readOnly && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '2px' }}>
                            <button className="btn-icon" aria-label="แก้ไข" style={{ padding: '2px', color: 'var(--text-muted)' }} onClick={() => handleOpenEditModal(col)}><Edit2 size={11} /></button>
                            <button className="btn-icon" aria-label="ลบ" style={{ padding: '2px', color: 'var(--danger)', opacity: 0.6 }} onClick={() => handleDeleteColumn(col.id)}><Trash2 size={11} /></button>
                          </div>
                        )}
                      </th>
                    )) : [
                      <th key={`empty-${unit.id}`} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: 'normal', fontStyle: 'italic', fontSize: '0.75rem' }}>
                        (ยังไม่มีช่อง)
                      </th>
                    ];

                    return [
                      ...colsElements,
                      <th key={`total-${unit.id}`} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.75rem' }}>
                        <div>แปลงแล้ว</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>({unit.weight})</div>
                      </th>
                    ];
                  })}

                  {/* Midterm Columns */}
                  {showMidterm && (() => {
                    const examCols = classScoreColumns.filter(c => c.type === 'midterm');
                    const colsElements = examCols.length > 0 ? examCols.map(col => (
                      <th key={col.id} style={{ textAlign: 'center', minWidth: '70px', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)', fontWeight: 'normal' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{col.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({col.maxScore})</div>
                        {!readOnly && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '2px' }}>
                            <button className="btn-icon" aria-label="แก้ไข" style={{ padding: '2px', color: 'var(--text-muted)' }} onClick={() => handleOpenEditModal(col)}><Edit2 size={11} /></button>
                            <button className="btn-icon" aria-label="ลบ" style={{ padding: '2px', color: 'var(--danger)', opacity: 0.6 }} onClick={() => handleDeleteColumn(col.id)}><Trash2 size={11} /></button>
                          </div>
                        )}
                      </th>
                    )) : [
                      <th key="empty-midterm" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: 'normal', fontStyle: 'italic', fontSize: '0.75rem' }}>
                        (ยังไม่มีช่อง)
                      </th>
                    ];

                    return [
                      ...colsElements,
                      <th key="total-midterm" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--warning)', fontSize: '0.75rem' }}>
                        <div>แปลงแล้ว</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>({midtermWeight})</div>
                      </th>
                    ];
                  })()}

                  {/* Final Columns */}
                  {showFinal && (() => {
                    const examCols = classScoreColumns.filter(c => c.type === 'final');
                    const colsElements = examCols.length > 0 ? examCols.map(col => (
                      <th key={col.id} style={{ textAlign: 'center', minWidth: '70px', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)', fontWeight: 'normal' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{col.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({col.maxScore})</div>
                        {!readOnly && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '2px' }}>
                            <button className="btn-icon" aria-label="แก้ไข" style={{ padding: '2px', color: 'var(--text-muted)' }} onClick={() => handleOpenEditModal(col)}><Edit2 size={11} /></button>
                            <button className="btn-icon" aria-label="ลบ" style={{ padding: '2px', color: 'var(--danger)', opacity: 0.6 }} onClick={() => handleDeleteColumn(col.id)}><Trash2 size={11} /></button>
                          </div>
                        )}
                      </th>
                    )) : [
                      <th key="empty-final" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: 'normal', fontStyle: 'italic', fontSize: '0.75rem' }}>
                        (ยังไม่มีช่อง)
                      </th>
                    ];

                    return [
                      ...colsElements,
                      <th key="total-final" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--danger)', fontSize: '0.75rem' }}>
                        <div>แปลงแล้ว</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>({finalWeight})</div>
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
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', position: 'sticky', left: 0, backgroundColor: 'var(--bg-surface)', zIndex: 2, borderRight: '1px solid var(--border-subtle)' }}>{index + 1}</td>
                      <td style={{ fontWeight: 500, position: 'sticky', left: '50px', backgroundColor: 'var(--bg-surface)', zIndex: 2, borderRight: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>{s.name}</td>
                      
                      {/* Unit Cells */}
                      {displayUnits.map(unit => {
                        const unitCols = classScoreColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
                        const uScore = getUnitScore(s.id, unit.id);
                        studentViewTotal += uScore.scaled;
                        
                        const colsElements = unitCols.length > 0 ? unitCols.map(col => {
                          const record = scores.find(r => r.studentId === s.id && r.columnId === col.id);
                          return (
                            <td key={col.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', padding: '4px' }}>
                              <input 
                                type="number"
                                min="0"
                                max={col.maxScore}
                                className="gradebook-input"
                                value={record ? record.score : ''}
                                onChange={(e) => handleScoreChange(s.id, col.id, e.target.value)}
                                disabled={readOnly}
                              />
                            </td>
                          );
                        }) : [
                          <td key={`empty-cell-${unit.id}`} style={{ borderLeft: '1px solid var(--border-subtle)' }}></td>
                        ];

                        return [
                          ...colsElements,
                          <td key={`total-cell-${unit.id}`} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                            <td key={col.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', padding: '4px' }}>
                              <input 
                                type="number"
                                min="0"
                                max={col.maxScore}
                                className="gradebook-input"
                                value={record ? record.score : ''}
                                onChange={(e) => handleScoreChange(s.id, col.id, e.target.value)}
                                disabled={readOnly}
                              />
                            </td>
                          );
                        }) : [
                          <td key="empty-midterm-cell" style={{ borderLeft: '1px solid var(--border-subtle)' }}></td>
                        ];

                        return [
                          ...colsElements,
                          <td key="total-midterm-cell" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', fontWeight: 600, color: 'var(--warning)' }}>
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
                            <td key={col.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', padding: '4px' }}>
                              <input 
                                type="number"
                                min="0"
                                max={col.maxScore}
                                className="gradebook-input"
                                value={record ? record.score : ''}
                                onChange={(e) => handleScoreChange(s.id, col.id, e.target.value)}
                                disabled={readOnly}
                              />
                            </td>
                          );
                        }) : [
                          <td key="empty-final-cell" style={{ borderLeft: '1px solid var(--border-subtle)' }}></td>
                        ];

                        return [
                          ...colsElements,
                          <td key="total-final-cell" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', fontWeight: 600, color: 'var(--danger)' }}>
                            <div title={`ดิบ: ${fScore.raw}/${fScore.maxRaw}`}>{Math.round(fScore.scaled)}</div>
                          </td>
                        ];
                      })()}

                      {/* Summary Cells */}
                      <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {Math.round(studentViewTotal)}
                      </td>
                      {viewTerm === 'all' && (
                        <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', fontWeight: 700, color: getGradeColor(calculateGrade(studentViewTotal)) }}>
                          {calculateGrade(studentViewTotal)}
                        </td>
                      )}
                    </tr>
                  );
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
              <button className="btn-icon" aria-label="ปิด" onClick={() => setIsColumnModalOpen(false)}>×</button>
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
                    <div style={{ color: 'var(--danger)', fontSize: '0.875rem', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)' }}>
                      ❌ ยังไม่มีหน่วยการเรียนรู้: กรุณาไปที่เมนู โครงสร้างรายวิชา เพื่อสร้างหน่วยการเรียนรู้ก่อนเพิ่มคะแนนเก็บ
                    </div>
                  ) : (
                    <select 
                      className="form-control"
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
                  className="form-control" 
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
                    className="form-control"
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
                  className="form-control" 
                  value={newColumnMax}
                  onChange={(e) => setNewColumnMax(Number(e.target.value))}
                  min="1"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsColumnModalOpen(false)}>ยกเลิก</button>
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
