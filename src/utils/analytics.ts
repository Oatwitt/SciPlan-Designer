export interface StudentRecord {
  id: string;
  studentCode: string;
  prefix: string;
  firstName: string;
  lastName: string;
  classroom: string;
  pretest: number; // สอบก่อนเรียน (เต็ม 20 คะแนน)
  completedPlan1: boolean; // เข้าเรียน/ทำกิจกรรม สอนแผนที่ 1 (ไม่มีการเก็บคะแนน)
  completedPlan2: boolean; // เข้าเรียน/ทำกิจกรรม สอนแผนที่ 2 (ไม่มีการเก็บคะแนน)
  completedPlan3: boolean; // เข้าเรียน/ทำกิจกรรม สอนแผนที่ 3 (ไม่มีการเก็บคะแนน)
  posttest: number; // สอบหลังเรียน (เต็ม 20 คะแนน)
  learningStyle: 'Visual' | 'Kinesthetic' | 'Analytical' | 'Collaborative';
  researchTargetGroup: boolean; // นักเรียนกลุ่มเป้าหมายวิจัยในชั้นเรียน
  teacherNote: string;
}

export interface ResearchIntervention {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  paorStage: 'Plan' | 'Act' | 'Observe' | 'Reflect';
  lessonPlanNumber: 1 | 2 | 3;
  innovationUsed: string;
  problemObserved: string;
  scoreBefore: number; // ก่อนเรียน (เต็ม 20)
  scoreAfter: number; // หลังเรียน (เต็ม 20)
  reflectionOutcome: string;
  status: 'กำลังดำเนินการ' | 'บรรลุเป้าหมาย' | 'ต้องปรับแผนซ้ำ';
}

export interface LessonPlanSpec {
  planNumber: 1 | 2 | 3;
  title: string;
  activityName: string;
  durationHours: number;
  targetSkill: string;
}

export interface ResearchProjectConfig {
  title: string;
  courseCode: string;
  courseName: string;
  semester: string;
  targetClassroom: string;
  innovationName: string;
  targetCriterionPct: number; // เกณฑ์ผ่านหลังเรียน เช่น ร้อยละ 80 (16/20 คะแนน)
  researchHypothesis: string;
  lessonPlans: LessonPlanSpec[];
  planSummary: string;
  actSummary: string;
  observeSummary: string;
  reflectSummary: string;
}

export const SCORE_MAX = {
  pretest: 20, // สอบก่อนเรียน 20 คะแนน
  posttest: 20, // สอบหลังเรียน 20 คะแนน
} as const;

export function clampScore(value: number, max: number): number {
  if (Number.isNaN(value) || value < 0) return 0;
  if (value > max) return max;
  return Math.round(value * 10) / 10;
}

// คำนวณร้อยละของคะแนนสอบก่อนเรียน (0 - 100%)
export function calculatePretestPct(student: Pick<StudentRecord, 'pretest'>): number {
  return Math.round(((Number(student.pretest || 0)) / SCORE_MAX.pretest) * 1000) / 10;
}

// คำนวณร้อยละของคะแนนสอบหลังเรียน (0 - 100%)
export function calculatePosttestPct(student: Pick<StudentRecord, 'posttest'>): number {
  return Math.round(((Number(student.posttest || 0)) / SCORE_MAX.posttest) * 1000) / 10;
}

// คะแนนพัฒนาการ (ผลต่าง หลังเรียน - ก่อนเรียน เต็ม 20 คะแนน)
export function calculateScoreDiff(student: Pick<StudentRecord, 'pretest' | 'posttest'>): number {
  return Math.round((Number(student.posttest || 0) - Number(student.pretest || 0)) * 10) / 10;
}

// นับจำนวนแผนการเรียนรู้ที่นักเรียนเข้าร่วม (เต็ม 3 แผน)
export function countCompletedPlans(
  student: Pick<StudentRecord, 'completedPlan1' | 'completedPlan2' | 'completedPlan3'>
): number {
  return (
    (student.completedPlan1 ? 1 : 0) +
    (student.completedPlan2 ? 1 : 0) +
    (student.completedPlan3 ? 1 : 0)
  );
}

// ตัดเกรดจากร้อยละคะแนนสอบหลังเรียน (0 - 100%)
export function calculateThaiGrade(posttestPercentage: number): number {
  if (posttestPercentage >= 80) return 4;
  if (posttestPercentage >= 75) return 3.5;
  if (posttestPercentage >= 70) return 3;
  if (posttestPercentage >= 65) return 2.5;
  if (posttestPercentage >= 60) return 2;
  if (posttestPercentage >= 55) return 1.5;
  if (posttestPercentage >= 50) return 1;
  return 0;
}

export function getGradeLabel(grade: number): string {
  if (grade === 4) return 'ดีเยี่ยม (4.0)';
  if (grade === 3.5) return 'ดีมาก (3.5)';
  if (grade === 3) return 'ดี (3.0)';
  if (grade === 2.5) return 'ค่อนข้างดี (2.5)';
  if (grade === 2) return 'ปานกลาง (2.0)';
  if (grade === 1.5) return 'พอใช้ (1.5)';
  if (grade === 1) return 'ผ่านเกณฑ์ขั้นต่ำ (1.0)';
  return 'ต่ำกว่าเกณฑ์ (0.0)';
}

export interface NormalizedGainResult {
  gain: number;
  level: 'High Gain' | 'Medium Gain' | 'Low Gain';
  levelThai: string;
}

export function calculateNormalizedGain(
  pretest: number,
  posttest: number,
  maxScore: number = SCORE_MAX.posttest
): NormalizedGainResult {
  if (pretest >= maxScore) {
    return {
      gain: posttest >= maxScore ? 1 : 0,
      level: posttest >= maxScore ? 'High Gain' : 'Low Gain',
      levelThai:
        posttest >= maxScore
          ? 'พัฒนาการระดับสูง (High Gain)'
          : 'พัฒนาการระดับต่ำ (Low Gain)',
    };
  }
  const rawGain = (posttest - pretest) / (maxScore - pretest);
  const gain = Math.round(rawGain * 100) / 100;

  if (gain >= 0.7) {
    return { gain, level: 'High Gain', levelThai: 'พัฒนาการระดับสูง (g ≥ 0.70)' };
  }
  if (gain >= 0.3) {
    return {
      gain,
      level: 'Medium Gain',
      levelThai: 'พัฒนาการระดับปานกลาง (0.30 ≤ g < 0.70)',
    };
  }
  return { gain, level: 'Low Gain', levelThai: 'พัฒนาการระดับต่ำ (g < 0.30)' };
}

export interface DependentTTestResult {
  meanPre: number;
  sdPre: number;
  meanPrePct: number;
  meanPost: number;
  sdPost: number;
  meanPostPct: number;
  meanDiff: number;
  sdDiff: number;
  tStat: number;
  df: number;
  isSignificant: boolean;
  criticalT: number;
}

function getCriticalT05(df: number): number {
  if (df <= 1) return 6.314;
  if (df === 2) return 2.92;
  if (df === 3) return 2.353;
  if (df === 4) return 2.132;
  if (df === 5) return 2.015;
  if (df <= 8) return 1.86;
  if (df <= 12) return 1.782;
  if (df <= 20) return 1.725;
  if (df <= 30) return 1.697;
  return 1.645;
}

export function calculateDependentTTest(students: StudentRecord[]): DependentTTestResult {
  const n = students.length;
  if (n < 2) {
    const pre = n === 1 ? students[0].pretest : 0;
    const post = n === 1 ? students[0].posttest : 0;
    return {
      meanPre: pre,
      sdPre: 0,
      meanPrePct: (pre / 20) * 100,
      meanPost: post,
      sdPost: 0,
      meanPostPct: (post / 20) * 100,
      meanDiff: post - pre,
      sdDiff: 0,
      tStat: 0,
      df: 0,
      isSignificant: false,
      criticalT: 1.645,
    };
  }

  const preScores = students.map((s) => s.pretest);
  const postScores = students.map((s) => s.posttest);
  const diffs = students.map((s) => s.posttest - s.pretest);

  const meanPre = preScores.reduce((a, b) => a + b, 0) / n;
  const meanPost = postScores.reduce((a, b) => a + b, 0) / n;
  const meanDiff = diffs.reduce((a, b) => a + b, 0) / n;

  const varPre = preScores.reduce((acc, v) => acc + Math.pow(v - meanPre, 2), 0) / (n - 1);
  const varPost = postScores.reduce((acc, v) => acc + Math.pow(v - meanPost, 2), 0) / (n - 1);
  const varDiff = diffs.reduce((acc, v) => acc + Math.pow(v - meanDiff, 2), 0) / (n - 1);

  const sdPre = Math.sqrt(varPre);
  const sdPost = Math.sqrt(varPost);
  const sdDiff = Math.sqrt(varDiff);

  const standardError = sdDiff / Math.sqrt(n);
  const tStat = standardError > 0 ? meanDiff / standardError : meanDiff > 0 ? 99.99 : 0;
  const df = n - 1;
  const criticalT = getCriticalT05(df);

  return {
    meanPre: Math.round(meanPre * 100) / 100,
    sdPre: Math.round(sdPre * 100) / 100,
    meanPrePct: Math.round((meanPre / SCORE_MAX.pretest) * 1000) / 10,
    meanPost: Math.round(meanPost * 100) / 100,
    sdPost: Math.round(sdPost * 100) / 100,
    meanPostPct: Math.round((meanPost / SCORE_MAX.posttest) * 1000) / 10,
    meanDiff: Math.round(meanDiff * 100) / 100,
    sdDiff: Math.round(sdDiff * 100) / 100,
    tStat: Math.round(tStat * 100) / 100,
    df,
    isSignificant: tStat >= criticalT,
    criticalT,
  };
}

export interface ClassSummaryStats {
  studentCount: number;
  meanPostScore: number; // เต็ม 20
  meanPostPct: number; // เต็ม 100%
  sdPostScore: number;
  maxPostScore: number;
  minPostScore: number;
  meanGPA: number;
  targetCriterionPct: number;
  targetCriterionScore: number; // เช่น 16/20 สำหรับ 80%
  passCriterionCount: number;
  passCriterionRate: number;
  atRiskCount: number;
  highPerformingCount: number;
  averageNormalizedGain: number;
  plan1AttendancePct: number;
  plan2AttendancePct: number;
  plan3AttendancePct: number;
  gradeDistribution: Record<string, number>;
  tTest: DependentTTestResult;
}

export function calculateClassSummary(
  students: StudentRecord[],
  targetCriterionPct: number = 80
): ClassSummaryStats {
  const n = students.length;
  const targetCriterionScore = Math.round((targetCriterionPct / 100) * SCORE_MAX.posttest * 10) / 10;
  const emptyGrades: Record<string, number> = {
    '4': 0,
    '3.5': 0,
    '3': 0,
    '2.5': 0,
    '2': 0,
    '1.5': 0,
    '1': 0,
    '0': 0,
  };

  if (n === 0) {
    return {
      studentCount: 0,
      meanPostScore: 0,
      meanPostPct: 0,
      sdPostScore: 0,
      maxPostScore: 0,
      minPostScore: 0,
      meanGPA: 0,
      targetCriterionPct,
      targetCriterionScore,
      passCriterionCount: 0,
      passCriterionRate: 0,
      atRiskCount: 0,
      highPerformingCount: 0,
      averageNormalizedGain: 0,
      plan1AttendancePct: 0,
      plan2AttendancePct: 0,
      plan3AttendancePct: 0,
      gradeDistribution: emptyGrades,
      tTest: calculateDependentTTest([]),
    };
  }

  const postScores = students.map((s) => s.posttest);
  const postPcts = students.map((s) => calculatePosttestPct(s));
  const grades = postPcts.map((pct) => calculateThaiGrade(pct));
  const gains = students.map((s) => calculateNormalizedGain(s.pretest, s.posttest).gain);

  grades.forEach((g) => {
    const key = String(g);
    emptyGrades[key] = (emptyGrades[key] || 0) + 1;
  });

  const tTest = calculateDependentTTest(students);
  const meanGPA = grades.reduce((a, b) => a + b, 0) / n;
  const avgGain = gains.reduce((a, b) => a + b, 0) / n;

  const passCriterionCount = postPcts.filter((pct) => pct >= targetCriterionPct).length;
  const atRiskCount = students.filter(
    (s) => calculatePosttestPct(s) < 70 || s.researchTargetGroup
  ).length;
  const highPerformingCount = postPcts.filter((pct) => pct >= 80).length;

  const plan1AttendancePct = Math.round(
    (students.filter((s) => s.completedPlan1).length / n) * 100
  );
  const plan2AttendancePct = Math.round(
    (students.filter((s) => s.completedPlan2).length / n) * 100
  );
  const plan3AttendancePct = Math.round(
    (students.filter((s) => s.completedPlan3).length / n) * 100
  );

  return {
    studentCount: n,
    meanPostScore: tTest.meanPost,
    meanPostPct: tTest.meanPostPct,
    sdPostScore: tTest.sdPost,
    maxPostScore: Math.max(...postScores),
    minPostScore: Math.min(...postScores),
    meanGPA: Math.round(meanGPA * 100) / 100,
    targetCriterionPct,
    targetCriterionScore,
    passCriterionCount,
    passCriterionRate: Math.round((passCriterionCount / n) * 1000) / 10,
    atRiskCount,
    highPerformingCount,
    averageNormalizedGain: Math.round(avgGain * 100) / 100,
    plan1AttendancePct,
    plan2AttendancePct,
    plan3AttendancePct,
    gradeDistribution: emptyGrades,
    tTest,
  };
}

export interface StudentDiagnosticProfile {
  student: StudentRecord;
  pretestPct: number;
  posttestPct: number;
  scoreDiff: number; // หลังเรียน - ก่อนเรียน (เต็ม 20)
  pctDiff: number; // ร้อยละที่เพิ่มขึ้น
  completedPlansCount: number;
  grade: number;
  gradeLabel: string;
  rank: number;
  percentile: number;
  normalizedGain: NormalizedGainResult;
  statusTier: 'At-Risk' | 'On-Track' | 'High-Performing';
  statusTierThai: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendedIntervention: string;
}

export function analyzeIndividualStudent(
  student: StudentRecord,
  allStudents: StudentRecord[]
): StudentDiagnosticProfile {
  const pretestPct = calculatePretestPct(student);
  const posttestPct = calculatePosttestPct(student);
  const scoreDiff = calculateScoreDiff(student);
  const pctDiff = Math.round((posttestPct - pretestPct) * 10) / 10;
  const completedPlansCount = countCompletedPlans(student);
  const grade = calculateThaiGrade(posttestPct);
  const gradeLabel = getGradeLabel(grade);
  const normalizedGain = calculateNormalizedGain(student.pretest, student.posttest);

  const sortedPost = [...allStudents]
    .map((s) => s.posttest)
    .sort((a, b) => b - a);
  const rank = sortedPost.findIndex((score) => score === student.posttest) + 1 || 1;
  const belowOrEqual = sortedPost.filter((score) => score <= student.posttest).length;
  const percentile =
    allStudents.length > 0 ? Math.round((belowOrEqual / allStudents.length) * 100) : 100;

  let statusTier: 'At-Risk' | 'On-Track' | 'High-Performing' = 'On-Track';
  let statusTierThai = 'ผ่านเกณฑ์มาตรฐาน (On-Track)';
  if (posttestPct < 70 || student.researchTargetGroup || normalizedGain.gain < 0.35) {
    statusTier = 'At-Risk';
    statusTierThai = 'กลุ่มเป้าหมายวิจัย / ต้องเสริมทักษะ (At-Risk)';
  } else if (posttestPct >= 80 && normalizedGain.gain >= 0.65) {
    statusTier = 'High-Performing';
    statusTierThai = 'ดาวเด่นประจำชั้นเรียน (High-Performing)';
  }

  const strengths: string[] = [];
  if (scoreDiff >= 7) {
    strengths.push(`คะแนนสอบหลังเรียนก้าวกระโดดเพิ่มขึ้น +${scoreDiff} คะแนน (จาก ${student.pretest} เป็น ${student.posttest}/20)`);
  } else if (scoreDiff > 0) {
    strengths.push(`มีพัฒนาการเพิ่มขึ้นหลังเรียน +${scoreDiff} คะแนน (คิดเป็น +${pctDiff}%)`);
  }
  if (completedPlansCount === 3) {
    strengths.push('เข้าร่วมกิจกรรมการเรียนรู้ครบถ้วนทั้ง 3 แผนการจัดการเรียนรู้');
  }
  if (normalizedGain.level === 'High Gain') {
    strengths.push(`ดัชนีพัฒนาการสัมพัทธ์อยู่ในระดับสูง (g = ${normalizedGain.gain.toFixed(2)})`);
  }

  const areasForImprovement: string[] = [];
  if (completedPlansCount < 3) {
    const missing: string[] = [];
    if (!student.completedPlan1) missing.push('แผนที่ 1');
    if (!student.completedPlan2) missing.push('แผนที่ 2');
    if (!student.completedPlan3) missing.push('แผนที่ 3');
    areasForImprovement.push(`ยังไม่ได้เข้าร่วมกิจกรรมใน ${missing.join(', ')} ควรติดตามซ่อมเสริม`);
  }
  if (student.posttest < 16) {
    areasForImprovement.push(
      `คะแนนสอบหลังเรียน (${student.posttest}/20) ยังต่ำกว่าเกณฑ์ร้อยละ 80 (16/20 คะแนน)`
    );
  }
  if (areasForImprovement.length === 0) {
    areasForImprovement.push('รักษามาตรฐานและฝึกทำโจทย์วิเคราะห์ขั้นสูงเพื่อพิชิตคะแนนเต็ม 20/20');
  }

  let recommendedIntervention =
    'มอบหมายให้เป็นเพื่อนช่วยสอน (Peer Mentor) ร่วมแลกเปลี่ยนเทคนิคการสรุปบทเรียนทั้ง 3 แผนให้เพื่อนในกลุ่ม';
  if (statusTier === 'At-Risk') {
    recommendedIntervention =
      'ทบทวนเนื้อหาจากชุดกิจกรรมการ์ตูนทั้ง 3 แผนควบคู่กับการทำแบบฝึกซ่อมเสริมรายบุคคล ก่อนทดสอบวัดผลหลังเรียนซ้ำ';
  } else if (statusTier === 'On-Track') {
    recommendedIntervention =
      'เสริมใบงานสรุปผังมโนทัศน์เชื่อมโยงเนื้อหาทั้ง 3 แผน เพื่อยกระดับคะแนนสอบหลังเรียนให้ผ่านเกณฑ์ร้อยละ 80 (16/20)';
  }

  return {
    student,
    pretestPct,
    posttestPct,
    scoreDiff,
    pctDiff,
    completedPlansCount,
    grade,
    gradeLabel,
    rank,
    percentile,
    normalizedGain,
    statusTier,
    statusTierThai,
    strengths,
    areasForImprovement,
    recommendedIntervention,
  };
}

// Serialization for Google Sheets Sync (No plan scores, no affective score)
export const GRADEBOOK_SHEET_HEADERS = [
  'รหัสนักเรียน',
  'คำนำหน้า',
  'ชื่อ',
  'นามสกุล',
  'ห้องเรียน',
  'สอบก่อนเรียน(20)',
  'เรียนแผนที่1',
  'เรียนแผนที่2',
  'เรียนแผนที่3',
  'สอบหลังเรียน(20)',
  'ผลต่างคะแนน(+/-)',
  'ร้อยละหลังเรียน(%)',
  'เกรด',
  'ค่าพัฒนาการ(g)',
  'กลุ่มเป้าหมายวิจัย',
  'รูปแบบการเรียนรู้',
  'บันทึกครูผู้สอน',
];

export function studentsToSheetRows(students: StudentRecord[]): (string | number)[][] {
  const rows: (string | number)[][] = [GRADEBOOK_SHEET_HEADERS];
  for (const s of students) {
    const diff = calculateScoreDiff(s);
    const postPct = calculatePosttestPct(s);
    const grade = calculateThaiGrade(postPct);
    const gain = calculateNormalizedGain(s.pretest, s.posttest).gain;
    rows.push([
      s.studentCode,
      s.prefix,
      s.firstName,
      s.lastName,
      s.classroom,
      s.pretest,
      s.completedPlan1 ? 'เรียนแล้ว' : 'ยังไม่เรียน',
      s.completedPlan2 ? 'เรียนแล้ว' : 'ยังไม่เรียน',
      s.completedPlan3 ? 'เรียนแล้ว' : 'ยังไม่เรียน',
      s.posttest,
      diff,
      postPct,
      grade,
      gain,
      s.researchTargetGroup ? 'ใช่' : 'ไม่ใช่',
      s.learningStyle,
      s.teacherNote,
    ]);
  }
  return rows;
}

export function sheetRowsToStudents(rows: any[][]): StudentRecord[] {
  if (!rows || rows.length <= 1) return [];
  const dataRows = rows.slice(1);
  return dataRows
    .filter((r) => r && r.length >= 4 && String(r[0] || '').trim() !== '')
    .map((r, idx) => {
      const learningStyleRaw = String(r[15] || 'Visual');
      const validStyles = ['Visual', 'Kinesthetic', 'Analytical', 'Collaborative'] as const;
      const learningStyle = (validStyles.includes(learningStyleRaw as any)
        ? learningStyleRaw
        : 'Visual') as StudentRecord['learningStyle'];

      const parsePlanDone = (val: any) => {
        const str = String(val ?? 'เรียนแล้ว').trim().toLowerCase();
        return str !== 'ยังไม่เรียน' && str !== 'false' && str !== '0';
      };

      return {
        id: `stu-${String(r[0]).trim() || idx + 1}`,
        studentCode: String(r[0] || '').trim(),
        prefix: String(r[1] || 'ด.ช.').trim(),
        firstName: String(r[2] || '').trim(),
        lastName: String(r[3] || '').trim(),
        classroom: String(r[4] || 'ม.3/1').trim(),
        pretest: clampScore(Number(r[5] ?? 0), SCORE_MAX.pretest),
        completedPlan1: parsePlanDone(r[6]),
        completedPlan2: parsePlanDone(r[7]),
        completedPlan3: parsePlanDone(r[8]),
        posttest: clampScore(Number(r[9] ?? 0), SCORE_MAX.posttest),
        researchTargetGroup:
          String(r[14] || '').trim() === 'ใช่' ||
          String(r[14] || '').toLowerCase() === 'true',
        learningStyle,
        teacherNote: String(r[16] || '').trim(),
      };
    });
}

export const INITIAL_RESEARCH_CONFIG: ResearchProjectConfig = {
  title:
    'การพัฒนาผลสัมฤทธิ์ทางการเรียนวิทยาศาสตร์โดยใช้การจัดการเรียนรู้ 3 แผน ร่วมกับการวัดผลสอบก่อนเรียน (20 คะแนน) และสอบหลังเรียน (20 คะแนน)',
  courseCode: 'ว23101',
  courseName: 'วิทยาศาสตร์พื้นฐาน 5',
  semester: 'ภาคเรียนที่ 1 / 2569',
  targetClassroom: 'ม.3/1',
  innovationName: 'ชุดกิจกรรมการ์ตูนวิทย์เชิงรุก 3 แผน (SciWIT Comic Lab)',
  targetCriterionPct: 80,
  researchHypothesis:
    '1) นักเรียนมีคะแนนสอบหลังเรียน (เต็ม 20 คะแนน) สูงกว่าก่อนเรียน (เต็ม 20 คะแนน) อย่างมีนัยสำคัญทางสถิติที่ระดับ .05 และ 2) นักเรียนมีคะแนนเฉลี่ยหลังเรียนผ่านเกณฑ์ร้อยละ 80 (16 คะแนนขึ้นไป)',
  lessonPlans: [
    {
      planNumber: 1,
      title: 'แผนการจัดการเรียนรู้ที่ 1: พันธุศาสตร์แสนสนุก',
      activityName: 'กิจกรรมการ์ตูนถอดรหัสยีนและตารางพันเนตต์ (ขั้นสอนแผนที่ 1)',
      durationHours: 3,
      targetSkill: 'เข้าใจหลักการถ่ายทอดลักษณะทางพันธุกรรม (ไม่เก็บคะแนนระหว่างแผน)',
    },
    {
      planNumber: 2,
      title: 'แผนการจัดการเรียนรู้ที่ 2: มหัศจรรย์คลื่นและแสง',
      activityName: 'ปฏิบัติการจำลองรังสีแสงและเลนส์หรรษา (ขั้นสอนแผนที่ 2)',
      durationHours: 3,
      targetSkill: 'อธิบายการสะท้อนและหักเหของแสงได้ถูกต้อง (ไม่เก็บคะแนนระหว่างแผน)',
    },
    {
      planNumber: 3,
      title: 'แผนการจัดการเรียนรู้ที่ 3: ตะลุยระบบสุริยะและอวกาศ',
      activityName: 'บอร์ดเกมสำรวจจักรวาลและเทคโนโลยีอวกาศ (ขั้นสอนแผนที่ 3)',
      durationHours: 3,
      targetSkill: 'เชื่อมโยงปรากฏการณ์ดาราศาสตร์และเทคโนโลยีอวกาศ (ไม่เก็บคะแนนระหว่างแผน)',
    },
  ],
  planSummary:
    'ขั้นตอนที่ 1 (Plan): จัดสอบวัดความรู้ก่อนเรียน (Pre-test เต็ม 20 คะแนน) เพื่อคัดกรองผู้เรียนรายบุคคล และเตรียมแผนการจัดการเรียนรู้ทั้ง 3 แผน (โดยไม่เก็บคะแนนในแผนและไม่เก็บจิตพิสัย)',
  actSummary:
    'ขั้นตอนที่ 2 (Act): ดำเนินการจัดกิจกรรมการเรียนรู้ตามแผนที่ 1, แผนที่ 2 และแผนที่ 3 จนครบสมบูรณ์ เน้นให้นักเรียนทำกิจกรรมกลุ่มและเข้าใจมโนทัศน์หลักโดยไม่มีความกดดันเรื่องคะแนนเก็บรายแผน',
  observeSummary:
    'ขั้นตอนที่ 3 (Observe): เมื่อสอนครบทั้ง 3 แผนแล้ว จึงจัดสอบวัดผลหลังเรียน (Post-test เต็ม 20 คะแนน) เพื่อวัดผลสัมฤทธิ์ทางการเรียนรวบยอด',
  reflectSummary:
    'ขั้นตอนที่ 4 (Reflect): นำคะแนนสอบก่อนเรียน (20 คะแนน) และสอบหลังเรียน (20 คะแนน) มาวิเคราะห์ผลต่าง (Gain Score), ค่าพัฒนาการสัมพัทธ์ (Normalized Gain g) และสถิติ Paired t-test รายบุคคล',
};

export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'stu-30101',
    studentCode: '30101',
    prefix: 'ด.ช.',
    firstName: 'กิตติภพ',
    lastName: 'รัตนโชติ',
    classroom: 'ม.3/1',
    pretest: 11,
    completedPlan1: true,
    completedPlan2: true,
    completedPlan3: true,
    posttest: 18.5,
    learningStyle: 'Analytical',
    researchTargetGroup: false,
    teacherNote: 'เข้าเรียนครบทั้ง 3 แผน คะแนนสอบหลังเรียนพุ่งจาก 11/20 เป็น 18.5/20 (+7.5 คะแนน)',
  },
  {
    id: 'stu-30102',
    studentCode: '30102',
    prefix: 'ด.ญ.',
    firstName: 'ชนิกานต์',
    lastName: 'วงศ์สวัสดิ์',
    classroom: 'ม.3/1',
    pretest: 12,
    completedPlan1: true,
    completedPlan2: true,
    completedPlan3: true,
    posttest: 19,
    learningStyle: 'Visual',
    researchTargetGroup: false,
    teacherNote: 'ร่วมกิจกรรมครบทั้ง 3 แผน สอบหลังเรียนได้ 19/20 (95%) พัฒนาการดีเยี่ยม',
  },
  {
    id: 'stu-30103',
    studentCode: '30103',
    prefix: 'ด.ช.',
    firstName: 'ณัฐภัทร',
    lastName: 'ศรีสุวรรณ',
    classroom: 'ม.3/1',
    pretest: 7,
    completedPlan1: true,
    completedPlan2: true,
    completedPlan3: true,
    posttest: 15,
    learningStyle: 'Kinesthetic',
    researchTargetGroup: true,
    teacherNote: 'กลุ่มเป้าหมายวิจัย: ก่อนเรียนได้ 7/20 หลังเรียนครบ 3 แผนสอบได้ 15/20 เพิ่มขึ้น +8 คะแนน!',
  },
  {
    id: 'stu-30104',
    studentCode: '30104',
    prefix: 'ด.ญ.',
    firstName: 'ธนัชชา',
    lastName: 'เจริญผล',
    classroom: 'ม.3/1',
    pretest: 10,
    completedPlan1: true,
    completedPlan2: true,
    completedPlan3: true,
    posttest: 17,
    learningStyle: 'Collaborative',
    researchTargetGroup: false,
    teacherNote: 'เรียนครบ 3 แผน คะแนนสอบจาก 10/20 เพิ่มเป็น 17/20 (85%)',
  },
  {
    id: 'stu-30105',
    studentCode: '30105',
    prefix: 'ด.ช.',
    firstName: 'ปุณณวิช',
    lastName: 'อินทร์จันทร์',
    classroom: 'ม.3/1',
    pretest: 6,
    completedPlan1: true,
    completedPlan2: true,
    completedPlan3: true,
    posttest: 14,
    learningStyle: 'Visual',
    researchTargetGroup: true,
    teacherNote: 'กลุ่มเป้าหมายวิจัย: ก่อนเรียนได้ 6/20 หลังเรียนครบ 3 แผนได้ 14/20 (+8 คะแนน)',
  },
  {
    id: 'stu-30106',
    studentCode: '30106',
    prefix: 'ด.ญ.',
    firstName: 'พิมพ์ชนก',
    lastName: 'เกียรติขจร',
    classroom: 'ม.3/1',
    pretest: 9.5,
    completedPlan1: true,
    completedPlan2: true,
    completedPlan3: true,
    posttest: 16.5,
    learningStyle: 'Collaborative',
    researchTargetGroup: false,
    teacherNote: 'มีส่วนร่วมในกิจกรรมทั้ง 3 แผนดีมาก สอบหลังเรียนได้ 16.5/20',
  },
  {
    id: 'stu-30107',
    studentCode: '30107',
    prefix: 'ด.ช.',
    firstName: 'ศุภกร',
    lastName: 'ตั้งจิตต์',
    classroom: 'ม.3/1',
    pretest: 6.5,
    completedPlan1: true,
    completedPlan2: false,
    completedPlan3: true,
    posttest: 13.5,
    learningStyle: 'Kinesthetic',
    researchTargetGroup: true,
    teacherNote: 'กลุ่มเป้าหมายวิจัย: ขาดเรียนแผนที่ 2 กำลังติดตามซ่อมเสริมกิจกรรมเรื่องคลื่นและแสง',
  },
  {
    id: 'stu-30108',
    studentCode: '30108',
    prefix: 'ด.ญ.',
    firstName: 'อภิชญา',
    lastName: 'เลิศปัญญา',
    classroom: 'ม.3/1',
    pretest: 13,
    completedPlan1: true,
    completedPlan2: true,
    completedPlan3: true,
    posttest: 19.5,
    learningStyle: 'Analytical',
    researchTargetGroup: false,
    teacherNote: 'คะแนนสอบหลังเรียนสูงสุดของห้อง 19.5/20 (97.5%)',
  },
  {
    id: 'stu-30109',
    studentCode: '30109',
    prefix: 'ด.ช.',
    firstName: 'อชิรวิทย์',
    lastName: 'ทองดี',
    classroom: 'ม.3/1',
    pretest: 8,
    completedPlan1: true,
    completedPlan2: true,
    completedPlan3: true,
    posttest: 16,
    learningStyle: 'Visual',
    researchTargetGroup: true,
    teacherNote: 'กลุ่มเป้าหมายวิจัย: ก่อนเรียนได้ 8/20 หลังเรียนครบ 3 แผนได้ 16/20 (80% ผ่านเกณฑ์ดีเยี่ยม)',
  },
  {
    id: 'stu-30110',
    studentCode: '30110',
    prefix: 'ด.ญ.',
    firstName: 'เขมจิรา',
    lastName: 'นันทวงศ์',
    classroom: 'ม.3/1',
    pretest: 10.5,
    completedPlan1: true,
    completedPlan2: true,
    completedPlan3: true,
    posttest: 17.5,
    learningStyle: 'Analytical',
    researchTargetGroup: false,
    teacherNote: 'เรียนครบทั้ง 3 แผน สอบหลังเรียนได้ 17.5/20 (87.5%)',
  },
];

export const INITIAL_INTERVENTIONS: ResearchIntervention[] = [
  {
    id: 'int-101',
    date: '2026-09-12',
    studentId: 'stu-30109',
    studentName: 'ด.ช. อชิรวิทย์ ทองดี',
    paorStage: 'Act',
    lessonPlanNumber: 1,
    innovationUsed: 'กิจกรรมการ์ตูนตารางพันเนตต์จำลองสี (สอนแผนที่ 1)',
    problemObserved: 'สอบก่อนเรียนได้ 8/20 เพราะสับสนการจับคู่ยีนเด่น-ยีนด้อย',
    scoreBefore: 8,
    scoreAfter: 16,
    reflectionOutcome: 'หลังเรียนครบ 3 แผน สอบหลังเรียนได้ 16/20 เพิ่มขึ้น +8 คะแนน (g = 0.67)',
    status: 'บรรลุเป้าหมาย',
  },
  {
    id: 'int-102',
    date: '2026-09-25',
    studentId: 'stu-30103',
    studentName: 'ด.ช. ณัฐภัทร ศรีสุวรรณ',
    paorStage: 'Observe',
    lessonPlanNumber: 2,
    innovationUsed: 'แล็บการ์ตูนจำลองการหักเหของแสง (สอนแผนที่ 2)',
    problemObserved: 'สอบก่อนเรียนได้ 7/20 ไม่เข้าใจทิศทางรังสีของแสงเมื่อผ่านเลนส์',
    scoreBefore: 7,
    scoreAfter: 15,
    reflectionOutcome: 'เข้าใจแผนภาพรังสีแสง ทำคะแนนสอบหลังเรียนได้ 15/20 (+8 คะแนน)',
    status: 'บรรลุเป้าหมาย',
  },
  {
    id: 'int-103',
    date: '2026-10-04',
    studentId: 'stu-30105',
    studentName: 'ด.ช. ปุณณวิช อินทร์จันทร์',
    paorStage: 'Reflect',
    lessonPlanNumber: 3,
    innovationUsed: 'บอร์ดเกมสำรวจระบบสุริยะคู่ขนานเพื่อนช่วยเพื่อน (สอนแผนที่ 3)',
    problemObserved: 'สอบก่อนเรียนได้ 6/20 ขาดความมั่นใจในการเชื่อมโยงเนื้อหา',
    scoreBefore: 6,
    scoreAfter: 14,
    reflectionOutcome: 'เรียนครบทั้ง 3 แผนแล้ว สอบหลังเรียนเพิ่มเป็น 14/20 (+8 คะแนน)',
    status: 'บรรลุเป้าหมาย',
  },
  {
    id: 'int-104',
    date: '2026-10-11',
    studentId: 'stu-30107',
    studentName: 'ด.ช. ศุภกร ตั้งจิตต์',
    paorStage: 'Plan',
    lessonPlanNumber: 2,
    innovationUsed: 'ชุดฝึกการ์ตูนซ่อมเสริมนอกเวลา (สอนแผนที่ 2)',
    problemObserved: 'สอบก่อนเรียนได้ 6.5/20 และขาดเรียนในคาบแผนที่ 2',
    scoreBefore: 6.5,
    scoreAfter: 13.5,
    reflectionOutcome: 'สอบหลังเรียนเพิ่มเป็น 13.5/20 กำลังนัดหมายซ่อมเสริมกิจกรรมแผนที่ 2 ให้ครบ',
    status: 'กำลังดำเนินการ',
  },
];
