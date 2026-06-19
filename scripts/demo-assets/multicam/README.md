# Demo tracking multicámara — homografía real e interactiva

Assets para la tarjeta `tracking-stellantis` de `lib/data.json`. Reproduce, en
versión mínima y reproducible, el sistema real de **tracking multi-cámara →
plano 2D unificado mediante homografía**: varias cámaras ven el mismo suelo desde
ángulos distintos y un punto del plano se relaciona entre vistas con la homografía
suelo→imagen de cada cámara.

La clave para que sea **honesto** (no un mock como la versión anterior): la escena
se renderiza desde cámaras de **pose conocida**, así la homografía
`H` (worldNorm `[0,1]²` → píxel) de cada cámara es **exacta**, no inventada.

## Pipeline

1. `scene.html` — escena three.js (cargada desde CDN, sin añadir nada a
   `package.json`): un parking ficticio sobre el plano XZ (asfalto + líneas de
   aparcamiento como geometría fina perfectamente alineada + coches con volumen +
   farolas). Expone:
   - `window.__render(spec)` → renderiza una cámara/tema y devuelve `{dataURL, corners}`
     (las 4 esquinas de suelo proyectadas, ground-truth de three.js).
   - `window.__projectNorm(spec, gx, gy)` → proyecta un punto de suelo (para el test).
   - `applyTheme("day"|"night")` → ilumina la escena en versión clara/oscura.
2. `render.mjs` (Node + Playwright/Chromium) — para cada cámara (2 oblicuas
   perspectiva + 1 cenital ortográfica) y cada tema:
   - fija pose/fov/tamaño, renderiza, guarda el JPG;
   - deriva `H` y `Hinv` resolviendo la homografía de 4 puntos
     (`getPerspectiveTransform`) entre las esquinas worldNorm y sus píxeles.
   - Escribe `out/scene.json` (`ground` + `cameras[]` con `H`, `Hinv`, dims, rutas bg).
3. `verify.mjs` — comprueba que `H` reproduce la proyección de three.js para puntos
   interiores arbitrarios (error sub-píxel ⇒ homografía exacta y consistente con el render).

## Uso

```bash
cd scripts/demo-assets
./multicam/preview.sh            # renderiza a multicam/out/
./multicam/preview.sh promote    # + publica a public/demos/multicam-tracking/ y components/demos/multicam-scene.json
node multicam/verify.mjs         # test de exactitud de la homografía
```

`scene.json` se publica como `components/demos/multicam-scene.json` y se **importa**
en `MultiCamTracking.tsx` (sin fetch en runtime). Los fondos van a
`public/demos/multicam-tracking/{cam-a,cam-b,topdown}-{day,night}.jpg`.

## Ajustes

- **Cámaras / encuadre**: edita `CAMERAS` en `render.mjs` (`pos`, `target`, `fov`,
  tamaño). Si cambias el rig, replica los specs en `verify.mjs`. El generador y el
  frontend no necesitan más cambios: las nuevas `H`/dims viajan en `scene.json`.
- **Escena** (parking, coches, farolas, día/noche): todo en `scene.html`.
- **Tema**: día → `bg.light`, noche → `bg.dark`. Las matrices son compartidas (la
  geometría no cambia entre temas), así el punto cuadra en ambos.

## Notas

- No usa el venv de Python ni `requirements.txt`; es 100% Node/Playwright + three.js (CDN).
- Si Chromium no está instalado para Playwright: `npx playwright install chromium`.
- `out/` está cubierto por `.gitignore` (como el resto de intermedios); solo se
  versionan los scripts, los JPG finales en `public/` y `multicam-scene.json`.
