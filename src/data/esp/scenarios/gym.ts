import type { EspScenario } from "./types";

export const gymScenario: EspScenario = {
  id: "gym",
  title: "Gym member workout summary",
  vocationalContext: "A gym tracks member workouts in CSV for trainer review.",
  sourceNote: "Pattern: member filter, aggregates, date range (gym-data style).",
  briefSegments: [
    { id: "g1", text: "FitHall wants per-member summaries of duration and calories over a selected period.", category: "aim" },
    { id: "g2", text: "Member IDs are pseudonymised in the trial dataset.", category: "constraint" },
    { id: "g3", text: "Files: gym-data.csv, Python starter.", category: "file" },
    { id: "g4", text: "Health data misuse could breach expectations — minimise exports.", category: "risk" },
    { id: "g5", text: "Trainers need large readable totals, not debug prints.", category: "user" },
    { id: "g6", text: "Invalid member IDs must be rejected politely.", category: "constraint" },
  ],
  roles: [
    { id: "pm", label: "Project manager", dayRateGbp: 380 },
    { id: "dev", label: "Developer", dayRateGbp: 340 },
    { id: "test", label: "Tester", dayRateGbp: 290 },
  ],
  planWeeks: 7,
  suggestedStages: ["Requirements", "Data model", "Reporting UI", "Validation", "Test & fix", "Training"],
  task2: {
    defectsHintCount: 3,
    buggyCode: `from io import StringIO
import csv

RAW = """member_id,date,duration_mins,calories
M001,2024-03-01,45,320
M001,2024-03-02,30,210"""

def totals_for_member(lines, mid):
    total_dur = 0
    reader = csv.DictReader(StringIO(lines))
    for row in reader:
        if row["member_id"] = mid:
            total_dur += int(row["duration_mins"])
    return total_dur

print(totals_for_member(RAW, "M001"))
`,
    testCases: [
      { id: "t1", purpose: "Member M001 total duration", testData: 'totals_for_member(RAW, "M001")', expected: "75" },
      { id: "t2", purpose: "Unknown member", testData: 'totals_for_member(RAW, "ZZ")', expected: "0" },
    ],
    fixPatterns: ["==", "total_dur", "reader"],
  },
  task3: {
    designPrompt: "Filter rows by member_id and date range; sum duration and calories; handle bad dates.",
    csvHeaders: ["member_id", "date", "duration_mins", "calories"],
    csvSampleRows: [
      ["M001", "2024-03-01", "45", "320"],
      ["M001", "2024-03-02", "30", "210"],
    ],
  },
  task4a: {
    csvFilename: "gym-data.csv",
    csvContent: `member_id,date,duration_mins,calories
M001,2024-03-01,45,320
M001,2024-03-02,30,210
M002,2024-03-01,60,400`,
    featureHint: "Add menu: pick member ID → print total duration and calories.",
    starterCode: `import csv
from pathlib import Path

def load():
    p = Path("gym-data.csv")
    if not p.exists():
        return []
    with p.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def main():
    rows = load()
    for r in rows:
        print(r["member_id"], r["duration_mins"])

if __name__ == "__main__":
    main()
`,
  },
  task4b: {
    systemRequirements: ["CSV import", "Member filter", "Numeric aggregation"],
    userRequirements: ["Clear labels", "Validation messages", "Evidence of two test members"],
  },
};
