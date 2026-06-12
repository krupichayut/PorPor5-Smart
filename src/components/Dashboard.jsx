import { BarChart3, Users, Calendar, Award, FileWarning, TrendingUp, ChevronRight, BookOpen, CheckCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export default function Dashboard({ classes, students, activeClassId, setActiveClassId, attendance, scores, scoreColumns, indicators }) {
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

  const getGradeSummaryData = (clsId, clsStudents, clsColumns, clsScores) => {
    const summary = { '4.0': 0, '3.5': 0, '3.0': 0, '2.5': 0, '2.0': 0, '1.5': 0, '1.0': 0, '0': 0 };
    const activeClassData = classes.find(c => c.id === clsId);
    if (!activeClassData) return [];
    
    const classUnits = indicators ? indicators.filter(i => i.classId === clsId) : [];
    const midtermWeight = activeClassData?.midtermWeight || 10;
    const finalWeight = activeClassData?.finalWeight || 10;

    clsStudents.forEach(student => {
      let term1Collected = 0;
      let term2Collected = 0;
      
      classUnits.forEach(unit => {
        const unitCols = clsColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
        const unitMaxRaw = unitCols.reduce((sum, col) => sum + col.maxScore, 0);
        const unitRaw = unitCols.reduce((sum, col) => {
          const s = clsScores.find(s => s.studentId === student.id && s.columnId === col.id);
          return sum + (s ? s.score : 0);
        }, 0);
        const scaled = unitMaxRaw > 0 ? (unitRaw / unitMaxRaw) * unit.weight : 0;
        if (unit.term === '1') term1Collected += scaled;
        else if (unit.term === '2') term2Collected += scaled;
        else term1Collected += scaled; 
      });

      const getExamScaled = (type, weight) => {
        const cols = clsColumns.filter(c => c.type === type);
        const maxRaw = cols.reduce((sum, col) => sum + col.maxScore, 0);
        const raw = cols.reduce((sum, col) => {
          const s = clsScores.find(s => s.studentId === student.id && s.columnId === col.id);
          return sum + (s ? s.score : 0);
        }, 0);
        return maxRaw > 0 ? (raw / maxRaw) * weight : 0;
      };

      const midtermScaled = getExamScaled('midterm', midtermWeight);
      const finalScaled = getExamScaled('final', finalWeight);

      let totalScaled = Math.round(term1Collected + term2Collected + midtermScaled + finalScaled);

      summary[getGrade(totalScaled)]++;
    });

    return [
      { grade: '4.0', value: summary['4.0'] },
      { grade: '3.5', value: summary['3.5'] },
      { grade: '3.0', value: summary['3.0'] },
      { grade: '2.5', value: summary['2.5'] },
      { grade: '2.0', value: summary['2.0'] },
      { grade: '1.5', value: summary['1.5'] },
      { grade: '1.0', value: summary['1.0'] },
      { grade: '0', value: summary['0'] }
    ];
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
          <div className="bento-item col-span-12" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>ยังไม่มีข้อมูลห้องเรียน กรุณาเพิ่มห้องเรียนในเมนู <strong>จัดการวิชา</strong></p>
          </div>
        ) : (
          <>
            <div className="bento-grid" style={{ marginBottom: '2.5rem' }}>
              {/* Top Row: Small Stats & Important Warning */}
              <div className="bento-item col-span-3" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }} onClick={() => navigate('/classes')}>
                <div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-game)' }}>{totalClasses}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>ห้องเรียน</p>
                </div>
                <div style={{ background: 'var(--grad-cyan-purple)', color: '#fff', padding: '0.75rem', borderRadius: '50%', boxShadow: 'var(--shadow-glow-cyan)' }}>
                  <BookOpen size={20} />
                </div>
              </div>

              <div className="bento-item col-span-3" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }} onClick={() => navigate('/students')}>
                <div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-game)' }}>{totalStudents}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>นักเรียนทั้งหมด</p>
                </div>
                <div style={{ background: 'var(--grad-pink-magenta)', color: '#fff', padding: '0.75rem', borderRadius: '50%', boxShadow: 'var(--shadow-glow-pink)' }}>
                  <Users size={20} />
                </div>
              </div>

              <div className="bento-item col-span-6" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', border: totalMissing > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.03)', background: totalMissing > 0 ? 'linear-gradient(to right, rgba(239, 68, 68, 0.1), rgba(34, 36, 54, 0.6))' : '' }} onClick={() => navigate('/grading')}>
                <div style={{ background: totalMissing > 0 ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-tertiary)', color: totalMissing > 0 ? '#f87171' : 'var(--text-secondary)', padding: '1rem', borderRadius: '16px' }}>
                  <FileWarning size={28} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>งานค้างที่ต้องติดตาม</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-game)', color: totalMissing > 0 ? '#f87171' : 'var(--text-primary)' }}>{totalMissing} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>ชิ้น</span></h3>
                </div>
              </div>

              {/* Middle Row: Quick Actions & Attendance */}
              <div className="bento-item col-span-6" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>เมนูลัด (Quick Actions)</p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => navigate('/classes')}>
                    <BookOpen size={16} /> จัดการห้องเรียน
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => navigate('/students')}>
                    <Users size={16} /> ข้อมูลนักเรียน
                  </button>
                </div>
              </div>

              <div className="bento-item col-span-6" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={() => navigate('/attendance')}>
                <div style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '1rem', borderRadius: '16px' }}>
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>อัตราการเข้าเรียนเฉลี่ย</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-game)', color: '#34d399' }}>{overallAttRate}<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>%</span></h3>
                </div>
              </div>

              <div className="bento-item col-span-7 row-span-2">
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>เปรียบเทียบอัตราเข้าเรียน</h3>
                <div style={{ width: '100%', height: 300 }}>
                  {classes.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={classes.map(cls => ({
                        name: cls.name,
                        อัตราเข้าเรียน: calculateAttendanceRate(attendance.filter(a => a.classId === cls.id))
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', color: '#fff' }} 
                        />
                        <defs>
                          <linearGradient id="colorAttendanceArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="อัตราเข้าเรียน" stroke="#00e5ff" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendanceArea)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>ไม่มีข้อมูลห้องเรียน</div>
                  )}
                </div>
              </div>
              <div className="bento-item col-span-5 row-span-2">
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--text-primary)' }}>ภาพรวมผลการเรียน</h3>
                <div style={{ width: '100%', height: 300 }}>
                  {classes.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={(() => {
                        const totalSummary = { '4.0': 0, '3.5': 0, '3.0': 0, '2.5': 0, '2.0': 0, '1.5': 0, '1.0': 0, '0': 0 };
                        classes.forEach(cls => {
                          const clsStudents = students.filter(s => s.classId === cls.id);
                          const clsColumns = scoreColumns.filter(c => c.classId === cls.id);
                          const clsSummaryData = getGradeSummaryData(cls.id, clsStudents, clsColumns, scores);
                          clsSummaryData.forEach(d => { totalSummary[d.grade] += d.value; });
                        });
                        return [
                          { grade: '4.0', value: totalSummary['4.0'] },
                          { grade: '3.5', value: totalSummary['3.5'] },
                          { grade: '3.0', value: totalSummary['3.0'] },
                          { grade: '2.5', value: totalSummary['2.5'] },
                          { grade: '2.0', value: totalSummary['2.0'] },
                          { grade: '1.5', value: totalSummary['1.5'] },
                          { grade: '1.0', value: totalSummary['1.0'] },
                          { grade: '0', value: totalSummary['0'] }
                        ];
                      })()}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="grade" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar name="นักเรียน" dataKey="value" stroke="#ff3366" fill="#ff3366" fillOpacity={0.4} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', color: '#fff' }} 
                          formatter={(value) => [`${value} คน`, 'จำนวนนักเรียน']}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>ไม่มีข้อมูลคะแนน</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bento-item col-span-12" style={{ padding: '0' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>เปรียบเทียบสถิติแต่ละห้องเรียน</h3>
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
            
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
                <FileWarning size={24} /> งานค้างมากที่สุด (แยกตามห้อง)
              </h3>
              <div className="bento-grid">
                {classes.map(cls => {
                  const clsStudents = students.filter(s => s.classId === cls.id);
                  const clsColumns = scoreColumns.filter(c => c.classId === cls.id);
                  
                  const missingByStudent = clsStudents.map(student => {
                    let missingCount = 0;
                    clsColumns.forEach(col => {
                      const hasScore = scores.some(s => s.studentId === student.id && s.columnId === col.id && s.score !== null && s.score !== '');
                      if (!hasScore) missingCount++;
                    });
                    return { ...student, missingCount };
                  });

                  const topMissing = missingByStudent
                    .filter(s => s.missingCount > 0)
                    .sort((a, b) => b.missingCount - a.missingCount)
                    .slice(0, 3);

                  if (topMissing.length === 0) {
                    return (
                      <div className="bento-item col-span-4" key={cls.id} style={{ padding: 0, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(16, 185, 129, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{cls.name}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cls.subject}</span>
                        </div>
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#10b981' }}>
                          <CheckCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>ไม่มีงานค้าง</div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="bento-item col-span-4" key={cls.id} style={{ padding: 0, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(239, 68, 68, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{cls.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cls.subject}</span>
                      </div>
                      <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {topMissing.map((s, idx) => (
                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: idx !== topMissing.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                  {idx + 1}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>เลขที่ {s.number}</div>
                                </div>
                              </div>
                              <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.9rem' }}>{s.missingCount} ชิ้น</div>
                            </div>
                          ))}
                        </div>
                        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem', padding: '0.5rem' }} onClick={() => { setActiveClassId(cls.id); navigate('/missing-work'); }}>
                          จัดการงานค้าง
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <style>{`
              .hover-row:hover {
                background-color: var(--bg-secondary);
              }
              .hover-card {
                transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
              }
              .hover-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
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
      
      <div className="bento-grid" style={{ marginBottom: '2rem' }}>
        {/* Class Hero Banner */}
        <div className="bento-item col-span-12" style={{ background: 'linear-gradient(to right, rgba(99, 102, 241, 0.15), rgba(52, 211, 153, 0.1))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0', fontFamily: 'var(--font-game)', color: 'var(--text-primary)' }}>{activeClass?.name}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1rem' }}>วิชา: {activeClass?.subject}</p>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>นักเรียน</p>
              <h4 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary-color)' }}>{classStudents.length}</h4>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>ช่องให้คะแนน</p>
              <h4 style={{ fontSize: '1.5rem', margin: 0, color: '#fbbf24' }}>{classColumns.length}</h4>
            </div>
          </div>
        </div>

        {/* Small Stats */}
        <div className="bento-item col-span-6" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
            <Calendar size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>อัตราเข้าเรียน (จาก {uniqueDates.length} ครั้ง)</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, color: '#34d399' }}>{classAttRate}<span style={{ fontSize: '1.2rem' }}>%</span></h3>
          </div>
        </div>

        <div className="bento-item col-span-6" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', border: totalMissingClass > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ backgroundColor: totalMissingClass > 0 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-tertiary)', color: totalMissingClass > 0 ? '#f87171' : 'var(--text-secondary)', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
            <FileWarning size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>งานค้างรวมทั้งห้อง</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, color: totalMissingClass > 0 ? '#f87171' : 'var(--text-primary)' }}>
              {totalMissingClass} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>ชิ้น</span>
            </h3>
          </div>
        </div>
        <div className="bento-item col-span-6 row-span-2" style={{ padding: 0, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
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
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เลขที่ {s.number} | รหัส {s.studentId}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#f87171' }}>{s.missingCount} ชิ้น</div>
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

        <div className="bento-item col-span-6 row-span-2" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)' }}>
            <Calendar size={20} /> สัดส่วนการมาเรียนรวม
          </h3>
          <div style={{ width: '100%', height: '100%', minHeight: 260, flex: 1 }}>
            {classAttendance.filter(r => r.status !== 'holiday').length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'มาเรียน/สาย', value: classAttendance.filter(r => r.status === 'present' || r.status === 'late').length },
                      { name: 'ลา', value: classAttendance.filter(r => r.status === 'leave').length },
                      { name: 'ขาด', value: classAttendance.filter(r => r.status === 'absent').length }
                    ]}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#34d399" />
                    <Cell fill="#fbbf24" />
                    <Cell fill="#f87171" />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                ไม่มีข้อมูลเช็คชื่อ
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/attendance')} style={{ width: '100%' }}>
              ดูรายละเอียดเวลาเรียน
            </button>
          </div>
        </div>
        
        <div className="bento-item col-span-12 row-span-2" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
            <BarChart3 size={20} /> สรุปผลการเรียน (ตัดเกรดจำลอง)
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            {classColumns.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getGradeSummaryData(activeClassId, classStudents, classColumns, scores)}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="grade" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name="นักเรียน" dataKey="value" stroke="#34d399" fill="#34d399" fillOpacity={0.4} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', color: '#fff' }} 
                    formatter={(value) => [`${value} คน`, 'จำนวนนักเรียน']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                ไม่มีช่องคะแนนสำหรับประเมินผล
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/grades')} style={{ width: '100%', maxWidth: '400px' }}>
              ดูสรุปผลการเรียนฉบับเต็ม (PicthClass)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
