import { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { 
  Users, Calendar, Award, Settings, BookOpen, LogOut, Key, BarChart3,
  FileText, ClipboardList, Star, Paintbrush, Menu, Library, Image
} from 'lucide-react';
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
const MediaLibrary = lazy(() => import('./components/MediaLibrary'));
const StudentWorks = lazy(() => import('./components/StudentWorks'));
const Certificates = lazy(() => import('./components/Certificates'));


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

function ToastContainer() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let timer;
    const handleSaved = () => {
      setToast({ type: "success", message: "บันทึกข้อมูลสำเร็จแล้ว" });
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 3000);
    };
    
    const handleError = (e) => {
      setToast({ type: "error", message: `บันทึกไม่สำเร็จ: ${e.detail}` });
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 5000);
    };

    window.addEventListener("app:saved", handleSaved);
    window.addEventListener("app:save_error", handleError);
    
    return () => {
      window.removeEventListener("app:saved", handleSaved);
      window.removeEventListener("app:save_error", handleError);
      clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;

  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
      backgroundColor: toast.type === "success" ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)",
      color: "#fff", padding: "12px 24px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", gap: "10px", fontWeight: 600, fontSize: "0.95rem",
      transform: "translateY(0)", transition: "all 0.3s ease",
      animation: "fade-in 0.3s ease-out forwards"
    }}>
      <span style={{ fontSize: "1.2rem" }}>{toast.type === "success" ? "✨" : "⚠️"}</span> 
      {toast.message}
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
  const [mediaLibrary, setMediaLibrary, mlInit, mediaLibrarySaveError] = useFirestoreData('appData', 'mediaLibrary', []);
  const [studentWorks, setStudentWorks, swInit, studentWorksSaveError] = useFirestoreData('appData', 'studentWorks', []);
  const [certificates, setCertificates, certInit, certificatesSaveError] = useFirestoreData('appData', 'certificates', []);

  const [appSettings, setAppSettings, settingsInit, settingsSaveError] = useFirestoreData('appData', 'settings', {
    schoolName: '',
    teacherName: '',
    academicHeadName: '',
    principalName: '',
    academicYear: '',
    semester: ''
  });

  const isDataLoaded = classesInit && studentsInit && attInit && scInit && scoresInit && attrInit && litInit && compInit && indInit && settingsInit && lpInit && spInit && rwInit && mlInit && swInit;
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
    mediaLibrarySaveError,
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


  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Router>
      <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <HeroWave />
        
        {/* Sidebar */}
        <aside className={`sidebar no-print ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-brand">
            <Paintbrush size={20} style={{ color: 'var(--text-primary)' }} />
            <span>PitchClass</span>
            <span className="sidebar-brand-badge">ปพ.5</span>
          </div>
          <nav className="nav-menu">
            <NavLink to="/" aria-label="ภาพรวม" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
              <BarChart3 size={17} /> <span>ภาพรวม</span>
            </NavLink>
            <NavLink to="/attendance" aria-label="เช็คชื่อ" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Calendar size={17} /> <span>เช็คชื่อ</span>
            </NavLink>
            <NavLink to="/grading/scores" aria-label="บันทึกคะแนน" className={({ isActive }) => `nav-item ${isActive || window.location.pathname === '/grading' ? 'active' : ''}`}>
              <Award size={17} /> <span>บันทึกคะแนน</span>
            </NavLink>
            <NavLink to="/grading/missing" aria-label="ติดตามงาน" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={17} /> <span>ติดตามงาน</span>
            </NavLink>
            <NavLink to="/assessments" aria-label="ประเมินผู้เรียน" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ClipboardList size={17} /> <span>ประเมินผู้เรียน</span>
            </NavLink>
            <NavLink to="/reports" aria-label="รายงาน" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={17} /> <span>รายงาน</span>
            </NavLink>
            <NavLink to="/classes" aria-label="ตั้งค่ารายวิชา" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <BookOpen size={17} /> <span>ตั้งค่ารายวิชา</span>
            </NavLink>
          </nav>
        </aside>

        {/* Main Wrapper */}
        <div className="main-wrapper">
          
          {/* Top Header */}
          <header className="top-header no-print" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>

            <div className="header-art" style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '350px', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
              <svg viewBox="0 0 350 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                {/* Cobalt Wave */}
                <path d="M0,100 C150,80 200,20 350,60 L350,0 L0,0 Z" fill="var(--accent-cobalt)" opacity="0.15" />
                {/* Cyan Wave */}
                <path d="M50,100 C180,50 250,70 350,30 L350,0 L0,0 Z" fill="var(--accent-cyan)" opacity="0.1" />
                {/* Yellow Stars */}
                <circle cx="280" cy="30" r="4" fill="var(--accent-primary)" className="star-glow" style={{ filter: 'blur(1px)' }} />
                <circle cx="220" cy="65" r="2.5" fill="var(--accent-primary)" className="star-glow-delayed" style={{ filter: 'blur(0.5px)' }} opacity="0.7" />
                <circle cx="320" cy="70" r="1.5" fill="var(--accent-cyan)" opacity="0.5" />
              </svg>
            </div>
            
            <div className="header-title" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              <button 
                className="btn-icon" 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                aria-label="ซ่อน/แสดงเมนู"
                title="ซ่อน/แสดงเมนู"
                style={{ padding: '0.25rem', color: 'var(--text-primary)' }}
              >
                <Menu size={20} />
              </button>
              {activeClass ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{appSettings?.academicYear || 'ปีการศึกษา 2567'}</span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{activeClass.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{activeClass.subject}</span>
                </div>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>กรุณาเลือกห้องเรียนจากเมนูภาพรวม</span>
              )}
            </div>
            <div className="header-actions" style={{ position: 'relative', zIndex: 1 }}>
              <div className="user-profile">
                <div className="avatar">ครู</div>
                <div className="user-info">
                  <div className="user-name">{appSettings?.teacherName || 'คุณครู'}</div>
                  <div className="user-role">{appSettings?.schoolName || 'โรงเรียน'}</div>
                </div>
              </div>
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
                  <Route path="/course-plan" element={<CoursePlanContainer activeClassId={activeClassId} classes={classes} students={students} indicators={indicators} setIndicators={setIndicators} lessonPlans={lessonPlans} setLessonPlans={setLessonPlans} readOnly={readOnly} appSettings={appSettings} mediaLibrary={mediaLibrary} attendance={attendance} />} />
                  <Route path="/students" element={<Students students={students} setStudents={setStudents} classes={classes} activeClassId={activeClassId} readOnly={readOnly} attendance={attendance} setAttendance={setAttendance} scores={scores} setScores={setScores} scoreColumns={scoreColumns} attributes={attributes} setAttributes={setAttributes} literacy={literacy} setLiteracy={setLiteracy} competencies={competencies} setCompetencies={setCompetencies} indicators={indicators} studentPoints={studentPoints} setStudentPoints={setStudentPoints} />} />
                  <Route path="/attendance" element={<Attendance appSettings={appSettings} students={students} activeClassId={activeClassId} classes={classes} attendance={attendance} setAttendance={setAttendance} readOnly={readOnly} />} />
                  <Route path="/grading" element={<GradingContainer students={students} activeClassId={activeClassId} classes={classes} scores={scores} setScores={setScores} scoreColumns={scoreColumns} setScoreColumns={setScoreColumns} indicators={indicators} readOnly={readOnly} studentPoints={studentPoints} setStudentPoints={setStudentPoints} />} />
                  <Route path="/grading/:tab" element={<GradingContainer students={students} activeClassId={activeClassId} classes={classes} scores={scores} setScores={setScores} scoreColumns={scoreColumns} setScoreColumns={setScoreColumns} indicators={indicators} readOnly={readOnly} studentPoints={studentPoints} setStudentPoints={setStudentPoints} />} />
                  <Route path="/reports" element={<ReportsContainer appSettings={appSettings} activeClassId={activeClassId} classes={classes} students={students} attendance={attendance} scoreColumns={scoreColumns} scores={scores} attributes={attributes} literacy={literacy} competencies={competencies} indicators={indicators} readOnly={readOnly} />} />
                  <Route path="/reports/:tab" element={<ReportsContainer appSettings={appSettings} activeClassId={activeClassId} classes={classes} students={students} attendance={attendance} scoreColumns={scoreColumns} scores={scores} attributes={attributes} literacy={literacy} competencies={competencies} indicators={indicators} readOnly={readOnly} />} />
                  <Route path="/assessments" element={<AssessmentsContainer students={students} activeClassId={activeClassId} classes={classes} attributes={attributes} setAttributes={setAttributes} literacy={literacy} setLiteracy={setLiteracy} competencies={competencies} setCompetencies={setCompetencies} readOnly={readOnly} />} />
                  <Route path="/rewards" element={<Rewards students={students} activeClassId={activeClassId} classes={classes} studentPoints={studentPoints} setStudentPoints={setStudentPoints} rewards={rewards} setRewards={setRewards} readOnly={readOnly} />} />
                  <Route path="/media-library" element={<MediaLibrary appSettings={appSettings} activeClassId={activeClassId} classes={classes} mediaLibrary={mediaLibrary} setMediaLibrary={setMediaLibrary} readOnly={readOnly} />} />
                  <Route path="/gallery" element={<StudentWorks works={studentWorks} setWorks={setStudentWorks} classes={classes} readOnly={readOnly} />} />
                  <Route path="/certificates" element={<Certificates certificates={certificates} setCertificates={setCertificates} classes={classes} appSettings={appSettings} readOnly={readOnly} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </AnimatedRoutes>
              </Suspense>
            ) : (
              <PageLoading />
            )}
          </main>

        </div>
      </div>
      <ToastContainer />
    </Router>
  );
}

export default App;
