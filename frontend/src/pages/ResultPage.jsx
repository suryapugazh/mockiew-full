export default function ResultPage({ evaluationResult, onRestart }) {
  return (
    <div style={{ padding: 40 }}>
      <h2>Interview Evaluation</h2>

      <h3>Scores</h3>
      <p>Technical: {evaluationResult.technical_score}</p>
      <p>Communication: {evaluationResult.communication_score}</p>
      <p>Behavioral: {evaluationResult.behavioral_score}</p>
      <p>Overall: {evaluationResult.overall_score}</p>

      <h3>Strengths</h3>
      <ul>
        {evaluationResult.strengths.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <h3>Weaknesses</h3>
      <ul>
        {evaluationResult.weaknesses.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>

      <h3>Improvement Suggestions</h3>
      <ul>
        {evaluationResult.improvement_suggestions.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <h3>Detailed Feedback</h3>
      <p>{evaluationResult.detailed_feedback}</p>

      <button onClick={onRestart} style={{ marginTop: 30 }}>
        Start New Interview
      </button>
    </div>
  );
}