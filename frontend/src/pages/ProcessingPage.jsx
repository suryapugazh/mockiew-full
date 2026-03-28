import { useEffect, useRef } from "react";
import { FASTAPI_URL } from "../config/apiUrls";

export default function ProcessingPage({ mode, resumeData, onSessionReady, onEvaluationReady, evaluationPayload }) {

  const lastProcessedMode = useRef(null);

  useEffect(() => {

    if (lastProcessedMode.current === mode) return;
    lastProcessedMode.current = mode;
    
    async function processResume() {
      if (mode === "pre") {

    const formData = new FormData();
    formData.append("resume", resumeData);

    const parseRes = await fetch(`${FASTAPI_URL}/parse`, {
      method: "POST",
      body: formData
    });
    
    const data = await parseRes.json();

    const res = await fetch(`${FASTAPI_URL}/create-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: data.name,
        questions: data.questions
      })
    });

    const { session_token } = await res.json();

    onSessionReady({
      sessionToken: session_token,
      interviewData: data
    });
    
  }

  if (mode === "post") {

  const res = await fetch(`${FASTAPI_URL}/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(evaluationPayload)
  });

  const result = await res.json();
  onEvaluationReady(result);
}
  }

    processResume();
  }, [mode, resumeData, onSessionReady, onEvaluationReady, evaluationPayload]);

  return (
    <div className="fullscreen-center">

      {mode === "pre" ? (
        <>
          <h2>Analyzing Resume...</h2>
          <p>Preparing your AI interviewer</p>
        </>
      ) : (
        <>
          <h2>Evaluating Your Performance...</h2>
          <p>Analyzing technical, communication & behavioral skills</p>
        </>
      )}

      <div className="loader"></div>
    </div>
  );
}