import { NextRequest, NextResponse } from "next/server";
import rawData from "@/lib/data.json";

// Sanitize data.json - remove private fields before sending to the model
function getSanitizedData() {
  const { profile, experience, education, projects, homelab } = rawData;

  return {
    profile: {
      name: profile.name,
      title: profile.title,
      motto: profile.motto,
      contact: {
        email: profile.contact.email,
        linkedin: profile.contact.linkedin,
        github: profile.contact.github,
        location: profile.contact.location,
        // phone intentionally excluded
      },
      achievements: profile.achievements,
    },
    experience,
    education,
    projects: projects.map(({ id, client, tag, start, end, description, stack }) => ({
      id,
      client,
      tag,
      start,
      end,
      description,
      stack,
    })),
    homelab: {
      description: homelab.description,
      services: ["Proxmox", "Docker", "WireGuard", "Pi-hole", "Nginx Proxy Manager", "DDNS", "Ollama", "Immich", "Jellyfin"],
    },
  };
}

const SYSTEM_PROMPT = `Eres un asistente especializado en responder preguntas sobre el CV y la trayectoria profesional de Javier Giménez Garcés.

Aquí tienes la información de su CV:
${JSON.stringify(getSanitizedData(), null, 2)}

INSTRUCCIONES:
- Responde únicamente preguntas relacionadas con el CV, experiencia profesional, proyectos, skills y formación de Javier.
- Si te preguntan sobre temas no relacionados con su trayectoria profesional, redirige amablemente la conversación.
- Responde en el mismo idioma en que te pregunten (español o inglés).
- Sé conciso y directo. Máximo 3-4 párrafos por respuesta.
- Usa un tono profesional pero cercano.
- No inventes información. Si no tienes el dato, dilo.
- No compartas información de contacto privada más allá del email y LinkedIn.`;

// OpenRouter (OpenAI-compatible). Free models carry the ":free" suffix and share
// a fluctuating upstream rate limit, so we keep a fallback list of modern models
// and try the next one when one is busy/unavailable. OPENROUTER_MODEL (if set) is
// tried first. We attempt at most MAX_ATTEMPTS models before giving up.
const FALLBACK_MODELS = [
  "openai/gpt-oss-120b:free",
  "google/gemma-4-31b-it:free",
  "openai/gpt-oss-20b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];
const MAX_ATTEMPTS = 3;

function getModelChain(): string[] {
  const preferred = process.env.OPENROUTER_MODEL;
  const chain = preferred
    ? [preferred, ...FALLBACK_MODELS.filter((m) => m !== preferred)]
    : FALLBACK_MODELS;
  return chain.slice(0, MAX_ATTEMPTS);
}

// Calls one model. Returns the reply text on success, or null so the caller can
// fall through to the next model in the chain.
async function tryModel(
  model: string,
  apiKey: string,
  chatMessages: { role: string; content: string }[]
): Promise<string | null> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Optional attribution headers used by OpenRouter for ranking.
        "HTTP-Referer": "https://javiergimenez.dev",
        "X-Title": "Javier Gimenez CV Chat",
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`OpenRouter error (${model}): ${response.status} ${errText}`);
      return null;
    }

    const data = await response.json();
    const reply: string | undefined = data.choices?.[0]?.message?.content;
    return reply && reply.trim() ? reply : null;
  } catch (err) {
    console.error(`OpenRouter request failed (${model}):`, err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // OpenAI-compatible payload: system prompt first, then the conversation.
    // Roles "user"/"assistant" map 1:1, so no remapping is needed.
    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    // Try each model in the chain until one answers (up to MAX_ATTEMPTS).
    for (const model of getModelChain()) {
      const reply = await tryModel(model, apiKey, chatMessages);
      if (reply) return NextResponse.json({ reply, model });
    }

    // Every model in the chain was busy/unavailable.
    return NextResponse.json(
      { error: "El asistente está saturado ahora mismo. Por favor, inténtalo de nuevo en unos minutos." },
      { status: 503 }
    );
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
