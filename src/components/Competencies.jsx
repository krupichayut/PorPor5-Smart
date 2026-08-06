import { Brain } from 'lucide-react';

export default function Competencies({ students, activeClassId, classes, competencies, setCompetencies, readOnly }) {
  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);

  const criteriaList = [
    { id: 'comp_1', name: '1. การสื่อสาร' },
    { id: 'comp_2', name: '2. การคิด' },
    { id: 'comp_3', name: '3. การแก้ปัญหา' },
    { id: 'comp_4', name: '4. การใช้ทักษะชีวิต' },
    { id: 'comp_5', name: '5. การใช้เทคโนโลยี' }
  ];

  const handleScoreChange = (studentId, criteriaId, value) => {
    if (readOnly) return;
    const existingIndex = competencies.findIndex(a => a.studentId === studentId && a.criteriaId === criteriaId);
    let newCompetencies = [...competencies];
    
    if (existingIndex >= 0) {
      newCompetencies[existingIndex] = { ...newCompetencies[existingIndex], score: Number(value) };
    } else {
      newCompetencies.push({
        // eslint-disable-next-line react-hooks/purity
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        classId: activeClassId,
        studentId,
        criteriaId,
        score: Number(value)
      });
    }
    setCompetencies(newCompetencies);
  };

  const calculateAverage = (studentId) => {
    let sum = 0;
    let count = 0;
    criteriaList.forEach(c => {
      const record = competencies.find(a => a.studentId === studentId && a.criteriaId === c.id);
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
            <h2 className="page-title">ประเมินสมรรถนะสำคัญของผู้เรียน</h2>
            <p className="page-subtitle">ประเมินความสามารถ 5 ด้านตามหลักสูตรแกนกลาง</p>
          </div>
        </div>
        <div className="empty-state">
          <Brain size={48} />
          <h3>ไม่มีการเลือกห้องเรียน</h3>
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">ประเมินสมรรถนะสำคัญ: {activeClass?.name}</h2>
          <p className="page-subtitle">เลือกระดับคะแนน: 3=ดีเยี่ยม, 2=ดี, 1=ผ่าน, 0=ไม่ผ่าน</p>
        </div>
      </div>

      <div className="hairline-cell">
        {classStudents.length === 0 ? (
          <div className="empty-state">
            <Brain size={48} />
            <h3>ไม่พบข้อมูลนักเรียน</h3>
            <p>ยังไม่มีข้อมูลนักเรียนในห้องนี้ กรุณาเพิ่มนักเรียนก่อน</p>
          </div>
        ) : (
            <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: 'var(--bg-tertiary)', zIndex: 1 }}>เลขที่</th>
                  <th style={{ position: 'sticky', left: '60px', backgroundColor: 'var(--bg-tertiary)', zIndex: 1 }}>ชื่อ - นามสกุล</th>
                  {criteriaList.map(c => (
                    <th key={c.id} style={{ textAlign: 'center', minWidth: '100px' }}>
                      {c.name}
                    </th>
                  ))}
                  <th style={{ textAlign: 'center', backgroundColor: 'var(--primary-light)', color: 'var(--accent-cyan)' }}>สรุปผล</th>
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
                        const record = competencies.find(record => record.studentId === s.id && record.criteriaId === c.id);
                        return (
                          <td key={c.id} style={{ textAlign: 'center' }}>
                            <select 
                              className={`form-control ${record ? 'active-record' : ''}`}
                              value={record ? record.score : ''}
                              onChange={(e) => handleScoreChange(s.id, c.id, e.target.value)}
                              disabled={readOnly}
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
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-cyan)', backgroundColor: 'var(--bg-primary)' }}>
                        {getLevelLabel(avg)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
        )}
      </div>
    </div>
  );
}
