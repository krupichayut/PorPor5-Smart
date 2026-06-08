import { useState, useRef } from 'react';
import { Users, Plus, Trash2, Edit, Download, Upload, Search, Printer, FileText, Award, Calendar, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Students({ students, setStudents, activeClassId, classes, readOnly, attendance, scores, scoreColumns, attributes, literacy, competencies, indicators }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addMode, setAddMode] = useState('single');
  const [bulkData, setBulkData] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editNumber, setEditNumber] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [editName, setEditName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const fileInputRef = useRef(null);
  
  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  const filteredStudents = classStudents.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentStats = (studentId) => {
    let present = 0, absent = 0, late = 0, leave = 0;
    const studentAtt = attendance?.filter(a => a.studentId === studentId) || [];
    studentAtt.forEach(a => {
      if (a.status === 'present') present++;
      if (a.status === 'absent') absent++;
      if (a.status === 'late') late++;
      if (a.status === 'leave') leave++;
    });

    let missingWorkCount = 0;
    const classCols = scoreColumns?.filter(c => c.classId === activeClassId) || [];
    classCols.forEach(col => {
      const record = scores?.find(s => s.studentId === studentId && s.columnId === col.id);
      if (!record && col.type !== 'exam') {
        missingWorkCount++;
      }
    });

    const classUnits = indicators ? indicators.filter(i => i.classId === activeClassId) : [];
    let term1Collected = 0;
    let term2Collected = 0;
    
    classUnits.forEach(unit => {
      const unitCols = classCols.filter(c => c.unitId === unit.id && c.type === 'collected');
      const unitMaxRaw = unitCols.reduce((sum, col) => sum + col.maxScore, 0);
      const unitRaw = unitCols.reduce((sum, col) => {
        const s = scores?.find(s => s.studentId === studentId && s.columnId === col.id);
        return sum + (s ? s.score : 0);
      }, 0);
      const scaled = unitMaxRaw > 0 ? (unitRaw / unitMaxRaw) * unit.weight : 0;
      if (unit.term === '1') term1Collected += scaled;
      else if (unit.term === '2') term2Collected += scaled;
      else term1Collected += scaled; 
    });

    const getExamScaled = (type, weight) => {
      const cols = classCols.filter(c => c.type === type);
      const maxRaw = cols.reduce((sum, col) => sum + col.maxScore, 0);
      const raw = cols.reduce((sum, col) => {
        const s = scores?.find(s => s.studentId === studentId && s.columnId === col.id);
        return sum + (s ? s.score : 0);
      }, 0);
      return maxRaw > 0 ? (raw / maxRaw) * weight : 0;
    };

    const activeClassData = classes.find(c => c.id === activeClassId);
    const midtermWeight = activeClassData?.midtermWeight || 10;
    const finalWeight = activeClassData?.finalWeight || 10;

    const midtermScaled = getExamScaled('midterm', midtermWeight);
    const finalScaled = getExamScaled('final', finalWeight);

    const totalScore = Math.round(term1Collected + term2Collected + midtermScaled + finalScaled);
    const totalMax = classUnits.reduce((sum, u) => sum + u.weight, 0) + midtermWeight + finalWeight;

    return { present, absent, late, leave, totalScore, totalMax, missingWorkCount };
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!newStudentId.trim() || !newStudentName.trim() || !activeClassId) return;

    const newStudent = {
      id: Date.now().toString(),
      classId: activeClassId,
      studentId: newStudentId, // เลขประจำตัว
      name: newStudentName,
      number: classStudents.length + 1 // เลขที่รันตามลำดับที่เพิ่ม
    };

    setStudents([...students, newStudent]);
    setNewStudentId('');
    setNewStudentName('');
    setIsModalOpen(false);
  };

  const handleBulkAdd = (e) => {
    e.preventDefault();
    if (!bulkData.trim() || !activeClassId) return;

    const lines = bulkData.split('\n');
    let currentNumber = classStudents.length + 1;
    const newStudents = [];
    const timestamp = Date.now();

    lines.forEach((line, idx) => {
      // split by tab or multiple spaces
      const parts = line.split(/\t| {2,}/);
      if (parts.length >= 2) {
        const sid = parts[0].trim();
        const sname = parts[1].trim();
        if (sid && sname) {
          newStudents.push({
            id: `${timestamp}-${idx}`,
            classId: activeClassId,
            studentId: sid,
            name: sname,
            number: currentNumber++
          });
        }
      } else if (parts.length === 1 && parts[0].trim()) {
         const sname = parts[0].trim();
         newStudents.push({
            id: `${timestamp}-${idx}`,
            classId: activeClassId,
            studentId: `TMP${currentNumber}`,
            name: sname,
            number: currentNumber++
          });
      }
    });

    if (newStudents.length > 0) {
      setStudents([...students, ...newStudents]);
      setIsModalOpen(false);
      setBulkData('');
    } else {
      alert("ไม่พบข้อมูลที่ถูกต้อง กรุณาตรวจสอบรูปแบบ (รหัสประจำตัว [Tab] ชื่อ-นามสกุล)");
    }
  };

  const handleDeleteStudent = (id) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบนักเรียนคนนี้?')) {
      // Re-calculate numbers after deletion to keep them sequential if desired
      const newStudentsList = students.filter(s => s.id !== id);
      setStudents(newStudentsList);
    }
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setEditNumber(student.number);
    setEditStudentId(student.studentId);
    setEditName(student.name);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editStudentId.trim() || !editName.trim() || !editNumber) return;

    const updatedStudents = students.map(s => {
      if (s.id === editingStudent.id) {
        return {
          ...s,
          studentId: editStudentId,
          name: editName,
          number: Number(editNumber)
        };
      }
      return s;
    });

    setStudents(updatedStudents);
    setIsEditModalOpen(false);
    setEditingStudent(null);
  };

  const handleExportExcel = () => {
    if (classStudents.length === 0) {
      alert("ไม่มีข้อมูลนักเรียนให้ส่งออก");
      return;
    }
    const wsData = classStudents.map(s => ({
      'เลขที่': s.number,
      'รหัสประจำตัว': s.studentId,
      'ชื่อ - นามสกุล': s.name
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `รายชื่อนักเรียน_${activeClass?.name || 'ห้องเรียน'}.xlsx`);
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const rows = json.slice(1).filter(r => r.length > 0); // ข้ามแถว header
        let currentNumber = classStudents.length > 0 ? Math.max(...classStudents.map(s => s.number)) + 1 : 1;
        const newStudents = [];
        const timestamp = Date.now();

        rows.forEach((row, idx) => {
          const strRow = row.map(cell => cell ? String(cell).trim() : '');
          const validCells = strRow.filter(cell => cell.length > 0);
          
          let number, studentId, name;
          if (validCells.length >= 3) {
            number = parseInt(validCells[0], 10) || currentNumber++;
            studentId = validCells[1];
            name = validCells[2];
          } else if (validCells.length === 2) {
            number = currentNumber++;
            studentId = validCells[0];
            name = validCells[1];
          } else if (validCells.length === 1) {
            number = currentNumber++;
            studentId = `TMP${number}`;
            name = validCells[0];
          }

          if (name) {
            newStudents.push({
              id: `${timestamp}-${idx}`,
              classId: activeClassId,
              studentId,
              name,
              number
            });
          }
        });

        if (newStudents.length > 0) {
          setStudents([...students, ...newStudents]);
          alert(`นำเข้านักเรียนสำเร็จ ${newStudents.length} คน`);
        } else {
          alert("ไม่พบข้อมูลนักเรียนในไฟล์ Excel หรือรูปแบบไม่ถูกต้อง");
        }
      } catch (err) {
        console.error(err);
        alert("เกิดข้อผิดพลาดในการอ่านไฟล์ Excel");
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">จัดการนักเรียน</h2>
            <p className="page-subtitle">เพิ่ม แก้ไข ลบ รายชื่อนักเรียน</p>
          </div>
        </div>
        <div className="empty-state">
          <Users size={64} className="empty-state-icon" />
          <h3>ยังไม่ได้เลือกห้องเรียน</h3>
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> เพื่อจัดการรายชื่อนักเรียน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">จัดการนักเรียน: {activeClass?.name}</h2>
          <p className="page-subtitle">วิชา {activeClass?.subject} • จำนวนนักเรียน {classStudents.length} คน</p>
        </div>
        {!readOnly && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleImportExcel}
            />
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} title="นำเข้าข้อมูลนักเรียนจาก Excel">
              <Upload size={18} />
              <span className="hide-on-mobile">นำเข้า Excel</span>
            </button>
            <button className="btn btn-secondary" onClick={handleExportExcel} title="ส่งออกข้อมูลนักเรียนเป็น Excel">
              <Download size={18} />
              <span className="hide-on-mobile">ส่งออก Excel</span>
            </button>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              เพิ่มนักเรียน
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="ค้นหาชื่อ หรือ รหัสประจำตัว..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            แสดง {filteredStudents.length} จาก {classStudents.length} รายการ
          </div>
        </div>

        {classStudents.length === 0 ? (
          <div className="empty-state">
            <Users size={64} className="empty-state-icon" />
            <h3>ยังไม่มีรายชื่อนักเรียน</h3>
            <p>ห้องเรียนนี้ยังว่างเปล่า คุณสามารถเพิ่มรายชื่อนักเรียนทีละคน หรือนำเข้าจากไฟล์ Excel ได้เลย</p>
            {!readOnly && (
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setIsModalOpen(true)}>
                <Plus size={18} />
                เพิ่มนักเรียนคนแรก
              </button>
            )}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <Search size={48} className="empty-state-icon" style={{ opacity: 0.3 }} />
            <h3>ไม่พบผลการค้นหา</h3>
            <p>ไม่มีนักเรียนที่ตรงกับ "{searchTerm}" ลองค้นหาด้วยคำอื่นดูอีกครั้ง</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>เลขที่</th>
                  <th>รหัสประจำตัว</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th style={{ textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  // Generate random color class based on name characters
                  const charCode = s.name.charCodeAt(0) || 0;
                  const colorIndex = (charCode % 6) + 1;
                  const firstChar = s.name.replace(/^(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.)/i, '').trim().charAt(0) || s.name.charAt(0);
                  
                  return (
                  <tr key={s.id}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>{s.number}</td>
                    <td>{s.studentId}</td>
                    <td style={{ fontWeight: 500 }}>
                      <div 
                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'color 0.2s' }}
                        onClick={() => setSelectedStudentProfile(s)}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}
                        title="คลิกเพื่อดูรายงานรายบุคคล"
                      >
                        <span className={`avatar-circle c${colorIndex}`}>{firstChar}</span>
                        {s.name}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!readOnly && (
                        <>
                          <button className="btn-icon" onClick={() => handleEditClick(s)} style={{ color: 'var(--primary-color)', marginRight: '0.5rem' }}>
                            <Edit size={18} />
                          </button>
                          <button className="btn-icon" onClick={() => handleDeleteStudent(s.id)} style={{ color: 'var(--danger-color)' }}>
                            <Trash2 size={18} />
                          </button>
                        </>
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">เพิ่มรายชื่อนักเรียน</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <button 
                type="button"
                style={{ flex: 1, padding: '0.75rem', background: 'none', border: 'none', borderBottom: addMode === 'single' ? '2px solid var(--primary-color)' : '2px solid transparent', color: addMode === 'single' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: addMode === 'single' ? 600 : 400, cursor: 'pointer' }}
                onClick={() => setAddMode('single')}
              >
                เพิ่มทีละคน
              </button>
              <button 
                type="button"
                style={{ flex: 1, padding: '0.75rem', background: 'none', border: 'none', borderBottom: addMode === 'bulk' ? '2px solid var(--primary-color)' : '2px solid transparent', color: addMode === 'bulk' ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: addMode === 'bulk' ? 600 : 400, cursor: 'pointer' }}
                onClick={() => setAddMode('bulk')}
              >
                เพิ่มหลายคน (ก๊อปปี้จาก Excel)
              </button>
            </div>

            {addMode === 'single' ? (
              <form onSubmit={handleAddStudent}>
                <div className="form-group">
                  <label className="form-label">เลขประจำตัวนักเรียน</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    placeholder="เช่น 12345"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ชื่อ - นามสกุล</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="เช่น เด็กชายรักเรียน ขยันยิ่ง"
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary" disabled={!newStudentId.trim() || !newStudentName.trim()}>เพิ่มนักเรียน</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleBulkAdd}>
                <div className="form-group">
                  <label className="form-label">วางข้อมูลรายชื่อนักเรียน (ลากคลุมจาก Excel แล้ว Paste ลงที่นี่ได้เลย)</label>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    * รูปแบบ: <strong>รหัสประจำตัว</strong> [ช่องว่าง/Tab] <strong>ชื่อ-นามสกุล</strong> (ถ้ามีแต่ชื่อ ระบบจะสร้างรหัสชั่วคราวให้)
                  </div>
                  <textarea 
                    className="form-input" 
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder="12345    เด็กชายเอ รักเรียน&#10;12346    เด็กหญิงบี ขยัน"
                    rows="8"
                    autoFocus
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary" disabled={!bulkData.trim()}>เพิ่มรายชื่อทั้งหมด</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">แก้ไขข้อมูลนักเรียน</h3>
              <button className="btn-icon" onClick={() => setIsEditModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">เลขที่</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">รหัสประจำตัวนักเรียน</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editStudentId}
                  onChange={(e) => setEditStudentId(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">ชื่อ - นามสกุล</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกการแก้ไข</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStudentProfile && (
        <div className="modal-overlay">
          <div className="modal-content print-only-modal" style={{ maxWidth: '700px' }}>
            <div className="modal-header no-print">
              <h3 className="modal-title">รายงานผลรายบุคคล</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={() => window.print()}>
                  <Printer size={16} style={{ marginRight: '0.5rem' }} /> พิมพ์รายงาน
                </button>
                <button className="btn-icon" onClick={() => setSelectedStudentProfile(null)}>×</button>
              </div>
            </div>
            
            {(() => {
              const stats = getStudentStats(selectedStudentProfile.id);
              const charCode = selectedStudentProfile.name.charCodeAt(0) || 0;
              const colorIndex = (charCode % 6) + 1;
              const firstChar = selectedStudentProfile.name.replace(/^(เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.)/i, '').trim().charAt(0) || selectedStudentProfile.name.charAt(0);
              const attTotal = stats.present + stats.absent + stats.late + stats.leave;
              const attPercent = attTotal > 0 ? Math.round(((stats.present + stats.late) / attTotal) * 100) : 0;
              
              return (
                <div style={{ padding: '1rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                    <div className={`avatar-circle c${colorIndex}`} style={{ width: '80px', height: '80px', fontSize: '2.5rem', margin: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                      {firstChar}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{selectedStudentProfile.name}</div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        เลขที่ {selectedStudentProfile.number} • รหัสประจำตัว: {selectedStudentProfile.studentId} • ห้อง: {activeClass?.name}
                      </div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={18} /> สรุปผลการเรียน
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>คะแนนสะสม</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color)' }}>{stats.totalScore} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {stats.totalMax}</span></div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>งานที่ค้างส่ง</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.missingWorkCount > 0 ? '#ef4444' : '#10b981' }}>{stats.missingWorkCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>ชิ้น</span></div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>เวลาเรียน</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: attPercent >= 80 ? '#10b981' : '#f59e0b' }}>{attPercent}%</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={18} /> สถิติการมาเรียน
                      </h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                          <span style={{ color: '#10b981' }}>มาเรียนปกติ</span>
                          <span style={{ fontWeight: 600 }}>{stats.present} วัน</span>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                          <span style={{ color: '#f59e0b' }}>มาสาย</span>
                          <span style={{ fontWeight: 600 }}>{stats.late} วัน</span>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                          <span style={{ color: '#3b82f6' }}>ลาป่วย/ลากิจ</span>
                          <span style={{ fontWeight: 600 }}>{stats.leave} วัน</span>
                        </li>
                        <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
                          <span style={{ color: '#ef4444' }}>ขาดเรียน</span>
                          <span style={{ fontWeight: 600 }}>{stats.absent} วัน</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={18} /> สถานะการประเมิน 3 หมวด
                      </h4>
                      <div style={{ padding: '1rem', border: '1px dashed rgba(255, 255, 255, 0.2)', borderRadius: 'var(--radius-md)', textAlign: 'center', height: 'calc(100% - 2.5rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>การประเมินสามารถดูรายละเอียดเชิงลึก</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ได้ที่หน้ารายงาน PicthClass ฉบับสมบูรณ์</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-only-modal, .print-only-modal * { visibility: visible; }
          .print-only-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100% !important;
            box-shadow: none;
            border: none;
            background: white !important;
            color: black !important;
          }
          .print-only-modal * {
            color: black !important;
            border-color: #ccc !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
