# Especificación Técnica v2.1 — Portfolio Javier Giménez

> **Documento maestro para el agente de código.**  
> Seguir estrictamente el orden del [Roadmap](#9-roadmap-de-desarrollo). Antes de implementar cualquier sección con contenido real, identificar todos los campos `[PENDIENTE]` del `data.json` y solicitarlos al usuario de forma estructurada.

---

## 1. Objetivos y Audiencia

| Campo | Valor |
|---|---|
| **Propósito** | Personal branding y visibilidad profesional |
| **Audiencia** | Recruiters/headhunters · Empresas tech · Corporaciones enterprise |
| **Mensaje central** | Ingeniero de CV e IA con criterio técnico real, experiencia en producción y capacidad de trabajar en la frontera tecnológica |

---

## 2. Stack Tecnológico y Arquitectura

| Capa | Tecnología |
|---|---|
| **Framework** | Next.js 14+ — App Router · `output: 'export'` para despliegue estático en Vercel |
| **IA Chatbot** | Google Gemini API (`gemini-1.5-flash`) — Free Tier · límite 5–10 preguntas/sesión |
| **Audio** | Web Audio API + `AnalyserNode` (Vibe Mode reactivo) |
| **Estilos** | Tailwind CSS + Framer Motion |
| **i18n** | `next-intl` con diccionarios JSON (ES / EN) |
| **Temas** | `next-themes` (oscuro / claro) |

---

## 3. Guía de Estilo y UX

### 3.1 Temática

**"Precision Engineering"** — minimalismo técnico de alta gama. Sobrio y legible por defecto; la personalidad emerge progresivamente al explorar, nunca interrumpe la primera impresión.

### 3.2 Paleta de Color

Todos los colores deben definirse como **variables CSS o tokens Tailwind**. Nunca hardcodeados en componentes.

| Token | Modo Oscuro | Modo Claro |
|---|---|---|
| `--bg` | `#080810` | `#f4f4f8` |
| `--text-primary` | `#E8E8F0` | `#0a0a14` |
| `--accent-cyan` | `#00f5ff` | `#0099cc` |
| `--accent-purple` | `#a855f7` | `#7c3aed` |
| `--surface-card` | `#0f0f1a` | `#ffffff` |

- `--accent-cyan` → acento principal (CTAs, links, highlights dominantes)  
- `--accent-purple` → acento secundario (tags, indicadores, detalles)

### 3.3 Tipografía

| Uso | Fuente |
|---|---|
| UI general | Geist Sans |
| Datos técnicos, métricas, código | Geist Mono |

### 3.4 Controles Globales (Navbar)

Tres toggles visibles en la barra de navegación:

- 🌐 **Idioma:** ES / EN
- 🌙 **Tema:** Oscuro / Claro (icono luna/sol, detecta `prefers-color-scheme` por defecto)
- 🎵 **Audio:** Off / Play (easter egg musical, icono sutil)

### 3.5 Easter Egg Musical

Al activar "Play", la interfaz reacciona al ritmo mediante análisis de frecuencias en tiempo real (`AnalyserNode`): glow pulsante en bordes y ecualizadores visuales sutiles en el header. Debe ser compatible con ambos modos de color y no interferir con la usabilidad.

---

## 4. Estructura de Navegación

Rutas estáticas pre-renderizadas (`output: 'export'`), desplegadas en Vercel:

```
/              → Landing (Hero · Stack · Proyectos destacados · How I Think · Home Lab)
/projects      → Galería Bento Grid completa
/cv            → Living CV
/cv/chat       → Chatbot "Pregunta a mi CV"
```

---

## 5. Secciones de la Landing (`/`)

### 5.1 Hero

- Nombre, título (`Computer Vision & AI Engineer`), lema
- CTAs: **Ver Proyectos** (`/projects`) y **Ver CV** (`/cv`)
- Indicador sutil del easter egg musical

### 5.2 Stack & Expertise

Grid escaneable por dominio. Objetivo: recruiter obtiene información clave en ≤15 segundos.

| Dominio | Tecnologías |
|---|---|
| **Computer Vision** | OpenCV · SAM · YOLO · FFmpeg · Tracking multi-cámara · Homografía · Saliency Detection |
| **AI / ML** | PyTorch · Whisper · KNN · Embeddings · Compresión de modelos (CompactifAI) |
| **Infraestructura** | Docker · Proxmox · Nginx · WireGuard · CI/CD |
| **Lenguajes** | Python · C++ · JavaScript / TypeScript |

### 5.3 Proyectos Destacados

Versión compacta del Bento Grid (3–4 tarjetas). CTA a `/projects`.

### 5.4 How I Think

3–4 bloques cortos de texto en primera persona. Ángulos sugeridos:

- Preferencia por soluciones que funcionan en producción sobre las que funcionan en papers
- El puente entre investigación y entrega real como habilidad diferencial
- Criterio para decidir cuándo usar IA y cuándo no hace falta

> ⚠️ **Contenido textual exacto: `[PENDIENTE]` — solicitar al usuario antes de implementar.**

### 5.5 Side Projects & Home Lab

Sección al final de la landing, visualmente diferenciada de los proyectos profesionales. Incluye diagrama de red interactivo del Home Lab. Espacio reservado para futuros side projects.

**Arquitectura del Home Lab:**

```
Proxmox
└── Docker
│   ├── WireGuard
│   ├── Pi-hole
│   ├── Nginx Proxy Manager
│   └── DDNS
├── Ollama
├── Immich
└── Jellyfin
```

---

## 6. Galería de Proyectos (`/projects`)

**Layout:** Bento Grid responsivo. Cada tarjeta muestra: cliente/contexto (sin datos confidenciales), stack técnico y demo interactiva o visualización.

### 6.1 Estrategia de Demos (sin servidor de inferencia)

| Tipo de demo | Implementación |
|---|---|
| Video con detecciones | Metadatos JSON pre-renderizados sincronizados con `currentTime` |
| Comparación visual | Slider con imágenes `.webp` pre-calculadas |
| Tracking en mapa | Homografía calculada en JS con matrices 3×3 pre-definidas |
| Carga de assets pesados | Skeletons de carga (`loading.tsx`) mientras llegan los JSON |

Todos los componentes de demo van en `/components/demos/` como archivos independientes.

### 6.2 Proyectos

#### A — Monitorización Logística & Capacidad · *Würth* `[Enterprise]`

**Stack:** C++ · OpenCV · SAM · Background Subtraction

| Demo | Descripción |
|---|---|
| **Atascos** | Video con overlay de bounding boxes. Si el objeto obstruye la línea → recuadro pasa de verde a rojo parpadeante |
| **Capacidad** | Slider original vs. máscara semántica SAM. Calcula % de superficie libre corrigiendo perspectiva |

---

#### B — Tracking Multi-cámara & Homografía · *Stellantis* `[Enterprise]`

**Stack:** Python · OpenCV · Homografía · Background Subtraction

| Demo | Descripción |
|---|---|
| **Multicámara** | 3 paneles: Cámara A · Cámara B · Mapa 2D. Movimiento del vehículo en cámaras → punto actualizado en mapa mediante matrices de homografía pre-definidas |

---

#### C — Análisis Aéreo Semántico · *GIS Madrid* `[Enterprise]`

**Stack:** SAM Visual Encoder · Cosine Similarity

| Demo | Descripción |
|---|---|
| **Heatmap** | Slider con heatmap de diferencias (transparencia 50%), resistente a cambios de luz y sombras |

---

#### D — Identificación Biométrica · *Administración Pública* `[Enterprise]`

**Stack:** Face Recognition · KNN

| Demo | Descripción |
|---|---|
| **Log Console** | Feed simulado con consola de logs mostrando extracción de feature vectors y matching de IDs en tiempo real |

---

#### E — Smart Crop / AutoFlip · *VIC, EITB* `[Enterprise]`

**Stack:** Whisper (ASR) · NLP · Tracking · Saliency Detection · FFmpeg

| Demo | Descripción |
|---|---|
| **Saliency Slider** | Slider con Saliency Map superpuesto sobre video 16:9. Recuadro 9:16 siguiendo la trayectoria calculada |

---

## 7. Living CV (`/cv`)

CV web completo que sustituye al PDF. Optimizado para `window.print()` (blanco y negro, QR a demos).

**Incluye posición actual en Multiverse Computing:** rol Pre-sales Engineer / Solution Architect, descripción de CompactifAI y trabajo de compresión de LLMs, YOLO y Whisper con tecnología quantum-inspired.

> ⚠️ **Contenido completo: `[PENDIENTE]` — ver `data.json`.**

### 7.1 Chatbot "Pregunta a mi CV" (`/cv/chat`)

| Parámetro | Valor |
|---|---|
| **Modelo** | `gemini-1.5-flash` |
| **Límite de sesión** | 5–10 preguntas (contador visible en UI; al agotarse → mensaje invitando a contactar) |
| **Privacidad** | El servidor genera versión sanitizada de `data.json` sin teléfono ni dirección exacta antes de enviarla a la API (`/api/chat`) |
| **Scope** | System prompt restringe respuestas al CV y trayectoria profesional únicamente |
| **Rate limiting** | Contador de sesión en `localStorage` (cliente) |

---

## 8. Estructura de Datos (`data.json`)

> ⚠️ **Este esqueleto está incompleto por diseño.**  
> El agente debe identificar todos los campos `[PENDIENTE]` y solicitarlos al usuario antes de implementar cualquier sección dependiente de contenido real. Los campos marcados `[PRIVADO]` nunca deben exponerse al cliente ni enviarse a la API de Gemini.

```json
{
  "profile": {
    "name": "Javier Giménez Garcés",
    "title": "Computer Vision & AI Engineer",
    "motto": "No veo problemas, solo soluciones",
    "contact": {
      "email": "[PENDIENTE]",
      "linkedin": "[PENDIENTE]",
      "github": "[PENDIENTE]",
      "phone": "[PRIVADO — nunca exponer al cliente]",
      "location": "[PENDIENTE — solo ciudad/país, no dirección exacta]"
    },
    "achievements": [
      "1º Premio Physicathon 2020",
      "Top 25% Hashcode Google 2020"
    ],
    "music": {
      "track": "[PENDIENTE — nombre del archivo .mp3]",
      "bpm": "[PENDIENTE]"
    }
  },
  "experience": [
    {
      "company": "Multiverse Computing",
      "role": "Pre-sales Engineer / Solution Architect",
      "start": "[PENDIENTE]",
      "end": null,
      "current": true,
      "description": "[PENDIENTE]",
      "stack": ["CompactifAI", "[PENDIENTE]"]
    }
  ],
  "education": [
    {
      "institution": "[PENDIENTE]",
      "degree": "Ingeniería Informática",
      "start": "[PENDIENTE]",
      "end": "[PENDIENTE]"
    },
    {
      "institution": "[PENDIENTE]",
      "degree": "Máster en Robótica, Computer Vision y Gráficos",
      "start": "[PENDIENTE]",
      "end": "[PENDIENTE]"
    }
  ],
  "projects": [
    {
      "id": "logistics-wurth",
      "client": "Würth",
      "tag": "Enterprise",
      "start": "[PENDIENTE]",
      "end": "[PENDIENTE]",
      "description": "[PENDIENTE]",
      "stack": ["C++", "OpenCV", "SAM", "Background Subtraction"],
      "demos": ["congestion-overlay", "capacity-slider"]
    },
    {
      "id": "tracking-stellantis",
      "client": "Stellantis",
      "tag": "Enterprise",
      "start": "[PENDIENTE]",
      "end": "[PENDIENTE]",
      "description": "[PENDIENTE]",
      "stack": ["Python", "OpenCV", "Homography"],
      "matrices": {
        "cam_a": [[1.2, 0.2, 100], [0.1, 1.1, 50], [0, 0, 1]],
        "cam_b": "[PENDIENTE]"
      },
      "demos": ["multicam-homography"]
    },
    {
      "id": "aerial-gis-madrid",
      "client": "GIS Madrid",
      "tag": "Enterprise",
      "start": "[PENDIENTE]",
      "end": "[PENDIENTE]",
      "description": "[PENDIENTE]",
      "stack": ["SAM", "Cosine Similarity"],
      "demos": ["heatmap-slider"]
    },
    {
      "id": "biometric-id",
      "client": "Administración Pública",
      "tag": "Enterprise",
      "start": "[PENDIENTE]",
      "end": "[PENDIENTE]",
      "description": "[PENDIENTE]",
      "stack": ["Face Recognition", "KNN"],
      "demos": ["log-console"]
    },
    {
      "id": "smartcrop-autoflip",
      "client": "VIC, EITB",
      "tag": "Enterprise",
      "start": "[PENDIENTE]",
      "end": "[PENDIENTE]",
      "description": "[PENDIENTE]",
      "stack": ["Whisper", "NLP", "Tracking", "Saliency Detection", "FFmpeg"],
      "demos": ["saliency-slider"]
    }
  ],
  "homelab": {
    "description": "[PENDIENTE]",
    "nodes": [
      {
        "name": "Proxmox",
        "children": [
          {
            "name": "Docker",
            "services": ["WireGuard", "Pi-hole", "Nginx Proxy Manager", "DDNS"]
          },
          { "name": "Ollama" },
          { "name": "Immich" },
          { "name": "Jellyfin" }
        ]
      }
    ]
  }
}
```

---

## 9. Roadmap de Desarrollo

Seguir este orden estrictamente. No avanzar a una fase sin tener la anterior funcional.

| Fase | Descripción |
|---|---|
| **1. Setup** | Entorno Next.js · `output: 'export'` · Fuentes Geist · `next-intl` (ES/EN) · `next-themes` (oscuro/claro) · Variables CSS de paleta · Estructura de rutas |
| **2. Living CV** | Maquetación `/cv` · Chatbot Gemini con límite de sesión · Sanitización de `data.json` en servidor (`/api/chat`) |
| **3. Landing** | Hero · Stack & Expertise · How I Think · Home Lab (diagrama interactivo) |
| **4. Assets de demos** | Scripts Python offline para generar metadatos JSON y heatmaps `.webp` |
| **5. Demos interactivas** | Motor de homografía en JS · Sliders · Overlays de video · Skeletons de carga |
| **6. Easter egg musical** | Web Audio API + `AnalyserNode` · Compatible con ambos temas |
| **7. Pulido y despliegue** | Animaciones Framer Motion · Core Web Vitals · Vercel |

---

## 10. Directrices para el Agente de Código

### Prioridad máxima

- **Recopilar datos antes de implementar.** Identificar todos los `[PENDIENTE]` del `data.json` y pedirlos al usuario de forma estructurada antes de maquetar cualquier sección con contenido real.
- **Respetar el orden del Roadmap.** No saltar fases.

### Arquitectura y código

- Componentes de demos en `/components/demos/` como archivos independientes.
- Sistema de temas con `next-themes`. Todos los colores via variables CSS o tokens Tailwind — **nunca hardcodeados**.
- El `data.json` completo **nunca** se expone al cliente. El endpoint `/api/chat` genera una versión sanitizada en servidor antes de llamar a Gemini.

### Rendimiento

- Assets en formato `.webp`.
- Animaciones Framer Motion sin penalizar Core Web Vitals (usar `will-change` con criterio, preferir `transform` y `opacity`).
- Skeletons de carga para todos los assets JSON pesados de las demos.

### Rate limiting del chatbot

- Contador de sesión en `localStorage` (cliente).
- Fallback en headers si se requiere mayor robustez en el futuro.
