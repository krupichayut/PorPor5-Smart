import React from 'react';

export default function PrintPostTeachingRecord({ plan, appSettings, activeClass }) {
  if (!plan) return null;

  const record = plan.postRecord && typeof plan.postRecord === 'object' 
    ? plan.postRecord 
    : {
        date: '',
        k: '',
        p: '',
        a: '',
        problems: typeof plan.postRecord === 'string' ? plan.postRecord : '',
        passedCount: '',
        passedPercent: '',
        failedCount: '',
        failedPercent: '',
        failedNames: ''
      };

  const totalStudents = Number(record.passedCount || 0) + Number(record.failedCount || 0);

  // Parse Date
  let day = '........';
  let month = '........................';
  let year = '................';
  if (record.date) {
    const d = new Date(record.date);
    if (!isNaN(d.getTime())) {
      day = d.getDate().toString();
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      month = thaiMonths[d.getMonth()];
      year = (d.getFullYear() + 543).toString();
    }
  }

  // Helper to render lines for text to make it look like a form
  const renderTextLines = (text, minLines = 2) => {
    if (!text) {
      return Array(minLines).fill(0).map((_, i) => (
        <div key={i} style={{ borderBottom: '1px dotted #000', height: '24px', marginTop: '2px' }}></div>
      ));
    }
    return <div style={{ minHeight: `${minLines * 24}px`, lineHeight: '24px', marginTop: '2px', borderBottom: '1px dotted #000' }}>{text}</div>;
  };

  const failedNamesList = record.failedNames ? record.failedNames.split('\n').filter(n => n.trim()) : [];

  return (
    <div className="print-only print-page">
      <div style={{ fontFamily: '"TH Sarabun PSK", "Sarabun", serif', fontSize: '14pt', color: '#000', lineHeight: '1.2' }}>
        
        <h2 style={{ textAlign: 'center', fontSize: '16pt', fontWeight: 'bold', marginBottom: '16px' }}>บันทึกผลหลังการสอน</h2>
        
        <div style={{ marginBottom: '6px' }}>
          หน่วยการเรียนรู้ที่ <span style={{ display: 'inline-block', minWidth: '60px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{record.unitNumber}</span> : <span style={{ display: 'inline-block', minWidth: '350px', borderBottom: '1px dotted #000', textAlign: 'left', paddingLeft: '8px' }}>{record.unitName}</span>
        </div>
        <div style={{ marginBottom: '6px' }}>
          แผนการจัดการเรียนรู้ที่ <span style={{ display: 'inline-block', minWidth: '60px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{record.planNumber}</span> 
          {' '}จำนวน <span style={{ display: 'inline-block', minWidth: '40px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{plan.hours}</span> ชั่วโมง
        </div>
        <div style={{ marginBottom: '6px', textAlign: 'left', lineHeight: '1.5' }}>
          เรื่อง <span style={{ borderBottom: '1px dotted #000', paddingLeft: '8px', paddingRight: '8px' }}>{plan.topic}</span>
        </div>
        <div style={{ marginBottom: '12px' }}>
          สอนวันที่ <span style={{ display: 'inline-block', minWidth: '60px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{day}</span> เดือน <span style={{ display: 'inline-block', minWidth: '120px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{month}</span> พ.ศ. <span style={{ display: 'inline-block', minWidth: '60px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{year}</span>
        </div>

        <div style={{ fontWeight: 'bold', marginLeft: '40px', marginBottom: '6px' }}>
          สรุปผลการเรียนการสอน
        </div>

        <div style={{ marginLeft: '40px' }}>
          <div>๑. นักเรียนจำนวน <span style={{ display: 'inline-block', minWidth: '80px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{totalStudents}</span> คน</div>
          <div style={{ marginLeft: '40px' }}>
            ผ่านจุดประสงค์การเรียนรู้ <span style={{ display: 'inline-block', minWidth: '60px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{record.passedCount}</span> คน คิดเป็นร้อยละ <span style={{ display: 'inline-block', minWidth: '80px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{record.passedPercent}</span>
          </div>
          <div style={{ marginLeft: '40px' }}>
            ไม่ผ่านจุดประสงค์ <span style={{ display: 'inline-block', minWidth: '60px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{record.failedCount}</span> คน คิดเป็นร้อยละ <span style={{ display: 'inline-block', minWidth: '80px', borderBottom: '1px dotted #000', textAlign: 'center' }}>{record.failedPercent}</span>
          </div>
          <div style={{ marginLeft: '40px' }}>ได้แก่</div>
          <div style={{ marginLeft: '40px', minHeight: '48px' }}>
            {failedNamesList.length > 0 ? (
              failedNamesList.map((name, idx) => (
                <div key={idx}>
                  {['๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙', '๑๐'][idx] || (idx + 1)}. <span style={{ display: 'inline-block', minWidth: '350px', borderBottom: '1px dotted #000' }}>{name}</span>
                </div>
              ))
            ) : (
              <>
                <div>๑. ...........................................................................................................................................</div>
                <div>๒. ...........................................................................................................................................</div>
                <div>๓. ...........................................................................................................................................</div>
              </>
            )}
          </div>
        </div>

        <div style={{ marginLeft: '40px', marginTop: '10px', pageBreakInside: 'avoid' }}>
          <div>๒. นักเรียนมีความรู้ความเข้าใจ ( K)</div>
          {renderTextLines(record.k, 2)}
        </div>

        <div style={{ marginLeft: '40px', marginTop: '10px', pageBreakInside: 'avoid' }}>
          <div>๓. นักเรียนมีความรู้เกิดทักษะ (P)</div>
          {renderTextLines(record.p, 2)}
        </div>

        <div style={{ marginLeft: '40px', marginTop: '10px', pageBreakInside: 'avoid' }}>
          <div>๔. นักเรียนมีเจตคติ ค่านิยม คุณธรรมจริยธรรม (A)</div>
          {renderTextLines(record.a, 2)}
        </div>

        <div style={{ marginTop: '10px', pageBreakInside: 'avoid' }}>
          <div style={{ fontWeight: 'bold' }}>ปัญหา/อุปสรรค /แนวทางแก้ไข</div>
          {renderTextLines(record.problems, 3)}
        </div>

        {/* Teacher Signature */}
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pageBreakInside: 'avoid' }}>
          <div style={{ textAlign: 'center', width: '350px' }}>
            <div>ลงชื่อ.................................................................</div>
            <div style={{ marginTop: '6px' }}>({appSettings?.teacherName || '...................................................'})</div>
            <div style={{ marginTop: '2px' }}>ตำแหน่ง ครู</div>
          </div>
        </div>

        {/* Academic Head Signature */}
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', pageBreakInside: 'avoid' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>ความเห็นของหัวหน้าบริหารวิชาการ</div>
          <div style={{ borderBottom: '1px dotted #000', height: '24px' }}></div>
          <div style={{ borderBottom: '1px dotted #000', height: '24px' }}></div>
          <div style={{ borderBottom: '1px dotted #000', height: '24px' }}></div>
          <div style={{ borderBottom: '1px dotted #000', height: '24px' }}></div>
          
          <div style={{ alignSelf: 'flex-end', textAlign: 'center', width: '450px', marginTop: '20px' }}>
            <div>ลงชื่อ.................................................................</div>
            <div style={{ marginTop: '6px' }}>({appSettings?.academicHeadName || '...................................................'})</div>
            <div style={{ marginTop: '2px', whiteSpace: 'nowrap' }}>ตำแหน่ง หัวหน้าบริหารวิชาการ{appSettings?.schoolName ? `โรงเรียน${appSettings.schoolName.replace('โรงเรียน', '')}` : ''}</div>
          </div>
        </div>

        {/* Principal Signature */}
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', pageBreakInside: 'avoid' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>ความเห็นของผู้อำนวยการโรงเรียน</div>
          <div style={{ borderBottom: '1px dotted #000', height: '24px' }}></div>
          <div style={{ borderBottom: '1px dotted #000', height: '24px' }}></div>
          <div style={{ borderBottom: '1px dotted #000', height: '24px' }}></div>
          <div style={{ borderBottom: '1px dotted #000', height: '24px' }}></div>
          
          <div style={{ alignSelf: 'flex-end', textAlign: 'center', width: '450px', marginTop: '20px' }}>
            <div>ลงชื่อ.................................................................</div>
            <div style={{ marginTop: '6px' }}>({appSettings?.principalName || '...................................................'})</div>
            <div style={{ marginTop: '2px', whiteSpace: 'nowrap' }}>ตำแหน่ง ผู้อำนวยการ{appSettings?.schoolName ? `โรงเรียน${appSettings.schoolName.replace('โรงเรียน', '')}` : ''}</div>
          </div>
        </div>

      </div>
    </div>
  );
}
