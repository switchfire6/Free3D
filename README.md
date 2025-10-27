# Free3D Playground

Free3D Playground is a lightweight single-page application that sketches the workflow of a text-to-3D model generator. It ships with a WebGL previewer, prompt panel, and a pluggable generation service so you can evolve the prototype into a production-ready pipeline similar to Meshy.ai.

## Features

- ⚡️ **Prompt-driven concept meshes** – A modular `generationService` maps text prompts to prototype geometry and is ready to be swapped with a real backend or ML model.
- 🌀 **Interactive 3D preview** – Custom WebGL viewer with orbit controls, auto-rotation, resettable camera, and metadata inspector.
- 🧱 **Extensible architecture** – Clear separation between services, viewer, and UI logic to support future expansion (asset import/export, server integration, etc.).
- 📝 **Generation history** – Quickly replay previous generations from the current session.

## Project structure

```
frontend/
├── index.html          # Root document and layout
├── styles.css          # Global styling and theme
└── src/
    ├── main.js         # UI orchestration, state, and history
    ├── services/
    │   └── generationService.js  # Prompt → mesh descriptor mapping
    └── viewer/
        ├── camera.js    # Orbit camera math & projection
        ├── controls.js  # Pointer/scroll interaction handlers
        └── viewer.js    # WebGL renderer and geometry uploader
```

Geometry primitives and composite meshes are procedurally generated, making it easy to plug in custom geometry sources in the future.

## Getting started

1. Serve the `frontend` directory with any static web server (for example `python -m http.server 4173 -d frontend`).
2. Open the served URL in a modern browser with WebGL support (Chrome, Edge, Firefox, or Safari).
3. Enter a text prompt, choose a style preset, and press **Generate concept mesh**.
4. Use the mouse to orbit, scroll to zoom, toggle auto-rotation, or reset the camera.

> **Tip:** Replace the placeholder logic in `src/services/generationService.js` with API calls to your own text-to-3D model service. The viewer expects mesh descriptors that can be procedurally assembled into vertex buffers.

## Extending the playground

- Hook up a backend endpoint that returns glTF/OBJ assets and implement a parser module under `src/viewer`.
- Stream progress updates to the status indicator for long-running generations.
- Add texture/material support by expanding the shader pipeline in `viewer.js`.
- Persist history entries locally (IndexedDB) or remotely so generations survive a refresh.

Contributions, experiments, and wild ideas are welcome!
