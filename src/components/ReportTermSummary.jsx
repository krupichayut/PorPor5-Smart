import React, { useState } from 'react';
import { Users, Download, Printer } from 'lucide-react';
import { downloadCsv } from '../utils/fileExports';

export default function ReportTermSummary({ students, activeClassId, classes, scores, scoreColumns, indicators }) {
  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  
  const classScoreColumns = scoreColumns.filter(c => c.classId === activeClassId);
  const classUnits = indicators ? indicators.filter(i => i.classId === activeClassId) : [];

  const [viewTerm, setViewTerm] = useState('1');

  const getUnitTerm = (u) => u.term || '1';
  const termUnits = classUnits.filter(u => getUnitTerm(u) === viewTerm || getUnitTerm(u) === 'all');
  
  const termCollectedWeight = termUnits.reduce((sum, u) => sum + (Number(u.weight) || 0), 0);
  const examWeight = viewTerm === '1' ? (activeClass?.midtermWeight ?? 10) : (activeClass?.finalWeight ?? 10);
  const termTotalWeight = termCollectedWeight + examWeight;
  const examType = viewTerm === '1' ? 'midterm' : 'final';
  const examLabel = viewTerm === '1' ? 'สอบปลายภาคเทอม 1' : 'สอบปลายภาคเทอม 2';

  // Helper functions scoped to this component context
  const getUnitScoreLocal = (studentId, unitId) => {
    const unitCols = classScoreColumns.filter(c => c.unitId === unitId && c.type === 'collected');
    const unitMaxRaw = unitCols.reduce((sum, col) => sum + Number(col.maxScore || 0), 0);
    const unitRaw = unitCols.reduce((sum, col) => {
      const record = scores.find(r => r.studentId === studentId && r.columnId === col.id);
      return sum + (record && record.score !== '' ? Number(record.score) : 0);
    }, 0);
    const unitData = classUnits.find(u => u.id === unitId);
    const weight = Number(unitData?.weight || 0);
    const raw0 = unitMaxRaw > 0 ? (unitRaw / unitMaxRaw) * weight : 0;
    const scaled = (unitData?.term || '1') === '2' ? Math.round(raw0) : raw0;
    return { raw: unitRaw, maxRaw: unitMaxRaw, scaled, weight };
  };

  const getExamScoreLocal = (studentId, type) => {
    const cols = classScoreColumns.filter(c => c.type === type);
    const weight = type === 'midterm' ? (activeClass?.midtermWeight ?? 10) : (activeClass?.finalWeight ?? 10);
    const maxRaw = cols.reduce((sum, col) => sum + Number(col.maxScore || 0), 0);
    const raw = cols.reduce((sum, col) => {
      const record = scores.find(r => r.studentId === studentId && r.columnId === col.id);
      return sum + (record && record.score !== '' ? Number(record.score) : 0);
    }, 0);
    const raw0 = maxRaw > 0 ? (raw / maxRaw) * weight : 0;
    const scaled = type === 'final' ? Math.round(raw0) : raw0;
    return { raw, maxRaw, scaled, weight };
  };

  const handleExportCsv = () => {
    if (classStudents.length === 0) return alert('ไม่มีข้อมูลนักเรียน');
    
    const headers = [
      { key: 'number', label: 'เลขที่' },
      { key: 'studentId', label: 'รหัสประจำตัว' },
      { key: 'name', label: 'ชื่อ-นามสกุล' },
      ...termUnits.map(unit => ({ key: `unit_${unit.id}`, label: `${unit.name} (${unit.weight})` })),
      { key: 'collected_total', label: `รวมคะแนนทุกหน่วย (${termCollectedWeight})` },
      { key: 'exam', label: `${examLabel} (${examWeight})` },
      { key: 'term_total', label: `รวมคะแนนเทอมที่ ${viewTerm} (${termTotalWeight})` }
    ];

    const rows = classStudents.map(s => {
      const row = {
        number: s.number,
        studentId: s.studentId,
        name: s.name,
      };
      
      let collectedTotal = 0;
      termUnits.forEach(unit => {
        const uScore = getUnitScoreLocal(s.id, unit.id);
        row[`unit_${unit.id}`] = Math.round(uScore.scaled);
        collectedTotal += uScore.scaled;
      });
      
      const eScore = getExamScoreLocal(s.id, examType);
      
      row.collected_total = Math.round(collectedTotal);
      row.exam = Math.round(eScore.scaled);
      row.term_total = Math.round(collectedTotal + eScore.scaled);
      
      return row;
    });

    downloadCsv(`term_${viewTerm}_summary_${activeClass?.name || 'class'}.csv`, rows, headers);
  };

  if (!activeClassId) {
    return (
      <div className="empty-state">
        <Users size={48} />
        <h3>ไม่มีการเลือกห้องเรียน</h3>
        <p>กรุณาเลือกห้องเรียนจากเมนูด้านบนก่อน</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in hairline-grid">
      <div className="page-header no-print">
        <div>
          <h2 className="page-title">สรุปคะแนนรายเทอม: {activeClass?.name}</h2>
          <p className="page-subtitle">แสดงคะแนนสรุปแต่ละหน่วยการเรียนรู้ และคะแนนสอบ</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            className="form-control" 
            value={viewTerm}
            onChange={(e) => setViewTerm(e.target.value)}
          >
            <option value="1">เทอมที่ 1</option>
            <option value="2">เทอมที่ 2</option>
          </select>
          <button className="btn btn-secondary" onClick={handleExportCsv} title="ส่งออก Excel">
            <Download size={18} />
            <span className="hide-on-mobile">ส่งออก</span>
          </button>
          <button className="btn btn-primary" onClick={() => window.print()} title="พิมพ์ตารางนี้">
            <Printer size={18} />
            <span className="hide-on-mobile">พิมพ์</span>
          </button>
        </div>
      </div>

      <div className="hairline-cell gradebook-table-card print-friendly">
        {classStudents.length === 0 ? (
          <div className="empty-state no-print">
            <Users size={48} />
            <h3>ไม่พบข้อมูลนักเรียน</h3>
          </div>
        ) : termUnits.length === 0 ? (
          <div className="empty-state no-print">
            <h3>ไม่พบข้อมูลหน่วยการเรียนรู้ในเทอมนี้</h3>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ width: '60px', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>เลขที่</th>
                  <th rowSpan={2} style={{ width: '220px', backgroundColor: 'var(--bg-surface)' }}>ชื่อ - นามสกุล</th>
                  <th colSpan={termUnits.length} style={{ textAlign: 'center', backgroundColor: 'var(--bg-surface-elevated)' }}>
                    คะแนนแต่ละหน่วย
                  </th>
                  <th rowSpan={2} style={{ width: '100px', textAlign: 'center', backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-cyan)' }}>
                    <div>รวมคะแนน</div>
                    <div>ทุกหน่วย</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({termCollectedWeight})</div>
                  </th>
                  <th rowSpan={2} style={{ width: '120px', textAlign: 'center', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                    <div>{examLabel}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({examWeight})</div>
                  </th>
                  <th rowSpan={2} style={{ width: '100px', textAlign: 'center', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)' }}>
                    <div>รวมคะแนน</div>
                    <div>เทอมที่ {viewTerm}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({termTotalWeight})</div>
                  </th>
                </tr>
                <tr>
                  {termUnits.map((unit) => (
                    <th key={unit.id} className="col-unit-name" style={{ textAlign: 'center', backgroundColor: 'var(--bg-surface-elevated)', borderLeft: '1px solid var(--border-subtle)', borderBottom: '2px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <div style={{ margin: '0 auto' }}>{unit.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({unit.weight})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => {
                  let collectedTotal = 0;
                  return (
                    <tr key={s.id} className={s.status === "transferred" ? "row-transferred" : ""}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</td>
                      <td className="col-student-name" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</td>
                      
                      {termUnits.map(unit => {
                        const uScore = getUnitScoreLocal(s.id, unit.id);
                        collectedTotal += uScore.scaled;
                        return (
                          <td key={unit.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)' }}>
                            {Math.round(uScore.scaled)}
                          </td>
                        );
                      })}
                      
                      <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                        {Math.round(collectedTotal)}
                      </td>
                      
                      <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', fontWeight: 600 }}>
                        {(() => {
                          const eScore = getExamScoreLocal(s.id, examType);
                          return Math.round(eScore.scaled);
                        })()}
                      </td>
                      
                      <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {(() => {
                          const eScore = getExamScoreLocal(s.id, examType);
                          return Math.round(collectedTotal + eScore.scaled);
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          .no-print { display: none !important; }
          .report-stage { padding: 0 !important; }
          .print-friendly { 
            background: white !important; 
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .data-table th, .data-table td {
            border: 1px solid #000 !important;
            color: black !important;
            background: white !important;
            padding: 4px 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
