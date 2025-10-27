export class OrbitControls {
  constructor(canvas, camera, { onChange } = {}) {
    this.canvas = canvas;
    this.camera = camera;
    this.onChange = onChange ?? (() => {});

    this.isPointerDown = false;
    this.lastPointer = { x: 0, y: 0 };
    this.rotationSpeed = 0.01;
    this.zoomSpeed = 0.0025;

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleWheel = this.handleWheel.bind(this);

    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
    canvas.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  dispose() {
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("wheel", this.handleWheel);
  }

  handlePointerDown(event) {
    this.isPointerDown = true;
    this.lastPointer = { x: event.clientX, y: event.clientY };
    this.canvas.setPointerCapture(event.pointerId);
  }

  handlePointerMove(event) {
    if (!this.isPointerDown) return;
    const dx = event.clientX - this.lastPointer.x;
    const dy = event.clientY - this.lastPointer.y;
    this.lastPointer = { x: event.clientX, y: event.clientY };

    this.camera.rotate(-dx * this.rotationSpeed, -dy * this.rotationSpeed);
    this.camera.updateViewMatrix();
    this.onChange();
  }

  handlePointerUp(event) {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    try {
      this.canvas.releasePointerCapture(event.pointerId);
    } catch (error) {
      // Ignore when pointer capture was not set (e.g. pointer canceled)
    }
  }

  handleWheel(event) {
    event.preventDefault();
    const delta = event.deltaY * this.zoomSpeed;
    this.camera.dolly(delta);
    this.camera.updateViewMatrix();
    this.onChange();
  }
}
