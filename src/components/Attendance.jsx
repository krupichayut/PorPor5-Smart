import { useState, useMemo } from 'react';
import { Calendar, Plus, Check, X, Clock, FileText, Trash2, Star, Users, Download, Image as ImageIcon } from 'lucide-react';
import { downloadCsv } from '../utils/fileExports';
import html2canvas from 'html2canvas-pro';

export default function Attendance({ appSettings, students, activeClassId, classes, attendance, setAttendance, readOnly }) {
  const [newDate, setNewDate] = useState('');
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [autoTerm, setAutoTerm] = useState("term1");
  const [autoDays, setAutoDays] = useState({ 1: false, 2: false, 3: false, 4: false, 5: false });
  const [activeTab, setActiveTab] = useState('overall'); // 'overall', 'term1', 'term2', 'YYYY-MM'

  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  
  // Filter attendance records for current class
  const classAttendance = attendance.filter(a => a.classId === activeClassId);

  // Dynamic hours per check based on settings
  const hoursPerCheck = appSettings?.hoursPerCheck ? Number(appSettings.hoursPerCheck) : 2;

  // Get unique dates
  const dates = useMemo(() => [...new Set(classAttendance.map(a => a.date))].sort(), [classAttendance]);

  // Extract available months
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    dates.forEach(d => {
      const dateObj = new Date(d);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      monthsSet.add(monthKey);
    });
    return [...monthsSet].sort();
  }, [dates]);

  const getTermFromDate = (dateStr) => {
    if (appSettings) {
      if (appSettings.term1Start && appSettings.term1End) {
        if (dateStr >= appSettings.term1Start && dateStr <= appSettings.term1End) return 'term1';
      }
      if (appSettings.term2Start && appSettings.term2End) {
        if (dateStr >= appSettings.term2Start && dateStr <= appSettings.term2End) return 'term2';
      }
      
      // If setting exists but date doesn't fall in either, default to term2 or out of bounds
      // We will fallback to month-based if both are completely unset
      if (appSettings.term1Start || appSettings.term2Start) {
        return 'out_of_term';
      }
    }
    
    // Fallback if no settings
    const dateObj = new Date(dateStr);
    const m = dateObj.getMonth() + 1;
    if (m >= 5 && m <= 10) return 'term1';
    return 'term2';
  };

  const { filteredDates, stats, monthlyPercentages, daysPerMonth } = useMemo(() => {
    let activeDates = [];
    if (activeTab === 'overall') {
      activeDates = dates;
    } else if (activeTab === 'term1') {
      activeDates = dates.filter(d => getTermFromDate(d) === 'term1');
    } else if (activeTab === 'term2') {
      activeDates = dates.filter(d => getTermFromDate(d) === 'term2');
    } else {
      activeDates = dates.filter(d => d.startsWith(activeTab) && getTermFromDate(d) !== 'out_of_term');
    }

    const currentStats = {};
    const currentMonthly = {};

    classStudents.forEach(s => {
      currentStats[s.id] = { present: 0, leave: 0, absent: 0, late: 0, holiday: 0 };
      currentMonthly[s.id] = {};
      availableMonths.forEach(m => {
        currentMonthly[s.id][m] = { present: 0, leave: 0, absent: 0, late: 0, holiday: 0 };
      });
    });

    const dpm = {};
    availableMonths.forEach(m => {
       dpm[m] = dates.filter(d => d.startsWith(m) && getTermFromDate(d) !== 'out_of_term').length;
    });

    const recordMap = {};
    classAttendance.forEach(a => {
      recordMap[`${a.studentId}_${a.date}`] = a;
    });

    classStudents.forEach(s => {
      dates.forEach(date => {
        const record = recordMap[`${s.id}_${date}`];
        const status = record?.status || "present";
        
        const d = new Date(date);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (currentMonthly[s.id] && currentMonthly[s.id][mKey] && currentMonthly[s.id][mKey][status] !== undefined) {
          currentMonthly[s.id][mKey][status]++;
        }
      });
    });

    classStudents.forEach(s => {
      availableMonths.forEach(m => {
        const st = currentMonthly[s.id][m];
        const actual = st.present + st.late + st.holiday;
        const total = dpm[m];
        st.percentage = total > 0 ? Math.round((actual / total) * 100) : 0;
      });
    });

    classStudents.forEach(s => {
      activeDates.forEach(date => {
        const record = recordMap[`${s.id}_${date}`];
        const status = record?.status || "present";
        if (currentStats[s.id] && currentStats[s.id][status] !== undefined) {
          currentStats[s.id][status]++;
        }
      });
    });

    return { filteredDates: activeDates, stats: currentStats, monthlyPercentages: currentMonthly, daysPerMonth: dpm };
  }, [classAttendance, classStudents, activeTab, dates, availableMonths]);

  const getExpectedHours = (className, view) => {
    let base = 0;
    if (className) {
      const match = className.match(/ป\.([1-6])/);
      if (match) {
        const grade = parseInt(match[1], 10);
        base = (grade === 1 || grade === 2) ? 40 : 80;
      }
    }
    if (view === 'overall') return base;
    if (view === 'term1' || view === 'term2') return base / 2;
    return 0; 
  };
  
  const expectedHours = getExpectedHours(activeClass?.name, activeTab);
  // Default to 2 hours per check-in based on user request (1 week = 2 hours = 1 check-in)

  
  const displayTotal = activeTab.includes('-') ? filteredDates.length * hoursPerCheck : Math.max(expectedHours, filteredDates.length * hoursPerCheck);
  const required80 = Math.ceil(displayTotal * 0.8);

  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const formatMonthKey = (mKey) => {
    const [year, month] = mKey.split('-');
    const mIndex = parseInt(month, 10) - 1;
    return `${monthNames[mIndex]} ${parseInt(year, 10) + 543}`;
  };


  const handleToggleAutoDay = (day) => {
    setAutoDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleAutoGenerate = (e) => {
    e.preventDefault();
    if (readOnly) return;

    if (!appSettings) {
      alert("ไม่พบข้อมูลการตั้งค่าระบบ");
      return;
    }

    const startKey = autoTerm === "term1" ? "term1Start" : "term2Start";
    const endKey = autoTerm === "term1" ? "term1End" : "term2End";
    const startDateStr = appSettings[startKey];
    const endDateStr = appSettings[endKey];

    if (!startDateStr || !endDateStr) {
      alert("กรุณาไปกำหนด วันเปิด-ปิดภาคเรียน ในเมนู 'ตั้งค่าระบบ' (Settings) ก่อนใช้งานฟังก์ชันนี้ครับ");
      return;
    }

    const selectedDays = Object.keys(autoDays).filter(k => autoDays[k]).map(Number);
    if (selectedDays.length === 0) {
      alert("กรุณาเลือกวันในสัปดาห์ที่สอนอย่างน้อย 1 วัน");
      return;
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const newRecords = [];
    
    // Existing dates for this class to avoid duplicates
    const existingDates = new Set(classAttendance.map(a => a.date));

    let current = new Date(start);
    while (current <= end) {
      if (selectedDays.includes(current.getDay())) {
        const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
        
        if (!existingDates.has(dateStr)) {
          classStudents.forEach(s => {
            newRecords.push({
              id: `${activeClassId}-${s.id}-${dateStr}`,
              classId: activeClassId,
              studentId: s.id,
              date: dateStr,
              status: "present",
              note: ""
            });
          });
          existingDates.add(dateStr); // Prevent duplicates if logic triggers multiple times
        }
      }
      current.setDate(current.getDate() + 1);
    }

    if (newRecords.length === 0) {
      alert("ไม่มีวันที่เพิ่มใหม่ (อาจมีครบหมดแล้ว หรือไม่มีวันที่ตรงกับเงื่อนไขในช่วงเปิดเทอม)");
    } else {
      setAttendance([...attendance, ...newRecords]);
      setIsAutoModalOpen(false);
      // Let the global toast handle the success message!
    }
  };

  const handleClearNaN = () => {
    if (confirm("พบข้อมูลวันที่ผิดพลาด (NaN) ต้องการล้างข้อมูลเหล่านี้ทิ้งหรือไม่?")) {
      const validRecords = attendance.filter(a => !a.date.includes("NaN") && !a.date.includes("$"));
      setAttendance(validRecords);
      alert("ล้างข้อมูลผิดพลาดเรียบร้อยแล้วครับ! (ระบบจะบันทึกลงฐานข้อมูลอัตโนมัติ)");
    }
  };

  const handleAddDate = (e) => {
    e.preventDefault();
    if (!newDate) return;
    
    const newRecords = [...attendance];
    
    classStudents.forEach(student => {
      const exists = newRecords.find(r => r.studentId === student.id && r.date === newDate);
      if (!exists) {
        newRecords.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          classId: activeClassId,
          studentId: student.id,
          date: newDate,
          status: isHoliday ? 'holiday' : 'present', 
          note: isHoliday ? holidayName : ''
        });
      }
    });
    
    setAttendance(newRecords);
    setIsModalOpen(false);
    setNewDate('');
    setIsHoliday(false);
    setHolidayName('');
  };

  const handleExportCsv = () => {
    if (classStudents.length === 0) {
      alert("ไม่มีข้อมูลนักเรียน");
      return;
    }
    
    // Build columns
    const columns = [
      { key: "number", label: "เลขที่" },
      { key: "studentId", label: "รหัสประจำตัว" },
      { key: "name", label: "ชื่อ-นามสกุล" }
    ];
    
    if (isSummaryView) {
      if (activeTab === "overall") {
        availableMonths.forEach(m => columns.push({ key: m, label: formatMonthKey(m) }));
      }
    } else {
      filteredDates.forEach(d => {
        const dObj = new Date(d);
        columns.push({ key: d, label: `${dObj.getDate()} ${monthNames[dObj.getMonth()]}` });
      });
    }
    
    columns.push(
      { key: "total", label: "เต็ม(ชม.)" },
      { key: "present", label: "มา(ชม.)" },
      { key: "leave", label: "ลา(ชม.)" },
      { key: "absent", label: "ขาด(ชม.)" },
      { key: "late", label: "สาย(ชม.)" },
      { key: "percentage", label: "ร้อยละ" }
    );
    
    const rows = classStudents.map(s => {
      const counts = stats[s.id] || { present: 0, leave: 0, absent: 0, late: 0, holiday: 0 };
      const { present: p, leave: l, absent: a, late: lt, holiday: h } = counts;
      const actualAttended = (p + lt + h) * hoursPerCheck;
      const pct = displayTotal > 0 ? Math.round((actualAttended / displayTotal) * 100) : 0;
      
      const rowData = {
        number: s.number,
        studentId: s.studentId,
        name: s.name,
        total: displayTotal,
        present: (p + h) * hoursPerCheck,
        leave: l * hoursPerCheck,
        absent: a * hoursPerCheck,
        late: lt * hoursPerCheck,
        percentage: `${pct}%`
      };
      
      if (isSummaryView) {
        if (activeTab === "overall") {
          availableMonths.forEach(m => {
            const mPct = monthlyPercentages[s.id]?.[m]?.percentage || 0;
            rowData[m] = mPct > 0 ? `${mPct}%` : "-";
          });
        }
      } else {
        filteredDates.forEach(date => {
          const record = classAttendance.find(r => r.studentId === s.id && r.date === date);
          const st = record?.status || "present";
          const statusText = st === "present" ? "มา" : st === "absent" ? "ขาด" : st === "late" ? "สาย" : st === "leave" ? "ลา" : "หยุด";
          rowData[date] = statusText;
        });
      }
      return rowData;
    });
    
    downloadCsv(`attendance_${activeClass?.name || "class"}.csv`, rows, columns);
  };

  const handleExportImage = async () => {
    const tableEl = document.getElementById("attendance-table");
    if (!tableEl) return;
    
    try {
      const canvas = await html2canvas(tableEl, {
        backgroundColor: "#13151A",
        scale: 2,
        logging: false
      });
      const link = document.createElement("a");
      link.download = `attendance_${activeClass?.name || "class"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export image failed:", err);
      alert("เกิดข้อผิดพลาดในการสร้างรูปภาพ");
    }
  };

  const handleDeleteDate = (dateToDelete) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลการเช็คชื่อของวันที่ ${new Date(dateToDelete).toLocaleDateString('th-TH')}?`)) {
      setAttendance(attendance.filter(a => !(a.classId === activeClassId && a.date === dateToDelete)));
    }
  };

  const handleUpdateStatus = (studentId, date, status) => {
    if (readOnly) return;
    const updatedRecords = attendance.map(record => {
      if (record.studentId === studentId && record.date === date) {
        return { ...record, status };
      }
      return record;
    });
    setAttendance(updatedRecords);
  };

  const getStatusIcon = (record) => {
    const status = record?.status || 'present';
    const note = record?.note || '';
    
    switch(status) {
      case 'present': return <div className="badge badge-present"><Check size={14} style={{ marginRight: '4px' }}/> มา</div>;
      case 'absent': return <div className="badge badge-absent"><X size={14} style={{ marginRight: '4px' }}/> ขาด</div>;
      case 'late': return <div className="badge badge-late"><Clock size={14} style={{ marginRight: '4px' }}/> สาย</div>;
      case 'leave': return <div className="badge badge-leave"><FileText size={14} style={{ marginRight: '4px' }}/> ลา</div>;
      case 'holiday': return <div className="badge badge-holiday" title={note}><Star size={14} style={{ marginRight: '4px' }}/> วันหยุด</div>;
      default: return null;
    }
  };

  const cycleStatus = (currentStatus) => {
    const statuses = ['present', 'absent', 'late', 'leave', 'holiday'];
    const currentIndex = statuses.indexOf(currentStatus);
    return statuses[(currentIndex + 1) % statuses.length];
  };

  const isSummaryView = !activeTab.includes('-');

  if (!activeClassId) {
    return (
      <div className="animate-fade-in hairline-grid">
        <div className="page-header">
          <div>
            <h2 className="page-title">เช็คเวลาเรียน</h2>
            <p className="page-subtitle">บันทึกการ มา ขาด ลา สาย</p>
          </div>
        </div>
        <div className="empty-state">
          <Calendar size={48} className="empty-state-icon" />
          <h3>ไม่มีการเลือกห้องเรียน</h3>
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ด้านบนก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in hairline-grid">
      <div className="page-header">
        <div>
          <h2 className="page-title">เช็คเวลาเรียน: {activeClass?.name}</h2>
          <p className="page-subtitle">
            {!isSummaryView && 'คลิกที่สถานะในตารางเพื่อเปลี่ยน (มา → ขาด → สาย → ลา) '}
            {displayTotal > 0 && <span style={{ color: 'var(--accent-cyan)' }}>• เวลาเรียนเต็ม {displayTotal} ชั่วโมง (ต้องเรียนไม่น้อยกว่า {required80} ชั่วโมง) *นับคอลัมน์ละ 2 ชม.</span>}
          </p>
        </div>
        {!readOnly && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={handleExportImage} title="ส่งออกเป็นรูปภาพ">
              <ImageIcon size={18} />
              <span className="hide-mobile">รูปภาพ</span>
            </button>
            <button className="btn btn-outline" onClick={handleExportCsv} title="ส่งออก Excel">
              <Download size={18} />
              <span className="hide-mobile">Excel</span>
            </button>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              <span className="hide-mobile">เพิ่ม</span>
            </button>
            <button className="btn btn-primary" style={{ backgroundColor: "var(--accent-primary)", borderColor: "var(--accent-primary)" }} onClick={() => setIsAutoModalOpen(true)} title="สร้างวันที่อัตโนมัติ">
              <span style={{ fontSize: "1.1rem" }}>⚡</span>
              <span className="hide-mobile">สร้างอัตโนมัติ</span>
            </button>
            {dates.some(d => d.includes("NaN") || d.includes("$")) && (
              <button className="btn btn-primary" style={{ backgroundColor: "var(--danger-color)", borderColor: "var(--danger-color)" }} onClick={handleClearNaN}>
                🧹 ลบวัน Error
              </button>
            )}
          </div>
        )}
      </div>

      <div className="tabs-container studio-module-tabs" style={{ overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        <button className={`tab-btn ${activeTab === 'overall' ? 'active' : ''}`} onClick={() => setActiveTab('overall')} style={{ whiteSpace: 'nowrap' }}>
          สรุปรายปี
        </button>
        <button className={`tab-btn ${activeTab === 'term1' ? 'active' : ''}`} onClick={() => setActiveTab('term1')} style={{ whiteSpace: 'nowrap' }}>
          สรุปเทอม 1
        </button>
        <button className={`tab-btn ${activeTab === 'term2' ? 'active' : ''}`} onClick={() => setActiveTab('term2')} style={{ whiteSpace: 'nowrap' }}>
          สรุปเทอม 2
        </button>
        {availableMonths.map(m => (
          <button key={m} className={`tab-btn ${activeTab === m ? 'active' : ''}`} onClick={() => setActiveTab(m)} style={{ whiteSpace: 'nowrap' }}>
            {formatMonthKey(m)}
          </button>
        ))}
      </div>

      <div className="hairline-cell">
        {classStudents.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-state-icon" />
            <h3>ห้องเรียนยังว่างเปล่า</h3>
            <p>กรุณาเพิ่มรายชื่อนักเรียนก่อน จึงจะสามารถเช็คเวลาเรียนได้ครับ</p>
          </div>
        ) : filteredDates.length === 0 && !isSummaryView ? (
          <div className="empty-state">
            <Calendar size={48} className="empty-state-icon" />
            <h3>ยังไม่มีประวัติการเช็คชื่อในเดือนนี้</h3>
            <p>กรุณากดปุ่ม "เพิ่มวันเช็คชื่อ" เพื่อเริ่มต้น</p>
          </div>
        ) : dates.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} className="empty-state-icon" />
            <h3>เริ่มเช็คชื่อกันเลย!</h3>
            <p>กดปุ่ม "เพิ่มวันเช็คชื่อ" มุมขวาบนเพื่อเริ่มต้นบันทึกเวลาเรียนครับ</p>
          </div>
        ) : (
          <div id="attendance-table" className="data-table-container" style={{ backgroundColor: 'var(--bg-main)', padding: '10px', borderRadius: 'var(--radius-lg)' }}>
            <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: 'var(--bg-surface-elevated)', zIndex: 2, borderRight: '1px solid var(--border-subtle)' }}>เลขที่</th>
                  <th style={{ position: 'sticky', left: '50px', backgroundColor: 'var(--bg-surface-elevated)', zIndex: 2, minWidth: '160px', borderRight: '1px solid var(--border-subtle)' }}>ชื่อ - นามสกุล</th>
                  
                  {isSummaryView ? (
                    <>
                      {activeTab === 'overall' && availableMonths.map(m => (
                        <th key={`th-${m}`} style={{ textAlign: 'center', minWidth: '70px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{formatMonthKey(m)}</th>
                      ))}
                    </>
                  ) : (
                    filteredDates.map(date => {
                      const firstRecord = classAttendance.find(a => a.date === date && a.status === 'holiday');
                      const colNote = firstRecord?.note || '';
                      
                      return (
                        <th key={date} style={{ textAlign: 'center', minWidth: '85px', position: 'relative', borderLeft: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                            {colNote && (
                              <span 
                                onClick={() => alert(`วันหยุดพิเศษ: ${colNote}`)}
                                style={{ cursor: 'help', fontSize: '0.68rem', color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)', padding: '1px 4px', borderRadius: '4px', maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
                                title={colNote}
                              >
                                {colNote}
                              </span>
                            )}
                            {!readOnly && (
                              <button 
                                onClick={() => handleDeleteDate(date)}
                                className="btn-icon" style={{ color: 'var(--danger)', opacity: 0.6 }}
                                title="ลบวันที่นี้"
                                aria-label="ลบวันที่นี้"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </th>
                      );
                    })
                  )}
                  
                  <th style={{ textAlign: 'center', minWidth: '55px', backgroundColor: 'var(--bg-surface-elevated)', borderLeft: '1px solid var(--border-subtle)' }}>เต็ม(ชม.)</th>
                  <th style={{ textAlign: 'center', minWidth: '55px', backgroundColor: 'var(--bg-surface-elevated)' }}>มา(ชม.)</th>
                  <th style={{ textAlign: 'center', minWidth: '55px', backgroundColor: 'var(--bg-surface-elevated)' }}>ลา(ชม.)</th>
                  <th style={{ textAlign: 'center', minWidth: '55px', backgroundColor: 'var(--bg-surface-elevated)' }}>ขาด(ชม.)</th>
                  <th style={{ textAlign: 'center', minWidth: '55px', backgroundColor: 'var(--bg-surface-elevated)' }}>สาย(ชม.)</th>
                  <th style={{ textAlign: 'center', minWidth: '70px', backgroundColor: 'var(--bg-surface-elevated)', borderLeft: '1px solid var(--border-subtle)' }}>ร้อยละ %</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => {
                  const counts = stats[s.id] || { present: 0, leave: 0, absent: 0, late: 0, holiday: 0 };
                  const { present: presentCount, leave: leaveCount, absent: absentCount, late: lateCount, holiday: holidayCount } = counts;
                  
                  // In Thai schools, late and holidays are counted as present for the final attended count
                  const actualAttended = (presentCount + lateCount + holidayCount) * hoursPerCheck; 
                  const percentage = displayTotal > 0 ? Math.round((actualAttended / displayTotal) * 100) : 0;
                  
                  return (
                    <tr key={s.id} className={s.status === "transferred" ? "row-transferred" : ""}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', position: 'sticky', left: 0, backgroundColor: 'var(--bg-surface)', zIndex: 1, borderRight: '1px solid var(--border-subtle)' }}>{index + 1}</td>
                      <td style={{ fontWeight: 500, position: 'sticky', left: '50px', backgroundColor: 'var(--bg-surface)', zIndex: 1, borderRight: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>{s.name} {s.status === "transferred" && <span className="badge badge-transferred" style={{marginLeft: "0.5rem"}}>ย้ายออก</span>}</td>
                      
                      {isSummaryView ? (
                        <>
                          {activeTab === 'overall' && availableMonths.map(m => {
                            const pct = monthlyPercentages[s.id]?.[m]?.percentage || 0;
                            return (
                              <td key={`td-${m}`} style={{ textAlign: 'center', fontWeight: 600, color: pct < 80 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                                {pct > 0 ? `${pct}%` : '-'}
                              </td>
                            );
                          })}
                        </>
                      ) : (
                        filteredDates.map(date => {
                          const record = classAttendance.find(a => a.studentId === s.id && a.date === date);
                          return (
                            <td key={date} style={{ textAlign: 'center', padding: '0.25rem', borderLeft: '1px solid var(--border-subtle)' }}>
                              <button 
                                aria-label="เปลี่ยนสถานะ"
                                className="btn-icon"
                                onClick={() => handleUpdateStatus(s.id, date, cycleStatus(record?.status || 'present'))}
                                title="คลิกเพื่อเปลี่ยนสถานะ"
                                style={{ padding: '2px' }}
                              >
                                {getStatusIcon(record)}
                              </button>
                            </td>
                          );
                        })
                      )}

                      <td style={{ textAlign: 'center', fontWeight: 600, borderLeft: '1px solid var(--border-subtle)' }}>{displayTotal}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--success)' }} title={`มา ${(presentCount + holidayCount) * hoursPerCheck} ชม.`}>{(presentCount + holidayCount) * hoursPerCheck}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--info)' }}>{leaveCount * hoursPerCheck}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--danger)' }}>{absentCount * hoursPerCheck}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--warning)' }}>{lateCount * hoursPerCheck}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, borderLeft: '1px solid var(--border-subtle)', color: percentage < 80 ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {percentage}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
      {isAutoModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">⚡ สร้างวันที่มาเรียนอัตโนมัติ</h3>
              <button className="btn-icon" aria-label="ปิด" onClick={() => setIsAutoModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAutoGenerate}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">เลือกภาคเรียน</label>
                <select className="form-control" value={autoTerm} onChange={(e) => setAutoTerm(e.target.value)}>
                  <option value="term1">ภาคเรียนที่ 1</option>
                  <option value="term2">ภาคเรียนที่ 2</option>
                </select>
                <small style={{ color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                  ระบบจะอ้างอิงช่วงเวลาจาก "ตั้งค่าระบบ" (วันเปิด-ปิดเทอม)
                </small>
              </div>
              
              <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                <label className="form-label">เลือกวันที่สอนในสัปดาห์ (เลือกได้หลายวัน)</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {[
                    { val: 1, label: "จันทร์" },
                    { val: 2, label: "อังคาร" },
                    { val: 3, label: "พุธ" },
                    { val: 4, label: "พฤหัสฯ" },
                    { val: 5, label: "ศุกร์" },
                  ].map(day => (
                    <button 
                      key={day.val}
                      type="button"
                      onClick={() => handleToggleAutoDay(day.val)}
                      className={`btn ${autoDays[day.val] ? "btn-primary" : "btn-outline"}`}
                      style={{ flex: "1", minWidth: "60px", padding: "0.5rem" }}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsAutoModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: "var(--accent-primary)", borderColor: "var(--accent-primary)" }}>สร้างตารางทันที</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">เพิ่มวันเช็คชื่อ</h3>
              <button className="btn-icon" aria-label="ปิด" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddDate}>
              <div className="form-group">
                <label className="form-label">วันที่</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="isHoliday"
                    checked={isHoliday}
                    onChange={(e) => setIsHoliday(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isHoliday" style={{ margin: 0, cursor: 'pointer', fontWeight: 500 }}>
                    กำหนดให้เป็นวันหยุดพิเศษ (ทุกคนจะได้สถานะ "วันหยุด" และถือว่ามาเรียน)
                  </label>
                </div>
                
                {isHoliday && (
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="ระบุชื่อวันหยุด เช่น วันแม่แห่งชาติ, กีฬาสี" 
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    style={{ marginLeft: '26px', width: 'calc(100% - 26px)' }}
                    autoFocus
                  />
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={!newDate}>เพิ่มวันที่</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
