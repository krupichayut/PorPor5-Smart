import { useState, useEffect } from 'react';
import { Save, Download, Database } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function SettingsPage({ appSettings, setAppSettings, readOnly, classes, students, attendance, scores, scoreColumns, attributes, literacy, competencies, lessonPlans, indicators }) {
  const [formData, setFormData] = useState({
    schoolName: '',
    teacherName: '',
    academicHeadName: '',
    principalName: '',
    academicYear: '',
    semester: ''
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (appSettings) {
      // eslint-disable-next-line
      setFormData({
        schoolName: appSettings.schoolName || '',
        teacherName: appSettings.teacherName || '',
        academicHeadName: appSettings.academicHeadName || '',
        principalName: appSettings.principalName || '',
        academicYear: appSettings.academicYear || '',
        semester: appSettings.semester || ''
      });
    }
  }, [appSettings]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setIsSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAppSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleBackup = () => {
    if (readOnly) return;
    try {
      const wb = XLSX.utils.book_new();
      
      const appendSheet = (data, name) => {
        if (data && data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31)); // Max sheet name length is 31
        } else {
          // Empty sheet fallback
          const ws = XLSX.utils.json_to_sheet([{ info: 'No data available' }]);
          XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
        }
      };

      appendSheet(classes, "Classes");
      appendSheet(students, "Students");
      appendSheet(scoreColumns, "Score_Columns");
      appendSheet(scores, "Scores");
      appendSheet(attendance, "Attendance");
      appendSheet(attributes, "Attributes");
      appendSheet(literacy, "Literacy");
      appendSheet(competencies, "Competencies");
      appendSheet(indicators, "Indicators");
      appendSheet(lessonPlans, "LessonPlans");
      
      const settingsArray = [appSettings];
      appendSheet(settingsArray, "Settings");

      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      XLSX.writeFile(wb, `PorPor5_FullBackup_${dateStr}.xlsx`);
    } catch (error) {
      console.error('Backup failed:', error);
      alert('เกิดข้อผิดพลาดในการสำรองข้อมูล');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">ตั้งค่าข้อมูลโรงเรียน</h2>
          <p className="page-subtitle">ข้อมูลนี้จะถูกนำไปใช้ในการออกรายงานและเอกสารต่างๆ</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">ปีการศึกษา</label>
              <input 
                type="text" 
                className="form-input" 
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                placeholder="เช่น 2567"
                disabled={readOnly}
              />
            </div>
            <div className="form-group">
              <label className="form-label">ภาคเรียนที่</label>
              <input 
                type="text" 
                className="form-input" 
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                placeholder="เช่น 1 หรือ 2"
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">ชื่อสถานศึกษา / โรงเรียน</label>
            <input 
              type="text" 
              className="form-input" 
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              placeholder="เช่น โรงเรียนตัวอย่างวิทยา"
              disabled={readOnly}
            />
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />
          <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary-color)', fontSize: '1.1rem' }}>ข้อมูลบุคลากร (สำหรับเซ็นเอกสาร)</h3>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">ชื่อ-นามสกุล ครูผู้สอน</label>
            <input 
              type="text" 
              className="form-input" 
              name="teacherName"
              value={formData.teacherName}
              onChange={handleChange}
              placeholder="เช่น นายใจดี สอนเก่ง (ไม่ต้องใส่คำว่า ครู)"
              disabled={readOnly}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">ชื่อ-นามสกุล หัวหน้าฝ่ายวิชาการ (หรือหัวหน้ากลุ่มสาระฯ)</label>
            <input 
              type="text" 
              className="form-input" 
              name="academicHeadName"
              value={formData.academicHeadName}
              onChange={handleChange}
              placeholder="เช่น นางวิชาการ เชี่ยวชาญ"
              disabled={readOnly}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">ชื่อ-นามสกุล ผู้อำนวยการสถานศึกษา</label>
            <input 
              type="text" 
              className="form-input" 
              name="principalName"
              value={formData.principalName}
              onChange={handleChange}
              placeholder="เช่น นายบริหาร เก่งกาจ"
              disabled={readOnly}
            />
          </div>

          {!readOnly && (
            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                <Save size={18} style={{ marginRight: '0.5rem' }} />
                บันทึกข้อมูล
              </button>
              {isSaved && <span style={{ color: '#10b981', fontWeight: 500 }}>บันทึกข้อมูลเรียบร้อยแล้ว!</span>}
            </div>
          )}
        </form>
      </div>

      <div className="card" style={{ maxWidth: '800px', marginTop: '1.5rem', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={20} className="text-primary" /> ระบบสำรองข้อมูล (Backup)
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
          คุณสามารถดาวน์โหลดข้อมูลทั้งหมดในระบบ (ห้องเรียน, รายชื่อนักเรียน, คะแนน, เวลาเรียน และอื่นๆ) ออกมาเป็นไฟล์ Excel (รวมหลาย Sheet) 
          เพื่อเก็บสำรองไว้ในเครื่องคอมพิวเตอร์ของคุณเองได้ตลอดเวลา
        </p>
        <button 
          className="btn btn-secondary" 
          onClick={handleBackup}
          disabled={readOnly}
          style={{ width: '100%', maxWidth: '300px', display: 'flex', justifyContent: 'center' }}
        >
          <Download size={18} style={{ marginRight: '0.5rem' }} />
          ดาวน์โหลดข้อมูลสำรอง (Excel)
        </button>
      </div>
    </div>
  );
}
