import type { EspScenario } from "./types";

/** Social media / charity analysis pattern (Task 4a chart feature style). */
export const animalRescueScenario: EspScenario = {
  id: "animal-rescue",
  title: "Animal rescue campaign analytics",
  vocationalContext: "A charity analyses social post CSV data to plan campaigns.",
  sourceNote: "Pattern from reviewed draft: Task 4a chart / grouping features.",
  briefSegments: [
    { id: "a1", text: "Paws Trust needs average interactions per post type to plan next quarter content.", category: "aim" },
    { id: "a2", text: "Data must not leave the charity laptop — process CSV files locally only.", category: "constraint" },
    { id: "a3", text: "Evidence pack includes posts.csv and starter Python.", category: "file" },
    { id: "a4", text: "Donor emails in the sheet are sensitive — mask in any screenshots.", category: "risk" },
    { id: "a5", text: "Fundraising staff want simple labelled tables, not raw arrays.", category: "user" },
    { id: "a6", text: "Testing must cover normal, boundary, and invalid post types.", category: "constraint" },
  ],
  roles: [
    { id: "pm", label: "Project manager", dayRateGbp: 400 },
    { id: "dev", label: "Developer", dayRateGbp: 360 },
    { id: "test", label: "Tester", dayRateGbp: 300 },
  ],
  planWeeks: 6,
  suggestedStages: ["Brief analysis", "Data cleaning design", "Analytics build", "Chart output", "UAT", "Handover"],
  task2: {
    defectsHintCount: 3,
    buggyCode: `from io import StringIO
import csv

RAW = """post_type,likes,shares,comments
video,120,40,12
image,80,10,5"""

def avg_for_type(lines, ptype):
    acc = 0
    n = 0
    reader = csv.DictReader(StringIO(lines))
    for row in reader:
        if row["post_type"] = ptype:
            acc += int(row["likes"])
            n += 1
    return acc / n if n else 0

print(avg_for_type(RAW, "video"))
`,
    testCases: [
      { id: "t1", purpose: "Average likes across all", testData: "averages(RAW)", expected: "Positive float" },
      { id: "t2", purpose: "Video type only", testData: 'avg_for_type(RAW, "video")', expected: "120" },
    ],
    fixPatterns: ["==", "post_type", "avg_for_type"],
  },
  task3: {
    designPrompt: "Design grouping by post_type with validation for missing numeric fields.",
    csvHeaders: ["post_type", "likes", "shares", "comments"],
    csvSampleRows: [
      ["video", "120", "40", "12"],
      ["image", "80", "10", "5"],
    ],
  },
  task4a: {
    csvFilename: "posts.csv",
    csvContent: `post_type,likes,shares,comments
video,120,40,12
image,80,10,5
video,90,22,8`,
    featureHint: "Print a table of average likes by post_type.",
    starterCode: `import csv
from pathlib import Path
from collections import defaultdict

def load(path="posts.csv"):
    if not Path(path).exists():
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def sum_by_type(rows):
    sums = defaultdict(int)
    counts = defaultdict(int)
    for r in rows:
        t = r["post_type"]
        sums[t] += int(r["likes"])
        counts[t] += 1
    return sums, counts

rows = load()
if rows:
    s, c = sum_by_type(rows)
    for t in s:
        print(t, s[t] / c[t])
`,
  },
  task4b: {
    systemRequirements: ["Read CSV with correct types", "Group metrics safely", "Handle empty files"],
    userRequirements: ["Readable averages", "Clear errors", "Repeatable test evidence"],
  },
};
