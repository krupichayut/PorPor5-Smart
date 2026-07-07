export const GRADE_ORDER = ['4.0', '3.5', '3.0', '2.5', '2.0', '1.5', '1.0', '0'];

export function getGrade(score) {
  if (score >= 80) return '4.0';
  if (score >= 75) return '3.5';
  if (score >= 70) return '3.0';
  if (score >= 65) return '2.5';
  if (score >= 60) return '2.0';
  if (score >= 55) return '1.5';
  if (score >= 50) return '1.0';
  return '0';
}

export function getGradeColor(grade) {
  switch (grade) {
    case '4.0': return '#10b981';
    case '3.5': return '#34d399';
    case '3.0': return '#3b82f6';
    case '2.5': return '#60a5fa';
    case '2.0': return '#f59e0b';
    case '1.5': return '#fbbf24';
    case '1.0': return '#f97316';
    case '0': return '#ef4444';
    default: return '#94a3b8';
  }
}

export function getClassScoreContext(classId, classes, scoreColumns, indicators) {
  const activeClass = classes.find(c => c.id === classId);
  const classScoreColumns = scoreColumns.filter(c => c.classId === classId);
  const classUnits = indicators ? indicators.filter(i => i.classId === classId) : [];
  const midtermWeight = activeClass?.midtermWeight ?? 10;
  const finalWeight = activeClass?.finalWeight ?? 10;

  return { activeClass, classScoreColumns, classUnits, midtermWeight, finalWeight };
}

export function getUnitWeightSum(classUnits, term) {
  return classUnits
    .filter(unit => unit.term === term || unit.term === 'all')
    .reduce((sum, unit) => sum + Number(unit.weight || 0), 0);
}

export function calculateStudentScores(studentId, context, scores, selectedTerm = 'all') {
  const { classScoreColumns, classUnits, midtermWeight, finalWeight } = context;
  let term1Collected = 0;
  let term2Collected = 0;

  classUnits.forEach(unit => {
    const unitCols = classScoreColumns.filter(c => c.unitId === unit.id && c.type === 'collected');
    const unitMaxRaw = unitCols.reduce((sum, col) => sum + Number(col.maxScore || 0), 0);
    const unitRaw = unitCols.reduce((sum, col) => {
      const score = scores.find(s => s.studentId === studentId && s.columnId === col.id);
      return sum + (score ? Number(score.score || 0) : 0);
    }, 0);
    const scaled = unitMaxRaw > 0 ? (unitRaw / unitMaxRaw) * Number(unit.weight || 0) : 0;

    if (unit.term === '2') term2Collected += scaled;
    else term1Collected += scaled;
  });

  const getExamScaled = (type, weight) => {
    const cols = classScoreColumns.filter(c => c.type === type);
    const maxRaw = cols.reduce((sum, col) => sum + Number(col.maxScore || 0), 0);
    const raw = cols.reduce((sum, col) => {
      const score = scores.find(s => s.studentId === studentId && s.columnId === col.id);
      return sum + (score ? Number(score.score || 0) : 0);
    }, 0);
    return maxRaw > 0 ? (raw / maxRaw) * weight : 0;
  };

  const midtermScaled = getExamScaled('midterm', midtermWeight);
  const finalScaled = getExamScaled('final', finalWeight);
  const finalTotal =
    selectedTerm === '1'
      ? term1Collected + midtermScaled
      : selectedTerm === '2'
        ? term2Collected + finalScaled
        : term1Collected + term2Collected + midtermScaled + finalScaled;

  return {
    term1Collected: Number(term1Collected.toFixed(2)),
    term2Collected: Number(term2Collected.toFixed(2)),
    midtermScaled: Number(midtermScaled.toFixed(2)),
    finalScaled: Number(finalScaled.toFixed(2)),
    totalScaled: Math.round(finalTotal)
  };
}

export function getGradeSummaryData(classStudents, context, scores) {
  const summary = Object.fromEntries(GRADE_ORDER.map(grade => [grade, 0]));

  classStudents.forEach(student => {
    const { totalScaled } = calculateStudentScores(student.id, context, scores);
    summary[getGrade(totalScaled)]++;
  });

  return GRADE_ORDER.map(grade => ({ grade, value: summary[grade] }));
}

export function calculateMissingWork(classStudents, classScoreColumns, scores) {
  let missingCount = 0;
  const collectedColumns = classScoreColumns.filter(col => col.type === 'collected');
  classStudents.forEach(student => {
    collectedColumns.forEach(col => {
      const hasScore = scores.some(s => s.studentId === student.id && s.columnId === col.id && s.score !== null && s.score !== '');
      if (!hasScore) missingCount++;
    });
  });
  return missingCount;
}
