import test from "node:test";
import assert from "node:assert/strict";
import { getTopicPracticeBundle } from "./practice";
import { evaluatePracticeShortAnswer } from "./practice-evaluator";

function getHealthcareQuestion() {
  const bundle = getTopicPracticeBundle("security");
  const question = bundle.quizQuestions.find(
    (entry) => entry.id === "quiz-exam-paper2-2023-q2b-cia-patient-records"
  );

  assert.ok(question, "Expected healthcare records question to exist in practice bundle.");
  return question;
}

function getDigitalServiceQuestion() {
  const bundle = getTopicPracticeBundle("business");
  const question = bundle.quizQuestions.find(
    (entry) => entry.id === "quiz-exam-paper2-2023-q3-quality-service"
  );

  assert.ok(question, "Expected digital service quality question to exist in practice bundle.");
  return question;
}

test("accepts direct rubric wording for the healthcare records question", () => {
  const question = getHealthcareQuestion();
  const evaluation = evaluatePracticeShortAnswer(
    "Confidentiality means patient records should only be seen by authorised staff, and integrity means the records stay accurate and are not changed improperly. Role-based access, encryption, validation, and audit trails help protect the system.",
    question
  );

  assert.equal(evaluation.isCorrect, true);
  assert.ok(evaluation.score >= 7);
  assert.equal(evaluation.verdict, "strong");
  assert.ok(
    evaluation.matchedSlots.includes(
      "Confidentiality protects sensitive patient information"
    )
  );
  assert.ok(
    evaluation.matchedSlots.includes(
      "Integrity keeps records accurate and prevents improper change"
    )
  );
});

test("accepts paraphrased healthcare answer with domain-specific examples", () => {
  const question = getHealthcareQuestion();
  const evaluation = evaluatePracticeShortAnswer(
    [
      "A healthcare records system should be designed so that confidentiality protects patient data from unauthorised access, and integrity ensures the data stays accurate and unchanged unless edited by authorised staff.",
      "For confidentiality, the system should use things like user accounts, strong passwords, role-based access and encryption. This means only the right people, such as doctors, nurses or administrators, can see the parts of a record they need.",
      "For integrity, the system should include access controls, validation checks, audit trails and backups. If a dosage, allergy or diagnosis is changed incorrectly, it could lead to unsafe treatment. Audit logs let the hospital see who changed what and when.",
    ].join(" "),
    question
  );

  assert.equal(evaluation.isCorrect, true);
  assert.ok(evaluation.score >= 8);
  assert.equal(evaluation.verdict, "strong");
  assert.ok(
    evaluation.matchedSlots.includes(
      "Authorised access is controlled through design measures"
    )
  );
  assert.ok(
    evaluation.matchedSlots.includes(
      "Healthcare consequences are explained"
    )
  );
});

test("marks a partially correct healthcare answer as incomplete rather than wrong", () => {
  const question = getHealthcareQuestion();
  const evaluation = evaluatePracticeShortAnswer(
    "Confidentiality means patient records should stay private and only staff should access them.",
    question
  );

  assert.equal(evaluation.isCorrect, false);
  assert.equal(evaluation.verdict, "partial");
  assert.ok(
    evaluation.feedback.includes("integrity") ||
      evaluation.feedback.includes("correct")
  );
  assert.ok(
    evaluation.missingSlots.includes(
      "Integrity keeps records accurate and prevents improper change"
    )
  );
});

test("rewards a strong healthcare answer with explicit measures and consequences", () => {
  const question = getHealthcareQuestion();
  const evaluation = evaluatePracticeShortAnswer(
    "Confidentiality means protecting medical records from unauthorised viewing, so access should be limited by permissions, user accounts, two-factor authentication and encryption. Integrity means the information stays correct, complete and not tampered with, so the system should validate edits, keep audit logs, and restore from backups if needed. In healthcare this matters because a wrong allergy or dosage entry could harm a patient and the logs provide accountability.",
    question
  );

  assert.equal(evaluation.isCorrect, true);
  assert.equal(evaluation.verdict, "strong");
  assert.ok(evaluation.confidence >= 0.7);
  assert.equal(evaluation.missingSlots.length, 0);
});

test("rejects a clearly wrong answer to the healthcare records question", () => {
  const question = getHealthcareQuestion();
  const evaluation = evaluatePracticeShortAnswer(
    "The system should use larger text, brighter colours, and animations so it looks modern.",
    question
  );

  assert.equal(evaluation.isCorrect, false);
  assert.equal(evaluation.verdict, "not-quite");
  assert.ok(evaluation.score <= 1);
  assert.ok(evaluation.missingSlots.length >= 3);
});

test("accepts direct rubric wording for the digital service quality question", () => {
  const question = getDigitalServiceQuestion();
  const evaluation = evaluatePracticeShortAnswer(
    "A team can collect user feedback, use it to identify changing user needs, and prioritise updates so the digital service stays useful.",
    question
  );

  assert.equal(evaluation.isCorrect, true);
  assert.equal(evaluation.verdict, "strong");
  assert.ok(
    evaluation.matchedSlots.includes(
      "A practical method for gathering user evidence is identified"
    )
  );
  assert.ok(
    evaluation.matchedSlots.includes(
      "Findings are turned into updates or improvements"
    )
  );
});

test("accepts paraphrased digital service answer about feedback loops and updates", () => {
  const question = getDigitalServiceQuestion();
  const evaluation = evaluatePracticeShortAnswer(
    "The team should keep a continuous feedback loop by reviewing what users report and how they behave in the service, then use that evidence to prioritise valuable changes as user needs change.",
    question
  );

  assert.equal(evaluation.isCorrect, true);
  assert.ok(evaluation.score >= 3.5);
  assert.ok(evaluation.confidence >= 0.7);
  assert.ok(
    evaluation.matchedSlots.includes(
      "The evidence is used to understand user needs or pain points"
    )
  );
});

test("accepts a short but correct practical service-quality answer as mostly correct", () => {
  const question = getDigitalServiceQuestion();
  const evaluation = evaluatePracticeShortAnswer(
    "Use regular user feedback to prioritise helpful updates.",
    question
  );

  assert.equal(evaluation.isCorrect, true);
  assert.equal(evaluation.verdict, "mostly-correct");
  assert.ok(
    evaluation.feedback.includes("useful") ||
      evaluation.feedback.includes("user needs")
  );
});

test("rewards a developed digital service answer with consequences and value", () => {
  const question = getDigitalServiceQuestion();
  const evaluation = evaluatePracticeShortAnswer(
    "A team can run regular usability testing and collect feedback after releases, then analyse that evidence to find pain points and changing user needs. They can prioritise the updates that remove friction and deliver the most value, so the service stays useful instead of gradually becoming less relevant.",
    question
  );

  assert.equal(evaluation.isCorrect, true);
  assert.equal(evaluation.verdict, "strong");
  assert.equal(evaluation.missingSlots.length, 0);
});

test("marks an incomplete digital service answer as partial instead of fully wrong", () => {
  const question = getDigitalServiceQuestion();
  const evaluation = evaluatePracticeShortAnswer(
    "Ask users what they think about the service.",
    question
  );

  assert.equal(evaluation.isCorrect, false);
  assert.equal(evaluation.verdict, "partial");
  assert.ok(
    evaluation.missingSlots.includes(
      "Findings are turned into updates or improvements"
    )
  );
});

test("rejects a wrong answer to the digital service quality question", () => {
  const question = getDigitalServiceQuestion();
  const evaluation = evaluatePracticeShortAnswer(
    "Make the logo brighter and add more animations so the service looks modern.",
    question
  );

  assert.equal(evaluation.isCorrect, false);
  assert.equal(evaluation.verdict, "not-quite");
  assert.ok(evaluation.score <= 1);
});
