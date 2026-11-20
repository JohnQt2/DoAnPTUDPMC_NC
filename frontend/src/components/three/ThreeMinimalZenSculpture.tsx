import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeMinimalZenSculptureProps {
  /** Active Chinese character carved on the 3D Imperial Lacquer Seal */
  activeHanzi?: string;
  /** Pinyin etched subtly beneath the character */
  activePinyin?: string;
  /** 'porcelain' (light studio) or 'obsidian' (dark lacquer stage) */
  tone?: 'porcelain' | 'obsidian';
  className?: string;
}

/**
 * Procedural Hanzi4U Studio Softbox Environment (zero external HDR fetch).
 * Casts crisp porcelain highlights, imperial crimson rim reflections, and warm gold bounce.
 */
function buildHanziStudioEnv(renderer: THREE.WebGLRenderer, isDark: boolean): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(isDark ? 0x141112 : 0xfaf8f6);

  const topLight = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  topLight.position.set(0, 10, 3);
  topLight.rotation.x = Math.PI / 2;
  envScene.add(topLight);

  // Imperial Gold left studio softbox
  const leftGold = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 12),
    new THREE.MeshBasicMaterial({ color: 0xe6be4c, side: THREE.DoubleSide })
  );
  leftGold.position.set(-10, 2, 3);
  leftGold.rotation.y = Math.PI / 2;
  envScene.add(leftGold);

  // Imperial Crimson right rim strip
  const rightCrimson = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshBasicMaterial({ color: 0xc41e3a, side: THREE.DoubleSide })
  );
  rightCrimson.position.set(10, -1, 1);
  rightCrimson.rotation.y = -Math.PI / 2;
  envScene.add(rightCrimson);

  // Jade subtle under-bounce
  const bottomBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshBasicMaterial({ color: isDark ? 0x0a3d2b : 0xf2ece8, side: THREE.DoubleSide })
  );
  bottomBounce.position.set(0, -9, 1);
  bottomBounce.rotation.x = -Math.PI / 2;
  envScene.add(bottomBounce);

  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  return rt.texture;
}

/**
 * Generates a razor-sharp 512x512 procedural lacquer seal face texture
 * (Imperial Crimson stamp border + inlaid gold double hairline + sculptural Song-serif Hanzi + Pinyin).
 */
function createSealFaceTexture(char: string, pinyin: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Rich Imperial Crimson lacquer gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#D42240');
  grad.addColorStop(0.55, '#C41E3A');
  grad.addColorStop(1, '#93122A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle TianZiGe hairlines etched into the lacquer
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(size / 2, 46);
  ctx.lineTo(size / 2, size - 46);
  ctx.moveTo(46, size / 2);
  ctx.lineTo(size - 46, size / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Inlaid Imperial Gold double seal border
  ctx.strokeStyle = 'rgba(230, 190, 76, 0.85)';
  ctx.lineWidth = 5;
  ctx.strokeRect(32, 32, size - 64, size - 64);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(46, 46, size - 92, size - 92);

  // Corner gold seal dots
  ctx.fillStyle = '#F2D16B';
  [
    [58, 58],
    [size - 58, 58],
    [58, size - 58],
    [size - 58, size - 58],
  ].forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Top micro-label
  ctx.fillStyle = 'rgba(242, 209, 107, 0.9)';
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HANZI4U · 印', size / 2, 84);

  // Sculptural Calligraphic Hanzi in luminous porcelain white
  ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 236px "Noto Serif SC", "Songti SC", "STSong", serif';
  ctx.fillText(char, size / 2, size / 2 + 6);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Bottom etched Pinyin badge
  if (pinyin) {
    ctx.fillStyle = 'rgba(20, 17, 18, 0.34)';
    ctx.beginPath();
    ctx.roundRect(size / 2 - 86, size - 108, 172, 42, 21);
    ctx.fill();
    ctx.strokeStyle = 'rgba(230, 190, 76, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FFF7DB';
    ctx.font = '700 24px "JetBrains Mono", monospace';
    ctx.fillText(pinyin, size / 2, size - 87);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates an embossed gold-on-obsidian lacquer side pattern for the seal cube.
 */
function createSealSideTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1B1517';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(212, 160, 23, 0.55)';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, size - 40, size - 40);

  ctx.strokeStyle = 'rgba(196, 30, 58, 0.65)';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, size - 64, size - 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Hero 3D Interactive Artifact — Hanzi4U Imperial Lacquer Seal Pavilion (印章):
 * - Real 3D sculpted Crimson Lacquer & Obsidian Seal Cube with carved live Hanzi front/back faces
 * - Single-pass translucent porcelain crystal halo + tilted brushed gold meridian rings
 * - 4 orbiting gemstone satellites (Crimson Ruby, Gold, Jade Emerald, Obsidian)
 * - 72 single-draw-call InstancedMesh gold & crimson ink motes
 * - Full 360° inertial drag rotation + smooth hover parallax + character-switch spring impulse
 */
export const ThreeMinimalZenSculpture: React.FC<ThreeMinimalZenSculptureProps> = ({
  activeHanzi = '汉',
  activePinyin = 'hàn',
  tone = 'porcelain',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sealFaceMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const impulseRef = useRef<number>(0);
  const [webglUnsupported, setWebglUnsupported] = useState(false);
  const isDark = tone === 'obsidian';

  // Live-update carved Hanzi face texture + trigger satisfying spring spin impulse
  useEffect(() => {
    const mat = sealFaceMatRef.current;
    if (!mat) return;
    const prev = mat.map;
    mat.map = createSealFaceTexture(activeHanzi, activePinyin);
    mat.needsUpdate = true;
    prev?.dispose();
    impulseRef.current = 2.6;
  }, [activeHanzi, activePinyin]);

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

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 480;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envTex = buildHanziStudioEnv(renderer, isDark);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0.15, 7.6);

    // Sculptural 3-point gallery lighting
    const ambient = new THREE.AmbientLight(0xfff9f5, 0.9);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(4.5, 6.2, 6.5);
    scene.add(keyLight);

    const crimsonLight = new THREE.PointLight(0xc41e3a, 3.6, 16);
    crimsonLight.position.set(-3.8, -1.8, 3.5);
    scene.add(crimsonLight);

    const goldLight = new THREE.PointLight(0xe6be4c, 3.2, 16);
    goldLight.position.set(3.8, 2.8, 3.2);
    scene.add(goldLight);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const orbitGroup = new THREE.Group();
    masterGroup.add(orbitGroup);

    // ── MATERIALS ──
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      metalness: 0.9,
      roughness: 0.2,
    });

    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x1a1517,
      metalness: 0.42,
      roughness: 0.28,
    });

    const jadeMat = new THREE.MeshStandardMaterial({
      color: 0x00a86b,
      metalness: 0.32,
      roughness: 0.22,
    });

    const crimsonGemMat = new THREE.MeshStandardMaterial({
      color: 0xc41e3a,
      metalness: 0.35,
      roughness: 0.2,
    });

    // Single-pass translucent porcelain crystal halo (ultra-fast 120fps)
    const porcelainHaloMat = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0xfbf8f6 : 0xffffff,
      opacity: isDark ? 0.42 : 0.62,
      transparent: true,
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 0.45,
      sheen: 0.6,
      sheenColor: new THREE.Color(0xe6be4c),
      envMapIntensity: 1.5,
    });

    // ── 1. CENTERPIECE: 3D SCULPTED IMPERIAL CRIMSON LACQUER SEAL MONOLITH ──
    const sealGroup = new THREE.Group();
    masterGroup.add(sealGroup);

    const faceTex = createSealFaceTexture(activeHanzi, activePinyin);
    const sideTex = createSealSideTexture();

    const sealFaceMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.26,
      metalness: 0.12,
    });
    sealFaceMatRef.current = sealFaceMat;

    const sealSideMat = new THREE.MeshStandardMaterial({
      map: sideTex,
      roughness: 0.32,
      metalness: 0.38,
    });

    // 6-face material array: [+x, -x, +y, -y, +z (front), -z (back)]
    const sealBodyGeo = new THREE.BoxGeometry(1.92, 1.92, 0.56);
    const sealBody = new THREE.Mesh(sealBodyGeo, [
      sealSideMat,
      sealSideMat,
      sealSideMat,
      sealSideMat,
      sealFaceMat,
      sealFaceMat,
    ]);
    sealGroup.add(sealBody);

    // Brushed gold chamfered collar framing the seal cube
    const collarGeo = new THREE.BoxGeometry(2.02, 2.02, 0.26);
    const collarMesh = new THREE.Mesh(collarGeo, goldMat);
    sealGroup.add(collarMesh);

    // Sculptural stepped obsidian-and-gold scholar crown finial on top of seal
    const finialBaseGeo = new THREE.CylinderGeometry(0.24, 0.34, 0.18, 8);
    const finialBase = new THREE.Mesh(finialBaseGeo, obsidianMat);
    finialBase.position.set(0, 1.08, 0);
    sealGroup.add(finialBase);

    const finialRingGeo = new THREE.TorusGeometry(0.22, 0.045, 16, 48);
    const finialRing = new THREE.Mesh(finialRingGeo, goldMat);
    finialRing.position.set(0, 1.32, 0);
    sealGroup.add(finialRing);

    // ── 2. ORBITAL ARCHITECTURE: PORCELAIN CRYSTAL HALO & GOLD MERIDIANS ──
    const haloGeo = new THREE.TorusGeometry(2.15, 0.14, 32, 112);
    const haloRing = new THREE.Mesh(haloGeo, porcelainHaloMat);
    haloRing.rotation.x = 0.42;
    haloRing.rotation.y = -0.3;
    orbitGroup.add(haloRing);

    const goldOrbit1Geo = new THREE.TorusGeometry(2.48, 0.028, 16, 120);
    const goldOrbit1 = new THREE.Mesh(goldOrbit1Geo, goldMat);
    goldOrbit1.rotation.x = Math.PI * 0.36;
    goldOrbit1.rotation.y = 0.24;
    orbitGroup.add(goldOrbit1);

    const crimsonOrbitGeo = new THREE.TorusGeometry(1.82, 0.022, 16, 108);
    const crimsonOrbit = new THREE.Mesh(crimsonOrbitGeo, crimsonGemMat);
    crimsonOrbit.rotation.x = -Math.PI * 0.32;
    crimsonOrbit.rotation.y = -0.28;
    orbitGroup.add(crimsonOrbit);

    // ── 3. FOUR ORBITING FACETED GEMSTONE NODES (CRIMSON, GOLD, JADE, OBSIDIAN) ──
    const gemGeo = new THREE.OctahedronGeometry(0.14, 0);
    const beadGeo = new THREE.SphereGeometry(0.085, 20, 20);
    const satellites = [
      { mesh: new THREE.Mesh(gemGeo, crimsonGemMat), radius: 2.48, angle: 0.3, speed: 0.38, yTilt: 0.42 },
      { mesh: new THREE.Mesh(gemGeo, jadeMat), radius: 2.15, angle: 2.1, speed: -0.3, yTilt: -0.36 },
      { mesh: new THREE.Mesh(beadGeo, goldMat), radius: 2.48, angle: 3.9, speed: 0.38, yTilt: 0.25 },
      { mesh: new THREE.Mesh(beadGeo, obsidianMat), radius: 1.9, angle: 5.4, speed: -0.26, yTilt: -0.22 },
    ];
    satellites.forEach((s) => orbitGroup.add(s.mesh));

    // ── 4. SINGLE-DRAW-CALL INSTANCED GOLD & CRIMSON INK MOTES (72 PARTICLES) ──
    const PARTICLE_COUNT = 72;
    const dotGeo = new THREE.IcosahedronGeometry(0.024, 0);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.72,
      roughness: 0.28,
      transparent: true,
      opacity: 0.72,
    });
    const instancedDots = new THREE.InstancedMesh(dotGeo, dotMat, PARTICLE_COUNT);
    const dummy = new THREE.Object3D();
    const goldColor = new THREE.Color(0xd4a017);
    const crimsonColor = new THREE.Color(0xc41e3a);
    const jadeColor = new THREE.Color(0x00a86b);
    for (let idx = 0; idx < PARTICLE_COUNT; idx++) {
      const phi = Math.acos(1 - (2 * (idx + 0.5)) / PARTICLE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
      const r = 2.65 + (idx % 5) * 0.22;
      dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) * 0.85,
        r * Math.sin(phi) * Math.sin(theta) - 0.35
      );
      dummy.scale.setScalar(0.55 + (idx % 4) * 0.25);
      dummy.updateMatrix();
      instancedDots.setMatrixAt(idx, dummy.matrix);
      instancedDots.setColorAt(idx, idx % 3 === 0 ? crimsonColor : idx % 5 === 0 ? jadeColor : goldColor);
    }
    instancedDots.instanceMatrix.needsUpdate = true;
    if (instancedDots.instanceColor) instancedDots.instanceColor.needsUpdate = true;
    masterGroup.add(instancedDots);

    // ── INTERACTIVE 360° DRAG + SMOOTH PARALLAX PHYSICS ──
    let targetTiltX = 0;
    let targetTiltY = 0;
    let dragRotX = -0.06;
    let dragRotY = 0.26;
    let dragVelX = 0;
    let dragVelY = 0;
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
      dragVelX = 0;
      dragVelY = 0;
      container.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      targetTiltY = THREE.MathUtils.clamp(nx, -1, 1) * 0.26;
      targetTiltX = THREE.MathUtils.clamp(ny, -1, 1) * 0.18;

      if (isDragging) {
        const dx = (e.clientX - prevX) * 0.009;
        const dy = (e.clientY - prevY) * 0.007;
        dragRotY += dx;
        dragRotX = THREE.MathUtils.clamp(dragRotX + dy, -0.75, 0.75);
        dragVelY = dx * 18;
        dragVelX = dy * 14;
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
      const w = container.clientWidth || 480;
      const h = container.clientHeight || 480;
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

      impulseRef.current *= Math.pow(0.06, dt);
      spinAccum += dt * (0.28 * motion + impulseRef.current);

      if (!isDragging) {
        dragRotY += dragVelY * dt;
        dragRotX = THREE.MathUtils.clamp(dragRotX + dragVelX * dt, -0.75, 0.75);
        dragVelY *= Math.pow(0.08, dt);
        dragVelX *= Math.pow(0.08, dt);
        // Gently breathe back toward sculptural hero 3/4 view
        const restY = 0.24 + Math.sin(t * 0.55) * 0.16 * motion;
        const restX = -0.05 + Math.cos(t * 0.45) * 0.06 * motion;
        dragRotY += (restY - dragRotY) * Math.min(1, dt * 1.15);
        dragRotX += (restX - dragRotX) * Math.min(1, dt * 1.15);
      }

      // Apply character-switch spring spin impulse smoothly to seal Y rotation
      const targetSealY = dragRotY + targetTiltY + impulseRef.current * 0.55;
      const targetSealX = dragRotX + targetTiltX;
      sealGroup.rotation.y += (targetSealY - sealGroup.rotation.y) * Math.min(1, dt * 8);
      sealGroup.rotation.x += (targetSealX - sealGroup.rotation.x) * Math.min(1, dt * 8);
      sealGroup.position.y = Math.sin(t * 1.35) * 0.09 * motion;
      sealGroup.scale.setScalar(1 + Math.min(impulseRef.current * 0.032, 0.07));

      // Orbit rings & satellites
      haloRing.rotation.z = spinAccum * 0.45;
      haloRing.rotation.x = 0.42 + Math.sin(t * 0.5) * 0.12 * motion;
      goldOrbit1.rotation.z = -spinAccum * 0.35;
      crimsonOrbit.rotation.z = spinAccum * 0.58;

      satellites.forEach((s, idx) => {
        const a = s.angle + t * s.speed * motion + spinAccum * 0.32;
        s.mesh.position.set(
          Math.cos(a) * s.radius,
          Math.sin(a * 1.25) * s.radius * s.yTilt,
          Math.sin(a) * s.radius * 0.58
        );
        s.mesh.rotation.x = t * 0.8 * motion + idx;
        s.mesh.rotation.y = t * 1.0 * motion;
      });

      orbitGroup.rotation.y += (targetTiltY * 0.7 - orbitGroup.rotation.y) * Math.min(1, dt * 5);
      orbitGroup.rotation.x += (targetTiltX * 0.7 - orbitGroup.rotation.x) * Math.min(1, dt * 5);
      instancedDots.rotation.y = t * 0.055 * motion;

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
      sealFaceMatRef.current = null;

      sealBodyGeo.dispose();
      collarGeo.dispose();
      finialBaseGeo.dispose();
      finialRingGeo.dispose();
      haloGeo.dispose();
      goldOrbit1Geo.dispose();
      crimsonOrbitGeo.dispose();
      gemGeo.dispose();
      beadGeo.dispose();
      dotGeo.dispose();

      sealFaceMat.map?.dispose();
      sealFaceMat.dispose();
      sealSideMat.map?.dispose();
      sealSideMat.dispose();
      goldMat.dispose();
      obsidianMat.dispose();
      jadeMat.dispose();
      crimsonGemMat.dispose();
      porcelainHaloMat.dispose();
      dotMat.dispose();
      envTex.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDark]);

  if (webglUnsupported) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-52 h-52 rounded-3xl bg-[#C41E3A] border-2 border-[#D4A017] flex flex-col items-center justify-center shadow-xl text-white">
          <span className="font-hanzi-serif text-8xl font-bold">{activeHanzi}</span>
          <span className="font-mono text-sm text-[#F2D16B] mt-1">{activePinyin}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label={`Ấn triện chữ Hán 3D ${activeHanzi}`}
      className={`relative w-full h-full select-none touch-pan-y ${className}`}
    />
  );
};
