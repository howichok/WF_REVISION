import type { EspScenario } from "./types";

/**
 * Pattern: Task 2 defect-fix + Task 4a car sales (sources/espsource/review codex draft).
 * Synthetic scenario — not a copy of live assessment materials.
 */
export const carSalesScenario: EspScenario = {
  id: "car-sales",
  title: "Dealership sales analysis",
  vocationalContext: "A vehicle dealership needs a Python tool to summarise CSV sales data for managers.",
  sourceNote: "Aligned with ESP Task 2 / 4a patterns (defect diagnosis, CSV grouping, menu evidence).",
  briefSegments: [
    {
      id: "b1",
      text: "Riverside Motors must report total sales value by vehicle model and compare new versus used revenue for quarterly reviews.",
      category: "aim",
    },
    {
      id: "b2",
      text: "All analysis must read from the provided Task4a_data.csv only — no external databases.",
      category: "constraint",
    },
    {
      id: "b3",
      text: "Deliverables: Project plan in Excel template, corrected Python from Task 2, design PDF, extended Python for Task 4a, reflective PDF.",
      category: "file",
    },
    {
      id: "b4",
      text: "Sales data includes personal staff performance; exports must stay on the office network drive.",
      category: "risk",
    },
    {
      id: "b5",
      text: "Sales managers are confident with spreadsheets but need clear console output labels.",
      category: "user",
    },
    {
      id: "b6",
      text: "The client expects regression testing after each code change and evidence in the test log.",
      category: "constraint",
    },
  ],
  roles: [
    { id: "pm", label: "Project manager", dayRateGbp: 420 },
    { id: "dev", label: "Developer", dayRateGbp: 380 },
    { id: "test", label: "Tester", dayRateGbp: 320 },
    { id: "ux", label: "UX specialist", dayRateGbp: 350 },
    { id: "dba", label: "Database engineer", dayRateGbp: 400 },
  ],
  planWeeks: 8,
  suggestedStages: [
    "Requirements & data audit",
    "UI / report design",
    "Import & validation code",
    "Core analysis features",
    "Integration test & fixes",
    "Deployment prep & handover",
  ],
  task2: {
    defectsHintCount: 4,
    buggyCode: `import csv
from io import StringIO

# Non-working sales helper — find syntax, name, and logic defects
RAW = """date,model,value,condition,salesperson
2024-01-05,Astra,12000,used,Sam
2024-01-06,Corsa,8500,new,Alex
2024-01-07,Astra,15000,new,Jules"""

def load_sales():
    buffer = StringIO(RAW)
    reader = csv.DictReader(buffer)
    rows = []
    for row in reader:
        rows.append(row)
    return rows

def total_for_model(sales, model):
    total = 0
    for row in sales:
        if row["model"] = model:
            total += float(row["value"])
    return totle

def write_summary(path, text):
    f = open(path, "w", encoding="utf-8")
    f.write(text)
    # missing close in some runs — keep file handle pattern for learners to spot

if __name__ == "__main__":
    data = load_sales()
    print(total_for_model(data, "Astra"))
`,
    testCases: [
      {
        id: "t1",
        purpose: "Normal: total for model Astra",
        testData: 'models loaded from RAW; call total_for_model(data, "Astra")',
        expected: "27000.0 (12000 + 15000)",
      },
      {
        id: "t2",
        purpose: "Boundary: model with no rows",
        testData: 'total_for_model(data, "NoneSuch")',
        expected: "0",
      },
      {
        id: "t3",
        purpose: "Erroneous: wrong type for model parameter",
        testData: "total_for_model(data, None)",
        expected: "Handled or TypeError clearly",
      },
    ],
    fixPatterns: ["==", "total", "f.close()", "write_summary"],
  },
  task3: {
    designPrompt:
      "Design import → validate columns → filter by model → aggregate value → output console summary. Include validation for missing value field.",
    csvHeaders: ["date", "model", "value", "condition", "salesperson"],
    csvSampleRows: [
      ["2024-01-05", "Astra", "12000", "used", "Sam"],
      ["2024-01-06", "Corsa", "8500", "new", "Alex"],
    ],
  },
  task4a: {
    csvFilename: "Task4a_data.csv",
    csvContent: `date,model,value,condition,salesperson
2024-01-05,Astra,12000,used,Sam
2024-01-06,Corsa,8500,new,Alex
2024-01-07,Astra,15000,new,Jules
2024-01-08,Corsa,9200,used,Sam`,
    featureHint: "Add a menu option that compares total sales value for new cars versus used cars.",
    starterCode: `import csv
from pathlib import Path

DATA_FILE = "Task4a_data.csv"

def load_sales():
    path = Path(DATA_FILE)
    if not path.exists():
        print("Missing CSV — add Task4a_data.csv next to this script.")
        return []
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def total_by_model(sales):
    totals = {}
    for row in sales:
        m = row["model"]
        totals[m] = totals.get(m, 0) + float(row["value"])
    return totals

def menu():
    sales = load_sales()
    while True:
        print("\\n1) Total by model  2) Quit")
        choice = input("Choice: ").strip()
        if choice == "1":
            for model, val in total_by_model(sales).items():
                print(f"{model}: £{val:,.2f}")
        elif choice == "2":
            break
        else:
            print("Invalid choice.")

if __name__ == "__main__":
    menu()
`,
  },
  task4b: {
    systemRequirements: [
      "Import sales rows from the provided CSV with header validation.",
      "Calculate aggregates without crashing on empty files.",
      "Support user menu choices with validation.",
    ],
    userRequirements: [
      "Outputs use £ labels and two decimal places.",
      "Error messages state what went wrong in plain language.",
      "Managers can compare new vs used sales in one run.",
    ],
  },
};
