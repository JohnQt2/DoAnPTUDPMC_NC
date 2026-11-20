import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeMinimalZenSculptureProps {
  /** Active Chinese character rendered crisply at the optical center */
  activeHanzi?: string;
  className?: string;
}

/**
 * Procedural Minimalist Architectural Studio Softbox Environment (zero external HDR fetch).
 * Renders crisp Apple/Hermès gallery specular reflections onto physical crystal glass.
 */
function buildGalleryStudioEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xfafaf9);

  // Overhead broad alabaster softbox
  const topLight = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  topLight.position.set(0, 10, 2);
  topLight.rotation.x = Math.PI / 2;
  envScene.add(topLight);

  // Warm parchment left bounce
  const leftBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 12),
    new THREE.MeshBasicMaterial({ color: 0xf5f2ed, side: THREE.DoubleSide })
  );
  leftBounce.position.set(-10, 1, 3);
  leftBounce.rotation.y = Math.PI / 2;
  envScene.add(leftBounce);

  // Subtle crimson architectural rim panel (echoes Chinese red seal)
  const crimsonRim = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 12),
    new THREE.MeshBasicMaterial({ color: 0xe11d48, side: THREE.DoubleSide })
  );
  crimsonRim.position.set(10, -2, -2);
  crimsonRim.rotation.y = -Math.PI / 2;
  envScene.add(crimsonRim);

  // Cool silver ground bounce for crisp refractive edge definition
  const bottomBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.MeshBasicMaterial({ color: 0xd4d4d8, side: THREE.DoubleSide })
  );
  bottomBounce.position.set(0, -9, 1);
  bottomBounce.rotation.x = -Math.PI / 2;
  envScene.add(bottomBounce);

  const rt = pmrem.fromScene(envScene, 0.035);
  pmrem.dispose();
  return rt.texture;
}

/**
 * Renders a razor-sharp Song-dynasty calligraphy character on a soft porcelain disc texture
 * so the glyph floats effortlessly at the center of the 3D crystal halo with 100% legibility.
 */
function createCenterHanziTexture(char: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  // Soft radial porcelain veil behind the glyph for crisp separation
  const halo = ctx.createRadialGradient(256, 256, 24, 256, 256, 215);
  halo.addColorStop(0, 'rgba(255, 255, 255, 0.94)');
  halo.addColorStop(0.65, 'rgba(250, 250, 249, 0.72)');
  halo.addColorStop(1, 'rgba(250, 250, 249, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(256, 256, 215, 0, Math.PI * 2);
  ctx.fill();

  // Delicate seal border ring
  ctx.strokeStyle = 'rgba(24, 24, 27, 0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256, 256, 176, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle crimson seal corner mark
  ctx.fillStyle = 'rgba(190, 18, 60, 0.85)';
  ctx.beginPath();
  ctx.arc(256, 98, 5, 0, Math.PI * 2);
  ctx.fill();

  // Song/Serif calligraphic Hanzi
  ctx.fillStyle = '#09090B';
  ctx.font = '700 248px "Noto Serif SC", "Songti SC", "STSong", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, 256, 266);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Interactive 3D Optical Crystal Halo & Orbital Astrolabe (120fps WebGL).
 * - Physical refractive crystal outer ring framing the Hanzi (never obscuring strokes)
 * - Brushed titanium orbital tone rings + faceted crystal satellites
 * - Single-draw-call InstancedMesh ink-dust field (64 particles = 1 draw call)
 * - Drag-to-spin inertial physics + spring impulse on character switch
 * - Auto-pauses when scrolled offscreen or tab hidden; full GPU disposal on unmount
 */
export const ThreeMinimalZenSculpture: React.FC<ThreeMinimalZenSculptureProps> = ({
  activeHanzi = '汉',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hanziMeshRef = useRef<THREE.Mesh | null>(null);
  const impulseRef = useRef<number>(0);
  const [webglUnsupported, setWebglUnsupported] = useState(false);

  // Swap floating Hanzi texture + impart gentle kinetic spin impulse on character change
  useEffect(() => {
    const mesh = hanziMeshRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const prev = mat.map;
    mat.map = createCenterHanziTexture(activeHanzi);
    mat.needsUpdate = true;
    prev?.dispose();
    impulseRef.current = 1.9;
  }, [activeHanzi]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnsupported(true);
      return;
    }

    const width = container.clientWidth || 460;
    const height = container.clientHeight || 460;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envTex = buildGalleryStudioEnv(renderer);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.6);

    // Sculpted gallery lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(4.5, 6, 6);
    scene.add(keyLight);

    const crimsonAccentLight = new THREE.PointLight(0xbe123c, 2.8, 16);
    crimsonAccentLight.position.set(3.5, -2.2, 2.5);
    scene.add(crimsonAccentLight);

    const coolRimLight = new THREE.PointLight(0xe4e4e7, 2.4, 16);
    coolRimLight.position.set(-4, 3, -2);
    scene.add(coolRimLight);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const sculptureGroup = new THREE.Group();
    masterGroup.add(sculptureGroup);

    // Shared optical physical crystal material (1 GPU material instance shared cleanly)
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      opacity: 1,
      transparent: true,
      roughness: 0.07,
      metalness: 0.0,
      ior: 1.46,
      thickness: 1.25,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 0.25,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [120, 320],
      attenuationColor: new THREE.Color(0xe4e4e7),
      attenuationDistance: 4.0,
      envMapIntensity: 1.15,
    });

    // Shared brushed titanium architectural wire material
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      metalness: 0.88,
      roughness: 0.24,
      transparent: true,
      opacity: 0.45,
    });

    // Shared imperial crimson seal accent material
    const crimsonMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      metalness: 0.28,
      roughness: 0.28,
    });

    // 1. Primary Optical Crystal Halo Ring (frames center glyph cleanly from behind)
    const outerGlassGeo = new THREE.TorusGeometry(1.88, 0.21, 40, 128);
    const outerGlassHalo = new THREE.Mesh(outerGlassGeo, crystalMat);
    outerGlassHalo.position.set(0, 0, -0.35);
    outerGlassHalo.rotation.x = 0.28;
    outerGlassHalo.rotation.y = -0.22;
    sculptureGroup.add(outerGlassHalo);

    // 2. Second Delicate Tilted Crystal Ring (kept safely behind center glyph)
    const innerGlassGeo = new THREE.TorusGeometry(1.62, 0.08, 28, 112);
    const innerGlassRing = new THREE.Mesh(innerGlassGeo, crystalMat);
    innerGlassRing.position.set(0, 0, -0.55);
    innerGlassRing.rotation.x = Math.PI * 0.38;
    innerGlassRing.rotation.y = 0.32;
    sculptureGroup.add(innerGlassRing);

    // 3. Precision Architectural Titanium Astrolabe Orbits (4 tones motif)
    const orbit1Geo = new THREE.TorusGeometry(2.26, 0.01, 12, 128);
    const orbit1 = new THREE.Mesh(orbit1Geo, titaniumMat);
    orbit1.rotation.x = Math.PI * 0.34;
    orbit1.rotation.y = Math.PI * 0.16;
    sculptureGroup.add(orbit1);

    const orbit2Geo = new THREE.TorusGeometry(2.04, 0.008, 12, 128);
    const orbit2 = new THREE.Mesh(orbit2Geo, titaniumMat);
    orbit2.rotation.x = -Math.PI * 0.28;
    orbit2.rotation.y = -Math.PI * 0.24;
    sculptureGroup.add(orbit2);

    // 4. Imperial Crimson Seal Accent Arc & Orbiting Faceted Crystal Prisms
    const prismGeo = new THREE.OctahedronGeometry(0.17, 0);
    const sealBeadGeo = new THREE.SphereGeometry(0.085, 24, 24);

    const satellites = [
      { mesh: new THREE.Mesh(prismGeo, crystalMat), radius: 2.26, angle: 0.5, speed: 0.36, yTilt: 0.45 },
      { mesh: new THREE.Mesh(prismGeo, crystalMat), radius: 2.04, angle: 2.6, speed: -0.28, yTilt: -0.35 },
      { mesh: new THREE.Mesh(sealBeadGeo, crimsonMat), radius: 2.26, angle: 4.5, speed: 0.36, yTilt: 0.25 },
      { mesh: new THREE.Mesh(prismGeo, crystalMat), radius: 1.92, angle: 5.4, speed: 0.22, yTilt: -0.25 },
    ];
    satellites.forEach((s, i) => {
      if (i === 1) s.mesh.scale.setScalar(0.78);
      if (i === 3) s.mesh.scale.setScalar(0.65);
      sculptureGroup.add(s.mesh);
    });

    // 5. InstancedMesh Floating Ink & Platinum Dust Field (64 meshes in 1 single draw call!)
    const PARTICLE_COUNT = 64;
    const dotGeo = new THREE.IcosahedronGeometry(0.022, 0);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      metalness: 0.6,
      roughness: 0.35,
      transparent: true,
      opacity: 0.45,
    });
    const instancedDots = new THREE.InstancedMesh(dotGeo, dotMat, PARTICLE_COUNT);
    const dummy = new THREE.Object3D();
    const particleSeeds = Array.from({ length: PARTICLE_COUNT }, (_, idx) => {
      const phi = Math.acos(1 - (2 * (idx + 0.5)) / PARTICLE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
      const r = 2.45 + (idx % 5) * 0.22;
      return { phi, theta, r, phase: idx * 0.43, scale: 0.6 + (idx % 4) * 0.25 };
    });
    particleSeeds.forEach((p, idx) => {
      dummy.position.set(
        p.r * Math.sin(p.phi) * Math.cos(p.theta),
        p.r * Math.cos(p.phi) * 0.85,
        p.r * Math.sin(p.phi) * Math.sin(p.theta) - 0.6
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      instancedDots.setMatrixAt(idx, dummy.matrix);
    });
    instancedDots.instanceMatrix.needsUpdate = true;
    masterGroup.add(instancedDots);

    // 6. Razor-Sharp Center Hanzi Specimen Plane (cleanly positioned in front — 100% unobstructed)
    const hanziGeo = new THREE.PlaneGeometry(1.88, 1.88);
    const hanziTex = createCenterHanziTexture(activeHanzi);
    const hanziMat = new THREE.MeshBasicMaterial({
      map: hanziTex,
      transparent: true,
      depthWrite: false,
    });
    const hanziPlane = new THREE.Mesh(hanziGeo, hanziMat);
    hanziPlane.position.set(0, 0, 1.65);
    masterGroup.add(hanziPlane);
    hanziMeshRef.current = hanziPlane;

    // Interactive Drag + Gentle Pointer Parallax Physics
    let targetTiltX = 0;
    let targetTiltY = 0;
    let dragRotX = 0;
    let dragRotY = 0;
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let isVisible = true;
    let rafId = 0;
    const clock = new THREE.Clock();

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      container.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      targetTiltY = THREE.MathUtils.clamp(nx, -1, 1) * 0.32;
      targetTiltX = THREE.MathUtils.clamp(ny, -1, 1) * 0.24;

      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        dragRotY += dx * 0.008;
        dragRotX = THREE.MathUtils.clamp(dragRotX + dy * 0.006, -0.8, 0.8);
        prevX = e.clientX;
        prevY = e.clientY;
      }
    };

    const onPointerUp = () => {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = 'grab';
      }
    };

    const onPointerLeave = () => {
      targetTiltX = 0;
      targetTiltY = 0;
    };

    container.style.cursor = 'grab';
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointerleave', onPointerLeave);

    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth || 460;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.02 }
    );
    intersectionObserver.observe(container);

    let spinAccum = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const motion = reducedMotion ? 0 : 1;

      // Exponentially decay spring spin impulse on character switch
      impulseRef.current *= Math.pow(0.08, dt);
      spinAccum += dt * (0.28 * motion + impulseRef.current);

      // Crystal rings graceful architectural choreography
      outerGlassHalo.rotation.z = spinAccum * 0.55;
      outerGlassHalo.rotation.x = 0.32 + Math.sin(t * 0.55) * 0.14 * motion;
      outerGlassHalo.rotation.y = -0.22 + Math.cos(t * 0.45) * 0.18 * motion;

      innerGlassRing.rotation.z = -spinAccum * 0.72;
      innerGlassRing.rotation.x = Math.PI * 0.42 + Math.cos(t * 0.6) * 0.16 * motion;

      orbit1.rotation.z = t * 0.16 * motion;
      orbit2.rotation.z = -t * 0.12 * motion;

      // Orbiting crystal prism satellites
      satellites.forEach((s, idx) => {
        const a = s.angle + t * s.speed * motion + spinAccum * 0.35;
        s.mesh.position.set(
          Math.cos(a) * s.radius,
          Math.sin(a * 1.2) * s.radius * s.yTilt,
          Math.sin(a) * s.radius * 0.55
        );
        s.mesh.rotation.x = t * 0.7 * motion + idx;
        s.mesh.rotation.y = t * 0.9 * motion;
      });

      // Gentle ambient rotation of instanced dust field
      instancedDots.rotation.y = t * 0.045 * motion;
      instancedDots.rotation.x = Math.sin(t * 0.18) * 0.06 * motion;

      // Subtle breathing lift on Hanzi center glyph (always faces viewer cleanly!)
      hanziPlane.position.y = Math.sin(t * 1.15) * 0.045 * motion;
      const scaleKick = 1 + Math.min(impulseRef.current * 0.045, 0.08);
      hanziPlane.scale.setScalar(scaleKick);

      // Silky damped interpolation for drag + parallax
      if (!isDragging) {
        dragRotY *= Math.pow(0.25, dt);
        dragRotX *= Math.pow(0.25, dt);
      }
      const desiredY = targetTiltY + dragRotY;
      const desiredX = targetTiltX + dragRotX;
      sculptureGroup.rotation.y += (desiredY - sculptureGroup.rotation.y) * Math.min(1, dt * 7);
      sculptureGroup.rotation.x += (desiredX - sculptureGroup.rotation.x) * Math.min(1, dt * 7);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerleave', onPointerLeave);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      hanziMeshRef.current = null;

      outerGlassGeo.dispose();
      innerGlassGeo.dispose();
      orbit1Geo.dispose();
      orbit2Geo.dispose();
      prismGeo.dispose();
      sealBeadGeo.dispose();
      dotGeo.dispose();
      hanziGeo.dispose();

      crystalMat.dispose();
      titaniumMat.dispose();
      crimsonMat.dispose();
      dotMat.dispose();
      hanziMat.map?.dispose();
      hanziMat.dispose();
      envTex.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglUnsupported) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-52 h-52 rounded-full bg-white border border-zinc-200 shadow-sm flex items-center justify-center">
          <span className="font-hanzi-serif text-8xl font-bold text-zinc-950">{activeHanzi}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label={`Mô hình tinh thể 3D tương tác chữ ${activeHanzi}`}
      className={`relative w-full h-full select-none touch-pan-y ${className}`}
    />
  );
};
