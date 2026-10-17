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
} from 'lucide-react';
import {
  StudentRecord,
  ClassSummaryStats,
  SCORE_MAX,
  calculateTotalScore,
  calculateThreePlansScore,
  calculateThaiGrade,
  calculateNormalizedGain,
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

      const total = calculateTotalScore(s);
      if (groupFilter === 'target') {
        return s.researchTargetGroup || total < 65;
      }
      if (groupFilter === 'high') {
        return total >= 80;
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
    field: 'pretest' | 'unit1' | 'unit2' | 'unit3' | 'posttest' | 'affective',
    rawVal: string
  ) => {
    if (!activeStudent) return;
    const clamped = clampScore(Number(rawVal), SCORE_MAX[field]);
    onUpdateStudent({
      ...activeStudent,
      [field]: clamped,
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
      {/* Cartoon Hero Banner with Illustrated Scientist Mascot & 3-Plan Research Flow */}
      <div className="cartoon-card bg-[#fef08a] p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Custom Cartoon Owl Scientist Illustration */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_#0f172a] flex items-center justify-center p-2">
              <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden="true">
                {/* Graduation Cap */}
                <polygon points="40,6 70,18 40,30 10,18" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
                <line x1="62" y1="21" x2="66" y2="34" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                <circle cx="66" cy="35" r="3" fill="#f59e0b" />
                {/* Owl Body */}
                <ellipse cx="40" cy="48" rx="22" ry="22" fill="#38bdf8" stroke="#0f172a" strokeWidth="3" />
                <ellipse cx="40" cy="52" rx="14" ry="14" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
                {/* Big Cartoon Glasses & Eyes */}
                <circle cx="31" cy="40" r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
                <circle cx="49" cy="40" r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
                <circle cx="32" cy="40" r="3.5" fill="#0f172a" />
                <circle cx="48" cy="40" r="3.5" fill="#0f172a" />
                <circle cx="30.5" cy="38.5" r="1.2" fill="#ffffff" />
                <circle cx="46.5" cy="38.5" r="1.2" fill="#ffffff" />
                {/* Beak */}
                <polygon points="37,45 43,45 40,51" fill="#fb923c" stroke="#0f172a" strokeWidth="2" />
                {/* Little Wings */}
                <path d="M18,45 Q12,52 19,58" fill="#0284c7" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                <path d="M62,45 Q68,52 61,58" fill="#0284c7" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700">
                ห้องทดลองวิจัยในชั้นเรียนแบบการ์ตูน · {courseTitle}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
                แดชบอร์ดวิจัย 3 แผนการเรียนรู้ (ก่อนเรียน 20 · สอน 3 แผน · หลังเรียน 20)
              </h1>
              <p className="text-xs sm:text-sm text-slate-800 mt-1">
                วิเคราะห์พัฒนาการนักเรียนรายบุคคลแบบเรียลไทม์ ตั้งแต่สอบก่อนเรียน สอนครบทั้ง 3 แผน จนถึงสอบหลังเรียน!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('gradebook')}
              className="cartoon-btn px-4 py-2.5 text-xs font-bold text-slate-900 bg-white rounded-xl whitespace-nowrap shrink-0"
            >
              กรอกคะแนนทั้ง 3 แผน
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('research')}
              className="cartoon-btn px-4 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>ดูผลวิจัย 3 แผน (E1/E2)</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual 3-Plan Research Roadmap Strip */}
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
              <div className="text-[11px] font-bold text-slate-700">ขั้นที่ 2.1: สอนแผนที่ 1</div>
              <div className="text-sm font-bold text-slate-900">พันธุศาสตร์ (20 คะแนน)</div>
            </div>
            <span className="text-base font-mono font-bold tabular-nums text-slate-900">
              {classStats.e1e2.plan1Pct.toFixed(0)}%
            </span>
          </div>

          <div className="bg-[#bbf7d0] border-2 border-slate-900 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-700">ขั้นที่ 2.2: สอนแผนที่ 2</div>
              <div className="text-sm font-bold text-slate-900">คลื่นและแสง (20 คะแนน)</div>
            </div>
            <span className="text-base font-mono font-bold tabular-nums text-slate-900">
              {classStats.e1e2.plan2Pct.toFixed(0)}%
            </span>
          </div>

          <div className="bg-[#e9d5ff] border-2 border-slate-900 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-700">ขั้นที่ 2.3: สอนแผนที่ 3</div>
              <div className="text-sm font-bold text-slate-900">ระบบสุริยะ (20 คะแนน)</div>
            </div>
            <span className="text-base font-mono font-bold tabular-nums text-slate-900">
              {classStats.e1e2.plan3Pct.toFixed(0)}%
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

      {/* Full-Width 4-Column KPI Summary Strip (Cartoon Style) */}
      <section
        aria-label="ตัวชี้วัดภาพรวมชั้นเรียน"
        className="cartoon-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-slate-900 overflow-hidden"
      >
        <div className="p-5 bg-white">
          <div className="text-xs text-slate-600 font-bold">
            1. สอบก่อนเรียน → สอบหลังเรียน (เต็ม 20)
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {classStats.tTest.meanPre.toFixed(1)}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500 inline" />
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {classStats.tTest.meanPost.toFixed(1)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-700 tabular-nums">
            เพิ่มขึ้นเฉลี่ย <strong className="font-mono text-emerald-700">+{classStats.tTest.meanDiff.toFixed(2)}</strong> คะแนน (เต็ม 20)
          </div>
        </div>

        <div className="p-5 bg-white">
          <div className="text-xs text-slate-600 font-bold">
            2. ประสิทธิภาพสอน 3 แผน (E1 / E2)
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {classStats.e1e2.e1.toFixed(1)} / {classStats.e1e2.e2.toFixed(1)}
            </span>
          </div>
          <div className="mt-2 text-xs tabular-nums">
            {classStats.e1e2.meetsBoth ? (
              <span className="text-emerald-700 font-bold">
                ● สูงกว่าเกณฑ์มาตรฐาน {classStats.e1e2.criterionE1}/{classStats.e1e2.criterionE2}
              </span>
            ) : (
              <span className="text-amber-700 font-bold">
                ▲ ต่ำกว่าเกณฑ์ที่ตั้งไว้ {classStats.e1e2.criterionE1}/{classStats.e1e2.criterionE2}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 bg-white">
          <div className="text-xs text-slate-600 font-bold">
            3. ค่าพัฒนาการ (Normalized Gain g)
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {classStats.averageNormalizedGain.toFixed(2)}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-600">
              t = {classStats.tTest.tStat.toFixed(2)}*
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-700 tabular-nums">
            คะแนนรวมเฉลี่ย: <strong className="font-mono text-slate-900">{classStats.meanTotal.toFixed(1)}/100</strong> (GPA {classStats.meanGPA.toFixed(2)})
          </div>
        </div>

        <div className="p-5 bg-white">
          <div className="text-xs text-slate-600 font-bold">
            4. คัดกรองผู้เรียนรายบุคคล ({classStats.studentCount} คน)
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              ผ่าน {classStats.passRate.toFixed(0)}%
            </span>
            <span className="text-xs font-mono tabular-nums text-amber-700 font-bold">
              ▲ เป้าหมายวิจัย {classStats.atRiskCount} คน
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-700 tabular-nums">
            ดาวเด่น (เกรด 4.0): <strong className="font-mono text-slate-900">{classStats.highPerformingCount}</strong> คน
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
                  เกรด 4.0 ({classStats.highPerformingCount})
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
                  const total = calculateTotalScore(stu);
                  const threePlans = calculateThreePlansScore(stu);
                  const grade = calculateThaiGrade(total);
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
                          <span aria-hidden="true">·</span>
                          <span>3 แผน {threePlans}/60</span>
                          <span aria-hidden="true">·</span>
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
                        <div className="text-sm font-bold text-slate-900">
                          {total.toFixed(1)} คะแนน
                        </div>
                        <div className="text-xs font-bold text-emerald-800">
                          เกรด {grade.toFixed(1)}
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
            aria-label="การกระจายผลการเรียนของชั้นเรียน"
            className="cartoon-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                กราฟแท่งระดับผลการเรียน (Grade Distribution)
              </h2>
              <span className="text-xs font-bold text-slate-600">เกณฑ์ 8 ระดับ</span>
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

        {/* Right Column (7 cols): Individual Student 3-Plan Diagnostic & Real-Time Analyzer */}
        <div className="lg:col-span-7 space-y-6">
          {diagnostic ? (
            <section
              aria-label="ผลการวิเคราะห์ข้อมูลนักเรียนรายบุคคล"
              className="cartoon-card p-6 space-y-6"
            >
              {/* Student Profile Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-dashed border-slate-300">
                <div className="flex items-start gap-3.5">
                  {/* Cartoon Student Avatar Badge */}
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
                    <span>{showQuickSim ? 'ซ่อนแถบกรอกคะแนนสด' : 'กรอกคะแนนสด 3 แผน'}</span>
                  </button>
                </div>
              </div>

              {/* Individual 3-Plan Journey Scoreboard */}
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
                  <div className="text-xs font-bold text-slate-700">2. สอนรวม 3 แผน (60)</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {diagnostic.formativeScore} <span className="text-xs">/ 60</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-slate-700 mt-0.5">
                    E1 รายบุคคล = {diagnostic.formativePct}%
                  </div>
                </div>

                <div className="p-3 bg-[#bbf7d0] border-2 border-slate-900 rounded-xl">
                  <div className="text-xs font-bold text-slate-700">3. สอบหลังเรียน (20)</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-emerald-900 mt-1">
                    {diagnostic.student.posttest} <span className="text-xs">/ 20</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-emerald-800 font-bold mt-0.5">
                    +{diagnostic.scoreDiff} คะแนน (g = {diagnostic.normalizedGain.gain.toFixed(2)})
                  </div>
                </div>

                <div className="p-3 bg-[#e9d5ff] border-2 border-slate-900 rounded-xl">
                  <div className="text-xs font-bold text-slate-700">4. คะแนนรวม &amp; เกรด</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {diagnostic.totalScore.toFixed(1)} <span className="text-xs">/ 100</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums font-bold text-slate-800 mt-0.5">
                    เกรด {diagnostic.grade.toFixed(1)} (อันดับ #{diagnostic.rank})
                  </div>
                </div>
              </div>

              {/* Interactive Real-Time 3-Plan Score Adjuster */}
              {showQuickSim && (
                <div className="p-4 bg-[#fffdf5] border-2 border-slate-900 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      แก้ไขคะแนนรายบุคคลแบบเรียลไทม์ (ก่อนเรียน 20 · แผน 1-3 แผนละ 20 · หลังเรียน 20)
                    </h3>
                    <span className="text-xs text-slate-600 font-mono tabular-nums font-bold">
                      E1: {diagnostic.formativePct}% · E2: {diagnostic.posttestPct}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {(
                      [
                        { key: 'pretest', label: 'ก่อนเรียน (20)', max: 20, bg: 'bg-amber-50' },
                        { key: 'unit1', label: 'แผนที่ 1 (20)', max: 20, bg: 'bg-sky-50' },
                        { key: 'unit2', label: 'แผนที่ 2 (20)', max: 20, bg: 'bg-emerald-50' },
                        { key: 'unit3', label: 'แผนที่ 3 (20)', max: 20, bg: 'bg-purple-50' },
                        { key: 'posttest', label: 'หลังเรียน (20)', max: 20, bg: 'bg-orange-50' },
                        { key: 'affective', label: 'จิตพิสัย (20)', max: 20, bg: 'bg-slate-50' },
                      ] as const
                    ).map((item) => (
                      <div key={item.key} className={`p-2 rounded-lg border border-slate-900 ${item.bg}`}>
                        <label
                          htmlFor={`quick-${item.key}`}
                          className="block text-[11px] font-bold text-slate-800 mb-1"
                        >
                          {item.label}
                        </label>
                        <input
                          id={`quick-${item.key}`}
                          type="number"
                          step="0.5"
                          min={0}
                          max={item.max}
                          value={diagnostic.student[item.key]}
                          onChange={(e) => handleQuickScoreChange(item.key, e.target.value)}
                          className="w-full px-2 py-1 text-sm font-mono font-bold tabular-nums bg-white border-2 border-slate-900 rounded-md focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competency Progress Bars across Pre-test, Plan 1, Plan 2, Plan 3, Post-test */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    กราฟพัฒนาการรายบุคคล: ก่อนเรียน → สอนทั้ง 3 แผน → หลังเรียน
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

                <div className="space-y-3.5">
                  {diagnostic.competencies.map((comp, index) => {
                    const diff = comp.scorePct - comp.classAvgPct;
                    const barColors = [
                      'bg-[#fde047]',
                      'bg-[#38bdf8]',
                      'bg-[#4ade80]',
                      'bg-[#c084fc]',
                      'bg-[#fb923c]',
                    ];
                    return (
                      <div key={comp.name} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{comp.name}</span>
                            <span className="text-slate-600 ml-2 hidden sm:inline">
                              · {comp.description}
                            </span>
                          </div>
                          <div className="font-mono tabular-nums shrink-0 font-bold">
                            <span className="text-slate-900">
                              {comp.score}/{comp.maxScore} ({comp.scorePct}%)
                            </span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-slate-600">เฉลี่ยห้อง {comp.classAvgPct}%</span>
                            <span
                              className={`ml-1.5 ${
                                diff >= 0 ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              ({diff >= 0 ? `+${diff}%` : `${diff}%`})
                            </span>
                          </div>
                        </div>

                        {/* Cartoon Progress Bar */}
                        <div className="relative h-4 bg-slate-100 border-2 border-slate-900 rounded-lg overflow-hidden">
                          <div
                            className={`h-full transition-all duration-150 ${
                              barColors[index % barColors.length]
                            }`}
                            style={{ width: `${Math.min(100, comp.scorePct)}%` }}
                          />
                          <div
                            title={`ค่าเฉลี่ยห้อง ${comp.classAvgPct}%`}
                            className="absolute top-0 bottom-0 w-1 bg-slate-900"
                            style={{ left: `${Math.min(100, comp.classAvgPct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths, Weaknesses & Action Research Prescription */}
              <div className="pt-5 border-t-2 border-dashed border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>แผนการเรียนรู้ที่ทำได้ดีเยี่ยม</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-800 font-medium">
                    {diagnostic.strengths.map((str, i) => (
                      <li key={i}>• {str}</li>
                    ))}
                  </ul>

                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 pt-2">
                    <TrendingUp className="w-4 h-4 text-amber-700" />
                    <span>แผนการเรียนรู้ที่ควรเสริมทักษะ</span>
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
                      ภารกิจแนะนำสำหรับครูผู้สอน (CAR Action Plan)
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
                      placeholder="จดบันทึกพัฒนาการจากการเรียนทั้ง 3 แผน..."
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
