import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Package } from 'lucide-react';
import { useRewards, useRedemptions } from '../../hooks/useRewards';
import { addReward, updateReward, updateRedemptionStatus } from '../../services/rewards';

export default function RewardManager({ activeClassId, classes, students }) {
  const { rewards, loading: rewardsLoading } = useRewards(activeClassId);
  const { redemptions, loading: redemptionsLoading } = useRedemptions(activeClassId);
  
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' or 'redemptions'
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState(null);
  
  const [rewardForm, setRewardForm] = useState({ 
    name: '', 
    description: '',
    constellationCost: 1, 
    stock: 10,
    isActive: true 
  });

  const activeClass = classes.find(c => c.id === activeClassId);

  if (!activeClassId) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>กรุณาเลือกห้องเรียน</div>;
  }

  // --- Handlers ---
  const handleOpenModal = (reward = null) => {
    if (reward) {
      setEditingRewardId(reward.id);
      setRewardForm({
        name: reward.name,
        description: reward.description || '',
        constellationCost: reward.constellationCost,
        stock: reward.stock !== null ? reward.stock : '',
        isActive: reward.isActive
      });
    } else {
      setEditingRewardId(null);
      setRewardForm({ name: '', description: '', constellationCost: 1, stock: 10, isActive: true });
    }
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = async (e) => {
    e.preventDefault();
    const dataToSave = {
      ...rewardForm,
      classId: activeClassId,
      stock: rewardForm.stock === '' ? null : Number(rewardForm.stock)
    };

    if (editingRewardId) {
      await updateReward(editingRewardId, dataToSave);
    } else {
      await addReward(dataToSave);
    }
    setIsRewardModalOpen(false);
  };

  const handleRedemptionStatus = async (redemptionId, newStatus, rewardId = null) => {
    await updateRedemptionStatus(redemptionId, newStatus, rewardId);
  };

  // --- UI ---
  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '2rem 3rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
            ร้านของรางวัล
          </h2>
          <div style={{ color: 'var(--text-muted)' }}>
            ห้อง {activeClass?.name}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <button 
            onClick={() => setActiveTab('catalog')}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              border: 'none', 
              background: activeTab === 'catalog' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'catalog' ? 'var(--bg-sidebar)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: activeTab === 'catalog' ? '600' : '400'
            }}
          >
            แคตตาล็อกรางวัล
          </button>
          <button 
            onClick={() => setActiveTab('redemptions')}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              border: 'none', 
              background: activeTab === 'redemptions' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'redemptions' ? 'var(--bg-sidebar)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: activeTab === 'redemptions' ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            รายการขอแลก
            {redemptions.filter(r => r.status === 'pending').length > 0 && (
              <span style={{ background: 'var(--danger-color)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.75rem' }}>
                {redemptions.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
        {activeTab === 'catalog' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
              <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} /> เพิ่มของรางวัล
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {rewards.map(reward => (
                <div key={reward.id} style={{ 
                  backgroundColor: 'var(--bg-surface)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '1.5rem',
                  opacity: reward.isActive ? 1 : 0.6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{reward.name}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleOpenModal(reward)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', minHeight: '2.7rem' }}>
                    {reward.description || 'ไม่มีคำอธิบาย'}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                    <div style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
                      {reward.constellationCost} กลุ่มดาว
                    </div>
                    <div style={{ color: reward.stock <= 0 ? 'var(--danger-color)' : 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Package size={14} /> {reward.stock !== null ? \`เหลือ \${reward.stock} ชิ้น\` : 'ไม่จำกัด'}
                    </div>
                  </div>
                </div>
              ))}
              
              {rewards.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  ยังไม่มีของรางวัลในระบบ
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>นักเรียน</th>
                  <th>ของรางวัล</th>
                  <th>กลุ่มดาวที่ใช้</th>
                  <th>สถานะ</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map(r => {
                  const student = students.find(s => s.id === r.studentId);
                  const date = r.requestedAt?.toDate ? r.requestedAt.toDate().toLocaleDateString('th-TH') : 'กำลังโหลด...';
                  
                  let statusBadge;
                  if (r.status === 'pending') statusBadge = <span style={{ color: 'var(--accent-primary)' }}>รอยืนยัน</span>;
                  else if (r.status === 'approved') statusBadge = <span style={{ color: 'var(--success-color)' }}>ยืนยันแล้ว</span>;
                  else if (r.status === 'received') statusBadge = <span style={{ color: 'var(--text-muted)' }}>รับของแล้ว</span>;
                  else if (r.status === 'cancelled') statusBadge = <span style={{ color: 'var(--danger-color)' }}>ยกเลิก</span>;
                  
                  return (
                    <tr key={r.id}>
                      <td>{date}</td>
                      <td>{student?.name || 'ไม่ทราบชื่อ'}</td>
                      <td>{r.rewardNameSnapshot}</td>
                      <td>{r.constellationCost}</td>
                      <td>{statusBadge}</td>
                      <td>
                        {r.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleRedemptionStatus(r.id, 'approved')} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>ยืนยัน</button>
                            <button onClick={() => handleRedemptionStatus(r.id, 'cancelled', r.rewardId)} className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'transparent', border: '1px solid var(--danger-color)', color: 'var(--danger-color)' }}>ยกเลิก</button>
                          </div>
                        )}
                        {r.status === 'approved' && (
                          <button onClick={() => handleRedemptionStatus(r.id, 'received')} className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>มาร์คว่ารับของแล้ว</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                
                {redemptions.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>ไม่มีรายการแลกรางวัล</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isRewardModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>{editingRewardId ? 'แก้ไขของรางวัล' : 'เพิ่มของรางวัลใหม่'}</h3>
            <form onSubmit={handleSaveReward}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>ชื่อรางวัล</label>
                <input type="text" className="form-control" style={{ width: '100%' }} value={rewardForm.name} onChange={e => setRewardForm({...rewardForm, name: e.target.value})} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>รายละเอียด</label>
                <input type="text" className="form-control" style={{ width: '100%' }} value={rewardForm.description} onChange={e => setRewardForm({...rewardForm, description: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>ใช้กลุ่มดาว (จำนวน)</label>
                  <input type="number" min="1" className="form-control" style={{ width: '100%' }} value={rewardForm.constellationCost} onChange={e => setRewardForm({...rewardForm, constellationCost: Number(e.target.value)})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>สต็อก (เว้นว่างถ้าไม่จำกัด)</label>
                  <input type="number" min="0" className="form-control" style={{ width: '100%' }} value={rewardForm.stock} onChange={e => setRewardForm({...rewardForm, stock: e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <input type="checkbox" checked={rewardForm.isActive} onChange={e => setRewardForm({...rewardForm, isActive: e.target.checked})} />
                  เปิดให้แลกได้
                </label>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn" onClick={() => setIsRewardModalOpen(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
