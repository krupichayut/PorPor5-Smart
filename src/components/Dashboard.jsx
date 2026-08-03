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
          <h2 className="page-title">Command Center</h2>
          <p className="page-subtitle">Global Overview & Statistics</p>
        </div>

        {totalClasses === 0 ? (
          <div className="hairline-grid">
            <div className="hairline-cell" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <BookOpen size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>No active classes found. Please add a class to begin.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
              <div className="hairline-cell" style={{ cursor: 'pointer' }} onClick={() => navigate('/classes')}>
                <div className="stat-label">Total Classes</div>
                <div className="stat-value text-cyan">{totalClasses}</div>
              </div>
              <div className="hairline-cell" style={{ cursor: 'pointer' }} onClick={() => navigate('/students')}>
                <div className="stat-label">Total Students</div>
                <div className="stat-value">{totalStudents}</div>
              </div>
              <div className="hairline-cell" style={{ cursor: 'pointer' }} onClick={() => navigate('/attendance')}>
                <div className="stat-label">Global Attendance</div>
                <div className="stat-value text-success">{overallAttRate}%</div>
              </div>
              <div className="hairline-cell" style={{ cursor: 'pointer' }} onClick={() => navigate('/grading')}>
                <div className="stat-label">Total Missing Work</div>
                <div className={`stat-value ${totalMissing > 0 ? 'text-danger' : 'text-primary'}`}>{totalMissing}</div>
              </div>
            </div>

            <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', marginBottom: '2rem' }}>
              <div className="hairline-cell">
                <div className="stat-label" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={16} /> Attendance Trends
                </div>
                <ChartFrame style={{ height: 280 }}>
                  {({ width, height }) => classes.length > 0 ? (
                      <AreaChart width={width} height={height} data={classes.map(cls => ({
                        name: cls.name,
                        rate: calculateAttendanceRate(attendance.filter(a => a.classId === cls.id))
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} 
                          itemStyle={{ color: 'var(--accent-cyan)' }}
                        />
                        <defs>
                          <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="rate" className="chart-line" fill="url(#colorAtt)" />
                      </AreaChart>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Data</div>
                  )}
                </ChartFrame>
              </div>

              <div className="hairline-cell">
                <div className="stat-label" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={16} /> Academic Performance (Radar)
                </div>
                <ChartFrame style={{ height: 280 }}>
                  {({ width, height }) => classes.length > 0 ? (
                      <RadarChart width={width} height={height} cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                        <PolarGrid stroke="var(--border-subtle)" />
                        <PolarAngleAxis dataKey="grade" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar name="Students" dataKey="value" stroke="var(--accent-purple)" fill="var(--accent-purple)" fillOpacity={0.3} className="chart-glow" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} 
                          itemStyle={{ color: 'var(--accent-purple)' }}
                        />
                      </RadarChart>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Data</div>
                  )}
                </ChartFrame>
              </div>
            </div>

            <div className="hairline-grid">
              <div className="hairline-cell" style={{ padding: 0 }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="stat-label">Class Comparison</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Class Name</th>
                        <th>Subject</th>
                        <th style={{ textAlign: 'center' }}>Students</th>
                        <th style={{ textAlign: 'center' }}>Attendance</th>
                        <th style={{ textAlign: 'center' }}>Missing Work</th>
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
                            <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{cls.name}</td>
                            <td>{cls.subject}</td>
                            <td style={{ textAlign: 'center' }}>{clsStudents.length}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`badge ${clsRate >= 80 ? 'badge-success' : clsRate >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                                {clsRate}%
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {clsMissing > 0 ? (
                                <span className="text-danger font-medium">{clsMissing}</span>
                              ) : (
                                <span className="text-muted">0</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

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
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <button className="btn-icon" onClick={() => setActiveClassId(null)} title="Back to Overview">
          <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div>
          <h2 className="page-title">{activeClass?.name}</h2>
          <p className="page-subtitle">{activeClass?.subject} • {classStudents.length} Students</p>
        </div>
      </div>
      
      <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
        <div className="hairline-cell">
          <div className="stat-label">Students</div>
          <div className="stat-value text-cyan">{classStudents.length}</div>
        </div>
        <div className="hairline-cell">
          <div className="stat-label">Score Fields</div>
          <div className="stat-value text-purple">{classColumns.length}</div>
        </div>
        <div className="hairline-cell">
          <div className="stat-label">Attendance Rate ({uniqueDates.length} Days)</div>
          <div className="stat-value text-success">{classAttRate}%</div>
        </div>
        <div className="hairline-cell">
          <div className="stat-label">Missing Work (Class)</div>
          <div className={`stat-value ${totalMissingClass > 0 ? 'text-danger' : 'text-primary'}`}>{totalMissingClass}</div>
        </div>
      </div>

      <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', marginBottom: '2rem' }}>
        <div className="hairline-cell">
          <div className="stat-label" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} /> Attendance Distribution
          </div>
          <ChartFrame style={{ height: 260 }}>
            {({ width, height }) => classAttendance.filter(r => r.status !== 'holiday').length > 0 ? (
                <PieChart width={width} height={height}>
                  <Pie
                    data={[
                      { name: 'Present/Late', value: classAttendance.filter(r => r.status === 'present' || r.status === 'late').length },
                      { name: 'Leave', value: classAttendance.filter(r => r.status === 'leave').length },
                      { name: 'Absent', value: classAttendance.filter(r => r.status === 'absent').length }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="var(--success)" />
                    <Cell fill="var(--warning)" />
                    <Cell fill="var(--danger)" />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Data</div>
            )}
          </ChartFrame>
        </div>
        
        <div className="hairline-cell">
          <div className="stat-label" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={16} /> Simulated Grades
          </div>
          <ChartFrame style={{ height: 260 }}>
            {({ width, height }) => classColumns.length > 0 ? (
                <RadarChart width={width} height={height} cx="50%" cy="50%" outerRadius="70%" data={getGradeSummaryData(classStudents, getClassScoreContext(activeClassId, classes, scoreColumns, indicators), scores)}>
                  <PolarGrid stroke="var(--border-subtle)" />
                  <PolarAngleAxis dataKey="grade" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name="Students" dataKey="value" stroke="var(--success)" fill="var(--success)" fillOpacity={0.3} className="chart-glow" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} 
                  />
                </RadarChart>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Data</div>
            )}
          </ChartFrame>
        </div>
      </div>

      {topMissingStudents.length > 0 && (
        <div className="hairline-grid">
          <div className="hairline-cell" style={{ padding: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                <FileWarning size={16} /> Top Missing Work (Action Required)
              </div>
            </div>
            <div style={{ padding: '0.5rem' }}>
              <table className="data-table">
                <tbody>
                  {topMissingStudents.map((s, idx) => (
                    <tr key={s.id}>
                      <td style={{ width: '40px', color: 'var(--text-muted)', fontWeight: 600 }}>#{idx + 1}</td>
                      <td>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No. {s.number} | ID {s.studentId}</div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>{s.missingCount} Missing</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
