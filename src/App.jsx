import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { BookOpen, Users, Calendar, Award, BarChart3, Settings, GraduationCap, Star, BookType, Brain, FileText, Key, LogOut, Menu, X, ClipboardList } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import './index.css';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useFirestoreData } from './hooks/useFirestoreData';
import Classes from './components/Classes';
import Students from './components/Students';
import Attendance from './components/Attendance';
import Scores from './components/Scores';
import Grades from './components/Grades';
import Attributes from './components/Attributes';
import Literacy from './components/Literacy';
import Competencies from './components/Competencies';
import Indicators from './components/Indicators';
import LessonPlans from './components/LessonPlans';
import MissingWork from './components/MissingWork';
import SettingsPage from './components/SettingsPage';
import MonthlyReport from './components/MonthlyReport';
import Dashboard from './components/Dashboard';
import AssessmentsContainer from './components/AssessmentsContainer';
import GradingContainer from './components/GradingContainer';
import ReportsContainer from './components/ReportsContainer';
import CoursePlanContainer from './components/CoursePlanContainer';

function App() {
  const [user, setUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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

  const [classes, setClasses, classesInit] = useFirestoreData('appData', 'classes', []);
  const [students, setStudents, studentsInit] = useFirestoreData('appData', 'students', []);
  const [attendance, setAttendance, attInit] = useFirestoreData('appData', 'attendance', []);
  const [scoreColumns, setScoreColumns, scInit] = useFirestoreData('appData', 'scoreColumns', []);
  const [scores, setScores, scoresInit] = useFirestoreData('appData', 'scores', []);
  
  const [attributes, setAttributes, attrInit] = useFirestoreData('appData', 'attributes', []);
  const [literacy, setLiteracy, litInit] = useFirestoreData('appData', 'literacy', []);
  const [competencies, setCompetencies, compInit] = useFirestoreData('appData', 'competencies', []);
  
  const [indicators, setIndicators, indInit] = useFirestoreData('appData', 'indicators', []);
  const [lessonPlans, setLessonPlans, lpInit] = useFirestoreData('appData', 'lessonPlans', []);
  
  const [appSettings, setAppSettings, settingsInit] = useFirestoreData('appData', 'settings', {
    schoolName: '',
    teacherName: '',
    academicHeadName: '',
    principalName: '',
    academicYear: '',
    semester: ''
  });

  const isDataLoaded = classesInit && studentsInit && attInit && scInit && scoresInit && attrInit && litInit && compInit && indInit && settingsInit && lpInit;

  const activeClass = classes ? classes.find(c => c.id === activeClassId) : null;

  if (!isDataLoaded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-secondary)', color: 'var(--primary-color)' }}>
        <div style={{ animation: 'spin 1s linear infinite', border: '4px solid var(--primary-light)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', width: '48px', height: '48px', marginBottom: '1rem' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)' }}>กำลังซิงค์ฐานข้อมูล Firebase...</h2>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        
        {/* Mobile Top Bar */}
        <div className="mobile-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.4rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={20} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>ปพ.5 Smart</h1>
          </div>
          <button className="btn-icon" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Overlay Background */}
        {isMobileMenuOpen && (
          <div className="mobile-overlay" onClick={closeMobileMenu}></div>
        )}

        {/* Sidebar */}
        <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-color)' }}>
              <GraduationCap size={24} />
            </div>
            <h1>ปพ.5 Smart</h1>
            <button className="btn-icon mobile-close-btn" onClick={closeMobileMenu}>
              <X size={24} />
            </button>
          </div>
          
          {classes && classes.length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>สลับห้องเรียนปัจจุบัน:</div>
              <select 
                className="form-input" 
                style={{ padding: '0.4rem', fontSize: '0.9rem', width: '100%', cursor: 'pointer', appearance: 'auto' }}
                value={activeClassId || ''}
                onChange={(e) => setActiveClassId(e.target.value)}
              >
                <option value="" disabled>-- เลือกห้องเรียน --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.subject}</option>
                ))}
              </select>
            </div>
          )}
          
          <nav className="sidebar-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobileMenu} end>
              <BarChart3 />
              <span>แดชบอร์ด</span>
            </NavLink>
            
            <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ข้อมูลพื้นฐาน
            </div>

            <NavLink to="/classes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
              <BookOpen />
              <span>จัดการห้องเรียน / วิชา</span>
            </NavLink>
            <NavLink to="/course-plan" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
              <ClipboardList />
              <span>โครงสร้างและแผนการสอน</span>
            </NavLink>
            <NavLink to="/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
              <Users />
              <span>รายชื่อนักเรียน</span>
            </NavLink>
            
            <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ผลสัมฤทธิ์
            </div>
            
            <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
              <Calendar />
              <span>เช็คเวลาเรียน</span>
            </NavLink>
            <NavLink to="/grading" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
              <Award />
              <span>บันทึกคะแนนและงานค้าง</span>
            </NavLink>

            <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              การประเมิน
            </div>
            
            <NavLink to="/assessments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
              <Star />
              <span>การประเมิน 3 หมวด</span>
            </NavLink>
            
            <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              รายงาน
            </div>
            <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
              <FileText />
              <span>พิมพ์รายงานและ ปพ.5</span>
            </NavLink>
          </nav>
          
          <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ marginBottom: '0.5rem' }} onClick={closeMobileMenu}>
              <Settings />
              <span>ตั้งค่าระบบ (ปพ.5)</span>
            </NavLink>
            {user ? (
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
                <LogOut size={18} style={{ marginRight: '0.5rem' }} />
                ออกจากระบบ (ครู)
              </button>
            ) : (
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setIsLoginModalOpen(true)}>
                <Key size={18} style={{ marginRight: '0.5rem' }} />
                เข้าสู่ระบบครู
              </button>
            )}
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
          <Routes>
            <Route path="/" element={<Dashboard classes={classes} students={students} activeClassId={activeClassId} setActiveClassId={setActiveClassId} attendance={attendance} scores={scores} scoreColumns={scoreColumns} />} />
            <Route path="/settings" element={<SettingsPage appSettings={appSettings} setAppSettings={setAppSettings} readOnly={readOnly} />} />
            <Route path="/classes" element={<Classes classes={classes} setClasses={setClasses} activeClassId={activeClassId} setActiveClassId={setActiveClassId} readOnly={readOnly} />} />
            <Route path="/course-plan" element={<CoursePlanContainer activeClassId={activeClassId} classes={classes} indicators={indicators} setIndicators={setIndicators} lessonPlans={lessonPlans} setLessonPlans={setLessonPlans} readOnly={readOnly} />} />
            <Route path="/students" element={<Students students={students} setStudents={setStudents} classes={classes} activeClassId={activeClassId} readOnly={readOnly} />} />
            <Route path="/attendance" element={<Attendance students={students} activeClassId={activeClassId} classes={classes} attendance={attendance} setAttendance={setAttendance} readOnly={readOnly} />} />
            <Route path="/grading" element={<GradingContainer students={students} activeClassId={activeClassId} classes={classes} scores={scores} setScores={setScores} scoreColumns={scoreColumns} setScoreColumns={setScoreColumns} indicators={indicators} readOnly={readOnly} />} />
            <Route path="/reports" element={<ReportsContainer appSettings={appSettings} activeClassId={activeClassId} classes={classes} students={students} attendance={attendance} scoreColumns={scoreColumns} scores={scores} attributes={attributes} literacy={literacy} competencies={competencies} readOnly={readOnly} />} />
            <Route path="/assessments" element={<AssessmentsContainer students={students} activeClassId={activeClassId} classes={classes} attributes={attributes} setAttributes={setAttributes} literacy={literacy} setLiteracy={setLiteracy} competencies={competencies} setCompetencies={setCompetencies} readOnly={readOnly} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
