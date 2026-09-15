import { useState, useMemo, useRef, useEffect } from 'react';
import { Library, Plus, Trash2, Pencil, ExternalLink, Search, FileText, Video, Image, Link2, File, MoreHorizontal, UploadCloud, Printer, MonitorPlay } from 'lucide-react';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import PrintMediaReport from './PrintMediaReport';

const MEDIA_TYPES = [
  { value: 'worksheet', label: 'ใบงาน', icon: FileText, color: 'var(--accent-cyan)' },
  { value: 'video', label: 'วีดีโอ', icon: Video, color: '#f59e0b' },
  { value: 'image', label: 'รูปภาพ', icon: Image, color: '#a78bfa' },
  { value: 'slide', label: 'สไลด์/นำเสนอ', icon: MonitorPlay, color: '#f43f5e' },
  { value: 'link', label: 'ลิงก์', icon: Link2, color: '#34d399' },
  { value: 'document', label: 'เอกสาร', icon: File, color: '#f87171' },
  { value: 'other', label: 'อื่นๆ', icon: MoreHorizontal, color: 'var(--text-muted)' },
];

const getMediaType = (type) => MEDIA_TYPES.find(t => t.value === type) || MEDIA_TYPES[5];

export default function MediaLibrary({ appSettings, activeClassId, classes, mediaLibrary, setMediaLibrary, readOnly }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState('worksheet');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  
  const [uploadMode, setUploadMode] = useState('link'); // 'link' or 'file'
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState({ results: '', problems: '', suggestions: '' });
  const [printingMedia, setPrintingMedia] = useState(null);

  const activeClass = classes.find(c => c.id === activeClassId);

  // Filter media: show all if no class selected, or show media linked to active class + global media
  const filteredMedia = useMemo(() => {
    let items = mediaLibrary || [];

    if (activeClassId) {
      items = items.filter(m =>
        !m.classIds || m.classIds.length === 0 || m.classIds.includes(activeClassId)
      );
    }

    if (filterType !== 'all') {
      items = items.filter(m => m.type === filterType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q)
      );
    }

    return items;
  }, [mediaLibrary, activeClassId, filterType, searchQuery]);

  useEffect(() => {
    if (printingMedia) {
      const timer = setTimeout(() => {
        window.print();
        setPrintingMedia(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printingMedia]);

  const openReportModal = (media) => {
    setEditingId(media.id);
    setReportData(media.usageReport || { results: '', problems: '', suggestions: '' });
    setIsReportModalOpen(true);
  };

  const handleSaveReport = (e) => {
    e.preventDefault();
    setMediaLibrary((mediaLibrary || []).map(m =>
      m.id === editingId ? { ...m, usageReport: reportData } : m
    ));
    setIsReportModalOpen(false);
    setEditingId(null);
  };

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setType('worksheet');
    setCategory('');
    setUrl('');
    setCoverImageUrl('');
    setDescription('');
    setSelectedClassIds(activeClassId ? [activeClassId] : []);
    setUploadMode('link');
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsModalOpen(true);
  };

  const openEditModal = (media) => {
    setEditingId(media.id);
    setName(media.name);
    setType(media.type);
    setCategory(media.category || '');
    setUrl(media.url || '');
    setCoverImageUrl(media.coverImageUrl || '');
    setDescription(media.description || '');
    setSelectedClassIds(media.classIds || []);
    setUploadMode('link');
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isUploading || isUploadingCover) return;
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleUploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCover(true);
      const fileRef = ref(storage, `mediaLibrary/cover_${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed', 
          (snapshot) => {
            // Optional: can track cover upload progress here if needed
          }, 
          (error) => {
            console.error('Cover upload error:', error);
            reject(error);
          }, 
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              setCoverImageUrl(downloadUrl);
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    } catch (error) {
      console.error(error);
      alert('อัปโหลดภาพปกไม่สำเร็จ');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalUrl = url;

    // Handle file upload
    if (uploadMode === 'file' && selectedFile) {
      try {
        setIsUploading(true);
        const fileRef = ref(storage, `mediaLibrary/${Date.now()}_${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(fileRef, selectedFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Upload error:', error);
              alert('เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
              reject(error);
            },
            async () => {
              finalUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      } catch (error) {
        setIsUploading(false);
        return;
      }
    }

    if (editingId) {
      setMediaLibrary((mediaLibrary || []).map(m =>
        m.id === editingId
          ? { ...m, name, type, category, url: finalUrl, coverImageUrl, description, classIds: selectedClassIds }
          : m
      ));
    } else {
      const newMedia = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name,
        type,
        category,
        url: finalUrl,
        coverImageUrl,
        description,
        classIds: selectedClassIds,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setMediaLibrary([...(mediaLibrary || []), newMedia]);
    }
    
    setIsUploading(false);
    closeModal();
  };

  const handleDelete = (id) => {
    if (confirm('แน่ใจหรือไม่ว่าต้องการลบสื่อนี้?')) {
      setMediaLibrary((mediaLibrary || []).filter(m => m.id !== id));
    }
  };

  const toggleClassId = (classId) => {
    setSelectedClassIds(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const allCategories = useMemo(() => {
    const cats = new Set((mediaLibrary || []).map(m => m.category).filter(Boolean));
    return [...cats];
  }, [mediaLibrary]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">คลังสื่อการเรียนรู้</h2>
          <p className="page-subtitle">
            จัดเก็บและจัดการสื่อการสอน{activeClass ? ` • ${activeClass.name} — ${activeClass.subject}` : ' • ทุกวิชา'}
            {' '}• {filteredMedia.length} รายการ
          </p>
        </div>
        {!readOnly && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> เพิ่มสื่อ
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="hairline-cell" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-control"
            placeholder="ค้นหาสื่อ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => setFilterType('all')}
          >
            ทั้งหมด
          </button>
          {MEDIA_TYPES.map(mt => (
            <button
              key={mt.value}
              className={`btn ${filterType === mt.value ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setFilterType(mt.value)}
            >
              <mt.icon size={13} style={{ marginRight: '4px' }} /> {mt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {filteredMedia.length === 0 ? (
        <div className="empty-state">
          <Library size={48} />
          <h3>{searchQuery || filterType !== 'all' ? 'ไม่พบสื่อที่ค้นหา' : 'ยังไม่มีสื่อในคลัง'}</h3>
          <p>{!readOnly ? 'กรุณากด "เพิ่มสื่อ" เพื่อเริ่มสร้างคลังสื่อ' : 'ยังไม่มีข้อมูล'}</p>
        </div>
      ) : (
        <div className="hairline-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredMedia.map(media => {
            const mt = getMediaType(media.type);
            const IconComponent = mt.icon;
            return (
              <div key={media.id} className="stat-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, overflow: 'hidden'
                  }}>
                    {((media.type === 'image' && media.url) || media.coverImageUrl) ? (
                      <img src={media.coverImageUrl || media.url} alt={media.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <IconComponent size={20} style={{ color: mt.color }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.3, wordBreak: 'break-word' }}>
                      {media.name}
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      <span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: mt.color, fontSize: '0.7rem' }}>
                        {mt.label}
                      </span>
                      {media.category && (
                        <span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          {media.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {media.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.5, margin: 0 }}>
                    {media.description}
                  </p>
                )}

                {/* Class Tags */}
                {media.classIds && media.classIds.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {media.classIds.map(cid => {
                      const cls = classes.find(c => c.id === cid);
                      return cls ? (
                        <span key={cid} className="badge" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: '0.65rem', border: '1px solid var(--border-subtle)' }}>
                          {cls.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                  {media.url && (
                    <a
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.78rem', textAlign: 'center', textDecoration: 'none' }}
                      title="เปิดลิงก์"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                  {!readOnly && (
                    <>
                      <button className="btn btn-outline" style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.78rem', color: 'var(--text-primary)' }} onClick={() => openReportModal(media)} title="บันทึกรายงาน">
                        <FileText size={13} style={{ marginRight: '4px' }} /> รายงาน
                      </button>
                      <button className="btn-icon" style={{ color: 'var(--text-muted)' }} onClick={() => { setPrintingMedia(media); }} aria-label="พิมพ์รายงาน" title="พิมพ์รายงาน">
                        <Printer size={16} />
                      </button>
                      <button className="btn-icon" style={{ color: 'var(--accent-cyan)' }} onClick={() => openEditModal(media)} aria-label="แก้ไขสื่อ" title="แก้ไข">
                        <Pencil size={16} />
                      </button>
                      <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(media.id)} aria-label="ลบสื่อ" title="ลบ">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'แก้ไขสื่อการเรียนรู้' : 'เพิ่มสื่อการเรียนรู้'}</h3>
              <button type="button" className="btn-icon" onClick={closeModal} aria-label="ปิด">×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">ชื่อสื่อ *</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ใบงาน: องค์ประกอบศิลป์"
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">ประเภทสื่อ</label>
                  <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
                    {MEDIA_TYPES.map(mt => (
                      <option key={mt.value} value={mt.value}>{mt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">หมวดหมู่</label>
                  <input
                    type="text"
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="เช่น ทัศนศิลป์, ดนตรี"
                    list="category-list"
                  />
                  <datalist id="category-list">
                    {allCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'flex', gap: '1rem' }}>
                  <span>ช่องทางการจัดเก็บ</span>
                  <div style={{ display: 'flex', gap: '0.75rem', fontWeight: 'normal', fontSize: '0.85rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                      <input type="radio" name="uploadMode" value="link" checked={uploadMode === 'link'} onChange={(e) => setUploadMode(e.target.value)} />
                      แนบลิงก์ภายนอก
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                      <input type="radio" name="uploadMode" value="file" checked={uploadMode === 'file'} onChange={(e) => setUploadMode(e.target.value)} />
                      อัปโหลดไฟล์
                    </label>
                  </div>
                </label>

                {uploadMode === 'link' ? (
                  <>
                    <input
                      type="url"
                      className="form-control"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="เช่น ลิงก์ YouTube, Google Drive..."
                      style={{ marginBottom: '0.75rem' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                      {coverImageUrl ? (
                        <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden' }}>
                          <img src={coverImageUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '60px', height: '60px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <Image size={24} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>ภาพตัวอย่าง (สำหรับออกรายงาน)</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ถ้าแนบลิงก์สไลด์หรือคลิป แนะนำให้อัปโหลดภาพหน้าปกไว้พิมพ์ออกรายงานครับ</div>
                        <button type="button" className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => coverInputRef.current?.click()} disabled={isUploadingCover}>
                          {isUploadingCover ? 'กำลังอัปโหลด...' : (coverImageUrl ? 'เปลี่ยนภาพปก' : 'อัปโหลดภาพปก')}
                        </button>
                        <input type="file" ref={coverInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleUploadCover} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="hairline-cell" style={{ padding: '1rem', textAlign: 'center', borderStyle: 'dashed' }}>
                    {url && !selectedFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>มีไฟล์อัปโหลดไว้แล้ว</span>
                        <button type="button" className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => fileInputRef.current?.click()}>
                          เปลี่ยนไฟล์
                        </button>
                      </div>
                    ) : (
                      <>
                        {type === 'image' && (selectedFile ? selectedFile.type.startsWith('image/') : url) ? (
                          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                            <img 
                              src={selectedFile ? URL.createObjectURL(selectedFile) : url} 
                              alt="Preview" 
                              style={{ maxHeight: '150px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'contain', border: '1px solid var(--border-subtle)' }} 
                            />
                          </div>
                        ) : (
                          <UploadCloud size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                        )}
                        <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: selectedFile ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {selectedFile ? selectedFile.name : 'ลากไฟล์มาวาง หรือ คลิกเพื่อเลือกไฟล์'}
                        </div>
                        <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
                          เลือกไฟล์
                        </button>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    />
                    {isUploading && (
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary-color)', transition: 'width 0.2s ease' }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>กำลังอัปโหลด {Math.round(uploadProgress)}%</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">คำอธิบายสั้นๆ</label>
                <textarea
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  placeholder="อธิบายเนื้อหาของสื่อ..."
                />
              </div>

              {/* Class Selector */}
              {classes.length > 0 && (
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ใช้กับวิชา (ว่างเปล่า = ทุกวิชา)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เลือกแล้ว {selectedClassIds.length}</span>
                  </label>
                  <div className="hairline-cell" style={{ maxHeight: '120px', overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {classes.map(cls => (
                      <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', backgroundColor: selectedClassIds.includes(cls.id) ? 'rgba(6, 182, 212, 0.08)' : 'transparent' }}>
                        <input
                          type="checkbox"
                          checked={selectedClassIds.includes(cls.id)}
                          onChange={() => toggleClassId(cls.id)}
                        />
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                          {cls.name} — {cls.subject}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
                  {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มสื่อ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsReportModalOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>บันทึกรายงานการใช้สื่อ</h3>
              <button className="btn-icon" onClick={() => setIsReportModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveReport} className="modal-body">
              <div className="form-group">
                <label className="form-label">ผลที่เกิดขึ้นกับผู้เรียน</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={reportData.results}
                  onChange={e => setReportData({...reportData, results: e.target.value})}
                  placeholder="เช่น นักเรียนมีความเข้าใจในจุดประสงค์มากขึ้น..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">ปัญหา / แนวทางแก้ไข</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={reportData.problems}
                  onChange={e => setReportData({...reportData, problems: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ข้อเสนอแนะอื่น</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={reportData.suggestions}
                  onChange={e => setReportData({...reportData, suggestions: e.target.value})}
                />
              </div>
              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-outline" style={{ color: 'var(--text-primary)' }} onClick={() => { setPrintingMedia(mediaLibrary.find(m => m.id === editingId)); setIsReportModalOpen(false); }}>
                  <Printer size={16} style={{ marginRight: '6px' }} /> พิมพ์แบบรายงาน
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsReportModalOpen(false)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary">บันทึกรายงาน</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invisible Print Layout */}
      {printingMedia && (
        <PrintMediaReport 
          media={printingMedia} 
          mediaIndex={mediaLibrary.findIndex(m => m.id === printingMedia.id)}
          activeClass={activeClass} 
          classes={classes} 
          appSettings={appSettings}
        />
      )}
    </div>
  );
}
