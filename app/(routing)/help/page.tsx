export default function HelpPage() {
  return (
    <div
      style={{
        background: "#141414",
        minHeight: "calc(100vh - 3rem)",
        fontFamily: "Source Serif 4, serif",
        color: "#ededed",
        fontSize: "0.95rem",
        padding: "1.5rem 2rem",
        margin: "1.5rem 0.5rem 1.5rem 0.5rem",
        borderRadius: "1.2rem",
        width: "auto",
        boxSizing: "border-box",
        textAlign: "left",
        lineHeight: 1.5,
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
        Help Center
      </h1>
      <p style={{ fontSize: "1rem", marginBottom: "0.7rem" }}>
        Have questions? We're here to help. Check out our frequently asked
        questions below. If you don't find the answer you're looking for, feel
        free to reach out to our support team via the Feedback page.
      </p>

      <div style={{ marginTop: "1.2rem" }}>
        <div style={{ marginBottom: "1.2rem" }}>
          <h2
            style={{
              color: "rgba(105, 217, 172, 0.6)",
              fontFamily: "Source Serif 4, serif",
              fontSize: "1.15rem",
              fontWeight: 600,
              marginBottom: "0.7rem",
              letterSpacing: "-0.2px",
            }}
          >
            How do I start a practice session?
          </h2>
          <p style={{ fontSize: "1rem", marginBottom: 0 }}>
            Navigate to the "Scenario Practice" page from the side panel. From
            there, you can select a scenario that matches your career goals.
            Once you've chosen a scenario, you can begin practicing with our AI
            interviewer. The AI will ask you questions and you can respond using
            your microphone.
          </p>
        </div>
        <div style={{ marginBottom: "1.2rem" }}>
          <h2
            style={{
              color: "rgba(105, 217, 172, 0.6)",
              fontFamily: "Source Serif 4, serif",
              fontSize: "1.15rem",
              fontWeight: 600,
              marginBottom: "0.7rem",
              letterSpacing: "-0.2px",
            }}
          >
            Can I track my progress?
          </h2>
          <p style={{ fontSize: "1rem", marginBottom: 0 }}>
            Yes! Your dashboard provides a comprehensive overview of your
            performance, including your current streak, completed modules, and
            overall readiness score. We analyze your responses to give you
            insights into your strengths and weaknesses.
          </p>
        </div>
        <div style={{ marginBottom: "1.2rem" }}>
          <h2
            style={{
              color: "rgba(105, 217, 172, 0.6)",
              fontFamily: "Source Serif 4, serif",
              fontSize: "1.15rem",
              fontWeight: 600,
              marginBottom: "0.7rem",
              letterSpacing: "-0.2px",
            }}
          >
            What kind of feedback will I receive?
          </h2>
          <p style={{ fontSize: "1rem", marginBottom: 0 }}>
            After each session, InterBrew provides detailed feedback on your
            performance. This includes an analysis of your speech patterns, such
            as pacing and the use of filler words, as well as the content of
            your answers. Our goal is to give you actionable advice to help you
            improve.
          </p>
        </div>
        <div style={{ marginBottom: "1.2rem" }}>
          <h2
            style={{
              color: "rgba(105, 217, 172, 0.6)",
              fontFamily: "Source Serif 4, serif",
              fontSize: "1.15rem",
              fontWeight: 600,
              marginBottom: "0.7rem",
              letterSpacing: "-0.2px",
            }}
          >
            Is InterBrew free to use?
          </h2>
          <p style={{ fontSize: "1rem", marginBottom: 0 }}>
            Yes! InterBrew is free to use. We believe that everyone should have
            access to high-quality interview preparation tools, regardless of
            their financial situation. We are committed to providing a valuable
            resource for job seekers at no cost.
          </p>
        </div>
      </div>
    </div>
  );
}
