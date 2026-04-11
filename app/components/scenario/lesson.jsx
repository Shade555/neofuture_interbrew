"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import "./lesson.css";

// Convert YouTube URL to embed URL
function getEmbedUrl(url) {
  if (!url) return null;
  // Already an embed URL
  if (url.includes("/embed/")) return url;
  // Extract video ID from various YouTube URL formats
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/,
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function LessonView({ module, onBack, onComplete }) {
  const [lessons, setLessons] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]); // 5 random quiz questions for the module
  const [loading, setLoading] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [step, setStep] = useState(0); // 0 = explanation, 1 = video, 2 = quiz
  const [currentQuiz, setCurrentQuiz] = useState(0); // index within the 5 quiz questions
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({}); // track answers for all quiz questions { quizIndex: { selected, correct } }

  // Interview state
  const [interviewMessages, setInterviewMessages] = useState([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef(null);
  const interruptRecognitionRef = useRef(null);
  // Always-current mirror of interviewMessages — avoids stale closure in generateFeedback
  const interviewMessagesRef = useRef([]);
  const groqHistoryRef = useRef([]);
  const voiceTranscriptRef = useRef("");
  const isSendingRef = useRef(false);
  const isAiSpeakingRef = useRef(false);
  const interruptCountRef = useRef(0);
  const pauseCountRef = useRef(0);
  const sendDelayRef = useRef(null);
  const interviewEndedRef = useRef(false);

  // Feedback state
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function fetchLessons() {
      if (!supabase || !module?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch lessons for this module
        const { data: lessonData, error: lessonError } = await supabase
          .from("lessons")
          .select("*")
          .eq("module_id", module.id)
          .order("order_number", { ascending: true });

        if (lessonError) {
          console.error("Error fetching lessons:", lessonError);
          setLoading(false);
          return;
        }

        if (lessonData && lessonData.length > 0) {
          setLessons(lessonData);

          // Fetch ALL quizzes for all lessons in this module
          const lessonIds = lessonData.map((l) => l.id);
          const { data: quizData, error: quizError } = await supabase
            .from("quizzes")
            .select("*")
            .in("lesson_id", lessonIds);

          if (!quizError && quizData && quizData.length > 0) {
            // Normalize options: handle array, object {A:...,B:...,C:...,D:...}, or JSON string
            const normalized = quizData.map((q) => {
              let opts = q.options;
              if (typeof opts === "string") {
                try {
                  opts = JSON.parse(opts);
                } catch {
                  opts = null;
                }
              }
              let correctAnswer = q.correct_answer;
              if (!Array.isArray(opts) && opts && typeof opts === "object") {
                // Resolve correct_answer key (e.g. "B") to its text value
                if (correctAnswer && opts[correctAnswer]) {
                  correctAnswer = opts[correctAnswer];
                }
                // Extract values in key order
                opts = Object.keys(opts)
                  .sort()
                  .map((k) => opts[k]);
              }
              if (!Array.isArray(opts)) opts = [];
              return { ...q, options: opts, correct_answer: correctAnswer };
            });
            // Shuffle and pick up to 5 random questions
            const shuffled = [...normalized].sort(() => Math.random() - 0.5);
            setQuizQuestions(shuffled.slice(0, 5));
          }
        }
      } catch (err) {
        console.error("Failed to fetch lessons:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, [module]);

  const lesson = lessons[currentLesson];
  const hasQuiz = quizQuestions.length > 0;
  const isLastLesson = currentLesson === lessons.length - 1;
  // Steps: explanation, [video], [quiz], interview, feedback
  let totalSteps = 1; // explanation always
  if (lesson?.video_url) totalSteps++;
  if (hasQuiz) totalSteps++;
  totalSteps++; // interview
  totalSteps++; // feedback always last
  const activeQuiz = hasQuiz ? quizQuestions[currentQuiz] : null;
  const isLastQuizQuestion = currentQuiz === quizQuestions.length - 1;

  const handleNext = () => {
    const stepType = getStepType();

    if (stepType === "quiz" && !isLastQuizQuestion) {
      setCurrentQuiz(currentQuiz + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      return;
    }

    if (stepType === "interview") {
      generateFeedback();
      setStep(step + 1);
      return;
    }

    if (stepType === "feedback") {
      if (isLastLesson) {
        onComplete?.();
      } else {
        setCurrentLesson(currentLesson + 1);
        setStep(0);
        setSelectedAnswer(null);
        setAnswered(false);
        setCurrentQuiz(0);
        resetInterview();
        setFeedback(null);
      }
      return;
    }

    if (step < totalSteps - 1) {
      setStep(step + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setCurrentQuiz(0);
    } else if (!isLastLesson) {
      setCurrentLesson(currentLesson + 1);
      setStep(0);
      setSelectedAnswer(null);
      setAnswered(false);
      setCurrentQuiz(0);
      resetInterview();
      setFeedback(null);
    } else {
      onComplete?.();
    }
  };

  const handlePrev = () => {
    const stepType = getStepType();

    if (stepType === "feedback") {
      setStep(step - 1);
      return;
    }

    if (stepType === "interview") {
      setStep(step - 1);
      if (hasQuiz) setCurrentQuiz(quizQuestions.length - 1);
      const prev = hasQuiz ? quizAnswers[quizQuestions.length - 1] : null;
      setSelectedAnswer(prev?.selected ?? null);
      setAnswered(!!prev);
      return;
    }

    if (stepType === "quiz" && currentQuiz > 0) {
      setCurrentQuiz(currentQuiz - 1);
      const prev = quizAnswers[currentQuiz - 1];
      setSelectedAnswer(prev?.selected ?? null);
      setAnswered(!!prev);
      return;
    }

    if (step > 0) {
      setStep(step - 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
      const prevLesson = lessons[currentLesson - 1];
      const prevHasVideo = !!prevLesson?.video_url;
      let prevTotalSteps = 1;
      if (prevHasVideo) prevTotalSteps++;
      if (hasQuiz) prevTotalSteps++;
      prevTotalSteps++;
      prevTotalSteps++;
      setStep(prevTotalSteps - 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const handleSelectAnswer = (option) => {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);
    setQuizAnswers((prev) => ({
      ...prev,
      [currentQuiz]: {
        selected: option,
        correct: option === activeQuiz?.correct_answer,
      },
    }));
  };

  const getStepType = () => {
    const types = ["explanation"];
    if (lesson?.video_url) types.push("video");
    if (hasQuiz) types.push("quiz");
    types.push("interview");
    types.push("feedback");
    return types[step] || "explanation";
  };

  // ── Voice helpers ──────────────────────────────────────────
  // One recognizer runs the whole interview — handles both interrupts and normal listening
  const speakText = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (interviewEndedRef.current) return; // don't speak if interview already ended
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    isAiSpeakingRef.current = true;
    setIsAiSpeaking(true);
    utter.onstart = () => {
      // Delay mic by 1 s so TTS echo doesn't trigger the interrupt path
      setTimeout(() => {
        if (isAiSpeakingRef.current && !interviewEndedRef.current)
          startListening();
      }, 1000);
    };
    utter.onend = () => {
      isAiSpeakingRef.current = false;
      setIsAiSpeaking(false);
      if (
        !recognitionRef.current &&
        !interviewEndedRef.current &&
        !isSendingRef.current
      )
        startListening();
    };
    utter.onerror = () => {
      isAiSpeakingRef.current = false;
      setIsAiSpeaking(false);
      if (
        !recognitionRef.current &&
        !interviewEndedRef.current &&
        !isSendingRef.current
      )
        startListening();
    };
    window.speechSynthesis.speak(utter);
  };

  const startListening = () => {
    if (interviewEndedRef.current || recognitionRef.current) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e) => {
      // Rebuild full transcript from ALL results so far (avoids interim duplicates)
      let full = "";
      for (let i = 0; i < e.results.length; i++)
        full += e.results[i][0].transcript + " ";
      full = full.trim();
      if (!full) return;

      // Interrupt: user spoke real words while AI was talking
      if (isAiSpeakingRef.current) {
        interruptCountRef.current += 1;
        isAiSpeakingRef.current = false;
        setIsAiSpeaking(false);
        window.speechSynthesis.cancel();
      }

      voiceTranscriptRef.current = full;
      setVoiceTranscript(full);

      // Reset silence timer — only arm when AI is not speaking
      if (sendDelayRef.current) clearTimeout(sendDelayRef.current);
      if (!isSendingRef.current && !isAiSpeakingRef.current) {
        sendDelayRef.current = setTimeout(() => {
          sendDelayRef.current = null;
          stopAndSend();
        }, 500);
      }
    };

    recognition.onend = () => {
      // Guard: only clear ref if this is still the active recognizer
      // (prevents stale onend from nulling a freshly started recognizer)
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setIsListening(false);
      }
      // Auto-restart unless interview is over or a send is in flight
      if (!interviewEndedRef.current && !isSendingRef.current) startListening();
    };

    recognition.onerror = () => {
      // onend fires after onerror and handles restart
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (_) {
      recognitionRef.current = null;
    }
  };

  const stopAndSend = async () => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    if (sendDelayRef.current) {
      clearTimeout(sendDelayRef.current);
      sendDelayRef.current = null;
    }
    // Clear ref FIRST so the stale onend callback won't null the next recognizer
    const activeRec = recognitionRef.current;
    recognitionRef.current = null;
    if (activeRec)
      try {
        activeRec.stop();
      } catch (_) {}
    setIsListening(false);
    const answer = voiceTranscriptRef.current.trim();
    voiceTranscriptRef.current = "";
    setVoiceTranscript("");
    if (!answer) {
      isSendingRef.current = false;
      if (!interviewEndedRef.current) startListening();
      return;
    }
    setInterviewMessages((prev) => {
      const next = [...prev, { role: "user", text: answer }];
      interviewMessagesRef.current = next;
      return next;
    });
    setIsAiThinking(true);
    const newHistory = [
      ...groqHistoryRef.current,
      { role: "user", content: answer },
    ];
    try {
      const res = await fetch("/api/mock_int", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: answer,
          history: groqHistoryRef.current,
          moduleTitle: module?.title || "this topic",
        }),
      });
      const data = await res.json();
      const aiText = data.reply || "Thank you for your answer.";
      groqHistoryRef.current = [
        ...newHistory,
        { role: "assistant", content: aiText },
      ];
      setInterviewMessages((prev) => {
        const next = [...prev, { role: "ai", text: aiText }];
        interviewMessagesRef.current = next;
        return next;
      });
      if (data.isComplete) {
        interviewEndedRef.current = true;
        setInterviewEnded(true);
      } else if (!interviewEndedRef.current) {
        speakText(aiText);
      }
    } catch {
      // On network error, speak a recovery prompt so the mic restarts
      if (!interviewEndedRef.current) {
        const fallback = "I missed that — please repeat your answer.";
        setInterviewMessages((prev) => {
          const next = [...prev, { role: "ai", text: fallback }];
          interviewMessagesRef.current = next;
          return next;
        });
        speakText(fallback);
      }
    } finally {
      setIsAiThinking(false);
      isSendingRef.current = false;
    }
  };

  const resetInterview = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    interruptRecognitionRef.current = null;
    if (typeof window !== "undefined" && window.speechSynthesis)
      window.speechSynthesis.cancel();
    interviewMessagesRef.current = [];
    setInterviewMessages([]);
    setInterviewStarted(false);
    setInterviewEnded(false);
    setIsListening(false);
    setIsAiSpeaking(false);
    setIsAiThinking(false);
    setVoiceTranscript("");
    voiceTranscriptRef.current = "";
    isSendingRef.current = false;
    isAiSpeakingRef.current = false;
    interviewEndedRef.current = false;
    interruptCountRef.current = 0;
    pauseCountRef.current = 0;
    if (sendDelayRef.current) {
      clearTimeout(sendDelayRef.current);
      sendDelayRef.current = null;
    }
    groqHistoryRef.current = [];
  };

  const generateFeedback = () => {
    const totalQuiz = Object.keys(quizAnswers).length;
    const correctCount = Object.values(quizAnswers).filter(
      (a) => a.correct,
    ).length;
    const quizPercent =
      totalQuiz > 0 ? Math.round((correctCount / totalQuiz) * 100) : 0;

    // Read from ref so we always get the latest messages, not a stale closure value
    const userResponses = interviewMessagesRef.current
      .filter((m) => m.role === "user")
      .map((m) => m.text);
    const avgResponseLength =
      userResponses.length > 0
        ? Math.round(
            userResponses.reduce((sum, r) => sum + r.split(" ").length, 0) /
              userResponses.length,
          )
        : 0;

    // Hesitation: count filler words across all user responses
    const fillerPattern =
      /\b(um+|uh+|er+|hmm+|erm+|ah+|like|you know|basically|literally|so so|i mean)\b/gi;
    const allText = userResponses.join(" ");
    const fillerMatches = allText.match(fillerPattern);
    const hesitationCount = fillerMatches ? fillerMatches.length : 0;
    const interrupts = interruptCountRef.current;
    const pauses = pauseCountRef.current;

    // Soft skill scores (1–5)
    const clarityScore =
      avgResponseLength >= 25
        ? 5
        : avgResponseLength >= 18
          ? 4
          : avgResponseLength >= 12
            ? 3
            : avgResponseLength >= 6
              ? 2
              : 1;

    const listeningScore =
      interrupts === 0
        ? 5
        : interrupts === 1
          ? 4
          : interrupts === 2
            ? 3
            : interrupts === 3
              ? 2
              : 1;

    const confidenceScore =
      hesitationCount === 0 && pauses <= 1 && avgResponseLength >= 15
        ? 5
        : hesitationCount <= 2 && pauses <= 3 && avgResponseLength >= 10
          ? 4
          : hesitationCount <= 4 && pauses <= 5
            ? 3
            : hesitationCount <= 7
              ? 2
              : 1;

    const strengths = [];
    const improvements = [];

    if (interrupts === 0)
      strengths.push("Stayed focused and let the interviewer finish speaking");
    else
      improvements.push(
        `Interrupted the interviewer ${interrupts} time${interrupts > 1 ? "s" : ""} — practice active listening`,
      );

    if (hesitationCount === 0)
      strengths.push("Spoke fluently with no noticeable filler words");
    else if (hesitationCount <= 3)
      improvements.push(
        `${hesitationCount} filler word${hesitationCount > 1 ? "s" : ""} detected — try to pause instead of using fillers`,
      );
    else
      improvements.push(
        `${hesitationCount} filler words detected — slow down and breathe before answering`,
      );

    if (quizPercent >= 80)
      strengths.push("Strong grasp of theoretical concepts");
    else if (quizPercent >= 50)
      improvements.push(
        "Review quiz topics to strengthen theoretical knowledge",
      );
    else
      improvements.push(
        "Revisit the explanation and video materials for better concept clarity",
      );

    if (avgResponseLength >= 20)
      strengths.push("Detailed and thoughtful interview responses");
    else if (avgResponseLength >= 10)
      improvements.push("Try to elaborate more in your interview answers");
    else
      improvements.push("Provide more detailed responses during the interview");

    if (userResponses.length >= 4)
      strengths.push("Completed all interview questions");
    if (correctCount === totalQuiz && totalQuiz > 0)
      strengths.push("Perfect quiz score!");
    if (strengths.length === 0)
      strengths.push("Completed the full module flow");
    if (improvements.length === 0)
      improvements.push("Continue practicing to maintain your skills");

    let overallRating, ratingColor;
    const interruptPenalty = interrupts * 10;
    const adjustedQuiz = Math.max(0, quizPercent - interruptPenalty);
    if (adjustedQuiz >= 80 && avgResponseLength >= 15) {
      overallRating = "Excellent";
      ratingColor = "emerald";
    } else if (adjustedQuiz >= 60 && avgResponseLength >= 10) {
      overallRating = "Good";
      ratingColor = "blue";
    } else if (adjustedQuiz >= 40) {
      overallRating = "Satisfactory";
      ratingColor = "amber";
    } else {
      overallRating = "Needs Improvement";
      ratingColor = "rose";
    }

    setFeedback({
      quizScore: {
        correct: correctCount,
        total: totalQuiz,
        percent: quizPercent,
      },
      interviewStats: {
        questionsAnswered: userResponses.length,
        avgWords: avgResponseLength,
      },
      behavioralStats: {
        interruptions: interrupts,
        hesitations: hesitationCount,
        pauses,
      },
      softSkills: [
        { label: "Communicated ideas clearly", score: clarityScore },
        { label: "Listened actively to others", score: listeningScore },
        { label: "Expressed thoughts confidently", score: confidenceScore },
      ],
      strengths,
      improvements,
      overallRating,
      ratingColor,
    });
  };

  const startInterview = async () => {
    setInterviewStarted(true);
    setIsAiThinking(true);
    groqHistoryRef.current = [];
    try {
      const res = await fetch("/api/mock_int", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "start",
          history: [],
          moduleTitle: module?.title || "this topic",
        }),
      });
      const data = await res.json();
      const aiText =
        data.reply ||
        `Let's begin. Tell me about your understanding of ${module?.title || "this topic"}.`;
      groqHistoryRef.current = [
        { role: "user", content: "start" },
        { role: "assistant", content: aiText },
      ];
      interviewMessagesRef.current = [{ role: "ai", text: aiText }];
      setInterviewMessages([{ role: "ai", text: aiText }]);
      speakText(aiText);
    } catch {
      const fallback = `Let's begin. Tell me about your understanding of ${module?.title || "this topic"}.`;
      interviewMessagesRef.current = [{ role: "ai", text: fallback }];
      setInterviewMessages([{ role: "ai", text: fallback }]);
      speakText(fallback);
    } finally {
      setIsAiThinking(false);
    }
  };

  const stepType = getStepType();
  const stepLabels = ["Explanation"];
  if (lesson?.video_url) stepLabels.push("Video");
  if (hasQuiz) stepLabels.push(`Quiz (${quizQuestions.length})`);
  stepLabels.push("Interview");
  stepLabels.push("Feedback");

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading lessons...</p>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No lessons available for this module.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-lg bg-white/8 border border-white/15 text-white text-sm font-medium hover:bg-white/12 transition"
        >
          Back to Modules
        </button>
      </div>
    );
  }

  return (
    <div className="lesson-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">
            Lesson {currentLesson + 1} of {lessons.length}
          </p>
          <h2 className="text-base font-semibold text-white">
            {lesson?.title}
          </h2>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-1.5 rounded-lg bg-white/8 border border-white/15 text-white text-sm font-medium hover:bg-white/12 transition"
        >
          Back to Modules
        </button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-4">
        {stepLabels.map((label, i) => (
          <div
            key={label}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              i === step
                ? "bg-white/10 borde  r-white/20 text-white"
                : i < step
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-white/3 border-white/8 text-gray-500"
            }`}
          >
            {i < step ? (
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : null}
            {label}
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="lesson-content flex-1 min-h-0">
        {/* Explanation slide */}
        {stepType === "explanation" && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <h3 className="text-base font-medium text-white mb-4">
              Explanation
            </h3>
            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {lesson?.explanation || "No explanation available."}
            </div>
          </div>
        )}

        {/* Video slide */}
        {stepType === "video" && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-white mb-3">
              Video Lesson
            </h3>
            {lesson?.video_url ? (
              <div className="lesson-video-wrapper">
                <iframe
                  src={getEmbedUrl(lesson.video_url)}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No video available.</p>
            )}
          </div>
        )}

        {/* Quiz slide — cycles through 5 random questions */}
        {stepType === "quiz" && activeQuiz && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-white">Quiz</h3>
              <span className="text-xs text-gray-500">
                Question {currentQuiz + 1} of {quizQuestions.length}
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-6">{activeQuiz.question}</p>
            <div className="grid grid-cols-2 gap-3">
              {(Array.isArray(activeQuiz.options)
                ? activeQuiz.options
                : []
              ).map((option, i) => {
                const isSelected = selectedAnswer === option;
                const isCorrect =
                  answered && option === activeQuiz.correct_answer;
                const isWrong =
                  answered &&
                  isSelected &&
                  option !== activeQuiz.correct_answer;

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectAnswer(option)}
                    className={`quiz-option w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      isCorrect
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 quiz-correct"
                        : isWrong
                          ? "bg-rose-500/15 border-rose-500/40 text-rose-300 quiz-wrong"
                          : isSelected
                            ? "bg-white/10 border-white/20 text-white quiz-selected"
                            : "bg-white/3 border-white/8 text-gray-300"
                    }`}
                  >
                    <span className="font-medium text-gray-500 mr-2">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
            {answered && (
              <div
                className={`mt-4 text-sm font-medium ${
                  selectedAnswer === activeQuiz.correct_answer
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {selectedAnswer === activeQuiz.correct_answer
                  ? "Correct! Well done."
                  : `Incorrect. The correct answer is: ${activeQuiz.correct_answer}`}
              </div>
            )}
          </div>
        )}

        {/* Interview slide — AI Voice */}
        {stepType === "interview" && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex flex-col items-center justify-center min-h-80">
            {!interviewStarted ? (
              /* Start screen */
              <div className="flex flex-col items-center gap-5">
                {/* Pulsing circle */}
                <div className="relative flex items-center justify-center">
                  <div
                    className="absolute w-32 h-32 rounded-full bg-emerald-500/10 animate-ping"
                    style={{ animationDuration: "2s" }}
                  />
                  <div className="w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-400 text-center max-w-xs">
                  AI voice interview on{" "}
                  <span className="text-white font-medium">
                    {module?.title}
                  </span>
                  . Just speak naturally.
                </p>
                <button
                  onClick={startInterview}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition"
                >
                  Begin
                </button>
              </div>
            ) : interviewEnded ? (
              /* Done */
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-xs text-emerald-400/70">
                  Interview complete — click Next
                </p>
                <button
                  onClick={resetInterview}
                  className="mt-1 px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  Reattempt Interview
                </button>
              </div>
            ) : (
              /* Active interview — central circle only */
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="relative flex items-center justify-center w-full">
                  {/* Outer ring — active when AI speaks or user speaks */}
                  <div
                    className={`absolute rounded-full transition-all duration-500 ${
                      isAiSpeaking
                        ? "w-44 h-44 bg-emerald-500/10 animate-ping"
                        : isListening
                          ? "w-44 h-44 bg-rose-500/10 animate-ping"
                          : "w-36 h-36 bg-white/3"
                    }`}
                    style={{ animationDuration: "1s" }}
                  />
                  {/* Middle ring */}
                  <div
                    className={`absolute rounded-full transition-all duration-300 ${
                      isAiSpeaking
                        ? "w-36 h-36 bg-emerald-500/15 border border-emerald-500/20"
                        : isListening
                          ? "w-36 h-36 bg-rose-500/15 border border-rose-500/20"
                          : "w-28 h-28 bg-white/5 border border-white/10"
                    }`}
                  />
                  {/* Inner circle */}
                  <div
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 border ${
                      isAiSpeaking
                        ? "bg-emerald-500/20 border-emerald-500/40"
                        : isListening
                          ? "bg-rose-500/20 border-rose-500/40"
                          : isAiThinking
                            ? "bg-white/8 border-white/15"
                            : "bg-white/5 border-white/10"
                    }`}
                  >
                    {isAiThinking ? (
                      <div className="flex gap-1 items-end">
                        {[0, 150, 300].map((d) => (
                          <span
                            key={d}
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${d}ms` }}
                          />
                        ))}
                      </div>
                    ) : isAiSpeaking ? (
                      <div className="flex gap-0.5 items-end h-5">
                        {[50, 100, 70, 90, 55, 80, 60].map((h, i) => (
                          <span
                            key={i}
                            className="w-0.5 bg-emerald-400 rounded-full animate-pulse"
                            style={{
                              height: `${h}%`,
                              animationDelay: `${i * 60}ms`,
                            }}
                          />
                        ))}
                      </div>
                    ) : isListening ? (
                      <svg
                        className="w-7 h-7 text-rose-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-7 h-7 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                {/* End interview button */}
                <button
                  onClick={() => {
                    if (sendDelayRef.current) {
                      clearTimeout(sendDelayRef.current);
                      sendDelayRef.current = null;
                    }
                    // Stop TTS — call twice because Chrome sometimes ignores the first cancel()
                    window.speechSynthesis.pause();
                    window.speechSynthesis.cancel();
                    setTimeout(() => window.speechSynthesis.cancel(), 50);
                    // Stop mic
                    const activeRec = recognitionRef.current;
                    recognitionRef.current = null;
                    if (activeRec)
                      try {
                        activeRec.stop();
                      } catch (_) {}
                    // Clear all timers and flags
                    if (sendDelayRef.current) {
                      clearTimeout(sendDelayRef.current);
                      sendDelayRef.current = null;
                    }
                    interruptRecognitionRef.current = null;
                    isAiSpeakingRef.current = false;
                    isSendingRef.current = false;
                    interviewEndedRef.current = true;
                    setIsAiSpeaking(false);
                    setIsListening(false);
                    setInterviewEnded(true);
                    generateFeedback();
                    setStep((prev) => prev + 1);
                  }}
                  className="relative z-10 mt-6 px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition-all"
                >
                  End Interview
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback slide */}
        {stepType === "feedback" && feedback && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-5">
            {/* Overall rating */}
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Overall Performance
              </p>
              <div
                className={`inline-block px-5 py-2 rounded-full text-sm font-semibold border ${
                  feedback.ratingColor === "emerald"
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                    : feedback.ratingColor === "blue"
                      ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                      : feedback.ratingColor === "amber"
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                        : "bg-rose-500/15 border-rose-500/40 text-rose-400"
                }`}
              >
                {feedback.overallRating}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">
                  {feedback.quizScore.percent}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Quiz Score ({feedback.quizScore.correct}/
                  {feedback.quizScore.total})
                </p>
              </div>
              <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">
                  {feedback.interviewStats.questionsAnswered}/4
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Interview Questions (avg {feedback.interviewStats.avgWords}{" "}
                  words)
                </p>
              </div>
            </div>

            {/* Behavioral signals */}
            {feedback.behavioralStats && (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
                  <p
                    className={`text-2xl font-bold ${
                      feedback.behavioralStats.interruptions === 0
                        ? "text-emerald-400"
                        : feedback.behavioralStats.interruptions <= 2
                          ? "text-amber-400"
                          : "text-rose-400"
                    }`}
                  >
                    {feedback.behavioralStats.interruptions}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Interruptions</p>
                </div>
                <div className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
                  <p
                    className={`text-2xl font-bold ${
                      feedback.behavioralStats.hesitations === 0
                        ? "text-emerald-400"
                        : feedback.behavioralStats.hesitations <= 3
                          ? "text-amber-400"
                          : "text-rose-400"
                    }`}
                  >
                    {feedback.behavioralStats.hesitations}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Fillers</p>
                </div>
                <div className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
                  <p
                    className={`text-2xl font-bold ${
                      (feedback.behavioralStats.pauses ?? 0) <= 1
                        ? "text-emerald-400"
                        : (feedback.behavioralStats.pauses ?? 0) <= 4
                          ? "text-amber-400"
                          : "text-rose-400"
                    }`}
                  >
                    {feedback.behavioralStats.pauses ?? 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Pauses</p>
                </div>
              </div>
            )}

            {/* Soft skill ratings */}
            {feedback.softSkills && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
                  Soft Skills
                </h4>
                <div className="space-y-3">
                  {feedback.softSkills.map(({ label, score }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-300">{label}</span>
                        <span className="text-xs text-gray-500">{score}/5</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <div
                            key={n}
                            className={`flex-1 h-1.5 rounded-full ${
                              n <= score
                                ? score >= 4
                                  ? "bg-emerald-500"
                                  : score >= 3
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            <div>
              <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Strengths
              </h4>
              <ul className="space-y-1.5">
                {feedback.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-emerald-500 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas to improve */}
            <div>
              <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Areas to Improve
              </h4>
              <ul className="space-y-1.5">
                {feedback.improvements.map((s, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-amber-500 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/8">
        <button
          onClick={handlePrev}
          disabled={currentLesson === 0 && step === 0}
          className={`px-5 py-2 rounded-lg border text-sm font-medium transition-all ${
            currentLesson === 0 && step === 0
              ? "bg-white/3 border-white/5 text-gray-600 cursor-not-allowed"
              : "bg-white/8 border-white/15 text-white hover:bg-white/12"
          }`}
        >
          Previous
        </button>

        <span className="text-xs text-gray-500">
          {stepType === "quiz"
            ? `Quiz ${currentQuiz + 1}/${quizQuestions.length}`
            : stepType === "interview"
              ? `Interview`
              : stepType === "feedback"
                ? `Feedback`
                : `${step + 1} / ${totalSteps}`}
        </span>

        <button
          onClick={handleNext}
          disabled={
            (stepType === "quiz" && !answered) ||
            (stepType === "interview" && !interviewEnded)
          }
          className={`px-5 py-2 rounded-lg border text-sm font-medium transition-all ${
            (stepType === "quiz" && !answered) ||
            (stepType === "interview" && !interviewEnded)
              ? "bg-white/3 border-white/5 text-gray-600 cursor-not-allowed"
              : isLastLesson && step === totalSteps - 1
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
                : "bg-white/8 border-white/15 text-white hover:bg-white/12"
          }`}
        >
          {isLastLesson &&
          step === totalSteps - 1 &&
          (stepType !== "quiz" || isLastQuizQuestion)
            ? "Complete Module"
            : stepType === "quiz" && !isLastQuizQuestion
              ? "Next Question"
              : "Next"}
        </button>
      </div>
    </div>
  );
}
