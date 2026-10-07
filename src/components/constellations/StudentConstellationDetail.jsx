import React, { useState } from 'react';
import { X, Star, History, Sparkles, Gift } from 'lucide-react';
import { useRewards } from '../../hooks/useRewards';
import { redeemReward } from '../../services/rewards';

export default function StudentConstellationDetail({ student, data, onClose, classId }) {
  const { rewards, loading } = useRewards(classId);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState(null);

  const handleRedeem = async (reward) => {
    if (window.confirm(`ยืนยันการแลก "${reward.name}" โดยใช้ ${reward.constellationCost} กลุ่มดาว?`)) {
      setIsRedeeming(true);
      setError(null);
      const result = await redeemReward(student.id, classId, reward.id, data.availableConstellations);
      if (result.success) {
        alert("แลกของรางวัลสำเร็จ! ระบบสร้างรายการรอยืนยันแล้ว");
      } else {
        setError(result.error);
      }
      setIsRedeeming(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: 'var(--bg-surface-elevated)' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>เลขที่ {student.number}</div>
            <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
              {student.name} {student.nickname ? `(${student.nickname})` : ''}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', gap: '2rem' }}>
          
          {/* Left: Stats & History */}
          <div style={{ flex: 1 }}>
            <div style={{ backgroundColor: 'var(--bg-base)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>กลุ่มดาวพร้อมใช้ (Available)</div>
              <div style={{ fontSize: '3rem', color: 'var(--accent-cyan)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Sparkles size={32} /> {data.availableConstellations}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                ดาวที่กำลังสะสม: {data.partialStars} / 5
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={16} fill={i <= data.partialStars ? 'var(--accent-primary)' : 'none'} color={i <= data.partialStars ? 'var(--accent-primary)' : 'var(--border-subtle)'} />
                  ))}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} /> ประวัติดาวล่าสุด
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.history.slice(0, 10).map(event => (
                <div key={event.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-primary)' }}>
                  <Star size={16} fill="var(--accent-primary)" color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{event.reasonText}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {event.createdAt?.toDate ? event.createdAt.toDate().toLocaleDateString('th-TH') : ''}
                    </div>
                  </div>
                </div>
              ))}
              {data.history.length === 0 && <div style={{ color: 'var(--text-muted)' }}>ยังไม่ได้รับดาว</div>}
            </div>
          </div>

          {/* Right: Rewards Catalog */}
          <div style={{ flex: 1.2 }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Gift size={18} /> แลกของรางวัล
            </h3>
            
            {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {rewards.filter(r => r.isActive).map(reward => {
                const canAfford = data.availableConstellations >= reward.constellationCost;
                const inStock = reward.stock === null || reward.stock > 0;
                const canRedeem = canAfford && inStock;

                return (
                  <div key={reward.id} style={{ backgroundColor: 'var(--bg-base)', border: `1px solid ${canRedeem ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', opacity: inStock ? 1 : 0.6 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{reward.name}</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{reward.description}</div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <div style={{ color: 'var(--accent-cyan)', fontWeight: '600', fontSize: '0.9rem' }}>
                        ใช้ {reward.constellationCost} กลุ่มดาว
                      </div>
                      <button 
                        onClick={() => handleRedeem(reward)}
                        disabled={!canRedeem || isRedeeming}
                        className="btn" 
                        style={{ 
                          padding: '0.4rem 0.8rem', 
                          fontSize: '0.8rem',
                          backgroundColor: canRedeem ? 'var(--accent-cyan)' : 'var(--bg-surface-elevated)',
                          color: canRedeem ? 'var(--bg-sidebar)' : 'var(--text-muted)',
                          border: 'none',
                          cursor: canRedeem ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {!inStock ? 'ของหมด' : 'แลกรางวัล'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {rewards.filter(r => r.isActive).length === 0 && <div style={{ color: 'var(--text-muted)' }}>ยังไม่มีของรางวัลเปิดให้แลก</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
