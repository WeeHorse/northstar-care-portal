import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { api } from "../app/api";
import { useAuth } from "../app/auth";

export function AssistantPage() {
  const { token } = useAuth();
  const [question, setQuestion] = useState("What should I do if I miss a dose of my medicine?");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [mode, setMode] = useState("safe");
  const [lastSecurity, setLastSecurity] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    api.getAssistantMode(token)
      .then((result) => {
        if (active) {
          setMode(result.mode || "safe");
        }
      })
      .catch(() => {
        if (active) {
          setMode("safe");
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function onAsk(event) {
    event.preventDefault();
    const nextQuestion = question.trim();
    if (!nextQuestion) {
      return;
    }

    setError("");
    setLoading(true);
    try {
      const result = await api.askAssistant(token, { question: nextQuestion, conversationId });
      setConversationId(result.conversationId || null);
      setMode(result.mode || "safe");
      setLastSecurity({
        ...(result.security || {}),
        mode: result.mode || "safe",
        permissionMismatches: result.permissionMismatches || []
      });
      setMessages((prev) => ([
        ...prev,
        { id: `user-${Date.now()}`, role: "user", content: nextQuestion },
        {
          id: result.answerId,
          role: "assistant",
          content: result.answer || "",
          sources: result.sources || [],
          permissionMismatches: result.permissionMismatches || [],
          blocked: Boolean(result.blocked),
          suspicious: Boolean(result.security?.suspicious),
          suspiciousPatterns: result.security?.suspiciousPatterns || []
        }
      ]));
      setQuestion("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-stack">
      <section className="card">
        <div className="assistant-header">
          <div>
            <h2>Care Assistant</h2>
            <p>A digital treatment and medication guidance assistant for educational use. It does not replace professional medical judgment.</p>
          </div>
          <div className={`assistant-mode-badge ${mode === "unsafe" ? "danger" : "safe"}`}>
            {mode === "unsafe" ? "UNSAFE LAB MODE" : "SAFE MODE"}
          </div>
        </div>
        {mode === "unsafe" ? <p className="assistant-warning">Unsafe lab mode may expose internal guidance for demonstration purposes.</p> : null}
        <form className="inline-form" onSubmit={onAsk}>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about medication routines, missed doses, self-care, or warning signs"
          />
          <button type="submit" disabled={loading}>{loading ? "Sending..." : "Send"}</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="card">
        <h3>Conversation</h3>
        <div className="assistant-thread">
          {messages.length === 0 ? <p>No messages yet.</p> : null}
          {messages.map((message) => (
            <article key={message.id} className={`assistant-message assistant-message-${message.role}`}>
              <div className="assistant-message-meta">{message.role === "user" ? "You" : "Assistant"}</div>
              {message.role === "assistant" ? (
                <div className="assistant-message-body assistant-markdown">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="assistant-message-body">{message.content}</p>
              )}
              {message.role === "assistant" && message.suspicious ? (
                <p className="assistant-warning">Suspicious prompt pattern detected: {message.suspiciousPatterns.join(", ")}</p>
              ) : null}
              {message.role === "assistant" && message.blocked ? (
                <p className="assistant-warning">Response was blocked by SAFE mode.</p>
              ) : null}
              {message.role === "assistant" && Array.isArray(message.sources) && message.sources.length > 0 ? (
                <div>
                  <strong>Sources used</strong>
                  <ul>
                    {message.sources.map((source) => (
                      <li key={`${message.id}-${source.sourceType}-${source.id}`}>
                        {source.title} ({source.contentClass})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Security Details</h3>
        <details open={Boolean(lastSecurity?.suspicious || lastSecurity?.blocked || (lastSecurity?.permissionMismatches || []).length)}>
          <summary>Latest assistant diagnostics</summary>
          <ul>
            <li>Mode: {mode}</li>
            <li>Suspicious prompt detected: {lastSecurity?.suspicious ? "yes" : "no"}</li>
            <li>Blocked response: {lastSecurity?.blocked ? "yes" : "no"}</li>
            <li>Returned sources: {lastSecurity?.sourceCount || 0}</li>
            <li>Returned internal sources: {lastSecurity?.internalSourceCount || 0}</li>
            <li>Permission mismatches: {(lastSecurity?.permissionMismatches || []).length}</li>
          </ul>
          {(lastSecurity?.suspiciousPatterns || []).length > 0 ? (
            <p>Suspicious patterns: {lastSecurity.suspiciousPatterns.join(", ")}</p>
          ) : null}
          {(lastSecurity?.permissionMismatches || []).length > 0 ? (
            <ul>
              {lastSecurity.permissionMismatches.map((source) => (
                <li key={`mismatch-${source.sourceType}-${source.id}`}>{source.title}</li>
              ))}
            </ul>
          ) : null}
        </details>
      </section>
    </div>
  );
}
