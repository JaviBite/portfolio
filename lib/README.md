# `lib/` — Fuente de datos del portfolio

Esta carpeta contiene **toda la información que se muestra en el sitio** y la lógica
para traducirla. Editando `data.json` cambias el contenido del portfolio sin tocar
componentes.

| Archivo | Qué es |
|---------|--------|
| [`data.json`](./data.json) | Única fuente de verdad: perfil, experiencia, formación, skills, proyectos, homelab. |
| [`useData.ts`](./useData.ts) | Hook que lee `data.json`, aplica el idioma activo y devuelve los datos ya traducidos. |

---

## Campos bilingües

Casi cualquier texto visible puede ser **monolingüe** (un `string`) o **bilingüe**
(un objeto `{ "es": ..., "en": ... }`):

```jsonc
"title": { "es": "Ingeniero Informático", "en": "Computer Science Engineer" }
// o, si no necesitas traducción:
"company": "Multiverse Computing"
```

`useData()` resuelve esto automáticamente según el idioma activo
([`i18n/LocaleContext`](../i18n/LocaleContext.tsx)). Orden de fallback: idioma
actual → `en` → `es`. **No accedas a `data.json` directamente desde los componentes**:
usa siempre `useData()` para que las traducciones se apliquen.

```tsx
import { useData } from "@/lib/useData";
const data = useData(); // data.profile.title ya es un string en el idioma activo
```

---

## Estructura de `data.json`

### `profile`

Datos personales y de cabecera (hero).

```jsonc
"profile": {
  "name": "JAVIER GIMÉNEZ GARCÉS",
  "title": { "es": "...", "en": "..." },        // bilingüe
  "birthDate": "25-08-1998",                     // DD-MM-YYYY
  "portrait": "/portrait.jpg",                    // ruta en /public
  "motto": { "es": "...", "en": "..." },          // bilingüe
  "availability": { ... },                        // ver abajo
  "cvLastUpdated": { "es": "junio 2026", "en": "June 2026" }, // fecha del "Living CV"
  "contact": {
    "email": "...",
    "linkedin": "...",
    "github": "...",
    "website": "...",
    "location": "..."
  },
  "bio": { "es": "...", "en": "..." },            // bilingüe
  "achievements": [ { "es": "...", "en": "..." } ] // lista bilingüe
}
```

#### `profile.availability` — badge de disponibilidad del hero

Controla el badge animado de la página principal (color del punto, borde y texto).

```jsonc
"availability": {
  "status": "available",
  "label": { "es": "Disponible para proyectos", "en": "Available for projects" }
}
```

| `status` | Color | Significado |
|----------|-------|-------------|
| `available` | 🟢 Verde | Disponible para trabajar |
| `working` | 🔵 Azul | Trabajando bien |
| `looking` | 🟡 Amarillo | Trabajando pero buscando |

- `label` es texto libre y bilingüe — escribe lo que quieras.
- Si `status` no es uno de los tres valores, se usa `available` (verde) por defecto.
- Los colores se definen en [`app/globals.css`](../app/globals.css) (clases
  `.hero-badge--available` / `--working` / `--looking`) y se renderizan en
  [`components/HeroSection.tsx`](../components/HeroSection.tsx).

#### `profile.cvLastUpdated` — fecha del "Living CV"

Texto bilingüe con la fecha que aparece en la cabecera del CV
(`LIVING CV — actualizado <fecha>`). Incluye mes y año:

```jsonc
"cvLastUpdated": { "es": "junio 2026", "en": "June 2026" }
```

El prefijo (`LIVING CV — actualizado` / `updated`) vive en
[`messages/es.json`](../messages/es.json) y [`messages/en.json`](../messages/en.json)
(`cv.subtitle`); aquí solo se configura la fecha. Se renderiza en
[`app/cv/page.tsx`](../app/cv/page.tsx).

---

### `experience`

Lista de empresas. Cada empresa agrupa uno o varios `roles` (útil para promociones
dentro de la misma compañía).

```jsonc
{
  "company": "ETIQMEDIA",
  "logo": "/logos/etiq.jpeg",      // ruta en /public
  "website": "https://...",
  "roles": [
    {
      "role": { "es": "...", "en": "..." },        // bilingüe
      "start": "Diciembre 2022",                    // texto libre
      "end": "Enero 2026",                          // null si es el actual
      "current": false,                             // true => rol vigente
      "location": "Zaragoza, España",
      "description": { "es": "...", "en": "..." },  // bilingüe, detalle largo
      "summary": { "es": "...", "en": "..." },      // bilingüe, resumen corto
      "stack": ["C++", "TensorRT", "..."]           // tecnologías
    }
  ]
}
```

---

### `education`

```jsonc
{
  "institution": "Universidad de Zaragoza",
  "degree": { "es": "...", "en": "..." },           // bilingüe
  "specialization": { "es": "...", "en": "..." },   // opcional, bilingüe
  "start": "Septiembre 2020",
  "end": "Febrero 2022",
  "location": "Zaragoza, España"
}
```

---

### `languages`

```jsonc
{
  "language": { "es": "Inglés (B2)", "en": "English (B2)" }, // bilingüe
  "level": 4,                                                // 1–5 (para barras/estrellas)
  "note": { "es": "...", "en": "..." }                       // opcional, bilingüe
}
```

---

### `skills`

Lista de categorías. Cada categoría tiene `items`, que pueden mezclar **tres formatos**:

```jsonc
{
  "category": { "es": "Lenguajes", "en": "Languages" },
  "items": [
    { "name": "C++", "level": 5 },          // 1) con nivel (1–5)
    "Docker",                                // 2) string simple
    { "es": "Agentes", "en": "Agents" }      // 3) bilingüe sin nivel
  ]
}
```

`useData()` distingue automáticamente entre los tres: si el item tiene `name`/`level`
se deja tal cual; si es un objeto `{es, en}` se traduce; si es string se devuelve igual.

---

### `howIThink`

Bloques de filosofía/forma de trabajar.

```jsonc
{
  "title": { "es": "...", "en": "..." },   // bilingüe
  "body": { "es": "...", "en": "..." }     // bilingüe
}
```

---

### `projects`

Tarjetas de proyecto del grid. Campos de contenido + campos de **layout/demo**.

```jsonc
{
  "id": "logistics-wurth",                          // identificador único
  "client": "Würth",                                // string o bilingüe
  "tag": { "es": "Logística", "en": "Logistics" },  // bilingüe
  "start": { "es": "ene. 2023", "en": "Jan 2023" }, // string o bilingüe
  "end":   { "es": "oct. 2023", "en": "Oct 2023" }, // string o bilingüe
  "description": { "es": "...", "en": "..." },      // bilingüe
  "stack": ["C++", "OpenCV", "..."],
  "category": "enterprise",                         // "enterprise" | "personal"

  // --- Demo interactiva (opcional) ---
  "demos": ["congestion-overlay", "capacity-slider"], // ids de sub-demos
  "demo": { "type": "warehouse", "badge": "..." },    // config; ver tipos abajo
  "video": "safNIpLHFg4",                             // id de YouTube (opcional)
  "status": "wip",                                    // "wip" => tarjeta "Próximamente"

  // --- Layout en el grid ---
  "gridSpan": 8,            // columnas que ocupa (de 12)
  "gridRowSpan": 1,         // filas que ocupa
  "demoPercentage": 60,     // % de la tarjeta dedicado a la demo
  "layout": "horizontal-right" // posición de la demo: horizontal-left/right, vertical-bottom
}
```

**Tipos de `demo.type`** (renderizados por [`components/demos/`](../components/demos/)):

| `type` | Demo | Campos extra relevantes |
|--------|------|--------------------------|
| `warehouse` | Detección de atascos | `badge` |
| `multicam` | Tracking multicámara | — |
| `compare` | Slider antes/después | `before`, `after`, `afterClean`, `toggleLabel`, `initial` |
| `video` | Vídeo local | `src`, `poster`, `autoPlay`, `fit`, `fitPosition` |
| `network` | Topología homelab | `badge` |

Las rutas de imágenes/vídeos (`src`, `poster.src`, etc.) apuntan a `/public`
(p. ej. `/demos/gis-madrid/plaza-espana-2019.jpg`). Incluye siempre `alt` descriptivo.

---

### `homelab`

Datos del diagrama de infraestructura self-hosted.

```jsonc
"homelab": {
  "description": { "es": "...", "en": "..." },  // bilingüe
  "nodes": [
    {
      "name": "Proxmox",
      "children": [
        { "name": "Docker", "services": ["WireGuard", "Pi-hole", "..."] },
        { "name": "Ollama" }
      ]
    }
  ]
}
```

---

## Cómo editar — checklist

1. Edita [`data.json`](./data.json) respetando el formato (texto bilingüe vs. string).
2. Si añades un campo **nuevo** que debe traducirse, recuerda mapearlo en
   [`useData.ts`](./useData.ts) con `getTranslated(...)`.
3. Las imágenes/recursos van en [`public/`](../public/); en el JSON se referencian
   con ruta absoluta desde la raíz (`/logos/...`, `/demos/...`).
4. Verifica que el JSON es válido y que compila:
   ```bash
   npx tsc --noEmit
   ```
