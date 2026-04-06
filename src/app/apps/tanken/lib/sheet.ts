import { getSheetsClient } from "@/lib/google-sheets/client";
import type { RefuelEntry, DashboardData } from "@/types/tanken";

const SHEET_ID = process.env.GOOGLE_SHEETS_TANKEN_ID!;
const TAB = process.env.GOOGLE_SHEETS_TANKEN_TAB || "Tanken Bus";

function parseNumber(val: unknown): number | null {
  if (val === undefined || val === null || val === "") return null;
  const str = String(val).replace(",", ".");
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

function parseRow(row: unknown[]): RefuelEntry {
  return {
    datum: String(row[0] ?? ""),
    ort: String(row[1] ?? ""),
    eurPerLiter: parseNumber(row[2]) ?? 0,
    liter: parseNumber(row[3]) ?? 0,
    preis: parseNumber(row[4]) ?? 0,
    km: parseNumber(row[5]) ?? 0,
    verbrauch: parseNumber(row[6]),
    globusRabatt: parseNumber(row[7]),
  };
}

/** Parse DD.MM.YYYY to a Date object. */
function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split(".");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m - 1, d);
}

/** Compute average of non-null numbers. */
function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export async function readDashboard(): Promise<DashboardData> {
  const sheets = getSheetsClient();

  // Read all data rows (skip header)
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${TAB}'!A2:H`,
  });

  const allRows = (data.values ?? [])
    .filter((row) => row[0]) // skip empty rows
    .map(parseRow);

  // All-time average consumption
  const verbrauchAllTime = avg(allRows.map((r) => r.verbrauch));

  // Last 100 days average consumption
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 100);
  const recent100 = allRows.filter((r) => {
    const d = parseDate(r.datum);
    return d != null && d >= cutoff;
  });
  const verbrauchLast100Days = avg(recent100.map((r) => r.verbrauch));

  // Last 10 entries (most recent at top)
  const recentEntries = allRows.slice(-10).reverse();
  const lastRow = allRows[allRows.length - 1];

  return {
    verbrauchAllTime,
    verbrauchLast100Days,
    recentEntries,
    lastOrt: lastRow?.ort ?? null,
    lastKm: lastRow?.km ?? null,
  };
}

/** Find the 1-based row number of the first empty row in column A (after header). */
export async function findNextEmptyRow(): Promise<number> {
  const sheets = getSheetsClient();
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${TAB}'!A:A`,
  });

  const values = data.values ?? [];
  // First empty slot after existing data
  return values.length + 1;
}

export interface AppendRefuelInput {
  datum: string; // DD.MM.YYYY
  ort: string;
  eurPerLiter: number;
  liter: number;
  preis: number;
  km: number;
  globusRabatt?: number | null;
}

export async function appendRefuelRow(input: AppendRefuelInput): Promise<void> {
  const sheets = getSheetsClient();
  const rowNum = await findNextEmptyRow();

  // Step 1: Write values to A-F and H (skip G — that's a formula)
  const values = [
    input.datum,
    input.ort,
    input.eurPerLiter,
    input.liter,
    input.preis,
    input.km,
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `'${TAB}'!A${rowNum}:F${rowNum}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });

  // Write Globus Rabatt to H if provided
  if (input.globusRabatt != null && input.globusRabatt !== 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${TAB}'!H${rowNum}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[input.globusRabatt]] },
    });
  }

  // Step 2: Copy formula from G{rowNum-1} to G{rowNum} + bold the new row
  // Get the sheet's grid ID for batchUpdate
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets.properties",
  });

  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === TAB
  );
  const sheetId = sheet?.properties?.sheetId ?? 0;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        // Copy formula from row above
        {
          copyPaste: {
            source: {
              sheetId,
              startRowIndex: rowNum - 2, // 0-based: row above
              endRowIndex: rowNum - 1,
              startColumnIndex: 6, // G
              endColumnIndex: 7,
            },
            destination: {
              sheetId,
              startRowIndex: rowNum - 1, // 0-based: new row
              endRowIndex: rowNum,
              startColumnIndex: 6,
              endColumnIndex: 7,
            },
            pasteType: "PASTE_FORMULA",
          },
        },
        // Bold the entire new row (A:H)
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowNum - 1,
              endRowIndex: rowNum,
              startColumnIndex: 0,
              endColumnIndex: 8, // A through H
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
              },
            },
            fields: "userEnteredFormat.textFormat.bold",
          },
        },
      ],
    },
  });
}
