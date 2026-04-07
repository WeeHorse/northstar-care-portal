import { useState } from "react";
import { api } from "../app/api";
import { useAuth } from "../app/auth";

export function AssistantPage() {
  const { token } = useAuth();
  const [question, setQuestion] = useState("How do we escalate incident triage?");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [mismatches, setMismatches] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onAsk(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.askAssistant(token, question);
      setAnswer(result.answer || "");
      setSources(result.sources || []);
      setMismatches(result.permissionMismatches || []);

      if (result.answerId) {
        const sourceResult = await api.getAssistantSources(token, result.answerId);
        if (Array.isArray(sourceResult.sources)) {
          setSources(sourceResult.sources);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-stack">
      <section className="card">
        <h2>AI Assistant</h2>
        <form className="inline-form" onSubmit={onAsk}>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about policy, procedures, or operations"
          />
          <button type="submit" disabled={loading}>{loading ? "Asking..." : "Ask"}</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
        {answer ? <p>{answer}</p> : null}
      </section>

      <section className="card">
        <h3>Sources</h3>
        <ul>
          {sources.map((source) => (
            <li key={`${source.sourceType}-${source.id}`}>
              {source.sourceType} #{source.id}: {source.title} ({source.classification || "n/a"})
            </li>
          ))}
          {sources.length === 0 ? <li>No sources</li> : null}
        </ul>
      </section>

      <section className="card">
        <h3>Permission Mismatch Flags</h3>
        <ul>
          {mismatches.map((source) => (
            <li key={`mismatch-${source.sourceType}-${source.id}`}>
              {source.sourceType} #{source.id}: {source.title}
            </li>
          ))}
          {mismatches.length === 0 ? <li>No mismatch flags</li> : null}
        </ul>
      </section>
    </div>
  );
}
