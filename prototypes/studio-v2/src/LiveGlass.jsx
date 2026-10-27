import { useEffect, useRef } from "react";
import { Container } from "./vendor/liquid-glass/container.js";

// Only live canvas pixels are sampled. No page screenshots, cross-origin capture,
// or global html2canvas dependency. Upstream refraction/masking runs unchanged.
const subscribers = new Set();
export function publishGradient(canvas, time) {
  for (const listener of subscribers) listener(canvas, time);
}

class CanvasGlass extends Container {
  init() {
    this.createElement();
    this.setupCanvas();
    this.element.style.cssText =
      "position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit";
    this.canvas.style.zIndex = "0";
    this.canvas.style.boxShadow = "none";
    this.sample = document.createElement("canvas");
    this.context = this.sample.getContext("2d", { alpha: false });
    this.disposed = false;
  }
  // Rendering is driven by the source frame, rather than permanent scroll listeners.
  startRenderLoop() {}
  createProgram(...args) {
    this.program = super.createProgram(...args);
    return this.program;
  }
  getPosition() {
    return { x: this.sample.width / 2, y: this.sample.height / 2 };
  }
  update(source, host, depth) {
    if (this.disposed || !this.gl || !this.context) return;
    const rect = host.getBoundingClientRect();
    const sourceRect = source.getBoundingClientRect();
    if (
      rect.width < 2 ||
      sourceRect.width < 2 ||
      rect.bottom < 0 ||
      rect.top > innerHeight
    )
      return;
    const pad = 38;
    const width = Math.round(rect.width),
      height = Math.round(rect.height);
    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      this.canvas.width = width;
      this.canvas.height = height;
      this.sample.width = width + pad * 2;
      this.sample.height = height + pad * 2;
      this.borderRadius = Math.min(height / 2, 40);
    }
    const sx = source.width / sourceRect.width,
      sy = source.height / sourceRect.height;
    this.context.fillStyle = "#151c28";
    this.context.fillRect(0, 0, this.sample.width, this.sample.height);
    this.context.drawImage(
      source,
      (rect.left - sourceRect.left - pad) * sx,
      (rect.top - sourceRect.top - pad) * sy,
      this.sample.width * sx,
      this.sample.height * sy,
      0,
      0,
      this.sample.width,
      this.sample.height,
    );
    if (!this.webglInitialized) {
      this.setupShader(this.sample);
      this.webglInitialized = Boolean(this.gl_refs.texture);
      if (!this.webglInitialized) return;
      host.dataset.glassReady = "true";
    }
    const gl = this.gl,
      refs = this.gl_refs;
    gl.useProgram(this.program);
    gl.viewport(0, 0, width, height);
    gl.bindTexture(gl.TEXTURE_2D, refs.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.sample,
    );
    gl.uniform2f(refs.resolutionLoc, width, height);
    gl.uniform2f(refs.textureSizeLoc, this.sample.width, this.sample.height);
    gl.uniform2f(
      refs.containerPositionLoc,
      this.sample.width / 2,
      this.sample.height / 2,
    );
    gl.uniform1f(refs.scrollYLoc, 0);
    gl.uniform1f(refs.borderRadiusLoc, this.borderRadius);
    gl.uniform1f(refs.blurRadiusLoc, 2);
    gl.uniform1f(refs.tintOpacityLoc, 0.1);
    gl.uniform1f(refs.edgeIntensityLoc, 0.03 * depth);
    gl.uniform1f(refs.rimIntensityLoc, 0.065 * depth);
    gl.uniform1f(refs.baseIntensityLoc, 0.018 * depth);
    gl.uniform1f(refs.warpLoc, 1);
    gl.uniform1f(refs.rippleEffectLoc, 0.035 * depth);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  dispose() {
    this.disposed = true;
    const gl = this.gl;
    if (gl) {
      if (this.gl_refs.texture) gl.deleteTexture(this.gl_refs.texture);
      if (this.gl_refs.positionBuffer)
        gl.deleteBuffer(this.gl_refs.positionBuffer);
      if (this.gl_refs.texcoordBuffer)
        gl.deleteBuffer(this.gl_refs.texcoordBuffer);
      if (this.program) {
        for (const shader of gl.getAttachedShaders(this.program) || [])
          gl.deleteShader(shader);
        gl.deleteProgram(this.program);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    Container.instances = Container.instances.filter((item) => item !== this);
    this.element.remove();
  }
}

export default function LiveGlass({ depth = 1 }) {
  const host = useRef(null),
    depthRef = useRef(depth);
  depthRef.current = depth;
  useEffect(() => {
    const node = host.current;
    let glass;
    let last = 0;
    try {
      glass = new CanvasGlass({
        type: "pill",
        borderRadius: 40,
        tintOpacity: 0.1,
      });
    } catch (error) {
      console.warn("Glass fallback:", error.message);
      return;
    }
    node.appendChild(glass.element);
    const draw = (canvas, time) => {
      if (time - last < 80) return;
      last = time;
      try {
        glass.update(canvas, node, depthRef.current);
      } catch (error) {
        subscribers.delete(draw);
        glass.dispose();
        console.warn("Glass fallback:", error.message);
      }
    };
    subscribers.add(draw);
    return () => {
      subscribers.delete(draw);
      glass.dispose();
    };
  }, []);
  return <span ref={host} className="live-glass" aria-hidden="true" />;
}
