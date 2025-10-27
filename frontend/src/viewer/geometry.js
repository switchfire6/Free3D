const TAU = Math.PI * 2;

function mergeGeometry(target, source) {
  const indexOffset = target.positions.length / 3;
  target.positions.push(...source.positions);
  target.normals.push(...source.normals);
  if (source.indices) {
    target.indices.push(...source.indices.map((i) => i + indexOffset));
  } else {
    target.indices.push(...Array.from({ length: source.positions.length / 3 }, (_, i) => i + indexOffset));
  }
}

function createBoxGeometry(width = 1, height = 1, depth = 1) {
  const w = width / 2;
  const h = height / 2;
  const d = depth / 2;
  const positions = [
    // Front
    -w, -h, d,
    w, -h, d,
    w, h, d,
    -w, h, d,
    // Back
    w, -h, -d,
    -w, -h, -d,
    -w, h, -d,
    w, h, -d,
    // Top
    -w, h, d,
    w, h, d,
    w, h, -d,
    -w, h, -d,
    // Bottom
    -w, -h, -d,
    w, -h, -d,
    w, -h, d,
    -w, -h, d,
    // Right
    w, -h, d,
    w, -h, -d,
    w, h, -d,
    w, h, d,
    // Left
    -w, -h, -d,
    -w, -h, d,
    -w, h, d,
    -w, h, -d
  ];
  const normals = [
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
  ];
  const indices = [
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
  ];
  return { positions, normals, indices };
}

function createConeGeometry(radius = 0.5, height = 1, segments = 24) {
  const positions = [];
  const normals = [];
  const indices = [];
  const halfHeight = height / 2;

  // Side vertices
  for (let i = 0; i <= segments; i += 1) {
    const u = i / segments;
    const theta = u * TAU;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const px = cos * radius;
    const pz = sin * radius;

    positions.push(px, -halfHeight, pz);
    normals.push(cos, radius / height, sin);
  }

  // Apex
  positions.push(0, halfHeight, 0);
  normals.push(0, 1, 0);
  const apexIndex = positions.length / 3 - 1;

  for (let i = 0; i < segments; i += 1) {
    indices.push(i, i + 1, apexIndex);
  }

  // Base circle
  const baseCenterIndex = positions.length / 3;
  positions.push(0, -halfHeight, 0);
  normals.push(0, -1, 0);
  for (let i = 0; i <= segments; i += 1) {
    const u = i / segments;
    const theta = u * TAU;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    positions.push(cos * radius, -halfHeight, sin * radius);
    normals.push(0, -1, 0);
  }
  for (let i = 0; i < segments; i += 1) {
    indices.push(baseCenterIndex, baseCenterIndex + i + 1, baseCenterIndex + i + 2);
  }

  return { positions, normals, indices };
}

function createCylinderGeometry(radius = 0.5, height = 1, segments = 24) {
  const positions = [];
  const normals = [];
  const indices = [];
  const halfHeight = height / 2;

  for (let i = 0; i <= segments; i += 1) {
    const u = i / segments;
    const theta = u * TAU;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const px = cos * radius;
    const pz = sin * radius;

    positions.push(px, -halfHeight, pz);
    normals.push(cos, 0, sin);
    positions.push(px, halfHeight, pz);
    normals.push(cos, 0, sin);
  }

  for (let i = 0; i < segments; i += 1) {
    const base = i * 2;
    indices.push(base, base + 1, base + 2);
    indices.push(base + 1, base + 3, base + 2);
  }

  // Caps
  const startIndex = positions.length / 3;
  positions.push(0, halfHeight, 0);
  normals.push(0, 1, 0);
  for (let i = 0; i <= segments; i += 1) {
    const u = i / segments;
    const theta = u * TAU;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    positions.push(cos * radius, halfHeight, sin * radius);
    normals.push(0, 1, 0);
  }
  for (let i = 0; i < segments; i += 1) {
    indices.push(startIndex, startIndex + i + 1, startIndex + i + 2);
  }

  const bottomStart = positions.length / 3;
  positions.push(0, -halfHeight, 0);
  normals.push(0, -1, 0);
  for (let i = 0; i <= segments; i += 1) {
    const u = i / segments;
    const theta = u * TAU;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    positions.push(cos * radius, -halfHeight, sin * radius);
    normals.push(0, -1, 0);
  }
  for (let i = 0; i < segments; i += 1) {
    indices.push(bottomStart, bottomStart + i + 2, bottomStart + i + 1);
  }

  return { positions, normals, indices };
}

function createTorusGeometry(radius = 0.8, tube = 0.25, radialSegments = 32, tubularSegments = 24) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let j = 0; j <= radialSegments; j += 1) {
    const v = (j / radialSegments) * TAU;
    const cosV = Math.cos(v);
    const sinV = Math.sin(v);

    for (let i = 0; i <= tubularSegments; i += 1) {
      const u = (i / tubularSegments) * TAU;
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);

      const x = (radius + tube * cosU) * cosV;
      const y = tube * sinU;
      const z = (radius + tube * cosU) * sinV;
      positions.push(x, y, z);

      const nx = cosV * cosU;
      const ny = sinU;
      const nz = sinV * cosU;
      normals.push(nx, ny, nz);
    }
  }

  const rowLength = tubularSegments + 1;
  for (let j = 0; j < radialSegments; j += 1) {
    for (let i = 0; i < tubularSegments; i += 1) {
      const a = j * rowLength + i;
      const b = j * rowLength + i + 1;
      const c = (j + 1) * rowLength + i;
      const d = (j + 1) * rowLength + i + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  return { positions, normals, indices };
}

function createCapsuleGeometry(radius = 0.3, height = 1.2, segments = 20) {
  const cylinderHeight = Math.max(0, height - radius * 2);
  const cylinder = createCylinderGeometry(radius, cylinderHeight, segments);

  const hemisphere = (sign) => {
    const positions = [];
    const normals = [];
    const indices = [];
    for (let y = 0; y <= segments; y += 1) {
      const v = y / segments;
      const theta = (v * Math.PI) / 2;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let x = 0; x <= segments; x += 1) {
        const u = (x / segments) * TAU;
        const sinPhi = Math.sin(u);
        const cosPhi = Math.cos(u);
        const nx = cosPhi * sinTheta;
        const ny = cosTheta;
        const nz = sinPhi * sinTheta;
        positions.push(nx * radius, ny * radius * sign, nz * radius);
        normals.push(nx, ny * sign, nz);
      }
    }
    const row = segments + 1;
    for (let y = 0; y < segments; y += 1) {
      for (let x = 0; x < segments; x += 1) {
        const i = y * row + x;
        const a = i;
        const b = i + 1;
        const c = i + row;
        const d = i + row + 1;
        if (sign > 0) {
          indices.push(a, c, b, b, c, d);
        } else {
          indices.push(a, b, c, b, d, c);
        }
      }
    }
    return { positions, normals, indices };
  };

  const top = hemisphere(1);
  const bottom = hemisphere(-1);

  const merged = { positions: [], normals: [], indices: [] };
  mergeGeometry(merged, cylinder);
  const topOffset = { positions: [], normals: [], indices: [] };
  for (let i = 0; i < top.positions.length; i += 3) {
    topOffset.positions.push(top.positions[i], top.positions[i + 1] + cylinderHeight / 2, top.positions[i + 2]);
    topOffset.normals.push(top.normals[i], top.normals[i + 1], top.normals[i + 2]);
  }
  topOffset.indices = top.indices;
  mergeGeometry(merged, topOffset);

  const bottomOffset = { positions: [], normals: [], indices: [] };
  for (let i = 0; i < bottom.positions.length; i += 3) {
    bottomOffset.positions.push(bottom.positions[i], bottom.positions[i + 1] - cylinderHeight / 2, bottom.positions[i + 2]);
    bottomOffset.normals.push(bottom.normals[i], bottom.normals[i + 1], bottom.normals[i + 2]);
  }
  bottomOffset.indices = bottom.indices;
  mergeGeometry(merged, bottomOffset);

  return merged;
}

function createWingGeometry() {
  const positions = [
    0, 0, 0,
    -0.8, 0, 0.4,
    -0.8, 0, -0.4,
    -0.1, -0.05, 0,
    -0.8, -0.05, 0.4,
    -0.8, -0.05, -0.4
  ];
  const normals = [
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0
  ];
  const indices = [0, 1, 2, 3, 5, 4];
  return { positions, normals, indices };
}

function createThrusterGeometry() {
  const base = createCylinderGeometry(0.2, 0.3, 16);
  const nozzle = createConeGeometry(0.22, 0.28, 16);
  const nozzleOffset = { positions: [], normals: [], indices: [] };
  for (let i = 0; i < nozzle.positions.length; i += 3) {
    nozzleOffset.positions.push(nozzle.positions[i], nozzle.positions[i + 1] - 0.29, nozzle.positions[i + 2]);
    nozzleOffset.normals.push(nozzle.normals[i], nozzle.normals[i + 1], nozzle.normals[i + 2]);
  }
  nozzleOffset.indices = nozzle.indices;
  const merged = { positions: [], normals: [], indices: [] };
  mergeGeometry(merged, base);
  mergeGeometry(merged, nozzleOffset);
  return merged;
}

function createCompositeGeometry(parts) {
  const combined = { positions: [], normals: [], indices: [] };

  for (const part of parts) {
    const geometry = createGeometry(part.geometry ?? "box");
    const matrix = composeTransform(part);
    const transformed = applyTransform(geometry, matrix);
    mergeGeometry(combined, transformed);
  }

  return combined;
}

function composeTransform({ scale = [1, 1, 1], rotation = [0, 0, 0], offset = [0, 0, 0] }) {
  const scaleMatrix = createScalingMatrix(scale[0], scale[1], scale[2]);
  const rotX = createRotationX(rotation[0]);
  const rotY = createRotationY(rotation[1]);
  const rotZ = createRotationZ(rotation[2]);
  const translation = createTranslationMatrix(offset[0], offset[1], offset[2]);

  let matrix = multiplyMatrix4(rotX, scaleMatrix);
  matrix = multiplyMatrix4(rotY, matrix);
  matrix = multiplyMatrix4(rotZ, matrix);
  matrix = multiplyMatrix4(translation, matrix);
  return matrix;
}

function applyTransform(geometry, matrix) {
  const transformed = { positions: [], normals: [], indices: geometry.indices ? [...geometry.indices] : [] };
  const { positions, normals } = geometry;
  const normalMatrix = computeNormalMatrix3(matrix);

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const nx = normals[i];
    const ny = normals[i + 1];
    const nz = normals[i + 2];

    const tx = x * matrix[0] + y * matrix[4] + z * matrix[8] + matrix[12];
    const ty = x * matrix[1] + y * matrix[5] + z * matrix[9] + matrix[13];
    const tz = x * matrix[2] + y * matrix[6] + z * matrix[10] + matrix[14];

    const nxT = nx * normalMatrix[0] + ny * normalMatrix[3] + nz * normalMatrix[6];
    const nyT = nx * normalMatrix[1] + ny * normalMatrix[4] + nz * normalMatrix[7];
    const nzT = nx * normalMatrix[2] + ny * normalMatrix[5] + nz * normalMatrix[8];
    const length = Math.hypot(nxT, nyT, nzT) || 1;

    transformed.positions.push(tx, ty, tz);
    transformed.normals.push(nxT / length, nyT / length, nzT / length);
  }

  return transformed;
}

function multiplyMatrix4(a, b) {
  const out = new Array(16);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      out[col * 4 + row] =
        a[0 * 4 + row] * b[col * 4 + 0] +
        a[1 * 4 + row] * b[col * 4 + 1] +
        a[2 * 4 + row] * b[col * 4 + 2] +
        a[3 * 4 + row] * b[col * 4 + 3];
    }
  }
  return out;
}

function createTranslationMatrix(tx, ty, tz) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    tx, ty, tz, 1
  ];
}

function createScalingMatrix(sx, sy, sz) {
  return [
    sx, 0, 0, 0,
    0, sy, 0, 0,
    0, 0, sz, 0,
    0, 0, 0, 1
  ];
}

function createRotationX(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ];
}

function createRotationY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ];
}

function createRotationZ(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];
}

function computeNormalMatrix3(matrix) {
  const m3 = [
    matrix[0], matrix[1], matrix[2],
    matrix[4], matrix[5], matrix[6],
    matrix[8], matrix[9], matrix[10]
  ];
  const inv = invertMatrix3(m3);
  return transposeMatrix3(inv);
}

function invertMatrix3(m) {
  const a00 = m[0];
  const a01 = m[1];
  const a02 = m[2];
  const a10 = m[3];
  const a11 = m[4];
  const a12 = m[5];
  const a20 = m[6];
  const a21 = m[7];
  const a22 = m[8];

  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;

  let det = a00 * b01 + a01 * b11 + a02 * b21;
  if (!det) {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }
  det = 1.0 / det;

  return [
    b01 * det,
    (-a22 * a01 + a02 * a21) * det,
    (a12 * a01 - a02 * a11) * det,
    b11 * det,
    (a22 * a00 - a02 * a20) * det,
    (-a12 * a00 + a02 * a10) * det,
    b21 * det,
    (-a21 * a00 + a01 * a20) * det,
    (a11 * a00 - a01 * a10) * det
  ];
}

function transposeMatrix3(m) {
  return [
    m[0], m[3], m[6],
    m[1], m[4], m[7],
    m[2], m[5], m[8]
  ];
}

export function createGeometry(kind) {
  switch (kind) {
    case "box":
      return createBoxGeometry();
    case "cone":
      return createConeGeometry();
    case "cylinder":
      return createCylinderGeometry();
    case "torus":
      return createTorusGeometry();
    case "capsule":
      return createCapsuleGeometry();
    case "wing":
      return createWingGeometry();
    case "thruster":
      return createThrusterGeometry();
    default:
      return createBoxGeometry();
  }
}

export function createMeshFromDescriptor(descriptor) {
  if (!descriptor) {
    return createGeometry("box");
  }
  if (descriptor.type === "composite" && Array.isArray(descriptor.parts)) {
    return createCompositeGeometry(descriptor.parts);
  }
  return createGeometry(descriptor.geometry ?? "box");
}

export function computeFaceCount(indices) {
  return Math.floor(indices.length / 3);
}
