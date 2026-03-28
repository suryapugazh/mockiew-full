"use client";
import './App.css'

import { useState } from "react";
import ResumeUploadPage from "./pages/ResumeUploadPage";
import ProcessingPage from "./pages/ProcessingPage";
import InterviewPage from "./pages/InterviewPage";
import ResultPage from "./pages/ResultPage";

export default function App() {
  const [stage, setStage] = useState("upload");
  const [resumeData, setResumeData] = useState(null);
  const [sessionToken, setSessionToken] = useState("");
  const [interviewData, setInterviewData] = useState(null);
  const [evaluationPayload, setEvaluationPayload] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);

  if (stage === "upload") {
    return (
      <ResumeUploadPage
        onUploadSuccess={(data) => {
          setResumeData(data);
          setStage("preparing");
        }}
      />
    );
  }

  if (stage === "preparing") {
    return (
      <ProcessingPage
        mode="pre"
        resumeData={resumeData}
        onSessionReady={({sessionToken, interviewData}) => {
          setSessionToken(sessionToken);
          setInterviewData(interviewData);
          setStage("interview");
        }}
      />
    );
  }

  if (stage === "interview") {
  return (
    <InterviewPage
      sessionToken={sessionToken}
      interviewData={interviewData}
      onExit={() => setStage("upload")}
      onEvaluationStart={(payload) => {
        setEvaluationPayload(payload);
        setStage("evaluating");
      }}
    />
  );
}

  if (stage === "evaluating") {
  return (
    <ProcessingPage
      mode="post"
      evaluationPayload={evaluationPayload}
      onEvaluationReady={(result) => {
        setEvaluationResult(result);
        setStage("result");
      }}
    />
  );
}

  if (stage === "result") {
    return (
      <ResultPage
        evaluationResult={evaluationResult}
        onRestart={() => {
          setStage("upload");
          setResumeData(null);
          setSessionToken("");
          setInterviewData(null);
          setEvaluationResult(null);
        }}
      />
    );
  }

  return null;
}