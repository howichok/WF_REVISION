import type { EspScenario } from "./types";

export const canteenScenario: EspScenario = {
  id: "canteen",
  title: "Canteen drinks demand report",
  vocationalContext: "A college canteen analyses drink sales CSV for restocking.",
  sourceNote: "Pattern: revenue by product, sugar category grouping (drinks_data style).",
  briefSegments: [
    { id: "c1", text: "Catering needs weekly revenue by drink and sugar category to reduce waste.", category: "aim" },
    { id: "c2", text: "Pricing data is commercially sensitive — store files on staff share only.", category: "constraint" },
    { id: "c3", text: "drinks_data.csv plus Python starter are in the pack.", category: "file" },
    { id: "c4", text: "Incorrect stock orders affect allergen rotation — flag data gaps.", category: "risk" },
    { id: "c5", text: "Managers want £ totals aligned to the price column, not mental maths.", category: "user" },
    { id: "c6", text: "Invalid quantity cells must not crash the importer.", category: "constraint" },
  ],
  roles: [
    { id: "pm", label: "Project manager", dayRateGbp: 360 },
    { id: "dev", label: "Developer", dayRateGbp: 320 },
    { id: "test", label: "Tester", dayRateGbp: 280 },
  ],
  planWeeks: 5,
  suggestedStages: ["Stakeholder workshop", "Data schema", "Build reports", "Pilot week", "Sign-off"],
  task2: {
    defectsHintCount: 3,
    buggyCode: `from io import StringIO
import csv

RAW = """drink,price,sugar,qty
Cola,1.2,high,40
Water,0.9,low,120"""

def revenue(lines):
    total = 0
    reader = csv.DictReader(StringIO(lines))
    for row in reader:
        total += float(row["price"]) * int(row["qtyy"])
    return total

print(revenue(RAW))
`,
    testCases: [
      { id: "t1", purpose: "Total revenue", testData: "revenue(RAW)", expected: "156.0" },
      { id: "t2", purpose: "Column name", testData: "inspect row keys", expected: "qty not qtyy" },
    ],
    fixPatterns: ["qty", "float", "row["],
  },
  task3: {
    designPrompt: "Map fields → validate price/qty → compute line revenue → aggregate by sugar band.",
    csvHeaders: ["drink", "price", "sugar", "qty"],
    csvSampleRows: [
      ["Cola", "1.2", "high", "40"],
      ["Water", "0.9", "low", "120"],
    ],
  },
  task4a: {
    csvFilename: "drinks_data.csv",
    csvContent: `drink,price,sugar,qty
Cola,1.2,high,40
Water,0.9,low,120
Juice,1.5,high,30`,
    featureHint: "Report total revenue and compare high- vs low-sugar volume.",
    starterCode: `import csv
from pathlib import Path

def load():
    p = Path("drinks_data.csv")
    if not p.exists():
        return []
    with p.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def line_revenue(row):
    return float(row["price"]) * int(row["qty"])

rows = load()
print(sum(line_revenue(r) for r in rows))
`,
  },
  task4b: {
    systemRequirements: ["Parse CSV", "Compute revenue", "Group by category"],
    userRequirements: ["Totals match manual check", "Explain limitations", "Suggest improvements"],
  },
};
