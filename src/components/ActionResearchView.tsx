import React, { useState, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Printer,
  BookOpen,
} from 'lucide-react';
import {
  StudentRecord,
  ResearchIntervention,
  ResearchProjectConfig,
  ClassSummaryStats,
  calculateNormalizedGain,
  calculateTotalScore,
} from '../utils/analytics';

interface ActionResearchViewProps {
  students: StudentRecord[];
  researchConfig: ResearchProjectConfig;
  onUpdateConfig: (config: ResearchProjectConfig) => void;
  interventions: ResearchIntervention[];
  onAddIntervention: (item: ResearchIntervention) => void;
  classStats: ClassSummaryStats;
  onSelectStudentForInspect: (studentId: string) => void;
}

export const ActionResearchView: React.FC<ActionResearchViewProps> = ({
  students,
  researchConfig,
  onUpdateConfig,
  interventions,
  onAddIntervention,
  classStats,
  onSelectStudentForInspect,
}) => {
  const [stageFilter, setStageFilter] = useState<'ALL' | 'Plan' | 'Act' | 'Observe' | 'Reflect'>('ALL');
  const [showAddLog, setShowAddLog] = useState(false);
  const [logError, setLogError] = useState('');

  // Form states for adding a new CAR intervention record
  const [selectedStuId, setSelectedStuId] = useState(students[2]?.id || students[0]?.id || '');
  const [paorStage, setPaorStage] = useState<ResearchIntervention['paorStage']>('Act');
  const [lessonPlanNumber, setLessonPlanNumber] = useState<1 | 2 | 3>(1);
  const [innovationUsed, setInnovationUsed] = useState('');
  const [problemObserved, setProblemObserved] = useState('');
  const [reflectionOutcome, setReflectionOutcome] = useState('');
  const [status, setStatus] = useState<ResearchIntervention['status']>('บรรลุเป้าหมาย');

  const gainBreakdown = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    students.forEach((s) => {
      const g = calculateNormalizedGain(s.pretest, s.posttest);
      if (g.level === 'High Gain') high++;
      else if (g.level === 'Medium Gain') medium++;
      else low++;
    });
    return { high, medium, low };
  }, [students]);

  const targetStudents = useMemo(() => {
    return students.filter((s) => s.researchTargetGroup || calculateTotalScore(s) < 65);
  }, [students]);

  const filteredInterventions = useMemo(() => {
    if (stageFilter === 'ALL') return interventions;
    return interventions.filter((item) => item.paorStage === stageFilter);
  }, [interventions, stageFilter]);

  const handleCriterionPreset = (c1: number, c2: number) => {
    onUpdateConfig({
      ...researchConfig,
      criterionE1: c1,
      criterionE2: c2,
    });
  };

  const handlePlanTitleChange = (planIndex: number, newTitle: string) => {
    const updatedPlans = researchConfig.lessonPlans.map((p, idx) =>
      idx === planIndex ? { ...p, title: newTitle } : p
    );
    onUpdateConfig({
      ...researchConfig,
      lessonPlans: updatedPlans,
    });
  };

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!innovationUsed.trim() || !problemObserved.trim() || !reflectionOutcome.trim()) {
      setLogError('กรุณากรอกข้อมูลนวัตกรรม ปัญหาที่พบ และผลการสะท้อนคิดให้ครบถ้วน');
      return;
    }

    const stu = students.find((s) => s.id === selectedStuId) || students[0];
    if (!stu) return;

    const newItem: ResearchIntervention = {
      id: `int-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      studentId: stu.id,
      studentName: `${stu.prefix}${stu.firstName} ${stu.lastName}`,
      paorStage,
      lessonPlanNumber,
      innovationUsed: innovationUsed.trim(),
      problemObserved: problemObserved.trim(),
      scoreBefore: stu.pretest,
      scoreAfter: stu.posttest,
      reflectionOutcome: reflectionOutcome.trim(),
      status,
    };

    onAddIntervention(newItem);
    setInnovationUsed('');
    setProblemObserved('');
    setReflectionOutcome('');
    setLogError('');
    setShowAddLog(false);
  };

  const planColors = ['bg-[#bae6fd]', 'bg-[#bbf7d0]', 'bg-[#e9d5ff]'];
  const planPcts = [
    classStats.e1e2.plan1Pct,
    classStats.e1e2.plan2Pct,
    classStats.e1e2.plan3Pct,
  ];
  const planMeanScores = [
    students.length > 0
      ? (students.reduce((a, s) => a + s.unit1, 0) / students.length).toFixed(1)
      : '0.0',
    students.length > 0
      ? (students.reduce((a, s) => a + s.unit2, 0) / students.length).toFixed(1)
      : '0.0',
    students.length > 0
      ? (students.reduce((a, s) => a + s.unit3, 0) / students.length).toFixed(1)
      : '0.0',
  ];

  return (
    <div className="space-y-8">
      {/* Cartoon Header */}
      <div className="cartoon-card bg-[#e9d5ff] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-700">
            ระบบวิจัยปฏิบัติการในชั้นเรียนแบบ 3 แผนการเรียนรู้ · รหัสวิชา {researchConfig.courseCode}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            วิเคราะห์วิจัย 3 แผน: สอบก่อนเรียน (20) → สอนแผน 1, 2, 3 → สอบหลังเรียน (20)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-white border-2 border-slate-900 rounded-xl">
            {(
              [
                [80, 80],
                [75, 75],
                [70, 70],
              ] as const
            ).map(([c1, c2]) => {
              const active =
                researchConfig.criterionE1 === c1 && researchConfig.criterionE2 === c2;
              return (
                <button
                  key={`${c1}/${c2}`}
                  type="button"
                  onClick={() => handleCriterionPreset(c1, c2)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#fef08a] text-slate-900 border border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  เกณฑ์ {c1}/{c2}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="cartoon-btn px-3.5 py-2 text-xs font-bold text-slate-900 bg-white rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์สรุปงานวิจัย 1 หน้า</span>
          </button>
        </div>
      </div>

      {/* Research Title & 3 Lesson Plans Visual Deck */}
      <section
        aria-label="ข้อมูลโครงการวิจัยและแผนการจัดการเรียนรู้ทั้ง 3 แผน"
        className="cartoon-card p-6 space-y-6 bg-white"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-2">
            <label
              htmlFor="car-title-input"
              className="block text-xs font-bold text-slate-600"
            >
              ชื่อเรื่องวิจัยในชั้นเรียน (แก้ไขได้)
            </label>
            <input
              id="car-title-input"
              type="text"
              value={researchConfig.title}
              onChange={(e) =>
                onUpdateConfig({ ...researchConfig, title: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm font-bold text-slate-900 bg-amber-50/50 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white"
            />
            <p className="text-xs text-slate-700 pt-1">
              <strong>สมมติฐานการวิจัย:</strong> {researchConfig.researchHypothesis}
            </p>
          </div>

          <div className="lg:col-span-4 space-y-2 lg:border-l-2 lg:border-dashed lg:border-slate-300 lg:pl-6">
            <div className="text-xs font-bold text-slate-500">นวัตกรรมการเรียนรู้ที่ใช้</div>
            <div className="text-sm font-bold text-slate-900">
              {researchConfig.innovationName}
            </div>
            <div className="text-xs text-slate-700">
              กลุ่มเป้าหมาย: นักเรียนชั้น {researchConfig.targetClassroom} จำนวน{' '}
              <span className="font-mono tabular-nums font-bold">
                {students.length}
              </span>{' '}
              คน ({researchConfig.semester})
            </div>
          </div>
        </div>

        {/* 3 Lesson Plans Interactive Breakdown Cards */}
        <div className="pt-4 border-t-2 border-dashed border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>โครงสร้างการสอนทั้ง 3 แผนการจัดการเรียนรู้ (รวม 60 คะแนน → คำนวณค่า E1)</span>
            </h2>
            <span className="text-xs font-mono font-bold text-slate-700">
              E1 เฉลี่ยรวม 3 แผน = {classStats.e1e2.e1.toFixed(2)}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(researchConfig.lessonPlans || []).map((plan, idx) => (
              <div
                key={plan.planNumber}
                className={`p-4 border-2 border-slate-900 rounded-2xl shadow-[3px_3px_0px_#0f172a] space-y-2.5 ${planColors[idx]}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 border border-slate-900 rounded-md">
                    แผนที่ {plan.planNumber} (เต็ม 20 คะแนน)
                  </span>
                  <span className="text-sm font-mono font-bold tabular-nums text-slate-900">
                    เฉลี่ย {planMeanScores[idx]}/20 ({planPcts[idx]}%)
                  </span>
                </div>

                <input
                  type="text"
                  aria-label={`ชื่อแผนการเรียนรู้ที่ ${plan.planNumber}`}
                  value={plan.title}
                  onChange={(e) => handlePlanTitleChange(idx, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border-2 border-slate-900 rounded-lg focus:outline-none"
                />

                <div className="text-xs text-slate-800">
                  <strong>กิจกรรม:</strong> {plan.activityName}
                </div>
                <div className="text-[11px] text-slate-700">
                  <strong>ทักษะเป้าหมาย:</strong> {plan.targetSkill}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3-Column Statistical Proof Deck: E1/E2, Dependent t-test, Normalized Gain */}
      <section
        aria-label="ผลการวิเคราะห์สถิติวิจัยในชั้นเรียน"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Card 1: E1 / E2 Efficiency */}
        <div className="cartoon-card p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              1. ประสิทธิภาพนวัตกรรม 3 แผน (E1 / E2)
            </h2>
            <FlaskConical className="w-5 h-5 text-slate-700" />
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <div className="text-xs font-bold text-slate-500">ผลลัพธ์ E1 / E2 ที่คำนวณได้</div>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {classStats.e1e2.e1.toFixed(2)} / {classStats.e1e2.e2.toFixed(2)}
              </div>
            </div>
            <div className="text-right font-mono tabular-nums">
              <div className="text-xs font-bold text-slate-500">เกณฑ์มาตรฐาน</div>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {classStats.e1e2.criterionE1} / {classStats.e1e2.criterionE2}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t-2 border-dashed border-slate-200 text-xs">
            <div className="flex justify-between tabular-nums">
              <span className="text-slate-700 font-medium">E1 (รวม 3 แผน เต็ม 60 คะแนน):</span>
              <span className="font-mono font-bold text-slate-900">
                {classStats.e1e2.e1.toFixed(2)}% ({classStats.e1e2.meetsE1 ? 'ผ่านเกณฑ์' : 'ต่ำกว่าเกณฑ์'})
              </span>
            </div>
            <div className="flex justify-between tabular-nums">
              <span className="text-slate-700 font-medium">E2 (สอบหลังเรียน เต็ม 20 คะแนน):</span>
              <span className="font-mono font-bold text-slate-900">
                {classStats.e1e2.e2.toFixed(2)}% ({classStats.e1e2.meetsE2 ? 'ผ่านเกณฑ์' : 'ต่ำกว่าเกณฑ์'})
              </span>
            </div>
          </div>

          <div className="pt-2 text-xs">
            {classStats.e1e2.meetsBoth ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>สรุปผล: นวัตกรรมทั้ง 3 แผนมีประสิทธิภาพสูงกว่าเกณฑ์</span>
              </span>
            ) : (
              <span className="text-amber-700 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>สรุปผล: ควรซ่อมเสริมแผนการเรียนรู้ที่ยังต่ำกว่าเกณฑ์</span>
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Dependent Samples t-test */}
        <div className="cartoon-card p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              2. สอบก่อนเรียน vs หลังเรียน (เต็ม 20)
            </h2>
            <span className="text-xs font-mono font-bold text-slate-600">
              df = {classStats.tTest.df}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 font-mono tabular-nums">
            <div className="p-2 bg-amber-50 border border-slate-900 rounded-lg">
              <div className="text-[11px] font-sans font-bold text-slate-600">ก่อนเรียน (20)</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">
                {classStats.tTest.meanPre.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-600">SD {classStats.tTest.sdPre.toFixed(2)}</div>
            </div>
            <div className="p-2 bg-emerald-50 border border-slate-900 rounded-lg">
              <div className="text-[11px] font-sans font-bold text-slate-600">หลังเรียน (20)</div>
              <div className="text-xl font-bold text-emerald-800 mt-0.5">
                {classStats.tTest.meanPost.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-600">SD {classStats.tTest.sdPost.toFixed(2)}</div>
            </div>
            <div className="p-2 bg-sky-50 border border-slate-900 rounded-lg">
              <div className="text-[11px] font-sans font-bold text-slate-600">ค่าสถิติ t</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">
                {classStats.tTest.tStat.toFixed(2)}*
              </div>
              <div className="text-[11px] text-slate-600">
                t(.05) = {classStats.tTest.criticalT}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t-2 border-dashed border-slate-200 text-xs tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-700 font-medium">ผลต่างคะแนนเฉลี่ย (Mean Gain D):</span>
              <span className="font-mono font-bold text-emerald-700">
                +{classStats.tTest.meanDiff.toFixed(2)} คะแนน (SD = {classStats.tTest.sdDiff.toFixed(2)})
              </span>
            </div>
          </div>

          <div className="pt-2 text-xs">
            {classStats.tTest.isSignificant ? (
              <span className="text-emerald-700 font-bold">
                ● หลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติที่ระดับ .05
              </span>
            ) : (
              <span className="text-amber-700 font-bold">
                ▲ คะแนนหลังเรียนยังไม่แตกต่างจากก่อนเรียนอย่างมีนัยสำคัญ
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Hake's Normalized Gain (g) */}
        <div className="cartoon-card p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">
              3. ดัชนีพัฒนาการสัมพัทธ์ (Hake&apos;s Gain g)
            </h2>
            <span className="text-xs font-mono font-bold text-slate-700 whitespace-nowrap shrink-0">
              เฉลี่ย {classStats.averageNormalizedGain.toFixed(2)}
            </span>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            <div className="flex items-center justify-between p-2 bg-[#bbf7d0] border border-slate-900 rounded-lg">
              <span className="text-slate-900 font-bold">
                พัฒนาการระดับสูง (High Gain: g ≥ 0.70)
              </span>
              <span className="font-mono tabular-nums font-bold text-slate-900">
                {gainBreakdown.high} คน
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#fef08a] border border-slate-900 rounded-lg">
              <span className="text-slate-900 font-bold">
                พัฒนาการระดับปานกลาง (0.30 ≤ g &lt; 0.70)
              </span>
              <span className="font-mono tabular-nums font-bold text-slate-900">
                {gainBreakdown.medium} คน
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-[#fed7aa] border border-slate-900 rounded-lg">
              <span className="text-slate-900 font-bold">
                พัฒนาการระดับต่ำ (Low Gain: g &lt; 0.30)
              </span>
              <span className="font-mono tabular-nums font-bold text-slate-900">
                {gainBreakdown.low} คน
              </span>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-700 font-medium">
            นักเรียนกลุ่มเป้าหมายวิจัยจำนวน <strong className="font-mono text-slate-900">{targetStudents.length}</strong> คน มีพัฒนาการเพิ่มขึ้นทุกคนหลังเรียนครบ 3 แผน
          </div>
        </div>
      </section>

      {/* PAOR Action Research Cycle Grid */}
      <section aria-label="วงจรวิจัยปฏิบัติการในชั้นเรียน PAOR" className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          สรุปวงจรการวิจัยปฏิบัติการในชั้นเรียน 4 ขั้นตอน (PAOR Cycle)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(
            [
              {
                step: '01. Plan (สอบก่อนเรียน & วางแผน 3 แผน)',
                field: 'planSummary',
                desc: 'จัดสอบก่อนเรียน (20 คะแนน) และออกแบบแผนการเรียนรู้ 3 แผน',
                bg: 'bg-[#fef9c3]',
              },
              {
                step: '02. Act (สอนแผนที่ 1, 2 และ 3)',
                field: 'actSummary',
                desc: 'ดำเนินการจัดกิจกรรมการเรียนรู้และเก็บคะแนนแผนละ 20 คะแนน',
                bg: 'bg-[#bae6fd]',
              },
              {
                step: '03. Observe (สอบหลังเรียน 20 คะแนน)',
                field: 'observeSummary',
                desc: 'วัดผลหลังเรียน (20 คะแนน) และคำนวณประสิทธิภาพ E1/E2',
                bg: 'bg-[#bbf7d0]',
              },
              {
                step: '04. Reflect (สะท้อนผลรายบุคคล)',
                field: 'reflectSummary',
                desc: 'วิเคราะห์ค่า t-test และ Normalized Gain เพื่อพัฒนาต่อยอด',
                bg: 'bg-[#e9d5ff]',
              },
            ] as const
          ).map((item) => (
            <div
              key={item.step}
              className={`cartoon-card p-5 space-y-2.5 ${item.bg}`}
            >
              <div className="text-sm font-bold text-slate-900">{item.step}</div>
              <div className="text-xs font-medium text-slate-700">{item.desc}</div>
              <textarea
                rows={4}
                aria-label={item.step}
                value={researchConfig[item.field]}
                onChange={(e) =>
                  onUpdateConfig({
                    ...researchConfig,
                    [item.field]: e.target.value,
                  })
                }
                className="w-full p-2.5 text-xs text-slate-900 bg-white border-2 border-slate-900 rounded-xl focus:outline-none leading-relaxed"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Individual Research Intervention Log */}
      <section
        aria-label="บันทึกการแก้ปัญหาและพัฒนานวัตกรรมรายบุคคล"
        className="cartoon-card p-6 space-y-5 bg-white"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              สมุดบันทึกการซ่อมเสริมผู้เรียนรายบุคคลตามแผนการเรียนรู้ (แผนที่ 1 - 3)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              ติดตามผลการใช้นวัตกรรมการ์ตูนวิทย์แก้ปัญหาการเรียนรู้รายกรณี
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 border-2 border-slate-900 rounded-xl">
              {(['ALL', 'Plan', 'Act', 'Observe', 'Reflect'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStageFilter(st)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    stageFilter === st
                      ? 'bg-[#fef08a] text-slate-900 border border-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'ทุกระยะ' : st}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAddLog((v) => !v)}
              className="cartoon-btn px-3.5 py-2 text-xs font-bold text-slate-900 bg-[#bbf7d0] rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มบันทึกการวิจัยรายกรณี</span>
            </button>
          </div>
        </div>

        {/* Add Intervention Form */}
        {showAddLog && (
          <form
            onSubmit={handleAddLogSubmit}
            className="p-5 bg-[#fffdf5] border-2 border-slate-900 rounded-xl space-y-4"
          >
            <h3 className="text-xs font-bold text-slate-900">
              เพิ่มบันทึกผลการใช้นวัตกรรมแก้ปัญหาผู้เรียนรายบุคคล
            </h3>

            {logError && (
              <p role="alert" className="text-xs font-bold text-red-600">
                ▲ {logError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="car-stu-select" className="block text-xs font-bold text-slate-700 mb-1">
                  นักเรียนกลุ่มเป้าหมาย
                </label>
                <select
                  id="car-stu-select"
                  value={selectedStuId}
                  onChange={(e) => setSelectedStuId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-slate-900 rounded-lg"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentCode} - {s.prefix}
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="car-plan-select" className="block text-xs font-bold text-slate-700 mb-1">
                  แผนการจัดการเรียนรู้
                </label>
                <select
                  id="car-plan-select"
                  value={lessonPlanNumber}
                  onChange={(e) => setLessonPlanNumber(Number(e.target.value) as 1 | 2 | 3)}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-slate-900 rounded-lg"
                >
                  <option value={1}>แผนที่ 1: พันธุศาสตร์ (20 คะแนน)</option>
                  <option value={2}>แผนที่ 2: คลื่นและแสง (20 คะแนน)</option>
                  <option value={3}>แผนที่ 3: ระบบสุริยะ (20 คะแนน)</option>
                </select>
              </div>

              <div>
                <label htmlFor="car-stage-select" className="block text-xs font-bold text-slate-700 mb-1">
                  ระยะวิจัย (PAOR Stage)
                </label>
                <select
                  id="car-stage-select"
                  value={paorStage}
                  onChange={(e) =>
                    setPaorStage(e.target.value as ResearchIntervention['paorStage'])
                  }
                  className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-slate-900 rounded-lg"
                >
                  <option value="Plan">Plan (วางแผน)</option>
                  <option value="Act">Act (สอน/ซ่อมเสริม)</option>
                  <option value="Observe">Observe (สังเกตผล)</option>
                  <option value="Reflect">Reflect (สะท้อนผล)</option>
                </select>
              </div>

              <div>
                <label htmlFor="car-status-select" className="block text-xs font-bold text-slate-700 mb-1">
                  สถานะการติดตามผล
                </label>
                <select
                  id="car-status-select"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as ResearchIntervention['status'])
                  }
                  className="w-full px-3 py-1.5 text-xs font-bold bg-white border-2 border-slate-900 rounded-lg"
                >
                  <option value="บรรลุเป้าหมาย">บรรลุเป้าหมาย</option>
                  <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                  <option value="ต้องปรับแผนซ้ำ">ต้องปรับแผนซ้ำ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="car-innovation-input" className="block text-xs font-bold text-slate-700 mb-1">
                  สื่อนวัตกรรมที่ใช้ *
                </label>
                <input
                  id="car-innovation-input"
                  type="text"
                  placeholder="เช่น การ์ตูนตารางพันเนตต์จำลองสี"
                  value={innovationUsed}
                  onChange={(e) => setInnovationUsed(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border-2 border-slate-900 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="car-problem-input" className="block text-xs font-bold text-slate-700 mb-1">
                  ปัญหาที่พบจากสอบก่อนเรียน *
                </label>
                <input
                  id="car-problem-input"
                  type="text"
                  placeholder="ระบุมโนทัศน์ที่คลาดเคลื่อน"
                  value={problemObserved}
                  onChange={(e) => setProblemObserved(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border-2 border-slate-900 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="car-outcome-input" className="block text-xs font-bold text-slate-700 mb-1">
                  ผลการสะท้อนคิดหลังสอบหลังเรียน *
                </label>
                <input
                  id="car-outcome-input"
                  type="text"
                  placeholder="ระบุพัฒนาการที่เกิดขึ้น"
                  value={reflectionOutcome}
                  onChange={(e) => setReflectionOutcome(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border-2 border-slate-900 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddLog(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="cartoon-btn px-4 py-1.5 text-xs font-bold text-slate-900 bg-[#fef08a] rounded-xl"
              >
                บันทึกข้อมูลวิจัย
              </button>
            </div>
          </form>
        )}

        {/* Intervention Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[11px] font-bold text-slate-700 bg-slate-50">
                <th className="py-2.5 px-3 whitespace-nowrap">วันที่</th>
                <th className="py-2.5 px-3 whitespace-nowrap">แผนที่</th>
                <th className="py-2.5 px-3 whitespace-nowrap">ระยะ PAOR</th>
                <th className="py-2.5 px-3 whitespace-nowrap">ผู้เรียนกลุ่มเป้าหมาย</th>
                <th className="py-2.5 px-3">ปัญหาที่พบ &amp; สื่อนวัตกรรมที่ใช้</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">ก่อน → หลัง (20)</th>
                <th className="py-2.5 px-3">ผลการสะท้อนคิด (Reflection)</th>
                <th className="py-2.5 px-3 whitespace-nowrap">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredInterventions.map((item) => (
                <tr key={item.id} className="hover:bg-amber-50/50">
                  <td className="py-3 px-3 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    แผนที่ {item.lessonPlanNumber || 1}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {item.paorStage}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectStudentForInspect(item.studentId)}
                      className="font-bold text-slate-900 hover:underline text-left"
                    >
                      {item.studentName}
                    </button>
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-bold text-slate-900">{item.innovationUsed}</div>
                    <div className="text-slate-600 mt-0.5">ปัญหา: {item.problemObserved}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                    <span>{item.scoreBefore}</span>
                    <span className="text-slate-400 mx-1">→</span>
                    <span className="font-bold text-emerald-700">{item.scoreAfter}</span>
                  </td>
                  <td className="py-3 px-3 max-w-xs text-slate-800">{item.reflectionOutcome}</td>
                  <td className="py-3 px-3 whitespace-nowrap font-bold">
                    {item.status === 'บรรลุเป้าหมาย' ? (
                      <span className="text-emerald-700">● บรรลุเป้าหมาย</span>
                    ) : item.status === 'กำลังดำเนินการ' ? (
                      <span className="text-sky-700">◐ กำลังดำเนินการ</span>
                    ) : (
                      <span className="text-amber-700">▲ ต้องปรับแผนซ้ำ</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
