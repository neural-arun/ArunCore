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
    <div className="app-container">
      
      {/* Sidebar - CSS will handle visibility */}
      <aside className="sidebar">
        <div className="profile-container">
          <div className="profile-img-wrapper">
            <img src="/picture.png" alt="Arun Yadav" className="profile-img" />
          </div>
          <div className="profile-text">
            <h1 className="brand-name">ArunCore</h1>
            <p className="status-text">
              <span className="dot"></span>
              Online — AI Digital Twin
            </p>
          </div>
        </div>

        <div className="social-links-sidebar">
          {[
            { label: "LinkedIn", href: "https://www.linkedin.com/in/neuralarun/", icon: <Icons.LinkedIn /> },
            { label: "X", href: "https://x.com/Neural_Arun", icon: <Icons.X /> },
            { label: "GitHub", href: "https://github.com/neural-arun", icon: <Icons.GitHub /> },
          ].map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="social-icon">
              {link.icon}
            </a>
          ))}
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-content">
        
        {/* Mobile Header */}
        <header className="mobile-header">
           <img src="/picture.png" alt="Arun Yadav" className="mobile-avatar" />
          <div className="mobile-header-text">
            <div className="mobile-name">ArunCore</div>
            <div className="mobile-status">
              <span className="dot"></span>
              Online
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <main className="chat-window">
          <div className="chat-limit">
            {messages.map((msg, i) => (
              <div key={i} className={`message-row ${msg.role}`}>
                <div className="markdown-bubble">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                      p: ({node, ...props}) => <p {...props} className={i === 0 && msg.role === "assistant" ? "welcome-p" : ""} />,
                      table: ({node, ...props}) => <div className="table-wrapper"><table {...props} /></div>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-row assistant">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </main>

        {/* Input Area */}
        <footer className="input-footer">
          <div className="input-limit">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Arun's twin..."
              rows={1}
            />
            <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
              {isLoading ? "⏳" : <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
            </button>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        :root {
          --bg-primary: #0a0a0c;
          --bg-secondary: #131316;
          --bg-card: #1c1c21;
          --bg-input: #25252b;
          --text-primary: #f4f4f5;
          --text-secondary: #a1a1aa;
          --accent: #6366f1;
          --accent-glow: rgba(99, 102, 241, 0.4);
          --border: #27272a;
          --user-bubble: #1e1b4b;
        }

        .app-container {
          display: flex;
          flex-direction: row;
          height: 100dvh;
          width: 100vw;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: 'Inter', system-ui, sans-serif;
          overflow: hidden;
        }

        /* SIDEBAR */
        .sidebar {
          width: 320px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 60px 24px;
          gap: 40px;
          flex-shrink: 0;
        }

        .profile-container {
          text-align: center;
          width: 100%;
        }

        .profile-img-wrapper {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          overflow: hidden;
          margin: 0 auto 24px;
          border: 4px solid var(--accent);
          box-shadow: 0 0 40px var(--accent-glow);
          transition: transform 0.3s ease;
        }

        .profile-img-wrapper:hover { transform: scale(1.05); }

        .profile-img { width: 100%; height: 100%; object-fit: cover; }

        .brand-name { font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px; }

        .status-text {
          font-size: 16px; color: #6ee7b7; font-weight: 600;
          display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px;
        }

        .dot { width: 10px; height: 10px; borderRadius: 50%; background: #6ee7b7; box-shadow: 0 0 10px #6ee7b7; }

        .social-links-sidebar { display: flex; gap: 20px; margin-top: auto; }

        .social-icon {
          color: var(--text-secondary); padding: 12px; border-radius: 12px;
          background: rgba(255,255,255,0.03); border: 1px solid var(--border);
          transition: all 0.3s ease; display: flex; align-items: center;
        }

        .social-icon:hover {
          color: white; background: var(--accent); border-color: var(--accent);
          box-shadow: 0 8px 16px var(--accent-glow);
        }

        /* MAIN */
        .main-content { display: flex; flex-direction: column; flex: 1; min-width: 0; }

        .mobile-header { display: none; }

        .chat-window { flex: 1; overflow-y: auto; padding: 32px 20px; }

        .chat-limit { max-width: 850px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

        /* BUBBLES */
        .message-row { display: flex; width: 100%; }
        .message-row.user { justify-content: flex-end; }
        .message-row.assistant { justify-content: flex-start; }

        .markdown-bubble {
          max-width: 85%; padding: 18px 24px; line-height: 1.7;
          border-radius: 22px 22px 22px 4px; border: 1px solid var(--border);
          background: var(--bg-card); box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }

        .message-row.user .markdown-bubble {
          border-radius: 22px 22px 4px 22px; background: var(--user-bubble);
          border-color: var(--accent); box-shadow: 0 8px 20px rgba(99,102,241,0.12);
        }

        .markdown-bubble a { color: #818cf8; text-decoration: underline; font-weight: 500; }
        .markdown-bubble p { margin: 0 0 12px 0; font-size: 16px; }
        .markdown-bubble p:last-child { margin-bottom: 0; }
        .markdown-bubble .welcome-p { font-size: 20px; font-weight: 500; }

        .table-wrapper { overflow-x: auto; margin: 16px 0; border-radius: 8px; border: 1px solid var(--border); }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { background: rgba(255,255,255,0.05); padding: 12px; text-align: left; border: 1px solid var(--border); }
        td { padding: 12px; border: 1px solid var(--border); }

        /* TYPING */
        .typing-indicator { display: flex; gap: 8px; padding: 4px; }
        .typing-indicator span {
          width: 8px; height: 8px; background: var(--accent); border-radius: 50%;
          animation: bounce 1.2s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-10px); opacity: 1; }
        }

        /* INPUT */
        .input-footer { padding: 24px; background: var(--bg-secondary); border-top: 1px solid var(--border); }
        .input-limit { max-width: 850px; margin: 0 auto; display: flex; gap: 16px; align-items: flex-end; }

        textarea {
          flex: 1; background: var(--bg-input); border: 1px solid var(--border); border-radius: 16px;
          padding: 16px 20px; color: white; fontSize: 16px; resize: none; outline: none;
          maxHeight: 180px; transition: border-color 0.3s;
        }
        textarea:focus { border-color: var(--accent); }

        button {
          width: 54px; height: 54px; border-radius: 16px; border: none;
          background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 20px var(--accent-glow);
        }
        button:disabled { background: var(--bg-input); cursor: not-allowed; box-shadow: none; }
        button:active:not(:disabled) { transform: scale(0.95); }

        /* RESPONSIVE */
        @media (max-width: 850px) {
          .sidebar { display: none; }
          .mobile-header {
            display: flex; padding: 16px 20px; background: var(--bg-secondary);
            border-bottom: 1px solid var(--border); align-items: center; gap: 14px;
          }
          .mobile-avatar { width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--accent); }
          .mobile-name { font-weight: 800; font-size: 18px; letter-spacing: -0.5px; }
          .mobile-status { font-size: 14px; color: #6ee7b7; font-weight: 600; display: flex; align-items: center; gap: 6px; }
          .chat-window { padding: 20px 12px; }
          .markdown-bubble { max-width: 95%; padding: 14px 18px; }
          .input-footer { padding: 16px; }
          .input-limit { gap: 10px; }
          textarea { padding: 12px 16px; border-radius: 12px; }
          button { width: 48px; height: 48px; border-radius: 12px; }
        }
      `}</style>
    </div>
  );
}
