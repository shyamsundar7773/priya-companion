export type AIProvider =
  | "groq"
  | "gemini";

export type AIProviderRequest = {
  prompt: string;
  character?: any;
};

export type AIProviderResponse = {
  text: string;
  provider: AIProvider;
  model?: string;
  character?: string;
  latency?: number;
};


/* ============================================================
   BACKEND
============================================================ */

const BACKEND_URL =
  "http://192.168.1.149:3000";


/* ============================================================
   GENERATE AI RESPONSE
============================================================ */

export async function generateAIResponse(
  request: AIProviderRequest
): Promise<AIProviderResponse> {

  const {
    prompt,
    character,
  } = request;


  console.log(
    "🌐 AI BACKEND REQUEST"
  );

  console.log(
    "👤 CHARACTER:",
    character?.name ||
    "Unknown"
  );


  const startTime =
    Date.now();


  const response =
    await fetch(
      `${BACKEND_URL}/chat`,
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({

          prompt,

          character,

        }),

      }
    );


  const latency =
    Date.now() - startTime;


  if (!response.ok) {

    let errorMessage =
      `AI backend error: ${response.status}`;

    try {

      const errorData =
        await response.json();

      if (errorData?.error) {

        errorMessage =
          errorData.error;

      }

    } catch {

      // Ignore JSON parsing error

    }

    throw new Error(
      errorMessage
    );
  }


  const data =
    await response.json();


  if (!data.text) {

    throw new Error(
      "AI backend returned no response."
    );

  }


  console.log(
    "🤖 AI PROVIDER:",
    data.provider
  );

  console.log(
    "🧠 MODEL:",
    data.model
  );

  console.log(
    "⏱️ TOTAL MOBILE→BACKEND LATENCY:",
    `${latency}ms`
  );

  console.log(
    "⏱️ MODEL LATENCY:",
    `${data.latency || "unknown"}ms`
  );


  return {

    text:
      data.text,

    provider:
      data.provider,

    model:
      data.model,

    character:
      data.character,

    latency:
      data.latency ||
      latency,

  };

}