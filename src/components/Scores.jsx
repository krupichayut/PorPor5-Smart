import { useState, useMemo } from 'react';
import { Award, Plus, Trash2, Calculator, Edit2, Filter, Users, Download } from 'lucide-react';
import { getGradeColor, getGrade } from '../utils/scoring';
import { downloadCsv } from '../utils/fileExports';

export default function Scores({ students, activeClassId, classes, scores, setScores, scoreColumns, setScoreColumns, indicators, readOnly, studentPoints, setStudentPoints }) {
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnMax, setNewColumnMax] = useState(10);
  const [newColumnType, setNewColumnType] = useState('collected'); // 'collected', 'midterm', 'final'
  const [newColumnUnitId, setNewColumnUnitId] = useState('');
  const [newColumnIndicatorId, setNewColumnIndicatorId] = useState('');
  
  const [viewTerm, setViewTerm] = useState('all'); // '1', '2', 'all'
  const [viewUnit, setViewUnit] = useState('all'); // 'all', or unitId
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusColumnId, setFocusColumnId] = useState('');

  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  
  const classScoreColumns = scoreColumns.filter(c => c.classId === activeClassId);
  const classUnits = indicators ? indicators.filter(i => i.classId === activeClassId) : [];
  
  const midtermWeight = activeClass?.midtermWeight ?? 10;
  const finalWeight = activeClass?.finalWeight ?? 10;
  const totalUnitsWeight = classUnits.reduce((sum, u) => sum + u.weight, 0);
  const term1CollectedWeight = classUnits.filter(u => (u.term || '1') === '1' || (u.term || '1') === 'all').reduce((sum, u) => sum + (Number(u.weight) || 0), 0);
  const term2CollectedWeight = classUnits.filter(u => (u.term || '1') === '2' || (u.term || '1') === 'all').reduce((sum, u) => sum + (Number(u.weight) || 0), 0);

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

  const handleQuickAddColumn = (type, unitId = '') => {
    setEditingColumnId(null);
    setNewColumnType(type);
    setNewColumnUnitId(unitId);
    setNewColumnIndicatorId('');
    
    // Auto-generate name based on type
    if (type === 'midterm') {
      setNewColumnName('à¸ªà¸­à¸šà¸›à¸¥à¸²à¸¢à¸ à¸²à¸„à¹€à¸—à¸­à¸¡ 1');
      setNewColumnMax(activeClass?.midtermWeight || 10);
    } else if (type === 'final') {
      setNewColumnName('à¸ªà¸­à¸šà¸›à¸¥à¸²à¸¢à¸ à¸²à¸„à¹€à¸—à¸­à¸¡ 2');
      setNewColumnMax(activeClass?.finalWeight || 10);
    } else {
      const existingCols = scoreColumns.filter(c => c.classId === activeClassId && c.unitId === unitId);
      setNewColumnName(`à¸Šà¸´à¹‰à¸™à¸‡à¸²à¸™à¸—à¸µà¹ˆ ${existingCols.length + 1}`);
      setNewColumnMax(10);
    }
    
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = (e) => {
    e.preventDefault();
    if (!newColumnName.trim() || newColumnMax <= 0) return;
    if (newColumnType === 'collected' && !newColumnUnitId) {
      alert('à¸à¸£à¸¸à¸“à¸²à¹€à¸¥à¸·à¸­à¸à¸«à¸™à¹ˆà¸§à¸¢à¸à¸²à¸£à¹€à¸£à¸µà¸¢à¸™à¸£à¸¹à¹‰');
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
      alert(`à¸„à¸°à¹à¸™à¸™à¸•à¹‰à¸­à¸‡à¹„à¸¡à¹ˆà¹€à¸à¸´à¸™ ${column.maxScore}`);
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
    if (confirm('à¸„à¸¸à¸“à¹à¸™à¹ˆà¹ƒà¸ˆà¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆà¸§à¹ˆà¸²à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸¥à¸šà¸Šà¹ˆà¸­à¸‡à¸„à¸°à¹à¸™à¸™à¸™à¸µà¹‰? à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸„à¸°à¹à¸™à¸™à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”à¹ƒà¸™à¸Šà¹ˆà¸­à¸‡à¸™à¸µà¹‰à¸ˆà¸°à¸«à¸²à¸¢à¹„à¸›')) {
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
    const unitTerm = classUnits.find(u => u.id === unitId)?.term || '1';
    const unroundedScaled = unitMaxRaw > 0 ? (unitRaw / unitMaxRaw) * unitWeight : 0;
    const scaled = unitTerm === '2' ? Math.round(unroundedScaled) : Number(unroundedScaled.toFixed(2));
    return { raw: unitRaw, maxRaw: unitMaxRaw, weight: unitWeight, scaled };
  };

  const getExamScore = (studentId, type) => {
    const examCols = classScoreColumns.filter(c => c.type === type);
    const examMaxRaw = examCols.reduce((sum, col) => sum + col.maxScore, 0);
    const examRaw = examCols.reduce((sum, col) => {
      const scoreVal = scoreMap.get(`${studentId}_${col.id}`);
      return sum + (scoreVal !== undefined && scoreVal !== null ? Number(scoreVal) : 0);
    }, 0);
    const examWeight = type === 'midterm' ? midtermWeight : finalWeight;
    const unroundedScaled = examMaxRaw > 0 ? (examRaw / examMaxRaw) * examWeight : 0;
    const scaled = type === 'final' ? Math.round(unroundedScaled) : Number(unroundedScaled.toFixed(2));
    return { raw: examRaw, maxRaw: examMaxRaw, weight: examWeight, scaled };
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

  const showMidterm = viewUnit === 'all' && (viewTerm === '1' || viewTerm === 'all');
  const showFinal = viewUnit === 'all' && (viewTerm === '2' || viewTerm === 'all');


  const handleExportScores = () => {
    if (classStudents.length === 0) {
      alert('à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸™à¸±à¸à¹€à¸£à¸µà¸¢à¸™à¹ƒà¸«à¹‰à¸ªà¹ˆà¸‡à¸­à¸­à¸');
      return;
    }
    
    const headers = [
      { key: 'number', label: 'à¹€à¸¥à¸‚à¸—à¸µà¹ˆ' },
      { key: 'studentId', label: 'à¸£à¸«à¸±à¸ªà¸›à¸£à¸°à¸ˆà¸³à¸•à¸±à¸§' },
      { key: 'name', label: 'à¸Šà¸·à¹ˆà¸­ - à¸™à¸²à¸¡à¸ªà¸à¸¸à¸¥' },
    ];
    
    displayUnits.forEach(unit => {
      const unitCols = classScoreColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
      unitCols.forEach(col => headers.push({ key: col.id, label: col.name }));
      headers.push({ key: `unit_total_${unit.id}`, label: `à¹à¸›à¸¥à¸‡à¹à¸¥à¹‰à¸§ (${unit.name})` });
    });
    
    if (showMidterm) {
      headers.push({ key: 'term1_collected', label: `à¸£à¸§à¸¡à¹€à¸à¹‡à¸šà¹€à¸—à¸­à¸¡ 1 (${term1CollectedWeight} à¸„à¸°à¹à¸™à¸™)` });
      const examCols = classScoreColumns.filter(c => c.type === 'midterm');
      examCols.forEach(col => headers.push({ key: col.id, label: col.name }));
      headers.push({ key: 'midterm_total', label: 'à¹à¸›à¸¥à¸‡à¹à¸¥à¹‰à¸§ (à¸›à¸¥à¸²à¸¢à¸ à¸²à¸„à¹€à¸—à¸­à¸¡ 1)' });
    }
    
    if (showFinal) {
      headers.push({ key: 'term2_collected', label: `à¸£à¸§à¸¡à¹€à¸à¹‡à¸šà¹€à¸—à¸­à¸¡ 2 (${term2CollectedWeight} à¸„à¸°à¹à¸™à¸™)` });
      const examCols = classScoreColumns.filter(c => c.type === 'final');
      examCols.forEach(col => headers.push({ key: col.id, label: col.name }));
      headers.push({ key: 'final_total', label: 'à¹à¸›à¸¥à¸‡à¹à¸¥à¹‰à¸§ (à¸›à¸¥à¸²à¸¢à¸ à¸²à¸„à¹€à¸—à¸­à¸¡ 2)' });
    }
    
    headers.push({ key: 'total_raw', label: 'à¸£à¸§à¸¡à¸”à¸´à¸š' });
    headers.push({ key: 'total_scaled', label: `à¹à¸›à¸¥à¸‡ (à¹€à¸—à¸­à¸¡ ${viewTerm !== 'all' ? viewTerm : 'à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”'})` });
    
    if (viewTerm === 'all') {
      headers.push({ key: 'grade', label: 'à¹€à¸à¸£à¸”' });
    }

    const rows = classStudents.map(s => {
      const row = {
        number: s.number,
        studentId: s.studentId,
        name: s.name,
      };
      
      let studentViewTotal = 0;
      let studentRawTotal = 0;
      
      displayUnits.forEach(unit => {
        const unitCols = classScoreColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
        unitCols.forEach(col => {
          const record = scores.find(r => r.studentId === s.id && r.columnId === col.id);
          row[col.id] = record ? record.score : '';
        });
        
        const uScore = getUnitScore(s.id, unit.id);
        studentViewTotal += uScore.scaled;
        studentRawTotal += uScore.raw;
        row[`unit_total_${unit.id}`] = Math.round(uScore.scaled);
      });
      

      if (showMidterm) {
        const term1Score = classUnits.filter(u => getUnitTerm(u) === '1' || getUnitTerm(u) === 'all').reduce((sum, u) => sum + getUnitScore(s.id, u.id).scaled, 0);
        row['term1_collected'] = Math.round(term1Score);
        const examCols = classScoreColumns.filter(c => c.type === 'midterm');
        examCols.forEach(col => {
          const record = scores.find(r => r.studentId === s.id && r.columnId === col.id);
          row[col.id] = record ? record.score : '';
        });
        
        const mScore = getExamScore(s.id, 'midterm');
        studentViewTotal += mScore.scaled;
        studentRawTotal += mScore.raw;
        row['midterm_total'] = Math.round(mScore.scaled);
      }
      

      if (showFinal) {
        const term2Score = classUnits.filter(u => getUnitTerm(u) === '2' || getUnitTerm(u) === 'all').reduce((sum, u) => sum + getUnitScore(s.id, u.id).scaled, 0);
        row['term2_collected'] = Math.round(term2Score);
        const examCols = classScoreColumns.filter(c => c.type === 'final');
        examCols.forEach(col => {
          const record = scores.find(r => r.studentId === s.id && r.columnId === col.id);
          row[col.id] = record ? record.score : '';
        });
        
        const fScore = getExamScore(s.id, 'final');
        studentViewTotal += fScore.scaled;
        studentRawTotal += fScore.raw;
        row['final_total'] = Math.round(fScore.scaled);
      }
      
      row['total_raw'] = studentRawTotal;
      row['total_scaled'] = Math.round(studentViewTotal);
      
      if (viewTerm === 'all') {
        row['grade'] = getGrade(Math.round(studentViewTotal));
      }
      
      return row;
    });

    downloadCsv(`scores_${activeClass?.name || 'class'}.csv`, rows, headers);
  };

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">à¸šà¸±à¸™à¸—à¸¶à¸à¸„à¸°à¹à¸™à¸™</h2>
            <p className="page-subtitle">à¸šà¸±à¸™à¸—à¸¶à¸à¸„à¸°à¹à¸™à¸™à¸•à¸²à¸¡à¹‚à¸„à¸£à¸‡à¸ªà¸£à¹‰à¸²à¸‡à¸«à¸™à¹ˆà¸§à¸¢à¸à¸²à¸£à¹€à¸£à¸µà¸¢à¸™à¸£à¸¹à¹‰</p>
          </div>
        </div>
        <div className="empty-state">
          <Award size={48} />
          <h3>à¹„à¸¡à¹ˆà¸¡à¸µà¸à¸²à¸£à¹€à¸¥à¸·à¸­à¸à¸«à¹‰à¸­à¸‡à¹€à¸£à¸µà¸¢à¸™</h3>
          <p>à¸à¸£à¸¸à¸“à¸²à¹€à¸¥à¸·à¸­à¸à¸«à¹‰à¸­à¸‡à¹€à¸£à¸µà¸¢à¸™à¸ˆà¸²à¸à¹€à¸¡à¸™à¸¹ <strong>à¸«à¹‰à¸­à¸‡à¹€à¸£à¸µà¸¢à¸™ / à¸§à¸´à¸Šà¸²</strong> à¸”à¹‰à¸²à¸™à¸šà¸™à¸à¹ˆà¸­à¸™</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in hairline-grid">
      <div className="page-header">
        <div>
          <h2 className="page-title">à¸šà¸±à¸™à¸—à¸¶à¸à¸„à¸°à¹à¸™à¸™: {activeClass?.name}</h2>
          <p className="page-subtitle">à¸ˆà¸±à¸”à¸à¸²à¸£à¸„à¸°à¹à¸™à¸™à¹€à¸à¹‡à¸šà¸•à¸²à¸¡à¸«à¸™à¹ˆà¸§à¸¢à¹à¸¥à¸°à¸„à¸°à¹à¸™à¸™à¸ªà¸­à¸š</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExportScores} title="à¸ªà¹ˆà¸‡à¸­à¸­à¸à¸„à¸°à¹à¸™à¸™à¹€à¸›à¹‡à¸™ Excel">
            <Download size={18} />
            <span className="hide-on-mobile">à¸ªà¹ˆà¸‡à¸­à¸­à¸ Excel</span>
          </button>
          {!readOnly && (
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <Plus size={18} />
              à¹€à¸žà¸´à¹ˆà¸¡à¸Šà¹ˆà¸­à¸‡à¸„à¸°à¹à¸™à¸™
            </button>
          )}
        </div>
      </div>

      <div className="gradebook-tools" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="hairline-cell gradebook-weight-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-cyan)' }}>
            <Calculator size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>à¸™à¹‰à¸³à¸«à¸™à¸±à¸à¸„à¸°à¹à¸™à¸™à¸£à¸§à¸¡ (à¸—à¸µà¹ˆà¸•à¸±à¹‰à¸‡à¸„à¹ˆà¸²à¹„à¸§à¹‰)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, color: totalClassWeight !== 100 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {totalClassWeight} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>à¸„à¸°à¹à¸™à¸™</span> {totalClassWeight !== 100 && <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-primary)' }}>(à¸„à¸§à¸£à¸›à¸£à¸±à¸šà¹ƒà¸«à¹‰à¸„à¸£à¸š 100)</span>}
            </div>
          </div>
        </div>
        <div className="hairline-cell gradebook-filter-card" style={{ padding: '0', display: 'flex' }}>
          <div style={{ flex: 1, padding: '1.5rem', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} /> à¹€à¸¥à¸·à¸­à¸à¸ à¸²à¸„à¹€à¸£à¸µà¸¢à¸™
            </div>
            <select 
              className="form-control" 
              value={viewTerm}
              onChange={(e) => {
                setViewTerm(e.target.value);
                setViewUnit('all'); // Reset unit filter when term changes
              }}
            >
              <option value="1">à¹€à¸—à¸­à¸¡ 1 (à¸«à¸™à¹ˆà¸§à¸¢ + à¸ªà¸­à¸šà¸›à¸¥à¸²à¸¢à¸ à¸²à¸„à¹€à¸—à¸­à¸¡ 1)</option>
              <option value="2">à¹€à¸—à¸­à¸¡ 2 (à¸«à¸™à¹ˆà¸§à¸¢ + à¸ªà¸­à¸šà¸›à¸¥à¸²à¸¢à¸ à¸²à¸„à¹€à¸—à¸­à¸¡ 2)</option>
              <option value="all">à¸—à¸±à¹‰à¸‡à¸›à¸µà¸à¸²à¸£à¸¨à¸¶à¸à¸©à¸²</option>
            </select>
          </div>
          <div style={{ flex: 1, padding: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} /> à¹€à¸¥à¸·à¸­à¸à¹à¸ªà¸”à¸‡à¸œà¸¥à¸£à¸°à¸”à¸±à¸šà¸«à¸™à¹ˆà¸§à¸¢
            </div>
            <select 
              className="form-control" 
              value={viewUnit}
              onChange={(e) => setViewUnit(e.target.value)}
            >
              <option value="all">à¹à¸ªà¸”à¸‡à¸—à¸¸à¸à¸«à¸™à¹ˆà¸§à¸¢à¹ƒà¸™à¹€à¸—à¸­à¸¡à¸™à¸µà¹‰ + à¸ªà¸­à¸š</option>
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
        {isFocusMode ? (
          <div className="focus-mode-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>✨ Focus Mode: กรอกทีละชิ้นงาน</h3>
              <select 
                className="form-control" 
                style={{ maxWidth: '400px', margin: '0 auto', fontSize: '1.1rem', padding: '0.75rem', backgroundColor: 'var(--bg-sidebar)' }}
                value={focusColumnId}
                onChange={(e) => setFocusColumnId(e.target.value)}
              >
                <option value="">-- เลือกชิ้นงานที่ต้องการกรอก --</option>
                {classScoreColumns.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.name} (คะแนนเต็ม {col.maxScore}) - {col.type === 'collected' ? 'คะแนนเก็บ' : col.type === 'midterm' ? 'สอบกลางภาค' : 'สอบปลายภาค'}
                  </option>
                ))}
              </select>
            </div>
            
            {focusColumnId ? (
              <div className="hairline-grid" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                {(() => {
                  const focusCol = classScoreColumns.find(c => c.id === focusColumnId);
                  let filledCount = 0;
                  
                  return (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '60px', textAlign: 'center' }}>เลขที่</th>
                          <th>ชื่อ - นามสกุล</th>
                          <th style={{ width: '150px', textAlign: 'center', color: 'var(--accent-cyan)' }}>คะแนน (เต็ม {focusCol?.maxScore})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((s, index) => {
                          const record = scores.find(r => r.studentId === s.id && r.columnId === focusColumnId);
                          const val = record ? record.score : '';
                          if (val !== '') filledCount++;
                          
                          const isZero = val === '0';
                          const inputStyle = {
                            backgroundColor: isZero ? 'rgba(251, 113, 133, 0.15)' : 'transparent',
                            color: isZero ? 'var(--danger)' : 'var(--text-primary)',
                            borderColor: val !== '' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                            fontWeight: val !== '' ? 'bold' : 'normal'
                          };

                          return (
                            <tr key={s.id}>
                              <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</td>
                              <td className="col-student-name" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                              <td style={{ textAlign: 'center' }}>
                                <input 
                                  type="number"
                                  min="0"
                                  max={focusCol?.maxScore || 10}
                                  className="gradebook-input"
                                  style={{ ...inputStyle, width: '100%', padding: '0.5rem', textAlign: 'center', borderRadius: 'var(--radius-xs)' }}
                                  value={val}
                                  placeholder="-"
                                  onChange={(e) => handleScoreChange(s.id, focusColumnId, e.target.value)}
                                  disabled={readOnly}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                            ความคืบหน้า: กรอกแล้ว {filledCount} / {classStudents.length} คน ({classStudents.length > 0 ? Math.round((filledCount/classStudents.length)*100) : 0}%)
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  );
                })()}
              </div>
            ) : (
              <div className="empty-state">
                <p style={{ color: 'var(--text-muted)' }}>กรุณาเลือกชิ้นงานจากเมนูด้านบน เพื่อเริ่มกรอกคะแนน</p>
              </div>
            )}
          </div>
        ) : (
        <>
        {classStudents.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>à¹„à¸¡à¹ˆà¸žà¸šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸™à¸±à¸à¹€à¸£à¸µà¸¢à¸™</h3>
            <p>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸™à¸±à¸à¹€à¸£à¸µà¸¢à¸™à¹ƒà¸™à¸«à¹‰à¸­à¸‡à¸™à¸µà¹‰ à¸à¸£à¸¸à¸“à¸²à¹€à¸žà¸´à¹ˆà¸¡à¸™à¸±à¸à¹€à¸£à¸µà¸¢à¸™à¸à¹ˆà¸­à¸™à¸—à¸³à¸à¸²à¸£à¸šà¸±à¸™à¸—à¸¶à¸à¸„à¸°à¹à¸™à¸™</p>
          </div>
        ) : (
          <>
            {classUnits.length === 0 && (
              <div style={{ color: 'var(--text-primary)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Award size={24} />
                <div>
                  <strong>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¹„à¸”à¹‰à¸ªà¸£à¹‰à¸²à¸‡à¸«à¸™à¹ˆà¸§à¸¢à¸à¸²à¸£à¹€à¸£à¸µà¸¢à¸™à¸£à¸¹à¹‰:</strong> à¸«à¸²à¸à¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¹€à¸žà¸´à¹ˆà¸¡ "à¸Šà¹ˆà¸­à¸‡à¸„à¸°à¹à¸™à¸™à¹€à¸à¹‡à¸š" à¸à¸£à¸¸à¸“à¸²à¹„à¸›à¸ªà¸£à¹‰à¸²à¸‡à¸«à¸™à¹ˆà¸§à¸¢à¸à¸²à¸£à¹€à¸£à¸µà¸¢à¸™à¸£à¸¹à¹‰à¸—à¸µà¹ˆà¹€à¸¡à¸™à¸¹ <strong>à¹‚à¸„à¸£à¸‡à¸ªà¸£à¹‰à¸²à¸‡à¸£à¸²à¸¢à¸§à¸´à¸Šà¸²</strong> à¸à¹ˆà¸­à¸™
                </div>
              </div>
            )}
            <div className="table-container gradebook-table-container">
            <table className="data-table gradebook-table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th className="sticky-col-left" rowSpan={2} style={{ boxSizing: 'border-box', width: '60px', minWidth: '60px', padding: '0.5rem', textAlign: 'center', left: 0, verticalAlign: 'middle' }}>à¹€à¸¥à¸‚à¸—à¸µà¹ˆ</th>
                  <th className="sticky-col-left" rowSpan={2} style={{ boxSizing: 'border-box', width: '220px', minWidth: '220px', padding: '0.5rem 1rem', left: '60px', verticalAlign: 'middle' }}>à¸Šà¸·à¹ˆà¸­ - à¸™à¸²à¸¡à¸ªà¸à¸¸à¸¥</th>
                  
                  {/* Unit Groups */}
                  {displayUnits.map(unit => {
                    const unitCols = classScoreColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
                    return (
                      <th key={unit.id} className="col-unit-name" colSpan={Math.max(1, unitCols.length) + 1} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {unit.name}
                          {!readOnly && (
                            <button className="btn-icon" style={{ color: 'var(--accent-cyan)', padding: '2px' }} onClick={() => handleQuickAddColumn('collected', unit.id)} title="à¹€à¸žà¸´à¹ˆà¸¡à¸Šà¸´à¹‰à¸™à¸‡à¸²à¸™à¹ƒà¸™à¸«à¸™à¹ˆà¸§à¸¢à¸™à¸µà¹‰">
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>à¸™à¹‰à¸³à¸«à¸™à¸±à¸: {unit.weight} à¸„à¸°à¹à¸™à¸™</div>
                      </th>
                    );
                  })}
                  
                  {/* Exams Groups */}
                  {showMidterm && (
                    <th rowSpan={2} style={{ textAlign: "center", borderLeft: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--accent-cyan)", verticalAlign: "middle" }}>
                      <div style={{ fontWeight: 600 }}>à¸£à¸§à¸¡à¹€à¸à¹‡à¸šà¹€à¸—à¸­à¸¡ 1</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({term1CollectedWeight} à¸„à¸°à¹à¸™à¸™)</div>
                    </th>
                  )}
                  {showMidterm && (
                    <th colSpan={Math.max(1, classScoreColumns.filter(c => c.type === 'midterm').length) + 1} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        à¸ªà¸­à¸šà¸›à¸¥à¸²à¸¢à¸ à¸²à¸„à¹€à¸—à¸­à¸¡ 1
                        {!readOnly && (
                          <button className="btn-icon" style={{ color: 'var(--text-primary)', padding: '2px' }} onClick={() => handleQuickAddColumn('midterm')} title="à¹€à¸žà¸´à¹ˆà¸¡à¸Šà¹ˆà¸­à¸‡à¸„à¸°à¹à¸™à¸™à¸›à¸¥à¸²à¸¢à¸ à¸²à¸„à¹€à¸—à¸­à¸¡ 1">
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>à¸™à¹‰à¸³à¸«à¸™à¸±à¸: {midtermWeight} à¸„à¸°à¹à¸™à¸™</div>
                    </th>
                  )}
                  {showFinal && (
                    <th rowSpan={2} style={{ textAlign: "center", borderLeft: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--accent-cyan)", verticalAlign: "middle" }}>
                      <div style={{ fontWeight: 600 }}>à¸£à¸§à¸¡à¹€à¸à¹‡à¸šà¹€à¸—à¸­à¸¡ 2</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({term2CollectedWeight} à¸„à¸°à¹à¸™à¸™)</div>
                    </th>
                  )}
                  {showFinal && (
                    <th colSpan={Math.max(1, classScoreColumns.filter(c => c.type === 'final').length) + 1} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        à¸ªà¸­à¸šà¸›à¸¥à¸²à¸¢à¸ à¸²à¸„à¹€à¸—à¸­à¸¡ 2
                        {!readOnly && (
                          <button className="btn-icon" style={{ color: 'var(--text-primary)', padding: '2px' }} onClick={() => handleQuickAddColumn('final')} title="à¹€à¸žà¸´à¹ˆà¸¡à¸Šà¹ˆà¸­à¸‡à¸„à¸°à¹à¸™à¸™à¸›à¸¥à¸²à¸¢à¸ à¸²à¸„à¹€à¸—à¸­à¸¡ 2">
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>à¸™à¹‰à¸³à¸«à¸™à¸±à¸: {finalWeight} à¸„à¸°à¹à¸™à¸™</div>
                    </th>
                  )}
                  
                                    {/* Summary */}
                  <th rowSpan={2} style={{ textAlign: "center", borderLeft: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)", verticalAlign: "middle" }}>
                    à¸£à¸§à¸¡à¸”à¸´à¸š
                  </th>
                  <th rowSpan={2} style={{ textAlign: "center", borderLeft: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)", verticalAlign: "middle" }}>
                    à¹à¸›à¸¥à¸‡ (à¹€à¸—à¸­à¸¡ {viewTerm !== "all" ? viewTerm : "à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”"})
                  </th>
                  {viewTerm === 'all' && (
                    <th rowSpan={2} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', verticalAlign: 'middle', width: '60px' }}>
                      à¹€à¸à¸£à¸”
                    </th>
                  )}
                </tr>
                <tr>
                  {/* Unit Columns */}
                  {displayUnits.map(unit => {
                    const unitCols = classScoreColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
                    const colsElements = unitCols.length > 0 ? unitCols.map(col => {
                      const targetIndicator = col.indicatorId ? unit.items?.find(i => i.id === col.indicatorId) : null;
                      return (
                      <th key={col.id} style={{ textAlign: 'center', minWidth: '70px', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)', fontWeight: 'normal' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{col.name}</div>
                        {targetIndicator && (
                          <div 
                            title={`${targetIndicator.code}: ${targetIndicator.description}`}
                            onClick={() => alert(`à¸£à¸«à¸±à¸ªà¸•à¸±à¸§à¸Šà¸µà¹‰à¸§à¸±à¸”: ${targetIndicator.code}\nà¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”: ${targetIndicator.description}`)}
                            style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', cursor: 'help', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65px', margin: '2px auto 0' }}
                          >
                            {targetIndicator.code}
                          </div>
                        )}
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({col.maxScore})</div>
                        {!readOnly && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '2px' }}>
                            <button className="btn-icon" aria-label="à¹à¸à¹‰à¹„à¸‚" style={{ padding: '2px', color: 'var(--text-muted)' }} onClick={() => handleOpenEditModal(col)}><Edit2 size={11} /></button>
                            <button className="btn-icon" aria-label="à¸¥à¸š" style={{ padding: '2px', color: 'var(--text-primary)', opacity: 0.6 }} onClick={() => handleDeleteColumn(col.id)}><Trash2 size={11} /></button>
                          </div>
                        )}
                      </th>
                    ); }) : [
                      <th key={`empty-${unit.id}`} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: 'normal', fontStyle: 'italic', fontSize: '0.75rem' }}>
                        (à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸Šà¹ˆà¸­à¸‡)
                      </th>
                    ];

                    return [
                      ...colsElements,
                      <th key={`total-${unit.id}`} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.75rem' }}>
                        <div>à¹à¸›à¸¥à¸‡à¹à¸¥à¹‰à¸§</div>
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
                            <button className="btn-icon" aria-label="à¹à¸à¹‰à¹„à¸‚" style={{ padding: '2px', color: 'var(--text-muted)' }} onClick={() => handleOpenEditModal(col)}><Edit2 size={11} /></button>
                            <button className="btn-icon" aria-label="à¸¥à¸š" style={{ padding: '2px', color: 'var(--text-primary)', opacity: 0.6 }} onClick={() => handleDeleteColumn(col.id)}><Trash2 size={11} /></button>
                          </div>
                        )}
                      </th>
                    )) : [
                      <th key="empty-midterm" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: 'normal', fontStyle: 'italic', fontSize: '0.75rem' }}>
                        (à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸Šà¹ˆà¸­à¸‡)
                      </th>
                    ];

                    return [
                      ...colsElements,
                      <th key="total-midterm" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.75rem' }}>
                        <div>à¹à¸›à¸¥à¸‡à¹à¸¥à¹‰à¸§</div>
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
                            <button className="btn-icon" aria-label="à¹à¸à¹‰à¹„à¸‚" style={{ padding: '2px', color: 'var(--text-muted)' }} onClick={() => handleOpenEditModal(col)}><Edit2 size={11} /></button>
                            <button className="btn-icon" aria-label="à¸¥à¸š" style={{ padding: '2px', color: 'var(--text-primary)', opacity: 0.6 }} onClick={() => handleDeleteColumn(col.id)}><Trash2 size={11} /></button>
                          </div>
                        )}
                      </th>
                    )) : [
                      <th key="empty-final" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontWeight: 'normal', fontStyle: 'italic', fontSize: '0.75rem' }}>
                        (à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸Šà¹ˆà¸­à¸‡)
                      </th>
                    ];

                    return [
                      ...colsElements,
                      <th key="total-final" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.75rem' }}>
                        <div>à¹à¸›à¸¥à¸‡à¹à¸¥à¹‰à¸§</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>({finalWeight})</div>
                      </th>
                    ];
                  })()}
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => {
                  let studentViewTotal = 0;
                  let studentRawTotal = 0;
                  
                  return (
                    <tr key={s.id} className={s.status === "transferred" ? "row-transferred" : ""}>
                      <td className="sticky-col-left" style={{ boxSizing: 'border-box', width: '60px', minWidth: '60px', padding: '0.5rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', left: 0 }}>{index + 1}</td>
                      <td className="sticky-col-left col-student-name" style={{ boxSizing: 'border-box', width: '220px', minWidth: '220px', padding: '0.5rem 1rem', fontWeight: 500, left: '60px', color: 'var(--text-primary)', }}>{s.name}</td>
                      
                      {/* Unit Cells */}
                      {displayUnits.map(unit => {
                        const unitCols = classScoreColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
                        const uScore = getUnitScore(s.id, unit.id);
                        studentViewTotal += uScore.scaled;
                        studentRawTotal += uScore.raw;
                        
                        const colsElements = unitCols.length > 0 ? unitCols.map(col => {
                          const record = scores.find(r => r.studentId === s.id && r.columnId === col.id);
                          return (
                            <td key={col.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', padding: '4px' }}>
                              <input 
    type="number"
    min="0"
    max={col.maxScore}
    className="gradebook-input"
    style={{ 
      backgroundColor: record && record.score === '0' ? 'rgba(251, 113, 133, 0.15)' : 'transparent',
      color: record && record.score === '0' ? 'var(--danger)' : 'var(--text-primary)',
      fontWeight: record && record.score !== '' ? '500' : 'normal'
    }}
    placeholder="-"
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
                            <div title={`à¸”à¸´à¸š: ${uScore.raw}/${uScore.maxRaw}`}>{Math.round(uScore.scaled)}</div>
                          </td>
                        ];
                      })}


                      {showMidterm && (
                        <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                          {(() => {
                             const term1Score = classUnits.filter(u => getUnitTerm(u) === '1' || getUnitTerm(u) === 'all').reduce((sum, u) => sum + getUnitScore(s.id, u.id).scaled, 0);
                             return <div title={`à¸£à¸§à¸¡à¹€à¸à¹‡à¸šà¹€à¸—à¸­à¸¡ 1 (à¹à¸›à¸¥à¸‡à¹à¸¥à¹‰à¸§)`}>{Math.round(term1Score)}</div>;
                          })()}
                        </td>
                      )}
                      {/* Midterm Cells */}
                      {showMidterm && (() => {
                        const examCols = classScoreColumns.filter(c => c.type === 'midterm');
                        const mScore = getExamScore(s.id, 'midterm');
                        studentViewTotal += mScore.scaled;
                        studentRawTotal += mScore.raw;

                        const colsElements = examCols.length > 0 ? examCols.map(col => {
                          const record = scores.find(r => r.studentId === s.id && r.columnId === col.id);
                          return (
                            <td key={col.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', padding: '4px' }}>
                              <input 
    type="number"
    min="0"
    max={col.maxScore}
    className="gradebook-input"
    style={{ 
      backgroundColor: record && record.score === '0' ? 'rgba(251, 113, 133, 0.15)' : 'transparent',
      color: record && record.score === '0' ? 'var(--danger)' : 'var(--text-primary)',
      fontWeight: record && record.score !== '' ? '500' : 'normal'
    }}
    placeholder="-"
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
                          <td key="total-midterm-cell" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', fontWeight: 600, color: 'var(--text-primary)' }}>
                            <div title={`à¸”à¸´à¸š: ${mScore.raw}/${mScore.maxRaw}`}>{Math.round(mScore.scaled)}</div>
                          </td>
                        ];
                      })()}


                      {showFinal && (
                        <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                          {(() => {
                             const term2Score = classUnits.filter(u => getUnitTerm(u) === '2' || getUnitTerm(u) === 'all').reduce((sum, u) => sum + getUnitScore(s.id, u.id).scaled, 0);
                             return <div title={`à¸£à¸§à¸¡à¹€à¸à¹‡à¸šà¹€à¸—à¸­à¸¡ 2 (à¹à¸›à¸¥à¸‡à¹à¸¥à¹‰à¸§)`}>{Math.round(term2Score)}</div>;
                          })()}
                        </td>
                      )}
                      {/* Final Cells */}
                      {showFinal && (() => {
                        const examCols = classScoreColumns.filter(c => c.type === 'final');
                        const fScore = getExamScore(s.id, 'final');
                        studentViewTotal += fScore.scaled;
                        studentRawTotal += fScore.raw;

                        const colsElements = examCols.length > 0 ? examCols.map(col => {
                          const record = scores.find(r => r.studentId === s.id && r.columnId === col.id);
                          return (
                            <td key={col.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', padding: '4px' }}>
                              <input 
    type="number"
    min="0"
    max={col.maxScore}
    className="gradebook-input"
    style={{ 
      backgroundColor: record && record.score === '0' ? 'rgba(251, 113, 133, 0.15)' : 'transparent',
      color: record && record.score === '0' ? 'var(--danger)' : 'var(--text-primary)',
      fontWeight: record && record.score !== '' ? '500' : 'normal'
    }}
    placeholder="-"
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
                          <td key="total-final-cell" style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', fontWeight: 600, color: 'var(--text-primary)' }}>
                            <div title={`à¸”à¸´à¸š: ${fScore.raw}/${fScore.maxRaw}`}>{Math.round(fScore.scaled)}</div>
                          </td>
                        ];
                      })()}

                                            {/* Summary Cells */}
                      <td style={{ textAlign: "center", borderLeft: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-elevated)", fontWeight: 700, color: "var(--text-secondary)" }}>
                        {Math.round(studentRawTotal)}
                      </td>
                      <td style={{ textAlign: "center", borderLeft: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-elevated)", fontWeight: 700, color: "var(--text-primary)" }}>
                        {Math.round(studentViewTotal)}
                      </td>
                      {viewTerm === 'all' && (
                        <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', fontWeight: 700, color: getGradeColor(getGrade(studentViewTotal)) }}>
                          {getGrade(studentViewTotal)}
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
      </>
    )}
      </div>

      {isColumnModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingColumnId ? 'à¹à¸à¹‰à¹„à¸‚à¸Šà¹ˆà¸­à¸‡à¸„à¸°à¹à¸™à¸™' : 'à¹€à¸žà¸´à¹ˆà¸¡à¸Šà¹ˆà¸­à¸‡à¸„à¸°à¹à¸™à¸™'}</h3>
              <button className="btn-icon" aria-label="à¸›à¸´à¸”" onClick={() => setIsColumnModalOpen(false)}>Ã—</button>
            </div>
            <form onSubmit={handleSaveColumn}>
              <div className="form-group">
                <label className="form-label">à¸›à¸£à¸°à¹€à¸ à¸—à¸„à¸°à¹à¸™à¸™</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="scoreType" 
                      value="collected" 
                      checked={newColumnType === 'collected'}
                      onChange={() => setNewColumnType('collected')}
                    />
                    à¸„à¸°à¹à¸™à¸™à¹€à¸à¹‡à¸šà¸•à¸²à¸¡à¸«à¸™à¹ˆà¸§à¸¢
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="scoreType" 
                      value="midterm" 
                      checked={newColumnType === 'midterm'}
                      onChange={() => setNewColumnType('midterm')}
                    />
                    à¸ªà¸­à¸šà¸›à¸¥à¸²à¸¢à¸ à¸²à¸„à¹€à¸—à¸­à¸¡ 1
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="scoreType" 
                      value="final" 
                      checked={newColumnType === 'final'}
                      onChange={() => setNewColumnType('final')}
                    />
                    à¸ªà¸­à¸šà¸›à¸¥à¸²à¸¢à¸ à¸²à¸„à¹€à¸—à¸­à¸¡ 2
                  </label>
                </div>
              </div>

              {newColumnType === 'collected' && (
                <div className="form-group">
                  <label className="form-label">à¸ªà¸±à¸‡à¸à¸±à¸”à¸«à¸™à¹ˆà¸§à¸¢à¸à¸²à¸£à¹€à¸£à¸µà¸¢à¸™à¸£à¸¹à¹‰ (à¸ˆà¸³à¹€à¸›à¹‡à¸™)</label>
                  {classUnits.length === 0 ? (
                    <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)' }}>
                      âŒ à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸«à¸™à¹ˆà¸§à¸¢à¸à¸²à¸£à¹€à¸£à¸µà¸¢à¸™à¸£à¸¹à¹‰: à¸à¸£à¸¸à¸“à¸²à¹„à¸›à¸—à¸µà¹ˆà¹€à¸¡à¸™à¸¹ à¹‚à¸„à¸£à¸‡à¸ªà¸£à¹‰à¸²à¸‡à¸£à¸²à¸¢à¸§à¸´à¸Šà¸² à¹€à¸žà¸·à¹ˆà¸­à¸ªà¸£à¹‰à¸²à¸‡à¸«à¸™à¹ˆà¸§à¸¢à¸à¸²à¸£à¹€à¸£à¸µà¸¢à¸™à¸£à¸¹à¹‰à¸à¹ˆà¸­à¸™à¹€à¸žà¸´à¹ˆà¸¡à¸„à¸°à¹à¸™à¸™à¹€à¸à¹‡à¸š
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
                      <option value="">-- à¹€à¸¥à¸·à¸­à¸à¸«à¸™à¹ˆà¸§à¸¢à¸à¸²à¸£à¹€à¸£à¸µà¸¢à¸™à¸£à¸¹à¹‰ --</option>
                      {classUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} (à¸™à¹‰à¸³à¸«à¸™à¸±à¸ {unit.weight})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">à¸Šà¸·à¹ˆà¸­à¸Šà¹ˆà¸­à¸‡à¸„à¸°à¹à¸™à¸™ (à¹€à¸Šà¹ˆà¸™ à¸Šà¸´à¹‰à¸™à¸‡à¸²à¸™à¸—à¸µà¹ˆ 1, à¸ªà¸¡à¸¸à¸”à¸›à¸£à¸°à¸ˆà¸³à¸•à¸±à¸§)</label>
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
                  <label className="form-label">à¸œà¸¹à¸à¸à¸±à¸šà¸•à¸±à¸§à¸Šà¸µà¹‰à¸§à¸±à¸”à¹ƒà¸™à¸«à¸™à¹ˆà¸§à¸¢ (à¹„à¸¡à¹ˆà¸šà¸±à¸‡à¸„à¸±à¸š)</label>
                  <select 
                    className="form-control"
                    value={newColumnIndicatorId}
                    onChange={(e) => setNewColumnIndicatorId(e.target.value)}
                  >
                    <option value="">-- à¹„à¸¡à¹ˆà¸£à¸°à¸šà¸¸à¸•à¸±à¸§à¸Šà¸µà¹‰à¸§à¸±à¸” --</option>
                    {currentUnitIndicators.map(ind => (
                      <option key={ind.id} value={ind.id}>
                        {ind.code}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">à¸„à¸°à¹à¸™à¸™à¹€à¸•à¹‡à¸¡à¸”à¸´à¸š (Raw Max Score)</label>
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
                <button type="button" className="btn btn-outline" onClick={() => setIsColumnModalOpen(false)}>à¸¢à¸à¹€à¸¥à¸´à¸</button>
                <button type="submit" className="btn btn-primary" disabled={!newColumnName.trim() || newColumnMax <= 0 || (newColumnType === 'collected' && !newColumnUnitId)}>
                  {editingColumnId ? 'à¸šà¸±à¸™à¸—à¸¶à¸à¸à¸²à¸£à¹à¸à¹‰à¹„à¸‚' : 'à¹€à¸žà¸´à¹ˆà¸¡à¸Šà¹ˆà¸­à¸‡à¸„à¸°à¹à¸™à¸™'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
