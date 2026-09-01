import { useState } from 'react';
import { FileSpreadsheet, Download, CheckCircle } from 'lucide-react';
import { generatePorPor5Excel } from '../utils/porpor5Export';

export default function PorPor5Generator({ 
  activeClassId, classes, students, appSettings, attendance, 
  scoreColumns, scores, attributes, literacy, competencies, indicators 
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);

  const handleExport = async () => {
    if (!activeClass || classStudents.length === 0) {
      alert("กรุณาเพิ่มนักเรียนในห้องเรียนก่อนสร้าง ปพ.5");
      return;
    }

    setIsGenerating(true);
    setSuccess(false);

    try {
      const data = {
        classInfo: activeClass,
        settings: appSettings || {},
        students: classStudents,
        indicators: indicators?.filter(i => i.classId === activeClassId) || [],
        attendance: attendance?.filter(a => a.classId === activeClassId) || [],
        scoreColumns: scoreColumns?.filter(c => c.classId === activeClassId) || [],
        scores: scores || [],
        attributes: attributes?.filter(a => a.classId === activeClassId) || [],
        literacy: literacy?.filter(l => l.classId === activeClassId) || [],
        competencies: competencies?.filter(c => c.classId === activeClassId) || [],
        classes: classes
      };

      await generatePorPor5Excel(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error("Error generating Por-Por-5:", error);
      alert("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!activeClassId) {
    return (
      <div className="empty-state">
        <FileSpreadsheet size={48} className="empty-state-icon" />
        <h3>ไม่มีการเลือกห้องเรียน</h3>
        <p>กรุณาเลือกห้องเรียนก่อนทำการสร้าง ปพ.5</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="stat-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span className="badge badge-success">Automated Export Engine</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Excel XLSX Format</span>
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          ออกรายงาน ปพ.5 (สมุดบันทึกผลการพัฒนาคุณภาพผู้เรียน)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          รวบรวมข้อมูลทั้งหมดของวิชา <strong>{activeClass?.subject}</strong> ห้อง <strong>{activeClass?.name}</strong> (นักเรียน {classStudents.length} คน) ออกมาเป็นไฟล์ Excel ครบทั้ง 3 ส่วนหลักทันที
        </p>
      </div>

      <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="hairline-cell">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <CheckCircle size={16} style={{ color: 'var(--success)' }} /> ข้อมูลที่จะถูกสร้างในไฟล์ Excel
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <li>✓ <strong>Sheet 1 (หน้าปก):</strong> ข้อมูลสถานศึกษา, รหัสวิชา, ครูผู้สอน</li>
            <li>✓ <strong>Sheet 2 (เวลาเรียน):</strong> สรุปเวลาเรียนรายสัปดาห์ / รายเดือน / ร้อยละการเข้าเรียน</li>
            <li>✓ <strong>Sheet 3 (ผลการเรียน):</strong> คะแนนเก็บทุกหน่วย, สอบกลางภาค, สอบปลายภาค และเกรด</li>
          </ul>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleExport} 
          disabled={isGenerating || classStudents.length === 0}
          style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
        >
          {isGenerating ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              กำลังประมวลผลไฟล์...
            </span>
          ) : success ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={18} /> ดาวน์โหลดสำเร็จแล้ว!
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={18} /> ดาวน์โหลด ปพ.5 (.xlsx)
            </span>
          )}
        </button>
        
        {classStudents.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--danger)', marginTop: '0.75rem', fontSize: '0.85rem' }}>
            ไม่สามารถดาวน์โหลดได้เนื่องจากยังไม่มีรายชื่อนักเรียนในห้องนี้
          </p>
        )}
      </div>
    </div>
  );
}
