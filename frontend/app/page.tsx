"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SESSION_KEY = "aruncore_session_id";
const API_URL = "https://neural-arun-aruncore.hf.space";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return uuidv4();

  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const QUICK_ACTIONS = [
  { label: "Show best projects", prompt: "Show me Arun's best projects with impact." },
  { label: "Explain RAG system", prompt: "Explain Arun's RAG system architecture and what makes it different." },
  { label: "How can Arun help me?", prompt: "How can Arun help my business or project?" },
  { label: "Break down one project", prompt: "Break down Arun's most complex project in detail." },
];

const NAV_ITEMS = [
  { label: "About", prompt: "Who is Arun? Give me a sharp summary." },
  { label: "Projects", prompt: "Show all of Arun's projects." },
  { label: "Contact", prompt: "How can I contact or work with Arun?" },
  { label: "Resume", prompt: "Show me Arun's skills and experience." },
];

const Icons = {
  GitHub: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
  LinkedIn: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  ),
  Send: () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I am Arun's system brain.\n\nI don't guess — I retrieve and answer based on his actual work.\n\nAsk me about his projects, systems, or how he can help you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTypingStr, setIsTypingStr] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeNav, setActiveNav] = useState("");
  const [textareaRows, setTextareaRows] = useState(1);

  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    sessionId.current = getOrCreateSessionId();

    const handleResize = () => setIsMobile(window.innerWidth <= 850);
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isTypingStr]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const sendMessage = async (overrideMsg?: string) => {
    const userMessage = (overrideMsg || input).trim();
    if (!userMessage || isLoading || isTypingStr) return;

    setInput("");
    setTextareaRows(1);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 300));

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId.current,
          message: userMessage,
        }),
      });

      const data = await response.json().catch(() => ({}));
      const fullReply = typeof data?.reply === "string" && data.reply.trim() ? data.reply : "Connectivity issue. Try again.";

      setIsLoading(false);
      setIsTypingStr(true);
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const chars = fullReply.split("");
      let currentText = "";
      const speed = chars.length > 600 ? 3 : 8;

      for (let i = 0; i < chars.length; i++) {
        currentText += chars[i];
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (newMessages[lastIndex]) {
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content: currentText,
            };
          }
          return newMessages;
        });

        if (i % 2 === 0) {
          await new Promise((r) => setTimeout(r, speed));
        }
      }

      setIsTypingStr(false);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connectivity issue. Try again." }]);
      setIsLoading(false);
      setIsTypingStr(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNavClick = (item: (typeof NAV_ITEMS)[number]) => {
    setActiveNav(item.label);
    sendMessage(item.prompt);
  };

  const isFirstMessage = messages.length === 1;

  const ChatContent = () => (
    <div className="chat-limit">
      {messages.map((msg, i) => (
        <div key={`${msg.role}-${i}`} className={`message-row ${msg.role}`}>
          <div className={`markdown-bubble ${msg.role === "assistant" ? "ai-bubble" : "user-bubble"}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
              components={{
                a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                p: (props) => <p {...props} />,
                table: (props) => (
                  <div className="table-wrapper">
                    <table {...props} />
                  </div>
                ),
                code({ inline, className, children, ...props }: any) {
                  return !inline ? (
                    <pre className="code-block">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className="inline-code" {...props}>
                      {children}
                    </code>
                  );
                },
                ul: (props) => <ul className="md-list" {...props} />,
                ol: (props) => <ol className="md-list" {...props} />,
              }}
            >
              {msg.content.replace(/\n/g, "  \n")}
            </ReactMarkdown>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="message-row assistant">
          <div className="typing-indicator">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );

  // Inline input JSX — defined as a variable, not a component, to prevent remount on each keystroke
  const inputAreaJSX = (
    <div className="input-container">
      {isFirstMessage && (
        <div className="quick-actions">
          <span className="quick-label">Try asking</span>
          <div className="quick-chips">
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={`${action.label}-${idx}`}
                className="chip"
                onClick={() => sendMessage(action.prompt)}
                disabled={isLoading || isTypingStr}
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="input-wrap">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about projects, systems, or how Arun can help you..."
          rows={textareaRows}
        />
        <button
          className="send-btn"
          onClick={() => sendMessage()}
          disabled={isLoading || isTypingStr || !input.trim()}
          type="button"
        >
          <Icons.Send />
        </button>
      </div>
    </div>
  );

  return (
    <div className="root-container">
      {isMobile ? (
        <div className="mobile-layout">
          <header className="mobile-header">
            <img src="/picture.png" className="mobile-avatar" alt="Arun" />
            <div className="mobile-brand">
              <div className="name">ArunCore</div>
              <div className="status">
                <span className="dot" /> System Brain
              </div>
            </div>
          </header>

          <main className="mobile-chat">
            <ChatContent />
          </main>

          <footer className="mobile-input">
            {inputAreaJSX}
          </footer>
        </div>
      ) : (
        <div className="desktop-layout">
          <aside className="sidebar">
            <div className="sidebar-top">
              <div className="img-circle">
                <img src="/picture.png" alt="Arun" />
              </div>
              <h2>ArunCore</h2>
              <p className="identity-tag">AI twin of Arun Yadav</p>
              <p className="online-label">
                <span className="dot" /> System Brain
              </p>
            </div>

            <nav className="sidebar-middle nav-panel">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.label}
                  className={`nav-btn ${activeNav === item.label ? "active" : ""}`}
                  onClick={() => handleNavClick(item)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="sidebar-bottom">
              <p className="work-cta" onClick={() => sendMessage("How can I hire or work with Arun?")}>
                Work with Arun →
              </p>
              <div className="social-grid">
                <a href="https://www.linkedin.com/in/neuralarun/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                  <Icons.LinkedIn />
                </a>
                <a href="https://x.com/Neural_Arun" target="_blank" rel="noopener noreferrer" title="X / Twitter">
                  <Icons.X />
                </a>
                <a href="https://github.com/neural-arun" target="_blank" rel="noopener noreferrer" title="GitHub">
                  <Icons.GitHub />
                </a>
              </div>
            </div>
          </aside>

          <div className="desktop-main">
            <main className="desktop-chat">
              <ChatContent />
            </main>
            <footer className="desktop-input">
              {inputAreaJSX}
            </footer>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

        :root {
          --bg-p: #09090b;
          --bg-s: #111113;
          --bg-c: #18181b;
          --bg-hover: #27272a;
          --text-p: #fafafa;
          --text-s: #71717a;
          --text-m: #a1a1aa;
          --accent: #6366f1;
          --accent-glow: rgba(99, 102, 241, 0.35);
          --accent-light: #818cf8;
          --border: #27272a;
          --border-light: #3f3f46;
          --green: #22c55e;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body,
        html {
          background: var(--bg-p);
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          overflow: hidden;
          height: 100dvh;
          color: var(--text-p);
        }

        .root-container {
          height: 100dvh;
          width: 100vw;
          display: flex;
        }

        .desktop-layout {
          display: flex;
          width: 100%;
          height: 100%;
        }

        .sidebar {
          width: 260px;
          min-width: 260px;
          background: var(--bg-s);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 32px 20px;
          gap: 0;
        }

        .sidebar-top {
          text-align: center;
          padding-bottom: 28px;
          border-bottom: 1px solid var(--border);
        }

        .img-circle {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          border: 2px solid var(--accent);
          overflow: hidden;
          margin: 0 auto 16px;
          box-shadow: 0 0 24px var(--accent-glow);
        }

        .img-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sidebar-top h2 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-p);
          margin-bottom: 4px;
        }

        .identity-tag {
          font-size: 12px;
          color: var(--text-s);
          margin-bottom: 8px;
        }

        .online-label {
          color: var(--green);
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 6px var(--green);
          flex-shrink: 0;
        }

        .nav-panel {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .nav-btn {
          width: 100%;
          padding: 11px 14px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 10px;
          color: var(--text-m);
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          text-align: left;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .nav-btn:hover {
          background: var(--bg-hover);
          color: var(--text-p);
          border-color: var(--border-light);
        }

        .nav-btn.active {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.3);
          color: var(--accent-light);
        }

        .sidebar-bottom {
          margin-top: auto;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .work-cta {
          font-size: 13px;
          font-weight: 600;
          color: var(--accent-light);
          text-align: center;
          margin-bottom: 16px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .work-cta:hover {
          color: white;
        }

        .social-grid {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .social-grid a {
          color: var(--text-s);
          padding: 9px;
          border-radius: 9px;
          border: 1px solid var(--border);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .social-grid a:hover {
          color: white;
          background: var(--accent);
          border-color: var(--accent);
        }

        .desktop-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }

        .desktop-chat {
          flex: 1;
          overflow-y: auto;
          padding: 40px 24px 20px;
          scroll-behavior: smooth;
        }

        .desktop-input {
          padding: 20px 24px 28px;
          background: var(--bg-s);
          border-top: 1px solid var(--border);
        }

        .mobile-layout {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }

        .mobile-header {
          padding: 14px 16px;
          background: var(--bg-s);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .mobile-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 2px solid var(--accent);
        }

        .mobile-brand .name {
          font-weight: 700;
          font-size: 15px;
        }

        .mobile-brand .status {
          font-size: 11px;
          color: var(--green);
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 2px;
        }

        .mobile-chat {
          flex: 1;
          overflow-y: auto;
          padding: 20px 14px;
        }

        .mobile-input {
          padding: 14px 14px 18px;
          background: var(--bg-s);
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        .chat-limit {
          max-width: 660px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 12px;
        }

        .message-row {
          display: flex;
          width: 100%;
        }

        .message-row.user {
          justify-content: flex-end;
        }

        .markdown-bubble {
          max-width: 82%;
          padding: 14px 18px;
          border-radius: 18px 18px 18px 4px;
          line-height: 1.7;
          font-size: 15px;
        }

        .ai-bubble {
          background: #1c1c22;
          border: 1px solid #2e2e38;
          color: #e4e4e7;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
        }

        .user-bubble {
          border-radius: 18px 18px 4px 18px;
          background: #3730a3;
          border: 1px solid #4338ca;
          color: white;
          font-weight: 500;
        }

        .markdown-bubble a {
          color: #818cf8;
          text-decoration: underline;
          font-weight: 500;
          transition: color 0.2s;
        }

        .markdown-bubble a:hover {
          color: white;
        }

        .markdown-bubble blockquote {
          border-left: 3px solid var(--accent);
          margin: 12px 0;
          padding: 8px 14px;
          background: rgba(99, 102, 241, 0.07);
          border-radius: 0 8px 8px 0;
          color: var(--text-m);
          font-style: normal;
        }

        .markdown-bubble p {
          margin-bottom: 10px;
          white-space: pre-wrap;
        }

        .markdown-bubble p:last-child {
          margin-bottom: 0;
        }

        .markdown-bubble strong {
          color: white;
          font-weight: 600;
        }

        .markdown-bubble em {
          color: var(--text-m);
        }

        .markdown-bubble ul,
        .markdown-bubble ol {
          margin: 10px 0 10px 20px;
          padding: 0;
        }

        .markdown-bubble li {
          margin-bottom: 6px;
          line-height: 1.7;
        }

        .markdown-bubble li::marker {
          color: var(--accent-light);
        }

        .markdown-bubble h1,
        .markdown-bubble h2 {
          color: white;
          margin: 20px 0 10px;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .markdown-bubble h3 {
          color: white;
          margin: 16px 0 8px;
          font-weight: 600;
          font-size: 1rem;
        }

        .markdown-bubble hr {
          border: 0;
          border-top: 1px solid var(--border-light);
          margin: 16px 0;
        }

        .code-block {
          background: #0d0d14;
          padding: 14px 16px;
          border-radius: 10px;
          overflow-x: auto;
          font-size: 13px;
          margin: 12px 0;
          border: 1px solid #1e1e2e;
        }

        .inline-code {
          background: #27272a;
          padding: 2px 6px;
          border-radius: 5px;
          font-size: 13px;
          color: #a5b4fc;
        }

        .md-list {
          margin-left: 18px;
          margin-bottom: 10px;
        }

        .markdown-bubble br {
          display: block;
          margin-bottom: 4px;
        }

        .table-wrapper {
          overflow-x: auto;
          margin: 12px 0;
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        th,
        td {
          padding: 8px 12px;
          border: 1px solid var(--border);
          text-align: left;
        }

        th {
          background: var(--bg-c);
          color: white;
          font-weight: 600;
        }

        .quick-actions {
          margin-bottom: 16px;
        }

        .quick-label {
          font-size: 12px;
          color: var(--text-s);
          font-weight: 500;
          display: block;
          margin-bottom: 10px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .quick-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chip {
          padding: 7px 14px;
          background: var(--bg-c);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          color: var(--text-m);
          font-size: 13px;
          font-family: inherit;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
          height: auto;
          width: auto;
        }

        .chip:hover:not(:disabled) {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.5);
          color: var(--accent-light);
          transform: translateY(-1px);
        }

        .chip:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .input-container {
          max-width: 660px;
          margin: 0 auto;
          width: 100%;
        }

        .input-wrap {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          width: 100%;
        }

        textarea {
          flex: 1;
          background: #18181b;
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 14px 18px;
          color: var(--text-p);
          resize: none;
          outline: none;
          font-size: 15px;
          font-family: inherit;
          line-height: 1.5;
          transition: border-color 0.2s, box-shadow 0.2s;
          max-height: 140px;
          overflow-y: auto;
        }

        textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        textarea::placeholder {
          color: var(--text-s);
        }

        .send-btn {
          width: 46px;
          height: 46px;
          min-width: 46px;
          border-radius: 13px;
          border: none;
          background: var(--accent);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 0 18px var(--accent-glow);
        }

        .send-btn:hover:not(:disabled) {
          background: var(--accent-light);
          transform: translateY(-1px);
          box-shadow: 0 0 28px var(--accent-glow);
        }

        .send-btn:disabled {
          background: var(--border);
          box-shadow: none;
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .typing-indicator {
          display: flex;
          gap: 5px;
          padding: 12px 6px;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: var(--accent-light);
          border-radius: 50%;
          animation: bounce 1.2s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-7px);
            opacity: 1;
          }
        }

        ::-webkit-scrollbar {
          width: 4px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: var(--border-light);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: var(--accent);
        }
      `}</style>
    </div>
  );
}