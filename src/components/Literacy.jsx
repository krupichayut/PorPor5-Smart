import { BookType } from 'lucide-react';

export default function Literacy({ students, activeClassId, classes, literacy, setLiteracy, readOnly }) {
  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);

  const criteriaList = [
    { id: 'lit_1', name: '1. การอ่าน' },
    { id: 'lit_2', name: '2. การคิดวิเคราะห์' },
    { id: 'lit_3', name: '3. การเขียน' }
  ];

  const handleScoreChange = (studentId, criteriaId, value) => {
    if (readOnly) return;
    const existingIndex = literacy.findIndex(a => a.studentId === studentId && a.criteriaId === criteriaId);
    let newLiteracy = [...literacy];
    
    if (existingIndex >= 0) {
      newLiteracy[existingIndex] = { ...newLiteracy[existingIndex], score: Number(value) };
    } else {
      newLiteracy.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        classId: activeClassId,
        studentId,
        criteriaId,
        score: Number(value)
      });
    }
    setLiteracy(newLiteracy);
  };

  const calculateAverage = (studentId) => {
    let sum = 0;
    let count = 0;
    criteriaList.forEach(c => {
      const record = literacy.find(a => a.studentId === studentId && a.criteriaId === c.id);
      if (record) {
        sum += record.score;
        count++;
      }
    });
    if (count === 0) return '-';
    return Math.round(sum / count);
  };

  const getLevelLabel = (score) => {
    if (score === 3) return 'ดีเยี่ยม';
    if (score === 2) return 'ดี';
    if (score === 1) return 'ผ่าน';
    if (score === 0) return 'ไม่ผ่าน';
    return '-';
  };

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">ประเมินการอ่าน คิดวิเคราะห์ และเขียน</h2>
            <p className="page-subtitle">ประเมินทักษะ 3 ด้านตามหลักสูตรแกนกลาง</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <BookType size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">ประเมินการอ่าน คิดวิเคราะห์ เขียน: {activeClass?.name}</h2>
          <p className="page-subtitle">เลือกระดับคะแนน: 3=ดีเยี่ยม, 2=ดี, 1=ผ่าน, 0=ไม่ผ่าน</p>
        </div>
      </div>

      <div className="card">
        {classStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <p>ยังไม่มีข้อมูลนักเรียนในห้องนี้ กรุณาเพิ่มนักเรียนก่อน</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: 'var(--bg-tertiary)', zIndex: 1 }}>เลขที่</th>
                  <th style={{ position: 'sticky', left: '60px', backgroundColor: 'var(--bg-tertiary)', zIndex: 1 }}>ชื่อ - นามสกุล</th>
                  {criteriaList.map(c => (
                    <th key={c.id} style={{ textAlign: 'center', minWidth: '100px' }}>
                      {c.name}
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>สรุปผล</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => {
                  const avg = calculateAverage(s.id);
                  return (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', position: 'sticky', left: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 1 }}>{index + 1}</td>
                      <td style={{ fontWeight: 500, position: 'sticky', left: '60px', backgroundColor: 'var(--bg-secondary)', zIndex: 1 }}>{s.name}</td>
                      {criteriaList.map(c => {
                        const record = literacy.find(record => record.studentId === s.id && record.criteriaId === c.id);
                        return (
                          <td key={c.id} style={{ textAlign: 'center' }}>
                            <select 
                              value={record ? record.score : ''}
                              onChange={(e) => handleScoreChange(s.id, c.id, e.target.value)}
                              disabled={readOnly}
                              style={{ 
                                padding: '4px', 
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                fontFamily: 'inherit',
                                backgroundColor: record ? 'var(--bg-primary)' : 'transparent'
                              }}
                            >
                              <option value="" disabled>-</option>
                              <option value="3">3</option>
                              <option value="2">2</option>
                              <option value="1">1</option>
                              <option value="0">0</option>
                            </select>
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--primary-color)', backgroundColor: 'var(--bg-primary)' }}>
                        {getLevelLabel(avg)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
