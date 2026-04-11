export default function AboutPage() {
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
        About InterBrew
      </h1>
      <p style={{ fontSize: "1rem", marginBottom: "0.7rem" }}>
        Welcome to InterBrew, your dedicated platform for honing interview
        skills and landing your dream job. Our mission is to provide realistic,
        AI-powered interview simulations to help you build confidence and master
        your responses. We believe that practice is the key to success, and our
        goal is to make high-quality interview preparation accessible to
        everyone.
      </p>
      <p style={{ fontSize: "1rem", marginBottom: "0.7rem" }}>
        Whether you're a recent graduate just starting your career or a seasoned
        professional looking to make a change, InterBrew offers a wide range of
        scenarios and questions tailored to various industries and roles. Our
        adaptive AI technology adjusts to your performance, providing a
        challenging yet supportive environment for growth.
      </p>

      <h2
        style={{
          color: "rgba(105, 217, 172, 0.6)",
          fontFamily: "Source Serif 4, serif",
          fontSize: "1.15rem",
          fontWeight: 600,
          marginTop: "1.5rem",
          marginBottom: "0.7rem",
          letterSpacing: "-0.2px",
        }}
      >
        Our Vision
      </h2>
      <p style={{ fontSize: "1rem", marginBottom: "0.7rem" }}>
        We envision a world where every candidate can walk into an interview
        with the confidence and skills to succeed. We're committed to breaking
        down the barriers to career advancement by providing cutting-edge tools
        that are both effective and easy to use.
      </p>

      <h2
        style={{
          color: "rgba(105, 217, 172, 0.6)",
          fontFamily: "Source Serif 4, serif",
          fontSize: "1.15rem",
          fontWeight: 600,
          marginTop: "1.5rem",
          marginBottom: "0.7rem",
          letterSpacing: "-0.2px",
        }}
      >
        Our Features
      </h2>
      <ul
        style={{
          listStyle: "disc inside",
          fontSize: "1rem",
          marginBottom: 0,
          paddingLeft: 0,
        }}
      >
        <li>Realistic AI-driven interview simulations.</li>
        <li>
          A vast library of questions across different domains including
          software engineering, marketing, finance, and more.
        </li>
        <li>
          Personalized feedback and detailed performance tracking to identify
          areas for improvement.
        </li>
        <li>
          Scenarios for behavioral, technical, and situational interviews.
        </li>
        <li>
          Speech analysis to help you improve your pacing, tone, and use of
          filler words.
        </li>
      </ul>
    </div>
  );
}
