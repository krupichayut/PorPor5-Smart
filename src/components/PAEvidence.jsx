import { useState, useMemo } from 'react';
import { Camera, FileVideo, Users, FileText, CheckCircle, TrendingUp, Image } from 'lucide-react';

export default function PAEvidence({ activeClassId, classes, students, lessonPlans, attendance, scores }) {
  const [activeTab, setActiveTab] = useState('photos');
  const activeClass = classes?.find(c => c.id === activeClassId);

  if (!activeClassId) {
    return (
      <div className="empty-state">
        <Camera size={48} className="empty-state-icon" />
        <h3>ยังไม่ได้เลือกห้องเรียน</h3>
        <p>กรุณาเลือกห้องเรียนเพื่อดูและจัดการหลักฐาน ว PA</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ padding: '1rem' }}>
      <div className="roster-hero-card" style={{ marginBottom: '2rem' }}>
        <span className="studio-card-kicker">ว PA Evidence Dashboard</span>
        <strong>แฟ้มสะสมผลงาน (Portfolio)</strong>
        <span>รวบรวมหลักฐานและร่องรอยการจัดการเรียนรู้ วิชาวิชา {activeClass?.subject} สำหรับประกอบการประเมิน ว PA</span>
      </div>

      <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card hairline-cell" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}><FileText size={32} /></div>
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{lessonPlans?.filter(lp => lp.classId === activeClassId)?.length || 0}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>แผนการสอนที่บันทึกแล้ว</p>
        </div>
        <div className="card hairline-cell" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ color: 'var(--accent-purple)', marginBottom: '0.5rem' }}><CheckCircle size={32} /></div>
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {lessonPlans?.filter(lp => lp.classId === activeClassId && lp.postRecord)?.length || 0}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>บันทึกหลังสอนเสร็จสิ้น</p>
        </div>
        <div className="card hairline-cell" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ color: 'var(--success)', marginBottom: '0.5rem' }}><TrendingUp size={32} /></div>
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {scores?.filter(s => s.score > 0)?.length || 0}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>ชิ้นงานที่ประเมินแล้ว</p>
        </div>
      </div>

      <div className="tabs-container" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>
          <Image size={16} style={{ display: 'inline', marginRight: '6px' }}/> ภาพถ่ายการสอน
        </button>
        <button className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>
          <FileVideo size={16} style={{ display: 'inline', marginRight: '6px' }}/> คลิปการสอน (ประเด็นท้าทาย)
        </button>
        <button className={`tab-btn ${activeTab === 'works' ? 'active' : ''}`} onClick={() => setActiveTab('works')}>
          <Users size={16} style={{ display: 'inline', marginRight: '6px' }}/> ผลงานนักเรียน
        </button>
      </div>

      <div className="hairline-cell" style={{ padding: '3rem', textAlign: 'center' }}>
        {activeTab === 'photos' && (
          <div className="empty-state">
            <Camera size={48} className="empty-state-icon" style={{ opacity: 0.5 }} />
            <h3>อัลบั้มภาพถ่ายการจัดกิจกรรม</h3>
            <p>อัปโหลดภาพบรรยากาศการเรียน Active Learning เพื่อใช้เป็นหลักฐานประกอบตัวชี้วัด (เร็วๆ นี้)</p>
            <button className="btn btn-outline" style={{ marginTop: '1rem' }} disabled>+ เพิ่มรูปภาพ</button>
          </div>
        )}
        {activeTab === 'videos' && (
          <div className="empty-state">
            <FileVideo size={48} className="empty-state-icon" style={{ opacity: 0.5 }} />
            <h3>คลิปวีดีโอการสอน</h3>
            <p>แนบลิงก์ YouTube/Google Drive สำหรับคลิปการสอนตามประเด็นท้าทาย (เร็วๆ นี้)</p>
            <button className="btn btn-outline" style={{ marginTop: '1rem' }} disabled>+ เพิ่มลิงก์วิดีโอ</button>
          </div>
        )}
        {activeTab === 'works' && (
          <div className="empty-state">
            <Users size={48} className="empty-state-icon" style={{ opacity: 0.5 }} />
            <h3>คลังผลงานนักเรียน</h3>
            <p>สุ่มเก็บหลักฐานชิ้นงานนักเรียน (ดี/พอใช้/ปรับปรุง) เพื่อแสดงผลลัพธ์การเรียนรู้ (เร็วๆ นี้)</p>
            <button className="btn btn-outline" style={{ marginTop: '1rem' }} disabled>+ สแกนผลงาน</button>
          </div>
        )}
      </div>
    </div>
  );
}
