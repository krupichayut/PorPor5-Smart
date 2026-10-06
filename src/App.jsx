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
            <NavLink to="/classes" aria-label="ตั้งค่ารายวิชา" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <BookOpen size={17} /> <span>ตั้งค่ารายวิชา</span>
            </NavLink>
            <NavLink to="/course-plan" aria-label="ตัวชี้วัดและแผนฯ" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ClipboardList size={17} /> <span>ตัวชี้วัดและแผนฯ</span>
            </NavLink>
            <NavLink to="/students" aria-label="ข้อมูลนักเรียน" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={17} /> <span>ข้อมูลนักเรียน</span>
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
              <Star size={17} /> <span>ประเมินผู้เรียน</span>
            </NavLink>
            <NavLink to="/rewards" aria-label="ระบบรางวัล" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Paintbrush size={17} /> <span>ระบบรางวัล</span>
            </NavLink>
            <NavLink to="/media-library" aria-label="คลังสื่อ" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Library size={17} /> <span>คลังสื่อ</span>
            </NavLink>
            <NavLink to="/gallery" aria-label="ผลงานนักเรียน" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Image size={17} /> <span>ผลงานนักเรียน</span>
            </NavLink>
            <NavLink to="/certificates" aria-label="เกียรติบัตร" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Award size={17} /> <span>เกียรติบัตร</span>
            </NavLink>
            <NavLink to="/reports" aria-label="รายงาน" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={17} /> <span>รายงาน</span>
            </NavLink>
            <NavLink to="/settings" aria-label="ตั้งค่าระบบ" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Settings size={17} /> <span>ตั้งค่าระบบ</span>
            </NavLink>
          </nav>
        <div className="sidebar-footer-art">
          ศิลปะ<br/>
          สร้างคน<br/>
          ให้มองเห็น<br/>
          ความงดงาม<br/>
          ในชีวิต
        </div>
        </aside>

        {/* Main Wrapper */}
        <div className="main-wrapper">
          
          {/* Top Header */}
          <header className="top-header no-print" style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>

            
            
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
              {classes.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{appSettings?.academicYear || 'ปีการศึกษา'}</span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  
                  <select 
                    value={activeClassId || ''} 
                    onChange={(e) => {
                      if (e.target.value) {
                        setActiveClassId(e.target.value);
                      }
                    }}
                    style={{ 
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      fontWeight: '600',
                      border: 'none',
                      outline: 'none',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      padding: '0 0.25rem',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23b4c2d4%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.25rem top 55%',
                      backgroundSize: '0.65rem auto',
                      paddingRight: '1.5rem',
                      borderBottom: '1px dashed var(--border-strong)'
                    }}
                  >
                    <option value="" disabled style={{ backgroundColor: 'var(--bg-surface)' }}>-- เลือกห้องเรียน --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id} style={{ backgroundColor: 'var(--bg-surface)' }}>{c.name}</option>
                    ))}
                  </select>
                  
                  {activeClass && (
                    <>
                      <span style={{ color: 'var(--text-muted)' }}>|</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{activeClass.subject}</span>
                    </>
                  )}
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
