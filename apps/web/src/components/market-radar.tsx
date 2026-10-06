'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MarketCandidate } from '@phanfora/domain';
import { radarPoints, radarTickAngles } from '../lib/radar-plot';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function blipTexture(text: string, up: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const fill = up ? '#1bd9aa' : '#f07580';
  ctx.fillStyle = fill;
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.arc(28, 32, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(28, 32, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '700 22px ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = '#d7f6ee';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 44, 33);
  return canvas;
}

export function MarketRadar({ items }: { items: readonly MarketCandidate[] }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const points = useMemo(() => radarPoints(items), [items]);
  const ticks = useMemo(() => radarTickAngles(), []);
  const [webgl, setWebgl] = useState(false);

  useEffect(() => {
    const surface = canvas.current;
    const frame = host.current;
    if (!surface || !frame) return;
    let disposed = false;
    let renderer: import('three').WebGLRenderer | undefined;
    let scene: import('three').Scene | undefined;
    let camera: import('three').OrthographicCamera | undefined;
    let sweep: import('three').Group | undefined;
    const trash: Array<{ dispose: () => void }> = [];
    let frameId = 0;
    let last = 0;

    void import('three').then((THREE) => {
      if (disposed) return;
      try {
        renderer = new THREE.WebGLRenderer({ canvas: surface, antialias: true, alpha: true, powerPreference: 'low-power' });
      } catch {
        return;
      }
      if (!renderer.getContext()) {
        renderer.dispose();
        renderer = undefined;
        return;
      }
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1.28, 1.28, 1.28, -1.28, 0.1, 10);
      camera.position.set(0, 0, 4);
      camera.lookAt(0, 0, 0);

      const discGeometry = new THREE.CircleGeometry(1.02, 80);
      const discMaterial = new THREE.MeshBasicMaterial({ color: 0x06262f });
      scene.add(new THREE.Mesh(discGeometry, discMaterial));
      trash.push(discGeometry, discMaterial);

      [0.92, 0.68, 0.44].forEach((radius, index) => {
        const band = new THREE.RingGeometry(radius - 0.11, radius, 72);
        const material = new THREE.MeshBasicMaterial({
          color: 0x0b3a44,
          transparent: true,
          opacity: index % 2 === 0 ? 0.35 : 0.18,
          side: THREE.DoubleSide,
        });
        scene?.add(new THREE.Mesh(band, material));
        trash.push(band, material);
      });

      [0.28, 0.52, 0.76, 1].forEach((radius, index) => {
        const ring = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
        const geometry = new THREE.BufferGeometry().setFromPoints(ring.getPoints(80));
        const material = new THREE.LineBasicMaterial({ color: index === 3 ? 0x2ee0b4 : 0x1a7a86, transparent: true, opacity: index === 3 ? 0.95 : 0.7 });
        scene?.add(new THREE.Line(geometry, material));
        trash.push(geometry, material);
      });

      const tickPairs: import('three').Vector3[] = [];
      ticks.forEach((angle, index) => {
        const outer = index % 6 === 0 ? 1.16 : 1.1;
        tickPairs.push(
          new THREE.Vector3(Math.cos(angle) * 1.02, Math.sin(angle) * 1.02, 0.01),
          new THREE.Vector3(Math.cos(angle) * outer, Math.sin(angle) * outer, 0.01),
        );
      });
      const tickGeometry = new THREE.BufferGeometry().setFromPoints(tickPairs);
      const tickMaterial = new THREE.LineBasicMaterial({ color: 0x39c9b0, transparent: true, opacity: 0.7 });
      scene.add(new THREE.LineSegments(tickGeometry, tickMaterial));
      trash.push(tickGeometry, tickMaterial);

      const axis = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1, 0, 0.01), new THREE.Vector3(1, 0, 0.01),
        new THREE.Vector3(0, -1, 0.01), new THREE.Vector3(0, 1, 0.01),
      ]);
      const axisMaterial = new THREE.LineBasicMaterial({ color: 0x18bd9d, transparent: true, opacity: 0.28 });
      scene.add(new THREE.LineSegments(axis, axisMaterial));
      trash.push(axis, axisMaterial);

      const hubGlowGeometry = new THREE.CircleGeometry(0.08, 20);
      const hubGlowMaterial = new THREE.MeshBasicMaterial({ color: 0x1eeabe, transparent: true, opacity: 0.22 });
      const hubGeometry = new THREE.CircleGeometry(0.032, 16);
      const hubMaterial = new THREE.MeshBasicMaterial({ color: 0x9ffbe6 });
      const hubGlow = new THREE.Mesh(hubGlowGeometry, hubGlowMaterial);
      const hub = new THREE.Mesh(hubGeometry, hubMaterial);
      hubGlow.position.z = 0.02;
      hub.position.z = 0.03;
      scene.add(hubGlow, hub);
      trash.push(hubGlowGeometry, hubGlowMaterial, hubGeometry, hubMaterial);

      sweep = new THREE.Group();
      [0.9, 0.62, 0.4, 0.24, 0.12].forEach((span, index) => {
        const wedge = new THREE.Shape();
        wedge.moveTo(0, 0);
        wedge.absarc(0, 0, 1, 0, span, false);
        wedge.closePath();
        const geometry = new THREE.ShapeGeometry(wedge);
        const material = new THREE.MeshBasicMaterial({
          color: 0x1bd9aa,
          transparent: true,
          opacity: 0.2 - index * 0.032,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        sweep?.add(new THREE.Mesh(geometry, material));
        trash.push(geometry, material);
      });
      const rayGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0.04), new THREE.Vector3(1.02, 0, 0.04)]);
      const rayMaterial = new THREE.LineBasicMaterial({ color: 0xd8fff4 });
      sweep.add(new THREE.Line(rayGeometry, rayMaterial));
      trash.push(rayGeometry, rayMaterial);
      scene.add(sweep);

      points.forEach((point) => {
        const map = new THREE.CanvasTexture(blipTexture(point.label, point.up));
        const material = new THREE.SpriteMaterial({ map, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(point.x, point.y, 0.05);
        sprite.scale.set(0.28, 0.14, 1);
        scene?.add(sprite);
        trash.push(map, material);
      });

      const resize = () => {
        if (!renderer || !camera || !frame) return;
        const size = Math.max(180, Math.min(frame.clientWidth, frame.clientHeight || frame.clientWidth));
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(size, size, false);
        camera.updateProjectionMatrix();
      };
      resize();
      renderer.setClearColor(0x061c29, 0);
      setWebgl(true);

      const reduced = prefersReducedMotion();
      const tick = (now: number) => {
        if (!renderer || !scene || !camera) return;
        const delta = last ? Math.min(0.05, (now - last) / 1000) : 0;
        last = now;
        if (!reduced && sweep) sweep.rotation.z -= delta * ((Math.PI * 2) / 2.4);
        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(tick);
      };
      frameId = window.requestAnimationFrame(tick);
    }).catch(() => undefined);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      trash.forEach((item) => item.dispose());
      renderer?.dispose();
    };
  }, [points, ticks]);

  return (
    <figure className="workspace-radar">
      <h2>Radar</h2>
      <div className="workspace-radar-stage" ref={host}>
        <canvas ref={canvas} className={webgl ? 'is-live' : undefined} role={webgl ? 'img' : undefined} aria-label={webgl ? 'Piyasa radarı' : undefined} aria-hidden={!webgl} />
        {!webgl && (
          <svg role="img" aria-label="Piyasa radarı" viewBox="0 0 200 200">
            <rect width="200" height="200" fill="#061c29" />
            <circle cx="100" cy="100" r="90" fill="#06262f" />
            <circle className="workspace-radar-ring" cx="100" cy="100" r="28" />
            <circle className="workspace-radar-ring" cx="100" cy="100" r="52" />
            <circle className="workspace-radar-ring" cx="100" cy="100" r="76" />
            <circle className="workspace-radar-ring" cx="100" cy="100" r="90" />
            {ticks.map((angle) => {
              const inner = 90;
              const outer = angle % (Math.PI / 2) < 0.01 ? 102 : 96;
              return (
                <line
                  className="workspace-radar-tick"
                  key={angle}
                  x1={100 + Math.cos(angle) * inner}
                  y1={100 + Math.sin(angle) * inner}
                  x2={100 + Math.cos(angle) * outer}
                  y2={100 + Math.sin(angle) * outer}
                />
              );
            })}
            <line className="workspace-radar-cross" x1="100" y1="10" x2="100" y2="190" />
            <line className="workspace-radar-cross" x1="10" y1="100" x2="190" y2="100" />
            <path className="workspace-radar-beam is-trail" d="M100 100 L100 10 A90 90 0 0 1 178 64 Z" />
            <path className="workspace-radar-beam" d="M100 100 L100 10 A90 90 0 0 1 148 22 Z" />
            <circle cx="100" cy="100" r="4" fill="#1eeabe" />
            {points.map((point) => (
              <g key={point.id}>
                <circle cx={100 + point.x * 86} cy={100 + point.y * 86} r="3.6" fill={point.up ? '#1bd9aa' : '#f07580'} />
                <text className="workspace-radar-label" x={100 + point.x * 86 + 6} y={100 + point.y * 86 + 3}>{point.label}</text>
              </g>
            ))}
          </svg>
        )}
      </div>
      <figcaption>{points.length} temas</figcaption>
    </figure>
  );
}
