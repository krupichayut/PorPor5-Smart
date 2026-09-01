import { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { BookOpen, Users, Calendar, Award, BarChart3, Settings, Star, FileText, Key, LogOut, ClipboardList, Paintbrush } from 'lucide-react';
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

function AnimatedRoutes({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition" style={{ width: '100%' }}>
      <Routes location={location}>
        {children}
      </Routes>
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

  const activeClass = useMemo(() => classes.find(c => c.id === activeClassId), [classes, activeClassId]);
  const activeClassStudents = useMemo(() => students.filter(s => s.classId === activeClassId), [students, activeClassId]);
  const activeClassScoreColumns = useMemo(() => scoreColumns.filter(c => c.classId === activeClassId), [scoreColumns, activeClassId]);
  const activeClassAttendanceDates = useMemo(() => new Set(
    attendance
      .filter(a => a.classId === activeClassId)
      .map(a => a.date)
  ), [attendance, activeClassId]);


  return (
    <Router>
      <div className="app-layout">
        <HeroWave />
        
        {/* Sidebar */}
        <aside className="sidebar no-print">
          <div className="sidebar-brand">
            <Paintbrush size={20} style={{ color: 'var(--text-primary)' }} />
            <span>PitchClass</span>
            <span className="sidebar-brand-badge">ปพ.5</span>
          </div>
          <nav className="nav-menu">
            <NavLink to="/" aria-label="แดชบอร์ด" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
              <BarChart3 size={17} /> แดชบอร์ด
            </NavLink>
            <NavLink to="/classes" aria-label="จัดการวิชา" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <BookOpen size={17} /> จัดการวิชา
            </NavLink>
            <NavLink to="/course-plan" aria-label="โครงสร้างวิชา" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ClipboardList size={17} /> โครงสร้างวิชา
            </NavLink>
            <NavLink to="/students" aria-label="นักเรียน" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={17} /> นักเรียน
            </NavLink>
            <NavLink to="/attendance" aria-label="เวลาเรียน" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Calendar size={17} /> เวลาเรียน
            </NavLink>
            <NavLink to="/grading" aria-label="บันทึกคะแนน" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Award size={17} /> บันทึกคะแนน
            </NavLink>
            <NavLink to="/rewards" aria-label="ของรางวัล" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Paintbrush size={17} /> ของรางวัล
            </NavLink>
            <NavLink to="/assessments" aria-label="การประเมิน" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Star size={17} /> การประเมิน
            </NavLink>
            <NavLink to="/reports" aria-label="รายงาน" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={17} /> รายงาน
            </NavLink>
            <NavLink to="/settings" aria-label="ตั้งค่าระบบ" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Settings size={17} /> ตั้งค่าระบบ
            </NavLink>
          </nav>
        </aside>

        {/* Main Wrapper */}
        <div className="main-wrapper">
          
          {/* Top Header */}
          <header className="top-header no-print">
            <div className="header-title">
              {activeClass ? (
                <>
                  <span style={{ color: 'var(--text-primary)' }}>{activeClass.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{activeClass.subject}</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-primary)' }}>ภาพรวมทุกห้องเรียน</span>
              )}
            </div>
            <div className="header-controls">
              {classes && classes.length > 0 && (
                <div className="capsule-select">
                  <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
                  <select 
                    value={activeClassId || ''}
                    onChange={(e) => setActiveClassId(e.target.value)}
                    aria-label="เลือกห้องเรียน"
                  >
                    <option value="">-- ทุกห้องเรียน (Overview) --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} : {c.subject}</option>
                    ))}
                  </select>
                </div>
              )}

              {user ? (
                <button className="btn btn-outline text-danger" onClick={handleLogout} title="ออกจากระบบ" aria-label="ออกจากระบบ" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                  <LogOut size={14} /> ออกจากระบบ
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => setIsLoginModalOpen(true)} title="เข้าสู่ระบบ" aria-label="เข้าสู่ระบบ" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                  <Key size={14} /> เข้าสู่ระบบ
                </button>
              )}
            </div>
          </header>

          {/* Modal Overlay */}
          {isLoginModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content" role="dialog" aria-labelledby="login-modal-title" aria-modal="true">
                <h2 id="login-modal-title" style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontFamily: 'var(--font-sans)' }}>เข้าสู่ระบบสำหรับครู</h2>
                {loginError && <p className="text-danger" role="alert" style={{ marginBottom: '1rem' }}>{loginError}</p>}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label htmlFor="login-email" className="sr-only">อีเมล</label>
                    <input id="login-email" type="email" className="form-control" placeholder="อีเมล" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required aria-required="true" />
                  </div>
                  <div>
                    <label htmlFor="login-password" className="sr-only">รหัสผ่าน</label>
                    <input id="login-password" type="password" className="form-control" placeholder="รหัสผ่าน" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required aria-required="true" />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>เข้าสู่ระบบ</button>
                    <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsLoginModalOpen(false)}>ยกเลิก</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="content-area">
            {hasSaveError && (
              <div className="badge badge-danger" style={{ width: '100%', marginBottom: '1rem', padding: '1rem' }} role="alert">
                บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตหรือสิทธิ์ Firebase แล้วลองอีกครั้ง
              </div>
            )}
            
            {isDataLoaded ? (
              <Suspense fallback={<PageLoading />}>
                <AnimatedRoutes>
                  <Route path="/" element={<Dashboard classes={classes} students={students} activeClassId={activeClassId} setActiveClassId={setActiveClassId} attendance={attendance} scores={scores} scoreColumns={scoreColumns} indicators={indicators} />} />
                  <Route path="/settings" element={<SettingsPage appSettings={appSettings} setAppSettings={setAppSettings} readOnly={readOnly} classes={classes} students={students} attendance={attendance} scores={scores} scoreColumns={scoreColumns} attributes={attributes} literacy={literacy} competencies={competencies} lessonPlans={lessonPlans} indicators={indicators} />} />
                  <Route path="/classes" element={<Classes classes={classes} setClasses={setClasses} activeClassId={activeClassId} setActiveClassId={setActiveClassId} readOnly={readOnly} students={students} setStudents={setStudents} attendance={attendance} setAttendance={setAttendance} scores={scores} setScores={setScores} scoreColumns={scoreColumns} setScoreColumns={setScoreColumns} attributes={attributes} setAttributes={setAttributes} literacy={literacy} setLiteracy={setLiteracy} competencies={competencies} setCompetencies={setCompetencies} indicators={indicators} setIndicators={setIndicators} lessonPlans={lessonPlans} setLessonPlans={setLessonPlans} studentPoints={studentPoints} setStudentPoints={setStudentPoints} />} />
                  <Route path="/course-plan" element={<CoursePlanContainer activeClassId={activeClassId} classes={classes} students={students} indicators={indicators} setIndicators={setIndicators} lessonPlans={lessonPlans} setLessonPlans={setLessonPlans} readOnly={readOnly} appSettings={appSettings} />} />
                  <Route path="/students" element={<Students students={students} setStudents={setStudents} classes={classes} activeClassId={activeClassId} readOnly={readOnly} attendance={attendance} setAttendance={setAttendance} scores={scores} setScores={setScores} scoreColumns={scoreColumns} attributes={attributes} setAttributes={setAttributes} literacy={literacy} setLiteracy={setLiteracy} competencies={competencies} setCompetencies={setCompetencies} indicators={indicators} studentPoints={studentPoints} setStudentPoints={setStudentPoints} />} />
                  <Route path="/attendance" element={<Attendance appSettings={appSettings} students={students} activeClassId={activeClassId} classes={classes} attendance={attendance} setAttendance={setAttendance} readOnly={readOnly} />} />
                  <Route path="/grading" element={<GradingContainer students={students} activeClassId={activeClassId} classes={classes} scores={scores} setScores={setScores} scoreColumns={scoreColumns} setScoreColumns={setScoreColumns} indicators={indicators} readOnly={readOnly} studentPoints={studentPoints} setStudentPoints={setStudentPoints} />} />
                  <Route path="/grading/:tab" element={<GradingContainer students={students} activeClassId={activeClassId} classes={classes} scores={scores} setScores={setScores} scoreColumns={scoreColumns} setScoreColumns={setScoreColumns} indicators={indicators} readOnly={readOnly} studentPoints={studentPoints} setStudentPoints={setStudentPoints} />} />
                  <Route path="/reports" element={<ReportsContainer appSettings={appSettings} activeClassId={activeClassId} classes={classes} students={students} attendance={attendance} scoreColumns={scoreColumns} scores={scores} attributes={attributes} literacy={literacy} competencies={competencies} indicators={indicators} readOnly={readOnly} />} />
                  <Route path="/reports/:tab" element={<ReportsContainer appSettings={appSettings} activeClassId={activeClassId} classes={classes} students={students} attendance={attendance} scoreColumns={scoreColumns} scores={scores} attributes={attributes} literacy={literacy} competencies={competencies} indicators={indicators} readOnly={readOnly} />} />
                  <Route path="/assessments" element={<AssessmentsContainer students={students} activeClassId={activeClassId} classes={classes} attributes={attributes} setAttributes={setAttributes} literacy={literacy} setLiteracy={setLiteracy} competencies={competencies} setCompetencies={setCompetencies} readOnly={readOnly} />} />
                  <Route path="/rewards" element={<Rewards students={students} activeClassId={activeClassId} classes={classes} studentPoints={studentPoints} setStudentPoints={setStudentPoints} rewards={rewards} setRewards={setRewards} readOnly={readOnly} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </AnimatedRoutes>
              </Suspense>
            ) : (
              <PageLoading />
            )}
          </main>

        </div>
      </div>
    </Router>
  );
}

export default App;
