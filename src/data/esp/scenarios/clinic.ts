import type { EspScenario } from "./types";

export const clinicScenario: EspScenario = {
  id: "clinic",
  title: "Community clinic appointment reporting",
  vocationalContext: "A clinic needs appointment reporting for reception and managers.",
  sourceNote: "Pattern: phased delivery, testing before handover (clinic planning prompt).",
  briefSegments: [
    { id: "cl1", text: "Westbridge Clinic wants a first version in six weeks: staff UI, appointment import, management summary.", category: "aim" },
    { id: "cl2", text: "NHS-style data handling — minimise printed patient detail.", category: "constraint" },
    { id: "cl3", text: "Pack lists roles: PM, junior dev, DBA, tester, UX.", category: "file" },
    { id: "cl4", text: "Tester capacity is shared — regression windows may slip.", category: "risk" },
    { id: "cl5", text: "Reception staff need large buttons and obvious error text.", category: "user" },
    { id: "cl6", text: "Acceptance testing must complete before go-live.", category: "constraint" },
  ],
  roles: [
    { id: "pm", label: "Project manager", dayRateGbp: 450 },
    { id: "dev", label: "Junior developer", dayRateGbp: 320 },
    { id: "dba", label: "Database engineer", dayRateGbp: 410 },
    { id: "test", label: "Tester", dayRateGbp: 330 },
    { id: "ux", label: "UX specialist", dayRateGbp: 360 },
  ],
  planWeeks: 6,
  suggestedStages: ["Analysis", "Data design", "UI design", "Development", "Testing & fixes", "Deployment prep", "Handover"],
  task2: {
    defectsHintCount: 3,
    buggyCode: `from io import StringIO
import csv

RAW = """appt_id,date,status
1,2024-04-01,booked
2,2024-04-02,cancelled"""

def count_status(lines, wanted):
    n = 0
    reader = csv.DictReader(StringIO(lines))
    for row in reader:
        if row["status"] = wanted:
            n += 1
    return n

def broken_count(lines):
    n = 0
    reader = csv.DictReader(StringIO(lines))
    for row in reader:
        n = n + 1
    return n

print(count_status(RAW, "booked"))
`,
    testCases: [
      { id: "t1", purpose: "Count booked", testData: 'count_status(RAW, "booked")', expected: "1" },
      { id: "t2", purpose: "All rows", testData: "broken_count(RAW)", expected: "2" },
    ],
    fixPatterns: ["==", "count_status", "wanted"],
  },
  task3: {
    designPrompt: "Import appointments → validate dates → count by status → summary report.",
    csvHeaders: ["appt_id", "date", "status"],
    csvSampleRows: [
      ["1", "2024-04-01", "booked"],
      ["2", "2024-04-02", "cancelled"],
    ],
  },
  task4a: {
    csvFilename: "appointments.csv",
    csvContent: `appt_id,date,status
1,2024-04-01,booked
2,2024-04-02,cancelled
3,2024-04-03,booked`,
    featureHint: "Menu: show counts for booked vs cancelled.",
    starterCode: `import csv
from pathlib import Path
from collections import Counter

def load():
    p = Path("appointments.csv")
    if not p.exists():
        return []
    with p.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

rows = load()
c = Counter(r["status"] for r in rows)
print(dict(c))
`,
  },
  task4b: {
    systemRequirements: ["Accurate counts", "Safe CSV handling", "Menu-driven flow"],
    userRequirements: ["Readable summary", "Handles empty file", "Test evidence cited"],
  },
};
