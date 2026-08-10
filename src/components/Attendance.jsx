import { useState, useMemo } from 'react';
import { Calendar, Plus, Check, X, Clock, FileText, Trash2, Star, Users } from 'lucide-react';

export default function Attendance({ students, activeClassId, classes, attendance, setAttendance, readOnly }) {
  const [newDate, setNewDate] = useState('');
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overall'); // 'overall', 'term1', 'term2', 'YYYY-MM'

  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);
  
  // Filter attendance records for current class
  const classAttendance = attendance.filter(a => a.classId === activeClassId);

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
      activeDates = dates.filter(d => d.startsWith(activeTab));
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
       dpm[m] = dates.filter(d => d.startsWith(m)).length;
    });

    classAttendance.forEach(a => {
      if (currentMonthly[a.studentId]) {
        const d = new Date(a.date);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (currentMonthly[a.studentId][mKey] && currentMonthly[a.studentId][mKey][a.status] !== undefined) {
          currentMonthly[a.studentId][mKey][a.status]++;
        }
      }
    });

    classStudents.forEach(s => {
      availableMonths.forEach(m => {
        const st = currentMonthly[s.id][m];
        const actual = st.present + st.late + st.holiday;
        const total = dpm[m];
        st.percentage = total > 0 ? Math.round((actual / total) * 100) : 0;
      });
    });

    const activeDatesSet = new Set(activeDates);
    classAttendance.forEach(a => {
      if (activeDatesSet.has(a.date) && currentStats[a.studentId] && currentStats[a.studentId][a.status] !== undefined) {
        currentStats[a.studentId][a.status]++;
      }
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
  const displayTotal = activeTab.includes('-') ? filteredDates.length : Math.max(expectedHours, filteredDates.length);
  const required80 = Math.ceil(displayTotal * 0.8);

  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const formatMonthKey = (mKey) => {
    const [year, month] = mKey.split('-');
    const mIndex = parseInt(month, 10) - 1;
    return `${monthNames[mIndex]} ${parseInt(year, 10) + 543}`;
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
            {displayTotal > 0 && <span style={{ color: 'var(--accent-cyan)' }}>• เวลาเรียนเต็ม {displayTotal} คาบ (ต้องมาเรียนไม่น้อยกว่า {required80} คาบ)</span>}
          </p>
        </div>
        {!readOnly && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            เพิ่มวันเช็คชื่อ
          </button>
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
            <h3>ไม่พบข้อมูลนักเรียน</h3>
            <p>ยังไม่มีข้อมูลนักเรียนในห้องนี้ กรุณาเพิ่มนักเรียนก่อนทำการเช็คชื่อ</p>
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
            <h3>ยังไม่มีประวัติการเช็คชื่อ</h3>
            <p>กรุณากดปุ่ม "เพิ่มวันเช็คชื่อ" เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table" style={{ whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center', position: 'sticky', left: 0, backgroundColor: 'var(--bg-tertiary)', zIndex: 2 }}>เลขที่</th>
                  <th style={{ position: 'sticky', left: '60px', backgroundColor: 'var(--bg-tertiary)', zIndex: 2, minWidth: '150px' }}>ชื่อ - นามสกุล</th>
                  
                  {isSummaryView ? (
                    <>
                      {activeTab === 'overall' && availableMonths.map(m => (
                        <th key={`th-${m}`} style={{ textAlign: 'center', minWidth: '70px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatMonthKey(m)}</th>
                      ))}
                    </>
                  ) : (
                    filteredDates.map(date => {
                      const firstRecord = classAttendance.find(a => a.date === date && a.status === 'holiday');
                      const colNote = firstRecord?.note || '';
                      
                      return (
                        <th key={date} style={{ textAlign: 'center', minWidth: '100px', position: 'relative' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <span>{new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                            {colNote && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--badge-holiday-text)', backgroundColor: 'var(--badge-holiday-bg)', padding: '2px 4px', borderRadius: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={colNote}>
                                {colNote}
                              </span>
                            )}
                            {!readOnly && (
                              <button 
                                onClick={() => handleDeleteDate(date)}
                                className="btn-icon" style={{ color: 'var(--danger)' }}
                                title="ลบวันที่นี้"
                                aria-label="ลบวันที่นี้"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </th>
                      );
                    })
                  )}
                  
                  <th style={{ textAlign: 'center', minWidth: '60px', backgroundColor: 'var(--bg-tertiary)' }}>เต็ม</th>
                  <th style={{ textAlign: 'center', minWidth: '60px', backgroundColor: 'var(--bg-tertiary)' }}>มา</th>
                  <th style={{ textAlign: 'center', minWidth: '60px', backgroundColor: 'var(--bg-tertiary)' }}>ลา</th>
                  <th style={{ textAlign: 'center', minWidth: '60px', backgroundColor: 'var(--bg-tertiary)' }}>ขาด</th>
                  <th style={{ textAlign: 'center', minWidth: '60px', backgroundColor: 'var(--bg-tertiary)' }}>สาย</th>
                  <th style={{ textAlign: 'center', minWidth: '80px', backgroundColor: 'var(--bg-tertiary)' }}>ร้อยละ %</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, index) => {
                  const counts = stats[s.id] || { present: 0, leave: 0, absent: 0, late: 0, holiday: 0 };
                  const { present: presentCount, leave: leaveCount, absent: absentCount, late: lateCount, holiday: holidayCount } = counts;
                  
                  // In Thai schools, late and holidays are counted as present for the final attended count
                  const actualAttended = presentCount + lateCount + holidayCount; 
                  const percentage = displayTotal > 0 ? Math.round((actualAttended / displayTotal) * 100) : 0;
                  
                  return (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', position: 'sticky', left: 0, backgroundColor: 'var(--bg-base)', zIndex: 1, borderRight: '1px solid var(--border-color)' }}>{index + 1}</td>
                      <td style={{ fontWeight: 500, position: 'sticky', left: '60px', backgroundColor: 'var(--bg-base)', zIndex: 1, borderRight: '1px solid var(--border-color)' }}>{s.name}</td>
                      
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
                            <td key={date} style={{ textAlign: 'center', padding: '0.25rem' }}>
                              <button 
                                aria-label="เปลี่ยนสถานะ"
                                className="btn-icon"
                                onClick={() => handleUpdateStatus(s.id, date, cycleStatus(record?.status || 'present'))}
                                title="คลิกเพื่อเปลี่ยนสถานะ"
                              >
                                {getStatusIcon(record)}
                              </button>
                            </td>
                          );
                        })
                      )}

                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{displayTotal}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--success)' }} title={`มา ${presentCount} วัน, วันหยุด ${holidayCount} วัน`}>{presentCount + holidayCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#3b82f6' }}>{leaveCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--danger)' }}>{absentCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--warning)' }}>{lateCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: percentage < 80 ? 'var(--danger)' : 'var(--accent-cyan)' }}>
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
