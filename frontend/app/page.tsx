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

const API_URL = "https://neural-arun-aruncore.hf.space";

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
      content: "Hey! I'm **ArunCore**, the AI digital twin of Arun Yadav. Ask me anything about his projects, skills, or background — I'm here to give you the real picture. 🚀",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef<string>("");

  useEffect(() => {
    sessionId.current = getOrCreateSessionId();
    
    // Width detection
    const handleResize = () => setIsMobile(window.innerWidth <= 850);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
        body: JSON.stringify({ session_id: sessionId.current, message: userMessage }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connectivity issue. Try again!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // COMMON RENDERER
  const ChatContent = () => (
    <div className="chat-limit">
      {messages.map((msg, i) => (
        <div key={i} className={`message-row ${msg.role}`}>
          <div className="markdown-bubble">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                p: (props) => <p {...props} className={i === 0 && msg.role === "assistant" ? "welcome-p" : ""} />,
                table: (props) => <div className="table-wrapper"><table {...props} /></div>,
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="message-row assistant">
          <div className="typing-indicator"><span></span><span></span><span></span></div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );

  return (
    <div className="root-container">
      {isMobile ? (
        /* MOBILE VERSION */
        <div className="mobile-layout">
          <header className="mobile-header">
            <img src="/picture.png" className="mobile-avatar" />
            <div className="mobile-brand">
              <div className="name">ArunCore</div>
              <div className="status"><span className="dot"></span>Online</div>
            </div>
          </header>
          
          <main className="mobile-chat">
            <ChatContent />
          </main>

          <footer className="mobile-input">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message ArunCore..." rows={1} />
            <button onClick={sendMessage} disabled={isLoading || !input.trim()}>➤</button>
          </footer>
        </div>
      ) : (
        /* DESKTOP VERSION */
        <div className="desktop-layout">
          <aside className="sidebar">
            <div className="sidebar-top">
              <div className="img-circle"><img src="/picture.png" /></div>
              <h2>ArunCore</h2>
              <p className="online-label"><span className="dot"></span>Online — AI Twin</p>
            </div>
            <div className="sidebar-bottom">
              <div className="social-grid">
                <a href="https://www.linkedin.com/in/neuralarun/" target="_blank"><Icons.LinkedIn /></a>
                <a href="https://x.com/Neural_Arun" target="_blank"><Icons.X /></a>
                <a href="https://github.com/neural-arun" target="_blank"><Icons.GitHub /></a>
              </div>
            </div>
          </aside>
          
          <div className="desktop-main">
            <main className="desktop-chat">
              <ChatContent />
            </main>
            <footer className="desktop-input">
              <div className="input-wrap">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask Arun's twin anything..." rows={1} />
                <button onClick={sendMessage} disabled={isLoading || !input.trim()}>➤</button>
              </div>
            </footer>
          </div>
        </div>
      )}

      <style jsx global>{`
        :root {
          --bg-p: #0a0a0c; --bg-s: #131316; --bg-c: #1c1c21;
          --text-p: #f4f4f5; --text-s: #a1a1aa;
          --accent: #6366f1; --border: #27272a;
        }
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; background: var(--bg-p); font-family: Inter, sans-serif; overflow: hidden; }
        
        .root-container { height: 100dvh; width: 100vw; display: flex; }

        /* DESKTOP VIEW */
        .desktop-layout { display: flex; width: 100%; height: 100%; }
        .sidebar { width: 280px; background: var(--bg-s); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 40px 20px; }
        .img-circle { width: 120px; height: 120px; border-radius: 50%; border: 3px solid var(--accent); overflow: hidden; margin: 0 auto 20px; box-shadow: 0 0 20px rgba(99,102,241,0.4); }
        .img-circle img { width: 100%; height: 100%; object-fit: cover; }
        .sidebar-top { text-align: center; }
        .sidebar-top h2 { margin: 0; font-size: 24px; }
        .online-label { color: #6ee7b7; font-size: 14px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #6ee7b7; box-shadow: 0 0 8px #6ee7b7; }
        .sidebar-bottom { margin-top: auto; }
        .social-grid { display: flex; gap: 15px; justify-content: center; }
        .social-grid a { color: var(--text-s); padding: 10px; border-radius: 10px; border: 1px solid var(--border); transition: 0.2s; }
        .social-grid a:hover { color: white; background: var(--accent); border-color: var(--accent); }

        .desktop-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .desktop-chat { flex: 1; overflow-y: auto; padding: 40px 20px; }
        .desktop-input { padding: 30px; background: var(--bg-s); border-top: 1px solid var(--border); }
        .input-wrap { max-width: 800px; margin: 0 auto; display: flex; gap: 15px; align-items: flex-end; }
        .desktop-input textarea { flex: 1; background: #25252b; border: 1px solid var(--border); border-radius: 12px; padding: 15px; color: white; resize: none; outline: none; font-size: 15px; }

        /* MOBILE VIEW */
        .mobile-layout { display: flex; flex-direction: column; width: 100%; height: 100%; }
        .mobile-header { padding: 12px 16px; background: var(--bg-s); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .mobile-avatar { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--accent); }
        .mobile-brand .name { font-weight: 700; font-size: 16px; }
        .mobile-brand .status { font-size: 12px; color: #6ee7b7; display: flex; align-items: center; gap: 4px; }
        .mobile-chat { flex: 1; overflow-y: auto; padding: 20px 15px; }
        .mobile-input { padding: 15px; background: var(--bg-s); border-top: 1px solid var(--border); display: flex; gap: 10px; align-items: flex-end; flex-shrink: 0; }
        .mobile-input textarea { flex: 1; background: #25252b; border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; color: white; resize: none; outline: none; font-size: 14px; max-height: 100px; }
        
        button { width: 44px; height: 44px; border-radius: 10px; border: none; background: var(--accent); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        button:disabled { background: var(--border); opacity: 0.5; }

        /* SHARED ELEMENTS */
        .chat-limit { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
        .message-row { display: flex; width: 100%; }
        .message-row.user { justify-content: flex-end; }
        .markdown-bubble { max-width: 85%; padding: 14px 18px; line-height: 1.6; border-radius: 18px 18px 18px 4px; background: var(--bg-c); border: 1px solid var(--border); color: var(--text-p); }
        .message-row.user .markdown-bubble { border-radius: 18px 18px 4px 18px; background: #1e1b4b; border-color: var(--accent); }
        .markdown-bubble a { color: #6ee7b7; text-decoration: underline; font-weight: 600; transition: color 0.2s; }
        .markdown-bubble a:hover { color: white; }
        
        /* Markdown Elite Formatting */
        .markdown-bubble ul, .markdown-bubble ol { margin: 16px 0 16px 24px; padding: 0; }
        .markdown-bubble li { margin-bottom: 8px; line-height: 1.6; padding-left: 4px; }
        .markdown-bubble li::marker { color: #f4f4f5; }
        .markdown-bubble h3 { font-size: 1.15rem; color: white; margin: 24px 0 12px 0; font-weight: 600; }
        .markdown-bubble h1, .markdown-bubble h2 { color: white; margin: 24px 0 12px 0; font-weight: 700; }
        .markdown-bubble hr { border: 0; border-top: 1px dashed #3f3f46; margin: 24px 0; }
        .markdown-bubble p { margin: 0 0 12px 0; }
        .markdown-bubble p:last-child { margin-bottom: 0; }
        .markdown-bubble strong { color: white; }

        .welcome-p { font-size: 1.1rem; font-weight: 500; }
        .table-wrapper { overflow-x: auto; margin: 10px 0; border: 1px solid var(--border); border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 8px; border: 1px solid var(--border); text-align: left; }
        
        .typing-indicator { display: flex; gap: 6px; padding: 5px; }
        .typing-indicator span { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; animation: bounce 1s infinite alternate; }
        @keyframes bounce { to { transform: translateY(-6px); opacity: 0.5; } }
      `}</style>
    </div>
  );
}
