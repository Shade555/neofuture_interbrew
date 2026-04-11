"use client";
import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase
      .from("feedback")
      .insert([{ name, email, feedback }]);
    if (error) {
      alert("Failed to submit feedback. Please try again.");
      return;
    }
    setName("");
    setEmail("");
    setFeedback("");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1000);
  };

  return (
    <>
      {showToast && (
        <div
          style={{
            position: "fixed",
            top: "2rem",
            right: "2rem",
            zIndex: 1000,
            background: "#232323",
            color: "#ededed",
            borderRadius: "0.8rem",
            boxShadow: "0 2px 16px 0 rgba(0,0,0,0.18)",
            padding: "1.2rem 2.2rem 1.2rem 1.5rem",
            fontFamily: "Source Serif 4, serif",
            fontSize: "1.1rem",
            fontWeight: 500,
            minWidth: "260px",
            maxWidth: "340px",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "0.3rem",
            border: "1px solid rgba(105, 217, 172, 0.6)",
          }}
        >
          <span
            style={{
              color: "rgba(105, 217, 172, 0.8)",
              fontWeight: 700,
              fontSize: "1.15rem",
            }}
          >
            Thank You!
          </span>
          <span>
            Your feedback has been submitted. We appreciate you taking the time
            to help us improve.
          </span>
        </div>
      )}
      <div
        style={{
          background: "rgba(20, 20, 20, 0.7)",
          backdropFilter: "blur(12px) saturate(120%)",
          WebkitBackdropFilter: "blur(12px) saturate(120%)",
          minHeight: "0",
          height: "auto",
          fontFamily: "Source Serif 4, serif",
          color: "#ededed",
          fontSize: "0.95rem",
          padding: "1rem 2vw",
          margin: "2.5rem auto 2.5rem auto",
          borderRadius: "1.2rem",
          width: "100%",
          maxWidth: "480px",
          boxSizing: "border-box",
          textAlign: "left",
          lineHeight: 1.5,
          transition: "max-width 0.2s, padding 0.2s",
        }}
      >
        <h1
          style={{
            color: "rgba(105, 217, 172, 0.6)",
            fontFamily: "Source Serif 4, serif",
            fontSize: "1.6rem",
            fontWeight: 700,
            marginBottom: "1.2rem",
            letterSpacing: "-0.5px",
          }}
        >
          Submit Feedback
        </h1>
        <form onSubmit={handleSubmit} style={{ marginTop: "1.2rem" }}>
          <div style={{ marginBottom: "1.2rem" }}>
            <label
              htmlFor="name"
              style={{
                display: "block",
                fontSize: "0.95rem",
                fontWeight: 500,
                color: "#bdbdbd",
                marginBottom: "0.4rem",
              }}
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#ededed",
                fontSize: "1rem",
                outline: "none",
                marginBottom: 0,
              }}
            />
          </div>
          <div style={{ marginBottom: "1.2rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "0.95rem",
                fontWeight: 500,
                color: "#bdbdbd",
                marginBottom: "0.4rem",
              }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#ededed",
                fontSize: "1rem",
                outline: "none",
                marginBottom: 0,
              }}
            />
          </div>
          <div style={{ marginBottom: "1.2rem" }}>
            <label
              htmlFor="feedback"
              style={{
                display: "block",
                fontSize: "0.95rem",
                fontWeight: 500,
                color: "#bdbdbd",
                marginBottom: "0.4rem",
              }}
            >
              Feedback
            </label>
            <textarea
              id="feedback"
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
              style={{
                width: "100%",
                minHeight: "32px",
                maxHeight: "60px",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#ededed",
                fontSize: "1rem",
                outline: "none",
                resize: "vertical",
                marginBottom: 0,
              }}
            ></textarea>
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.9rem 0",
              borderRadius: "0.5rem",
              background: "rgba(105, 217, 172, 0.6)",
              color: "#141414",
              fontWeight: 600,
              fontSize: "1rem",
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "rgba(105, 217, 172, 0.8)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "rgba(105, 217, 172, 0.6)")
            }
          >
            Submit Feedback
          </button>
        </form>
      </div>
    </>
  );
}
