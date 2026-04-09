import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyTopicIntelligenceConfidence,
  detectTopicIntelligenceIntent,
  generateTopicIntelligenceResponse,
  isOfficialGroundedHost,
} from "./topic-assistant";

test("detects hint intent from Russian wording", () => {
  const intent = detectTopicIntelligenceIntent({
    query: "\u0434\u0430\u0439 \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0443 \u043f\u043e confidentiality",
  });

  assert.equal(intent, "hint");
});

test("detects practice intent from English wording", () => {
  const intent = detectTopicIntelligenceIntent({
    query: "give me a practice question about security",
  });

  assert.equal(intent, "practice-question");
});

test("classifies confidence bands correctly", () => {
  assert.equal(classifyTopicIntelligenceConfidence(28, false), "high");
  assert.equal(classifyTopicIntelligenceConfidence(20, false), "medium");
  assert.equal(classifyTopicIntelligenceConfidence(8, false), "low");
  assert.equal(classifyTopicIntelligenceConfidence(12, true), "high");
});

test("recognises allowlisted official hosts", () => {
  assert.equal(isOfficialGroundedHost("qualifications.pearson.com"), true);
  assert.equal(isOfficialGroundedHost("www.tlevels.gov.uk"), true);
  assert.equal(isOfficialGroundedHost("example.com"), false);
});

test("returns a local answer for a term definition without grounded web", async () => {
  const response = await generateTopicIntelligenceResponse({
    topicId: "security",
    query: "What is confidentiality?",
  });

  assert.equal(response.intent, "local-answer");
  assert.equal(response.localOnly, true);
  assert.equal(response.examSafeFocus.length, 3);
  assert.match(response.answer.toLowerCase(), /confidentiality/);
});

test("returns a scaffold-only hint ladder", async () => {
  const response = await generateTopicIntelligenceResponse({
    topicId: "security",
    query: "\u0434\u0430\u0439 \u043f\u043e\u0434\u0441\u043a\u0430\u0437\u043a\u0443 \u043f\u043e confidentiality",
  });

  assert.equal(response.intent, "hint");
  assert.equal(response.localOnly, true);
  assert.match(response.answer, /Level 1:/);
  assert.doesNotMatch(response.answer, /Direct answer:/);
});

test("routes draft answers into answer-check guidance", async () => {
  const response = await generateTopicIntelligenceResponse({
    topicId: "security",
    query: "check my answer about confidentiality and integrity",
    draftAnswer:
      "Confidentiality keeps data private and integrity means the data stays accurate and is not changed incorrectly.",
  });

  assert.match(response.intent, /answer-check|misconception-fix/);
  assert.equal(response.localOnly, true);
  assert.ok(response.suggestedNextAction?.href.includes("/exam-questions"));
});

test("returns a targeted practice question for security", async () => {
  const response = await generateTopicIntelligenceResponse({
    topicId: "security",
    query: "give me a practice question about security",
  });

  assert.equal(response.intent, "practice-question");
  assert.equal(response.localOnly, true);
  assert.ok(response.relatedQuestions.length > 0);
});

test("returns misconception guidance with local coverage signals", async () => {
  const response = await generateTopicIntelligenceResponse({
    topicId: "digital-environments",
    query: "difference between cloud and virtual environments",
  });

  assert.equal(response.intent, "misconception-fix");
  assert.equal(response.localOnly, true);
  assert.ok(response.misconceptions.length > 0);
  assert.match(response.answer.toLowerCase(), /not|confusion|different|instead/);
});

test("returns legislation-specific confusion guidance from local coverage signals", async () => {
  const response = await generateTopicIntelligenceResponse({
    topicId: "legislation",
    query: "difference between legal and ethical issue in software",
  });

  assert.match(response.intent, /misconception-fix|local-answer/);
  assert.equal(response.localOnly, true);
  assert.ok(response.misconceptions.length > 0);
  assert.match(response.answer.toLowerCase(), /legal|ethical|different|confusion|not/);
});

test("returns an official mapped source when requested locally", async () => {
  const response = await generateTopicIntelligenceResponse({
    topicId: "security",
    query: "official source for confidentiality",
    overrideIntent: "resource-pick",
  });

  assert.equal(response.intent, "resource-pick");
  assert.equal(response.examSafeFocus.length, 3);
  assert.ok(response.sources.some((source) => source.host && isOfficialGroundedHost(source.host)));
});

test("accepts grounded answers only when allowlisted hosts are present", async () => {
  const response = await generateTopicIntelligenceResponse(
    {
      topicId: "security",
      query: "official explanation for confidentiality",
      overrideIntent: "grounded-answer",
    },
    {
      groundedResolver: async () => ({
        topicId: "security",
        topicLabel: "Security",
        model: "stub",
        answer: [
          "Direct answer: Confidentiality means only authorised users can access sensitive data.",
          "Exam-safe focus:",
          "- define confidentiality accurately",
          "- mention authorised access controls",
          "- link it to the system context",
        ].join("\n"),
        searchQueries: ["stub query"],
        evidenceTrail: [],
        sourceStrategy: "stub",
        sources: [
          {
            index: 1,
            title: "Pearson DSD guidance",
            uri: "https://qualifications.pearson.com/en/qualifications/t-levels/digital-production-design-development.html",
            host: "qualifications.pearson.com",
          },
        ],
      }),
    }
  );

  assert.equal(response.intent, "grounded-answer");
  assert.equal(response.localOnly, false);
  assert.equal(response.officialConfirmationStatus, "confirmed");
  assert.equal(response.examSafeFocus.length, 3);
});

test("falls back to local answer when grounded sources are not allowlisted", async () => {
  const response = await generateTopicIntelligenceResponse(
    {
      topicId: "security",
      query: "official explanation for confidentiality",
      overrideIntent: "grounded-answer",
    },
    {
      groundedResolver: async () => ({
        topicId: "security",
        topicLabel: "Security",
        model: "stub",
        answer: "Direct answer: Example only.",
        searchQueries: [],
        evidenceTrail: [],
        sourceStrategy: "stub",
        sources: [
          {
            index: 1,
            title: "Example",
            uri: "https://example.com/security",
            host: "example.com",
          },
        ],
      }),
    }
  );

  assert.equal(response.localOnly, true);
  assert.equal(response.officialConfirmationStatus, "not-found");
});

test("falls back to local-only mode when GEMINI is unavailable", async () => {
  const response = await generateTopicIntelligenceResponse(
    {
      topicId: "security",
      query: "official explanation for confidentiality",
      overrideIntent: "grounded-answer",
    },
    {
      groundedResolver: async () => {
        throw new Error("Missing GEMINI_API_KEY environment variable.");
      },
    }
  );

  assert.equal(response.localOnly, true);
  assert.equal(response.officialConfirmationStatus, "unavailable");
  assert.equal(response.examSafeFocus.length, 3);
});

test("uses the Gemini coach when a coached response is provided", async () => {
  const response = await generateTopicIntelligenceResponse(
    {
      topicId: "security",
      query: "What is confidentiality?",
    },
    {
      coachResolver: async () => ({
        provider: "gemini-coach",
        model: "stub-gemini",
        answer: "Confidentiality means keeping sensitive data visible only to authorised people.",
        examSafeFocus: [
          "define confidentiality precisely",
          "mention authorised access controls",
          "link it to sensitive data handling",
        ],
        misconceptions: ["Do not confuse confidentiality with integrity."],
        outOfScope: false,
      }),
    }
  );

  assert.equal(response.provider, "gemini-coach");
  assert.equal(response.model, "stub-gemini");
  assert.equal(response.examSafeFocus.length, 3);
  assert.match(response.answer.toLowerCase(), /authorised/);
});

test("falls back to the local router when Gemini coach marks the query out of scope", async () => {
  const response = await generateTopicIntelligenceResponse(
    {
      topicId: "security",
      query: "What is confidentiality?",
    },
    {
      coachResolver: async () => ({
        provider: "gemini-coach",
        model: "stub-gemini",
        answer: "Out of scope.",
        examSafeFocus: [
          "ignore one",
          "ignore two",
          "ignore three",
        ],
        misconceptions: [],
        outOfScope: true,
      }),
    }
  );

  assert.equal(response.provider, "local-rule-engine");
  assert.equal(response.localOnly, true);
  assert.match(response.answer.toLowerCase(), /confidentiality/);
});
