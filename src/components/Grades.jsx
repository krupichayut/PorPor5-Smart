import { useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { GRADE_ORDER, calculateStudentScores, getClassScoreContext, getGrade, getGradeColor, getUnitWeightSum } from '../utils/scoring';

export default function Grades({ students, activeClassId, classes, scores, scoreColumns, attributes, literacy, competencies, indicators }) {
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [reportType, setReportType] = useState('all'); // 'all', 'grades', 'evaluations'

  const scoreContext = getClassScoreContext(activeClassId, classes, scoreColumns, indicators);
  const { activeClass, classScoreColumns, classUnits, midtermWeight, finalWeight } = scoreContext;
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  
  const term1CollectedWeight = getUnitWeightSum(classUnits, '1');
  const term2CollectedWeight = getUnitWeightSum(classUnits, '2');

  const getGradeSummary = () => {
    const summary = { '4.0': 0, '3.5': 0, '3.0': 0, '2.5': 0, '2.0': 0, '1.5': 0, '1.0': 0, '0': 0 };
    classStudents.forEach(s => {
      const { totalScaled } = calculateStudentScores(s.id, scoreContext, scores, selectedTerm);
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
            <p className="page-subtitle">รายงาน PicthClass ฉบับสมบูรณ์ (พร้อมระบบแปลงสัดส่วนคะแนนตามหน่วย)</p>
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

  const totalPossible = (() => {
    if (selectedTerm === '1') return term1CollectedWeight + midtermWeight;
    if (selectedTerm === '2') return term2CollectedWeight + finalWeight;
    return term1CollectedWeight + midtermWeight + term2CollectedWeight + finalWeight;
  })();

  return (
    <div className="animate-fade-in print-container">
      <div className="page-header print-header">
        <div>
          <h2 className="page-title">
            แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (PicthClass) 
            <span style={{ fontSize: '1.25rem', marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
              {selectedTerm === '1' ? '(ภาคเรียนที่ 1)' : selectedTerm === '2' ? '(ภาคเรียนที่ 2)' : '(รวมตลอดปี)'}
            </span>
          </h2>
          <p className="page-subtitle" style={{ fontSize: '1rem', marginTop: '0.5rem', color: 'var(--text-primary)' }}>
            <strong>รายวิชา:</strong> {activeClass?.subject} &nbsp;&nbsp;&nbsp; 
            <strong>ชั้น:</strong> {activeClass?.name} &nbsp;&nbsp;&nbsp;
            <strong>คะแนนเต็ม:</strong> {totalPossible} คะแนน
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }} className="no-print">
          <select 
            className="form-select" 
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            style={{ width: '180px', margin: 0 }}
          >
            <option value="all">แสดงตารางรวม</option>
            <option value="grades">เฉพาะสรุปผลการเรียน</option>
            <option value="evaluations">เฉพาะการประเมิน</option>
          </select>
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
          {GRADE_ORDER.map(grade => (
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
                  {reportType !== 'evaluations' && (
                    <>
                      <th colSpan={selectedTerm === 'all' ? 4 : 2} style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>สัดส่วนคะแนน</th>
                      <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>รวม {totalPossible}</th>
                      <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle' }}>ระดับผลการเรียน</th>
                    </>
                  )}
                  {reportType !== 'grades' && (
                    <th colSpan={3} style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>การประเมิน (3=ดีเยี่ยม, 2=ดี, 1=ผ่าน, 0=ไม่ผ่าน)</th>
                  )}
                </tr>
                <tr>
                  {reportType !== 'evaluations' && (
                    <>
                      {(selectedTerm === '1' || selectedTerm === 'all') && (
                        <>
                          <th style={{ textAlign: 'center', fontSize: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>เทอม 1 ({term1CollectedWeight})</th>
                          <th style={{ textAlign: 'center', fontSize: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>กลางภาค ({midtermWeight})</th>
                        </>
                      )}
                      {(selectedTerm === '2' || selectedTerm === 'all') && (
                        <>
                          <th style={{ textAlign: 'center', fontSize: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>เทอม 2 ({term2CollectedWeight})</th>
                          <th style={{ textAlign: 'center', fontSize: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>ปลายภาค ({finalWeight})</th>
                        </>
                      )}
                    </>
                  )}
                  {reportType !== 'grades' && (
                    <>
                      <th style={{ textAlign: 'center', fontSize: '0.75rem' }}>คุณลักษณะฯ</th>
                      <th style={{ textAlign: 'center', fontSize: '0.75rem' }}>อ่าน คิดวิเคราะห์ เขียน</th>
                      <th style={{ textAlign: 'center', fontSize: '0.75rem' }}>สมรรถนะสำคัญ</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => {
                  const studentScores = calculateStudentScores(s.id, scoreContext, scores, selectedTerm);
                  const grade = getGrade(studentScores.totalScaled);
                  
                  const attrAvg = calculateEvaluationAverage(s.id, attributes, 8);
                  const litAvg = calculateEvaluationAverage(s.id, literacy, 3);
                  const compAvg = calculateEvaluationAverage(s.id, competencies, 5);
                  
                  return (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td>{s.studentId}</td>
                      <td>{s.name}</td>
                      {reportType !== 'evaluations' && (
                        <>
                          {(selectedTerm === '1' || selectedTerm === 'all') && (
                            <>
                              <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{studentScores.term1Collected}</td>
                              <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{studentScores.midtermScaled}</td>
                            </>
                          )}
                          {(selectedTerm === '2' || selectedTerm === 'all') && (
                            <>
                              <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{studentScores.term2Collected}</td>
                              <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{studentScores.finalScaled}</td>
                            </>
                          )}
                          <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--primary-color)', backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>{studentScores.totalScaled}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{grade}</td>
                        </>
                      )}
                      {reportType !== 'grades' && (
                        <>
                          <td style={{ textAlign: 'center' }}>{getLevelLabel(attrAvg)}</td>
                          <td style={{ textAlign: 'center' }}>{getLevelLabel(litAvg)}</td>
                          <td style={{ textAlign: 'center' }}>{getLevelLabel(compAvg)}</td>
                        </>
                      )}
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
          @page { size: A4 landscape; margin: 10mm; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
          .sidebar, .no-print, .mobile-top-bar, .modal-overlay { display: none !important; }
          .app-container { display: block; height: auto; overflow: visible; }
          .main-content { padding: 0 !important; margin: 0 !important; overflow: visible; background: white !important; }
          body { background: white !important; color: black !important; }
          .card { box-shadow: none !important; border: none !important; padding: 0 !important; background: transparent !important; }
          .table-container { overflow: visible !important; }
          
          .print-header { border-bottom: 2px solid black; padding-bottom: 1rem; margin-bottom: 1.5rem; display: block !important; text-align: center; color: black !important; }
          .print-header .page-title { font-size: 18pt !important; text-align: center; color: black !important; margin-bottom: 0.5rem; }
          .print-header .page-subtitle { font-size: 12pt !important; text-align: center; color: black !important; }
          
          .table { border: 1px solid black; border-collapse: collapse; width: 100%; margin-bottom: 2rem; }
          .table thead { display: table-header-group; }
          .table tr { break-inside: avoid; page-break-inside: avoid; }
          .table th, .table td { border: 1px solid black !important; padding: 6px !important; color: black !important; background: white !important; font-size: 11pt !important; }
          .table th { background-color: #e2e8f0 !important; font-weight: bold; text-align: center; }
          
          .print-signatures { display: block !important; break-inside: avoid; page-break-inside: avoid; margin-top: 2rem; font-size: 12pt; color: black !important; }
        }
      `}</style>
    </div>
  );
}
