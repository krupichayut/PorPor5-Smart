import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { calculateStudentScores, getClassScoreContext } from './scoring';

export async function generatePorPor5Excel(data) {
  const {
    classInfo,
    settings,
    students,
    indicators,
    attendance,
    scoreColumns,
    scores,
    attributes,
    literacy,
    competencies,
    classes // needed for scoring context
  } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = settings.teacherName || 'PitchClass System';
  workbook.created = new Date();

  const fontThai = { name: 'TH Sarabun PSK', size: 16 };
  const fontThaiBold = { name: 'TH Sarabun PSK', size: 16, bold: true };
  const fontTitle = { name: 'TH Sarabun PSK', size: 18, bold: true };

  // Helper to apply borders
  const applyBorders = (cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  };

  // ----------------------------------------------------
  // Sheet 1: ข้อมูลพื้นฐาน (Cover)
  // ----------------------------------------------------
  const sheetCover = workbook.addWorksheet('หน้าปก');
  sheetCover.getColumn(1).width = 20;
  sheetCover.getColumn(2).width = 40;
  
  sheetCover.getCell('A1').value = 'แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5)';
  sheetCover.getCell('A1').font = fontTitle;
  sheetCover.mergeCells('A1:B1');
  
  const coverData = [
    ['โรงเรียน', settings.schoolName || ''],
    ['ปีการศึกษา', settings.academicYear || ''],
    ['ภาคเรียนที่', settings.semester || ''],
    ['วิชา', classInfo.subject || ''],
    ['ชั้น/ห้อง', classInfo.name || ''],
    ['ครูผู้สอน', settings.teacherName || '']
  ];
  
  coverData.forEach((row, i) => {
    const r = sheetCover.getRow(i + 3);
    r.getCell(1).value = row[0];
    r.getCell(1).font = fontThaiBold;
    r.getCell(2).value = row[1];
    r.getCell(2).font = fontThai;
  });

  // ----------------------------------------------------
  // Sheet 2: เวลาเรียน (Attendance)
  // ----------------------------------------------------
  const sheetAtt = workbook.addWorksheet('เวลาเรียน');
  sheetAtt.getColumn(1).width = 5;  // No.
  sheetAtt.getColumn(2).width = 15; // ID
  sheetAtt.getColumn(3).width = 30; // Name
  
  // Sort dates
  const classAttendance = attendance || [];
  const uniqueDates = [...new Set(classAttendance.map(a => a.date))].sort();
  
  // Header row
  const attHeaderRow = sheetAtt.getRow(1);
  attHeaderRow.getCell(1).value = 'เลขที่';
  attHeaderRow.getCell(2).value = 'รหัสประจำตัว';
  attHeaderRow.getCell(3).value = 'ชื่อ-นามสกุล';
  
  uniqueDates.forEach((date, i) => {
    const colObj = sheetAtt.getColumn(i + 4);
    colObj.width = 12;
    const cell = attHeaderRow.getCell(i + 4);
    const d = new Date(date);
    cell.value = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()+543}`;
    cell.alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center' };
  });
  
  const sumStartCol = 4 + uniqueDates.length;
  attHeaderRow.getCell(sumStartCol).value = 'มา (ชม.)';
  attHeaderRow.getCell(sumStartCol+1).value = 'ขาด (ชม.)';
  attHeaderRow.getCell(sumStartCol+2).value = 'ลา (ชม.)';
  attHeaderRow.getCell(sumStartCol+3).value = 'สาย (ชม.)';
  attHeaderRow.font = fontThaiBold;
  
  attHeaderRow.eachCell(applyBorders);
  
  const hoursPerCheck = settings.hoursPerCheck ? Number(settings.hoursPerCheck) : 2;

  // Data rows
  students.forEach((s, idx) => {
    const r = sheetAtt.getRow(idx + 2);
    r.getCell(1).value = s.number;
    r.getCell(2).value = s.studentId;
    r.getCell(3).value = s.name;
    
    let present = 0, absent = 0, leave = 0, late = 0;
    
    uniqueDates.forEach((date, i) => {
      const record = classAttendance.find(a => a.studentId === s.id && a.date === date);
      let statusStr = '-';
      if (record) {
        if (record.status === 'present') { statusStr = 'มา'; present++; }
        else if (record.status === 'absent') { statusStr = 'ขาด'; absent++; }
        else if (record.status === 'leave') { statusStr = 'ลา'; leave++; }
        else if (record.status === 'late') { statusStr = 'สาย'; late++; }
        else if (record.status === 'holiday') { statusStr = 'หยุด'; present++; }
      }
      r.getCell(i + 4).value = statusStr;
      r.getCell(i + 4).alignment = { horizontal: 'center' };
    });
    
    r.getCell(sumStartCol).value = present * hoursPerCheck;
    r.getCell(sumStartCol+1).value = absent * hoursPerCheck;
    r.getCell(sumStartCol+2).value = leave * hoursPerCheck;
    r.getCell(sumStartCol+3).value = late * hoursPerCheck;
    
    r.font = fontThai;
    r.eachCell(applyBorders);
  });

  // ----------------------------------------------------
  // Sheet 3: ผลสัมฤทธิ์ทางการเรียน (Scores & Grades)
  // ----------------------------------------------------
  const sheetScores = workbook.addWorksheet('ผลการเรียน');
  sheetScores.getColumn(1).width = 5;
  sheetScores.getColumn(2).width = 15;
  sheetScores.getColumn(3).width = 30;
  
  const scoreHeader = sheetScores.getRow(1);
  scoreHeader.getCell(1).value = 'เลขที่';
  scoreHeader.getCell(2).value = 'รหัสประจำตัว';
  scoreHeader.getCell(3).value = 'ชื่อ-นามสกุล';
  
  const cols = scoreColumns || [];
  cols.forEach((col, i) => {
    const cell = scoreHeader.getCell(i + 4);
    cell.value = `${col.name}\n(${col.maxScore})`;
    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    sheetScores.getColumn(i + 4).width = 10;
  });
  
  const gradeStartCol = 4 + cols.length;
  const scoreContext = getClassScoreContext(classInfo.id, classes, cols, indicators);
  
  scoreHeader.getCell(gradeStartCol).value = `รวมหน่วย (${scoreContext.totalMaxUnits})`;
  scoreHeader.getCell(gradeStartCol+1).value = `กลางภาค (${scoreContext.midtermWeight})`;
  scoreHeader.getCell(gradeStartCol+2).value = `ปลายภาค (${scoreContext.finalWeight})`;
  scoreHeader.getCell(gradeStartCol+3).value = 'รวม (100)';
  scoreHeader.getCell(gradeStartCol+4).value = 'เกรด';
  
  scoreHeader.font = fontThaiBold;
  scoreHeader.eachCell(applyBorders);
  
  students.forEach((s, idx) => {
    const r = sheetScores.getRow(idx + 2);
    r.getCell(1).value = s.number;
    r.getCell(2).value = s.studentId;
    r.getCell(3).value = s.name;
    
    cols.forEach((col, i) => {
      const record = scores.find(rec => rec.studentId === s.id && rec.columnId === col.id);
      r.getCell(i + 4).value = record ? record.score : '';
      r.getCell(i + 4).alignment = { horizontal: 'center' };
    });
    
    const results = calculateStudentScores(s.id, scoreContext, scores);
    
    r.getCell(gradeStartCol).value = results.unitTotal;
    r.getCell(gradeStartCol+1).value = results.midtermScore;
    r.getCell(gradeStartCol+2).value = results.finalScore;
    r.getCell(gradeStartCol+3).value = results.totalScaled;
    r.getCell(gradeStartCol+4).value = results.grade;
    
    r.font = fontThai;
    r.eachCell(applyBorders);
  });

  // Export to Blob and Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `ปพ5_${classInfo.subject}_${classInfo.name}.xlsx`);
}
