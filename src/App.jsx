import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { BookOpen, Users, Calendar, Award, BarChart3, Settings, GraduationCap, Star, BookType, Brain, FileText } from 'lucide-react';
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
import MissingWork from './components/MissingWork';

const Dashboard = ({ classes, students, activeClassId }) => {
  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">แดชบอร์ด</h2>
          <p className="page-subtitle">ภาพรวมข้อมูลห้องเรียน</p>
        </div>
      </div>
      
      {!activeClassId ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <BarChart3 size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> เพื่อดูแดชบอร์ด</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
              <Users size={32} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>นักเรียนทั้งหมด</p>
              <h3 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>{classStudents.length}</h3>
            </div>
          </div>
          
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#d1fae5', color: '#047857', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
              <Calendar size={32} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>ระบบเวลาเรียน & คะแนน</p>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>พร้อมใช้งาน</h3>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '1rem', borderRadius: 'var(--radius-full)' }}>
              <Star size={32} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>ระบบประเมิน 3 หมวด</p>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>พร้อมใช้งาน</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
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

  const isDataLoaded = classesInit && studentsInit && attInit && scInit && scoresInit && attrInit && litInit && compInit && indInit;

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
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.5rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-color)' }}>
              <GraduationCap size={24} />
            </div>
            <h1>ปพ.5 Smart</h1>
          </div>
          
          {activeClass && (
            <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>ห้องเรียนที่เลือก:</div>
              <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{activeClass.name}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{activeClass.subject}</div>
            </div>
          )}
          
          <nav className="sidebar-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
              <BarChart3 />
              <span>แดชบอร์ด</span>
            </NavLink>
            
            <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ข้อมูลพื้นฐาน
            </div>
            
            <NavLink to="/classes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <BookOpen />
              <span>ห้องเรียน / วิชา</span>
            </NavLink>
            <NavLink to="/indicators" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText />
              <span>โครงสร้างวิชา / ตัวชี้วัด</span>
            </NavLink>
            <NavLink to="/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users />
              <span>นักเรียน</span>
            </NavLink>
            
            <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ผลสัมฤทธิ์
            </div>
            
            <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Calendar />
              <span>เวลาเรียน</span>
            </NavLink>
            <NavLink to="/scores" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Award />
              <span>บันทึกคะแนน</span>
            </NavLink>
            <NavLink to="/missing-work" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText />
              <span>ติดตามงานค้าง</span>
            </NavLink>

            <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              การประเมิน 3 หมวด
            </div>
            
            <NavLink to="/attributes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Star />
              <span>คุณลักษณะฯ</span>
            </NavLink>
            <NavLink to="/literacy" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <BookType />
              <span>อ่าน คิดวิเคราะห์ เขียน</span>
            </NavLink>
            <NavLink to="/competencies" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Brain />
              <span>สมรรถนะสำคัญ</span>
            </NavLink>
            
            <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              รายงาน
            </div>
            <NavLink to="/grades" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <BarChart3 />
              <span>สรุปผลการเรียน (Print)</span>
            </NavLink>
          </nav>
          
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard classes={classes} students={students} activeClassId={activeClassId} />} />
            <Route path="/classes" element={<Classes classes={classes} setClasses={setClasses} activeClassId={activeClassId} setActiveClassId={setActiveClassId} />} />
            <Route path="/indicators" element={<Indicators activeClassId={activeClassId} classes={classes} indicators={indicators} setIndicators={setIndicators} />} />
            <Route path="/students" element={<Students students={students} setStudents={setStudents} classes={classes} activeClassId={activeClassId} />} />
            <Route path="/attendance" element={<Attendance students={students} activeClassId={activeClassId} classes={classes} attendance={attendance} setAttendance={setAttendance} />} />
            <Route path="/scores" element={<Scores students={students} activeClassId={activeClassId} classes={classes} scores={scores} setScores={setScores} scoreColumns={scoreColumns} setScoreColumns={setScoreColumns} indicators={indicators} />} />
            <Route path="/missing-work" element={<MissingWork students={students} activeClassId={activeClassId} classes={classes} scores={scores} setScores={setScores} scoreColumns={scoreColumns} />} />
            <Route path="/grades" element={<Grades students={students} activeClassId={activeClassId} classes={classes} scores={scores} scoreColumns={scoreColumns} attributes={attributes} literacy={literacy} competencies={competencies} />} />
            
            <Route path="/attributes" element={<Attributes students={students} activeClassId={activeClassId} classes={classes} attributes={attributes} setAttributes={setAttributes} />} />
            <Route path="/literacy" element={<Literacy students={students} activeClassId={activeClassId} classes={classes} literacy={literacy} setLiteracy={setLiteracy} />} />
            <Route path="/competencies" element={<Competencies students={students} activeClassId={activeClassId} classes={classes} competencies={competencies} setCompetencies={setCompetencies} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
