const PRESET_LIBRARY = [
  {
    name: "Stylized Shuttle",
    keywords: ["spaceship", "shuttle", "rocket"],
    generator: () => ({
      mesh: {
        type: "composite",
        parts: [
          { geometry: "capsule", scale: [0.4, 1.2, 0.4] },
          { geometry: "wing", offset: [0, 0.1, 0.12], rotation: [0, 0, Math.PI / 4] },
          { geometry: "wing", offset: [0, 0.1, -0.12], rotation: [0, 0, -Math.PI / 4] },
          { geometry: "thruster", offset: [0, -0.55, 0] }
        ]
      }
    })
  },
  {
    name: "Crystal Lowpoly Tree",
    keywords: ["tree", "forest", "nature"],
    generator: () => ({
      mesh: {
        type: "composite",
        parts: [
          { geometry: "cone", scale: [0.5, 0.7, 0.5], offset: [0, 0.35, 0] },
          { geometry: "cone", scale: [0.4, 0.6, 0.4], offset: [0, 0.75, 0] },
          { geometry: "cone", scale: [0.3, 0.5, 0.3], offset: [0, 1.05, 0] },
          { geometry: "cylinder", scale: [0.12, 0.6, 0.12], offset: [0, -0.1, 0] }
        ]
      }
    })
  },
  {
    name: "Sci-fi Archway",
    keywords: ["gate", "portal", "archway", "door"],
    generator: () => ({
      mesh: {
        type: "composite",
        parts: [
          { geometry: "torus", scale: [0.8, 0.8, 0.3] },
          { geometry: "box", scale: [0.9, 0.15, 0.9], offset: [0, -0.6, 0] }
        ]
      }
    })
  }
];

const FALLBACK_MESH = {
  type: "composite",
  parts: [
    { geometry: "box", scale: [0.6, 0.6, 0.6] },
    { geometry: "box", scale: [0.4, 0.15, 0.4], offset: [0, 0.4, 0] }
  ]
};

function scorePrompt(prompt, keywords) {
  const normalized = prompt.toLowerCase();
  return keywords.reduce((score, keyword) => {
    const occurrences = normalized.split(keyword).length - 1;
    return score + occurrences;
  }, 0);
}

function pickPreset(prompt) {
  const best = PRESET_LIBRARY.reduce(
    (winner, preset) => {
      const score = scorePrompt(prompt, preset.keywords);
      if (score > winner.score) {
        return { preset, score };
      }
      return winner;
    },
    { preset: null, score: 0 }
  );

  if (best.preset) {
    return best.preset;
  }

  const fallbackIndex = Math.floor(Math.random() * PRESET_LIBRARY.length);
  return PRESET_LIBRARY[fallbackIndex];
}

export async function generateConceptMesh({ prompt, style }) {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const selectedPreset = pickPreset(prompt);
  const concept = selectedPreset.generator();

  const payload = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    prompt,
    style,
    name: selectedPreset.name,
    mesh: concept.mesh ?? FALLBACK_MESH
  };

  return payload;
}

export function getPresetLibrary() {
  return PRESET_LIBRARY.map(({ name, keywords }) => ({ name, keywords: [...keywords] }));
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}
