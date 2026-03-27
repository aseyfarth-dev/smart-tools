import type {
  PlayerWithDetails,
  SettlementTransaction,
} from "@/types/poker-session";

/**
 * Calculate minimum settlement transactions using a greedy algorithm.
 *
 * For each player, we compute their net balance:
 *   net = chipCount - totalBuyins
 *
 * We also factor in cash already paid: if a player paid cash for their buy-ins,
 * that cash went to the "bank" (host). The bank effectively collected that cash
 * and needs to redistribute it. Players who paid cash have already covered part
 * of their debt, so their net balance is adjusted:
 *   adjustedNet = net + cashPaid
 *
 * Positive balance = creditor (others owe them)
 * Negative balance = debtor (they owe others)
 *
 * The greedy algorithm then pairs the largest creditor with the largest debtor
 * to minimize the total number of transactions.
 */
export function calculateSettlements(
  players: PlayerWithDetails[]
): SettlementTransaction[] {
  // Only include players who have cashed out
  const cashedOutPlayers = players.filter((p) => p.cashout !== null);

  if (cashedOutPlayers.length === 0) return [];

  // Calculate net balances
  // net = (chipCount - totalBuyins) + cashPaid
  // cashPaid increases their balance because they already paid that amount in cash
  const balances: { name: string; balance: number }[] = cashedOutPlayers.map(
    (p) => ({
      name: p.name,
      balance: roundCents(
        Number(p.cashout?.chip_count ?? 0) -
          Number(p.totalBuyins) +
          Number(p.cashPaid)
      ),
    })
  );

  // Separate into creditors and debtors
  const creditors = balances
    .filter((b) => b.balance > 0.005) // use small epsilon for float comparison
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance); // descending

  const debtors = balances
    .filter((b) => b.balance < -0.005)
    .map((b) => ({ name: b.name, balance: Math.abs(b.balance) }))
    .sort((a, b) => b.balance - a.balance); // descending by absolute value

  const transactions: SettlementTransaction[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    const settleAmount = roundCents(
      Math.min(creditor.balance, debtor.balance)
    );

    if (settleAmount > 0.005) {
      transactions.push({
        fromPlayer: debtor.name,
        toPlayer: creditor.name,
        amount: settleAmount,
      });
    }

    creditor.balance = roundCents(creditor.balance - settleAmount);
    debtor.balance = roundCents(debtor.balance - settleAmount);

    if (creditor.balance < 0.005) ci++;
    if (debtor.balance < 0.005) di++;
  }

  return transactions;
}

/** Round to 2 decimal places to avoid floating point issues */
function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}
