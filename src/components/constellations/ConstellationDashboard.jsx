import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Star, Award, History, X, Check, Search, Undo } from 'lucide-react';
import { useConstellations, calculateStudentConstellations } from '../../hooks/useConstellations';
import { useRedemptions } from '../../hooks/useRewards';
import { awardStar, voidStar, REASON_CATEGORIES } from '../../services/starEvents';
import StudentConstellationDetail from './StudentConstellationDetail';

export default function ConstellationDashboard({ activeClassId, classes, students }) {
  const { starEvents, loading: starsLoading } = useConstellations(activeClassId);
  const { redemptions } = useRedemptions(activeClassId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [detailStudentId, setDetailStudentId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAwardedEventIds, setLastAwardedEventIds] = useState([]);

  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = useMemo(() => {
    let filtered = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.nickname && s.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return filtered;
  }, [students, activeClassId, searchTerm]);

  const studentDataMap = useMemo(() => {
    const map = {};
    classStudents.forEach(student => {
      map[student.id] = calculateStudentConstellations(starEvents, student.id, 5, redemptions);
    });
    return map;
  }, [classStudents, starEvents, redemptions]);

  // --- Handlers ---
  const toggleStudent = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === classStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(classStudents.map(s => s.id));
    }
  };

  const handleAwardStar = async () => {
    if (selectedStudentIds.length === 0 || !selectedCategory || !selectedReason) return;
    
    setIsSubmitting(true);
    const newEventIds = [];
    
    for (const studentId of selectedStudentIds) {
      const result = await awardStar({
        studentId,
        classId: activeClassId,
        category: selectedCategory.id,
        reasonCode: selectedReason,
        reasonText: selectedReason,
        note: ''
      });
      if (result.success) {
        newEventIds.push(result.id);
      }
    }
    
    setLastAwardedEventIds(newEventIds);
    setSelectedStudentIds([]);
    setSelectedCategory(null);
    setSelectedReason(null);
    setIsSubmitting(false);

    // Auto-clear undo option after 10 seconds
    setTimeout(() => {
      setLastAwardedEventIds(prev => prev.filter(id => !newEventIds.includes(id)));
    }, 10000);
  };

  const handleUndo = async () => {
    for (const eventId of lastAwardedEventIds) {
      await voidStar(eventId, 'ครูกดยกเลิกการให้ดาวล่าสุด');
    }
    setLastAwardedEventIds([]);
  };

  if (!activeClassId) {
    return (
      <div className="animate-fade-in" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        กรุณาเลือกห้องเรียนจากแถบด้านบน
      </div>
    );
  }

  // --- UI Variables ---
  const categories = Object.values(REASON_CATEGORIES);

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{ padding: '2rem 3rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
            กลุ่มดาวแห่งการเติบโต
          </h2>
          <div style={{ color: 'var(--text-muted)' }}>
            ห้อง {activeClass?.name} | นักเรียน {classStudents.length} คน
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {lastAwardedEventIds.length > 0 && (
            <button onClick={handleUndo} className="btn" style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Undo size={16} /> ยกเลิกให้ดาวล่าสุด
            </button>
          )}
          <Link to="/teacher/rewards" className="btn" style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            จัดการร้านรางวัล
          </Link>
          <a href={`/display/classroom/${activeClassId}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            เปิดหน้าจอทีวีห้องเรียน
          </a>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left: Quick Award Panel */}
        <div style={{ flex: '0 0 350px', borderRight: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)', padding: '2rem', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={20} color="var(--accent-primary)" /> มอบดาว (Quick Award)
          </h3>
          
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>1. เลือกเหตุผล</div>
            <select 
              className="form-control" 
              style={{ width: '100%', marginBottom: '0.75rem', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
              value={selectedCategory ? selectedCategory.id : ''}
              onChange={(e) => {
                const cat = categories.find(c => c.id === e.target.value);
                setSelectedCategory(cat || null);
                setSelectedReason(null);
              }}
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            
            {selectedCategory && (
              <select 
                className="form-control" 
                style={{ width: '100%', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
                value={selectedReason || ''}
                onChange={(e) => setSelectedReason(e.target.value)}
              >
                <option value="">-- เลือกพฤติกรรม --</option>
                {selectedCategory.reasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
              </select>
            )}
          </div>
          
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>2. ยืนยันการมอบดาว</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>เลือก {selectedStudentIds.length} คน</div>
          </div>
          
          <button 
            className="btn"
            style={{ 
              width: '100%', 
              padding: '1rem', 
              backgroundColor: selectedStudentIds.length > 0 && selectedReason ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
              color: selectedStudentIds.length > 0 && selectedReason ? 'var(--bg-sidebar)' : 'var(--text-muted)',
              border: 'none',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: selectedStudentIds.length > 0 && selectedReason && !isSubmitting ? 'pointer' : 'not-allowed'
            }}
            disabled={selectedStudentIds.length === 0 || !selectedReason || isSubmitting}
            onClick={handleAwardStar}
          >
            {isSubmitting ? 'กำลังบันทึก...' : <>มอบดาว {selectedStudentIds.length} ดวง <Star size={18} fill="currentColor" /></>}
          </button>
        </div>
        
        {/* Right: Students List */}
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: 0 }}>
                เลือกนักเรียน
              </h3>
              <button 
                onClick={handleSelectAll}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {selectedStudentIds.length === classStudents.length ? 'ยกเลิกทั้งหมด' : 'เลือกทุกคน'}
              </button>
            </div>
            
            <div style={{ position: 'relative', width: '250px' }}>
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {classStudents.map(student => {
              const isSelected = selectedStudentIds.includes(student.id);
              const data = studentDataMap[student.id];
              
              return (
                <div 
                  key={student.id} 
                  style={{ 
                    backgroundColor: isSelected ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  {isSelected && (
                    <div style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: 'var(--accent-primary)', color: 'var(--bg-sidebar)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={16} />
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div onClick={() => toggleStudent(student.id)} style={{ flex: 1 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>เลขที่ {student.number}</div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                        {student.name} {student.nickname ? `(${student.nickname})` : ''}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDetailStudentId(student.id); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}
                      title="ดูรายละเอียดและแลกรางวัล"
                    >
                      <History size={16} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={() => toggleStudent(student.id)}>
                    {/* Render Stars */}
                    {[1, 2, 3, 4, 5].map(starNum => (
                      <Star 
                        key={starNum} 
                        size={16} 
                        fill={starNum <= data?.partialStars ? 'var(--accent-primary)' : 'none'}
                        color={starNum <= data?.partialStars ? 'var(--accent-primary)' : 'var(--border-subtle)'}
                      />
                    ))}
                    <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Award size={14} /> {data?.availableConstellations || 0}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {detailStudentId && (
        <StudentConstellationDetail 
          student={classStudents.find(s => s.id === detailStudentId)}
          data={studentDataMap[detailStudentId]}
          classId={activeClassId}
          onClose={() => setDetailStudentId(null)}
        />
      )}
    </div>
  );
}
