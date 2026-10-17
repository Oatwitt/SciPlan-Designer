import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Download,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import {
  StudentRecord,
  SCORE_MAX,
  calculateTotalScore,
  calculateThreePlansScore,
  calculateThaiGrade,
  calculateNormalizedGain,
  clampScore,
} from '../utils/analytics';

interface GradebookViewProps {
  students: StudentRecord[];
  onUpdateStudent: (updated: StudentRecord) => void;
  onAddStudent: (newStudent: StudentRecord) => void;
  onDeleteStudent: (studentId: string) => void;
  onResetDemoData: () => void;
  onSelectStudentForInspect: (studentId: string) => void;
}

export const GradebookView: React.FC<GradebookViewProps> = ({
  students,
  onUpdateStudent,
  onAddStudent,
  onDeleteStudent,
  onResetDemoData,
  onSelectStudentForInspect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [formError, setFormError] = useState('');

  // New Student Form State
  const [newCode, setNewCode] = useState('');
  const [newPrefix, setNewPrefix] = useState('ด.ช.');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newClassroom, setNewClassroom] = useState('ม.3/1');
  const [newLearningStyle, setNewLearningStyle] =
    useState<StudentRecord['learningStyle']>('Visual');
  const [newPretest, setNewPretest] = useState('9');
  const [newPosttest, setNewPosttest] = useState('17');

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.studentCode.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery]);

  const handleScoreCellChange = (
    student: StudentRecord,
    field: 'pretest' | 'unit1' | 'unit2' | 'unit3' | 'posttest' | 'affective',
    rawVal: string
  ) => {
    const clamped = clampScore(Number(rawVal), SCORE_MAX[field]);
    onUpdateStudent({
      ...student,
      [field]: clamped,
    });
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newFirstName.trim() || !newLastName.trim()) {
      setFormError('กรุณากรอกรหัสนักเรียน ชื่อ และนามสกุลให้ครบถ้วน');
      return;
    }
    if (students.some((s) => s.studentCode === newCode.trim())) {
      setFormError('รหัสนักเรียนนี้มีอยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    const created: StudentRecord = {
      id: `stu-${newCode.trim()}-${Date.now()}`,
      studentCode: newCode.trim(),
      prefix: newPrefix,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      classroom: newClassroom.trim() || 'ม.3/1',
      attendanceRate: 96,
      pretest: clampScore(Number(newPretest), SCORE_MAX.pretest),
      unit1: 16,
      unit2: 16,
      unit3: 17,
      posttest: clampScore(Number(newPosttest), SCORE_MAX.posttest),
      affective: 18,
      learningStyle: newLearningStyle,
      researchTargetGroup: Number(newPretest) < 10,
      teacherNote: 'เพิ่มข้อมูลผู้เรียนใหม่เข้าสู่การวิจัย 3 แผน',
    };

    onAddStudent(created);
    setNewCode('');
    setNewFirstName('');
    setNewLastName('');
    setFormError('');
    setShowAddForm(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'รหัสนักเรียน',
      'คำนำหน้า',
      'ชื่อ',
      'นามสกุล',
      'ห้องเรียน',
      'สอบก่อนเรียน(20)',
      'สอนแผนที่1(20)',
      'สอนแผนที่2(20)',
      'สอนแผนที่3(20)',
      'รวม3แผนE1(60)',
      'สอบหลังเรียนE2(20)',
      'จิตพิสัย(20)',
      'คะแนนรวม(100)',
      'เกรด',
      'NormalizedGain(g)',
    ];

    const rows = students.map((s) => {
      const threePlans = calculateThreePlansScore(s);
      const total = calculateTotalScore(s);
      const grade = calculateThaiGrade(total);
      const gain = calculateNormalizedGain(s.pretest, s.posttest).gain;
      return [
        s.studentCode,
        s.prefix,
        s.firstName,
        s.lastName,
        s.classroom,
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
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sciwit_3plans_gradebook_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Cartoon Header & Controls */}
      <div className="cartoon-card bg-[#bae6fd] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-700">
            สมุดบันทึกคะแนนการวิจัยในชั้นเรียน 3 แผนการเรียนรู้
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            ตารางบันทึกคะแนน: สอบก่อนเรียน (20) · สอนแผน 1-3 (แผนละ 20) · สอบหลังเรียน (20)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="cartoon-btn px-3.5 py-2 text-xs font-bold text-slate-900 bg-[#fef08a] rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มนักเรียนใหม่</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="cartoon-btn px-3.5 py-2 text-xs font-bold text-slate-900 bg-white rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออก CSV</span>
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="cartoon-btn px-3.5 py-2 text-xs font-bold text-slate-700 bg-white rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตค่าเริ่มต้น</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#fed7aa] border-2 border-slate-900 px-3 py-1 rounded-xl">
              <span className="text-xs text-slate-900 font-bold">ยืนยันรีเซ็ตคะแนน?</span>
              <button
                type="button"
                onClick={() => {
                  onResetDemoData();
                  setConfirmReset(false);
                }}
                className="px-2 py-1 text-xs font-bold text-white bg-slate-900 rounded-lg"
              >
                ยืนยัน
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 text-xs font-bold text-slate-700 hover:text-slate-900"
              >
                ยกเลิก
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Student Collapsible Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddStudentSubmit}
          aria-label="แบบฟอร์มเพิ่มรายชื่อนักเรียนใหม่"
          className="cartoon-card p-5 space-y-4 bg-white"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">เพิ่มรายชื่อนักเรียนเข้าสู่การวิจัย 3 แผน</h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              aria-label="ปิดฟอร์มเพิ่มนักเรียน"
              className="text-slate-500 hover:text-slate-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-bold text-red-600">
              ▲ {formError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label htmlFor="new-stu-code" className="block text-xs font-bold text-slate-700 mb-1">
                รหัสนักเรียน *
              </label>
              <input
                id="new-stu-code"
                type="text"
                placeholder="เช่น 30111"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-mono bg-amber-50/40 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="new-stu-prefix" className="block text-xs font-bold text-slate-700 mb-1">
                คำนำหน้า
              </label>
              <select
                id="new-stu-prefix"
                value={newPrefix}
                onChange={(e) => setNewPrefix(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-amber-50/40 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white"
              >
                <option value="ด.ช.">ด.ช.</option>
                <option value="ด.ญ.">ด.ญ.</option>
                <option value="นาย">นาย</option>
                <option value="น.ส.">น.ส.</option>
              </select>
            </div>

            <div>
              <label htmlFor="new-stu-fname" className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อจริง *
              </label>
              <input
                id="new-stu-fname"
                type="text"
                placeholder="ชื่อ"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-amber-50/40 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="new-stu-lname" className="block text-xs font-bold text-slate-700 mb-1">
                นามสกุล *
              </label>
              <input
                id="new-stu-lname"
                type="text"
                placeholder="นามสกุล"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-amber-50/40 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="new-stu-pretest" className="block text-xs font-bold text-slate-700 mb-1">
                สอบก่อนเรียน (20)
              </label>
              <input
                id="new-stu-pretest"
                type="number"
                min={0}
                max={20}
                step="0.5"
                value={newPretest}
                onChange={(e) => setNewPretest(e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-mono tabular-nums bg-amber-50/40 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="new-stu-posttest" className="block text-xs font-bold text-slate-700 mb-1">
                สอบหลังเรียน (20)
              </label>
              <input
                id="new-stu-posttest"
                type="number"
                min={0}
                max={20}
                step="0.5"
                value={newPosttest}
                onChange={(e) => setNewPosttest(e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-mono tabular-nums bg-amber-50/40 border-2 border-slate-900 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <label htmlFor="new-stu-style" className="text-xs font-bold text-slate-700">
                รูปแบบการเรียนรู้:
              </label>
              <select
                id="new-stu-style"
                value={newLearningStyle}
                onChange={(e) =>
                  setNewLearningStyle(e.target.value as StudentRecord['learningStyle'])
                }
                className="px-2.5 py-1 text-xs font-bold bg-white border-2 border-slate-900 rounded-lg"
              >
                <option value="Visual">Visual (เน้นภาพการ์ตูน/แผนผัง)</option>
                <option value="Kinesthetic">Kinesthetic (เน้นปฏิบัติการทดลอง)</option>
                <option value="Analytical">Analytical (เน้นคิดคำนวณ)</option>
                <option value="Collaborative">Collaborative (เน้นกลุ่มร่วมมือ)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="cartoon-btn px-4 py-1.5 text-xs font-bold text-slate-900 bg-[#bbf7d0] rounded-xl flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกนักเรียนใหม่</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search Bar & Score Structure Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            aria-label="ค้นหานักเรียนในตารางคะแนน"
            placeholder="ค้นหารหัสประจำตัว หรือชื่อ-นามสกุล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-white border-2 border-slate-900 rounded-xl focus:outline-none"
          />
        </div>
        <div className="text-xs font-bold text-slate-700 tabular-nums">
          โครงสร้าง: สอบก่อนเรียน (20) · สอนแผน 1+2+3 = E1 (60) · สอบหลังเรียน E2 (20) · จิตพิสัย (20)
        </div>
      </div>

      {/* High-Density Cartoon Gradebook Spreadsheet Table */}
      <div className="cartoon-card overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-[#fef08a] text-[11px] font-bold text-slate-900">
                <th className="py-3 px-3 whitespace-nowrap">รหัส</th>
                <th className="py-3 px-3 whitespace-nowrap">ชื่อ - นามสกุล</th>
                <th className="py-3 px-2 text-right whitespace-nowrap bg-amber-100">
                  1. สอบก่อนเรียน (20)
                </th>
                <th className="py-3 px-2 text-right whitespace-nowrap bg-sky-100">
                  สอนแผนที่ 1 (20)
                </th>
                <th className="py-3 px-2 text-right whitespace-nowrap bg-emerald-100">
                  สอนแผนที่ 2 (20)
                </th>
                <th className="py-3 px-2 text-right whitespace-nowrap bg-purple-100">
                  สอนแผนที่ 3 (20)
                </th>
                <th className="py-3 px-2 text-right whitespace-nowrap bg-slate-100">
                  รวม 3 แผน E1 (60)
                </th>
                <th className="py-3 px-2 text-right whitespace-nowrap bg-orange-100">
                  2. สอบหลังเรียน E2 (20)
                </th>
                <th className="py-3 px-2 text-right whitespace-nowrap">จิตพิสัย (20)</th>
                <th className="py-3 px-3 text-right whitespace-nowrap bg-slate-100">รวม (100)</th>
                <th className="py-3 px-2 text-right whitespace-nowrap">เกรด</th>
                <th className="py-3 px-2 text-right whitespace-nowrap">ค่า (g)</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">เป้าหมายวิจัย</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredStudents.map((stu) => {
                const threePlans = calculateThreePlansScore(stu);
                const total = calculateTotalScore(stu);
                const grade = calculateThaiGrade(total);
                const gainObj = calculateNormalizedGain(stu.pretest, stu.posttest);

                return (
                  <tr key={stu.id} className="hover:bg-amber-50/60 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold tabular-nums text-slate-700 whitespace-nowrap">
                      {stu.studentCode}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectStudentForInspect(stu.id)}
                        className="font-bold text-slate-900 hover:underline text-left"
                      >
                        {stu.prefix}
                        {stu.firstName} {stu.lastName}
                      </button>
                    </td>

                    {/* Pre-test (20) */}
                    <td className="py-1.5 px-2 text-right bg-amber-50/40">
                      <input
                        type="number"
                        aria-label={`pretest ของ ${stu.firstName}`}
                        min={0}
                        max={20}
                        step="0.5"
                        value={stu.pretest}
                        onChange={(e) => handleScoreCellChange(stu, 'pretest', e.target.value)}
                        className="w-16 px-1.5 py-1 text-right font-mono font-bold tabular-nums bg-white border-2 border-slate-900 rounded-md focus:outline-none"
                      />
                    </td>

                    {/* Lesson Plans 1, 2, 3 (20 points each) */}
                    {(
                      [
                        { field: 'unit1', max: 20 },
                        { field: 'unit2', max: 20 },
                        { field: 'unit3', max: 20 },
                      ] as const
                    ).map(({ field, max }) => (
                      <td key={field} className="py-1.5 px-2 text-right">
                        <input
                          type="number"
                          aria-label={`${field} ของ ${stu.firstName}`}
                          min={0}
                          max={max}
                          step="0.5"
                          value={stu[field]}
                          onChange={(e) => handleScoreCellChange(stu, field, e.target.value)}
                          className="w-16 px-1.5 py-1 text-right font-mono font-bold tabular-nums bg-white border-2 border-slate-900 rounded-md focus:outline-none"
                        />
                      </td>
                    ))}

                    {/* Sum of 3 Plans (60) */}
                    <td className="py-2 px-2 text-right font-mono tabular-nums font-bold text-slate-900 bg-slate-100/70">
                      {threePlans.toFixed(1)}
                    </td>

                    {/* Post-test (20) */}
                    <td className="py-1.5 px-2 text-right bg-orange-50/40">
                      <input
                        type="number"
                        aria-label={`posttest ของ ${stu.firstName}`}
                        min={0}
                        max={20}
                        step="0.5"
                        value={stu.posttest}
                        onChange={(e) => handleScoreCellChange(stu, 'posttest', e.target.value)}
                        className="w-16 px-1.5 py-1 text-right font-mono font-bold tabular-nums bg-white border-2 border-slate-900 rounded-md focus:outline-none"
                      />
                    </td>

                    {/* Affective (20) */}
                    <td className="py-1.5 px-2 text-right">
                      <input
                        type="number"
                        aria-label={`affective ของ ${stu.firstName}`}
                        min={0}
                        max={20}
                        step="0.5"
                        value={stu.affective}
                        onChange={(e) => handleScoreCellChange(stu, 'affective', e.target.value)}
                        className="w-16 px-1.5 py-1 text-right font-mono font-bold tabular-nums bg-white border-2 border-slate-900 rounded-md focus:outline-none"
                      />
                    </td>

                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900 bg-slate-100/70">
                      {total.toFixed(1)}
                    </td>

                    <td className="py-2 px-2 text-right font-mono tabular-nums font-bold">
                      <span
                        className={
                          grade >= 3
                            ? 'text-emerald-700'
                            : grade < 2
                            ? 'text-amber-700'
                            : 'text-slate-900'
                        }
                      >
                        {grade.toFixed(1)}
                      </span>
                    </td>

                    <td className="py-2 px-2 text-right font-mono tabular-nums font-bold text-slate-800">
                      {gainObj.gain.toFixed(2)}
                    </td>

                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`กลุ่มเป้าหมายวิจัย ${stu.firstName}`}
                        checked={stu.researchTargetGroup}
                        onChange={(e) =>
                          onUpdateStudent({
                            ...stu,
                            researchTargetGroup: e.target.checked,
                          })
                        }
                        className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                      />
                    </td>

                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectStudentForInspect(stu.id)}
                          className="text-xs font-bold text-slate-900 hover:underline"
                        >
                          วิเคราะห์
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteStudent(stu.id)}
                          aria-label={`ลบข้อมูล ${stu.firstName}`}
                          className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
