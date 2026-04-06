"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { appendRefuelRow, type AppendRefuelInput } from "./lib/sheet";

export type AddRefuelResult = {
  success: boolean;
  error?: string;
};

export async function addRefuel(
  input: AppendRefuelInput
): Promise<AddRefuelResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate required fields
  if (!input.datum || !input.ort) {
    return { success: false, error: "Datum and Ort are required" };
  }
  if (input.liter <= 0) {
    return { success: false, error: "Liter must be greater than 0" };
  }
  if (input.eurPerLiter <= 0) {
    return { success: false, error: "EUR/Liter must be greater than 0" };
  }
  if (input.km <= 0) {
    return { success: false, error: "KM must be greater than 0" };
  }
  if (input.preis <= 0) {
    return { success: false, error: "Preis must be greater than 0" };
  }

  try {
    await appendRefuelRow(input);
    revalidatePath("/apps/tanken");
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to add refuel entry";
    return { success: false, error: message };
  }
}
