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
    <div className="animate-fade-in">
      <div className="stat-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span className="badge badge-present">ก.ค.ศ. ว PA Portfolio</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>วิชา {activeClass?.subject}</span>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          แฟ้มสะสมผลงานและร่องรอยการจัดการเรียนรู้
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          รวบรวมหลักฐานและผลลัพธ์การเรียนรู้ของนักเรียนห้อง <strong>{activeClass?.name}</strong> เพื่อประกอบการประเมินวิทยฐานะตามเกณฑ์ ว PA
        </p>
      </div>

      <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">แผนการสอนทั้งหมด</div>
          <div className="stat-value">{lessonPlans?.filter(lp => lp.classId === activeClassId)?.length || 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>แผนที่สร้างไว้</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">บันทึกหลังสอนเสร็จ</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {lessonPlans?.filter(lp => lp.classId === activeClassId && lp.postRecord)?.length || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>รายการที่บันทึกแล้ว</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">คะแนนชิ้นงานที่บันทึก</div>
          <div className="stat-value">
            {scores?.filter(s => s.score > 0)?.length || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>รายการประเมิน</div>
        </div>
      </div>

      <div className="tabs-container" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>
          <Image size={15} /> ภาพถ่ายการสอน
        </button>
        <button className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>
          <FileVideo size={15} /> คลิปการสอน (ประเด็นท้าทาย)
        </button>
        <button className={`tab-btn ${activeTab === 'works' ? 'active' : ''}`} onClick={() => setActiveTab('works')}>
          <Users size={15} /> ผลงานนักเรียน
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
