import { useState } from 'react';
import { BarChart3, Download } from 'lucide-react';

export default function Grades({ students, activeClassId, classes, scores, scoreColumns, attributes, literacy, competencies }) {
  const [selectedTerm, setSelectedTerm] = useState('all');

  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  
  const classScoreColumns = scoreColumns.filter(c => 
    c.classId === activeClassId && 
    (selectedTerm === 'all' || c.term === selectedTerm || c.term === 'all' || !c.term)
  );
  const totalMaxCollected = classScoreColumns.filter(c => c.type !== 'exam').reduce((sum, col) => sum + col.maxScore, 0);
  const totalMaxExam = classScoreColumns.filter(c => c.type === 'exam').reduce((sum, col) => sum + col.maxScore, 0);

  const collectedRatio = activeClass?.collectedRatio || 80;
  const examRatio = activeClass?.examRatio || 20;

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

    let scaledCollected = 0;
    if (totalMaxCollected > 0) {
      scaledCollected = (rawCollected / totalMaxCollected) * collectedRatio;
    }

    let scaledExam = 0;
    if (totalMaxExam > 0) {
      scaledExam = (rawExam / totalMaxExam) * examRatio;
    }

    return {
      rawCollected,
      rawExam,
      scaledCollected: Number(scaledCollected.toFixed(2)),
      scaledExam: Number(scaledExam.toFixed(2)),
      totalScaled: Math.round(scaledCollected + scaledExam)
    };
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
      default: return '#94a3b8';
    }
  };

  const getGradeSummary = () => {
    const summary = { '4.0': 0, '3.5': 0, '3.0': 0, '2.5': 0, '2.0': 0, '1.5': 0, '1.0': 0, '0': 0 };
    classStudents.forEach(s => {
      const { totalScaled } = calculateStudentScores(s.id);
      const grade = getGrade(totalScaled);
      summary[grade]++;
    });
    return summary;
  };

  const calculateEvaluationAverage = (studentId, data, count) => {
    let sum = 0;
    let actualCount = 0;
    const studentRecords = data.filter(d => d.studentId === studentId);
    studentRecords.forEach(r => {
      sum += r.score;
      actualCount++;
    });
    if (actualCount === 0 || actualCount < count) return '-';
    return Math.round(sum / actualCount);
  };

  const getLevelLabel = (score) => {
    if (score === 3) return 'ดีเยี่ยม';
    if (score === 2) return 'ดี';
    if (score === 1) return 'ผ่าน';
    if (score === 0) return 'ไม่ผ่าน';
    return '-';
  };

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">สรุปผลการเรียน</h2>
            <p className="page-subtitle">รายงาน ปพ.5 ฉบับสมบูรณ์ (พร้อมระบบแปลงสัดส่วนคะแนน)</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <BarChart3 size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  const gradeSummary = getGradeSummary();

  return (
    <div className="animate-fade-in print-container">
      <div className="page-header print-header">
        <div>
          <h2 className="page-title">
            แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) 
            <span style={{ fontSize: '1.25rem', marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
              {selectedTerm === '1' ? '(ภาคเรียนที่ 1)' : selectedTerm === '2' ? '(ภาคเรียนที่ 2)' : '(รวมตลอดปี)'}
            </span>
          </h2>
          <p className="page-subtitle" style={{ fontSize: '1rem', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
            <strong>รายวิชา:</strong> {activeClass?.subject} &nbsp;&nbsp;&nbsp; 
            <strong>ชั้น:</strong> {activeClass?.name} &nbsp;&nbsp;&nbsp;
            <strong>สัดส่วนคะแนน:</strong> {collectedRatio} : {examRatio}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }} className="no-print">
          <select 
            className="form-select" 
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            style={{ width: '220px', margin: 0 }}
          >
            <option value="all">แสดงผลรวมตลอดปี</option>
            <option value="1">แสดงเฉพาะภาคเรียนที่ 1</option>
            <option value="2">แสดงเฉพาะภาคเรียนที่ 2</option>
          </select>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Download size={18} />
            พิมพ์รายงาน
          </button>
        </div>
      </div>

      {classStudents.length > 0 && classScoreColumns.length > 0 && (
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {['4.0', '3.5', '3.0', '2.5', '2.0', '1.5', '1.0', '0'].map(grade => (
            <div key={grade} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>เกรด {grade}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getGradeColor(grade) }}>
                {gradeSummary[grade]} <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>คน</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card print-card">
        {classStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <p>ยังไม่มีข้อมูลนักเรียนในห้องนี้</p>
          </div>
        ) : (
          <div className="table-container print-table-container">
            <table className="table print-table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ width: '50px', textAlign: 'center', verticalAlign: 'middle' }}>เลขที่</th>
                  <th rowSpan={2} style={{ verticalAlign: 'middle' }}>รหัสประจำตัว</th>
                  <th rowSpan={2} style={{ verticalAlign: 'middle' }}>ชื่อ - นามสกุล</th>
                  <th colSpan={2} style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>สัดส่วนคะแนน 100</th>
                  <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>รวม 100</th>
                  <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle' }}>ระดับผลการเรียน</th>
                  <th colSpan={3} style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>การประเมิน (3=ดีเยี่ยม, 2=ดี, 1=ผ่าน, 0=ไม่ผ่าน)</th>
                </tr>
                <tr>
                  <th style={{ textAlign: 'center', fontSize: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>เก็บ ({collectedRatio})</th>
                  <th style={{ textAlign: 'center', fontSize: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>สอบ ({examRatio})</th>
                  <th style={{ textAlign: 'center', fontSize: '0.75rem' }}>คุณลักษณะฯ</th>
                  <th style={{ textAlign: 'center', fontSize: '0.75rem' }}>อ่าน คิดวิเคราะห์ เขียน</th>
                  <th style={{ textAlign: 'center', fontSize: '0.75rem' }}>สมรรถนะสำคัญ</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => {
                  const studentScores = calculateStudentScores(s.id);
                  const grade = getGrade(studentScores.totalScaled);
                  
                  const attrAvg = calculateEvaluationAverage(s.id, attributes, 8);
                  const litAvg = calculateEvaluationAverage(s.id, literacy, 3);
                  const compAvg = calculateEvaluationAverage(s.id, competencies, 5);
                  
                  return (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td>{s.studentId}</td>
                      <td>{s.name}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{studentScores.scaledCollected}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{studentScores.scaledExam}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--primary-color)', backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>{studentScores.totalScaled}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{grade}</td>
                      <td style={{ textAlign: 'center' }}>{getLevelLabel(attrAvg)}</td>
                      <td style={{ textAlign: 'center' }}>{getLevelLabel(litAvg)}</td>
                      <td style={{ textAlign: 'center' }}>{getLevelLabel(compAvg)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="print-signatures" style={{ display: 'none', marginTop: '4rem' }}>
        <table style={{ width: '100%', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', textAlign: 'center', padding: '2rem 0' }}>
                <p>ลงชื่อ ..............................................................</p>
                <p>(..............................................................)</p>
                <p>ครูผู้สอน</p>
                <p>วันที่ ........ / ........ / ........</p>
              </td>
              <td style={{ width: '50%', textAlign: 'center', padding: '2rem 0' }}>
                <p>ลงชื่อ ..............................................................</p>
                <p>(..............................................................)</p>
                <p>หัวหน้ากลุ่มสาระการเรียนรู้</p>
                <p>วันที่ ........ / ........ / ........</p>
              </td>
            </tr>
            <tr>
              <td style={{ width: '50%', textAlign: 'center', padding: '2rem 0' }}>
                <p>ลงชื่อ ..............................................................</p>
                <p>(..............................................................)</p>
                <p>รองผู้อำนวยการกลุ่มบริหารวิชาการ</p>
                <p>วันที่ ........ / ........ / ........</p>
              </td>
              <td style={{ width: '50%', textAlign: 'center', padding: '2rem 0' }}>
                <p><strong>อนุมัติผลการเรียน</strong></p>
                <br/>
                <p>ลงชื่อ ..............................................................</p>
                <p>(..............................................................)</p>
                <p>ผู้อำนวยการสถานศึกษา</p>
                <p>วันที่ ........ / ........ / ........</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <style>{`
        @media print {
          @page { size: landscape; margin: 1cm; }
          .sidebar, .no-print, .modal-overlay { display: none !important; }
          .app-container { display: block; height: auto; overflow: visible; }
          .main-content { padding: 0 !important; margin: 0 !important; overflow: visible; }
          body { background: white; color: black; }
          .card { box-shadow: none !important; border: none !important; padding: 0 !important; }
          .print-header { border-bottom: 2px solid black; padding-bottom: 1rem; margin-bottom: 2rem; display: block !important; text-align: center; }
          .print-header .page-title { font-size: 1.5rem; text-align: center; }
          .print-header .page-subtitle { font-size: 1.2rem; text-align: center; }
          
          .table { border: 1px solid black; }
          .table tr { break-inside: avoid; page-break-inside: avoid; }
          .table th, .table td { border: 1px solid black !important; padding: 0.5rem !important; color: black !important; background: white !important; font-size: 12pt; }
          .table th { background-color: #f0f0f0 !important; font-weight: bold; }
          
          .print-signatures { display: block !important; break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
