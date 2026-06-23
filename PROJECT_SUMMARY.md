# PROJECT_SUMMARY.md
# Portfolio Javier Giménez — Resumen Técnico

## Estado del proyecto

**Build**: ✅ Compila limpio sin errores TypeScript  
**Rutas**: 6 rutas correctamente configuradas  
**Deploy**: Listo para Vercel (push + añadir OPENROUTER_API_KEY)

---

## Arquitectura

```
Next.js 14 (App Router)
├── Páginas estáticas (SSG): /, /projects, /cv
├── Client Components: CVChatBubble (burbuja flotante en /cv), /cv/chat, HeroSection, HomeLab, StackSection, ProjectsPreview
└── Serverless Function: /api/chat (OpenRouter proxy con sanitización + fallback de modelos)
```

## Rutas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/` | Static (SSG) | Landing: Hero · Stack · Proyectos · Filosofía · HomeLab |
| `/projects` | Client | Galería Bento Grid — 5 proyectos enterprise |
| `/cv` | Static (SSG) | Living CV con print support |
| `/cv` | — | Chatbot como burbuja flotante (`CVChatBubble`) |
| `/cv/chat` | Client | Chatbot UI standalone (localStorage rate limit) |
| `/api/chat` | Serverless | Proxy OpenRouter — sanitiza data.json + fallback de modelos |
| `/_not-found` | Static | 404 page |

## Diseño — Paleta de color

Todos los colores son **CSS variables**, nunca hardcodeados en componentes.

| Token | Dark | Light |
|-------|------|-------|
| `--bg` | `#080810` | `#f4f4f8` |
| `--text-primary` | `#E8E8F0` | `#0a0a14` |
| `--accent-cyan` | `#00f5ff` | `#0099cc` |
| `--accent-purple` | `#a855f7` | `#7c3aed` |
| `--surface-card` | `#0f0f1a` | `#ffffff` |

## Fuente de verdad

`lib/data.json` — toda la información del portfolio en un único archivo.  
El endpoint `/api/chat` genera una versión sanitizada (excluye `phone`) antes de enviarla al modelo.

## Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `OPENROUTER_API_KEY` | OpenRouter API Key (modelos `:free`) | Sí, para el chatbot |
| `OPENROUTER_MODEL` | Modelo a forzar (si se omite, lista con fallback) | No |

## Seguridad del chatbot

- **Sanitización server-side**: `phone` y cualquier campo privado eliminados antes de llamar al modelo
- **Rate limiting cliente**: contador en `localStorage`, máximo 8 preguntas/sesión
- **Scope restringido**: system prompt limita respuestas al CV y trayectoria profesional
- **Modelos**: OpenRouter `:free` con fallback automático (hasta 3 intentos); por defecto `openai/gpt-oss-120b:free`, luego `google/gemma-4-31b-it:free`, `openai/gpt-oss-20b:free`…

## Componentes implementados

| Componente | Tipo | Descripción |
|------------|------|-------------|
| `Navbar` | Client | Toggles tema / idioma / audio (easter egg) |
| `HeroSection` | Client | Canvas animado con particle wave |
| `StackSection` | Client | Grid por dominio técnico con hover effects |
| `ProjectsPreview` | Client | 3 tarjetas en landing con color por cliente |
| `HowIThink` | Server | 4 bloques filosóficos |
| `HomeLab` | Client | Árbol de red interactivo + panel de servicios |
| `CVPrintButton` | Client | Aislado para no contaminar el Server Component del CV |

## Campos a completar en data.json

Antes del despliegue en producción, sustituir los valores placeholder:

```
profile.contact.email          → email real
profile.contact.linkedin       → URL LinkedIn real
profile.contact.github         → URL GitHub real
profile.contact.location       → ciudad/país real
profile.music.track            → nombre del archivo .mp3 en /public/audio/
profile.music.bpm              → BPM de la pista
projects[*].start / .end       → fechas reales de cada proyecto
projects.tracking-stellantis
  .matrices.cam_b              → matriz de homografía real
```

## Roadmap (fases pendientes)

### Fase 4 — Assets de demos
Scripts Python offline para generar:
- Metadatos JSON sincronizados con vídeo (bounding boxes, timestamps)
- Heatmaps `.webp` pre-calculados para sliders
- Guardar en `/public/demos/[project-id]/`

### Fase 5 — Demos interactivas
Componentes en `/components/demos/`:
- `CongestionOverlay.tsx` — vídeo + bounding boxes JSON sincronizados
- `CapacitySlider.tsx` — slider imagen original vs máscara SAM
- `MulticamHomography.tsx` — 3 paneles + mapa 2D con matrices JS
- `HeatmapSlider.tsx` — slider diferencias aéreas con transparencia
- `BiometricLogConsole.tsx` — feed simulado de feature vectors
- `SaliencySlider.tsx` — saliency map + recuadro 9:16 dinámico

### Fase 6 — Easter egg musical
- `AudioEngine.tsx` (Client) — Web Audio API + AnalyserNode
- Glow pulsante en bordes del hero reactivo al BPM
- Ecualizador visual sutil en el header
- Compatible dark/light mode

### Fase 7 — Pulido y despliegue
- Animaciones Framer Motion (staggered reveals en secciones)
- Core Web Vitals: LCP < 2.5s, CLS < 0.1
- `will-change: transform` solo donde sea necesario
- Vercel Analytics
