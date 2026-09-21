import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Plus, Trash2, Pencil, ExternalLink, X, Maximize2 } from 'lucide-react';

export default function StudentWorks({ works, setWorks, classes, readOnly }) {
  const [filterClass, setFilterClass] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [studentName, setStudentName] = useState('');
  const [classId, setClassId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState(null);

  const filteredWorks = (works || []).filter(w => {
    if (filterClass !== 'all' && w.classId !== filterClass) return false;
    return true;
  });

  const uploadToImgBB = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1];
          const body = new URLSearchParams();
          body.append('key', '106580ebef11da51048e4ec5959fe9d1');
          body.append('image', base64);
          const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
          });
          const data = await response.json();
          if (data.success) resolve(data.data.url);
          else reject(new Error(data.error?.message || 'Upload failed'));
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้นครับ');
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadToImgBB(file);
      setImageUrl(url);
    } catch (error) {
      console.error('ImgBB Error:', error);
      alert('อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openModal = (work = null) => {
    if (work) {
      setEditingId(work.id);
      setTitle(work.title || '');
      setStudentName(work.studentName || '');
      setClassId(work.classId || '');
      setDescription(work.description || '');
      setImageUrl(work.imageUrl || '');
    } else {
      setEditingId(null);
      setTitle('');
      setStudentName('');
      setClassId(classes?.[0]?.id || '');
      setDescription('');
      setImageUrl('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    if (editingId) {
      setWorks((works || []).map(w => w.id === editingId ? {
        ...w, title, studentName, classId, description, imageUrl
      } : w));
    } else {
      const newWork = {
        id: Date.now().toString(),
        title,
        studentName,
        classId,
        description,
        imageUrl,
        createdAt: new Date().toISOString()
      };
      setWorks([...(works || []), newWork]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm('แน่ใจหรือไม่ว่าต้องการลบผลงานนี้?')) {
      setWorks((works || []).filter(w => w.id !== id));
    }
  };

  return (
    <div className="fade-in">
      <style>{`
        .masonry-grid {
          column-count: 1;
          column-gap: 1.5rem;
        }
        @media (min-width: 640px) { .masonry-grid { column-count: 2; } }
        @media (min-width: 1024px) { .masonry-grid { column-count: 3; } }
        @media (min-width: 1280px) { .masonry-grid { column-count: 4; } }
        
        .masonry-item {
          break-inside: avoid;
          margin-bottom: 1.5rem;
          background: var(--bg-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          overflow: hidden;
          position: relative;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
        }
        .masonry-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.4);
        }
        .masonry-item img {
          width: 100%;
          display: block;
          object-fit: cover;
        }
        .masonry-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
          padding: 2rem 1rem 1rem;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .masonry-item:hover .masonry-overlay {
          opacity: 1;
        }
        .masonry-actions {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .masonry-item:hover .masonry-actions {
          opacity: 1;
        }
        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: rgba(255,255,255,0.2);
          transform: scale(1.1);
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-xl" style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ImageIcon className="text-accent" size={24} /> แกลเลอรีผลงานดีเด่น
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>หอศิลป์จำลองสำหรับจัดแสดงผลงานที่น่าภาคภูมิใจของนักเรียน</p>
        </div>
        {!readOnly && (
          <button className="btn btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> เพิ่มผลงาน
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="surface-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ระดับชั้น:</span>
          <select className="form-control" value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={{ width: '150px' }}>
            <option value="all">ทุกระดับชั้น</option>
            {classes?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredWorks.length === 0 ? (
        <div className="empty-state">
          <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3>ยังไม่มีผลงานในแกลเลอรี</h3>
          <p>กดปุ่มเพิ่มผลงาน เพื่อเริ่มจัดแสดงผลงานของนักเรียน</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {filteredWorks.map(work => (
            <div key={work.id} className="masonry-item">
              <img src={work.imageUrl} alt={work.title} loading="lazy" />
              
              <div className="masonry-overlay">
                <h3 style={{ color: 'white', margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>{work.title}</h3>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{work.studentName}</span>
                  <span>{classes?.find(c => c.id === work.classId)?.name}</span>
                </div>
              </div>

              <div className="masonry-actions">
                <button className="action-btn" onClick={() => setLightboxImage(work.imageUrl)} title="ขยายรูป">
                  <Maximize2 size={16} />
                </button>
                {!readOnly && (
                  <>
                    <button className="action-btn" onClick={() => openModal(work)} title="แก้ไข">
                      <Pencil size={16} />
                    </button>
                    <button className="action-btn" onClick={() => handleDelete(work.id)} title="ลบ" style={{ color: '#f87171' }}>
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
          onClick={() => setLightboxImage(null)}
        >
          <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setLightboxImage(null)}>
            <X size={32} />
          </button>
          <img src={lightboxImage} alt="Enlarged" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }} />
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              {editingId ? 'แก้ไขผลงาน' : 'เพิ่มผลงานใหม่'}
            </h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                
                {/* Image Upload Area */}
                <div style={{ border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center', background: 'var(--bg-tertiary)' }}>
                  {imageUrl ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={imageUrl} alt="Preview" style={{ maxHeight: '200px', borderRadius: '8px' }} />
                      <button type="button" className="btn-icon" style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--bg-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }} onClick={() => setImageUrl('')}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        คลิกเพื่ออัปโหลดรูปภาพ (ขนาดไม่เกิน 32MB)
                      </p>
                      <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? 'กำลังอัปโหลด...' : 'เลือกรูปภาพ'}
                      </button>
                      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                      
                      <div style={{ margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>หรือวางลิงก์รูปภาพโดยตรง</div>
                      <input type="url" className="form-control" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                    </>
                  )}
                </div>

                <div>
                  <label className="form-label">ชื่อผลงาน *</label>
                  <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="เช่น แจกันดอกไม้, แสงและเงา" />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label">ชื่อนักเรียนผู้สร้างสรรค์</label>
                    <input type="text" className="form-control" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="เช่น ด.ช. สมชาย" />
                  </div>
                  <div>
                    <label className="form-label">ระดับชั้น</label>
                    <select className="form-control" value={classId} onChange={(e) => setClassId(e.target.value)}>
                      {classes?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">คำอธิบาย / เทคนิค (ถ้ามี)</label>
                  <textarea className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="เช่น เทคนิคสีน้ำบนกระดาษร้อยปอนด์" rows={2} />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={!title || !imageUrl}>บันทึกผลงาน</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
