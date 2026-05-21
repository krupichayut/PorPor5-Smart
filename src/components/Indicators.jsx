import { useState } from 'react';
import { FileText, Plus, Trash2, ChevronDown, ChevronRight, Pencil } from 'lucide-react';

export default function Indicators({ activeClassId, classes, indicators, setIndicators, readOnly }) {
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [expandedUnits, setExpandedUnits] = useState({});

  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editingIndicatorId, setEditingIndicatorId] = useState(null);

  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitWeight, setNewUnitWeight] = useState(10);
  const [newUnitHours, setNewUnitHours] = useState(5);

  const [newIndicatorCode, setNewIndicatorCode] = useState('');
  const [newIndicatorDesc, setNewIndicatorDesc] = useState('');
  const [newIndicatorType, setNewIndicatorType] = useState('');

  const activeClass = classes.find(c => c.id === activeClassId);
  const classUnits = indicators.filter(i => i.classId === activeClassId);

  const toggleUnit = (unitId) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const handleAddUnit = (e) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;

    if (editingUnitId) {
      setIndicators(indicators.map(u => 
        u.id === editingUnitId ? { ...u, name: newUnitName, weight: Number(newUnitWeight), hours: Number(newUnitHours) } : u
      ));
    } else {
      const newUnit = {
        id: Date.now().toString(),
        classId: activeClassId,
        name: newUnitName,
        weight: Number(newUnitWeight),
        hours: Number(newUnitHours),
        items: []
      };
      setIndicators([...indicators, newUnit]);
      setExpandedUnits(prev => ({ ...prev, [newUnit.id]: true }));
    }

    setIsUnitModalOpen(false);
    setNewUnitName('');
    setNewUnitWeight(10);
    setNewUnitHours(5);
    setEditingUnitId(null);
  };

  const openAddUnitModal = () => {
    setEditingUnitId(null);
    setNewUnitName('');
    setNewUnitWeight(10);
    setNewUnitHours(5);
    setIsUnitModalOpen(true);
  };

  const openEditUnitModal = (unit) => {
    setEditingUnitId(unit.id);
    setNewUnitName(unit.name);
    setNewUnitWeight(unit.weight);
    setNewUnitHours(unit.hours);
    setIsUnitModalOpen(true);
  };

  const handleDeleteUnit = (unitId) => {
    if (confirm('แน่ใจหรือไม่ว่าต้องการลบหน่วยการเรียนรู้นี้? ตัวชี้วัดทั้งหมดในหน่วยนี้จะถูกลบไปด้วย')) {
      setIndicators(indicators.filter(u => u.id !== unitId));
    }
  };

  const openIndicatorModal = (unitId) => {
    setActiveUnitId(unitId);
    setEditingIndicatorId(null);
    setNewIndicatorCode('');
    setNewIndicatorDesc('');
    setNewIndicatorType('');
    setIsIndicatorModalOpen(true);
  };

  const openEditIndicatorModal = (unitId, indicator) => {
    setActiveUnitId(unitId);
    setEditingIndicatorId(indicator.id);
    setNewIndicatorCode(indicator.code);
    setNewIndicatorDesc(indicator.description);
    setNewIndicatorType(indicator.type || '');
    setIsIndicatorModalOpen(true);
  };

  const handleAddIndicator = (e) => {
    e.preventDefault();
    if (!newIndicatorCode.trim() || !newIndicatorDesc.trim() || !activeUnitId) return;

    const updatedIndicators = indicators.map(unit => {
      if (unit.id === activeUnitId) {
        if (editingIndicatorId) {
          return {
            ...unit,
            items: unit.items.map(item => 
              item.id === editingIndicatorId 
                ? { ...item, code: newIndicatorCode, description: newIndicatorDesc, type: newIndicatorType } 
                : item
            )
          };
        } else {
          return {
            ...unit,
            items: [
              ...unit.items,
              {
                id: Date.now().toString(),
                code: newIndicatorCode,
                description: newIndicatorDesc,
                type: newIndicatorType
              }
            ]
          };
        }
      }
      return unit;
    });

    setIndicators(updatedIndicators);
    setIsIndicatorModalOpen(false);
    setNewIndicatorCode('');
    setNewIndicatorDesc('');
    setNewIndicatorType('');
    setEditingIndicatorId(null);
  };

  const handleDeleteIndicator = (unitId, indicatorId) => {
    if (confirm('แน่ใจหรือไม่ว่าต้องการลบตัวชี้วัดนี้?')) {
      const updatedIndicators = indicators.map(unit => {
        if (unit.id === unitId) {
          return {
            ...unit,
            items: unit.items.filter(item => item.id !== indicatorId)
          };
        }
        return unit;
      });
      setIndicators(updatedIndicators);
    }
  };

  const totalWeight = classUnits.reduce((sum, u) => sum + u.weight, 0);
  const totalHours = classUnits.reduce((sum, u) => sum + u.hours, 0);

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">โครงสร้างรายวิชาและตัวชี้วัด</h2>
            <p className="page-subtitle">จัดการหน่วยการเรียนรู้และตัวชี้วัด/ผลการเรียนรู้</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">โครงสร้างวิชา: {activeClass?.subject}</h2>
          <p className="page-subtitle">ชั้น {activeClass?.name} • รวม {totalWeight} คะแนน • {totalHours} ชั่วโมง</p>
        </div>
        {!readOnly && (
          <button className="btn btn-primary" onClick={openAddUnitModal}>
            <Plus size={18} />
            เพิ่มหน่วยการเรียนรู้
          </button>
        )}
      </div>

      <div className="card">
        {classUnits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>ยังไม่มีข้อมูลโครงสร้างรายวิชา {!readOnly && 'กรุณากด "เพิ่มหน่วยการเรียนรู้"'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>หน่วยที่</th>
                  <th style={{ width: '25%' }}>ชื่อหน่วยการเรียนรู้</th>
                  <th>ตัวชี้วัด/ผลการเรียนรู้</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>เวลา (ชม.)</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>น้ำหนักคะแนน</th>
                  {!readOnly && <th style={{ width: '80px', textAlign: 'center' }}>จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {classUnits.map((unit, index) => (
                  <tr key={unit.id} style={{ verticalAlign: 'top' }}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', paddingTop: '1rem' }}>{index + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-color)', paddingTop: '1rem' }}>{unit.name}</td>
                    <td style={{ paddingTop: '1rem' }}>
                      {unit.items.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>- ยังไม่มีตัวชี้วัด -</div>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                          {unit.items.map(item => (
                            <li key={item.id} style={{ marginBottom: '0.5rem', lineHeight: '1.4' }}>
                              <strong style={{ color: 'var(--primary-color)' }}>{item.code}</strong> 
                              {item.type === 'between' && <span style={{ marginLeft: '6px', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>ระหว่างทาง</span>}
                              {item.type === 'end' && <span style={{ marginLeft: '6px', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>ปลายทาง</span>}
                              {' '}{item.description}
                              {!readOnly && (
                                <>
                                  <button 
                                    className="btn-icon" 
                                    style={{ display: 'inline-flex', padding: '0 4px', color: 'var(--primary-color)', opacity: 0.8, verticalAlign: 'middle', marginLeft: '8px' }} 
                                    onClick={() => openEditIndicatorModal(unit.id, item)}
                                    title="แก้ไขตัวชี้วัดนี้"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button 
                                    className="btn-icon" 
                                    style={{ display: 'inline-flex', padding: '0 4px', color: 'var(--danger-color)', opacity: 0.6, verticalAlign: 'middle' }} 
                                    onClick={() => handleDeleteIndicator(unit.id, item.id)}
                                    title="ลบตัวชี้วัดนี้"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {!readOnly && (
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openIndicatorModal(unit.id)}>
                          <Plus size={12} style={{ marginRight: '4px', display: 'inline' }} /> เพิ่มตัวชี้วัด
                        </button>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', paddingTop: '1rem' }}>{unit.hours}</td>
                    <td style={{ textAlign: 'center', paddingTop: '1rem' }}>{unit.weight}</td>
                    {!readOnly && (
                      <td style={{ textAlign: 'center', paddingTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button className="btn-icon" style={{ color: 'var(--primary-color)' }} onClick={() => openEditUnitModal(unit)} title="แก้ไขหน่วยการเรียนรู้นี้">
                          <Pencil size={16} />
                        </button>
                        <button className="btn-icon" style={{ color: 'var(--danger-color)' }} onClick={() => handleDeleteUnit(unit.id)} title="ลบหน่วยการเรียนรู้นี้">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', fontWeight: 'bold' }}>
                  <td colSpan={3} style={{ textAlign: 'right', paddingRight: '1rem' }}>รวมทั้งหมด:</td>
                  <td style={{ textAlign: 'center', color: 'var(--primary-color)' }}>{totalHours}</td>
                  <td style={{ textAlign: 'center', color: 'var(--primary-color)' }}>{totalWeight}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unit Modal */}
      {isUnitModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingUnitId ? 'แก้ไขหน่วยการเรียนรู้' : 'เพิ่มหน่วยการเรียนรู้'}</h3>
              <button className="btn-icon" onClick={() => setIsUnitModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddUnit}>
              <div className="form-group">
                <label className="form-label">ชื่อหน่วยการเรียนรู้ (เช่น จำนวนนับ, ระบบนิเวศ)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">น้ำหนักคะแนน (คะแนนเต็ม)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newUnitWeight}
                    onChange={(e) => setNewUnitWeight(e.target.value)}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">เวลาเรียน (ชั่วโมง)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={newUnitHours}
                    onChange={(e) => setNewUnitHours(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsUnitModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={!newUnitName.trim()}>{editingUnitId ? 'บันทึกการแก้ไข' : 'เพิ่มหน่วยฯ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Indicator Modal */}
      {isIndicatorModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingIndicatorId ? 'แก้ไขตัวชี้วัด / ผลการเรียนรู้' : 'เพิ่มตัวชี้วัด / ผลการเรียนรู้'}</h3>
              <button className="btn-icon" onClick={() => setIsIndicatorModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddIndicator}>
              <div className="form-group">
                <label className="form-label">รหัสตัวชี้วัด (เช่น ว 1.1 ป.5/1, ผลที่ 1)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newIndicatorCode}
                  onChange={(e) => setNewIndicatorCode(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">ประเภทตัวชี้วัด</label>
                <select 
                  className="form-select"
                  value={newIndicatorType}
                  onChange={(e) => setNewIndicatorType(e.target.value)}
                >
                  <option value="">-- ไม่ระบุ --</option>
                  <option value="between">ระหว่างทาง</option>
                  <option value="end">ปลายทาง</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">คำอธิบายตัวชี้วัด</label>
                <textarea 
                  className="form-input" 
                  value={newIndicatorDesc}
                  onChange={(e) => setNewIndicatorDesc(e.target.value)}
                  rows="3"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsIndicatorModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={!newIndicatorCode.trim() || !newIndicatorDesc.trim()}>{editingIndicatorId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
