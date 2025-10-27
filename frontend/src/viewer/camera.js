export class OrbitCamera {
  constructor({ radius = 4, minRadius = 1.5, maxRadius = 12, target = [0, 0.5, 0] } = {}) {
    this.radius = radius;
    this.minRadius = minRadius;
    this.maxRadius = maxRadius;
    this.target = [...target];
    this.theta = Math.PI / 4;
    this.phi = Math.PI / 5;
    this.viewMatrix = new Float32Array(16);
    this.projectionMatrix = new Float32Array(16);
    this.eye = new Float32Array([0, 0, 0]);
  }

  setViewport(width, height) {
    const aspect = width / height;
    const fov = (60 * Math.PI) / 180;
    const near = 0.1;
    const far = 100;
    const f = 1.0 / Math.tan(fov / 2);

    this.projectionMatrix.set([
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) / (near - far),
      -1,
      0,
      0,
      (2 * far * near) / (near - far),
      0
    ]);
  }

  updateViewMatrix() {
    const x = this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    const y = this.radius * Math.cos(this.phi);
    const z = this.radius * Math.sin(this.phi) * Math.cos(this.theta);

    this.eye[0] = x + this.target[0];
    this.eye[1] = y + this.target[1];
    this.eye[2] = z + this.target[2];

    const up = [0, 1, 0];

    const zAxis = normalize([
      this.eye[0] - this.target[0],
      this.eye[1] - this.target[1],
      this.eye[2] - this.target[2]
    ]);
    const xAxis = normalize(cross(up, zAxis));
    const yAxis = cross(zAxis, xAxis);

    this.viewMatrix.set([
      xAxis[0],
      yAxis[0],
      zAxis[0],
      0,
      xAxis[1],
      yAxis[1],
      zAxis[1],
      0,
      xAxis[2],
      yAxis[2],
      zAxis[2],
      0,
      -dot(xAxis, this.eye),
      -dot(yAxis, this.eye),
      -dot(zAxis, this.eye),
      1
    ]);
  }

  dolly(delta) {
    this.radius = clamp(this.radius + delta, this.minRadius, this.maxRadius);
  }

  rotate(deltaTheta, deltaPhi) {
    const phiLimit = Math.PI / 2 - 0.1;
    this.theta += deltaTheta;
    this.phi = clamp(this.phi + deltaPhi, 0.1, phiLimit);
  }

  setTarget(target) {
    this.target[0] = target[0];
    this.target[1] = target[1];
    this.target[2] = target[2];
  }

  reset() {
    this.radius = 4;
    this.theta = Math.PI / 4;
    this.phi = Math.PI / 5;
  }

  getEyePosition() {
    return [this.eye[0], this.eye[1], this.eye[2]];
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}
