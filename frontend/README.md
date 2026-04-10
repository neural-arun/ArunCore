# /frontend: Premium Web Interface

This is the "Face" of ArunCore. It is a standalone **Next.js 14** application designed for speed, beauty, and mobile-first accessibility.

## 🚀 Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS + Custom Dark Mode Design System
- **State Management**: React `useState` & `useEffect` hooks
- **Persistence**: `sessionStorage` for UUID-based cross-refresh memory

## 🏗️ Key Features
- **Premium Aesthetics**: Uses a custom "Indigo-to-Purple" glow system with high-contrast UI elements.
- **Typing Indicators**: High-fidelity bounce animations used to mask the 2-4 second reasoning time of the LLM.
- **Markdown Support**: Custom rendering for bold text and bullet points.
- **Environment Driven**: Connects to the live HuggingFace API using the `NEXT_PUBLIC_API_URL` variable.

## 🛠️ Development & Deployment
To run locally:
```bash
npm install
npm run dev
```

The frontend is deployed on **Vercel** for 100% uptime and global CDN delivery.
