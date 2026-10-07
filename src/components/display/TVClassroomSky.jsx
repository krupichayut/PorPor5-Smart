import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useFirestoreData } from '../../hooks/useFirestoreData';
import { useConstellations, calculateStudentConstellations } from '../../hooks/useConstellations';
import { useDisplayQueue } from '../../hooks/useDisplayQueue';
import { Star, Sparkles, MonitorOff, Maximize } from 'lucide-react';

// CSS variables for TV mode are injected inline for simplicity, 
// but should ideally be in index.css. We use inline objects here.
const tvTheme = {
  bg: '#071426',
  surface: '#10294A',
  textMain: '#F5F2E8',
  textMuted: '#9FB0C5',
  gold: '#F5C451',
  blue: '#35BDEB'
};


const CONSTELLATION_POINTS = [
  { x: 10, y: 75 }, // 1
  { x: 35, y: 55 }, // 2
  { x: 55, y: 70 }, // 3
  { x: 75, y: 40 }, // 4
  { x: 90, y: 15 }, // 5
];

const CONSTELLATION_LINES = [
  { from: 0, to: 1 },
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 2 }, // connects 5 back to 3 to form a shape
];

export default function TVClassroomSky() {
  const { classId } = useParams();
  const [classes] = useFirestoreData('appData', 'classes', []);
  const [students] = useFirestoreData('appData', 'students', []);
  
  const { starEvents, loading } = useConstellations(classId);
  const { currentEvent, isProcessing, processNext, finishCurrentEvent, queueLength } = useDisplayQueue(classId);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [idlePage, setIdlePage] = useState(0);

  const activeClass = classes.find(c => c.id === classId);
  const classStudents = useMemo(() => students.filter(s => s.classId === classId).sort((a, b) => a.number - b.number), [students, classId]);

  // Map student data
  const studentDataMap = useMemo(() => {
    const map = {};
    classStudents.forEach(student => {
      map[student.id] = calculateStudentConstellations(starEvents, student.id);
    });
    return map;
  }, [classStudents, starEvents]);

  // Queue Processing Logic
  useEffect(() => {
    if (!isProcessing && queueLength > 0) {
      processNext();
    }
  }, [isProcessing, queueLength, processNext]);

  // Auto-advance idle pages
  useEffect(() => {
    if (isProcessing || isPrivacyMode) return;
    const interval = setInterval(() => {
      setIdlePage(prev => {
        const totalPages = Math.ceil(classStudents.length / 8);
        return (prev + 1) % (totalPages || 1);
      });
    }, 15000); // Change page every 15 seconds
    return () => clearInterval(interval);
  }, [isProcessing, isPrivacyMode, classStudents.length]);

  // Handle Event Animation Timing
  useEffect(() => {
    if (currentEvent) {
      // Check if this event completes a constellation
      const sData = studentDataMap[currentEvent.studentId];
      // Note: studentDataMap already includes this event because useConstellations updates immediately.
      // So if partialStars === 0 and activeStars > 0, it means a constellation just completed!
      const isCompletion = sData && sData.activeStars > 0 && sData.partialStars === 0;
      
      const displayTime = isCompletion ? 8000 : 5000; // 8s for completion, 5s for normal star

      const timer = setTimeout(() => {
        finishCurrentEvent();
      }, displayTime);
      return () => clearTimeout(timer);
    }
  }, [currentEvent, studentDataMap, finishCurrentEvent]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!activeClass || loading) {
    return <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: tvTheme.bg, color: tvTheme.textMain, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>กำลังวาดท้องฟ้า...</div>;
  }

  if (isPrivacyMode) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: tvTheme.bg, color: tvTheme.textMain, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '4rem', fontFamily: 'var(--font-serif)', color: tvTheme.gold }}>PitchClass</h1>
        <p style={{ fontSize: '2rem', color: tvTheme.textMuted }}>พักหน้าจอ</p>
        <button onClick={() => setIsPrivacyMode(false)} style={{ position: 'absolute', bottom: '2rem', right: '2rem', background: 'transparent', border: '1px solid #333', color: '#555', padding: '1rem', borderRadius: '8px' }}>
          แสดงหน้าจอ
        </button>
      </div>
    );
  }

  // --- RENDER MODES ---

  // 1. AWARD MODE
  if (currentEvent) {
    const student = classStudents.find(s => s.id === currentEvent.studentId);
    const sData = studentDataMap[currentEvent.studentId];
    const isCompletion = sData && sData.activeStars > 0 && sData.partialStars === 0;

    return (
      <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: tvTheme.bg, color: tvTheme.textMain, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: '150vw', height: '150vh', background: 'radial-gradient(circle, rgba(24,87,166,0.2) 0%, rgba(7,20,38,1) 60%)', zIndex: 0 }}></div>
        
        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', color: tvTheme.textMuted, marginBottom: '1rem' }}>
            {isCompletion ? 'กลุ่มดาวสมบูรณ์แล้ว!' : 'ดาวดวงใหม่สว่างขึ้น!'}
          </h2>
          <h1 style={{ fontSize: '5rem', fontFamily: 'var(--font-serif)', color: tvTheme.gold, margin: '0 0 3rem 0', textShadow: '0 0 20px rgba(245,196,81,0.5)' }}>
            {student?.name} {student?.nickname ? `(${student.nickname})` : ''}
          </h1>

          
          <div style={{ position: 'relative', width: '800px', height: '400px', margin: '0 auto 3rem auto' }}>
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, overflow: 'visible' }}>
              {CONSTELLATION_LINES.map((line, idx) => {
                const p1 = CONSTELLATION_POINTS[line.from];
                const p2 = CONSTELLATION_POINTS[line.to];
                const star1Lit = isCompletion ? true : (line.from + 1) <= (sData?.partialStars || 0);
                const star2Lit = isCompletion ? true : (line.to + 1) <= (sData?.partialStars || 0);
                const isLineLit = star1Lit && star2Lit;
                return (
                  <line 
                    key={idx}
                    x1={`${p1.x}%`} y1={`${p1.y}%`} x2={`${p2.x}%`} y2={`${p2.y}%`}
                    stroke={isLineLit ? tvTheme.gold : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isLineLit ? 3 : 2}
                    style={{ transition: 'stroke 1s, stroke-width 1s', filter: isLineLit ? 'drop-shadow(0 0 10px rgba(245,196,81,0.5))' : 'none' }}
                  />
                );
              })}
            </svg>

            {CONSTELLATION_POINTS.map((pos, index) => {
              const i = index + 1;
              const isLit = isCompletion ? true : i <= (sData?.partialStars || 0);
              const isJustEarned = isCompletion ? i === 5 : i === (sData?.partialStars || 0);
              return (
                <div key={i} style={{ 
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) ${isJustEarned ? 'scale(1.5)' : 'scale(1)'}`, 
                  transition: 'transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  animation: isJustEarned ? 'pulse 2s infinite' : 'none',
                  zIndex: 2
                }}>
                  <Star 
                    size={isJustEarned ? 120 : 80} 
                    fill={isLit ? tvTheme.gold : 'transparent'} 
                    color={isLit ? tvTheme.gold : tvTheme.surface}
                    strokeWidth={isLit ? 1 : 2}
                    style={{ filter: isLit ? 'drop-shadow(0 0 15px rgba(245,196,81,0.6))' : 'none' }}
                  />
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: '2.5rem', color: tvTheme.blue }}>
            ได้รับดาวจาก: <span style={{ color: tvTheme.textMain }}>{currentEvent.reasonText}</span>
          </p>
        </div>
      </div>
    );
  }

  // 2. IDLE MODE (ท้องฟ้าประจำห้อง)
  const studentsOnPage = classStudents.slice(idlePage * 8, (idlePage + 1) * 8);

  return (
    <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backgroundColor: tvTheme.bg, color: tvTheme.textMain, display: 'flex', flexDirection: 'column', padding: '3rem', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${tvTheme.surface}`, paddingBottom: '2rem', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', color: tvTheme.textMuted, margin: '0 0 0.5rem 0' }}>ห้อง {activeClass.name} | {activeClass.subject}</h2>
          <h1 style={{ fontSize: '4rem', fontFamily: 'var(--font-serif)', color: tvTheme.gold, margin: 0 }}>ท้องฟ้าแห่งการเติบโต</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setIsPrivacyMode(true)} style={{ background: tvTheme.surface, border: 'none', color: tvTheme.textMuted, padding: '1rem', borderRadius: '50%', cursor: 'pointer' }}>
            <MonitorOff size={32} />
          </button>
          <button onClick={toggleFullscreen} style={{ background: tvTheme.surface, border: 'none', color: tvTheme.textMuted, padding: '1rem', borderRadius: '50%', cursor: 'pointer' }}>
            <Maximize size={32} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '2rem' }}>
        {studentsOnPage.map(student => {
          const sData = studentDataMap[student.id];
          return (
            <div key={student.id} style={{ 
              background: `linear-gradient(145deg, ${tvTheme.surface} 0%, rgba(16,41,74,0.3) 100%)`,
              borderRadius: '24px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ fontSize: '2rem', color: tvTheme.textMuted, marginBottom: '0.5rem' }}>เลขที่ {student.number}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: tvTheme.textMain, marginBottom: '2rem', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                {student.nickname || student.name.split(' ')[0]}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map(i => {
                  const isLit = i <= (sData?.partialStars || 0);
                  return (
                    <Star 
                      key={i} 
                      size={36} 
                      fill={isLit ? tvTheme.gold : 'transparent'} 
                      color={isLit ? tvTheme.gold : 'rgba(255,255,255,0.1)'}
                      style={{ filter: isLit ? 'drop-shadow(0 0 8px rgba(245,196,81,0.5))' : 'none' }}
                    />
                  );
                })}
              </div>

              {sData?.availableConstellations > 0 && (
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: tvTheme.blue, fontSize: '1.5rem' }}>
                  <Sparkles size={24} /> {sData.availableConstellations} กลุ่มดาวพร้อมใช้
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer / Pagination Indicator */}
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        {Array.from({ length: Math.ceil(classStudents.length / 8) }).map((_, i) => (
          <div key={i} style={{ 
            width: i === idlePage ? '40px' : '15px', 
            height: '8px', 
            borderRadius: '4px', 
            backgroundColor: i === idlePage ? tvTheme.gold : tvTheme.surface,
            transition: 'all 0.5s ease'
          }}></div>
        ))}
      </div>
    </div>
  );
}
