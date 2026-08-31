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
    <div className="animate-fade-in" style={{ padding: '1.5rem' }}>
      <div className="roster-hero-card" style={{ marginBottom: '2rem' }}>
        <span className="studio-card-kicker">Automated Document</span>
        <strong>ออกรายงาน ปพ.5 (Excel)</strong>
        <span>รวบรวมข้อมูลทั้งหมดของวิชา {activeClass?.subject} สำหรับห้อง {activeClass?.name} ออกมาเป็นไฟล์ Excel ทันที</span>
      </div>

      <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card hairline-cell">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} color="var(--accent-cyan)" /> ข้อมูลที่จะถูกรวมในเอกสาร
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)' }}>
            <li>• หน้าปก (ดึงจากตั้งค่าโรงเรียน)</li>
            <li>• เวลาเรียน (คำนวณเป็นชั่วโมง)</li>
            <li>• ผลสัมฤทธิ์ทางการเรียน (คะแนนเก็บ/สอบ/เกรด)</li>
            {/* <li>• คุณลักษณะอันพึงประสงค์ 8 ประการ (เร็วๆ นี้)</li>
            <li>• อ่าน คิดวิเคราะห์ และเขียน (เร็วๆ นี้)</li>
            <li>• สมรรถนะสำคัญ 5 ประการ (เร็วๆ นี้)</li> */}
          </ul>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleExport} 
          disabled={isGenerating || classStudents.length === 0}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: 'var(--rounded-lg)' }}
        >
          {isGenerating ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="spinner" style={{ width: '20px', height: '20px' }}></div> กำลังสร้างไฟล์...
            </span>
          ) : success ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} /> ดาวน์โหลดสำเร็จ!
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={20} /> ดาวน์โหลด ปพ.5 (Excel)
            </span>
          )}
        </button>
      </div>
      
      {classStudents.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--danger)', marginTop: '1rem' }}>
          ไม่สามารถดาวน์โหลดได้เนื่องจากยังไม่มีรายชื่อนักเรียนในห้องนี้
        </p>
      )}
    </div>
  );
}
