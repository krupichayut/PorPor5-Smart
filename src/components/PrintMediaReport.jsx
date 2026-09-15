import React from 'react';

const MEDIA_TYPES_LABEL = {
  worksheet: 'ใบงาน',
  video: 'สื่อวีดีทัศน์',
  image: 'สื่อรูปภาพ',
  link: 'สื่ออิเล็กทรอนิกส์',
  document: 'เอกสารประกอบการสอน',
  other: 'สื่อทำมือ'
};

export default function PrintMediaReport({ media, mediaIndex, appSettings, activeClass, classes }) {
  if (!media) return null;

  const report = media.usageReport || {
    results: '',
    problems: '',
    suggestions: ''
  };

  // Determine Class Name
  let className = '...................................................';
  if (activeClass) {
    className = activeClass.name;
  } else if (media.classIds && media.classIds.length > 0) {
    const assignedClasses = classes.filter(c => media.classIds.includes(c.id)).map(c => c.name);
    if (assignedClasses.length > 0) {
      className = assignedClasses.join(', ');
    }
  }

  // Helper to render lines for text to make it look like a form
  const renderTextLines = (text, minLines = 4) => {
    if (!text) {
      return Array(minLines).fill(0).map((_, i) => (
        <div key={i} style={{ borderBottom: '1px dotted #000', height: '28px', marginTop: '4px' }}></div>
      ));
    }
    return <div style={{ minHeight: `${minLines * 28}px`, lineHeight: '28px', marginTop: '4px', borderBottom: '1px dotted #000', whiteSpace: 'pre-wrap' }}>{text}</div>;
  };

  const mediaLabel = MEDIA_TYPES_LABEL[media.type] || MEDIA_TYPES_LABEL.other;

  return (
    <div className="print-only" style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%',
      backgroundColor: '#fff', 
      color: '#000', 
      zIndex: 9999, 
      padding: '2cm',
      fontFamily: '"TH Sarabun PSK", "TH Sarabun New", sans-serif',
      fontSize: '16pt',
      lineHeight: '1.5'
    }}>
      {/* Page 1: Header and Image */}
      <div>
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '20pt', marginBottom: '20px' }}>
          <div>แบบรายงานการผลิตสื่อและการใช้สื่อการเรียนการสอน</div>
          <div>ปีการศึกษา {appSettings?.academicYear || '........'}</div>
          <div>สื่อการเรียนการสอน ชิ้นที่ {mediaIndex + 1} {mediaLabel}</div>
        </div>
        
        <div style={{ borderBottom: '2px solid #000', margin: '0 auto 20px auto', width: '80%' }}></div>

        <div style={{ marginBottom: '30px', paddingLeft: '10%' }}>
          <div style={{ display: 'flex', marginBottom: '4px' }}>
            <div style={{ width: '120px' }}>ชื่อสื่อ</div>
            <div>{media.name}</div>
          </div>
          <div style={{ display: 'flex', marginBottom: '4px' }}>
            <div style={{ width: '120px' }}>กลุ่มสาระการเรียนรู้</div>
            <div>ศิลปะ</div>
          </div>
          <div style={{ display: 'flex', marginBottom: '4px' }}>
            <div style={{ width: '120px' }}>ระดับชั้น</div>
            <div>{className}</div>
          </div>
        </div>

        {/* Media Image Preview */}
        {((media.type === 'image' && media.url) || media.coverImageUrl) ? (
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <img src={media.coverImageUrl || media.url} alt="Media Preview" style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} />
          </div>
        ) : (
          <div style={{ width: '80%', height: '400px', border: '1px dashed #ccc', margin: '30px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
            (แนบภาพสื่อประกอบการสอนที่นี่)
          </div>
        )}
      </div>

      {/* Page 2: Report details */}
      <div style={{ pageBreakBefore: 'always', paddingTop: '1cm' }}>
        <div style={{ marginBottom: '25px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '18pt' }}>ผลที่เกิดขึ้นกับผู้เรียน</div>
          <div style={{ paddingLeft: '20px' }}>
            {renderTextLines(report.results, 5)}
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '18pt' }}>ปัญหา/แนวทางแก้ไข</div>
          <div style={{ paddingLeft: '20px' }}>
            {renderTextLines(report.problems, 4)}
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '18pt' }}>ข้อเสนอแนะอื่น</div>
          <div style={{ paddingLeft: '20px' }}>
            {renderTextLines(report.suggestions, 4)}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '50px' }}>
          <div style={{ textAlign: 'center', width: '300px' }}>
            <div>ลงชื่อ..........................................................</div>
            <div style={{ marginTop: '8px' }}>({appSettings?.teacherName || 'นายพิชญุตม์ ประภาศิริ'})</div>
            <div style={{ marginTop: '4px' }}>ครูผู้สอนวิชาศิลปะ</div>
          </div>
        </div>
      </div>
    </div>
  );
}
