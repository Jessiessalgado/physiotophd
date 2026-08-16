import { useState } from "react";
import { submitContactMessage } from "@/lib/cms.functions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 15,
  fontFamily: "inherit",
  background: "white",
  color: "#0f172a",
  boxSizing: "border-box",
};

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    try {
      await submitContactMessage({ data: { name, email, message } });
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      setStatus("idle");
      setError(err?.message ?? "Não foi possível enviar. Tente novamente.");
    }
  }

  return (
    <section
      style={{
        marginTop: 40,
        background: "white",
        borderRadius: 16,
        padding: 28,
        boxShadow: "0 6px 24px rgba(15,23,42,0.06)",
        border: "1px solid #e2e8f0",
      }}
    >
      <h2 style={{ fontSize: 24, color: "#0f172a", marginTop: 0, marginBottom: 8 }}>Vamos conversar!</h2>
      <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.6, marginTop: 0 }}>
        Se você deseja discutir pesquisa, neuroreabilitação, tecnologia aplicada à fisioterapia, oportunidades
        acadêmicas ou possíveis colaborações, entre em contato.
      </p>

      {status === "sent" ? (
        <div
          style={{
            marginTop: 16,
            padding: "14px 16px",
            borderRadius: 10,
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            fontSize: 15,
          }}
        >
          Mensagem enviada com sucesso. Obrigado pelo contato — responderei o mais breve possível!
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, marginTop: 18 }}>
          <div>
            <label htmlFor="cf-name" style={{ display: "block", fontSize: 13, color: "#334155", marginBottom: 6 }}>
              Nome
            </label>
            <input
              id="cf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="cf-email" style={{ display: "block", fontSize: 13, color: "#334155", marginBottom: 6 }}>
              E-mail
            </label>
            <input
              id="cf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={200}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="cf-message" style={{ display: "block", fontSize: 13, color: "#334155", marginBottom: 6 }}>
              Mensagem
            </label>
            <textarea
              id="cf-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={5}
              maxLength={5000}
              rows={6}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          {error && <p style={{ color: "#b91c1c", fontSize: 14, margin: 0 }}>{error}</p>}
          <div>
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                padding: "12px 26px",
                borderRadius: 999,
                border: "none",
                background: "#1e3a8a",
                color: "white",
                fontSize: 15,
                fontWeight: 600,
                cursor: status === "sending" ? "default" : "pointer",
                opacity: status === "sending" ? 0.7 : 1,
              }}
            >
              {status === "sending" ? "Enviando…" : "Enviar mensagem"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
