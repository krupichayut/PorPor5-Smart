import { useState, useMemo } from 'react';
import { Library, Plus, Trash2, Pencil, ExternalLink, Search, FileText, Video, Image, Link2, File, MoreHorizontal } from 'lucide-react';

const MEDIA_TYPES = [
  { value: 'worksheet', label: 'ใบงาน', icon: FileText, color: 'var(--accent-cyan)' },
  { value: 'video', label: 'วีดีโอ', icon: Video, color: '#f59e0b' },
  { value: 'image', label: 'รูปภาพ', icon: Image, color: '#a78bfa' },
  { value: 'link', label: 'ลิงก์', icon: Link2, color: '#34d399' },
  { value: 'document', label: 'เอกสาร', icon: File, color: '#f87171' },
  { value: 'other', label: 'อื่นๆ', icon: MoreHorizontal, color: 'var(--text-muted)' },
];

const getMediaType = (type) => MEDIA_TYPES.find(t => t.value === type) || MEDIA_TYPES[5];

export default function MediaLibrary({ activeClassId, classes, mediaLibrary, setMediaLibrary, readOnly }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState('worksheet');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState([]);

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

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setType('worksheet');
    setCategory('');
    setUrl('');
    setDescription('');
    setSelectedClassIds(activeClassId ? [activeClassId] : []);
    setIsModalOpen(true);
  };

  const openEditModal = (media) => {
    setEditingId(media.id);
    setName(media.name);
    setType(media.type);
    setCategory(media.category || '');
    setUrl(media.url || '');
    setDescription(media.description || '');
    setSelectedClassIds(media.classIds || []);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      setMediaLibrary((mediaLibrary || []).map(m =>
        m.id === editingId
          ? { ...m, name, type, category, url, description, classIds: selectedClassIds }
          : m
      ));
    } else {
      const newMedia = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name,
        type,
        category,
        url,
        description,
        classIds: selectedClassIds,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setMediaLibrary([...(mediaLibrary || []), newMedia]);
    }
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
                    justifyContent: 'center', flexShrink: 0
                  }}>
                    <IconComponent size={20} style={{ color: mt.color }} />
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
                    >
                      <ExternalLink size={13} style={{ marginRight: '4px' }} /> เปิดลิงก์
                    </a>
                  )}
                  {!readOnly && (
                    <>
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
                <label className="form-label">ลิงก์สื่อ (URL)</label>
                <input
                  type="url"
                  className="form-control"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://drive.google.com/... หรือ YouTube link"
                />
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
    </div>
  );
}
