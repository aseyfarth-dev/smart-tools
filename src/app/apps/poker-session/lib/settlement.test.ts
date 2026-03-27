import { describe, it, expect } from "vitest";
import { calculateSettlements } from "./settlement";
import type { PlayerWithDetails } from "@/types/poker-session";

/** Helper to create a player with minimal required fields */
function player(
  name: string,
  opts: {
    totalBuyins: number;
    chipCount: number;
    cashPaid?: number;
  }
): PlayerWithDetails {
  return {
    id: name.toLowerCase(),
    name,
    buyins: [],
    totalBuyins: opts.totalBuyins,
    cashPaid: opts.cashPaid ?? 0,
    cashout: {
      id: `cashout-${name.toLowerCase()}`,
      player_id: name.toLowerCase(),
      chip_count: opts.chipCount,
      created_at: new Date().toISOString(),
    },
    netResult: opts.chipCount - opts.totalBuyins,
  };
}

describe("calculateSettlements", () => {
  it("returns empty array when no players", () => {
    expect(calculateSettlements([])).toEqual([]);
  });

  it("returns empty array when no one has cashed out", () => {
    const players: PlayerWithDetails[] = [
      {
        id: "a",
        name: "Alice",
        buyins: [],
        totalBuyins: 100,
        cashPaid: 0,
        cashout: null,
        netResult: null,
      },
    ];
    expect(calculateSettlements(players)).toEqual([]);
  });

  it("returns empty array when everyone breaks even", () => {
    const players = [
      player("Alice", { totalBuyins: 100, chipCount: 100 }),
      player("Bob", { totalBuyins: 100, chipCount: 100 }),
    ];
    expect(calculateSettlements(players)).toEqual([]);
  });

  it("handles basic 2-player settlement", () => {
    const players = [
      player("Alice", { totalBuyins: 100, chipCount: 150 }),
      player("Bob", { totalBuyins: 100, chipCount: 50 }),
    ];
    const result = calculateSettlements(players);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      fromPlayer: "Bob",
      toPlayer: "Alice",
      amount: 50,
    });
  });

  it("handles 3-player settlement with minimal transactions", () => {
    const players = [
      player("Alice", { totalBuyins: 100, chipCount: 160 }),
      player("Bob", { totalBuyins: 100, chipCount: 70 }),
      player("Charlie", { totalBuyins: 100, chipCount: 70 }),
    ];
    const result = calculateSettlements(players);

    // Alice is owed 60, Bob owes 30, Charlie owes 30
    expect(result).toHaveLength(2);

    const totalPaidToAlice = result
      .filter((t) => t.toPlayer === "Alice")
      .reduce((sum, t) => sum + t.amount, 0);
    expect(totalPaidToAlice).toBe(60);
  });

  it("handles cash paid to bank — creates Bank transactions", () => {
    const players = [
      player("Alice", { totalBuyins: 50, chipCount: 0, cashPaid: 50 }),
      player("Bob", { totalBuyins: 50, chipCount: 70, cashPaid: 0 }),
      player("Charlie", { totalBuyins: 50, chipCount: 80, cashPaid: 0 }),
    ];
    const result = calculateSettlements(players);

    // Alice: net = 0 - 50 + 50 = 0 (already paid cash, broke even on settlement)
    // Bob: net = 70 - 50 + 0 = +20 (creditor)
    // Charlie: net = 80 - 50 + 0 = +30 (creditor)
    // Bank: -50 (holds Alice's cash, must distribute)
    // Settlements: Bank pays Charlie 30, Bank pays Bob 20
    const bankTransactions = result.filter((t) => t.fromPlayer === "Bank");
    expect(bankTransactions.length).toBeGreaterThan(0);

    const totalBankPays = bankTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    expect(totalBankPays).toBe(50);
  });

  it("handles mixed cash and non-cash with correct balances", () => {
    // Andi buys in 20 (cash), Test buys in 10, Test2 buys in 20
    // Total pot: 50
    // Andi cashes out 0, Test cashes out 28, Test2 cashes out 22
    const players = [
      player("Andi", { totalBuyins: 20, chipCount: 0, cashPaid: 20 }),
      player("Test", { totalBuyins: 10, chipCount: 28, cashPaid: 0 }),
      player("Test2", { totalBuyins: 20, chipCount: 22, cashPaid: 0 }),
    ];
    const result = calculateSettlements(players);

    // Andi: 0 - 20 + 20 = 0 (neutral — already paid via cash)
    // Test: 28 - 10 + 0 = +18 (owed 18)
    // Test2: 22 - 20 + 0 = +2 (owed 2)
    // Bank: -20 (holds Andi's cash)
    // Bank pays Test 18, Bank pays Test2 2
    expect(result).toHaveLength(2);

    const bankPaysTest = result.find(
      (t) => t.fromPlayer === "Bank" && t.toPlayer === "Test"
    );
    expect(bankPaysTest).toBeDefined();
    expect(bankPaysTest!.amount).toBe(18);

    const bankPaysTest2 = result.find(
      (t) => t.fromPlayer === "Bank" && t.toPlayer === "Test2"
    );
    expect(bankPaysTest2).toBeDefined();
    expect(bankPaysTest2!.amount).toBe(2);
  });

  it("handles string values from Supabase DECIMAL columns", () => {
    // Simulate Supabase returning strings for numeric fields
    const players = [
      player("Alice", { totalBuyins: 100, chipCount: 150 }),
      player("Bob", { totalBuyins: 100, chipCount: 50 }),
    ];
    // Override with string values as Supabase would return
    (players[0] as unknown as Record<string, unknown>).totalBuyins =
      "100.00" as unknown as number;
    (players[0].cashout as unknown as Record<string, unknown>).chip_count =
      "150.00" as unknown as number;
    (players[1] as unknown as Record<string, unknown>).totalBuyins =
      "100.00" as unknown as number;
    (players[1].cashout as unknown as Record<string, unknown>).chip_count =
      "50.00" as unknown as number;

    const result = calculateSettlements(players);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      fromPlayer: "Bob",
      toPlayer: "Alice",
      amount: 50,
    });
  });

  it("handles floating point precision correctly", () => {
    const players = [
      player("Alice", { totalBuyins: 33.33, chipCount: 66.67 }),
      player("Bob", { totalBuyins: 33.33, chipCount: 16.66 }),
      player("Charlie", { totalBuyins: 33.34, chipCount: 16.67 }),
    ];
    const result = calculateSettlements(players);

    // All amounts should be rounded to 2 decimal places
    for (const t of result) {
      const decimals = t.amount.toString().split(".")[1]?.length ?? 0;
      expect(decimals).toBeLessThanOrEqual(2);
    }

    // Total paid should equal total received
    const totalPaid = result.reduce((sum, t) => sum + t.amount, 0);
    const aliceNet = 66.67 - 33.33; // +33.34
    expect(Math.abs(totalPaid - aliceNet)).toBeLessThan(0.02);
  });

  it("settlement amounts sum to zero across all players", () => {
    const players = [
      player("Alice", { totalBuyins: 100, chipCount: 200 }),
      player("Bob", { totalBuyins: 100, chipCount: 50 }),
      player("Charlie", { totalBuyins: 100, chipCount: 30 }),
      player("Dave", { totalBuyins: 100, chipCount: 120 }),
    ];
    const result = calculateSettlements(players);

    // For each player, compute net settlement flow
    const flows: Record<string, number> = {};
    for (const t of result) {
      flows[t.fromPlayer] = (flows[t.fromPlayer] ?? 0) - t.amount;
      flows[t.toPlayer] = (flows[t.toPlayer] ?? 0) + t.amount;
    }

    // Each player's settlement flow should match their net result
    expect(flows["Alice"]).toBe(100); // won 100
    expect(flows["Bob"]).toBe(-50); // lost 50
    expect(flows["Charlie"]).toBe(-70); // lost 70
    expect(flows["Dave"]).toBe(20); // won 20
  });
});
