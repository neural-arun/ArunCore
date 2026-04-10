"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SESSION_KEY = "aruncore_session_id";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return uuidv4();
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://neural-arun-aruncore.hf.space";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm **ArunCore**, the AI digital twin of Arun Yadav. Ask me anything about his projects, skills, or background — I'm here to give you the real picture. 🚀",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = useRef<string>("");

  useEffect(() => {
    sessionId.current = getOrCreateSessionId();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId.current,
          message: userMessage,
        }),
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having a moment of connectivity issues. Please try again shortly!",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render markdown-like bold text
  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--bg-primary)" }}>
      
      {/* Header */}
      <header style={{
        padding: "16px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexShrink: 0,
      }}>
        {/* Logo / Avatar */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 700,
          color: "white",
          boxShadow: "0 0 16px var(--accent-glow)",
        }}>A</div>

        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
            ArunCore
          </div>
          <div style={{ fontSize: 12, color: "#6ee7b7", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6ee7b7", display: "inline-block" }}></span>
            Online — AI Digital Twin of Arun Yadav
          </div>
        </div>

        {/* Social Links */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          {[
            { label: "LinkedIn", href: "https://www.linkedin.com/in/neuralarun/" },
            { label: "Twitter", href: "https://x.com/Neural_Arun" },
            { label: "GitHub", href: "https://github.com/neural-arun" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                textDecoration: "none",
                padding: "4px 10px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = "var(--text-primary)";
                (e.target as HTMLElement).style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = "var(--text-secondary)";
                (e.target as HTMLElement).style.borderColor = "var(--border)";
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </header>

      {/* Chat Messages */}
      <main style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: msg.role === "user" ? "var(--user-bubble)" : "var(--bg-card)",
                  border: `1px solid ${msg.role === "user" ? "var(--accent)" : "var(--border)"}`,
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "var(--text-primary)",
                  boxShadow: msg.role === "user" ? "0 0 20px rgba(99,102,241,0.15)" : "none",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {renderContent(msg.content)}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                padding: "14px 18px",
                borderRadius: "18px 18px 18px 4px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                display: "flex",
                gap: 6,
                alignItems: "center",
              }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    width: 7, height: 7,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "inline-block",
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer style={{
        padding: "16px 24px",
        borderTop: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 720,
          margin: "0 auto",
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about Arun's projects, skills, or background..."
            rows={1}
            style={{
              flex: 1,
              background: "var(--bg-input)",
              border: `1px solid ${input ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 12,
              padding: "12px 16px",
              color: "var(--text-primary)",
              fontSize: 14,
              resize: "none",
              outline: "none",
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: "auto",
              transition: "border-color 0.2s",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: "none",
              background: isLoading || !input.trim()
                ? "var(--border)"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
              transition: "all 0.2s",
              boxShadow: isLoading || !input.trim() ? "none" : "0 0 16px var(--accent-glow)",
            }}
          >
            {isLoading ? "⏳" : "➤"}
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-secondary)", marginTop: 10 }}>
          ArunCore is an AI — responses may not be 100% accurate. Powered by Groq + LangChain.
        </p>
      </footer>

      {/* Bounce keyframe injection */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
