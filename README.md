# Portfolio — Javier Giménez Garcés

[![Visual regression](https://github.com/JaviBite/portfolio/actions/workflows/playwright-visual.yml/badge.svg)](https://github.com/JaviBite/portfolio/actions/workflows/playwright-visual.yml)

> **Computer Vision & AI Engineer** — Personal branding site con chatbot de CV, Bento Grid de proyectos y diagrama de Home Lab interactivo.

---

## ✨ Features

- **Landing page** con hero animado (canvas), stack técnico por dominio, proyectos destacados, sección filosófica y diagrama interactivo del Home Lab
- **Living CV** (`/cv`) — CV web completo, optimizado para impresión PDF (`window.print()`)
- **Chatbot "Pregunta a mi CV"** — burbuja flotante en `/cv` (y página `/cv/chat`). Powered by OpenRouter (modelos gratis con fallback automático), 8 preguntas/sesión con contador visible; datos privados sanitizados en servidor antes de enviar a la API
- **Galería de proyectos** (`/projects`) — Bento Grid responsivo con 5 proyectos enterprise
- **Tema oscuro/claro** con detección automática de `prefers-color-scheme`
- **i18n ES/EN** con persistencia en cookie
- **Fuente de verdad única** en `lib/data.json` — un solo lugar para actualizar todo el contenido

---

## 🛠 Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14+ (App Router) |
| Estilos | Tailwind CSS + CSS Variables |
| Temas | next-themes |
| i18n | next-intl |
| Chatbot | OpenRouter (modelos `:free`, p. ej. `openai/gpt-oss-120b:free`) |
| Fuentes | Geist Sans + Geist Mono (local) |
| Deploy | Vercel |

---

## 🚀 Inicio rápido

### 1. Clonar e instalar

```bash
git clone https://github.com/javiergimenez/portfolio.git
cd portfolio
npm install
```

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` y añade tu clave:

```env
OPENROUTER_API_KEY=tu_api_key_aqui
# Opcional: fuerza un modelo concreto (por defecto se usa una lista con fallback)
# OPENROUTER_MODEL=openai/gpt-oss-120b:free
```

Obtén tu API key gratuita en [OpenRouter](https://openrouter.ai/keys). El chatbot usa modelos `:free` con fallback automático entre varios (hasta 3 intentos) por si alguno está saturado.

### 3. Desarrollo local

```bash
npm run dev
# → http://localhost:3000
```

### 4. Build de producción

```bash
npm run build
```

### 5. Tests visuales

Para regenerar las capturas de referencia en el mismo entorno Linux que usa CI:

```bash
npm run test:visual:update:linux
```

El script instala dependencias y también los navegadores de Playwright antes de ejecutar la actualización.

Si ejecutas sólo en macOS, las imágenes se generarán con sufijo `darwin` y pueden no coincidir con el repo de CI.

---

## 📦 Despliegue en Vercel

Vercel es el host recomendado: gestiona automáticamente las páginas estáticas **y** las serverless functions (ruta `/api/chat`), sin configuración adicional.

### Opción A — Dashboard (recomendado)

1. Push del repositorio a GitHub / GitLab
2. Importar en [vercel.com/new](https://vercel.com/new)
3. En **Environment Variables**, añadir:
   - `OPENROUTER_API_KEY` → tu API key de OpenRouter
   - *(opcional)* `OPENROUTER_MODEL` → modelo concreto, p. ej. `openai/gpt-oss-120b:free`
4. Clic en **Deploy** — listo

Vercel detecta Next.js automáticamente. No hace falta configurar nada más.

### Opción B — Vercel CLI

```bash
npm i -g vercel
vercel login

# Primera vez (sigue el wizard):
vercel

# Añadir variable de entorno:
vercel env add OPENROUTER_API_KEY production

# Deploy a producción:
vercel --prod
```

### Nota sobre `output: 'export'`

El `next.config.ts` **no usa `output: 'export'`** de forma predeterminada, porque eso impediría que la ruta `/api/chat` funcione como serverless function en Vercel.

Si necesitas desplegar en un host puramente estático (GitHub Pages, Cloudflare Pages, etc.) y renunciar al chatbot, descomenta la línea `output: "export"` en `next.config.ts`. En ese caso la ruta `/api/chat` deberá gestionarse de otra forma (e.g., llamada directa desde cliente o función Edge separada).

---

## 📁 Estructura del proyecto

```
portfolio/
├── app/
│   ├── layout.tsx            # Root layout — ThemeProvider + Navbar + fuentes Geist
│   ├── page.tsx              # Landing: Hero · Stack · Proyectos · Filosofía · HomeLab
│   ├── globals.css           # CSS variables, design tokens, dark/light mode
│   ├── projects/
│   │   └── page.tsx          # Galería Bento Grid (5 proyectos enterprise)
│   ├── cv/
│   │   ├── page.tsx          # Living CV con print support
│   │   └── chat/
│   │       └── page.tsx      # Chatbot UI (Client Component)
│   └── api/
│       └── chat/
│           └── route.ts      # Proxy OpenRouter — sanitiza data.json en servidor
├── components/
│   ├── ui/
│   │   ├── Navbar.tsx        # Toggles: tema · idioma · audio (easter egg)
│   │   └── ThemeProvider.tsx
│   ├── HeroSection.tsx       # Canvas animado (particle wave reactivo)
│   ├── StackSection.tsx      # Grid de stack técnico por dominio
│   ├── ProjectsPreview.tsx   # 3 tarjetas destacadas en landing
│   ├── HowIThink.tsx         # 4 bloques filosóficos
│   ├── HomeLab.tsx           # Diagrama de red interactivo
│   ├── CVPrintButton.tsx     # Botón print (Client Component aislado)
│   └── demos/                # (reservado — demos interactivas pendientes)
├── lib/
│   └── data.json             # ⚠️ FUENTE DE VERDAD — editar aquí
├── messages/
│   ├── es.json               # Traducciones español
│   └── en.json               # Traducciones inglés
├── i18n/
│   └── request.ts            # Configuración next-intl
├── .env.local.example        # Template de variables de entorno
└── PROJECT_SUMMARY.md        # Resumen técnico del proyecto
```

---

## ✏️ Personalización — `lib/data.json`

**Todo el contenido personal está en `lib/data.json`.** Edita ese archivo para actualizar:

- Datos de contacto (`email`, `linkedin`, `github`, `location`)
- Experiencia laboral y fechas
- Descripción de proyectos
- Formación académica
- Pista de audio para el easter egg (`music.track`, `music.bpm`)

El archivo **nunca se expone directamente al cliente**. La ruta `/api/chat` genera una versión sanitizada (sin teléfono ni dirección exacta) antes de enviarla al modelo.

---

## 🎨 Design Tokens

Todos los colores son variables CSS — nunca hardcodeados en componentes.

| Token | Dark | Light |
|-------|------|-------|
| `--bg` | `#080810` | `#f4f4f8` |
| `--text-primary` | `#E8E8F0` | `#0a0a14` |
| `--accent-cyan` | `#00f5ff` | `#0099cc` |
| `--accent-purple` | `#a855f7` | `#7c3aed` |
| `--surface-card` | `#0f0f1a` | `#ffffff` |

---

## 🗺 Roadmap

- [x] Setup Next.js + Tailwind + temas + i18n
- [x] Landing completa (Hero, Stack, Proyectos, Filosofía, HomeLab)
- [x] Living CV con print CSS
- [x] Chatbot en burbuja con rate limiting por sesión
- [x] Galería de proyectos Bento Grid
- [x] Build limpio, TypeScript sin errores
- [x] Demos interactivas (homografía JS, sliders, overlays de vídeo, log console simulado)
- [x] Easter egg musical (Web Audio API + AnalyserNode, glow reactivo al BPM)
- [ ] Animaciones Framer Motion
- [ ] Optimización Core Web Vitals

---

## 📄 Licencia

Uso personal — no reutilizar sin permiso.
