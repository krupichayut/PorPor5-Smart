import { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';

export default function SettingsPage({ appSettings, setAppSettings, readOnly }) {
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
    </div>
  );
}
