"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addRefuel, type AddRefuelResult } from "./actions";

function todayString(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`; // HTML date input format
}

function toSheetDate(htmlDate: string): string {
  // Convert YYYY-MM-DD → DD.MM.YYYY
  const [y, m, d] = htmlDate.split("-");
  return `${d}.${m}.${y}`;
}

interface RefuelFormProps {
  defaultOrt: string | null;
}

export function RefuelForm({ defaultOrt }: RefuelFormProps) {
  const [datum, setDatum] = useState(todayString());
  const [ort, setOrt] = useState(defaultOrt ?? "");
  const [km, setKm] = useState("");
  const [liter, setLiter] = useState("");
  const [eurPerLiter, setEurPerLiter] = useState("");
  const [preis, setPreis] = useState("");
  const [preisManual, setPreisManual] = useState(false);
  const [globusRabatt, setGlobusRabatt] = useState("");
  const [result, setResult] = useState<AddRefuelResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // Auto-compute Preis from Liter × EUR/Liter (unless manually overridden)
  useEffect(() => {
    if (preisManual) return;
    const l = parseFloat(liter);
    const e = parseFloat(eurPerLiter);
    if (!isNaN(l) && !isNaN(e) && l > 0 && e > 0) {
      setPreis((l * e).toFixed(2));
    } else {
      setPreis("");
    }
  }, [liter, eurPerLiter, preisManual]);

  function resetForm() {
    setDatum(todayString());
    setOrt(defaultOrt ?? "");
    setKm("");
    setLiter("");
    setEurPerLiter("");
    setPreis("");
    setPreisManual(false);
    setGlobusRabatt("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    startTransition(async () => {
      const res = await addRefuel({
        datum: toSheetDate(datum),
        ort: ort.trim(),
        eurPerLiter: parseFloat(eurPerLiter),
        liter: parseFloat(liter),
        preis: parseFloat(preis),
        km: parseFloat(km),
        globusRabatt: globusRabatt ? parseFloat(globusRabatt) : null,
      });
      setResult(res);
      if (res.success) {
        resetForm();
        setTimeout(() => setResult(null), 3000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="datum">Datum</Label>
          <Input
            id="datum"
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ort">Ort</Label>
          <Input
            id="ort"
            type="text"
            value={ort}
            onChange={(e) => setOrt(e.target.value)}
            placeholder="Tankstelle"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="km">KM (Tachostand)</Label>
        <Input
          id="km"
          type="number"
          value={km}
          onChange={(e) => setKm(e.target.value)}
          placeholder="z.B. 45230"
          required
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="liter">Liter</Label>
          <Input
            id="liter"
            type="number"
            step="0.01"
            value={liter}
            onChange={(e) => setLiter(e.target.value)}
            placeholder="z.B. 42.5"
            required
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eurPerLiter">EUR/Liter</Label>
          <Input
            id="eurPerLiter"
            type="number"
            step="0.001"
            value={eurPerLiter}
            onChange={(e) => setEurPerLiter(e.target.value)}
            placeholder="z.B. 1.659"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="preis">
            Preis (EUR){" "}
            <span className="text-xs text-muted-foreground">
              {preisManual ? "manuell" : "auto"}
            </span>
          </Label>
          <Input
            id="preis"
            type="number"
            step="0.01"
            value={preis}
            onChange={(e) => {
              setPreis(e.target.value);
              setPreisManual(true);
            }}
            placeholder="z.B. 70.51"
            required
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="globusRabatt">Globus Rabatt</Label>
          <Input
            id="globusRabatt"
            type="number"
            step="0.01"
            value={globusRabatt}
            onChange={(e) => setGlobusRabatt(e.target.value)}
            placeholder="optional"
            disabled={isPending}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Wird gespeichert..." : "Tankvorgang speichern"}
      </Button>

      {result?.success && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Tankvorgang gespeichert!
        </p>
      )}
      {result?.error && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
    </form>
  );
}
