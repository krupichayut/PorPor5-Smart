import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { BookOpen, Users, Calendar, Award, BarChart3, Settings, GraduationCap, Star, FileText, Key, LogOut, ClipboardList, Paintbrush } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import HeroWave from './components/DynamicWaveBackground';
import './index.css';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useFirestoreData } from './hooks/useFirestoreData';
const Classes = lazy(() => import('./components/Classes'));
const Students = lazy(() => import('./components/Students'));
const Attendance = lazy(() => import('./components/Attendance'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AssessmentsContainer = lazy(() => import('./components/AssessmentsContainer'));
const GradingContainer = lazy(() => import('./components/GradingContainer'));
const ReportsContainer = lazy(() => import('./components/ReportsContainer'));
const CoursePlanContainer = lazy(() => import('./components/CoursePlanContainer'));
const Rewards = lazy(() => import('./components/Rewards'));

function PageLoading() {
  return (
    <div className="card" style={{ minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
      กำลังโหลดหน้า...
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginError('');
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setIsLoginModalOpen(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      console.error(error);
      setLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const readOnly = !user;

  const [activeClassId, setActiveClassId] = useLocalStorage('porpor5_active_class', null);

  const [classes, setClasses, classesInit, classesSaveError] = useFirestoreData('appData', 'classes', []);
  const [students, setStudents, studentsInit, studentsSaveError] = useFirestoreData('appData', 'students', []);
  const [attendance, setAttendance, attInit, attendanceSaveError] = useFirestoreData('appData', 'attendance', []);
  const [scoreColumns, setScoreColumns, scInit, scoreColumnsSaveError] = useFirestoreData('appData', 'scoreColumns', []);
  const [scores, setScores, scoresInit, scoresSaveError] = useFirestoreData('appData', 'scores', []);
  
  const [attributes, setAttributes, attrInit, attributesSaveError] = useFirestoreData('appData', 'attributes', []);
  const [literacy, setLiteracy, litInit, literacySaveError] = useFirestoreData('appData', 'literacy', []);
  const [competencies, setCompetencies, compInit, competenciesSaveError] = useFirestoreData('appData', 'competencies', []);
  
  const [indicators, setIndicators, indInit, indicatorsSaveError] = useFirestoreData('appData', 'indicators', []);
  const [lessonPlans, setLessonPlans, lpInit, lessonPlansSaveError] = useFirestoreData('appData', 'lessonPlans', []);
  
  const [studentPoints, setStudentPoints, spInit, studentPointsSaveError] = useFirestoreData('appData', 'studentPoints', []);
  const [rewards, setRewards, rwInit, rewardsSaveError] = useFirestoreData('appData', 'rewards', []);

  const [appSettings, setAppSettings, settingsInit, settingsSaveError] = useFirestoreData('appData', 'settings', {
    schoolName: '',
    teacherName: '',
    academicHeadName: '',
    principalName: '',
    academicYear: '',
    semester: ''
  });

  const isDataLoaded = classesInit && studentsInit && attInit && scInit && scoresInit && attrInit && litInit && compInit && indInit && settingsInit && lpInit && spInit && rwInit;
  const hasSaveError = [
    classesSaveError,
    studentsSaveError,
    attendanceSaveError,
    scoreColumnsSaveError,
    scoresSaveError,
    attributesSaveError,
    literacySaveError,
    competenciesSaveError,
    indicatorsSaveError,
    lessonPlansSaveError,
    studentPointsSaveError,
    rewardsSaveError,
    settingsSaveError
  ].some(Boolean);

  const activeClass = classes.find(c => c.id === activeClassId);
  const activeClassStudents = students.filter(s => s.classId === activeClassId);
  const activeClassScoreColumns = scoreColumns.filter(c => c.classId === activeClassId);
  const activeClassAttendanceDates = new Set(
    attendance
      .filter(a => a.classId === activeClassId)
      .map(a => a.date)
  );


  return (
    <Router>
      <div className="app-container art-studio-os atelier-webapp" style={{ position: 'relative', zIndex: 0 }}>
        
        {/* Animated Wave Canvas Background */}
        <div style={{ position: 'fixed', inset: 0, zIndex: -10, opacity: 0.07 }}>
          <HeroWave />
        </div>

        {/* Floating Top Header */}
        <div className="top-header no-print" style={{ position: 'fixed', top: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
          
          {/* App Title (Left) */}
          <div className="top-brand" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(24, 24, 27, 0.7)', backdropFilter: 'blur(16px)', padding: '0.5rem 1rem 0.5rem 0.5rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'var(--shadow-3d-outset)', pointerEvents: 'auto' }}>
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.4rem', borderRadius: 'var(--radius-full)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={20} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-game)', fontWeight: 700, color: '#fff', letterSpacing: '1px', marginRight: '0.5rem' }}>PicthClass</h1>
          </div>

          {/* Controls (Right) */}
          <div className="top-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center', pointerEvents: 'auto' }}>
            {classes && classes.length > 0 && (
              <div className="class-picker" style={{ background: 'rgba(24, 24, 27, 0.7)', backdropFilter: 'blur(16px)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'var(--shadow-3d-outset)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ห้องเรียน:</span>
                <select 
                  style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', outline: 'none', fontFamily: 'var(--font-game)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                  value={activeClassId || ''}
                  onChange={(e) => setActiveClassId(e.target.value)}
                >
                  <option value="" disabled>-- เลือกห้องเรียน --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id} style={{ background: 'var(--bg-secondary)' }}>{c.name} - {c.subject}</option>
                  ))}
                </select>
              </div>
            )}

            {user ? (
              <button className="btn-icon" style={{ background: 'rgba(24, 24, 27, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.05)', width: 'auto', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', color: '#ff3366', boxShadow: 'var(--shadow-3d-outset)' }} onClick={handleLogout} title="ออกจากระบบ">
                <LogOut size={18} style={{ marginRight: '0.5rem' }} /> ออก
              </button>
            ) : (
              <button className="btn-icon" style={{ background: 'rgba(24, 24, 27, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.05)', width: 'auto', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', color: 'var(--primary-color)', boxShadow: 'var(--shadow-3d-outset)' }} onClick={() => setIsLoginModalOpen(true)} title="เข้าสู่ระบบ">
                <Key size={18} style={{ marginRight: '0.5rem' }} /> เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>

        {/* Floating Bottom Dock */}
        <nav className="floating-dock no-print">
          <NavLink to="/" aria-label="แดชบอร์ด" className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`} end>
            <BarChart3 />
            <span className="dock-tooltip">แดชบอร์ด</span>
          </NavLink>
          <NavLink to="/classes" aria-label="จัดการวิชา" className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}>
            <BookOpen />
            <span className="dock-tooltip">จัดการวิชา</span>
          </NavLink>
          <NavLink to="/course-plan" aria-label="โครงสร้างวิชา" className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}>
            <ClipboardList />
            <span className="dock-tooltip">โครงสร้างวิชา</span>
          </NavLink>
          <NavLink to="/students" aria-label="นักเรียน" className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}>
            <Users />
            <span className="dock-tooltip">นักเรียน</span>
          </NavLink>
          <NavLink to="/attendance" aria-label="เวลาเรียน" className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}>
            <Calendar />
            <span className="dock-tooltip">เวลาเรียน</span>
          </NavLink>
          <NavLink to="/grading" aria-label="บันทึกคะแนน" className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}>
            <Award />
            <span className="dock-tooltip">บันทึกคะแนน</span>
          </NavLink>
          <NavLink to="/rewards" aria-label="ของรางวัล" className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}>
            <Paintbrush />
            <span className="dock-tooltip">ของรางวัล</span>
          </NavLink>
          <NavLink to="/assessments" aria-label="การประเมิน" className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}>
            <Star />
            <span className="dock-tooltip">การประเมิน</span>
          </NavLink>
          <NavLink to="/reports" aria-label="รายงาน" className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}>
            <FileText />
            <span className="dock-tooltip">รายงาน</span>
          </NavLink>
          <NavLink to="/settings" aria-label="ตั้งค่าระบบ" className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}>
            <Settings />
            <span className="dock-tooltip">ตั้งค่าระบบ</span>
          </NavLink>
        </nav>

        <aside className="studio-context-panel no-print" aria-label="Studio context">
          <div className="studio-context-mark">
            <span>PC</span>
          </div>
          <div className="studio-context-copy">
            <span className="studio-context-kicker">Studio Desk</span>
            <strong>{activeClass?.name || 'All Classes'}</strong>
            <span>{activeClass?.subject || `${classes.length} classes in workspace`}</span>
          </div>
          <div className="studio-context-stats">
            <div>
              <Users size={16} />
              <strong>{activeClass ? activeClassStudents.length : students.length}</strong>
              <span>Roster</span>
            </div>
            <div>
              <Award size={16} />
              <strong>{activeClass ? activeClassScoreColumns.length : scoreColumns.length}</strong>
              <span>Score fields</span>
            </div>
            <div>
              <Calendar size={16} />
              <strong>{activeClass ? activeClassAttendanceDates.size : classes.length}</strong>
              <span>{activeClass ? 'Sessions' : 'Classes'}</span>
            </div>
          </div>
          <div className="studio-context-links">
            <NavLink to="/students">Roster</NavLink>
            <NavLink to="/grading">Grades</NavLink>
            <NavLink to="/reports">Reports</NavLink>
          </div>
        </aside>

        {isLoginModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <h2>เข้าสู่ระบบสำหรับครู</h2>
              {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
              <form onSubmit={handleLogin}>
                <input type="email" placeholder="อีเมล" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} required />
                <input type="password" placeholder="รหัสผ่าน" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} required />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary">เข้าสู่ระบบ</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsLoginModalOpen(false)}>ยกเลิก</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="main-content">
          <section className="studio-command-strip no-print" aria-label="Studio quick commands">
            <div className="studio-command-copy">
              <span>Art Teacher Studio OS</span>
              <strong>{activeClass?.name || 'All-class workspace'}</strong>
              <p>{activeClass?.subject || 'Daily class data, grading, attendance, and reports in one designed workbench.'}</p>
            </div>
            <div className="studio-command-metrics" aria-label="Workspace summary">
              <div>
                <strong>{classes.length}</strong>
                <span>Classes</span>
              </div>
              <div>
                <strong>{activeClass ? activeClassStudents.length : students.length}</strong>
                <span>Students</span>
              </div>
              <div>
                <strong>{activeClass ? activeClassScoreColumns.length : scoreColumns.length}</strong>
                <span>Score fields</span>
              </div>
            </div>
            <div className="studio-command-actions">
              <NavLink to="/classes">
                <BookOpen size={16} />
                <span>Classes</span>
              </NavLink>
              <NavLink to="/students">
                <Users size={16} />
                <span>Roster</span>
              </NavLink>
              <NavLink to="/grading">
                <Award size={16} />
                <span>Gradebook</span>
              </NavLink>
              <NavLink to="/reports">
                <FileText size={16} />
                <span>Reports</span>
              </NavLink>
            </div>
          </section>
          {hasSaveError && (
            <div className="save-error-banner" role="alert">
              บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตหรือสิทธิ์ Firebase แล้วลองอีกครั้ง
            </div>
          )}
          {isDataLoaded ? (
            <Suspense fallback={<PageLoading />}>
              <Routes>
              <Route path="/" element={<Dashboard classes={classes} students={students} activeClassId={activeClassId} setActiveClassId={setActiveClassId} attendance={attendance} scores={scores} scoreColumns={scoreColumns} indicators={indicators} />} />
              <Route path="/settings" element={<SettingsPage appSettings={appSettings} setAppSettings={setAppSettings} readOnly={readOnly} classes={classes} students={students} attendance={attendance} scores={scores} scoreColumns={scoreColumns} attributes={attributes} literacy={literacy} competencies={competencies} lessonPlans={lessonPlans} indicators={indicators} />} />
              <Route path="/classes" element={<Classes classes={classes} setClasses={setClasses} activeClassId={activeClassId} setActiveClassId={setActiveClassId} readOnly={readOnly} />} />
              <Route path="/course-plan" element={<CoursePlanContainer activeClassId={activeClassId} classes={classes} indicators={indicators} setIndicators={setIndicators} lessonPlans={lessonPlans} setLessonPlans={setLessonPlans} readOnly={readOnly} />} />
              <Route path="/students" element={<Students students={students} setStudents={setStudents} classes={classes} activeClassId={activeClassId} readOnly={readOnly} attendance={attendance} scores={scores} scoreColumns={scoreColumns} attributes={attributes} literacy={literacy} competencies={competencies} indicators={indicators} />} />
              <Route path="/attendance" element={<Attendance students={students} activeClassId={activeClassId} classes={classes} attendance={attendance} setAttendance={setAttendance} readOnly={readOnly} />} />
              <Route path="/grading" element={<GradingContainer students={students} activeClassId={activeClassId} classes={classes} scores={scores} setScores={setScores} scoreColumns={scoreColumns} setScoreColumns={setScoreColumns} indicators={indicators} readOnly={readOnly} studentPoints={studentPoints} setStudentPoints={setStudentPoints} />} />
              <Route path="/grading/:tab" element={<GradingContainer students={students} activeClassId={activeClassId} classes={classes} scores={scores} setScores={setScores} scoreColumns={scoreColumns} setScoreColumns={setScoreColumns} indicators={indicators} readOnly={readOnly} studentPoints={studentPoints} setStudentPoints={setStudentPoints} />} />
              <Route path="/reports" element={<ReportsContainer appSettings={appSettings} activeClassId={activeClassId} classes={classes} students={students} attendance={attendance} scoreColumns={scoreColumns} scores={scores} attributes={attributes} literacy={literacy} competencies={competencies} indicators={indicators} readOnly={readOnly} />} />
              <Route path="/reports/:tab" element={<ReportsContainer appSettings={appSettings} activeClassId={activeClassId} classes={classes} students={students} attendance={attendance} scoreColumns={scoreColumns} scores={scores} attributes={attributes} literacy={literacy} competencies={competencies} indicators={indicators} readOnly={readOnly} />} />
              <Route path="/assessments" element={<AssessmentsContainer students={students} activeClassId={activeClassId} classes={classes} attributes={attributes} setAttributes={setAttributes} literacy={literacy} setLiteracy={setLiteracy} competencies={competencies} setCompetencies={setCompetencies} readOnly={readOnly} />} />
              <Route path="/rewards" element={<Rewards students={students} activeClassId={activeClassId} classes={classes} studentPoints={studentPoints} setStudentPoints={setStudentPoints} rewards={rewards} setRewards={setRewards} readOnly={readOnly} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          ) : (
            <PageLoading />
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;
