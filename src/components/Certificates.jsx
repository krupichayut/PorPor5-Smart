import React, { useState, useRef, useMemo } from 'react';
import { Award, Plus, Trash2, Pencil, ExternalLink, X, Maximize2, Search, Filter, Image as ImageIcon } from 'lucide-react';

export default function Certificates({ certificates, setCertificates, classes, appSettings, readOnly }) {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'teacher'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Filters
  const [filterYear, setFilterYear] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [classId, setClassId] = useState('');
  const [organization, setOrganization] = useState('');
  const [awardLevel, setAwardLevel] = useState('gold');
  const [dateReceived, setDateReceived] = useState('');
  const [academicYear, setAcademicYear] = useState(appSettings?.academicYear || '');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState(null);

  const filteredCertificates = useMemo(() => {
    return (certificates || []).filter(c => {
      if (c.ownerType !== activeTab) return false;
      if (filterYear !== 'all' && c.academicYear !== filterYear) return false;
      if (filterLevel !== 'all' && c.awardLevel !== filterLevel) return false;
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const t = (c.title || '').toLowerCase();
        const r = (c.recipientName || '').toLowerCase();
        if (!t.includes(q) && !r.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.dateReceived || 0) - new Date(a.dateReceived || 0));
  }, [certificates, activeTab, filterYear, filterLevel, searchQuery]);

  const uniqueYears = useMemo(() => {
    const years = new Set((certificates || []).map(c => c.academicYear).filter(Boolean));
    if (appSettings?.academicYear) years.add(appSettings.academicYear);
    return Array.from(years).sort().reverse();
  }, [certificates, appSettings]);

  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', '106580ebef11da51048e4ec5959fe9d1');
    
    const response = await fetch(`https://api.imgbb.com/1/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    }
    throw new Error(data.error?.message || 'Upload failed');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้นครับ');
      return;
    }

    if (file.size > 32 * 1024 * 1024) {
      alert('ขนาดไฟล์ภาพใหญ่เกิน 32MB');
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadToImgBB(file);
      setImageUrl(url);
    } catch (error) {
      console.error('Upload Error:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + error.message);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setRecipientName(activeTab === 'teacher' ? (appSettings?.teacherName || '') : '');
    setClassId('');
    setOrganization('');
    setAwardLevel('gold');
    setDateReceived(new Date().toISOString().split('T')[0]);
    setAcademicYear(appSettings?.academicYear || '');
    setDescription('');
    setImageUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (cert) => {
    setEditingId(cert.id);
    setTitle(cert.title || '');
    setRecipientName(cert.recipientName || '');
    setClassId(cert.classId || '');
    setOrganization(cert.organization || '');
    setAwardLevel(cert.awardLevel || 'gold');
    setDateReceived(cert.dateReceived || '');
    setAcademicYear(cert.academicYear || '');
    setDescription(cert.description || '');
    setImageUrl(cert.imageUrl || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเกียรติบัตรนี้?')) {
      setCertificates((certificates || []).filter(c => c.id !== id));
    }
  };

  const handleSave = () => {
    if (!title.trim() || !recipientName.trim() || !imageUrl) {
      alert('กรุณากรอกชื่อรางวัล ชื่อผู้รับ และอัปโหลดรูปภาพ');
      return;
    }
    
    if (activeTab === 'student' && !classId) {
      alert('กรุณาเลือกห้องเรียนสำหรับเกียรติบัตรนักเรียน');
      return;
    }

    const payload = {
      title,
      recipientName,
      ownerType: activeTab,
      classId: activeTab === 'student' ? classId : null,
      organization,
      awardLevel,
      dateReceived,
      academicYear,
      description,
      imageUrl,
    };

    if (editingId) {
      setCertificates((certificates || []).map(c => 
        c.id === editingId ? { ...c, ...payload } : c
      ));
    } else {
      setCertificates([
        ...(certificates || []),
        {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          createdAt: new Date().toISOString(),
          ...payload
        }
      ]);
    }
    setIsModalOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const getAwardLevelDisplay = (level) => {
    switch (level) {
      case 'gold': return { label: 'ระดับทอง', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' };
      case 'silver': return { label: 'ระดับเงิน', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
      case 'bronze': return { label: 'ระดับทองแดง', color: '#b45309', bg: 'rgba(180, 83, 9, 0.15)' };
      case 'participation': return { label: 'เข้าร่วม', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
      default: return { label: 'เข้าร่วม', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={24} style={{ color: 'var(--accent-primary)' }} />
            แฟ้มเกียรติบัตร
          </h2>
          <p className="page-subtitle">จัดเก็บและแสดงผลประกาศเกียรติคุณของครูและนักเรียน</p>
        </div>
        {!readOnly && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> เพิ่มเกียรติบัตร
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem', gap: '2rem' }}>
        <button 
          onClick={() => { setActiveTab('student'); setFilterClass('all'); }}
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '0.75rem 0',
            color: activeTab === 'student' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'student' ? 600 : 400,
            borderBottom: activeTab === 'student' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          🎓 เกียรติบัตรนักเรียน
        </button>
        <button 
          onClick={() => setActiveTab('teacher')}
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '0.75rem 0',
            color: activeTab === 'teacher' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'teacher' ? 600 : 400,
            borderBottom: activeTab === 'teacher' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s'
          }}
        >
          👨‍🏫 เกียรติบัตรครู
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="ค้นหาชื่อรางวัล, ผู้รับ..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%', margin: 0 }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select 
              className="input-field" 
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)}
              style={{ margin: 0, minWidth: '120px' }}
            >
              <option value="all">ทุกปีการศึกษา</option>
              {uniqueYears.map(y => <option key={y} value={y}>ปี {y}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select 
              className="input-field" 
              value={filterLevel} 
              onChange={(e) => setFilterLevel(e.target.value)}
              style={{ margin: 0, minWidth: '120px' }}
            >
              <option value="all">ทุกระดับรางวัล</option>
              <option value="gold">เหรียญทอง</option>
              <option value="silver">เหรียญเงิน</option>
              <option value="bronze">เหรียญทองแดง</option>
              <option value="participation">เข้าร่วม</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredCertificates.length === 0 ? (
        <div className="empty-state card" style={{ padding: '3rem 1rem' }}>
          <Award size={48} className="empty-state-icon" />
          <h3>ไม่มีเกียรติบัตร</h3>
          <p>ยังไม่มีข้อมูลเกียรติบัตรในหมวดหมู่ที่เลือก</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {filteredCertificates.map(cert => {
            const levelInfo = getAwardLevelDisplay(cert.awardLevel);
            const className = cert.classId ? classes.find(c => c.id === cert.classId)?.name : null;
            
            return (
              <div key={cert.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Image Area */}
                <div 
                  style={{ 
                    position: 'relative', 
                    paddingTop: '70%', 
                    backgroundColor: 'var(--bg-tertiary)',
                    cursor: 'pointer',
                    group: 'cert-img' // For CSS hover
                  }}
                  onClick={() => setLightboxImage(cert)}
                >
                  <img 
                    src={cert.imageUrl} 
                    alt={cert.title}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, width: '100%', height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                  >
                    <Maximize2 size={32} style={{ color: 'white' }} />
                  </div>
                  
                  {/* Action Buttons */}
                  {!readOnly && (
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem', zIndex: 10 }}>
                      <button 
                        className="btn-icon" 
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', padding: '0.25rem' }}
                        onClick={(e) => { e.stopPropagation(); openEditModal(cert); }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        className="btn-icon" 
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fca5a5', padding: '0.25rem' }}
                        onClick={(e) => { e.stopPropagation(); handleDelete(cert.id); }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {cert.title}
                    </h3>
                  </div>
                  
                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: levelInfo.bg, color: levelInfo.color, fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', alignSelf: 'flex-start' }}>
                    {levelInfo.label}
                  </div>
                  
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ผู้รับ:</span> {cert.recipientName} {className ? `(${className})` : ''}
                  </div>
                  
                  {cert.organization && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>มอบโดย:</span> {cert.organization}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>{cert.dateReceived ? new Date(cert.dateReceived).toLocaleDateString('th-TH') : '-'}</span>
                    <span>{cert.academicYear ? `ปี ${cert.academicYear}` : ''}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          style={{
            position: 'fixed', inset: 0, zIndex: 100000,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setLightboxImage(null)}
        >
          <button 
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}
            onClick={() => setLightboxImage(null)}
          >
            <X size={32} />
          </button>
          
          <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <img 
              src={lightboxImage.imageUrl} 
              alt={lightboxImage.title}
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
            />
            <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'white' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{lightboxImage.title}</h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                {lightboxImage.recipientName} • {getAwardLevelDisplay(lightboxImage.awardLevel).label}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && !readOnly && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingId ? 'แก้ไขเกียรติบัตร' : 'เพิ่มเกียรติบัตร'} ({activeTab === 'student' ? 'นักเรียน' : 'ครู'})</h3>
              <button className="btn-icon" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="form-group">
                <label>ภาพเกียรติบัตร <span style={{ color: 'var(--danger)' }}>*</span></label>
                {imageUrl ? (
                  <div style={{ position: 'relative', marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
                    <img src={imageUrl} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
                    <button 
                      className="btn-icon"
                      style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
                      onClick={() => setImageUrl('')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div 
                    style={{ 
                      border: '2px dashed var(--border-strong)', 
                      borderRadius: '8px', 
                      padding: '3rem 1rem', 
                      textAlign: 'center',
                      marginBottom: '1rem',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      backgroundColor: 'var(--bg-tertiary)'
                    }}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <div style={{ color: 'var(--accent-primary)' }}>กำลังอัปโหลดรูปภาพ...</div>
                    ) : (
                      <>
                        <ImageIcon size={32} style={{ color: 'var(--text-muted)', marginBottom: '1rem', margin: '0 auto' }} />
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>คลิกเพื่ออัปโหลดภาพเกียรติบัตร</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>(รองรับไฟล์ JPG, PNG ไม่เกิน 32MB)</div>
                      </>
                    )}
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                />
              </div>

              <div className="form-group">
                <label>ชื่อรางวัล/เกียรติบัตร <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น รางวัลเหรียญทอง การประกวดวาดภาพ..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>ชื่อผู้รับ <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="ชื่อ-นามสกุล"
                  />
                </div>
                {activeTab === 'student' && (
                  <div className="form-group">
                    <label>ห้องเรียน <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select 
                      className="input-field"
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                    >
                      <option value="">-- เลือกห้องเรียน --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>ระดับรางวัล</label>
                  <select 
                    className="input-field"
                    value={awardLevel}
                    onChange={(e) => setAwardLevel(e.target.value)}
                  >
                    <option value="gold">เหรียญทอง</option>
                    <option value="silver">เหรียญเงิน</option>
                    <option value="bronze">เหรียญทองแดง</option>
                    <option value="participation">เข้าร่วม</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>หน่วยงานที่มอบ</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="เช่น สพป. สงขลา เขต 2"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>วันที่ได้รับ</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={dateReceived}
                    onChange={(e) => setDateReceived(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>ปีการศึกษา</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="เช่น 2569"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>รายละเอียดเพิ่มเติม</label>
                <textarea 
                  className="input-field" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ข้อมูลเพิ่มเติม..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={closeModal}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isUploading}>บันทึกข้อมูล</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
