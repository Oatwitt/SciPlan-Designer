import React, { useState, useMemo } from 'react';
import {
  Search,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Award,
  Sliders,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  StudentRecord,
  ClassSummaryStats,
  SCORE_MAX,
  calculatePosttestPct,
  calculateScoreDiff,
  countCompletedPlans,
  calculateThaiGrade,
  analyzeIndividualStudent,
  clampScore,
} from '../utils/analytics';

interface DashboardViewProps {
  students: StudentRecord[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  onUpdateStudent: (updated: StudentRecord) => void;
  classStats: ClassSummaryStats;
  courseTitle: string;
  onNavigateTab: (tab: 'dashboard' | 'gradebook' | 'research' | 'sheets') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  onUpdateStudent,
  classStats,
  courseTitle,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | 'target' | 'high'>('all');
  const [showQuickSim, setShowQuickSim] = useState(true);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const fullName = `${s.prefix}${s.firstName} ${s.lastName} ${s.studentCode}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const postPct = calculatePosttestPct(s);
      if (groupFilter === 'target') {
        return s.researchTargetGroup || postPct < 70;
      }
      if (groupFilter === 'high') {
        return postPct >= 80;
      }
      return true;
    });
  }, [students, searchQuery, groupFilter]);

  const activeStudent = useMemo(() => {
    return (
      students.find((s) => s.id === selectedStudentId) ||
      filteredStudents[0] ||
      students[0]
    );
  }, [students, selectedStudentId, filteredStudents]);

  const diagnostic = useMemo(() => {
    if (!activeStudent) return null;
    return analyzeIndividualStudent(activeStudent, students);
  }, [activeStudent, students]);

  const handleQuickScoreChange = (
    field: 'pretest' | 'posttest',
    rawVal: string
  ) => {
    if (!activeStudent) return;
    const clamped = clampScore(Number(rawVal), SCORE_MAX[field]);
    onUpdateStudent({
      ...activeStudent,
      [field]: clamped,
    });
  };

  const handleTogglePlanComplete = (
    planField: 'completedPlan1' | 'completedPlan2' | 'completedPlan3'
  ) => {
    if (!activeStudent) return;
    onUpdateStudent({
      ...activeStudent,
      [planField]: !activeStudent[planField],
    });
  };

  const handleToggleTargetGroup = () => {
    if (!activeStudent) return;
    onUpdateStudent({
      ...activeStudent,
      researchTargetGroup: !activeStudent.researchTargetGroup,
    });
  };

  const handleNoteChange = (note: string) => {
    if (!activeStudent) return;
    onUpdateStudent({
      ...activeStudent,
      teacherNote: note,
    });
  };

  const gradeKeys = ['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'];

  return (
    <div className="space-y-8">
      {/* Cartoon Hero Banner with Illustrated Scientist Mascot & 3-Plan Unscored Research Flow */}
      <div className="cartoon-card bg-[#fef08a] p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Custom Cartoon Owl Scientist Illustration */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_#0f172a] flex items-center justify-center p-2">
              <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden="true">
                <polygon points="40,6 70,18 40,30 10,18" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
                <line x1="62" y1="21" x2="66" y2="34" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                <circle cx="66" cy="35" r="3" fill="#f59e0b" />
                <ellipse cx="40" cy="48" rx="22" ry="22" fill="#38bdf8" stroke="#0f172a" strokeWidth="3" />
                <ellipse cx="40" cy="52" rx="14" ry="14" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
                <circle cx="31" cy="40" r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
                <circle cx="49" cy="40" r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
                <circle cx="32" cy="40" r="3.5" fill="#0f172a" />
                <circle cx="48" cy="40" r="3.5" fill="#0f172a" />
                <circle cx="30.5" cy="38.5" r="1.2" fill="#ffffff" />
                <circle cx="46.5" cy="38.5" r="1.2" fill="#ffffff" />
                <polygon points="37,45 43,45 40,51" fill="#fb923c" stroke="#0f172a" strokeWidth="2" />
                <path d="M18,45 Q12,52 19,58" fill="#0284c7" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                <path d="M62,45 Q68,52 61,58" fill="#0284c7" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700">
                ห้องทดลองวิจัยในชั้นเรียนแบบการ์ตูน · {courseTitle}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
                แดชบอร์ดวิจัย 3 แผน (สอบก่อนเรียน 20 → สอนทั้ง 3 แผน → สอบหลังเรียน 20)
              </h1>
              <p className="text-xs sm:text-sm text-slate-800 mt-1">
                เน้นการเรียนรู้ผ่านกิจกรรมทั้ง 3 แผนโดยไม่มีคะแนนเก็บระหว่างแผนและไม่เก็บจิตพิสัย วัดผลพัฒนาการจากสอบก่อนเรียนและหลังเรียน!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('gradebook')}
              className="cartoon-btn px-4 py-2.5 text-xs font-bold text-slate-900 bg-white rounded-xl whitespace-nowrap shrink-0"
            >
              กรอกคะแนนก่อน-หลังเรียน (20)
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('research')}
              className="cartoon-btn px-4 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>ดูผลสถิติวิจัย t-test &amp; ค่า g</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual 3-Plan Research Roadmap Strip (No scores in Plans 1, 2, 3) */}
        <div className="mt-6 pt-5 border-t-2 border-dashed border-slate-900/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white border-2 border-slate-900 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500">ขั้นที่ 1: วัดพื้นฐาน</div>
              <div className="text-sm font-bold text-slate-900">สอบก่อนเรียน (20 คะแนน)</div>
            </div>
            <span className="text-base font-mono font-bold tabular-nums text-slate-900">
              {classStats.tTest.meanPre.toFixed(1)}/20
            </span>
          </div>

          <div className="bg-[#bae6fd] border-2 border-slate-900 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-700">ขั้นที่ 2.1: กิจกรรมที่ 1</div>
              <div className="text-sm font-bold text-slate-900">สอนแผนที่ 1 (ไม่เก็บคะแนน)</div>
            </div>
            <span className="text-xs font-mono font-bold tabular-nums text-slate-900">
              เข้าเรียน {classStats.plan1AttendancePct}%
            </span>
          </div>

          <div className="bg-[#bbf7d0] border-2 border-slate-900 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-700">ขั้นที่ 2.2: กิจกรรมที่ 2</div>
              <div className="text-sm font-bold text-slate-900">สอนแผนที่ 2 (ไม่เก็บคะแนน)</div>
            </div>
            <span className="text-xs font-mono font-bold tabular-nums text-slate-900">
              เข้าเรียน {classStats.plan2AttendancePct}%
            </span>
          </div>

          <div className="bg-[#e9d5ff] border-2 border-slate-900 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-700">ขั้นที่ 2.3: กิจกรรมที่ 3</div>
              <div className="text-sm font-bold text-slate-900">สอนแผนที่ 3 (ไม่เก็บคะแนน)</div>
            </div>
            <span className="text-xs font-mono font-bold tabular-nums text-slate-900">
              เข้าเรียน {classStats.plan3AttendancePct}%
            </span>
          </div>

          <div className="bg-[#fed7aa] border-2 border-slate-900 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-700">ขั้นที่ 3: วัดผลสำเร็จ</div>
              <div className="text-sm font-bold text-slate-900">สอบหลังเรียน (20 คะแนน)</div>
            </div>
            <span className="text-base font-mono font-bold tabular-nums text-emerald-800">
              {classStats.tTest.meanPost.toFixed(1)}/20
            </span>
          </div>
        </div>
      </div>

      {/* Full-Width 4-Column KPI Summary Strip (Pre-test 20 vs Post-test 20) */}
      <section
        aria-label="ตัวชี้วัดภาพรวมชั้นเรียน"
        className="cartoon-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-slate-900 overflow-hidden"
      >
        <div className="p-5 bg-white">
          <div className="text-xs text-slate-600 font-bold">
            1. คะแนนเฉลี่ยก่อนเรียน → หลังเรียน (เต็ม 20)
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {classStats.tTest.meanPre.toFixed(2)}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500 inline" />
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {classStats.tTest.meanPost.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-700 tabular-nums">
            ก่อนเรียน {classStats.tTest.meanPrePct.toFixed(1)}% → หลังเรียน{' '}
            <strong className="font-mono text-emerald-700">{classStats.tTest.meanPostPct.toFixed(1)}%</strong>
          </div>
        </div>

        <div className="p-5 bg-white">
          <div className="text-xs text-slate-600 font-bold">
            2. คะแนนพัฒนาการเฉลี่ย (Gain Score D)
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              +{classStats.tTest.meanDiff.toFixed(2)} คะแนน
            </span>
          </div>
          <div className="mt-2 text-xs tabular-nums">
            <span className="text-slate-700 font-bold">
              ● สถิติ Paired t-test: t = {classStats.tTest.tStat.toFixed(2)}* (SD = {classStats.tTest.sdDiff.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="p-5 bg-white">
          <div className="text-xs text-slate-600 font-bold">
            3. ดัชนีพัฒนาการสัมพัทธ์ (Normalized Gain g)
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              g = {classStats.averageNormalizedGain.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-700 tabular-nums">
            สูงสุดหลังเรียน: <strong className="font-mono text-slate-900">{classStats.maxPostScore}/20</strong> · ต่ำสุด {classStats.minPostScore}/20
          </div>
        </div>

        <div className="p-5 bg-white">
          <div className="text-xs text-slate-600 font-bold">
            4. ผลการผ่านเกณฑ์หลังเรียน ({classStats.studentCount} คน)
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              ผ่าน {classStats.passCriterionRate.toFixed(0)}%
            </span>
            <span className="text-xs font-mono tabular-nums text-amber-700 font-bold">
              ▲ เป้าหมายวิจัย {classStats.atRiskCount} คน
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-700 tabular-nums">
            เกณฑ์เป้าหมายร้อยละ {classStats.targetCriterionPct} ({classStats.targetCriterionScore}/20 คะแนน)
          </div>
        </div>
      </section>

      {/* Main 2-Column Analytical Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Student Selector Roster & Class Distribution */}
        <div className="lg:col-span-5 space-y-6">
          <section
            aria-label="รายชื่อนักเรียนเพื่อเลือกวิเคราะห์รายบุคคล"
            className="cartoon-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                เลือกนักเรียนเพื่อดูผลวิจัยรายบุคคล
              </h2>
              <span className="text-xs text-slate-600 font-mono tabular-nums font-bold">
                แสดง {filteredStudents.length} จาก {students.length} คน
              </span>
            </div>

            {/* Search & Segmented Filter Controls */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  aria-label="ค้นหาชื่อหรือรหัสนักเรียน"
                  placeholder="ค้นหาชื่อ, นามสกุล หรือรหัสนักเรียน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-amber-50/50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white transition-colors"
                />
              </div>

              <div
                role="group"
                aria-label="กรองกลุ่มผู้เรียน"
                className="flex items-center gap-1.5 p-1 bg-slate-100 border-2 border-slate-900 rounded-xl"
              >
                <button
                  type="button"
                  onClick={() => setGroupFilter('all')}
                  className={`flex-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    groupFilter === 'all'
                      ? 'bg-[#fef08a] text-slate-900 border border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGroupFilter('target')}
                  className={`flex-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    groupFilter === 'target'
                      ? 'bg-[#fed7aa] text-slate-900 border border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  กลุ่มเป้าหมาย ({classStats.atRiskCount})
                </button>
                <button
                  type="button"
                  onClick={() => setGroupFilter('high')}
                  className={`flex-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    groupFilter === 'high'
                      ? 'bg-[#bbf7d0] text-slate-900 border border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ผ่านเกณฑ์ ≥80% ({classStats.highPerformingCount})
                </button>
              </div>
            </div>

            {/* Student Roster List */}
            {filteredStudents.length === 0 ? (
              <div className="py-10 text-center space-y-2 border-t-2 border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-600">
                  ไม่พบรายชื่อนักเรียนที่ตรงกับเงื่อนไขการค้นหา
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setGroupFilter('all');
                  }}
                  className="cartoon-btn px-3 py-1.5 text-xs font-bold text-slate-900 bg-[#fef08a] rounded-lg"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {filteredStudents.map((stu) => {
                  const diff = calculateScoreDiff(stu);
                  const plansDone = countCompletedPlans(stu);
                  const postPct = calculatePosttestPct(stu);
                  const grade = calculateThaiGrade(postPct);
                  const isSelected = activeStudent?.id === stu.id;

                  return (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => onSelectStudent(stu.id)}
                      className={`w-full text-left py-3 px-3.5 transition-all flex items-center justify-between gap-3 rounded-xl border-2 border-slate-900 ${
                        isSelected
                          ? 'bg-[#bae6fd] text-slate-900 shadow-[3px_3px_0px_#0f172a]'
                          : 'bg-white hover:bg-amber-50 text-slate-900'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold tabular-nums text-slate-600">
                            #{stu.studentCode}
                          </span>
                          <span className="text-sm font-bold truncate">
                            {stu.prefix}
                            {stu.firstName} {stu.lastName}
                          </span>
                        </div>
                        <div className="text-xs mt-1 flex flex-wrap items-center gap-1.5 text-slate-700 font-mono tabular-nums">
                          <span>ก่อน {stu.pretest}/20</span>
                          <span aria-hidden="true">→</span>
                          <span>เรียน {plansDone}/3 แผน</span>
                          <span aria-hidden="true">→</span>
                          <span className="font-bold text-emerald-800">หลัง {stu.posttest}/20</span>
                          {stu.researchTargetGroup && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-800 font-bold">
                                ▲ เป้าหมายวิจัย
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono tabular-nums">
                        <div className="text-sm font-bold text-emerald-800">
                          +{diff.toFixed(1)} คะแนน
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          หลังเรียน {postPct}% (เกรด {grade.toFixed(1)})
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Class Grade Distribution Chart */}
          <section
            aria-label="การกระจายผลการเรียนหลังเรียนของชั้นเรียน"
            className="cartoon-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                สัดส่วนผลการสอบหลังเรียน (เทียบเกรด 8 ระดับ)
              </h2>
              <span className="text-xs font-bold text-slate-600">จากคะแนนหลังเรียน 20 คะแนน</span>
            </div>

            <div className="space-y-2.5">
              {gradeKeys.map((gKey) => {
                const count = classStats.gradeDistribution[gKey] || 0;
                const pct =
                  classStats.studentCount > 0
                    ? Math.round((count / classStats.studentCount) * 100)
                    : 0;
                return (
                  <div key={gKey} className="grid grid-cols-12 items-center gap-2 text-xs">
                    <div className="col-span-3 font-mono tabular-nums font-bold text-slate-800">
                      เกรด {Number(gKey).toFixed(1)}
                    </div>
                    <div className="col-span-6 h-3.5 bg-slate-100 border border-slate-900 rounded-md overflow-hidden">
                      <div
                        className="h-full bg-[#38bdf8] transition-all duration-150"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="col-span-3 text-right font-mono tabular-nums font-bold text-slate-700">
                      {count} คน ({pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column (7 cols): Individual Student Pre/Post 20 & 3-Plan Participation Analyzer */}
        <div className="lg:col-span-7 space-y-6">
          {diagnostic ? (
            <section
              aria-label="ผลการวิเคราะห์ข้อมูลนักเรียนรายบุคคล"
              className="cartoon-card p-6 space-y-6"
            >
              {/* Student Profile Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-dashed border-slate-300">
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-14 shrink-0 bg-[#bbf7d0] border-2 border-slate-900 rounded-2xl shadow-[2px_2px_0px_#0f172a] flex items-center justify-center font-cartoon text-xl font-bold text-slate-900">
                    {diagnostic.student.firstName.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                      <span className="font-mono tabular-nums">
                        รหัส {diagnostic.student.studentCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>ห้อง {diagnostic.student.classroom}</span>
                      <span aria-hidden="true">·</span>
                      <span>สไตล์การเรียน: {diagnostic.student.learningStyle}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mt-1">
                      {diagnostic.student.prefix}
                      {diagnostic.student.firstName} {diagnostic.student.lastName}
                    </h2>
                    <div className="mt-1 text-xs font-bold">
                      {diagnostic.statusTier === 'At-Risk' ? (
                        <span className="text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>สถานะ: {diagnostic.statusTierThai}</span>
                        </span>
                      ) : diagnostic.statusTier === 'High-Performing' ? (
                        <span className="text-emerald-800 flex items-center gap-1.5">
                          <Award className="w-4 h-4 shrink-0" />
                          <span>สถานะ: {diagnostic.statusTierThai}</span>
                        </span>
                      ) : (
                        <span className="text-slate-700 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 shrink-0" />
                          <span>สถานะ: {diagnostic.statusTierThai}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleToggleTargetGroup}
                    className={`cartoon-btn px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 ${
                      diagnostic.student.researchTargetGroup
                        ? 'bg-[#fed7aa] text-slate-900'
                        : 'bg-white text-slate-800'
                    }`}
                  >
                    {diagnostic.student.researchTargetGroup
                      ? '▲ อยู่ในกลุ่มเป้าหมายวิจัย'
                      : '+ ตั้งเป็นกลุ่มเป้าหมายวิจัย'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuickSim((v) => !v)}
                    className="cartoon-btn px-3 py-2 text-xs font-bold text-slate-900 bg-[#fef08a] rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{showQuickSim ? 'ซ่อนแถบกรอกคะแนนสด' : 'แก้ไขคะแนนก่อน-หลังเรียน'}</span>
                  </button>
                </div>
              </div>

              {/* Individual 4-Box Scoreboard (Pre-test 20 -> 3 Plans Attendance -> Post-test 20 -> Gain g) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-5 border-b-2 border-dashed border-slate-300">
                <div className="p-3 bg-[#fef9c3] border-2 border-slate-900 rounded-xl">
                  <div className="text-xs font-bold text-slate-700">1. สอบก่อนเรียน (20)</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {diagnostic.student.pretest} <span className="text-xs">/ 20</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-slate-600 mt-0.5">
                    คิดเป็น {diagnostic.pretestPct}%
                  </div>
                </div>

                <div className="p-3 bg-[#bae6fd] border-2 border-slate-900 rounded-xl">
                  <div className="text-xs font-bold text-slate-700">2. การเรียน 3 แผน</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {diagnostic.completedPlansCount} <span className="text-xs">/ 3 แผน</span>
                  </div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                    ไม่เก็บคะแนนระหว่างแผน
                  </div>
                </div>

                <div className="p-3 bg-[#bbf7d0] border-2 border-slate-900 rounded-xl">
                  <div className="text-xs font-bold text-slate-700">3. สอบหลังเรียน (20)</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-emerald-900 mt-1">
                    {diagnostic.student.posttest} <span className="text-xs">/ 20</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-emerald-800 font-bold mt-0.5">
                    คิดเป็น {diagnostic.posttestPct}% (เกรด {diagnostic.grade.toFixed(1)})
                  </div>
                </div>

                <div className="p-3 bg-[#e9d5ff] border-2 border-slate-900 rounded-xl">
                  <div className="text-xs font-bold text-slate-700">4. พัฒนาการ (Gain)</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    +{diagnostic.scoreDiff} <span className="text-xs">คะแนน</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums font-bold text-slate-800 mt-0.5">
                    g = {diagnostic.normalizedGain.gain.toFixed(2)} (อันดับ #{diagnostic.rank})
                  </div>
                </div>
              </div>

              {/* Interactive Real-Time Editor: Pre-test (20), 3 Plans Checkboxes, Post-test (20) */}
              {showQuickSim && (
                <div className="p-4 bg-[#fffdf5] border-2 border-slate-900 rounded-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      บันทึกข้อมูลรายบุคคลแบบเรียลไทม์ (สอบก่อนเรียน 20 · เช็กชื่อเรียน 3 แผน · สอบหลังเรียน 20)
                    </h3>
                    <span className="text-xs text-slate-600 font-mono tabular-nums font-bold">
                      ไม่มีคะแนนในแผน และไม่เก็บจิตพิสัย
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
                    {/* Pre-test 20 */}
                    <div className="sm:col-span-3 p-3 rounded-xl border-2 border-slate-900 bg-amber-50 flex flex-col justify-between">
                      <label
                        htmlFor="quick-pretest"
                        className="block text-xs font-bold text-slate-900 mb-1"
                      >
                        1. สอบก่อนเรียน (เต็ม 20)
                      </label>
                      <input
                        id="quick-pretest"
                        type="number"
                        step="0.5"
                        min={0}
                        max={20}
                        value={diagnostic.student.pretest}
                        onChange={(e) => handleQuickScoreChange('pretest', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-base font-mono font-bold tabular-nums bg-white border-2 border-slate-900 rounded-lg focus:outline-none"
                      />
                    </div>

                    {/* 3 Teaching Plans Participation Toggle (No scores!) */}
                    <div className="sm:col-span-6 p-3 rounded-xl border-2 border-slate-900 bg-sky-50 flex flex-col justify-between">
                      <div className="text-xs font-bold text-slate-900 mb-2">
                        2. สถานะการเรียนครบ 3 แผน (คลิกเพื่อเช็กสถานะ ไม่เก็บคะแนน)
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { field: 'completedPlan1', label: 'สอนแผนที่ 1' },
                            { field: 'completedPlan2', label: 'สอนแผนที่ 2' },
                            { field: 'completedPlan3', label: 'สอนแผนที่ 3' },
                          ] as const
                        ).map((pl) => {
                          const done = diagnostic.student[pl.field];
                          return (
                            <button
                              key={pl.field}
                              type="button"
                              onClick={() => handleTogglePlanComplete(pl.field)}
                              className={`px-2 py-2 text-xs font-bold rounded-lg border-2 border-slate-900 flex items-center justify-center gap-1 transition-colors ${
                                done
                                  ? 'bg-[#bbf7d0] text-slate-900'
                                  : 'bg-white text-slate-500'
                              }`}
                            >
                              {done && <Check className="w-3.5 h-3.5 shrink-0" />}
                              <span>{pl.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Post-test 20 */}
                    <div className="sm:col-span-3 p-3 rounded-xl border-2 border-slate-900 bg-emerald-50 flex flex-col justify-between">
                      <label
                        htmlFor="quick-posttest"
                        className="block text-xs font-bold text-slate-900 mb-1"
                      >
                        3. สอบหลังเรียน (เต็ม 20)
                      </label>
                      <input
                        id="quick-posttest"
                        type="number"
                        step="0.5"
                        min={0}
                        max={20}
                        value={diagnostic.student.posttest}
                        onChange={(e) => handleQuickScoreChange('posttest', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-base font-mono font-bold tabular-nums bg-white border-2 border-slate-900 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Visual Comparison Bars: Pre-test (20) vs Post-test (20) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    กราฟเปรียบเทียบคะแนนรายบุคคล: สอบก่อนเรียน (20) vs สอบหลังเรียน (20)
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-[#38bdf8] border border-slate-900 inline-block rounded-xs" />
                      <span>คะแนนนักเรียน</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-slate-900 inline-block rounded-xs" />
                      <span>เส้นค่าเฉลี่ยห้อง</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Bar 1: Pre-test (20) */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">
                          1. คะแนนสอบก่อนเรียน (Pre-test เต็ม 20 คะแนน)
                        </span>
                        <span className="text-slate-600 ml-2 hidden sm:inline">
                          · วัดความรู้พื้นฐานก่อนเริ่มสอนแผนที่ 1–3
                        </span>
                      </div>
                      <div className="font-mono tabular-nums shrink-0 font-bold">
                        <span className="text-slate-900">
                          {diagnostic.student.pretest}/20 ({diagnostic.pretestPct}%)
                        </span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-600">
                          เฉลี่ยห้อง {classStats.tTest.meanPre.toFixed(1)}/20 ({classStats.tTest.meanPrePct}%)
                        </span>
                      </div>
                    </div>
                    <div className="relative h-5 bg-slate-100 border-2 border-slate-900 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-[#fde047] transition-all duration-150"
                        style={{ width: `${Math.min(100, diagnostic.pretestPct)}%` }}
                      />
                      <div
                        title={`ค่าเฉลี่ยก่อนเรียนของห้อง ${classStats.tTest.meanPrePct}%`}
                        className="absolute top-0 bottom-0 w-1 bg-slate-900"
                        style={{ left: `${Math.min(100, classStats.tTest.meanPrePct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Bar 2: Post-test (20) */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">
                          2. คะแนนสอบหลังเรียน (Post-test เต็ม 20 คะแนน)
                        </span>
                        <span className="text-slate-600 ml-2 hidden sm:inline">
                          · วัดผลสัมฤทธิ์หลังจากเรียนครบทั้ง 3 แผน
                        </span>
                      </div>
                      <div className="font-mono tabular-nums shrink-0 font-bold">
                        <span className="text-emerald-800">
                          {diagnostic.student.posttest}/20 ({diagnostic.posttestPct}%)
                        </span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-600">
                          เฉลี่ยห้อง {classStats.tTest.meanPost.toFixed(1)}/20 ({classStats.tTest.meanPostPct}%)
                        </span>
                      </div>
                    </div>
                    <div className="relative h-5 bg-slate-100 border-2 border-slate-900 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-[#4ade80] transition-all duration-150"
                        style={{ width: `${Math.min(100, diagnostic.posttestPct)}%` }}
                      />
                      <div
                        title={`ค่าเฉลี่ยหลังเรียนของห้อง ${classStats.tTest.meanPostPct}%`}
                        className="absolute top-0 bottom-0 w-1 bg-slate-900"
                        style={{ left: `${Math.min(100, classStats.tTest.meanPostPct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths, Weaknesses & Action Research Prescription */}
              <div className="pt-5 border-t-2 border-dashed border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>จุดเด่นและพัฒนาการของผู้เรียน</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-800 font-medium">
                    {diagnostic.strengths.map((str, i) => (
                      <li key={i}>• {str}</li>
                    ))}
                  </ul>

                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 pt-2">
                    <TrendingUp className="w-4 h-4 text-amber-700" />
                    <span>ข้อสังเกตเพื่อการพัฒนาต่อยอด</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-800 font-medium">
                    {diagnostic.areasForImprovement.map((area, i) => (
                      <li key={i}>• {area}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-[#fef9c3] border-2 border-slate-900 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-900">
                      แนวทางดูแลผู้เรียนรายบุคคล (CAR Action Plan)
                    </h4>
                    <p className="text-xs text-slate-800 mt-1 leading-relaxed">
                      {diagnostic.recommendedIntervention}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="student-teacher-note"
                      className="block text-xs font-bold text-slate-900 mb-1"
                    >
                      สมุดพกบันทึกพฤติกรรมรายบุคคล (Teacher Note)
                    </label>
                    <textarea
                      id="student-teacher-note"
                      rows={2}
                      value={diagnostic.student.teacherNote}
                      onChange={(e) => handleNoteChange(e.target.value)}
                      placeholder="จดบันทึกการมีส่วนร่วมในการเรียนทั้ง 3 แผนและผลสอบหลังเรียน..."
                      className="w-full p-2.5 text-xs bg-white border-2 border-slate-900 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
};
