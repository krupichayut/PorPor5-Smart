import { useState } from 'react';
import { Gift, Plus, Edit2, Trash2, CheckCircle, Paintbrush } from 'lucide-react';

export default function Rewards({ students, activeClassId, classes, studentPoints, setStudentPoints, rewards, setRewards, readOnly }) {
  const [activeTab, setActiveTab] = useState('points'); // 'points' or 'catalog'
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState(null);
  const [rewardForm, setRewardForm] = useState({ name: '', points: 10, icon: '🎨' });
  
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemReward, setRedeemReward] = useState(null);
  const [redeemStudentId, setRedeemStudentId] = useState('');
  
  const [notification, setNotification] = useState('');

  const activeClass = classes.find(c => c.id === activeClassId);
  const classStudents = students.filter(s => s.classId === activeClassId).sort((a, b) => a.number - b.number);

  // --- Points Management ---
  const getStudentPoints = (studentId) => {
    const record = studentPoints.find(sp => sp.studentId === studentId);
    return record ? record.points : 0;
  };

  const updatePoints = (studentId, amount) => {
    if (readOnly) return;
    
    const currentPoints = getStudentPoints(studentId);
    let newPoints = currentPoints + amount;
    if (newPoints < 0) newPoints = 0; // Prevent negative points
    
    const existingIndex = studentPoints.findIndex(sp => sp.studentId === studentId);
    let newStudentPoints = [...studentPoints];
    
    if (existingIndex >= 0) {
      newStudentPoints[existingIndex] = { ...newStudentPoints[existingIndex], points: newPoints };
    } else {
      newStudentPoints.push({
        // eslint-disable-next-line react-hooks/purity
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        studentId,
        points: newPoints
      });
    }
    
    setStudentPoints(newStudentPoints);
  };

  // --- Reward Catalog Management ---
  const handleOpenRewardModal = (reward = null) => {
    if (reward) {
      setEditingRewardId(reward.id);
      setRewardForm({ name: reward.name, points: reward.points, icon: reward.icon });
    } else {
      setEditingRewardId(null);
      setRewardForm({ name: '', points: 10, icon: '🎨' });
    }
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!rewardForm.name.trim() || rewardForm.points <= 0) return;

    if (editingRewardId) {
      setRewards(rewards.map(r => 
        r.id === editingRewardId 
          ? { ...r, ...rewardForm, points: Number(rewardForm.points) }
          : r
      ));
    } else {
      setRewards([...rewards, {
        id: Date.now().toString(),
        ...rewardForm,
        points: Number(rewardForm.points)
      }]);
    }
    setIsRewardModalOpen(false);
  };

  const handleDeleteReward = (id) => {
    if (readOnly) return;
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบของรางวัลนี้?')) {
      setRewards(rewards.filter(r => r.id !== id));
    }
  };

  // --- Redemption Process ---
  const handleOpenRedeemModal = (reward) => {
    setRedeemReward(reward);
    setRedeemStudentId('');
    setIsRedeemModalOpen(true);
  };

  const handleRedeem = (e) => {
    e.preventDefault();
    if (readOnly || !redeemStudentId || !redeemReward) return;

    const currentPoints = getStudentPoints(redeemStudentId);
    if (currentPoints < redeemReward.points) {
      alert('แต้มไม่เพียงพอสำหรับการแลกของรางวัลนี้');
      return;
    }

    // Deduct points
    updatePoints(redeemStudentId, -redeemReward.points);
    
    // Show success
    const student = students.find(s => s.id === redeemStudentId);
    setNotification(`แลก ${redeemReward.name} ให้กับ ${student.name} สำเร็จ!`);
    setTimeout(() => setNotification(''), 3000);
    
    setIsRedeemModalOpen(false);
  };

  if (!activeClassId) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h2 className="page-title">สะสมแต้มและของรางวัล</h2>
            <p className="page-subtitle">จัดการแต้มความประพฤติและแลกของรางวัลอุปกรณ์ศิลปะ</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <Paintbrush size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>กรุณาเลือกห้องเรียนจากเมนู <strong>ห้องเรียน / วิชา</strong> ก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">สะสมแต้ม: {activeClass?.name}</h2>
          <p className="page-subtitle">จัดการแต้มความประพฤติและแลกของรางวัล</p>
        </div>
        {notification && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
            <CheckCircle size={18} /> {notification}
          </div>
        )}
      </div>

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'points' ? 'active' : ''}`}
          onClick={() => setActiveTab('points')}
        >
          <Paintbrush size={16} style={{ display: 'inline', marginRight: '6px' }} /> แจกแต้ม
        </button>
        <button 
          className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <Gift size={16} style={{ display: 'inline', marginRight: '6px' }} /> คลังของรางวัล
        </button>
      </div>

      {activeTab === 'points' && (
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
                    <th style={{ width: '60px', textAlign: 'center' }}>เลขที่</th>
                    <th>ชื่อ - นามสกุล</th>
                    <th style={{ textAlign: 'center', color: '#fbbf24' }}>แต้มสะสมปัจจุบัน</th>
                    <th style={{ textAlign: 'center' }}>จัดการแต้ม</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((s, index) => {
                    const points = getStudentPoints(s.id);
                    return (
                      <tr key={s.id}>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>{index + 1}</td>
                        <td style={{ fontWeight: 500 }}>{s.name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', color: '#fbbf24', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            <Paintbrush size={16} fill="currentColor" /> {points}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {!readOnly && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                              <button 
                                className="btn-icon" 
                                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                                onClick={() => updatePoints(s.id, 1)}
                                title="เพิ่ม 1 แต้ม"
                              >
                                +1
                              </button>
                              <button 
                                className="btn-icon" 
                                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                                onClick={() => updatePoints(s.id, 5)}
                                title="เพิ่ม 5 แต้ม"
                              >
                                +5
                              </button>
                              <button 
                                className="btn-icon" 
                                style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                onClick={() => updatePoints(s.id, -1)}
                                title="ลด 1 แต้ม"
                                disabled={points <= 0}
                              >
                                -1
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'catalog' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            {!readOnly && (
              <button className="btn btn-primary" onClick={() => handleOpenRewardModal()}>
                <Plus size={18} />
                เพิ่มของรางวัล
              </button>
            )}
          </div>
          
          {rewards.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <Gift size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>ยังไม่มีรายการของรางวัล กรุณาเพิ่มของรางวัล</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {rewards.map(reward => (
                <div key={reward.id} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem', position: 'relative' }}>
                  {!readOnly && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.25rem' }}>
                      <button className="btn-icon" style={{ padding: '4px' }} onClick={() => handleOpenRewardModal(reward)}><Edit2 size={14} /></button>
                      <button className="btn-icon" style={{ padding: '4px', color: 'var(--danger-color)' }} onClick={() => handleDeleteReward(reward.id)}><Trash2 size={14} /></button>
                    </div>
                  )}
                  
                  <div style={{ fontSize: '4rem', marginBottom: '1rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
                    {reward.icon}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', textAlign: 'center' }}>{reward.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                    <Paintbrush fill="currentColor" size={18} /> {reward.points} แต้ม
                  </div>
                  
                  {!readOnly && (
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                      onClick={() => handleOpenRedeemModal(reward)}
                    >
                      แลกรางวัลให้นักเรียน
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Reward Modal */}
      {isRewardModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingRewardId ? 'แก้ไขของรางวัล' : 'เพิ่มของรางวัลใหม่'}</h3>
              <button className="btn-icon" onClick={() => setIsRewardModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveReward}>
              <div className="form-group">
                <label className="form-label">ชื่อของรางวัล (เช่น สีไม้, สีน้ำ, สมุดวาดรูป)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({...rewardForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">แต้มที่ใช้แลก (Points)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={rewardForm.points}
                  onChange={(e) => setRewardForm({...rewardForm, points: Number(e.target.value)})}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">ไอคอน (Emoji)</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {['🎨', '🖌️', '🖍️', '✏️', '📝', '📒', '🎁', '🏆', '🧸'].map(emoji => (
                    <button 
                      key={emoji}
                      type="button"
                      onClick={() => setRewardForm({...rewardForm, icon: emoji})}
                      style={{ 
                        fontSize: '1.5rem', 
                        padding: '0.5rem', 
                        background: rewardForm.icon === emoji ? 'var(--primary-light)' : 'transparent',
                        border: `1px solid ${rewardForm.icon === emoji ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  className="form-input" 
                  value={rewardForm.icon}
                  onChange={(e) => setRewardForm({...rewardForm, icon: e.target.value})}
                  placeholder="หรือพิมพ์ Emoji อื่นๆ"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRewardModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redeem Reward Modal */}
      {isRedeemModalOpen && redeemReward && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">ยืนยันการแลกรางวัล</h3>
              <button className="btn-icon" onClick={() => setIsRedeemModalOpen(false)}>×</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem' }}>{redeemReward.icon}</div>
              <div>
                <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{redeemReward.name}</h4>
                <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>ใช้ {redeemReward.points} แต้ม</div>
              </div>
            </div>
            
            <form onSubmit={handleRedeem}>
              <div className="form-group">
                <label className="form-label">เลือกนักเรียนที่ต้องการแลกรางวัล</label>
                <select 
                  className="form-select" 
                  value={redeemStudentId}
                  onChange={(e) => setRedeemStudentId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- กรุณาเลือกนักเรียน --</option>
                  {classStudents.map(s => {
                    const pts = getStudentPoints(s.id);
                    const canRedeem = pts >= redeemReward.points;
                    return (
                      <option key={s.id} value={s.id} disabled={!canRedeem}>
                        {s.number}. {s.name} (มี {pts} แต้ม) {canRedeem ? '✅' : '❌ ไม่พอ'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRedeemModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={!redeemStudentId}>ยืนยันการหักแต้ม</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
