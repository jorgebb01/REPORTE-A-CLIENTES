# REPORTE A CLIENTES — Informes Técnicos Automotrices

Aplicación web con arquitectura **MVC** para que los asesores de una concesionaria
generen **informes técnicos automotrices** formales, profesionales y legalmente
preventivos para sus clientes. Los datos de la atención del vehículo se envían a
**Claude**, que redacta el informe siguiendo **estrictamente** un formato corporativo
único, igual para todos los asesores y todos los clientes.

El documento resultante sirve como respaldo técnico, administrativo y preventivo ante
consultas, reclamaciones administrativas o procesos legales en Costa Rica.

---

## ¿Qué incluye?

| Pieza | Ubicación | Para qué |
|---|---|---|
| Aplicación web MVC | `src/` + `server.js` | Formulario de datos → informe redactado por Claude → descarga en Word |
| Skill de Claude Code | `.claude/skills/informe-tecnico-automotriz/` | Mismo informe, mismo formato, desde la terminal con `/informe-tecnico-automotriz` |
| Prompt canónico | `src/prompts/systemPrompt.js` | Única fuente de verdad del comportamiento del modelo en la app |

La **skill** y el **prompt canónico** contienen las mismas instrucciones. Si edita uno,
sincronice el otro para no perder la consistencia del formato.

---

## Arquitectura (MVC)

```
src/
├── models/InformeTecnico.js      · MODELO — define los campos, valida y arma el mensaje para Claude
├── views/                        · VISTA — formulario (index.ejs), resultado (resultado.ejs), error
├── controllers/informeController.js  · CONTROLADOR — orquesta el flujo y la descarga .docx
├── services/
│   ├── claudeService.js          · Llamada a la API de Claude + interpretación del protocolo de respuesta
│   └── wordService.js            · Convierte el informe en un .docx con formato de carta
├── prompts/systemPrompt.js       · Instrucciones completas (rol, reglas legales, estructura obligatoria)
├── routes/index.js               · Rutas
├── config/index.js               · Configuración desde variables de entorno
└── app.js                        · Ensamblado de Express
```

### Flujo

1. El asesor completa el formulario (16+ campos: cliente, vehículo, kilometraje, motivo,
   inspecciones, diagnóstico, trabajos, pruebas finales, firma, sucursal…).
2. El **Modelo** valida los campos obligatorios y construye un mensaje estructurado.
3. El **Servicio de Claude** envía el mensaje con el prompt de sistema canónico.
4. Claude responde con uno de dos estados:
   - `ESTADO: CONSULTA` → lista enumerada de preguntas por información faltante.
     El asesor responde (una o varias veces) y se reenvía.
   - `ESTADO: INFORME` → carta formal completa lista para Word.
5. El asesor descarga el `.docx`, copia el texto o solicita ajustes puntuales.

---

## Requisitos

- Node.js 18 o superior (probado con Node 24).
- Una clave de API de Claude: <https://console.anthropic.com/>

## Instalación

```bash
npm install
copy .env.example .env      # en Windows   (cp .env.example .env en Linux/macOS)
```

Edite `.env` y defina al menos:

```
ANTHROPIC_API_KEY=sk-ant-...
SESSION_SECRET=algún-valor-aleatorio
```

Opcionalmente configure los valores por defecto de la concesionaria
(`DEFAULT_CIUDAD`, `DEFAULT_SUCURSAL`, `DEFAULT_FIRMANTE_NOMBRE`,
`DEFAULT_FIRMANTE_CARGO`, `DEFAULT_EMPRESA`) para prellenar el formulario.

## Ejecución

```bash
npm start
```

Abra <http://localhost:3000>. En Windows también puede usar `start.cmd`.

### Variables de entorno

| Variable | Por defecto | Descripción |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | **Requerida.** Clave de la API de Claude. |
| `CLAUDE_MODEL` | `claude-opus-5` | Modelo a utilizar. |
| `CLAUDE_EFFORT` | `high` | Nivel de esfuerzo: `low`…`max`. |
| `CLAUDE_MAX_TOKENS` | `16000` | Máximo de tokens de salida. |
| `PORT` | `3000` | Puerto del servidor. |
| `SESSION_SECRET` | (dev) | Secreto de firma de sesión. |

---

## Uso de la skill en Claude Code

Con este repositorio abierto en Claude Code:

```
/informe-tecnico-automotriz
```

Pegue los datos que tenga del caso. La skill pedirá lo que falte en lista enumerada y,
cuando esté completo, entregará el informe con el mismo formato que la aplicación web.

---

## Notas

- El contenido lo redacta un modelo de lenguaje: **revise siempre** el informe antes de
  entregarlo al cliente. La app lo recuerda en cada pantalla.
- La conversación con Claude se guarda en la sesión del navegador (8 h). "Nuevo informe"
  la reinicia.
- El prompt prohíbe expresiones como «garantizado», «imposible», «el problema fue causado
  por…» o admisiones de responsabilidad, y obliga a lenguaje técnico prudente.
