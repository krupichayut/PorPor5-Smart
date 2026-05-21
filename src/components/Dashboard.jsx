import { BarChart3, Users, Calendar, Award, FileWarning, TrendingUp, ChevronRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ classes, students, activeClassId, setActiveClassId, attendance, scores, scoreColumns }) {
  const navigate = useNavigate();

  // ----- Global Helpers -----
  const calculateAttendanceRate = (attRecords) => {
    const validRecords = attRecords.filter(r => r.status !== 'holiday');
    if (validRecords.length === 0) return 0;
    const presentCount = validRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    return Math.round((presentCount / validRecords.length) * 100);
  };

  const calculateMissingWork = (clsId, clsStudents, clsColumns, clsScores) => {
    let missingCount = 0;
    clsStudents.forEach(student => {
      clsColumns.forEach(col => {
        const hasScore = clsScores.some(s => s.studentId === student.id && s.columnId === col.id && s.score !== null && s.score !== '');
        if (!hasScore) {
          missingCount++;
        }
      });
    });
    return missingCount;
  };

  // ----- Global Overview Mode -----
  if (!activeClassId) {
    const totalClasses = classes.length;
    const totalStudents = students.length;
    
    // Overall Attendance
    const overallAttRate = calculateAttendanceRate(attendance);

    // Overall Missing Work
    let totalMissing = 0;
    classes.forEach(cls => {
      const clsStudents = students.filter(s => s.classId === cls.id);
      const clsColumns = scoreColumns.filter(c => c.classId === cls.id);
      const clsScores = scores; // Assuming we can just pass all and it will filter by studentId
      totalMissing += calculateMissingWork(cls.id, clsStudents, clsColumns, clsScores);
    });

    const handleSelectClass = (id) => {
      setActiveClassId(id);
    };

    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">แดชบอร์ด: ภาพรวมทุกห้องเรียน</h2>
            <p className="page-subtitle">สรุปข้อมูลสถิติของทุกรายวิชาที่คุณครูรับผิดชอบ</p>
          </div>
        </div>

        {totalClasses === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>ยังไม่มีข้อมูลห้องเรียน กรุณาเพิ่มห้องเรียนในเมนู <strong>ห้องเรียน / วิชา</strong></p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
                  <BookOpen size={32} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>ห้องเรียนทั้งหมด</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>{totalClasses} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>ห้อง</span></h3>
                </div>
              </div>
              
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
                  <Users size={32} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>นักเรียนรวม</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>{totalStudents} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>คน</span></h3>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ backgroundColor: '#d1fae5', color: '#047857', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
                  <TrendingUp size={32} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>อัตราเข้าเรียนเฉลี่ย</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>{overallAttRate}<span style={{ fontSize: '1.2rem' }}>%</span></h3>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', border: totalMissing > 0 ? '1px solid #fca5a5' : 'none' }}>
                <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
                  <FileWarning size={32} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>ปริมาณงานค้างรวม</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, color: totalMissing > 0 ? '#dc2626' : 'inherit' }}>
                    {totalMissing} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>ชิ้น</span>
                  </h3>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem' }}>เปรียบเทียบสถิติแต่ละห้องเรียน</h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ชื่อห้องเรียน</th>
                      <th>วิชา</th>
                      <th style={{ textAlign: 'center' }}>จำนวนนักเรียน</th>
                      <th style={{ textAlign: 'center' }}>อัตราเข้าเรียน</th>
                      <th style={{ textAlign: 'center' }}>งานค้าง (ชิ้น)</th>
                      <th style={{ textAlign: 'center' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map(cls => {
                      const clsStudents = students.filter(s => s.classId === cls.id);
                      const clsAtt = attendance.filter(a => a.classId === cls.id);
                      const clsRate = calculateAttendanceRate(clsAtt);
                      const clsColumns = scoreColumns.filter(c => c.classId === cls.id);
                      const clsMissing = calculateMissingWork(cls.id, clsStudents, clsColumns, scores);
                      
                      return (
                        <tr key={cls.id} style={{ cursor: 'pointer' }} onClick={() => handleSelectClass(cls.id)} className="hover-row">
                          <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{cls.name}</td>
                          <td>{cls.subject}</td>
                          <td style={{ textAlign: 'center' }}>{clsStudents.length}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${clsRate >= 80 ? 'badge-primary' : clsRate >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                              {clsRate}%
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {clsMissing > 0 ? (
                              <span style={{ color: 'var(--danger-color)', fontWeight: 600 }}>{clsMissing}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>0</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn-icon" style={{ color: 'var(--text-muted)' }}>
                              <ChevronRight size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <style>{`
              .hover-row:hover {
                background-color: var(--bg-secondary);
              }
            `}</style>
          </>
        )}
      </div>
    );
  }

  // ----- Class-Specific Overview Mode -----
  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId);
  const classAttendance = attendance.filter(a => a.classId === activeClassId);
  const classColumns = scoreColumns.filter(c => c.classId === activeClassId);
  
  const classAttRate = calculateAttendanceRate(classAttendance);
  const totalMissingClass = calculateMissingWork(activeClassId, classStudents, classColumns, scores);

  // Top Missing Students
  const missingByStudent = classStudents.map(student => {
    let missingCount = 0;
    classColumns.forEach(col => {
      const hasScore = scores.some(s => s.studentId === student.id && s.columnId === col.id && s.score !== null && s.score !== '');
      if (!hasScore) missingCount++;
    });
    return { ...student, missingCount };
  });

  const topMissingStudents = missingByStudent
    .filter(s => s.missingCount > 0)
    .sort((a, b) => b.missingCount - a.missingCount)
    .slice(0, 5);

  const uniqueDates = [...new Set(classAttendance.map(a => a.date))];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button className="btn-icon" onClick={() => setActiveClassId(null)} title="กลับไปดูภาพรวมทุกห้อง" style={{ padding: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <h2 className="page-title" style={{ margin: 0 }}>แดชบอร์ด: {activeClass?.name}</h2>
          </div>
          <p className="page-subtitle">วิชา {activeClass?.subject} • จำนวนนักเรียน {classStudents.length} คน</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
            <Users size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>นักเรียน</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>{classStudents.length}</h3>
          </div>
        </div>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#d1fae5', color: '#047857', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
            <Calendar size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>อัตราเข้าเรียน (จาก {uniqueDates.length} ครั้ง)</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>{classAttRate}<span style={{ fontSize: '1.2rem' }}>%</span></h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
            <Award size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>ช่องให้คะแนนรวม</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>{classColumns.length}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', border: totalMissingClass > 0 ? '1px solid #fca5a5' : 'none' }}>
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
            <FileWarning size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>งานค้าง (ทั้งห้อง)</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, color: totalMissingClass > 0 ? '#dc2626' : 'inherit' }}>
              {totalMissingClass} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>ชิ้น</span>
            </h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: 0, border: '1px solid #fecaca' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#fff5f5' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
              <FileWarning size={20} /> นักเรียนที่งานค้างเยอะที่สุด (Top 5)
            </h3>
          </div>
          <div style={{ padding: '1rem' }}>
            {topMissingStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                <p>ไม่มีงานค้างเลย! ยอดเยี่ยมมาก 🎉</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {topMissingStudents.map((s, idx) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: idx !== topMissingStudents.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เลขที่ {s.number} | รหัส {s.studentId}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#dc2626' }}>{s.missingCount} ชิ้น</div>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => navigate('/missing-work')}>
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
          <BarChart3 size={64} style={{ color: 'var(--primary-light)', marginBottom: '1.5rem' }} />
          <h3 style={{ margin: '0 0 1rem 0' }}>สถิติและคะแนนเต็มรูปแบบ</h3>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.5rem' }}>
            ต้องการดูรายงานฉบับเต็มและสถิติเกรดทั้งหมดหรือไม่?
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/grades')}>
            ไปยัง สรุปผลการเรียน (Print)
          </button>
        </div>
      </div>
    </div>
  );
}
