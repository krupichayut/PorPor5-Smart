import { Star } from 'lucide-react';

export default function Attributes({ students, activeClassId, classes, attributes, setAttributes, readOnly }) {
  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);

  const criteriaList = [
    { id: 'attr_1', name: '1. รักชาติ ศาสน์ กษัตริย์' },
    { id: 'attr_2', name: '2. ซื่อสัตย์สุจริต' },
    { id: 'attr_3', name: '3. มีวินัย' },
    { id: 'attr_4', name: '4. ใฝ่เรียนรู้' },
    { id: 'attr_5', name: '5. อยู่อย่างพอเพียง' },
    { id: 'attr_6', name: '6. มุ่งมั่นในการทำงาน' },
    { id: 'attr_7', name: '7. รักความเป็นไทย' },
    { id: 'attr_8', name: '8. มีจิตสาธารณะ' }
  ];

  const handleScoreChange = (studentId, criteriaId, value) => {
    if (readOnly) return;
    const existingIndex = attributes.findIndex(a => a.studentId === studentId && a.criteriaId === criteriaId);
    let newAttributes = [...attributes];
    
    if (existingIndex >= 0) {
      newAttributes[existingIndex] = { ...newAttributes[existingIndex], score: Number(value) };
    } else {
      newAttributes.push({
        // eslint-disable-next-line react-hooks/purity
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        classId: activeClassId,
        studentId,
        criteriaId,
        score: Number(value)
      });
    }
    setAttributes(newAttributes);
  };

  const calculateAverage = (studentId) => {
    let sum = 0;
    let count = 0;
    criteriaList.forEach(c => {
      const record = attributes.find(a => a.studentId === studentId && a.criteriaId === c.id);
      if (record) {
        sum += record.score;
        count++;
      }
    });
    if (count === 0) return '-';
    return Math.round(sum / count); // Average level (3,2,1,0)
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
            <h2 className="page-title">ประเมินคุณลักษณะอันพึงประสงค์</h2>
            <p className="page-subtitle">ประเมิน 8 ประการตามหลักสูตรแกนกลาง</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <Star size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">ประเมินคุณลักษณะฯ: {activeClass?.name}</h2>
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
                    <th key={c.id} style={{ textAlign: 'center', minWidth: '100px', fontSize: '0.75rem', whiteSpace: 'normal', verticalAlign: 'bottom' }}>
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
                        const record = attributes.find(record => record.studentId === s.id && record.criteriaId === c.id);
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
                                backgroundColor: record ? 'var(--bg-primary)' : 'transparent',
                                color: '#ffffff'
                              }}
                            >
                              <option value="" disabled style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>-</option>
                              <option value="3" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>3</option>
                              <option value="2" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>2</option>
                              <option value="1" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>1</option>
                              <option value="0" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>0</option>
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
