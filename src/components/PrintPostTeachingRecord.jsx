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
        <div key={i} style={{ borderBottom: '1px dotted #000', height: '24px', marginTop: '4px' }}></div>
      ));
    }
    return <div style={{ minHeight: `${minLines * 24}px`, lineHeight: '24px', marginTop: '4px', borderBottom: '1px dotted #000' }}>{text}</div>;
  };

  const failedNamesList = record.failedNames ? record.failedNames.split('\n').filter(n => n.trim()) : [];

  return (
    <div className="print-only print-page">
      <div style={{ fontFamily: '"Sarabun", "TH Sarabun PSK", serif', fontSize: '15pt', color: '#000', lineHeight: '1.4' }}>
        
        <h2 style={{ textAlign: 'center', fontSize: '16pt', fontWeight: 'bold', marginBottom: '10px' }}>บันทึกผลหลังการสอน</h2>
        
        <div style={{ marginBottom: '5px' }}>
          หน่วยการเรียนรู้ที่ {plan.unit || '........................................'} เรื่อง {plan.topic} จำนวน {plan.hours || '........'} ชั่วโมง
        </div>
        <div style={{ marginBottom: '10px' }}>
          สอนวันที่ {day} เดือน {month} พ.ศ. {year}
        </div>

        <div style={{ fontWeight: 'bold', marginLeft: '40px', marginBottom: '5px' }}>
          สรุปผลการเรียนการสอน
        </div>

        <div style={{ marginLeft: '40px' }}>
          <div>๑. นักเรียนจำนวน {totalStudents || '........'} คน</div>
          <div style={{ marginLeft: '40px' }}>
            ผ่านจุดประสงค์การเรียนรู้ {record.passedCount || '........'} คน คิดเป็นร้อยละ {record.passedPercent || '........'}
          </div>
          <div style={{ marginLeft: '40px' }}>
            ไม่ผ่านจุดประสงค์ {record.failedCount || '........'} คน คิดเป็นร้อยละ {record.failedPercent || '........'}
          </div>
          <div style={{ marginLeft: '40px' }}>ได้แก่</div>
          <div style={{ marginLeft: '60px', minHeight: '48px', lineHeight: '1.3' }}>
            {failedNamesList.length > 0 ? (
              failedNamesList.map((name, idx) => (
                <div key={idx}>{idx + 1}. {name}</div>
              ))
            ) : (
              <>
                <div>๑. ...........................................................................................................................................</div>
                <div>๒. ...........................................................................................................................................</div>
              </>
            )}
          </div>
        </div>

        <div style={{ marginLeft: '40px', marginTop: '8px' }}>
          <div>๒. นักเรียนมีความรู้ความเข้าใจ (K)</div>
          {renderTextLines(record.k, 2)}
        </div>

        <div style={{ marginLeft: '40px', marginTop: '8px' }}>
          <div>๓. นักเรียนมีความรู้เกิดทักษะ (P)</div>
          {renderTextLines(record.p, 2)}
        </div>

        <div style={{ marginLeft: '40px', marginTop: '8px' }}>
          <div>๔. นักเรียนมีเจตคติ ค่านิยม คุณธรรมจริยธรรม (A)</div>
          {renderTextLines(record.a, 2)}
        </div>

        <div style={{ marginTop: '8px' }}>
          <div style={{ fontWeight: 'bold' }}>ปัญหา/อุปสรรค /แนวทางแก้ไข</div>
          {renderTextLines(record.problems, 2)}
        </div>

        {/* Signatures section - 3 columns to save vertical space */}
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '14pt' }}>
          
          <div style={{ textAlign: 'center', width: '30%' }}>
            <div>ลงชื่อ................................................</div>
            <div style={{ marginTop: '5px' }}>({appSettings?.teacherName || '.............................................'})</div>
            <div>ตำแหน่ง ครู</div>
          </div>
          
          <div style={{ textAlign: 'center', width: '30%' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>ความเห็นหัวหน้าบริหารวิชาการ</div>
            <div>ลงชื่อ................................................</div>
            <div style={{ marginTop: '5px' }}>({appSettings?.academicHeadName || '.............................................'})</div>
            <div style={{ fontSize: '13pt' }}>หัวหน้าบริหารวิชาการ{appSettings?.schoolName ? `โรงเรียน${appSettings.schoolName.replace('โรงเรียน', '')}` : ''}</div>
          </div>
          
          <div style={{ textAlign: 'center', width: '30%' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>ความเห็นผู้อำนวยการโรงเรียน</div>
            <div>ลงชื่อ................................................</div>
            <div style={{ marginTop: '5px' }}>({appSettings?.principalName || '.............................................'})</div>
            <div style={{ fontSize: '13pt' }}>ผู้อำนวยการ{appSettings?.schoolName ? `โรงเรียน${appSettings.schoolName.replace('โรงเรียน', '')}` : ''}</div>
          </div>

        </div>

      </div>
    </div>
  );
}
