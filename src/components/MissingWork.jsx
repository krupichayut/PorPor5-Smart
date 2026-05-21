import { useState } from 'react';
import { FileWarning, Search, CheckCircle, Users } from 'lucide-react';

export default function MissingWork({ students, activeClassId, classes, scores, setScores, scoreColumns, readOnly }) {
  const [activeTab, setActiveTab] = useState('byAssignment');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [tempScores, setTempScores] = useState({});

  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  const classScoreColumns = scoreColumns.filter(c => c.classId === activeClassId && c.type !== 'exam'); // เฉพาะคะแนนเก็บ (งาน)

  // -- By Assignment View --
  const selectedAssignment = classScoreColumns.find(c => c.id === selectedAssignmentId);
  const studentsMissingSelectedAssignment = classStudents.filter(student => {
    if (!selectedAssignmentId) return false;
    const record = scores.find(s => s.studentId === student.id && s.columnId === selectedAssignmentId);
    return !record || record.score === '';
  });

  // -- By Student View --
  const selectedStudent = classStudents.find(s => s.id === selectedStudentId);
  const assignmentsMissingForStudent = classScoreColumns.filter(col => {
    if (!selectedStudentId) return false;
    const record = scores.find(s => s.studentId === selectedStudentId && s.columnId === col.id);
    return !record || record.score === '';
  });

  const handleScoreChange = (studentId, columnId, value) => {
    const numValue = value === '' ? '' : Number(value);
    const key = `${studentId}-${columnId}`;
    setTempScores(prev => ({ ...prev, [key]: numValue }));
  };

  const saveScore = (studentId, columnId) => {
    const key = `${studentId}-${columnId}`;
    const value = tempScores[key];
    
    if (value === undefined || value === '') return;

    const column = classScoreColumns.find(c => c.id === columnId);
    if (value > column.maxScore) {
      alert(`คะแนนต้องไม่เกิน ${column.maxScore}`);
      return;
    }
    if (value < 0) return;

    const existingIndex = scores.findIndex(s => s.studentId === studentId && s.columnId === columnId);
    
    let newScores = [...scores];
    if (existingIndex >= 0) {
      newScores[existingIndex] = { ...newScores[existingIndex], score: value };
    } else {
      newScores.push({
        // eslint-disable-next-line react-hooks/purity
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        studentId,
        columnId,
        score: value
      });
    }
    
    setScores(newScores);
    
    // Clear temp score
    const newTempScores = { ...tempScores };
    delete newTempScores[key];
    setTempScores(newTempScores);
  };

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">ติดตามงานค้าง</h2>
            <p className="page-subtitle">ตรวจสอบรายชื่อนักเรียนที่ยังไม่ส่งงานและกรอกคะแนนย้อนหลัง</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <FileWarning size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">ติดตามงานค้าง: {activeClass?.name}</h2>
          <p className="page-subtitle">แสดงเฉพาะช่อง "คะแนนเก็บ" ที่ยังว่างอยู่ (ไม่มีคะแนน)</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          className={`btn ${activeTab === 'byAssignment' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('byAssignment')}
          style={{ flex: 1, padding: '1rem' }}
        >
          <Search size={18} style={{ marginRight: '0.5rem' }} />
          ดูตามชิ้นงาน (ตรวจสอบทั้งห้อง)
        </button>
        <button 
          className={`btn ${activeTab === 'byStudent' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('byStudent')}
          style={{ flex: 1, padding: '1rem' }}
        >
          <Search size={18} style={{ marginRight: '0.5rem' }} />
          ดูตามรายบุคคล (ตรวจสอบทีละคน)
        </button>
      </div>

      {classScoreColumns.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#10b981' }} />
          <p>ยังไม่มีการสร้างช่องคะแนนเก็บในห้องนี้</p>
        </div>
      ) : activeTab === 'byAssignment' ? (
        // BY ASSIGNMENT VIEW
        <div className="card">
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">เลือกชิ้นงานที่ต้องการตรวจสอบ</label>
            <select 
              className="form-select"
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
            >
              <option value="">-- เลือกชิ้นงาน --</option>
              {classScoreColumns.map(col => (
                <option key={col.id} value={col.id}>{col.name} (เต็ม {col.maxScore})</option>
              ))}
            </select>
          </div>

          {selectedAssignmentId && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
                  รายชื่อผู้ที่ยังไม่ส่ง: {selectedAssignment?.name}
                </h3>
                <span className="badge badge-warning" style={{ fontSize: '0.9rem' }}>
                  ค้างส่ง {studentsMissingSelectedAssignment.length} คน
                </span>
              </div>
              
              {studentsMissingSelectedAssignment.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#10b981' }}>
                  <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ fontWeight: 600 }}>ยอดเยี่ยม! นักเรียนส่งงานชิ้นนี้ครบทุกคนแล้ว</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px', textAlign: 'center' }}>เลขที่</th>
                        <th>ชื่อ - นามสกุล</th>
                        <th style={{ width: '200px', textAlign: 'center' }}>กรอกคะแนน (เต็ม {selectedAssignment?.maxScore})</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>บันทึก</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsMissingSelectedAssignment.map(student => {
                        const key = `${student.id}-${selectedAssignmentId}`;
                        const val = tempScores[key] !== undefined ? tempScores[key] : '';
                        
                        return (
                          <tr key={student.id}>
                            <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>{student.number}</td>
                            <td style={{ fontWeight: 500 }}>{student.name}</td>
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="number"
                                min="0"
                                max={selectedAssignment?.maxScore}
                                value={val}
                                onChange={(e) => handleScoreChange(student.id, selectedAssignmentId, e.target.value)}
                                style={{ width: '80px', padding: '4px 8px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                                placeholder="-"
                                disabled={readOnly}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {!readOnly && (
                                <button 
                                  className="btn btn-primary" 
                                  style={{ padding: '4px 12px' }}
                                  disabled={val === ''}
                                  onClick={() => saveScore(student.id, selectedAssignmentId)}
                                >
                                  บันทึก
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // BY STUDENT VIEW
        <div className="card" style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ width: '300px', borderRight: '1px solid var(--border-color)', paddingRight: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-secondary)' }}>รายชื่อนักเรียน</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {classStudents.map(student => {
                // Pre-calculate missing count for badge
                const missingCount = classScoreColumns.filter(col => {
                  const record = scores.find(s => s.studentId === student.id && s.columnId === col.id);
                  return !record || record.score === '';
                }).length;

                return (
                  <button 
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem', 
                      background: selectedStudentId === student.id ? 'var(--primary-light)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: selectedStudentId === student.id ? 'var(--primary-color)' : 'inherit',
                      fontWeight: selectedStudentId === student.id ? 600 : 400
                    }}
                  >
                    <span>{student.number}. {student.name.split(' ')[0]}</span>
                    {missingCount > 0 && (
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{missingCount} งาน</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            {!selectedStudentId ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>คลิกเลือกชื่อนักเรียนทางด้านซ้ายเพื่อดูงานค้าง</p>
              </div>
            ) : (
              <div>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
                  งานที่ค้างส่ง: {selectedStudent?.name}
                </h3>

                {assignmentsMissingForStudent.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: '#10b981' }}>
                    <CheckCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p style={{ fontWeight: 600 }}>ยอดเยี่ยม! นักเรียนคนนี้ส่งงานครบทุกชิ้นแล้ว</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>ชิ้นงานที่ค้าง</th>
                          <th style={{ width: '150px', textAlign: 'center' }}>คะแนนเต็ม</th>
                          <th style={{ width: '150px', textAlign: 'center' }}>กรอกคะแนน</th>
                          <th style={{ width: '100px', textAlign: 'center' }}>บันทึก</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignmentsMissingForStudent.map(col => {
                          const key = `${selectedStudentId}-${col.id}`;
                          const val = tempScores[key] !== undefined ? tempScores[key] : '';

                          return (
                            <tr key={col.id}>
                              <td style={{ fontWeight: 500, color: 'var(--danger-color)' }}>
                                <FileWarning size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                                {col.name}
                              </td>
                              <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{col.maxScore}</td>
                              <td style={{ textAlign: 'center' }}>
                                <input 
                                  type="number"
                                  min="0"
                                  max={col.maxScore}
                                  value={val}
                                  onChange={(e) => handleScoreChange(selectedStudentId, col.id, e.target.value)}
                                  style={{ width: '80px', padding: '4px 8px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                                  placeholder="-"
                                  disabled={readOnly}
                                />
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {!readOnly && (
                                  <button 
                                    className="btn btn-primary" 
                                    style={{ padding: '4px 12px' }}
                                    disabled={val === ''}
                                    onClick={() => saveScore(selectedStudentId, col.id)}
                                  >
                                    บันทึก
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
