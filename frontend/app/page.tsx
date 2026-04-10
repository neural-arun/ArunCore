"use client";

import { useState, useRef, useEffect } from "react";
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

const SUGGESTIONS = [
  "What projects has Arun built?",
  "Explain his RAG systems",
  "How can he help my business?"
];

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
      content: "I am Arun's system brain.\nI don't guess — I answer based on his actual work.\n\nI help you understand Arun's work, projects, and systems. Ask anything.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTypingStr, setIsTypingStr] = useState(false);
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
  }, [messages, isLoading, isTypingStr]);

  const sendMessage = async (overrideMsg?: string) => {
    const userMessage = overrideMsg || input.trim();
    if (!userMessage || isLoading || isTypingStr) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Intentional delay for that 'alive' feeling
      await new Promise(r => setTimeout(r, 400));

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId.current, message: userMessage }),
      });
      const data = await response.json();
      
      setIsLoading(false);
      setIsTypingStr(true);
      
      // Setup streaming state
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      
      const fullReply = data.reply || "Something went wrong.";
      const chars = fullReply.split("");
      let currentText = "";
      
      const speed = chars.length > 500 ? 5 : 15;
      
      for (let i = 0; i < chars.length; i++) {
        currentText += chars[i];
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = currentText;
          return newMessages;
        });
        if (i % 2 === 0) {
          await new Promise(r => setTimeout(r, speed));
        }
      }
      setIsTypingStr(false);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connectivity issue. Try again!" }]);
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

  // COMMON RENDERER
  const ChatContent = () => (
    <div className="chat-limit">
      {messages.map((msg, i) => (
        <div key={i} className={`message-row ${msg.role}`}>
          <div className="markdown-bubble">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
              components={{
                a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                p: (props) => <p {...props} className={i === 0 && msg.role === "assistant" ? "welcome-p" : ""} />,
                table: (props) => <div className="table-wrapper"><table {...props} /></div>,
                code({ node, inline, className, children, ...props }: any) {
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
              <div className="status"><span className="dot"></span>System Brain</div>
            </div>
          </header>
          
          <main className="mobile-chat">
            <ChatContent />
          </main>

          <footer className="mobile-input">
            <div className="input-container">
              {messages.length === 1 && (
                <div className="suggestions-wrap">
                  <p className="suggestions-title">Try asking:</p>
                  <div className="suggestions-chips border-b">
                    {SUGGESTIONS.map((s, idx) => (
                      <button key={idx} className="chip" onClick={() => sendMessage(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="input-wrap">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about projects, systems, or skills..." rows={1} />
                <button className="send-btn" onClick={() => sendMessage()} disabled={isLoading || isTypingStr || !input.trim()}>➤</button>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* DESKTOP VERSION */
        <div className="desktop-layout">
          <aside className="sidebar">
            <div className="sidebar-top">
              <div className="img-circle"><img src="/picture.png" /></div>
              <h2>ArunCore</h2>
              <p className="online-label"><span className="dot"></span>System Brain</p>
            </div>
            
            <div className="sidebar-middle nav-panel">
              <button className="nav-btn" onClick={() => sendMessage("Tell me about Arun")}>
                <span className="icon">👤</span> About
              </button>
              <button className="nav-btn" onClick={() => sendMessage("What projects has Arun built?")}>
                <span className="icon">🚀</span> Projects
              </button>
              <button className="nav-btn" onClick={() => sendMessage("How can I contact Arun?")}>
                <span className="icon">✉️</span> Contact
              </button>
              <button className="nav-btn" onClick={() => sendMessage("Show me Arun's resume and skills")}>
                <span className="icon">📄</span> Resume
              </button>
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
              <div className="input-container">
                {messages.length === 1 && (
                  <div className="suggestions-wrap">
                    <p className="suggestions-title">Try asking:</p>
                    <div className="suggestions-chips">
                      {SUGGESTIONS.map((s, idx) => (
                        <button key={idx} className="chip" onClick={() => sendMessage(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="input-wrap">
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about projects, systems, or skills..." rows={1} />
                  <button className="send-btn" onClick={() => sendMessage()} disabled={isLoading || isTypingStr || !input.trim()}>➤</button>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}

      <style jsx global>{`
        :root {
          --bg-p: #0a0a0c; --bg-s: #131316; --bg-c: #1c1c21;
          --text-p: #f4f4f5; --text-s: #a1a1aa;
          --accent: #6366f1; --accent-glow: rgba(99, 102, 241, 0.4); 
          --border: #27272a;
        }
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; background: var(--bg-p); font-family: Inter, sans-serif; overflow: hidden; }
        
        .root-container { height: 100dvh; width: 100vw; display: flex; }

        /* DESKTOP VIEW */
        .desktop-layout { display: flex; width: 100%; height: 100%; }
        .sidebar { width: 280px; background: var(--bg-s); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 40px 24px; }
        .img-circle { width: 120px; height: 120px; border-radius: 50%; border: 3px solid var(--accent); overflow: hidden; margin: 0 auto 20px; box-shadow: 0 0 20px rgba(99,102,241,0.4); }
        .img-circle img { width: 100%; height: 100%; object-fit: cover; }
        .sidebar-top { text-align: center; }
        .sidebar-top h2 { margin: 0; font-size: 24px; color: white; }
        .online-label { color: #6ee7b7; font-size: 14px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #6ee7b7; box-shadow: 0 0 8px #6ee7b7; }
        
        .nav-panel { margin-top: 40px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .nav-btn { width: 100%; height: auto; padding: 14px 16px; background: transparent; border: 1px solid transparent; border-radius: 12px; color: var(--text-s); display: flex; align-items: center; justify-content: flex-start; gap: 12px; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
        .nav-btn:hover { background: var(--bg-c); border-color: var(--border); color: white; box-shadow: none; transform: none; }
        .nav-btn .icon { font-size: 18px; }

        .sidebar-bottom { margin-top: auto; }
        .social-grid { display: flex; gap: 15px; justify-content: center; }
        .social-grid a { color: var(--text-s); padding: 10px; border-radius: 10px; border: 1px solid var(--border); transition: 0.2s; }
        .social-grid a:hover { color: white; background: var(--accent); border-color: var(--accent); }

        .desktop-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .desktop-chat { flex: 1; overflow-y: auto; padding: 40px 20px; }
        .desktop-input { padding: 30px; background: var(--bg-s); border-top: 1px solid var(--border); }
        
        .input-container { max-width: 650px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; }
        .input-wrap { display: flex; gap: 15px; align-items: flex-end; width: 100%; }
        .desktop-input textarea { flex: 1; background: #25252b; border: 1px solid var(--border); border-radius: 16px; padding: 16px 20px; color: white; resize: none; outline: none; font-size: 16px; transition: border-color 0.2s; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
        .desktop-input textarea:focus { border-color: var(--accent); }

        /* MOBILE VIEW */
        .mobile-layout { display: flex; flex-direction: column; width: 100%; height: 100%; }
        .mobile-header { padding: 12px 16px; background: var(--bg-s); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
        .mobile-avatar { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--accent); }
        .mobile-brand .name { font-weight: 700; font-size: 16px; color: white;}
        .mobile-brand .status { font-size: 12px; color: #6ee7b7; display: flex; align-items: center; gap: 4px; }
        .mobile-chat { flex: 1; overflow-y: auto; padding: 20px 15px; }
        .mobile-input { padding: 15px; background: var(--bg-s); border-top: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
        .mobile-input .input-wrap { display: flex; gap: 10px; align-items: flex-end; width: 100%; }
        .mobile-input textarea { flex: 1; background: #25252b; border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; color: white; resize: none; outline: none; font-size: 15px; max-height: 100px; transition: border-color 0.2s; }
        .mobile-input textarea:focus { border-color: var(--accent); }
        
        .send-btn { width: 48px; height: 48px; min-width: 48px; border-radius: 14px; border: none; background: var(--accent); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.3s ease; box-shadow: 0 0 15px var(--accent-glow); }
        .send-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 0 25px var(--accent); background: #818cf8; }
        .send-btn:disabled { background: var(--border); box-shadow: none; opacity: 0.5; transform: none; cursor: not-allowed; }

        /* SHARED ELEMENTS */
        .chat-limit { max-width: 650px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; padding-bottom: 20px; }
        .message-row { display: flex; width: 100%; }
        .message-row.user { justify-content: flex-end; }
        .markdown-bubble { max-width: 85%; padding: 16px 20px; line-height: 1.6; border-radius: 18px 18px 18px 4px; background: #27272a; border: 1px solid #3f3f46; color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .message-row.user .markdown-bubble { border-radius: 18px 18px 4px 18px; background: #4338ca; border-color: #4f46e5; font-weight: 500; }
        .markdown-bubble a { color: #818cf8; text-decoration: underline; font-weight: 600; transition: color 0.2s; }
        .markdown-bubble a:hover { color: white; text-decoration: none; }
        
        .suggestions-wrap { margin-bottom: 20px; }
        .suggestions-title { color: var(--text-s); font-size: 13px; margin-bottom: 10px; font-weight: 500; display: block; }
        .suggestions-chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .chip { padding: 8px 16px; background: var(--bg-c); border: 1px solid var(--border); border-radius: 20px; color: var(--text-p); font-size: 14px; cursor: pointer; transition: all 0.2s; white-space: nowrap; height: auto; width: auto; font-family: inherit; font-weight: 500; }
        .chip:hover { background: var(--accent); border-color: var(--accent); color: white; transform: translateY(-2px); box-shadow: 0 4px 12px var(--accent-glow); }

        /* Markdown Elite Formatting */
        .markdown-bubble ul, .markdown-bubble ol { margin: 16px 0 16px 24px; padding: 0; }
        .markdown-bubble li { margin-bottom: 8px; line-height: 1.6; padding-left: 4px; }
        .markdown-bubble li::marker { color: #f4f4f5; }
        .markdown-bubble h3 { font-size: 1.15rem; color: white; margin: 24px 0 12px 0; font-weight: 600; }
        .markdown-bubble h1, .markdown-bubble h2 { color: white; margin: 24px 0 12px 0; font-weight: 700; }
        .markdown-bubble hr { border: 0; border-top: 1px dashed #3f3f46; margin: 24px 0; }
        
        /* Fix spacing */
        .markdown-bubble p { margin-bottom: 12px; white-space: pre-wrap; }
        .markdown-bubble p:last-child { margin-bottom: 0; }
        .markdown-bubble strong { color: white; }

        /* Code blocks */
        .code-block { background: #0f172a; padding: 14px; border-radius: 10px; overflow-x: auto; font-size: 13px; margin: 12px 0; border: 1px solid #1e293b; }

        /* Inline code */
        .inline-code { background: #18181b; padding: 3px 6px; border-radius: 6px; font-size: 13px; color: #a5b4fc; }

        /* Lists fix */
        .md-list { margin-left: 20px; margin-bottom: 12px; }

        /* Fix line breaks */
        .markdown-bubble br { display: block; margin-bottom: 6px; }

        .welcome-p { font-size: 1.05rem; font-weight: 500; }
        .table-wrapper { overflow-x: auto; margin: 10px 0; border: 1px solid var(--border); border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 8px; border: 1px solid var(--border); text-align: left; }
        
        .typing-indicator { display: flex; gap: 6px; padding: 10px 5px; }
        .typing-indicator span { width: 6px; height: 6px; background: #818cf8; border-radius: 50%; animation: bounce 1.2s infinite alternate; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { to { transform: translateY(-6px); opacity: 0.5; background: var(--accent); } }
      `}</style>
    </div>
  );
}
