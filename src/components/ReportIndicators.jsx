import React, { useState } from 'react';
import { Users, Download, Printer } from 'lucide-react';
import { downloadCsv } from '../utils/fileExports';

export default function ReportIndicators({ students, activeClassId, classes, scores, scoreColumns, indicators }) {
  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  
  const classScoreColumns = scoreColumns.filter(c => c.classId === activeClassId);
  const classUnits = indicators ? indicators.filter(i => i.classId === activeClassId) : [];

  const [viewTerm, setViewTerm] = useState('all');

  const allIndicators = [];
  classUnits.forEach(unit => {
    // Check term filter
    const unitTerm = unit.term || '1';
    if (viewTerm !== 'all' && unitTerm !== viewTerm && unitTerm !== 'all') return;

    if (unit.items) {
      unit.items.forEach(ind => {
        const linkedCols = classScoreColumns.filter(c => c.indicatorId === ind.id && c.type === 'collected');
        if (linkedCols.length > 0) {
          const totalMaxScore = linkedCols.reduce((sum, c) => sum + (Number(c.maxScore) || 0), 0);
          allIndicators.push({
            ...ind,
            linkedCols,
            totalMaxScore
          });
        }
      });
    }
  });

  const totalMaxAll = allIndicators.reduce((sum, ind) => sum + ind.totalMaxScore, 0);

  const handleExportCsv = () => {
    if (classStudents.length === 0) return alert('ไม่มีข้อมูลนักเรียน');
    
    const headers = [
      { key: 'number', label: 'เลขที่' },
      { key: 'studentId', label: 'รหัสประจำตัว' },
      { key: 'name', label: 'ชื่อ-นามสกุล' },
      ...allIndicators.map((ind, i) => ({ key: ind.id, label: ind.code })),
      { key: 'total', label: 'รวมคะแนนตัวชี้วัด' },
      { key: 'percentage', label: 'ร้อยละ' }
    ];

    const rows = classStudents.map(s => {
      const row = {
        number: s.number,
        studentId: s.studentId,
        name: s.name,
      };
      let studentTotal = 0;
      allIndicators.forEach(ind => {
        const score = ind.linkedCols.reduce((sum, col) => {
          const record = scores.find(r => r.studentId === s.id && r.columnId === col.id);
          return sum + (record && record.score !== '' ? Number(record.score) : 0);
        }, 0);
        row[ind.id] = score;
        studentTotal += score;
      });
      row.total = studentTotal;
      row.percentage = totalMaxAll > 0 ? ((studentTotal / totalMaxAll) * 100).toFixed(2) : 0;
      return row;
    });

    downloadCsv(`indicator_summary_${activeClass?.name || 'class'}.csv`, rows, headers);
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
          <h2 className="page-title">สรุปคะแนนตามตัวชี้วัด: {activeClass?.name}</h2>
          <p className="page-subtitle">แสดงคะแนนที่รวบรวมตามตัวชี้วัด (รวมจากทุกชิ้นงาน)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            className="form-control" 
            value={viewTerm}
            onChange={(e) => setViewTerm(e.target.value)}
          >
            <option value="all">ทั้งปีการศึกษา</option>
            <option value="1">เฉพาะเทอม 1</option>
            <option value="2">เฉพาะเทอม 2</option>
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
        ) : allIndicators.length === 0 ? (
          <div className="empty-state no-print">
            <h3>ไม่พบข้อมูลตัวชี้วัด</h3>
            <p>กรุณาผูกตัวชี้วัดเข้ากับช่องคะแนนในหน้าบันทึกคะแนนก่อน</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th rowSpan={3} style={{ width: '60px', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>เลขที่</th>
                  <th rowSpan={3} style={{ width: '220px', backgroundColor: 'var(--bg-surface)' }}>ชื่อ - นามสกุล</th>
                  <th colSpan={allIndicators.length} style={{ textAlign: 'center', backgroundColor: 'var(--bg-surface-elevated)' }}>
                    ตัวชี้วัดข้อที่
                  </th>
                  <th rowSpan={3} style={{ width: '80px', textAlign: 'center', backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-cyan)' }}>
                    รวมคะแนน<br/>ตัวชี้วัด
                  </th>
                  <th rowSpan={3} style={{ width: '80px', textAlign: 'center', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                    ร้อยละ
                  </th>
                </tr>
                <tr>
                  {allIndicators.map((ind, i) => (
                    <th key={ind.id} style={{ textAlign: 'center', backgroundColor: 'var(--bg-surface-elevated)', borderLeft: '1px solid var(--border-subtle)', fontWeight: 'normal', fontSize: '0.8rem' }}>
                      {i + 1}
                    </th>
                  ))}
                </tr>
                <tr>
                  {allIndicators.map((ind) => (
                    <th key={ind.id} title={ind.description} style={{ textAlign: 'center', backgroundColor: 'var(--bg-surface-elevated)', borderLeft: '1px solid var(--border-subtle)', borderBottom: '2px solid var(--border-color)', fontSize: '0.8rem' }}>
                      <div>{ind.code}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({ind.totalMaxScore})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => {
                  let studentTotal = 0;
                  return (
                    <tr key={s.id} className={s.status === "transferred" ? "row-transferred" : ""}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</td>
                      <td className="col-student-name" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.name}</td>
                      
                      {allIndicators.map(ind => {
                        const score = ind.linkedCols.reduce((sum, col) => {
                          const record = scores.find(r => r.studentId === s.id && r.columnId === col.id);
                          return sum + (record && record.score !== '' ? Number(record.score) : 0);
                        }, 0);
                        studentTotal += score;
                        return (
                          <td key={ind.id} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)' }}>
                            {score}
                          </td>
                        );
                      })}
                      
                      <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                        {studentTotal}
                      </td>
                      <td style={{ textAlign: 'center', borderLeft: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-tertiary)', fontWeight: 600 }}>
                        {totalMaxAll > 0 ? ((studentTotal / totalMaxAll) * 100).toFixed(1) : 0}
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
          @page { size: A4 landscape; margin: 10mm; }
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
