import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  UploadCloud,
  DownloadCloud,
  PlusCircle,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import {
  StudentRecord,
  studentsToSheetRows,
  sheetRowsToStudents,
} from '../utils/analytics';
import {
  SpreadsheetMetadata,
  googleSignIn,
  logout,
  fetchSpreadsheetMetadata,
  createNewResearchSpreadsheet,
  readSheetValues,
  writeSheetValues,
} from '../services/googleSheets';

interface GoogleSheetsSyncViewProps {
  students: StudentRecord[];
  onReplaceStudents: (newStudents: StudentRecord[]) => void;
  user: User | null;
  accessToken: string | null;
  onAuthChange: (user: User | null, token: string | null) => void;
}

export const GoogleSheetsSyncView: React.FC<GoogleSheetsSyncViewProps> = ({
  students,
  onReplaceStudents,
  user,
  accessToken,
  onAuthChange,
}) => {
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [newSheetTitle, setNewSheetTitle] = useState(
    'SciWIT_วิจัยในชั้นเรียน_3แผน_ม.3/1'
  );
  const [connectedSheet, setConnectedSheet] = useState<SpreadsheetMetadata | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mandatory User Confirmation State before writing/updating Google Sheets
  const [showWriteConfirmModal, setShowWriteConfirmModal] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthChange(result.user, result.accessToken);
        setStatusMessage(`เข้าสู่ระบบสำเร็จในชื่อ ${result.user.email || result.user.displayName}`);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'การเข้าสู่ระบบด้วย Google ไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onAuthChange(null, null);
    setConnectedSheet(null);
    setStatusMessage('ออกจากระบบเชื่อมต่อ Google Sheets เรียบร้อยแล้ว');
  };

  const handleConnectExistingSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spreadsheetInput.trim()) {
      setErrorMessage('กรุณาวางลิงก์ URL หรือรหัส Spreadsheet ID ของ Google Sheets');
      return;
    }
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);
    try {
      const meta = await fetchSpreadsheetMetadata(spreadsheetInput);
      setConnectedSheet(meta);
      if (meta.sheetTabs.length > 0) {
        setSelectedTab(meta.sheetTabs[0].title);
      }
      setStatusMessage(`เชื่อมต่อไฟล์ "${meta.title}" สำเร็จ พบ ${meta.sheetTabs.length} แท็บชีต`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!newSheetTitle.trim()) {
      setErrorMessage('กรุณาระบุชื่อไฟล์ Google Sheets ที่ต้องการสร้าง');
      return;
    }
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);
    try {
      const rows = studentsToSheetRows(students);
      const meta = await createNewResearchSpreadsheet(newSheetTitle.trim(), rows);
      setConnectedSheet(meta);
      if (meta.sheetTabs.length > 0) {
        setSelectedTab(meta.sheetTabs[0].title);
      }
      setStatusMessage(
        `สร้างไฟล์ Google Sheets "${meta.title}" และส่งออกข้อมูลวิจัย 3 แผนของนักเรียน ${students.length} คนเรียบร้อยแล้ว`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'ไม่สามารถสร้างไฟล์ Google Sheets ใหม่ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullFromSheet = async () => {
    if (!connectedSheet || !selectedTab) return;
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);
    try {
      const rawRows = await readSheetValues(connectedSheet.spreadsheetId, selectedTab);
      const parsedStudents = sheetRowsToStudents(rawRows);
      if (parsedStudents.length === 0) {
        setErrorMessage(
          `ไม่พบข้อมูลนักเรียนในแท็บ "${selectedTab}" หรือรูปแบบคอลัมน์ไม่ตรงตามโครงสร้าง`
        );
      } else {
        onReplaceStudents(parsedStudents);
        setStatusMessage(
          `ดึงข้อมูลนักเรียนจำนวน ${parsedStudents.length} คน จากแท็บ "${selectedTab}" มาคำนวณบนแดชบอร์ดเรียบร้อยแล้ว`
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการอ่านข้อมูลจาก Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmedPushToSheet = async () => {
    if (!connectedSheet || !selectedTab) return;
    setShowWriteConfirmModal(false);
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);
    try {
      const rows = studentsToSheetRows(students);
      const res = await writeSheetValues(connectedSheet.spreadsheetId, selectedTab, rows);
      setStatusMessage(
        `อัปเดตข้อมูลนักเรียน ${students.length} คน (${res.updatedCells} เซลล์) ไปยังแท็บ "${selectedTab}" ในไฟล์ "${connectedSheet.title}" สำเร็จ`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลง Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Cartoon Header */}
      <div className="cartoon-card bg-[#bbf7d0] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-700">
            เชื่อมต่อข้อมูลสองทาง (Two-Way Sync) กับ Google Sheets API v4
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            ซิงค์ตารางคะแนนวิจัย 3 แผน (ก่อนเรียน 20 · แผน 1-3 · หลังเรียน 20) กับ Google Sheets
          </h1>
        </div>

        {user && accessToken && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800">
              เชื่อมต่อในชื่อ: <strong className="text-slate-900">{user.email}</strong>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="cartoon-btn px-3 py-1.5 text-xs font-bold text-slate-900 bg-white rounded-xl flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {statusMessage && (
        <div
          role="status"
          className="cartoon-card p-4 bg-[#bbf7d0] flex items-center gap-2.5 text-xs text-slate-900 font-bold"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="cartoon-card p-4 bg-[#fecaca] flex items-center gap-2.5 text-xs text-red-950 font-bold"
        >
          <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Authentication Gate */}
      {!accessToken ? (
        <section
          aria-label="เข้าสู่ระบบด้วย Google เพื่อใช้งาน Google Sheets"
          className="cartoon-card bg-white p-8 max-w-2xl space-y-5"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-[#bbf7d0] border-2 border-slate-900 rounded-2xl shadow-[2px_2px_0px_#0f172a] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                ยืนยันตัวตนเพื่อเชื่อมต่อ Google Sheets ของคุณ
              </h2>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                แอปพลิเคชันจะขอสิทธิ์อ่านและบันทึกตารางคะแนนวิจัย 3 แผนใน Google Sheets ตามที่คุณอนุญาต
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-xs font-medium text-slate-700">
            <li>• สร้างไฟล์ Google Sheets ใหม่พร้อมคอลัมน์ สอบก่อนเรียน (20 คะแนน), สถานะเรียนแผนที่ 1-3 และสอบหลังเรียน (20 คะแนน)</li>
            <li>• ดึงข้อมูลจากไฟล์ Google Sheets เดิมที่มีอยู่มาวิเคราะห์รายบุคคลแบบเรียลไทม์</li>
            <li>• มีระบบยืนยันก่อนบันทึกทับข้อมูลทุกครั้งเพื่อความปลอดภัยของข้อมูลครูผู้สอน</li>
          </ul>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="gsi-material-button"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isLoading ? 'กำลังเชื่อมต่อ...' : 'Sign in with Google'}
                </span>
                <span style={{ display: 'none' }}>Sign in with Google</span>
              </div>
            </button>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Option 1: Create a brand new Google Sheet */}
          <section className="cartoon-card bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                1. สร้างไฟล์ Google Sheets ใหม่จากข้อมูลวิจัย 3 แผน
              </h2>
              <PlusCircle className="w-5 h-5 text-slate-700" />
            </div>
            <p className="text-xs text-slate-700">
              สร้างไฟล์สเปรดชีตใหม่ในบัญชี Google ของคุณ พร้อมส่งออกข้อมูลนักเรียนทั้ง{' '}
              <span className="font-mono font-bold">{students.length}</span> คนทันที
            </p>
            <div>
              <label
                htmlFor="new-sheet-title"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                ชื่อไฟล์ Google Sheets ที่ต้องการสร้าง
              </label>
              <input
                id="new-sheet-title"
                type="text"
                value={newSheetTitle}
                onChange={(e) => setNewSheetTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-amber-50/40 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateNewSheet}
              disabled={isLoading}
              className="cartoon-btn px-4 py-2 text-xs font-bold text-slate-900 bg-[#fef08a] rounded-xl disabled:opacity-50 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>สร้างไฟล์ใหม่และส่งออกข้อมูล</span>
            </button>
          </section>

          {/* Option 2: Connect existing Google Sheet by URL/ID */}
          <section className="cartoon-card bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                2. เชื่อมต่อไฟล์ Google Sheets ที่มีอยู่แล้ว
              </h2>
              <FileSpreadsheet className="w-5 h-5 text-slate-700" />
            </div>
            <p className="text-xs text-slate-700">
              วางลิงก์ URL ของ Google Sheets หรือ Spreadsheet ID เพื่อดึงรายชื่อแท็บชีตทั้งหมด
            </p>
            <form onSubmit={handleConnectExistingSheet} className="space-y-3">
              <div>
                <label
                  htmlFor="existing-sheet-input"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  URL หรือ Spreadsheet ID
                </label>
                <input
                  id="existing-sheet-input"
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  value={spreadsheetInput}
                  onChange={(e) => setSpreadsheetInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-amber-50/40 border-2 border-slate-900 rounded-xl focus:outline-none focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="cartoon-btn px-4 py-2 text-xs font-bold text-slate-900 bg-[#bae6fd] rounded-xl disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ตรวจสอบและดึงรายชื่อแท็บชีต</span>
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Connected Sheet Controls */}
      {connectedSheet && (
        <section
          aria-label="จัดการการซิงค์ข้อมูลกับไฟล์ที่เชื่อมต่อ"
          className="cartoon-card bg-white p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-dashed border-slate-300">
            <div>
              <div className="text-xs font-bold text-slate-500">ไฟล์ Google Sheets ที่เชื่อมต่ออยู่</div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {connectedSheet.title}
              </h3>
              <div className="text-xs font-mono text-slate-600 mt-0.5">
                ID: {connectedSheet.spreadsheetId}
              </div>
            </div>

            <a
              href={connectedSheet.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cartoon-btn px-3.5 py-2 text-xs font-bold text-slate-900 bg-[#fef08a] rounded-xl flex items-center gap-1.5 self-start"
            >
              <span>เปิดดูไฟล์ใน Google Sheets</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label
                htmlFor="sheet-tab-select"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                เลือกแท็บชีต (Sheet Tab) ที่ต้องการใช้งาน
              </label>
              <select
                id="sheet-tab-select"
                value={selectedTab}
                onChange={(e) => setSelectedTab(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-amber-50/40 border-2 border-slate-900 rounded-xl"
              >
                {connectedSheet.sheetTabs.map((tab) => (
                  <option key={tab.sheetId} value={tab.title}>
                    {tab.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePullFromSheet}
              disabled={isLoading}
              className="cartoon-btn px-4 py-2 text-xs font-bold text-slate-900 bg-white rounded-xl flex items-center justify-center gap-1.5"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>ดึงข้อมูลจากชีตมาที่แอป (Pull)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWriteConfirmModal(true)}
              disabled={isLoading}
              className="cartoon-btn px-4 py-2 text-xs font-bold text-slate-900 bg-[#bbf7d0] rounded-xl flex items-center justify-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>บันทึกคะแนนจากแอปลงชีต (Push)</span>
            </button>
          </div>
        </section>
      )}

      {/* Mandatory Confirmation Dialog for Mutating Google Sheets Data */}
      {showWriteConfirmModal && connectedSheet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-write-title"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="cartoon-card bg-white max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 id="confirm-write-title" className="text-base font-bold text-slate-900">
                  ยืนยันการอัปเดตข้อมูลลงใน Google Sheets?
                </h3>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  การดำเนินการนี้จะเขียนทับข้อมูลตารางคะแนนวิจัย 3 แผนในไฟล์{' '}
                  <strong className="text-slate-900">&ldquo;{connectedSheet.title}&rdquo;</strong>{' '}
                  บนแท็บชีต <strong className="text-slate-900">&ldquo;{selectedTab}&rdquo;</strong>{' '}
                  ด้วยข้อมูลนักเรียนจำนวน{' '}
                  <strong className="font-mono text-slate-900">{students.length}</strong> คนจากแอปพลิเคชัน
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWriteConfirmModal(false)}
                className="cartoon-btn px-3.5 py-2 text-xs font-bold text-slate-700 bg-white rounded-xl"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmedPushToSheet}
                className="cartoon-btn px-4 py-2 text-xs font-bold text-slate-900 bg-[#bbf7d0] rounded-xl"
              >
                ยืนยันการบันทึกข้อมูล (Confirm Update)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
