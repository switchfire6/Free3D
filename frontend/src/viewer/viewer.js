import { OrbitCamera } from "./camera.js";
import { OrbitControls } from "./controls.js";
import { createMeshFromDescriptor, computeFaceCount } from "./geometry.js";

const VERTEX_SHADER = `
attribute vec3 position;
attribute vec3 normal;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;
uniform mat3 uNormalMatrix;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec4 worldPosition = uModel * vec4(position, 1.0);
  vPosition = worldPosition.xyz;
  vNormal = normalize(uNormalMatrix * normal);
  gl_Position = uProjection * uView * worldPosition;
}
`;

const FRAGMENT_SHADER = `
precision mediump float;

varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 uLightDirection;
uniform vec3 uBaseColor;
uniform vec3 uCameraPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightDirection);
  vec3 viewDir = normalize(uCameraPosition - vPosition);

  float diffuse = max(dot(normal, -lightDir), 0.0);
  float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 4.0);
  float ambient = 0.25;

  vec3 color = uBaseColor * (ambient + 0.75 * diffuse) + vec3(0.35, 0.4, 0.55) * rim;
  gl_FragColor = vec4(color, 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${info}`);
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program linking failed: ${info}`);
  }
  return program;
}

function multiplyMatrices(a, b) {
  const out = new Float32Array(16);
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

function extractNormalMatrix(matrix) {
  return new Float32Array([
    matrix[0],
    matrix[1],
    matrix[2],
    matrix[4],
    matrix[5],
    matrix[6],
    matrix[8],
    matrix[9],
    matrix[10]
  ]);
}

function createRotationY(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([
    c,
    0,
    -s,
    0,
    0,
    1,
    0,
    0,
    s,
    0,
    c,
    0,
    0,
    0,
    0,
    1
  ]);
}

export class ModelViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl", { antialias: true });
    if (!this.gl) {
      throw new Error("WebGL is not supported by this browser");
    }

    this.camera = new OrbitCamera();
    this.controls = new OrbitControls(canvas, this.camera, {
      onChange: () => this.render()
    });

    this.program = createProgram(this.gl, VERTEX_SHADER, FRAGMENT_SHADER);
    this.attributeLocations = {
      position: this.gl.getAttribLocation(this.program, "position"),
      normal: this.gl.getAttribLocation(this.program, "normal")
    };
    this.uniformLocations = {
      projection: this.gl.getUniformLocation(this.program, "uProjection"),
      view: this.gl.getUniformLocation(this.program, "uView"),
      model: this.gl.getUniformLocation(this.program, "uModel"),
      normalMatrix: this.gl.getUniformLocation(this.program, "uNormalMatrix"),
      lightDirection: this.gl.getUniformLocation(this.program, "uLightDirection"),
      baseColor: this.gl.getUniformLocation(this.program, "uBaseColor"),
      cameraPosition: this.gl.getUniformLocation(this.program, "uCameraPosition")
    };

    this.buffers = {
      position: this.gl.createBuffer(),
      normal: this.gl.createBuffer(),
      index: this.gl.createBuffer()
    };

    this.geometry = { positions: [], normals: [], indices: [] };
    this.vertexCount = 0;
    this.modelRotation = 0;
    this.autoRotate = true;
    this.baseColor = [0.55, 0.72, 0.98];
    this.lastTimestamp = null;

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);

    this.resize();
    this.camera.updateViewMatrix();
    this.render = this.render.bind(this);
    requestAnimationFrame(() => this.render());
  }

  resize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
      this.camera.setViewport(width, height);
      this.camera.updateViewMatrix();
      this.render();
    }
  }

  loadDescriptor(descriptor) {
    const mesh = createMeshFromDescriptor(descriptor);
    this.geometry = mesh;

    const bbox = computeBoundingBox(mesh.positions);
    const center = [
      (bbox.min[0] + bbox.max[0]) / 2,
      (bbox.min[1] + bbox.max[1]) / 2,
      (bbox.min[2] + bbox.max[2]) / 2
    ];
    const radius = Math.max(1, bbox.radius * 1.6);
    this.camera.setTarget(center);
    this.camera.radius = radius;
    this.camera.updateViewMatrix();

    this.uploadGeometry(mesh);
    this.render();

    return {
      vertices: mesh.positions.length / 3,
      faces: computeFaceCount(mesh.indices ?? []),
      center,
      radius
    };
  }

  uploadGeometry(mesh) {
    const gl = this.gl;
    this.vertexCount = mesh.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.positions), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normal);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normals), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
  }

  setAutoRotate(enabled) {
    this.autoRotate = enabled;
  }

  setBaseColor(color) {
    this.baseColor = color;
  }

  resetView() {
    this.camera.reset();
    this.camera.updateViewMatrix();
    this.render();
  }

  dispose() {
    this.controls.dispose();
    this.resizeObserver.disconnect();
  }

  render(timestamp) {
    if (this.autoRotate && typeof timestamp === "number") {
      if (this.lastTimestamp != null) {
        const delta = timestamp - this.lastTimestamp;
        this.modelRotation = (this.modelRotation + delta * 0.0006) % (Math.PI * 2);
      }
      this.lastTimestamp = timestamp;
    } else {
      this.lastTimestamp = null;
    }

    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0.07, 0.09, 0.14, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    gl.enableVertexAttribArray(this.attributeLocations.position);
    gl.vertexAttribPointer(this.attributeLocations.position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normal);
    gl.enableVertexAttribArray(this.attributeLocations.normal);
    gl.vertexAttribPointer(this.attributeLocations.normal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.index);

    const modelMatrix = createRotationY(this.modelRotation);
    const modelView = multiplyMatrices(this.camera.viewMatrix, modelMatrix);
    const normalMatrix = extractNormalMatrix(modelView);

    gl.uniformMatrix4fv(this.uniformLocations.projection, false, this.camera.projectionMatrix);
    gl.uniformMatrix4fv(this.uniformLocations.view, false, this.camera.viewMatrix);
    gl.uniformMatrix4fv(this.uniformLocations.model, false, modelMatrix);
    gl.uniformMatrix3fv(this.uniformLocations.normalMatrix, false, normalMatrix);
    gl.uniform3fv(this.uniformLocations.lightDirection, new Float32Array([0.35, 0.7, 0.45]));
    gl.uniform3fv(this.uniformLocations.baseColor, new Float32Array(this.baseColor));
    const eye = this.camera.getEyePosition();
    gl.uniform3fv(this.uniformLocations.cameraPosition, new Float32Array(eye));

    gl.drawElements(gl.TRIANGLES, this.vertexCount, gl.UNSIGNED_SHORT, 0);

    if (this.autoRotate) {
      requestAnimationFrame(this.render);
    }
  }
}

function computeBoundingBox(positions) {
  if (!positions.length) {
    return { min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5], radius: Math.sqrt(3) / 2 };
  }
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    if (x < min[0]) min[0] = x;
    if (y < min[1]) min[1] = y;
    if (z < min[2]) min[2] = z;
    if (x > max[0]) max[0] = x;
    if (y > max[1]) max[1] = y;
    if (z > max[2]) max[2] = z;
  }
  const dx = max[0] - min[0];
  const dy = max[1] - min[1];
  const dz = max[2] - min[2];
  const radius = Math.sqrt(dx * dx + dy * dy + dz * dz) / 2;
  return { min, max, radius };
}
