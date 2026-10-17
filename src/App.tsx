import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  StudentRecord,
  ResearchIntervention,
  ResearchProjectConfig,
  INITIAL_STUDENTS,
  INITIAL_INTERVENTIONS,
  INITIAL_RESEARCH_CONFIG,
  calculateClassSummary,
} from './utils/analytics';
import { initAuth } from './services/googleSheets';
import { DashboardView } from './components/DashboardView';
import { GradebookView } from './components/GradebookView';
import { ActionResearchView } from './components/ActionResearchView';
import { GoogleSheetsSyncView } from './components/GoogleSheetsSyncView';

const STORAGE_KEYS = {
  STUDENTS: 'sciwit_car_students_v3_prepost20',
  INTERVENTIONS: 'sciwit_car_interventions_v3_prepost20',
  CONFIG: 'sciwit_car_config_v3_prepost20',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gradebook' | 'research' | 'sheets'>(
    'dashboard'
  );

  const [students, setStudents] = useState<StudentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && 'completedPlan1' in parsed[0]) {
          return parsed;
        }
      }
    } catch {
      // ignore storage error
    }
    return INITIAL_STUDENTS;
  });

  const [interventions, setInterventions] = useState<ResearchIntervention[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INTERVENTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage error
    }
    return INITIAL_INTERVENTIONS;
  });

  const [researchConfig, setResearchConfig] = useState<ResearchProjectConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.targetCriterionPct === 'number') return parsed;
      }
    } catch {
      // ignore storage error
    }
    return INITIAL_RESEARCH_CONFIG;
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    () => students[0]?.id || 'stu-30101'
  );

  // Firebase / Google OAuth state (token stored strictly in memory in googleSheets.ts)
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setGoogleUser(u);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));
    } catch {
      // ignore
    }
  }, [interventions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(researchConfig));
    } catch {
      // ignore
    }
  }, [researchConfig]);

  const classStats = useMemo(() => {
    return calculateClassSummary(students, researchConfig.targetCriterionPct);
  }, [students, researchConfig.targetCriterionPct]);

  const handleUpdateStudent = (updated: StudentRecord) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleAddStudent = (newStudent: StudentRecord) => {
    setStudents((prev) => [...prev, newStudent]);
    setSelectedStudentId(newStudent.id);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const handleResetDemoData = () => {
    setStudents(INITIAL_STUDENTS);
    setInterventions(INITIAL_INTERVENTIONS);
    setResearchConfig(INITIAL_RESEARCH_CONFIG);
    setSelectedStudentId(INITIAL_STUDENTS[0].id);
  };

  const handleSelectStudentForInspect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('dashboard');
  };

  const handleAddIntervention = (item: ResearchIntervention) => {
    setInterventions((prev) => [item, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-900">
      {/* Strict 3-Zone Top Bar Contract with Playful Cartoon Styling */}
      <header className="bg-white border-b-2 border-slate-900 px-3 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap sm:flex-nowrap items-center justify-between gap-y-2 sm:gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
            className="font-cartoon text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            SciWIT Cartoon Lab
          </a>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav
            aria-label="เมนูหลัก"
            className="w-full sm:w-auto order-3 sm:order-2 flex items-center justify-between sm:justify-start gap-2 sm:gap-7 text-xs sm:text-sm font-bold text-slate-700 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200"
          >
            <a
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('dashboard');
              }}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'dashboard'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              แดชบอร์ดรายบุคคล
            </a>
            <a
              href="#gradebook"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('gradebook');
              }}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'gradebook'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              บันทึกคะแนน
            </a>
            <a
              href="#research"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('research');
              }}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'research'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              วิจัยในชั้นเรียน
            </a>
            <a
              href="#sheets"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('sheets');
              }}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'sheets'
                  ? 'text-slate-900 underline underline-offset-8 decoration-2'
                  : 'hover:text-slate-900'
              }`}
            >
              Google Sheets
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="order-2 sm:order-3 flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('sheets')}
              className="cartoon-btn px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-slate-900 bg-[#bbf7d0] rounded-xl whitespace-nowrap shrink-0"
            >
              {googleToken ? 'ซิงค์ Google Sheets' : 'เชื่อมต่อ Google Sheets'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            students={students}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            onUpdateStudent={handleUpdateStudent}
            classStats={classStats}
            courseTitle={`${researchConfig.courseCode} ${researchConfig.courseName} · ชั้น ${researchConfig.targetClassroom}`}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'gradebook' && (
          <GradebookView
            students={students}
            onUpdateStudent={handleUpdateStudent}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
            onResetDemoData={handleResetDemoData}
            onSelectStudentForInspect={handleSelectStudentForInspect}
          />
        )}

        {activeTab === 'research' && (
          <ActionResearchView
            students={students}
            researchConfig={researchConfig}
            onUpdateConfig={setResearchConfig}
            interventions={interventions}
            onAddIntervention={handleAddIntervention}
            classStats={classStats}
            onSelectStudentForInspect={handleSelectStudentForInspect}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsSyncView
            students={students}
            onReplaceStudents={setStudents}
            user={googleUser}
            accessToken={googleToken}
            onAuthChange={(u, t) => {
              setGoogleUser(u);
              setGoogleToken(t);
            }}
          />
        )}
      </main>

      {/* Quiet Cartoon Footer */}
      <footer className="bg-white border-t-2 border-slate-900 px-4 sm:px-8 py-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-slate-700">
          <span>
            SciWIT Cartoon Lab · วิจัยในชั้นเรียน (สอบก่อนเรียน 20 คะแนน → สอน 3 แผน ไม่เก็บคะแนน → สอบหลังเรียน 20 คะแนน)
          </span>
          <span>
            รายวิชา {researchConfig.courseCode} {researchConfig.courseName} · นักเรียนทั้งหมด{' '}
            {students.length} คน
          </span>
        </div>
      </footer>
    </div>
  );
}
