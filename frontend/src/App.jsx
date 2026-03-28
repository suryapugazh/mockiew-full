"use client";
import './App.css'

import { useState } from "react";
import { Toaster } from "react-hot-toast";
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

  // Shared error handler — toasts are fired inside ProcessingPage,
  // but stage reset always comes back here.
  const handleError = () => setStage("upload");

  if (stage === "upload") {
    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: "#FFFFFF",
              color: "#000000",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
              padding: "12px 16px",
              fontSize: "13px",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              maxWidth: "380px",
            },
            error: {
              iconTheme: {
                primary: "#000000",
                secondary: "#FFFFFF",
              },
            },
            success: {
              iconTheme: {
                primary: "#000000",
                secondary: "#FFFFFF",
              },
            },
          }}
        />
        <ResumeUploadPage
          onUploadSuccess={(data) => {
            setResumeData(data);
            setStage("preparing");
          }}
        />
      </>
    );
  }

  if (stage === "preparing") {
    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: "#FFFFFF",
              color: "#000000",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
              padding: "12px 16px",
              fontSize: "13px",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              maxWidth: "380px",
            },
            error: { iconTheme: { primary: "#000000", secondary: "#FFFFFF" } },
          }}
        />
        <ProcessingPage
          mode="pre"
          resumeData={resumeData}
          onSessionReady={({ sessionToken, interviewData }) => {
            setSessionToken(sessionToken);
            setInterviewData(interviewData);
            setStage("interview");
          }}
          onError={handleError}
        />
      </>
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
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: "#FFFFFF",
              color: "#000000",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
              padding: "12px 16px",
              fontSize: "13px",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              maxWidth: "380px",
            },
            error: { iconTheme: { primary: "#000000", secondary: "#FFFFFF" } },
          }}
        />
        <ProcessingPage
          mode="post"
          evaluationPayload={evaluationPayload}
          onEvaluationReady={(result) => {
            setEvaluationResult(result);
            setStage("result");
          }}
          onError={handleError}
        />
      </>
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