import asyncio
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

# Import the core ArunCore engine
from core.agent import init_agent, RollingMemory

load_dotenv()

# === In-Memory Session Store (telegram chat_id -> RollingMemory) ===
sessions: dict[int, RollingMemory] = {}

# Initialize the engine once at startup
print("Initializing ArunCore Telegram Bot...")
main_llm, prompt, _, tools = init_agent()
tool_map = {t.name: t for t in tools}
print("Bot engine ready.")


def get_or_create_memory(chat_id: int) -> RollingMemory:
    """Returns existing memory for this user, or creates a new one."""
    if chat_id not in sessions:
        summary_llm = ChatGroq(
            temperature=0.0,
            model_name="llama-3.1-8b-instant",
            api_key=os.getenv("GROQ_API_KEY")
        )
        sessions[chat_id] = RollingMemory(summary_llm=summary_llm)
    return sessions[chat_id]


def run_agent(chat_id: int, user_message: str) -> str:
    """Runs the full stateful agent loop for a given user message."""
    memory = get_or_create_memory(chat_id)
    scratchpad = []
    final_response = None
    max_iterations = 3

    for _ in range(max_iterations):
        messages = prompt.format_messages(
            running_summary=memory.running_summary,
            chat_history=memory.get_messages(),
            input=user_message,
            agent_scratchpad=scratchpad,
        )
        ai_msg = main_llm.invoke(messages)

        if ai_msg.tool_calls:
            scratchpad.append(ai_msg)
            for tc in ai_msg.tool_calls:
                tool_func = tool_map.get(tc["name"])
                try:
                    result = tool_func.invoke(tc["args"])
                except Exception as e:
                    result = f"Tool error: {e}"
                scratchpad.append({
                    "role": "tool",
                    "name": tc["name"],
                    "tool_call_id": tc["id"],
                    "content": str(result)[:2000],
                })
        else:
            final_response = ai_msg.content
            break

    if not final_response:
        final_response = "I ran into an issue internally. Please try again."

    memory.add_interaction(user_message, final_response)
    return final_response


# === Telegram Handlers ===

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome = (
        "👋 Hi! I'm *ArunCore*, the AI digital twin of *Arun Yadav*.\n\n"
        "Ask me anything about his projects, skills, or background in AI engineering. "
        "I'm here to give you the real picture. 🚀"
    )
    await update.message.reply_text(welcome, parse_mode="Markdown")


import re

def format_for_telegram(text: str) -> str:
    """Converts LLM Markdown into Telegram-safe HTML."""
    # Convert **bold** to <b>bold</b>
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # Convert `code` to <code>code</code>
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    # Convert [text](url) to <a href="url">text</a>
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
    return text

async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    user_message = update.message.text

    # Show "typing..." indicator while generating
    await context.bot.send_chat_action(chat_id=chat_id, action="typing")

    reply = await asyncio.to_thread(run_agent, chat_id, user_message)
    
    html_reply = format_for_telegram(reply)
    
    try:
        await update.message.reply_text(html_reply, parse_mode="HTML")
    except Exception:
        # Final fallback to raw text if HTML parsing somehow fails
        await update.message.reply_text(reply)


def main():
    token = os.getenv("TELEGRAM_PUBLIC_BOT_TOKEN")
    if not token:
        raise ValueError("TELEGRAM_PUBLIC_BOT_TOKEN not set in .env")

    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler))

    print("ArunCore Telegram Bot is running...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
