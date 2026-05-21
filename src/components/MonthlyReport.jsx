import { useState } from 'react';
import { Printer, FileText } from 'lucide-react';

export default function MonthlyReport({ appSettings, activeClassId, classes, students, attendance, scoreColumns, scores }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  const classScoreColumns = scoreColumns.filter(c => c.classId === activeClassId && c.type !== 'exam');

  const monthObj = new Date(selectedMonth + '-01');
  const monthName = monthObj.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const todayFormatted = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

  // Process data for the selected month
  const classAttendance = attendance.filter(a => a.classId === activeClassId && a.date.startsWith(selectedMonth));
  const uniqueDatesInMonth = [...new Set(classAttendance.map(a => a.date))];
  const totalDaysInMonth = uniqueDatesInMonth.length;

  const handlePrint = () => {
    window.print();
  };

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">รายงานประจำเดือน</h2>
            <p className="page-subtitle">พิมพ์รายงานสรุปผลการเรียนและเวลาเรียนรูปแบบทางการ</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <style>{`
        .print-a4 {
          color: black !important;
        }
        .print-a4 .table td, .print-a4 .table th {
          color: black !important;
        }
        .print-a4 .table th {
          background-color: #f1f5f9 !important;
        }
        @media print {
          body { background: white; margin: 0; padding: 0; }
          .app-container { display: block !important; height: auto; }
          .sidebar, .page-header, .no-print { display: none !important; }
          .main-content { padding: 0 !important; margin: 0 !important; }
          
          .print-a4 {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white;
            box-shadow: none !important;
            border: none !important;
          }
          
          .official-font {
            font-family: 'Sarabun', 'TH Sarabun PSK', sans-serif;
            color: black !important;
          }
          
          .print-table th, .print-table td {
            border: 1px solid black !important;
            padding: 4px 8px !important;
            color: black !important;
            background-color: white !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 15mm 20mm;
          }
        }
      `}</style>

      <div className="page-header no-print">
        <div>
          <h2 className="page-title">รายงานประจำเดือน: {activeClass?.name}</h2>
          <p className="page-subtitle">สร้างเอกสารบันทึกข้อความสรุปการจัดการเรียนการสอน</p>
        </div>
        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={18} />
          พิมพ์รายงาน (PDF)
        </button>
      </div>

      <div className="card no-print" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
        <div className="form-group" style={{ flex: 1, margin: 0 }}>
          <label className="form-label">เลือกเดือนที่ต้องการรายงาน</label>
          <input 
            type="month" 
            className="form-input" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', paddingBottom: '0.5rem' }}>
          * ข้อมูลในตารางจะคำนวณจากเดือนที่เลือกเท่านั้น
        </div>
      </div>

      {/* A4 Printable Area */}
      <div className="card print-a4 official-font" style={{ margin: '0 auto', maxWidth: '210mm', backgroundColor: 'white', color: 'black' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px', lineHeight: '1.4' }}>
          <div style={{ fontSize: '20pt', fontWeight: 'bold' }}>แบบรายงานผลการจัดการเรียนการสอนและสถิติเวลาเรียน</div>
          <div style={{ fontSize: '18pt', fontWeight: 'bold' }}>ประจำเดือน {monthName} ภาคเรียนที่ {appSettings?.semester || '....'} ปีการศึกษา {appSettings?.academicYear || '...........'}</div>
          <div style={{ fontSize: '18pt', fontWeight: 'bold' }}>{appSettings?.schoolName || 'โรงเรียน....................................'}</div>
        </div>
        
        <div style={{ fontSize: '16pt', marginBottom: '20px', lineHeight: '1.5' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div><strong>รายวิชา:</strong> {activeClass?.subject}</div>
            <div><strong>ระดับชั้น:</strong> {activeClass?.name}</div>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div><strong>ครูผู้สอน:</strong> {appSettings?.teacherName || '....................................'}</div>
            <div><strong>วันที่รายงาน:</strong> {todayFormatted}</div>
          </div>
        </div>
        
        {totalDaysInMonth === 0 ? (
          <div style={{ textAlign: 'center', margin: '2rem 0', fontStyle: 'italic', color: '#666' }}>
            (ไม่มีข้อมูลการเช็คชื่อในเดือนนี้)
          </div>
        ) : (
          <table className="table print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14pt', marginBottom: '20px' }}>
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>เลขที่</th>
                <th>ชื่อ-นามสกุล</th>
                <th style={{ width: '60px', textAlign: 'center' }}>มา/หยุด</th>
                <th style={{ width: '60px', textAlign: 'center' }}>ลา</th>
                <th style={{ width: '60px', textAlign: 'center' }}>ขาด</th>
                <th style={{ width: '60px', textAlign: 'center' }}>สาย</th>
                <th style={{ width: '100px', textAlign: 'center' }}>งานค้าง (ชิ้น)</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map(student => {
                const studentAttendance = classAttendance.filter(a => a.studentId === student.id);
                const presentCount = studentAttendance.filter(a => a.status === 'present').length;
                const holidayCount = studentAttendance.filter(a => a.status === 'holiday').length;
                const leaveCount = studentAttendance.filter(a => a.status === 'leave').length;
                const absentCount = studentAttendance.filter(a => a.status === 'absent').length;
                const lateCount = studentAttendance.filter(a => a.status === 'late').length;
                
                // Count missing works (only collected ones, overall)
                const missingWorks = classScoreColumns.filter(col => {
                  const record = scores.find(s => s.studentId === student.id && s.columnId === col.id);
                  return !record || record.score === '';
                }).length;

                return (
                  <tr key={student.id}>
                    <td style={{ textAlign: 'center' }}>{student.number}</td>
                    <td>{student.name}</td>
                    <td style={{ textAlign: 'center' }}>{presentCount + holidayCount}</td>
                    <td style={{ textAlign: 'center' }}>{leaveCount}</td>
                    <td style={{ textAlign: 'center' }}>{absentCount}</td>
                    <td style={{ textAlign: 'center' }}>{lateCount}</td>
                    <td style={{ textAlign: 'center' }}>{missingWorks > 0 ? missingWorks : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '14pt', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ whiteSpace: 'nowrap' }}>
            ลงชื่อ......................................ผู้รายงาน<br />
            ({appSettings?.teacherName || '......................................'})<br />
            ครูผู้สอน
          </div>
          <div style={{ whiteSpace: 'nowrap' }}>
            ลงชื่อ......................................ผู้รับรอง<br />
            ({appSettings?.academicHeadName || '......................................'})<br />
            หัวหน้าฝ่ายวิชาการ
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '14pt' }}>
          <div style={{ whiteSpace: 'nowrap' }}>
            ลงชื่อ......................................ผู้อนุมัติ<br />
            ({appSettings?.principalName || '......................................'})
          </div>
          <div>ผู้อำนวยการ{appSettings?.schoolName || 'โรงเรียน........................'}</div>
        </div>
        
      </div>
    </div>
  );
}
