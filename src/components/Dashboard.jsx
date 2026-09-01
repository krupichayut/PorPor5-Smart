import { BarChart3, Users, Calendar, FileWarning, TrendingUp, ChevronRight, BookOpen, CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { calculateMissingWork, getClassScoreContext, getGradeSummaryData } from '../utils/scoring';

function ChartFrame({ children, style }) {
  const frameRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return undefined;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.floor(rect.width),
        height: Math.floor(rect.height)
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frameRef} style={{ width: '100%', minWidth: 0, ...style }}>
      {size.width > 0 && size.height > 0 ? (typeof children === 'function' ? children(size) : children) : (
        <div style={{ display: 'flex', height: '100%', minHeight: 180, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          Preparing Chart...
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ classes, students, activeClassId, setActiveClassId, attendance, scores, scoreColumns, indicators }) {
  const navigate = useNavigate();

  // ----- Global Helpers -----
  const calculateAttendanceRate = (attRecords) => {
    const validRecords = attRecords.filter(r => r.status !== 'holiday');
    if (validRecords.length === 0) return 0;
    const presentCount = validRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    return Math.round((presentCount / validRecords.length) * 100);
  };

  // ----- Global Computations (Moved outside conditional to fix Hook error) -----
  const overallAttRate = calculateAttendanceRate(attendance);

  const totalMissing = useMemo(() => {
    let missing = 0;
    classes.forEach(cls => {
      const clsStudents = students.filter(s => s.classId === cls.id);
      const clsColumns = scoreColumns.filter(c => c.classId === cls.id);
      missing += calculateMissingWork(clsStudents, clsColumns, scores);
    });
    return missing;
  }, [classes, students, scoreColumns, scores]);

  const radarChartData = useMemo(() => {
    const totalSummary = { '4.0': 0, '3.5': 0, '3.0': 0, '2.5': 0, '2.0': 0, '1.5': 0, '1.0': 0, '0': 0 };
    classes.forEach(cls => {
      const clsStudents = students.filter(s => s.classId === cls.id);
      const clsSummaryData = getGradeSummaryData(clsStudents, getClassScoreContext(cls.id, classes, scoreColumns, indicators), scores);
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
  }, [classes, students, scoreColumns, indicators, scores]);

  const globalAtRiskStudents = useMemo(() => {
    const atRisk = [];
    students.forEach(student => {
      const cls = classes.find(c => c.id === student.classId);
      if (!cls) return;
      
      const clsColumns = scoreColumns.filter(c => c.classId === cls.id);
      let missingCount = 0;
      clsColumns.forEach(col => {
        const hasScore = scores.some(s => s.studentId === student.id && s.columnId === col.id && s.score !== null && s.score !== '');
        if (!hasScore) missingCount++;
      });
      
      const studAtt = attendance.filter(a => a.studentId === student.id);
      const attRate = calculateAttendanceRate(studAtt);
      
      // At risk if >= 3 missing works OR attendance < 80% (with at least some attendance recorded)
      if (missingCount >= 3 || (studAtt.length > 0 && attRate < 80)) {
        atRisk.push({
          ...student,
          className: cls.name,
          missingCount,
          attRate
        });
      }
    });
    return atRisk.sort((a, b) => b.missingCount - a.missingCount).slice(0, 10);
  }, [students, classes, scoreColumns, scores, attendance]);

  // ----- Global Overview Mode -----
  if (!activeClassId) {
    const totalClasses = classes.length;
    const totalStudents = students.length;
    
    const handleSelectClass = (id) => {
      setActiveClassId(id);
    };

    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">ศูนย์ควบคุมและภาพรวมระบบ (Command Center)</h2>
            <p className="page-subtitle">สถิติและข้อมูลภาพรวมของทุกรายวิชาและนักเรียน</p>
          </div>
        </div>

        {totalClasses === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} className="empty-state-icon" />
            <h3>ยังไม่มีข้อมูลห้องเรียนในระบบ</h3>
            <p>กรุณาสร้างห้องเรียนและรายวิชาแรกของคุณเพื่อเริ่มต้นใช้งานระบบ</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/classes')}>
              สร้างห้องเรียนแรก
            </button>
          </div>
        ) : (
          <>
            <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
              <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/classes')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="stat-label">วิชา / ห้องเรียน</div>
                  <BookOpen size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="stat-value" style={{ marginTop: '0.5rem' }}>{totalClasses}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ห้องที่กำลังสอน</div>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/students')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="stat-label">นักเรียนทั้งหมด</div>
                  <Users size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="stat-value" style={{ marginTop: '0.5rem' }}>{totalStudents}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>คนในระบบ</div>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/attendance')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="stat-label">เวลาเรียนรวม</div>
                  <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="stat-value" style={{ marginTop: '0.5rem', color: overallAttRate < 80 ? 'var(--warning)' : 'var(--success)' }}>{overallAttRate}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>อัตราการเข้าเรียน</div>
              </div>
              <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/grading')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="stat-label">งานค้างส่งรวม</div>
                  <FileWarning size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="stat-value" style={{ marginTop: '0.5rem', color: totalMissing > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{totalMissing}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>รายการที่ยังไม่ส่ง</div>
              </div>
            </div>

            <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', marginBottom: '1.5rem' }}>
              <div className="hairline-cell">
                <div className="stat-label" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={15} style={{ color: 'var(--text-primary)' }} /> แนวโน้มการเข้าเรียนรายห้อง
                </div>
                <ChartFrame style={{ height: 260 }}>
                  {({ width, height }) => classes.length > 0 ? (
                      <AreaChart width={width} height={height} data={classes.map(cls => ({
                        name: cls.name,
                        rate: calculateAttendanceRate(attendance.filter(a => a.classId === cls.id))
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem' }} 
                        />
                        <defs>
                          <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="rate" stroke="#ffffff" strokeWidth={2} fill="url(#colorAtt)" />
                      </AreaChart>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>ไม่มีข้อมูล</div>
                  )}
                </ChartFrame>
              </div>

              <div className="hairline-cell">
                <div className="stat-label" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={15} style={{ color: 'var(--text-primary)' }} /> การกระจายตัวของผลการเรียน (Grade Distribution)
                </div>
                <ChartFrame style={{ height: 260 }}>
                  {({ width, height }) => classes.length > 0 ? (
                      <RadarChart width={width} height={height} cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                        <PolarGrid stroke="var(--border-subtle)" />
                        <PolarAngleAxis dataKey="grade" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar name="จำนวนนักเรียน" dataKey="value" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.15} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem' }} 
                        />
                      </RadarChart>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>ไม่มีข้อมูล</div>
                  )}
                </ChartFrame>
              </div>
            </div>

            <div className="data-table-container" style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stat-label">เปรียบเทียบข้อมูลรายห้องเรียน (Class Summary)</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>คลิกที่แถวเพื่อสลับเข้าห้องเรียน</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ชื่อห้องเรียน</th>
                      <th>รายวิชา</th>
                      <th style={{ textAlign: 'center' }}>นักเรียน</th>
                      <th style={{ textAlign: 'center' }}>เวลาเรียน</th>
                      <th style={{ textAlign: 'center' }}>งานค้างส่ง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map(cls => {
                      const clsStudents = students.filter(s => s.classId === cls.id);
                      const clsAtt = attendance.filter(a => a.classId === cls.id);
                      const clsRate = calculateAttendanceRate(clsAtt);
                      const clsColumns = scoreColumns.filter(c => c.classId === cls.id);
                      const clsMissing = calculateMissingWork(clsStudents, clsColumns, scores);
                      
                      return (
                        <tr key={cls.id} style={{ cursor: 'pointer' }} onClick={() => handleSelectClass(cls.id)}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 550 }}>{cls.name}</td>
                          <td>{cls.subject}</td>
                          <td style={{ textAlign: 'center' }}>{clsStudents.length} คน</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${clsRate >= 80 ? 'badge-success' : clsRate >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                              {clsRate}%
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {clsMissing > 0 ? (
                              <span className="badge badge-danger">{clsMissing} งาน</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ครบถ้วน</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {globalAtRiskStudents.length > 0 && (
              <div className="data-table-container" style={{ borderColor: 'var(--danger-border)', backgroundColor: 'var(--bg-surface)' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--danger-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--danger-bg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 600, fontSize: '0.875rem' }}>
                    <FileWarning size={17} /> 🚨 แจ้งเตือนนักเรียนกลุ่มเสี่ยง (ต้องติดตามด่วน)
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{globalAtRiskStudents.length} คน</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <tbody>
                      {globalAtRiskStudents.map((s, idx) => (
                        <tr key={s.id}>
                          <td style={{ width: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>#{idx + 1}</td>
                          <td>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ห้อง {s.className} | เลขที่ {s.number} | รหัส {s.studentId}</div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {s.attRate > 0 && s.attRate < 80 && (
                              <span className="badge badge-warning" style={{ marginRight: '0.5rem' }}>เวลาเรียน {s.attRate}%</span>
                            )}
                            {s.missingCount >= 3 && (
                              <span className="badge badge-danger">ค้าง {s.missingCount} งาน</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
  const totalMissingClass = calculateMissingWork(classStudents, classColumns, scores);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-icon" onClick={() => setActiveClassId(null)} title="กลับไปหน้าภาพรวม" aria-label="กลับไปหน้าภาพรวม">
            <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div>
            <h2 className="page-title">{activeClass?.name}</h2>
            <p className="page-subtitle">{activeClass?.subject} • นักเรียน {classStudents.length} คน</p>
          </div>
        </div>
      </div>
      
      <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">นักเรียนในห้อง</div>
            <Users size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-value" style={{ marginTop: '0.5rem' }}>{classStudents.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>คนทั้งหมด</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">ช่องประเมินคะแนน</div>
            <BarChart3 size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-value" style={{ marginTop: '0.5rem' }}>{classColumns.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ช่องเก็บคะแนน</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">อัตราเข้าเรียน ({uniqueDates.length} วัน)</div>
            <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-value" style={{ marginTop: '0.5rem', color: classAttRate < 80 ? 'var(--warning)' : 'var(--success)' }}>{classAttRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ของชั่วโมงเรียนทั้งหมด</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">งานค้างส่งในห้อง</div>
            <FileWarning size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="stat-value" style={{ marginTop: '0.5rem', color: totalMissingClass > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{totalMissingClass}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>รายการ</div>
        </div>
      </div>

      <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="hairline-cell">
          <div className="stat-label" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={15} style={{ color: 'var(--text-primary)' }} /> สัดส่วนการเข้าเรียน (Attendance Breakdown)
          </div>
          <ChartFrame style={{ height: 260 }}>
            {({ width, height }) => classAttendance.filter(r => r.status !== 'holiday').length > 0 ? (
                <PieChart width={width} height={height}>
                  <Pie
                    data={[
                      { name: 'มา / สาย', value: classAttendance.filter(r => r.status === 'present' || r.status === 'late').length },
                      { name: 'ลา', value: classAttendance.filter(r => r.status === 'leave').length },
                      { name: 'ขาด', value: classAttendance.filter(r => r.status === 'absent').length }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="var(--success)" />
                    <Cell fill="var(--warning)" />
                    <Cell fill="var(--danger)" />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} />
                </PieChart>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>ไม่มีข้อมูล</div>
            )}
          </ChartFrame>
        </div>
        
        <div className="hairline-cell">
          <div className="stat-label" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={15} style={{ color: 'var(--text-primary)' }} /> ผลการเรียนจำลองของห้องนี้ (Grade Radar)
          </div>
          <ChartFrame style={{ height: 260 }}>
            {({ width, height }) => classColumns.length > 0 ? (
                <RadarChart width={width} height={height} cx="50%" cy="50%" outerRadius="70%" data={getGradeSummaryData(classStudents, getClassScoreContext(activeClassId, classes, scoreColumns, indicators), scores)}>
                  <PolarGrid stroke="var(--border-subtle)" />
                  <PolarAngleAxis dataKey="grade" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name="นักเรียน" dataKey="value" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.15} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-strong)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem' }} 
                  />
                </RadarChart>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>ไม่มีข้อมูล</div>
            )}
          </ChartFrame>
        </div>
      </div>

      {topMissingStudents.length > 0 && (
        <div className="data-table-container" style={{ borderColor: 'var(--danger-border)', backgroundColor: 'var(--bg-surface)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--danger-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--danger-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 600, fontSize: '0.875rem' }}>
              <FileWarning size={16} /> 🚨 นักเรียนที่ค้างส่งงานมากที่สุด (เฉพาะห้องนี้)
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{topMissingStudents.length} คน</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <tbody>
                {topMissingStudents.map((s, idx) => (
                  <tr key={s.id}>
                    <td style={{ width: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>#{idx + 1}</td>
                    <td>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>เลขที่ {s.number} | รหัส {s.studentId}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-danger">ค้าง {s.missingCount} งาน</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
