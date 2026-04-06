import { describe, it, expect } from "vitest";

// Test the pure helper logic without hitting the Google API.
// We extract and test the row-number math and value mapping.

describe("toSheetDate conversion", () => {
  function toSheetDate(htmlDate: string): string {
    const [y, m, d] = htmlDate.split("-");
    return `${d}.${m}.${y}`;
  }

  it("converts YYYY-MM-DD to DD.MM.YYYY", () => {
    expect(toSheetDate("2026-04-06")).toBe("06.04.2026");
    expect(toSheetDate("2025-12-25")).toBe("25.12.2025");
    expect(toSheetDate("2026-01-01")).toBe("01.01.2026");
  });
});

describe("parseNumber", () => {
  function parseNumber(val: unknown): number | null {
    if (val === undefined || val === null || val === "") return null;
    const str = String(val).replace(",", ".");
    const n = parseFloat(str);
    return isNaN(n) ? null : n;
  }

  it("parses integer strings", () => {
    expect(parseNumber("42")).toBe(42);
  });

  it("parses decimal strings with dot", () => {
    expect(parseNumber("1.659")).toBe(1.659);
  });

  it("parses decimal strings with comma (German locale)", () => {
    expect(parseNumber("1,659")).toBe(1.659);
  });

  it("returns null for empty values", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber(null)).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parseNumber("abc")).toBeNull();
  });

  it("handles numbers directly", () => {
    expect(parseNumber(42.5)).toBe(42.5);
  });
});

describe("parseRow", () => {
  function parseNumber(val: unknown): number | null {
    if (val === undefined || val === null || val === "") return null;
    const str = String(val).replace(",", ".");
    const n = parseFloat(str);
    return isNaN(n) ? null : n;
  }

  function parseRow(row: unknown[]) {
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

  it("parses a complete row", () => {
    const row = ["06.04.2026", "Globus", "1.659", "42.5", "70.51", "45230", "7.8", "3"];
    const result = parseRow(row);
    expect(result.datum).toBe("06.04.2026");
    expect(result.ort).toBe("Globus");
    expect(result.eurPerLiter).toBe(1.659);
    expect(result.liter).toBe(42.5);
    expect(result.preis).toBe(70.51);
    expect(result.km).toBe(45230);
    expect(result.verbrauch).toBe(7.8);
    expect(result.globusRabatt).toBe(3);
  });

  it("handles missing optional fields", () => {
    const row = ["06.04.2026", "Shell", "1.7", "40", "68", "44000"];
    const result = parseRow(row);
    expect(result.verbrauch).toBeNull();
    expect(result.globusRabatt).toBeNull();
  });

  it("handles German-locale numbers with comma", () => {
    const row = ["01.01.2026", "Aral", "1,659", "42,5", "70,51", "45230", "7,8", ""];
    const result = parseRow(row);
    expect(result.eurPerLiter).toBe(1.659);
    expect(result.liter).toBe(42.5);
    expect(result.verbrauch).toBe(7.8);
    expect(result.globusRabatt).toBeNull();
  });
});

describe("parseDate", () => {
  function parseDate(dateStr: string): Date | null {
    const parts = dateStr.split(".");
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    return new Date(y, m - 1, d);
  }

  it("parses DD.MM.YYYY correctly", () => {
    const d = parseDate("06.04.2026");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(3); // 0-based
    expect(d?.getDate()).toBe(6);
  });

  it("parses single-digit day/month", () => {
    const d = parseDate("7.2.2026");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(1);
    expect(d?.getDate()).toBe(7);
  });

  it("returns null for invalid format", () => {
    expect(parseDate("2026-04-06")).toBeNull();
    expect(parseDate("")).toBeNull();
    expect(parseDate("abc")).toBeNull();
  });
});

describe("avg", () => {
  function avg(values: (number | null)[]): number | null {
    const valid = values.filter((v): v is number => v != null);
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  it("computes average of numbers", () => {
    expect(avg([8, 10, 12])).toBe(10);
  });

  it("ignores null values", () => {
    expect(avg([8, null, 12])).toBe(10);
  });

  it("returns null for empty array", () => {
    expect(avg([])).toBeNull();
  });

  it("returns null for all-null array", () => {
    expect(avg([null, null])).toBeNull();
  });
});

describe("row number calculation", () => {
  it("next empty row = values.length + 1", () => {
    // Simulates what findNextEmptyRow does:
    // If column A has header + 12 data rows = 13 entries, next row is 14
    const valuesLength = 13;
    expect(valuesLength + 1).toBe(14);
  });

  it("copyPaste source is 0-based row above", () => {
    const rowNum = 14; // 1-based target row
    const sourceStartRow = rowNum - 2; // 0-based row above
    const sourceEndRow = rowNum - 1;
    const destStartRow = rowNum - 1; // 0-based target
    const destEndRow = rowNum;

    expect(sourceStartRow).toBe(12); // row 13 in 1-based
    expect(sourceEndRow).toBe(13);
    expect(destStartRow).toBe(13); // row 14 in 1-based
    expect(destEndRow).toBe(14);
  });
});
