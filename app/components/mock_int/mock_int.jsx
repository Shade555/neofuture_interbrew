"use client";
import { useState, useEffect, useRef } from "react";
import { useSpeech } from "./useSpeech";
import { supabase } from "../../../lib/supabaseClient";
import tryIncrementStreak from "../../../lib/streak";

// helper to log TTS errors but silently ignore cancellations/interrupts
function logTtsError(e) {
  try {
    const msg = e?.message ?? String(e);
    if (/interrupt|interrupted|cancel|aborted?/i.test(msg)) return;
    console.error("TTS error:", msg);
  } catch (err) {
    console.error("TTS error:", err);
  }
}

export default function MockInterviewPanel({
  difficulty,
  onClose,
  topic,
  mode = "interview",
  moduleId,
}) {
  const [history, setHistory] = useState([]);
  const historyRef = useRef([]);
  const [status, setStatus] = useState("Ready");
  const [questionIndex, setQuestionIndex] = useState(0);
  const finishedRef = useRef(false);
  const systemPromptRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [favAdded, setFavAdded] = useState([]);
  const awaitingCloseRef = useRef(false);
  const [solveQuestions, setSolveQuestions] = useState([]);
  const [solveLoading, setSolveLoading] = useState(false);
  const [solveError, setSolveError] = useState("");
  const [solveIndex, setSolveIndex] = useState(0);
  const [solveAnswer, setSolveAnswer] = useState("");
  const [solveChecks, setSolveChecks] = useState({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleSubject, setScheduleSubject] = useState(topic || "");
  const [scheduleDifficulty, setScheduleDifficulty] = useState(difficulty || "intermediate");
  const [scheduleRound, setScheduleRound] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");

  useEffect(() => {
    if (mode !== "solve" || !moduleId) return;

    let active = true;

    async function loadSolveQuestions() {
      setSolveLoading(true);
      setSolveError("");
      setSolveQuestions([]);
      setSolveIndex(0);
      setSolveAnswer("");
      setSolveChecks({});

      try {
        const selectCandidates = [
          "*, modules(order_number,title)",
          "id, module_id, question_text, question_type, difficulty, explanation, options, correct_options, correct_boolean, short_answer, numerical_answer, numerical_tolerance, correct_answer, created_at, modules(order_number)",
          "id, module_id, question_text, question_type, explanation, options, correct_options, correct_boolean, short_answer, numerical_answer, numerical_tolerance, correct_answer, created_at, modules(order_number)",
          "id, module_id, question_text, question_type, options, correct_options, correct_boolean, short_answer, numerical_answer, correct_answer, created_at, modules(order_number)",
          "id, module_id, question_text, question_type, correct_answer, created_at, modules(order_number)",
        ];

        let data = null;
        const moduleFilter = String(topic || "").trim();

        // Primary table name
        let primaryTry = null;
        for (const selectColumns of selectCandidates) {
          primaryTry = await supabase
            .from("collection_solve")
            .select(selectColumns)
            .eq("modules.title", moduleFilter)
            .eq("is_active", true);

          if (!primaryTry.error) break;

          // If is_active or optional selected columns are missing, retry without is_active.
          primaryTry = await supabase
            .from("collection_solve")
            .select(selectColumns)
            .eq("modules.title", moduleFilter);

          if (!primaryTry.error) break;
        }

        if (!primaryTry.error) {
          data = primaryTry.data;
        } else {
          const primaryMessage = String(
            primaryTry.error?.message || "",
          ).toLowerCase();
          const primaryIsMissingTable =
            primaryMessage.includes("collection_solve") &&
            (primaryMessage.includes("does not exist") ||
              primaryMessage.includes("schema cache"));

          // Optional fallback for legacy typo table name, only if primary table is missing.
          if (primaryIsMissingTable) {
            let legacyTry = null;
            for (const selectColumns of selectCandidates) {
              legacyTry = await supabase
                .from("sollection_solve")
                .select(selectColumns)
                .eq("modules.title", moduleFilter)
                .eq("is_active", true);

              if (!legacyTry.error) break;

              legacyTry = await supabase
                .from("sollection_solve")
                .select(selectColumns)
                .eq("modules.title", moduleFilter);

              if (!legacyTry.error) break;
            }

            if (legacyTry.error) throw primaryTry.error;
            data = legacyTry.data;
          } else {
            throw primaryTry.error;
          }
        }

        if (!active) return;

        const normalizedData = Array.isArray(data)
          ? data.map((row) => ({
              ...row,
              options: extractQuestionOptions(row),
            }))
          : [];
        normalizedData.sort((a, b) => {
          const orderA = Number(
            a?.modules?.order_number ?? Number.MAX_SAFE_INTEGER,
          );
          const orderB = Number(
            b?.modules?.order_number ?? Number.MAX_SAFE_INTEGER,
          );
          if (orderA !== orderB) return orderA - orderB;
          const createdA = new Date(a?.created_at || 0).getTime();
          const createdB = new Date(b?.created_at || 0).getTime();
          return createdA - createdB;
        });

        setSolveQuestions(normalizedData);
      } catch (err) {
        const message = err?.message || "Failed to load solve questions";
        if (active) setSolveError(message);
      } finally {
        if (active) setSolveLoading(false);
      }
    }

    loadSolveQuestions();
    return () => {
      active = false;
    };
  }, [mode, moduleId]);

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function parseTextAnswerCandidates(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }

    if (value && typeof value === "object") {
      return Object.values(value)
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    }

    if (typeof value === "string") {
      const raw = value.trim();
      if (!raw) return [];

      try {
        const parsed = JSON.parse(raw);
        return parseTextAnswerCandidates(parsed);
      } catch (e) {
        const split = raw
          .split(/\n|\||;|,/)
          .map((item) => item.trim())
          .filter(Boolean);
        return split.length > 1 ? split : [raw];
      }
    }

    const single = String(value || "").trim();
    return single ? [single] : [];
  }

  function getShortAnswerCandidates(question) {
    const candidates = [
      ...parseTextAnswerCandidates(question?.short_answer),
      ...parseTextAnswerCandidates(question?.correct_answer),
      ...parseTextAnswerCandidates(question?.answer),
      ...parseTextAnswerCandidates(question?.expected_answer),
    ];

    // Unique by normalized value.
    const seen = new Set();
    return candidates.filter((item) => {
      const key = normalizeText(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function parseChoiceIndexes(value) {
    if (Array.isArray(value)) return value.map((item) => Number(item));
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map((item) => Number(item)) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  function parseQuestionOptions(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        const splitCandidates = value
          .split(/\n|\||;/)
          .map((item) => item.trim())
          .filter(Boolean);
        return splitCandidates;
      }
    }
    if (value && typeof value === "object") {
      return Object.values(value);
    }
    return [];
  }

  function extractQuestionOptions(question) {
    const directCandidates = [
      question?.options,
      question?.question_options,
      question?.choices,
      question?.choice_options,
      question?.answers,
      question?.answer_options,
      question?.opts,
      question?.mcq_options,
    ];

    for (const candidate of directCandidates) {
      const parsed = parseQuestionOptions(candidate);
      if (parsed.length > 0) return parsed;
    }

    const keyedOptionValues = [
      question?.option_a,
      question?.option_b,
      question?.option_c,
      question?.option_d,
      question?.option_e,
      question?.option_f,
      question?.option_1,
      question?.option_2,
      question?.option_3,
      question?.option_4,
      question?.option_5,
      question?.option_6,
    ].filter(
      (value) =>
        value !== undefined && value !== null && `${value}`.trim() !== "",
    );

    if (keyedOptionValues.length > 0) return keyedOptionValues;
    return [];
  }

  function normalizeQuestionType(rawType, optionList = []) {
    const t = normalizeText(rawType).replace(/[\s/-]+/g, "_");
    if (["mcq", "single_choice", "single", "objective"].includes(t)) {
      return "mcq";
    }
    if (
      ["msq", "multi_select", "multiple_select", "multiple_choice"].includes(t)
    ) {
      return "msq";
    }
    if (["true_false", "truefalse", "boolean", "tf"].includes(t)) {
      return "true_false";
    }
    if (["short_answer", "shortanswer", "text", "subjective"].includes(t)) {
      return "short_answer";
    }
    if (["numerical", "numeric", "number"].includes(t)) {
      return "numerical";
    }

    // Fallback: if options exist but type is unknown, treat as single choice.
    if (Array.isArray(optionList) && optionList.length > 0) return "mcq";
    return "short_answer";
  }

  function evaluateSolveAnswer(question, answer) {
    const options = extractQuestionOptions(question);
    const type = normalizeQuestionType(question?.question_type, options);

    if (type === "mcq") {
      const correctIndexes = parseChoiceIndexes(question.correct_options);
      if (correctIndexes.length > 0) {
        return Number(answer) === Number(correctIndexes[0]);
      }

      // Fallback when DB stores answer as text/value.
      const correctText = normalizeText(question.correct_answer);
      const selectedText = normalizeText(options[Number(answer)]);
      if (correctText && selectedText) return selectedText === correctText;
      return false;
    }

    if (type === "msq") {
      const chosen = parseChoiceIndexes(answer).sort((a, b) => a - b);
      const correct = parseChoiceIndexes(question.correct_options).sort(
        (a, b) => a - b,
      );
      if (correct.length === 0) {
        const raw = String(question.correct_answer || "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
          .map((v) => Number(v));
        raw.sort((a, b) => a - b);
        if (chosen.length !== raw.length) return false;
        return chosen.every(
          (value, index) => Number(value) === Number(raw[index]),
        );
      }
      if (chosen.length !== correct.length) return false;
      return chosen.every(
        (value, index) => Number(value) === Number(correct[index]),
      );
    }

    if (type === "true_false") {
      const correct = Boolean(question.correct_boolean);
      const normalized = normalizeText(answer);
      return normalized === String(correct).toLowerCase();
    }

    if (type === "short_answer") {
      const userAnswer = normalizeText(answer);
      if (!userAnswer) return false;

      const acceptedAnswers = getShortAnswerCandidates(question);
      if (acceptedAnswers.length === 0) return false;

      return acceptedAnswers.some(
        (candidate) => normalizeText(candidate) === userAnswer,
      );
    }

    if (type === "numerical") {
      const numericAnswer = Number(answer);
      const correct = Number(question.numerical_answer);
      const tolerance = Number(question.numerical_tolerance || 0);
      if (Number.isNaN(numericAnswer) || Number.isNaN(correct)) return false;
      return Math.abs(numericAnswer - correct) <= tolerance;
    }

    return false;
  }

  function submitSolveAnswer() {
    const currentQuestion = solveQuestions[solveIndex];
    if (!currentQuestion) return;

    const isCorrect = evaluateSolveAnswer(currentQuestion, solveAnswer);
    setSolveChecks((prev) => ({
      ...prev,
      [currentQuestion.id]: isCorrect,
    }));
  }

  function goToNextSolveQuestion() {
    const nextIndex = solveIndex + 1;
    setSolveAnswer("");
    if (nextIndex >= solveQuestions.length) {
      onClose?.();
      return;
    }
    setSolveIndex(nextIndex);
  }

  async function saveScheduledInterview() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId || !scheduleDate || !scheduleSubject) {
        alert("Please fill in date and subject");
        return;
      }

      const { error } = await supabase
        .from("user_interviews")
        .insert({
          user_id: userId,
          interview_date: scheduleDate,
          subject: scheduleSubject,
          difficulty: scheduleDifficulty,
          round: scheduleRound,
          notes: scheduleNotes,
          user_email: userData?.user?.email,
        });

      if (error) {
        console.error("Failed to save interview:", error);
        alert("Failed to save interview");
        return;
      }

      // Reset form
      setScheduleDate(new Date().toISOString().split('T')[0]);
      setScheduleSubject(topic || "");
      setScheduleDifficulty(difficulty || "intermediate");
      setScheduleRound("");
      setScheduleNotes("");
      setShowScheduleModal(false);
      alert("Interview scheduled successfully!");
    } catch (err) {
      console.error("Error saving interview:", err);
      alert("Error scheduling interview");
    }
  }

  async function addToFavourites(question) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("Not signed in");

      const { data, error } = await supabase
        .from("user_dashboards")
        .select("favourite_questions")
        .eq("user_id", userId)
        .single();
      if (error) {
        console.error("Failed to fetch dashboard row", error);
        return false;
      }
      const favs = Array.isArray(data?.favourite_questions)
        ? data.favourite_questions
        : [];
      if (favs.includes(question)) {
        setFavAdded((s) => [...s, question]);
        return true;
      }
      const newFavs = [...favs, question];
      const { error: upErr } = await supabase
        .from("user_dashboards")
        .update({ favourite_questions: newFavs })
        .eq("user_id", userId);
      if (upErr) {
        console.error("Failed to update favourites", upErr);
        return false;
      }
      try {
        window.dispatchEvent(
          new CustomEvent("favourites:updated", { detail: { question } }),
        );
      } catch (e) {}
      setFavAdded((s) => [...s, question]);
      return true;
    } catch (e) {
      console.error("addToFavourites error", e);
      return false;
    }
  }

  // Initialize our custom speech hook
  const { isListening, startListening, stopListening, speak, stopSpeaking } =
    useSpeech(async (userText) => {
      // 1. User stopped talking, we got the text
      setStatus("Thinking...");

      try {
        // 2. Send text to our Next.js backend (API will add message to history)
        const res = await fetch("/api/mock_int", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            history: historyRef.current,
            system: systemPromptRef.current,
          }),
        });

        const data = await res.json();

        // Check for API errors
        if (!res.ok || data.error) {
          console.error("API error:", data.error || res.statusText);
          setStatus("Error: API failed");
          setHistory((prev) => {
            const next = [
              ...prev,
              { role: "user", content: userText },
              {
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again.",
              },
            ];
            historyRef.current = next;
            return next;
          });
          return;
        }

        // 3. AI replied. Prefer structured JSON: { message: string, end: boolean }
        let assistantReplyRaw = data.reply || "";
        console.log("API Response:", {
          reply: assistantReplyRaw,
          isComplete: data.isComplete,
        });
        let assistantMessage = assistantReplyRaw;
        let isEnd = false || data.isComplete;

        try {
          // Try direct parse
          const parsed = JSON.parse(assistantReplyRaw);
          if (
            parsed &&
            typeof parsed.message === "string" &&
            parsed.message.trim().length > 0
          ) {
            assistantMessage = parsed.message;
            isEnd = !!parsed.end || isEnd;
          }
        } catch (e) {
          // Try to extract JSON substring
          const jsonMatch = assistantReplyRaw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              // Only use JSON if message is substantial (not empty or just "take your time")
              if (
                parsed &&
                typeof parsed.message === "string" &&
                parsed.message.trim().length > 20
              ) {
                assistantMessage = parsed.message;
                isEnd = !!parsed.end || isEnd;
              } else {
                // If JSON message is empty or too short, extract all text before the JSON
                const textBeforeJson = assistantReplyRaw
                  .substring(0, jsonMatch.index)
                  .trim();
                if (textBeforeJson.length > 0) {
                  assistantMessage = textBeforeJson;
                } else {
                  assistantMessage = assistantReplyRaw
                    .replace(jsonMatch[0], "")
                    .trim();
                }
                isEnd = parsed && !!parsed.end ? true : isEnd;
              }
            } catch (e2) {
              // keep raw response
            }
          }
        }

        // Ensure we have a message
        if (!assistantMessage || assistantMessage.trim() === "") {
          assistantMessage = "I'm thinking... could you rephrase that?";
        }

        // fallback heuristics: trim multiple questions to first
        if (!isEnd) {
          const questionMarks = (assistantMessage.match(/\?/g) || []).length;
          if (questionMarks > 1) {
            const firstQ = assistantMessage.indexOf("?");
            assistantMessage = assistantMessage.slice(0, firstQ + 1).trim();
          }
        }

        // Detect if assistant asked the closing question and append reply to history
        const closingQuestionRegex =
          /do you have any questions for me|any questions for me|do you have any questions\?/i;
        if (closingQuestionRegex.test(assistantMessage)) {
          awaitingCloseRef.current = true;
        }

        setHistory((prev) => {
          const next = [
            ...prev,
            { role: "user", content: userText },
            { role: "assistant", content: assistantMessage },
          ];
          historyRef.current = next;
          return next;
        });
        setStatus("Ready");

        if (isEnd && !finishedRef.current) {
          // If assistant incorrectly marked end while asking for candidate questions,
          // treat it as non-final and wait for candidate reply.
          if (
            awaitingCloseRef.current &&
            closingQuestionRegex.test(assistantMessage)
          ) {
            try {
              speak(assistantMessage).catch((e) => logTtsError(e));
            } catch (e) {
              logTtsError(e);
            }
            // do not close yet
          } else {
            finishedRef.current = true;
            try {
              await speak(assistantMessage);
            } catch (e) {
              logTtsError(e);
            }
            // Increment streak once per day for completing a mock interview
            try {
              await tryIncrementStreak();
            } catch (e) {
              /* ignore */
            }
            // stop any TTS immediately and close
            try {
              stopSpeaking?.();
            } catch (e) {}
            onClose?.();
          }
        } else {
          // speak but don't await for non-final replies
          speak(assistantMessage).catch((e) => logTtsError(e));
          if (/\?/m.test(assistantMessage)) setQuestionIndex((q) => q + 1);
        }
      } catch (error) {
        console.error(error);
        setStatus("Error fetching response.");
      }
    });

  // helper to start interview by requesting the first question
  async function startInterview() {
    setStatus("Thinking...");
    setStarted(true);
    const sessionToken = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const systemPrompt = `You are a professional Operating Systems interviewer conducting a structured mock interview.

Topic context: ${topic || "Operating Systems"}
Difficulty context: ${difficulty || "Intermediate"}
Interview session token: ${sessionToken}

Opening Rule:
- Start with exactly this sentence: "Hello, lets begin the interview."
- Immediately follow with the first question in the same message.

Core Behavior:
- Maintain a cold, professional, neutral tone.
- Keep interaction natural and human-like, not robotic.
- After each relevant answer, acknowledge briefly with a neutral phrase like "Okay.", "Alright.", or "Great." then move to the next question.
- Keep acknowledgments short and restrained: no strong praise, no sarcasm, no rude wording.

Question Flow Rules:
- Ask one question per turn.
- If interview is based on a single OS section, ask 7 to 10 questions total.
- If interview covers the entire OS syllabus, ask exactly 15 questions total.
- Infer whether this is section-based or full-syllabus from the topic context.
- For every new session, randomize question selection and order within the relevant OS section.
- Do not follow a fixed sequence across sessions for the same section.
- Do not ask the same question twice in one interview.
- Never exceed the selected question limit.
- If the user's reply is irrelevant, state a brief correction and ask the same current question again.
- Only move to the next question after a relevant answer.

Adaptive Behavior:
- If the answer is correct or strong, maintain or slightly increase difficulty.
- If the answer is weak or incorrect, continue without criticism.
- If the user cannot answer, reduce difficulty of the next question.
- If an answer needs an example but lacks one, ask a follow-up specifically requesting an example.

Handling Off-Topic or Useless Input:
- Do not ignore it.
- Use a brief corrective line, varied naturally, such as:
  "Please stay relevant to the question."
  "That response is not related to the question."
  "Focus on the topic being discussed."
- Then repeat the same current question (do not advance).

Interaction Constraints:
- Do not use generic prompts like "Can you elaborate?" or "Tell me more."
- Ask follow-ups only when logically required (for example, missing example).
- Do not entertain irrelevant conversation.

Closing Behavior:
- After the final answer to the last question, respond normally to that answer.
- Then conclude naturally with: "That concludes the interview."
- If the user says something before you send the closing message, respond briefly, then end the interview.

Output Format:
- Return plain conversational text only. Do not output JSON.`;
    systemPromptRef.current = systemPrompt;

    try {
      const res = await fetch("/api/mock_int", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "__start__",
          history: historyRef.current,
          system: systemPromptRef.current,
        }),
      });
      const data = await res.json();

      // Check for API errors
      if (!res.ok || data.error) {
        console.error("API error:", data.error || res.statusText);
        setStatus("Error: Failed to start interview");
        return;
      }

      let assistantReplyRaw = data.reply || "";
      let assistantMessage = assistantReplyRaw;
      let isEnd = false || data.isComplete;
      try {
        const parsed = JSON.parse(assistantReplyRaw);
        if (
          parsed &&
          typeof parsed.message === "string" &&
          parsed.message.trim().length > 0
        ) {
          assistantMessage = parsed.message;
          isEnd = !!parsed.end || isEnd;
        }
      } catch (e) {
        const jsonMatch = assistantReplyRaw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            // Only use JSON if message is substantial (not empty or too short)
            if (
              parsed &&
              typeof parsed.message === "string" &&
              parsed.message.trim().length > 20
            ) {
              assistantMessage = parsed.message;
              isEnd = !!parsed.end || isEnd;
            } else {
              // If JSON message is empty or too short, extract all text before the JSON
              const textBeforeJson = assistantReplyRaw
                .substring(0, jsonMatch.index)
                .trim();
              if (textBeforeJson.length > 0) {
                assistantMessage = textBeforeJson;
              } else {
                assistantMessage = assistantReplyRaw
                  .replace(jsonMatch[0], "")
                  .trim();
              }
              isEnd = parsed && !!parsed.end ? true : isEnd;
            }
          } catch (e2) {}
        }
      }

      // Ensure we have a message
      if (!assistantMessage || assistantMessage.trim() === "") {
        assistantMessage = "Hello, and thanks for joining. How are you today?";
      }

      // fallback: trim multiple questions to first
      if (!isEnd) {
        const questionMarks = (assistantMessage.match(/\?/g) || []).length;
        if (questionMarks > 1) {
          const firstQ = assistantMessage.indexOf("?");
          assistantMessage = assistantMessage.slice(0, firstQ + 1).trim();
        }
      }
      const closingQuestionRegex =
        /do you have any questions for me|any questions for me|do you have any questions\?/i;
      if (closingQuestionRegex.test(assistantMessage)) {
        awaitingCloseRef.current = true;
      }

      setHistory((h) => {
        // Add a placeholder user message first, then the assistant greeting
        // This ensures proper alternating user/assistant message structure for Groq
        const next = [
          { role: "user", content: "__greeting_request__" },
          { role: "assistant", content: assistantMessage },
        ];
        historyRef.current = next;
        return next;
      });
      setStatus("Ready");
      if (isEnd && !finishedRef.current) {
        if (
          awaitingCloseRef.current &&
          closingQuestionRegex.test(assistantMessage)
        ) {
          // assistant asked for candidate questions but set end: wait for user's reply
          try {
            speak(assistantMessage).catch((e) => logTtsError(e));
          } catch (e) {
            logTtsError(e);
          }
        } else {
          finishedRef.current = true;
          try {
            await speak(assistantMessage);
          } catch (e) {
            logTtsError(e);
          }
          // Increment streak once per day for completing a mock interview
          try {
            await tryIncrementStreak();
          } catch (e) {
            /* ignore */
          }
          // stop any speech then close
          try {
            stopSpeaking?.();
          } catch (e) {}
          onClose?.();
        }
      } else {
        speak(assistantMessage).catch((e) => logTtsError(e));
      }
    } catch (err) {
      console.error(err);
      setStatus("Error starting interview");
    }
  }

  useEffect(() => {
    // start is manual now; do not auto-start on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // ensure we stop any speech when this component unmounts
    return () => {
      try {
        stopSpeaking?.();
      } catch (e) {}
      try {
        stopListening();
      } catch (e) {}
    };
  }, []);

  if (mode === "solve") {
    const currentQuestion = solveQuestions[solveIndex];
    const optionList = extractQuestionOptions(currentQuestion);
    const normalizedType = normalizeQuestionType(
      currentQuestion?.question_type,
      optionList,
    );
    const isChoiceQuestion = optionList.length > 0;
    const isMultiSelect = normalizedType === "msq";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/60"
          onClick={() => onClose?.()}
        />
        <div
          className="relative mx-3 w-[96vw] max-w-375 min-h-[70vh] max-h-[88vh] overflow-hidden rounded-2xl border border-white/15 bg-[#0f1115] p-6 shadow-2xl shadow-black/70"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between">
            <h2 className="text-2xl font-bold">
              Solve Questions{topic ? ` — ${topic}` : ""}
            </h2>
            <button
              onClick={() => onClose?.()}
              className="px-3 py-1 rounded-md bg-white/10"
            >
              Close
            </button>
          </div>

          {solveLoading ? (
            <div className="text-gray-300">Loading questions...</div>
          ) : solveError ? (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {solveError}
            </div>
          ) : !currentQuestion ? (
            <div className="rounded-md border border-white/10 bg-white/5 p-4 text-gray-300">
              No questions found for this module.
            </div>
          ) : (
            <div className="space-y-5 overflow-y-auto max-h-[68vh] pr-1">
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-gray-400">
                  <span>
                    Question {solveIndex + 1} / {solveQuestions.length}
                  </span>
                  <span className="uppercase">{normalizedType}</span>
                </div>
                <div className="text-xl leading-snug text-white">
                  {currentQuestion.question_text}
                </div>
              </div>

              {isChoiceQuestion && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {optionList.map((opt, idx) => {
                    const checked = !isMultiSelect
                      ? String(solveAnswer) === String(idx)
                      : Array.isArray(solveAnswer) && solveAnswer.includes(idx);

                    return (
                      <button
                        type="button"
                        key={idx}
                        aria-pressed={checked}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-5 py-4 text-white transition-colors ${
                          checked
                            ? "border-emerald-500/60 bg-emerald-500/15"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                        onClick={() => {
                          if (!isMultiSelect) {
                            setSolveAnswer(String(idx));
                            return;
                          }

                          const prev = Array.isArray(solveAnswer)
                            ? solveAnswer
                            : [];
                          const next = checked
                            ? prev.filter((item) => item !== idx)
                            : [...prev, idx];
                          setSolveAnswer(next);
                        }}
                      >
                        <span className="text-base leading-relaxed">
                          {String.fromCharCode(65 + idx)}. {String(opt)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {!isChoiceQuestion && normalizedType === "true_false" && (
                <div className="flex gap-3">
                  {["true", "false"].map((value) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white"
                    >
                      <input
                        type="radio"
                        name="true-false"
                        checked={String(solveAnswer) === value}
                        onChange={() => setSolveAnswer(value)}
                      />
                      <span>{value === "true" ? "True" : "False"}</span>
                    </label>
                  ))}
                </div>
              )}

              {!isChoiceQuestion && normalizedType === "short_answer" && (
                <input
                  value={solveAnswer}
                  onChange={(e) => setSolveAnswer(e.target.value)}
                  placeholder="Type your answer"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none text-lg"
                />
              )}

              {!isChoiceQuestion && normalizedType === "numerical" && (
                <input
                  type="number"
                  value={solveAnswer}
                  onChange={(e) => setSolveAnswer(e.target.value)}
                  placeholder="Enter number"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none text-lg"
                />
              )}

              {!isChoiceQuestion &&
                normalizedType !== "true_false" &&
                normalizedType !== "short_answer" &&
                normalizedType !== "numerical" && (
                  <input
                    value={solveAnswer}
                    onChange={(e) => setSolveAnswer(e.target.value)}
                    placeholder="Type your answer"
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none text-lg"
                  />
                )}

              {solveChecks[currentQuestion.id] !== undefined && (
                <div
                  className={`rounded-md border p-4 ${solveChecks[currentQuestion.id] ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}
                >
                  {solveChecks[currentQuestion.id] ? "Correct." : "Incorrect."}
                  {currentQuestion.explanation ? (
                    <div className="mt-2 text-sm text-inherit opacity-90">
                      {currentQuestion.explanation}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSolveAnswer("")}
                  className="rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={
                    solveChecks[currentQuestion.id] === undefined
                      ? submitSolveAnswer
                      : goToNextSolveQuestion
                  }
                  className="rounded-md border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/20 transition-colors"
                >
                  {solveChecks[currentQuestion.id] === undefined
                    ? "Check Answer"
                    : solveIndex + 1 >= solveQuestions.length
                      ? "Finish"
                      : "Next"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          try {
            stopSpeaking?.();
          } catch (e) {}
          onClose?.();
        }}
      />
      <div
        className="relative p-6 rounded-lg bg-transparent recommended-card max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-bold">
            AI Mock Interview{difficulty ? ` — ${difficulty}` : ""}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-3 py-1 rounded-md bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/40 text-sm"
              title="Schedule this interview"
            >
              📅 Schedule
            </button>
            <button
              onClick={() => {
                try {
                  stopSpeaking?.();
                } catch (e) {}
                onClose?.();
              }}
              className="px-3 py-1 rounded-md bg-white/10"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          {!started ? (
            <button
              onClick={() => startInterview()}
              className={`px-6 py-3 rounded-full text-white font-semibold bg-blue-600 hover:bg-blue-700`}
            >
              Start Interview
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  if (isListening) {
                    stopListening();
                    return;
                  }
                  // Stop any TTS immediately before starting user speech
                  try {
                    stopSpeaking?.();
                  } catch (e) {}
                  startListening();
                }}
                onContextMenu={(e) => e.preventDefault()}
                aria-pressed={isListening}
                className={`px-6 py-3 rounded-full text-white font-semibold transition-all select-none ${
                  isListening
                    ? "bg-red-500 animate-pulse"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isListening ? "Click to Stop" : "Click to Speak"}
              </button>
            </>
          )}
          <span className="text-gray-600 font-medium">Status: {status}</span>
        </div>

        <div className="bg-white/5 p-4 rounded-md h-64 overflow-y-auto border border-white/10 scrollbar-hide">
          {history.length === 0 ? (
            <p className="text-gray-400 italic">
              Conversation will appear here...
            </p>
          ) : (
            history
              .filter((msg) => msg.content !== "__greeting_request__")
              .map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}
                >
                  <span
                    className={`inline-block p-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-green-100 text-green-900"
                    }`}
                  >
                    <strong>{msg.role === "user" ? "You: " : "AI: "}</strong>
                    {msg.content}
                  </span>
                  {msg.role === "assistant" && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await addToFavourites(msg.content);
                      }}
                      className={`ml-2 text-lg px-1 py-0.5 rounded ${favAdded.includes(msg.content) ? "text-amber-400" : "text-gray-400 hover:text-amber-400"}`}
                      aria-label="Add to favourites"
                    >
                      {favAdded.includes(msg.content) ? "★" : "☆"}
                    </button>
                  )}
                </div>
              ))
          )}
        </div>

        {showScheduleModal && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowScheduleModal(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0f1115] shadow-2xl shadow-black/70 mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h3 className="text-sm font-semibold text-zinc-100">Schedule Interview</h3>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-md border border-white/15 bg-white/5 px-3 py-1 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="px-4 py-4 space-y-3">
                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Interview Date *
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full rounded px-2 py-2 bg-black/30 border border-white/10 text-sm text-white"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Subject *
                  </label>
                  <input
                    value={scheduleSubject}
                    onChange={(e) => setScheduleSubject(e.target.value)}
                    placeholder="e.g., Process Management"
                    className="w-full rounded px-2 py-2 bg-black/30 border border-white/10 text-sm text-white placeholder:text-zinc-600"
                  />
                </div>

                {/* Difficulty & Round */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={scheduleDifficulty}
                      onChange={(e) => setScheduleDifficulty(e.target.value)}
                      className="w-full rounded px-2 py-2 bg-black/30 border border-white/10 text-sm text-white"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Round
                    </label>
                    <input
                      value={scheduleRound}
                      onChange={(e) => setScheduleRound(e.target.value)}
                      placeholder="e.g., Technical"
                      className="w-full rounded px-2 py-2 bg-black/30 border border-white/10 text-sm text-white placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    placeholder="Add any notes..."
                    className="w-full rounded px-2 py-2 bg-black/30 border border-white/10 text-sm text-white placeholder:text-zinc-600 resize-none h-20"
                  />
                </div>
              </div>

              <div className="border-t border-white/10 px-4 py-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveScheduledInterview}
                  className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
