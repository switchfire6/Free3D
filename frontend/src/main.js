import { generateConceptMesh } from "./services/generationService.js";
import { ModelViewer } from "./viewer/viewer.js";

const canvas = document.getElementById("viewer-canvas");
let viewer;
try {
  viewer = new ModelViewer(canvas);
} catch (error) {
  console.error("Failed to initialise viewer", error);
  const fallback = document.createElement("p");
  fallback.textContent = "WebGL is required to preview models. Please use a modern browser.";
  fallback.className = "viewer-error";
  canvas.replaceWith(fallback);
  throw error;
}

const form = document.getElementById("prompt-form");
const promptInput = document.getElementById("prompt-input");
const styleSelect = document.getElementById("style-select");
const historyList = document.getElementById("history-list");
const statusIndicator = document.getElementById("status-indicator");
const modelName = document.getElementById("model-name");
const modelVertices = document.getElementById("model-vertices");
const modelFaces = document.getElementById("model-faces");
const resetCameraButton = document.getElementById("reset-camera");
const toggleRotationButton = document.getElementById("toggle-rotation");

let isBusy = false;
let autoRotate = true;
const history = [];

function setStatus(text, state = "ready") {
  statusIndicator.textContent = text;
  statusIndicator.dataset.state = state;
}

function addHistoryEntry(entry) {
  history.unshift(entry);
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  history.forEach((item) => {
    const li = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = item.name;

    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.textContent = `${new Date(item.createdAt).toLocaleTimeString()} • ${item.style} • ${item.vertices} verts`;

    const prompt = document.createElement("p");
    prompt.textContent = item.prompt;

    li.appendChild(title);
    li.appendChild(meta);
    li.appendChild(prompt);
    li.addEventListener("click", () => {
      viewer.setAutoRotate(autoRotate);
      viewer.loadDescriptor(item.mesh);
      updateInspector(item);
      setStatus(`Replaying ${item.name}`, "info");
    });
    historyList.appendChild(li);
  });
}

function updateInspector({ name, vertices, faces }) {
  modelName.textContent = name;
  modelVertices.textContent = vertices.toLocaleString();
  modelFaces.textContent = faces.toLocaleString();
}

async function handleGenerate(event) {
  event.preventDefault();
  if (isBusy) {
    return;
  }
  const prompt = promptInput.value.trim();
  if (!prompt) {
    setStatus("Enter a prompt to begin", "warning");
    return;
  }

  isBusy = true;
  setStatus("Generating concept mesh…", "loading");
  form.classList.add("is-loading");

  try {
    const concept = await generateConceptMesh({ prompt, style: styleSelect.value });
    const stats = viewer.loadDescriptor(concept.mesh);
    const entry = { ...concept, ...stats };
    addHistoryEntry(entry);
    updateInspector(entry);
    setStatus(`Generated ${entry.name}`, "success");
  } catch (error) {
    console.error(error);
    setStatus("Generation failed — check console", "error");
  } finally {
    isBusy = false;
    form.classList.remove("is-loading");
  }
}

form.addEventListener("submit", handleGenerate);

resetCameraButton.addEventListener("click", () => {
  viewer.resetView();
  setStatus("Camera reset", "info");
});

toggleRotationButton.addEventListener("click", () => {
  autoRotate = !autoRotate;
  viewer.setAutoRotate(autoRotate);
  if (autoRotate) {
    requestAnimationFrame(viewer.render);
  }
  toggleRotationButton.textContent = autoRotate ? "Toggle auto-rotate" : "Enable auto-rotate";
  setStatus(autoRotate ? "Auto-rotate enabled" : "Auto-rotate paused", "info");
});

async function bootstrap() {
  const defaultPrompt = "A stylized sci-fi shuttle";
  promptInput.value = defaultPrompt;
  setStatus("Preparing starter mesh…", "loading");
  viewer.setAutoRotate(autoRotate);
  requestAnimationFrame(viewer.render);

  try {
    isBusy = true;
    const concept = await generateConceptMesh({ prompt: defaultPrompt, style: styleSelect.value });
    const stats = viewer.loadDescriptor(concept.mesh);
    const entry = { ...concept, ...stats };
    addHistoryEntry(entry);
    updateInspector(entry);
    setStatus(`Loaded ${entry.name}`, "success");
  } catch (error) {
    console.error(error);
    setStatus("Failed to load starter mesh", "error");
  } finally {
    isBusy = false;
  }
}

bootstrap();
