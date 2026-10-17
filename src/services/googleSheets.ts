import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory (never in localStorage/sessionStorage per workspace-integration rules).
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่สามารถรับ Access Token จากการเข้าสู่ระบบ Google ได้');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheetTabs: { sheetId: number; title: string }[];
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export async function fetchSpreadsheetMetadata(spreadsheetIdOrUrl: string): Promise<SpreadsheetMetadata> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบด้วย Google ก่อนเชื่อมต่อ Google Sheets');
  }
  const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `ไม่พบไฟล์ Google Sheets หรือไม่มีสิทธิ์เข้าถึง (HTTP ${res.status})`
    );
  }
  const data = await res.json();
  const sheetTabs = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId ?? 0,
    title: s.properties?.title ?? 'Sheet1',
  }));
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    spreadsheetUrl:
      data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheetTabs,
  };
}

export async function createNewResearchSpreadsheet(
  title: string,
  initialRows: (string | number)[][]
): Promise<SpreadsheetMetadata> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบด้วย Google ก่อนสร้างไฟล์ Google Sheets');
  }

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: 'Gradebook_Scores',
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'CAR_Research_Summary',
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errBody = await createRes.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `ไม่สามารถสร้างไฟล์ Google Sheets ใหม่ได้ (HTTP ${createRes.status})`
    );
  }

  const created = await createRes.json();
  const spreadsheetId = created.spreadsheetId;

  // Populate initial gradebook rows into the newly created sheet
  await writeSheetValues(spreadsheetId, 'Gradebook_Scores', initialRows);

  const sheetTabs = (created.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId ?? 0,
    title: s.properties?.title ?? 'Gradebook_Scores',
  }));

  return {
    spreadsheetId,
    title: created.properties?.title || title,
    spreadsheetUrl:
      created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetTabs,
  };
}

export async function readSheetValues(
  spreadsheetIdOrUrl: string,
  sheetTabTitle: string
): Promise<any[][]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบด้วย Google ก่อนดึงข้อมูลจาก Google Sheets');
  }
  const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
  const range = `${sheetTabTitle}!A1:S200`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `ไม่สามารถอ่านข้อมูลจากแท็บ "${sheetTabTitle}" ได้ (HTTP ${res.status})`
    );
  }
  const data = await res.json();
  return data.values || [];
}

export async function writeSheetValues(
  spreadsheetIdOrUrl: string,
  sheetTabTitle: string,
  rows: (string | number)[][]
): Promise<{ updatedCells: number; updatedRows: number }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบด้วย Google ก่อนบันทึกข้อมูลลง Google Sheets');
  }
  const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
  const range = `${sheetTabTitle}!A1`;

  // Clear existing range first to prevent leftover trailing rows
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(`${sheetTabTitle}!A1:Z200`)}:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message || `ไม่สามารถบันทึกข้อมูลลงแท็บ "${sheetTabTitle}" ได้ (HTTP ${res.status})`
    );
  }

  const data = await res.json();
  return {
    updatedCells: data.updatedCells ?? 0,
    updatedRows: data.updatedRows ?? rows.length,
  };
}
