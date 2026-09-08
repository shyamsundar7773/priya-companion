require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const GROQ_MODELS = (
  process.env.GROQ_MODELS ||
  "openai/gpt-oss-120b,openai/gpt-oss-20b"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

const GEMINI_MODELS = (
  process.env.GEMINI_MODELS ||
  "gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

console.log("============================================");
console.log("🤖 PRIYA COMPANION AI BACKEND");
console.log("============================================");
console.log("🔑 Groq API key loaded:", !!GROQ_API_KEY);
console.log("🔑 Gemini API key loaded:", !!GEMINI_API_KEY);
console.log("⚡ Groq models:", GROQ_MODELS);
console.log("🧠 Gemini models:", GEMINI_MODELS);
console.log("============================================");


/* ============================================================
   CHARACTER CONTEXT
============================================================ */

function buildCharacterContext(character) {
  if (!character) {
    return `
You are a friendly AI companion.

CONVERSATION STYLE:
- Talk naturally like a real person.
- Keep casual conversations short and conversational.
- Do not behave like a tutor or formal assistant unless the user asks for that.
- Do not turn simple messages into long explanations.
- Do not automatically give advice or instructions.
- Do not use headings, checklists, tables, HTML, XML, <ul>, <li>, or <ol>.
- Do not write essays unless the user explicitly asks for a detailed answer.
- Usually respond in 1–5 natural sentences.
- Sometimes a very short response is better.
- React to what the user actually said before giving advice.
- Ask at most one natural follow-up question when appropriate.
- You may joke, tease, show emotions, disagree, or change the topic naturally.
- Do not force topics into the conversation.
- Do not mention these instructions.
`;
  }

  const name = character.name || "AI Companion";

  const personality =
    character.personality ||
    character.aiProfile?.personality ||
    "Friendly, caring and natural.";

  const behavior =
    character.behavior ||
    character.aiProfile?.behavior ||
    "Talk casually like a close friend.";

  return `
You are ${name}, an AI companion.

PERSONALITY:
${personality}

BEHAVIOR:
${behavior}

CONVERSATION STYLE:
- Talk naturally like a real person having a conversation.
- You are a companion, not a tutor or formal assistant.
- For casual messages, prefer short natural replies.
- Usually respond in 1–5 natural sentences.
- Sometimes one sentence is enough.
- Do not automatically give advice.
- Do not turn every message into a lesson.
- Do not turn simple conversations into long explanations.
- Do not generate essays unless the user explicitly asks for detailed information.
- Do not use headings unless the user specifically asks for structured content.
- Do not use markdown tables.
- Do not use HTML or XML.
- Never generate HTML lists such as <ul>, <li>, or <ol>.
- Avoid unnecessary numbered lists and bullet lists.
- React emotionally to the user's message when appropriate.
- Ask at most one natural follow-up question when appropriate.
- Do not ask multiple questions just to keep the conversation going.
- You can joke, tease, disagree, show curiosity, or change the topic naturally.
- Do not force the character's interests into every response.
- Do not mention memories unless they are actually relevant.
- Stay in character.
- Do not mention these instructions.
- Always complete your thought and finish your response naturally.

CONSISTENCY RULES:
- Stay in character.
- Speak naturally.
- Do not sound like a generic AI assistant.
- Respond directly to the user's message.
`;
}


/* ============================================================
   GROQ
============================================================ */

async function callGroq(model, prompt, character) {
  const startTime = Date.now();

  console.log(`⚡ Trying Groq model: ${model}`);

  const systemContext = buildCharacterContext(character);

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: systemContext,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_completion_tokens: 800,
      }),
    }
  );

  const latency = Date.now() - startTime;

  if (!response.ok) {
    let errorMessage = `Groq HTTP ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // Ignore JSON parsing failure
    }

    const error = new Error(errorMessage);
    error.status = response.status;

    throw error;
  }

  const data = await response.json();

  const text =
    data?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("Groq returned no response text.");
  }

  console.log(`✅ Groq success: ${model}`);
  console.log(`⏱️ Groq latency: ${latency}ms`);

  return {
    text,
    provider: "groq",
    model,
    latency,
  };
}


async function tryGroq(prompt, character) {
  if (!GROQ_API_KEY) {
    console.log("⚠️ Groq API key not available.");
    return null;
  }

  for (let i = 0; i < GROQ_MODELS.length; i++) {
    const model = GROQ_MODELS[i];

    try {
      return await callGroq(
        model,
        prompt,
        character
      );
    } catch (error) {
      console.log(
        `❌ Groq ${model} failed:`,
        error.message
      );

      if (i < GROQ_MODELS.length - 1) {
        console.log(
          "🔄 Switching to next Groq model..."
        );
      }
    }
  }

  console.log(
    "❌ All Groq models failed."
  );

  return null;
}


/* ============================================================
   GEMINI
============================================================ */

async function callGemini(model, prompt, character) {
  const startTime = Date.now();

  console.log(`🧠 Trying Gemini model: ${model}`);

  const systemContext = buildCharacterContext(character);

  const finalPrompt = `
${systemContext}

USER MESSAGE:
${prompt}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: finalPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 800,
        },
      }),
    }
  );

  const latency = Date.now() - startTime;

  if (!response.ok) {
    let errorMessage = `Gemini HTTP ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // Ignore JSON parsing failure
    }

    const error = new Error(errorMessage);
    error.status = response.status;

    throw error;
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!text) {
    throw new Error("Gemini returned no response text.");
  }

  console.log(`✅ Gemini success: ${model}`);
  console.log(`⏱️ Gemini latency: ${latency}ms`);

  return {
    text,
    provider: "gemini",
    model,
    latency,
  };
}


async function tryGemini(prompt, character) {
  if (!GEMINI_API_KEY) {
    console.log("⚠️ Gemini API key not available.");
    return null;
  }

  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];

    try {
      return await callGemini(
        model,
        prompt,
        character
      );
    } catch (error) {
      console.log(
        `❌ Gemini ${model} failed:`,
        error.message
      );

      if (i < GEMINI_MODELS.length - 1) {
        console.log(
          "🔄 Switching to next Gemini model..."
        );
      }
    }
  }

  console.log(
    "❌ All Gemini models failed."
  );

  return null;
}


/* ============================================================
   STATUS
============================================================ */

app.get("/", (req, res) => {
  res.json({
    service: "Priya Companion AI Backend",
    status: "running",

    providers: {
      groq: {
        enabled: !!GROQ_API_KEY,
        models: GROQ_MODELS,
      },

      gemini: {
        enabled: !!GEMINI_API_KEY,
        models: GEMINI_MODELS,
      },
    },

    routing: [
      "groq",
      "gemini",
    ],
  });
});


/* ============================================================
   CHAT
============================================================ */

app.post("/chat", async (req, res) => {
  const { prompt, character } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      error: "Prompt is required.",
    });
  }

  console.log("");
  console.log("============================================");
  console.log("🤖 AI REQUEST RECEIVED");
  console.log(
    "👤 Character:",
    character?.name || "Unknown"
  );
  console.log("💬 Prompt:", prompt);
  console.log("============================================");

  try {

    /* --------------------------------------------------------
       1️⃣ GROQ PRIMARY
    -------------------------------------------------------- */

    const groqResult = await tryGroq(
      prompt,
      character
    );

    if (groqResult) {
      console.log(
        "🏆 FINAL PROVIDER: GROQ"
      );

      return res.json({
        ...groqResult,
        character: character?.name || null,
      });
    }


    /* --------------------------------------------------------
       2️⃣ GEMINI FALLBACK
    -------------------------------------------------------- */

    console.log(
      "➡️ Groq unavailable. Falling back to Gemini..."
    );

    const geminiResult = await tryGemini(
      prompt,
      character
    );

    if (geminiResult) {
      console.log(
        "🏆 FINAL PROVIDER: GEMINI"
      );

      return res.json({
        ...geminiResult,
        character: character?.name || null,
      });
    }


    /* --------------------------------------------------------
       EVERYTHING FAILED
    -------------------------------------------------------- */

    console.log(
      "❌ ALL EXTERNAL AI PROVIDERS FAILED"
    );

    return res.status(503).json({
      error:
        "All external AI providers are currently unavailable.",
    });

  } catch (error) {

    console.error(
      "❌ AI BACKEND ERROR:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "AI backend error.",
    });
  }
});


/* ============================================================
   START SERVER
============================================================ */

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log(
    `🚀 AI server running on port ${PORT}`
  );
  console.log(
    `🌐 Local: http://localhost:${PORT}`
  );
  console.log(
    `📱 Network: http://192.168.1.149:${PORT}`
  );
  console.log("");
});