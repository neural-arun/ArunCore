"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

// Official SVG Logos
const Icons = {
  GitHub: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
  ),
  LinkedIn: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
  )
};

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

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      height: "100dvh",
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      fontFamily: "Inter, system-ui, sans-serif"
    }}>
      
      {/* Sidebar (Responsive) */}
      <aside style={{
        width: "300px",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "50px 24px",
        gap: "32px",
        flexShrink: 0,
      }} className="desktop-sidebar">
        
        {/* Profile Image with Hover Effect */}
        <div style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          overflow: "hidden",
          border: "4px solid var(--accent)",
          boxShadow: "0 0 30px var(--accent-glow)",
          transition: "transform 0.3s ease",
          cursor: "pointer"
        }} onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
           onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
          <img 
            src="/picture.png" 
            alt="Arun Yadav" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        </div>

        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>ArunCore</h1>
          <p style={{
            fontSize: "16px",
            color: "#6ee7b7",
            marginTop: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontWeight: 600
          }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#6ee7b7", 
              boxShadow: "0 0 10px #6ee7b7" }}></span>
            Online — AI Digital Twin
          </p>
        </div>

        {/* Social Icons Branding Row */}
        <div style={{ display: "flex", gap: "20px", marginTop: "auto" }}>
          {[
            { label: "LinkedIn", href: "https://www.linkedin.com/in/neuralarun/", icon: <Icons.LinkedIn /> },
            { label: "X", href: "https://x.com/Neural_Arun", icon: <Icons.X /> },
            { label: "GitHub", href: "https://github.com/neural-arun", icon: <Icons.GitHub /> },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              style={{
                color: "var(--text-secondary)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                padding: "10px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "white";
                (e.currentTarget as HTMLElement).style.background = "var(--accent)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 16px var(--accent-glow)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {link.icon}
            </a>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }} className="mobile-header">
           <img 
            src="/picture.png" 
            alt="Arun Yadav" 
            style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--accent)" }} 
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.4px" }}>ArunCore</div>
            <div style={{ fontSize: 14, color: "#6ee7b7", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6ee7b7" }}></span>
              Online
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}>
          <div style={{ maxWidth: 850, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  className="markdown-bubble"
                  style={{
                    maxWidth: "85%",
                    padding: "18px 24px",
                    borderRadius: msg.role === "user" ? "22px 22px 4px 22px" : "22px 22px 22px 4px",
                    background: msg.role === "user" ? "var(--user-bubble)" : "var(--bg-card)",
                    border: `1px solid ${msg.role === "user" ? "var(--accent)" : "var(--border)"}`,
                    color: "var(--text-primary)",
                    boxShadow: msg.role === "user" ? "0 8px 20px rgba(99,102,241,0.12)" : "0 4px 15px rgba(0,0,0,0.15)",
                    lineHeight: 1.7,
                  }}
                >
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8", textDecoration: "underline" }} />,
                      p: ({node, ...props}) => <p {...props} style={{ margin: i === 0 && msg.role === "assistant" ? "0" : "0 0 10px 0", fontSize: i === 0 && msg.role === "assistant" ? "20px" : "16px", fontWeight: i === 0 && msg.role === "assistant" ? 500 : 400 }} />,
                      table: ({node, ...props}) => <div style={{ overflowX: "auto", margin: "10px 0" }}><table {...props} style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }} /></div>,
                      th: ({node, ...props}) => <th {...props} style={{ background: "rgba(255,255,255,0.05)", padding: "10px", border: "1px solid var(--border)", textAlign: "left" }} />,
                      td: ({node, ...props}) => <td {...props} style={{ padding: "10px", border: "1px solid var(--border)" }} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "18px 24px",
                  borderRadius: "22px 22px 22px 4px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  gap: 10,
                }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{
                      width: 9, height: 9,
                      borderRadius: "50%",
                      background: "var(--accent)",
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
          padding: "24px 32px",
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{
            maxWidth: 850,
            margin: "0 auto",
            display: "flex",
            gap: 14,
            alignItems: "flex-end",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Arun's twin anything..."
              rows={1}
              style={{
                flex: 1,
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "16px 20px",
                color: "var(--text-primary)",
                fontSize: 16,
                resize: "none",
                outline: "none",
                maxHeight: 180,
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              style={{
                width: 54,
                height: 54,
                borderRadius: "16px",
                border: "none",
                background: isLoading || !input.trim()
                  ? "var(--border)"
                  : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
                boxShadow: isLoading || !input.trim() ? "none" : "0 4px 20px var(--accent-glow)",
              }}
            >
              {isLoading ? "⏳" : <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
            </button>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-10px); opacity: 1; }
        }
        @media (max-width: 850px) {
          .desktop-sidebar { display: none; }
          .mobile-header { display: flex !important; }
        }
        @media (min-width: 851px) {
          .mobile-header { display: none !important; }
        }
        .markdown-bubble > div > *:last-child { margin-bottom: 0 !important; }
      `}</style>
    </div>
  );
}
