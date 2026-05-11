import { NextRequest, NextResponse } from "next/server";
import rawData from "@/lib/data.json";

// Sanitize data.json - remove private fields before sending to Gemini
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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Build Gemini request
    const geminiMessages = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })
    );

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: "Gemini API error" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Lo siento, no he podido generar una respuesta.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
