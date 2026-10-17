export interface StudentRecord {
  id: string;
  studentCode: string;
  prefix: string;
  firstName: string;
  lastName: string;
  classroom: string;
  attendanceRate: number; // 0 - 100
  pretest: number; // Max 20 (สอบก่อนเรียน 20 คะแนน)
  unit1: number; // Max 20 (สอนแผนที่ 1: 20 คะแนน)
  unit2: number; // Max 20 (สอนแผนที่ 2: 20 คะแนน)
  unit3: number; // Max 20 (สอนแผนที่ 3: 20 คะแนน)
  posttest: number; // Max 20 (สอบหลังเรียน 20 คะแนน - E2)
  affective: number; // Max 20 (จิตพิสัยและการมีส่วนร่วม 20 คะแนน)
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
  scoreBefore: number;
  scoreAfter: number;
  reflectionOutcome: string;
  status: 'กำลังดำเนินการ' | 'บรรลุเป้าหมาย' | 'ต้องปรับแผนซ้ำ';
}

export interface LessonPlanSpec {
  planNumber: 1 | 2 | 3;
  title: string;
  activityName: string;
  maxScore: number;
  targetSkill: string;
}

export interface ResearchProjectConfig {
  title: string;
  courseCode: string;
  courseName: string;
  semester: string;
  targetClassroom: string;
  innovationName: string;
  criterionE1: number; // e.g., 80
  criterionE2: number; // e.g., 80
  researchHypothesis: string;
  lessonPlans: LessonPlanSpec[];
  planSummary: string;
  actSummary: string;
  observeSummary: string;
  reflectSummary: string;
}

export const SCORE_MAX = {
  pretest: 20, // สอบก่อนเรียน 20 คะแนน
  unit1: 20, // แผนการจัดการเรียนรู้ที่ 1 (20 คะแนน)
  unit2: 20, // แผนการจัดการเรียนรู้ที่ 2 (20 คะแนน)
  unit3: 20, // แผนการจัดการเรียนรู้ที่ 3 (20 คะแนน)
  posttest: 20, // สอบหลังเรียน 20 คะแนน
  affective: 20, // จิตพิสัย 20 คะแนน
  total: 100, // แผน 1 (20) + แผน 2 (20) + แผน 3 (20) + หลังเรียน (20) + จิตพิสัย (20) = 100
  formativeTotal: 60, // รวมคะแนนระหว่างเรียน 3 แผน (20 + 20 + 20 = 60 คะแนน สำหรับคำนวณ E1)
} as const;

export function clampScore(value: number, max: number): number {
  if (Number.isNaN(value) || value < 0) return 0;
  if (value > max) return max;
  return Math.round(value * 10) / 10;
}

// คะแนนรวมระหว่างเรียน 3 แผน (เต็ม 60 คะแนน) สำหรับคำนวณ E1
export function calculateThreePlansScore(
  student: Pick<StudentRecord, 'unit1' | 'unit2' | 'unit3'>
): number {
  const sum =
    Number(student.unit1 || 0) +
    Number(student.unit2 || 0) +
    Number(student.unit3 || 0);
  return Math.round(sum * 10) / 10;
}

// คะแนนรวมสุทธิ 100 คะแนน = แผนที่ 1 (20) + แผนที่ 2 (20) + แผนที่ 3 (20) + สอบหลังเรียน (20) + จิตพิสัย (20)
export function calculateTotalScore(
  student: Pick<StudentRecord, 'unit1' | 'unit2' | 'unit3' | 'posttest' | 'affective'>
): number {
  const sum =
    Number(student.unit1 || 0) +
    Number(student.unit2 || 0) +
    Number(student.unit3 || 0) +
    Number(student.posttest || 0) +
    Number(student.affective || 0);
  return Math.round(sum * 10) / 10;
}

export function calculateFormativeScore(
  student: Pick<StudentRecord, 'unit1' | 'unit2' | 'unit3'>
): number {
  return calculateThreePlansScore(student);
}

export function calculateThaiGrade(totalScore: number): number {
  if (totalScore >= 80) return 4;
  if (totalScore >= 75) return 3.5;
  if (totalScore >= 70) return 3;
  if (totalScore >= 65) return 2.5;
  if (totalScore >= 60) return 2;
  if (totalScore >= 55) return 1.5;
  if (totalScore >= 50) return 1;
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

export interface E1E2AnalysisResult {
  e1: number; // ประสิทธิภาพกระบวนการจากคะแนนรวม 3 แผน (เต็ม 60)
  e2: number; // ประสิทธิภาพผลลัพธ์จากคะแนนสอบหลังเรียน (เต็ม 20)
  plan1Pct: number;
  plan2Pct: number;
  plan3Pct: number;
  criterionE1: number;
  criterionE2: number;
  meetsE1: boolean;
  meetsE2: boolean;
  meetsBoth: boolean;
}

export function calculateE1E2(
  students: StudentRecord[],
  criterionE1: number = 80,
  criterionE2: number = 80
): E1E2AnalysisResult {
  if (students.length === 0) {
    return {
      e1: 0,
      e2: 0,
      plan1Pct: 0,
      plan2Pct: 0,
      plan3Pct: 0,
      criterionE1,
      criterionE2,
      meetsE1: false,
      meetsE2: false,
      meetsBoth: false,
    };
  }

  const n = students.length;
  const plan1Pct =
    Math.round(
      (students.reduce((acc, s) => acc + (s.unit1 / SCORE_MAX.unit1) * 100, 0) / n) * 10
    ) / 10;
  const plan2Pct =
    Math.round(
      (students.reduce((acc, s) => acc + (s.unit2 / SCORE_MAX.unit2) * 100, 0) / n) * 10
    ) / 10;
  const plan3Pct =
    Math.round(
      (students.reduce((acc, s) => acc + (s.unit3 / SCORE_MAX.unit3) * 100, 0) / n) * 10
    ) / 10;

  const totalFormativePct = students.reduce((acc, s) => {
    const threePlans = calculateThreePlansScore(s);
    return acc + (threePlans / SCORE_MAX.formativeTotal) * 100;
  }, 0);

  const totalPosttestPct = students.reduce((acc, s) => {
    return acc + (s.posttest / SCORE_MAX.posttest) * 100;
  }, 0);

  const e1 = Math.round((totalFormativePct / n) * 100) / 100;
  const e2 = Math.round((totalPosttestPct / n) * 100) / 100;

  const meetsE1 = e1 >= criterionE1;
  const meetsE2 = e2 >= criterionE2;

  return {
    e1,
    e2,
    plan1Pct,
    plan2Pct,
    plan3Pct,
    criterionE1,
    criterionE2,
    meetsE1,
    meetsE2,
    meetsBoth: meetsE1 && meetsE2,
  };
}

export interface DependentTTestResult {
  meanPre: number;
  sdPre: number;
  meanPost: number;
  sdPost: number;
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
    return {
      meanPre: n === 1 ? students[0].pretest : 0,
      sdPre: 0,
      meanPost: n === 1 ? students[0].posttest : 0,
      sdPost: 0,
      meanDiff: n === 1 ? students[0].posttest - students[0].pretest : 0,
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
    meanPost: Math.round(meanPost * 100) / 100,
    sdPost: Math.round(sdPost * 100) / 100,
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
  meanTotal: number;
  sdTotal: number;
  maxTotal: number;
  minTotal: number;
  meanGPA: number;
  passCount: number;
  passRate: number;
  atRiskCount: number;
  highPerformingCount: number;
  averageNormalizedGain: number;
  gradeDistribution: Record<string, number>;
  e1e2: E1E2AnalysisResult;
  tTest: DependentTTestResult;
}

export function calculateClassSummary(
  students: StudentRecord[],
  criterionE1: number = 80,
  criterionE2: number = 80
): ClassSummaryStats {
  const n = students.length;
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
      meanTotal: 0,
      sdTotal: 0,
      maxTotal: 0,
      minTotal: 0,
      meanGPA: 0,
      passCount: 0,
      passRate: 0,
      atRiskCount: 0,
      highPerformingCount: 0,
      averageNormalizedGain: 0,
      gradeDistribution: emptyGrades,
      e1e2: calculateE1E2([], criterionE1, criterionE2),
      tTest: calculateDependentTTest([]),
    };
  }

  const totals = students.map((s) => calculateTotalScore(s));
  const grades = totals.map((t) => calculateThaiGrade(t));
  const gains = students.map((s) => calculateNormalizedGain(s.pretest, s.posttest).gain);

  grades.forEach((g) => {
    const key = String(g);
    emptyGrades[key] = (emptyGrades[key] || 0) + 1;
  });

  const meanTotal = totals.reduce((a, b) => a + b, 0) / n;
  const varTotal =
    n > 1 ? totals.reduce((acc, v) => acc + Math.pow(v - meanTotal, 2), 0) / (n - 1) : 0;
  const sdTotal = Math.sqrt(varTotal);
  const meanGPA = grades.reduce((a, b) => a + b, 0) / n;
  const avgGain = gains.reduce((a, b) => a + b, 0) / n;

  const passCount = totals.filter((t) => t >= 50).length;
  const atRiskCount = students.filter(
    (s) => calculateTotalScore(s) < 65 || s.researchTargetGroup || s.posttest < 14
  ).length;
  const highPerformingCount = totals.filter((t) => t >= 80).length;

  return {
    studentCount: n,
    meanTotal: Math.round(meanTotal * 100) / 100,
    sdTotal: Math.round(sdTotal * 100) / 100,
    maxTotal: Math.max(...totals),
    minTotal: Math.min(...totals),
    meanGPA: Math.round(meanGPA * 100) / 100,
    passCount,
    passRate: Math.round((passCount / n) * 1000) / 10,
    atRiskCount,
    highPerformingCount,
    averageNormalizedGain: Math.round(avgGain * 100) / 100,
    gradeDistribution: emptyGrades,
    e1e2: calculateE1E2(students, criterionE1, criterionE2),
    tTest: calculateDependentTTest(students),
  };
}

export interface StudentDiagnosticProfile {
  student: StudentRecord;
  totalScore: number;
  formativeScore: number; // คะแนนรวม 3 แผน (เต็ม 60)
  formativePct: number; // E1 รายบุคคล (%)
  pretestPct: number;
  posttestPct: number; // E2 รายบุคคล (%)
  scoreDiff: number; // หลังเรียน - ก่อนเรียน
  grade: number;
  gradeLabel: string;
  rank: number;
  percentile: number;
  normalizedGain: NormalizedGainResult;
  statusTier: 'At-Risk' | 'On-Track' | 'High-Performing';
  statusTierThai: string;
  competencies: {
    name: string;
    score: number;
    maxScore: number;
    scorePct: number;
    classAvgPct: number;
    description: string;
  }[];
  strengths: string[];
  areasForImprovement: string[];
  recommendedIntervention: string;
}

export function analyzeIndividualStudent(
  student: StudentRecord,
  allStudents: StudentRecord[]
): StudentDiagnosticProfile {
  const totalScore = calculateTotalScore(student);
  const formativeScore = calculateThreePlansScore(student);
  const formativePct = Math.round((formativeScore / SCORE_MAX.formativeTotal) * 1000) / 10;
  const pretestPct = Math.round((student.pretest / SCORE_MAX.pretest) * 1000) / 10;
  const posttestPct = Math.round((student.posttest / SCORE_MAX.posttest) * 1000) / 10;
  const scoreDiff = Math.round((student.posttest - student.pretest) * 10) / 10;
  const grade = calculateThaiGrade(totalScore);
  const gradeLabel = getGradeLabel(grade);
  const normalizedGain = calculateNormalizedGain(student.pretest, student.posttest);

  const sortedTotals = [...allStudents]
    .map((s) => calculateTotalScore(s))
    .sort((a, b) => b - a);
  const rank = sortedTotals.findIndex((t) => t === totalScore) + 1 || 1;
  const belowOrEqual = sortedTotals.filter((t) => t <= totalScore).length;
  const percentile =
    allStudents.length > 0 ? Math.round((belowOrEqual / allStudents.length) * 100) : 100;

  const avgPrePct =
    allStudents.length > 0
      ? (allStudents.reduce((a, s) => a + s.pretest, 0) / allStudents.length / SCORE_MAX.pretest) *
        100
      : 50;
  const avgUnit1Pct =
    allStudents.length > 0
      ? (allStudents.reduce((a, s) => a + s.unit1, 0) / allStudents.length / SCORE_MAX.unit1) * 100
      : 80;
  const avgUnit2Pct =
    allStudents.length > 0
      ? (allStudents.reduce((a, s) => a + s.unit2, 0) / allStudents.length / SCORE_MAX.unit2) * 100
      : 80;
  const avgUnit3Pct =
    allStudents.length > 0
      ? (allStudents.reduce((a, s) => a + s.unit3, 0) / allStudents.length / SCORE_MAX.unit3) * 100
      : 80;
  const avgPostPct =
    allStudents.length > 0
      ? (allStudents.reduce((a, s) => a + s.posttest, 0) /
          allStudents.length /
          SCORE_MAX.posttest) *
        100
      : 80;

  const competencies = [
    {
      name: 'สอบก่อนเรียน (Pre-test)',
      score: student.pretest,
      maxScore: 20,
      scorePct: Math.round((student.pretest / SCORE_MAX.pretest) * 100),
      classAvgPct: Math.round(avgPrePct),
      description: 'วัดความรู้พื้นฐานก่อนเริ่มเรียนด้วยนวัตกรรมทั้ง 3 แผน',
    },
    {
      name: 'สอนแผนที่ 1: พันธุศาสตร์แสนสนุก',
      score: student.unit1,
      maxScore: 20,
      scorePct: Math.round((student.unit1 / SCORE_MAX.unit1) * 100),
      classAvgPct: Math.round(avgUnit1Pct),
      description: 'กิจกรรมจำลองการจับคู่โครโมโซมและตารางพันเนตต์',
    },
    {
      name: 'สอนแผนที่ 2: มหัศจรรย์คลื่นและแสง',
      score: student.unit2,
      maxScore: 20,
      scorePct: Math.round((student.unit2 / SCORE_MAX.unit2) * 100),
      classAvgPct: Math.round(avgUnit2Pct),
      description: 'ปฏิบัติการทดลองเสมือนจริงเรื่องการสะท้อนและหักเหของแสง',
    },
    {
      name: 'สอนแผนที่ 3: ตะลุยระบบสุริยะและอวกาศ',
      score: student.unit3,
      maxScore: 20,
      scorePct: Math.round((student.unit3 / SCORE_MAX.unit3) * 100),
      classAvgPct: Math.round(avgUnit3Pct),
      description: 'สร้างแบบจำลองปรากฏการณ์ดาราศาสตร์และเทคโนโลยีอวกาศ',
    },
    {
      name: 'สอบหลังเรียน (Post-test E2)',
      score: student.posttest,
      maxScore: 20,
      scorePct: Math.round((student.posttest / SCORE_MAX.posttest) * 100),
      classAvgPct: Math.round(avgPostPct),
      description: 'วัดผลสัมฤทธิ์รวบยอดหลังเรียนครบทั้ง 3 แผนการจัดการเรียนรู้',
    },
  ];

  const planCompetencies = competencies.slice(1, 4);
  const strengths = planCompetencies
    .filter((c) => c.scorePct >= 80)
    .map((c) => `${c.name} (${c.score}/${c.maxScore} คะแนน)`);
  const areasForImprovement = planCompetencies
    .filter((c) => c.scorePct < 75)
    .map((c) => `${c.name} (${c.score}/${c.maxScore} คะแนน)`);

  let statusTier: 'At-Risk' | 'On-Track' | 'High-Performing' = 'On-Track';
  let statusTierThai = 'ผ่านเกณฑ์ตามแผน (On-Track)';
  if (totalScore < 65 || student.researchTargetGroup || normalizedGain.gain < 0.35) {
    statusTier = 'At-Risk';
    statusTierThai = 'กลุ่มเป้าหมายวิจัย / ต้องซ่อมเสริม (At-Risk)';
  } else if (totalScore >= 80 && normalizedGain.gain >= 0.65) {
    statusTier = 'High-Performing';
    statusTierThai = 'ดาวเด่นประจำชั้นเรียน (High-Performing)';
  }

  const weakestPlan = [...planCompetencies].sort((a, b) => a.scorePct - b.scorePct)[0];
  let recommendedIntervention =
    'มอบหมายภารกิจหัวหน้าทีมนักวิทย์น้อย (Peer Mentor) ช่วยแนะนำเพื่อนในกิจกรรมกลุ่มทั้ง 3 แผน';
  if (statusTier === 'At-Risk') {
    recommendedIntervention = `จัดซ่อมเสริมนอกเวลาด้วยชุดการ์ตูนวิทย์อินเทอร์แอคทีฟ เน้นทบทวน "${weakestPlan.name}" ก่อนสอบวัดผลซ้ำ`;
  } else if (statusTier === 'On-Track') {
    recommendedIntervention = `เสริมแบบฝึกทักษะการ์ตูนสรุปมโนทัศน์ใน "${weakestPlan.name}" เพื่อยกระดับคะแนนสอบหลังเรียนสู่ระดับดีเยี่ยม`;
  }

  return {
    student,
    totalScore,
    formativeScore,
    formativePct,
    pretestPct,
    posttestPct,
    scoreDiff,
    grade,
    gradeLabel,
    rank,
    percentile,
    normalizedGain,
    statusTier,
    statusTierThai,
    competencies,
    strengths:
      strengths.length > 0
        ? strengths
        : ['มีพัฒนาการคะแนนหลังเรียนสูงขึ้นเมื่อเทียบกับก่อนเรียน'],
    areasForImprovement:
      areasForImprovement.length > 0
        ? areasForImprovement
        : ['ควรฝึกโจทย์ประยุกต์เพิ่มเติมเพื่อความแม่นยำเต็ม 20 คะแนน'],
    recommendedIntervention,
  };
}

// Serialization for Google Sheets Sync (3-Plan Research Structure)
export const GRADEBOOK_SHEET_HEADERS = [
  'รหัสนักเรียน',
  'คำนำหน้า',
  'ชื่อ',
  'นามสกุล',
  'ห้องเรียน',
  'เวลาเรียน(%)',
  'สอบก่อนเรียน(20)',
  'แผนที่1(20)',
  'แผนที่2(20)',
  'แผนที่3(20)',
  'รวม3แผน_E1(60)',
  'สอบหลังเรียน_E2(20)',
  'จิตพิสัย(20)',
  'คะแนนรวม(100)',
  'เกรด',
  'ค่าพัฒนาการ(g)',
  'กลุ่มเป้าหมายวิจัย',
  'รูปแบบการเรียนรู้',
  'บันทึกครูผู้สอน',
];

export function studentsToSheetRows(students: StudentRecord[]): (string | number)[][] {
  const rows: (string | number)[][] = [GRADEBOOK_SHEET_HEADERS];
  for (const s of students) {
    const threePlans = calculateThreePlansScore(s);
    const total = calculateTotalScore(s);
    const grade = calculateThaiGrade(total);
    const gain = calculateNormalizedGain(s.pretest, s.posttest).gain;
    rows.push([
      s.studentCode,
      s.prefix,
      s.firstName,
      s.lastName,
      s.classroom,
      s.attendanceRate,
      s.pretest,
      s.unit1,
      s.unit2,
      s.unit3,
      threePlans,
      s.posttest,
      s.affective,
      total,
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
      const learningStyleRaw = String(r[17] || 'Visual');
      const validStyles = ['Visual', 'Kinesthetic', 'Analytical', 'Collaborative'] as const;
      const learningStyle = (validStyles.includes(learningStyleRaw as any)
        ? learningStyleRaw
        : 'Visual') as StudentRecord['learningStyle'];

      return {
        id: `stu-${String(r[0]).trim() || idx + 1}`,
        studentCode: String(r[0] || '').trim(),
        prefix: String(r[1] || 'ด.ช.').trim(),
        firstName: String(r[2] || '').trim(),
        lastName: String(r[3] || '').trim(),
        classroom: String(r[4] || 'ม.3/1').trim(),
        attendanceRate: clampScore(Number(r[5] ?? 95), 100),
        pretest: clampScore(Number(r[6] ?? 0), SCORE_MAX.pretest),
        unit1: clampScore(Number(r[7] ?? 0), SCORE_MAX.unit1),
        unit2: clampScore(Number(r[8] ?? 0), SCORE_MAX.unit2),
        unit3: clampScore(Number(r[9] ?? 0), SCORE_MAX.unit3),
        posttest: clampScore(Number(r[11] ?? 0), SCORE_MAX.posttest),
        affective: clampScore(Number(r[12] ?? 0), SCORE_MAX.affective),
        researchTargetGroup:
          String(r[16] || '').trim() === 'ใช่' ||
          String(r[16] || '').toLowerCase() === 'true',
        learningStyle,
        teacherNote: String(r[18] || '').trim(),
      };
    });
}

export const INITIAL_RESEARCH_CONFIG: ResearchProjectConfig = {
  title:
    'การพัฒนาผลสัมฤทธิ์ทางการเรียนวิทยาศาสตร์โดยใช้ชุดกิจกรรมการ์ตูนวิทย์เชิงรุก 3 แผนการจัดการเรียนรู้ ร่วมกับการวัดผลก่อนเรียนและหลังเรียน',
  courseCode: 'ว23101',
  courseName: 'วิทยาศาสตร์พื้นฐาน 5',
  semester: 'ภาคเรียนที่ 1 / 2569',
  targetClassroom: 'ม.3/1',
  innovationName: 'ชุดกิจกรรมการ์ตูนวิทย์เชิงรุก 3 แผน (SciWIT Comic Lab)',
  criterionE1: 80,
  criterionE2: 80,
  researchHypothesis:
    '1) ประสิทธิภาพของชุดกิจกรรมการเรียนรู้ทั้ง 3 แผน (E1/E2) สูงกว่าเกณฑ์ 80/80 และ 2) คะแนนสอบหลังเรียน (20 คะแนน) สูงกว่าสอบก่อนเรียน (20 คะแนน) อย่างมีนัยสำคัญทางสถิติที่ระดับ .05',
  lessonPlans: [
    {
      planNumber: 1,
      title: 'แผนการจัดการเรียนรู้ที่ 1: พันธุศาสตร์แสนสนุก',
      activityName: 'ภารกิจถอดรหัสยีนด้วยการ์ตูนตารางพันเนตต์ (20 คะแนน)',
      maxScore: 20,
      targetSkill: 'การวิเคราะห์จีโนไทป์และฟีโนไทป์จากการ์ตูนสถานการณ์',
    },
    {
      planNumber: 2,
      title: 'แผนการจัดการเรียนรู้ที่ 2: มหัศจรรย์คลื่นและแสง',
      activityName: 'แล็บจำลองรังสีแสงและเลนส์หรรษา (20 คะแนน)',
      maxScore: 20,
      targetSkill: 'การเขียนแผนภาพรังสีของแสงและการคำนวณความถี่คลื่น',
    },
    {
      planNumber: 3,
      title: 'แผนการจัดการเรียนรู้ที่ 3: ตะลุยระบบสุริยะและอวกาศ',
      activityName: 'บอร์ดเกมสำรวจจักรวาลและเทคโนโลยีอวกาศ (20 คะแนน)',
      maxScore: 20,
      targetSkill: 'การเชื่อมโยงปรากฏการณ์ดาราศาสตร์และการประยุกต์ใช้ดาวเทียม',
    },
  ],
  planSummary:
    'ขั้นตอนที่ 1 (Plan): จัดสอบก่อนเรียน (Pre-test เต็ม 20 คะแนน) เพื่อวิเคราะห์พื้นฐานผู้เรียนรายบุคคล และออกแบบแผนการจัดการเรียนรู้เชิงรุก 3 แผน (แผนละ 20 คะแนน รวม 60 คะแนน)',
  actSummary:
    'ขั้นตอนที่ 2 (Act): ดำเนินการสอนตามแผนที่ 1, แผนที่ 2 และแผนที่ 3 ตามลำดับ พร้อมเก็บคะแนนใบงานและกิจกรรมระหว่างเรียนครบทั้ง 3 แผน',
  observeSummary:
    'ขั้นตอนที่ 3 (Observe): จัดสอบหลังเรียน (Post-test เต็ม 20 คะแนน) นำคะแนนทั้ง 3 แผนมาคำนวณค่า E1 และนำคะแนนสอบหลังเรียนมาคำนวณค่า E2',
  reflectSummary:
    'ขั้นตอนที่ 4 (Reflect): เปรียบเทียบคะแนนสอบก่อนเรียน (20) กับหลังเรียน (20) ด้วยสถิติ Paired t-test และค่า Normalized Gain (g) เพื่อสะท้อนผลการพัฒนารายบุคคล',
};

export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'stu-30101',
    studentCode: '30101',
    prefix: 'ด.ช.',
    firstName: 'กิตติภพ',
    lastName: 'รัตนโชติ',
    classroom: 'ม.3/1',
    attendanceRate: 98,
    pretest: 11,
    unit1: 18,
    unit2: 17.5,
    unit3: 18.5,
    posttest: 18.5,
    affective: 19,
    learningStyle: 'Analytical',
    researchTargetGroup: false,
    teacherNote: 'ทำกิจกรรมทั้ง 3 แผนได้ยอดเยี่ยม คะแนนสอบหลังเรียนพุ่งจาก 11 เป็น 18.5/20',
  },
  {
    id: 'stu-30102',
    studentCode: '30102',
    prefix: 'ด.ญ.',
    firstName: 'ชนิกานต์',
    lastName: 'วงศ์สวัสดิ์',
    classroom: 'ม.3/1',
    attendanceRate: 100,
    pretest: 12,
    unit1: 19,
    unit2: 18.5,
    unit3: 19,
    posttest: 19,
    affective: 20,
    learningStyle: 'Visual',
    researchTargetGroup: false,
    teacherNote: 'วาดผังมโนทัศน์การ์ตูนในแผนที่ 1 และ 3 ได้สวยงามและแม่นยำมาก',
  },
  {
    id: 'stu-30103',
    studentCode: '30103',
    prefix: 'ด.ช.',
    firstName: 'ณัฐภัทร',
    lastName: 'ศรีสุวรรณ',
    classroom: 'ม.3/1',
    attendanceRate: 90,
    pretest: 7,
    unit1: 14.5,
    unit2: 13.5,
    unit3: 15,
    posttest: 15,
    affective: 17,
    learningStyle: 'Kinesthetic',
    researchTargetGroup: true,
    teacherNote: 'กลุ่มเป้าหมายวิจัย: ก่อนเรียนได้ 7/20 หลังเรียนครบ 3 แผนได้ 15/20 พัฒนาขึ้นเกินเท่าตัว!',
  },
  {
    id: 'stu-30104',
    studentCode: '30104',
    prefix: 'ด.ญ.',
    firstName: 'ธนัชชา',
    lastName: 'เจริญผล',
    classroom: 'ม.3/1',
    attendanceRate: 96,
    pretest: 10,
    unit1: 17,
    unit2: 16.5,
    unit3: 17.5,
    posttest: 17,
    affective: 19,
    learningStyle: 'Collaborative',
    researchTargetGroup: false,
    teacherNote: 'ให้ความร่วมมือในบอร์ดเกมแผนที่ 3 ดีมาก คะแนนพัฒนาขึ้นสม่ำเสมอ',
  },
  {
    id: 'stu-30105',
    studentCode: '30105',
    prefix: 'ด.ช.',
    firstName: 'ปุณณวิช',
    lastName: 'อินทร์จันทร์',
    classroom: 'ม.3/1',
    attendanceRate: 86,
    pretest: 6,
    unit1: 13.5,
    unit2: 13,
    unit3: 14,
    posttest: 13.5,
    affective: 16,
    learningStyle: 'Visual',
    researchTargetGroup: true,
    teacherNote: 'กลุ่มเป้าหมายวิจัย: ใช้สื่อการ์ตูนช่วยจำในแผนที่ 1 และ 2 ทำให้คะแนนสอบหลังเรียนเพิ่มขึ้น +7.5 คะแนน',
  },
  {
    id: 'stu-30106',
    studentCode: '30106',
    prefix: 'ด.ญ.',
    firstName: 'พิมพ์ชนก',
    lastName: 'เกียรติขจร',
    classroom: 'ม.3/1',
    attendanceRate: 95,
    pretest: 9.5,
    unit1: 16.5,
    unit2: 16,
    unit3: 17,
    posttest: 16.5,
    affective: 18.5,
    learningStyle: 'Collaborative',
    researchTargetGroup: false,
    teacherNote: 'ตั้งคำถามและสรุปบทเรียนท้ายแผนที่ 2 และ 3 ได้ชัดเจน',
  },
  {
    id: 'stu-30107',
    studentCode: '30107',
    prefix: 'ด.ช.',
    firstName: 'ศุภกร',
    lastName: 'ตั้งจิตต์',
    classroom: 'ม.3/1',
    attendanceRate: 88,
    pretest: 6.5,
    unit1: 14,
    unit2: 12.5,
    unit3: 14,
    posttest: 13,
    affective: 16.5,
    learningStyle: 'Kinesthetic',
    researchTargetGroup: true,
    teacherNote: 'กลุ่มเป้าหมายวิจัย: ชอบกิจกรรมการทดลองในแผนที่ 2 แต่ยังต้องทบทวนสูตรคำนวณเพิ่มเติม',
  },
  {
    id: 'stu-30108',
    studentCode: '30108',
    prefix: 'ด.ญ.',
    firstName: 'อภิชญา',
    lastName: 'เลิศปัญญา',
    classroom: 'ม.3/1',
    attendanceRate: 100,
    pretest: 13,
    unit1: 19.5,
    unit2: 19,
    unit3: 19.5,
    posttest: 19.5,
    affective: 20,
    learningStyle: 'Analytical',
    researchTargetGroup: false,
    teacherNote: 'คะแนนสูงสุดทั้ง 3 แผนการเรียนรู้ และสอบหลังเรียนได้เกือบเต็ม 20 คะแนน',
  },
  {
    id: 'stu-30109',
    studentCode: '30109',
    prefix: 'ด.ช.',
    firstName: 'อชิรวิทย์',
    lastName: 'ทองดี',
    classroom: 'ม.3/1',
    attendanceRate: 92,
    pretest: 8,
    unit1: 15.5,
    unit2: 15,
    unit3: 16,
    posttest: 15.5,
    affective: 18,
    learningStyle: 'Visual',
    researchTargetGroup: true,
    teacherNote: 'กลุ่มเป้าหมายวิจัย: พัฒนาการโดดเด่นหลังเรียนครบ 3 แผน คะแนนรวมทะลุ 80 คะแนน (เกรด 4.0)',
  },
  {
    id: 'stu-30110',
    studentCode: '30110',
    prefix: 'ด.ญ.',
    firstName: 'เขมจิรา',
    lastName: 'นันทวงศ์',
    classroom: 'ม.3/1',
    attendanceRate: 97,
    pretest: 10.5,
    unit1: 17.5,
    unit2: 17,
    unit3: 18,
    posttest: 17.5,
    affective: 19,
    learningStyle: 'Analytical',
    researchTargetGroup: false,
    teacherNote: 'ส่งใบงานครบทั้ง 3 แผน คะแนนสอบหลังเรียน 17.5/20 อยู่ในเกณฑ์ดีเยี่ยม',
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
    innovationUsed: 'การ์ตูนตารางพันเนตต์จำลองสี (แผนที่ 1)',
    problemObserved: 'สอบก่อนเรียนได้ 8/20 เพราะสับสนการจับคู่ยีนเด่น-ยีนด้อย',
    scoreBefore: 8,
    scoreAfter: 15.5,
    reflectionOutcome: 'หลังเรียนแผนที่ 1 ได้ 15.5/20 และสอบหลังเรียนได้ 15.5/20 (g = 0.63)',
    status: 'บรรลุเป้าหมาย',
  },
  {
    id: 'int-102',
    date: '2026-09-25',
    studentId: 'stu-30103',
    studentName: 'ด.ช. ณัฐภัทร ศรีสุวรรณ',
    paorStage: 'Observe',
    lessonPlanNumber: 2,
    innovationUsed: 'แล็บการ์ตูนจำลองการหักเหของแสง (แผนที่ 2)',
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
    innovationUsed: 'บอร์ดเกมสำรวจระบบสุริยะคู่ขนานเพื่อนช่วยเพื่อน (แผนที่ 3)',
    problemObserved: 'สอบก่อนเรียนได้ 6/20 ขาดความมั่นใจในการเชื่อมโยงเนื้อหา',
    scoreBefore: 6,
    scoreAfter: 13.5,
    reflectionOutcome: 'คะแนนแผนที่ 3 ได้ 14/20 และสอบหลังเรียนเพิ่มเป็น 13.5/20',
    status: 'กำลังดำเนินการ',
  },
  {
    id: 'int-104',
    date: '2026-10-11',
    studentId: 'stu-30107',
    studentName: 'ด.ช. ศุภกร ตั้งจิตต์',
    paorStage: 'Plan',
    lessonPlanNumber: 2,
    innovationUsed: 'ชุดฝึกการ์ตูนแก้โจทย์คลื่นทีละขั้น (แผนที่ 2)',
    problemObserved: 'สอบก่อนเรียนได้ 6.5/20 และคะแนนแผนที่ 2 ได้ 12.5/20',
    scoreBefore: 6.5,
    scoreAfter: 13,
    reflectionOutcome: 'สอบหลังเรียนเพิ่มเป็น 13/20 กำลังเสริมทักษะการแทนค่าสมการเพิ่มเติม',
    status: 'ต้องปรับแผนซ้ำ',
  },
];
