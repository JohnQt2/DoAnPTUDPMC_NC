import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeMinimalZenSculptureProps {
  /** Active Chinese character etched on the Matte Porcelain Medallion */
  activeHanzi?: string;
  /** Pinyin etched cleanly beneath the character */
  activePinyin?: string;
  /** Optional tone/accent hex color for subtle inner seal ring */
  accentHex?: string;
  /** When false, keeps WebGL context warm in memory while pausing rAF render work */
  isActive?: boolean;
  tone?: 'porcelain' | 'obsidian';
  className?: string;
}

/**
 * Soft Natural Daylight Studio Softbox Environment (Muji / ceramic product photography feel).
 */
function buildPorcelainStudioEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xf4f0ea);

  const overhead = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  overhead.position.set(0, 10, 4);
  overhead.rotation.x = Math.PI / 2;
  envScene.add(overhead);

  const warmSide = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 14),
    new THREE.MeshBasicMaterial({ color: 0xf6ead8, side: THREE.DoubleSide })
  );
  warmSide.position.set(-10, 2, 3);
  warmSide.rotation.y = Math.PI / 2;
  envScene.add(warmSide);

  const coolFill = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 14),
    new THREE.MeshBasicMaterial({ color: 0xeae5de, side: THREE.DoubleSide })
  );
  coolFill.position.set(10, 0, 2);
  coolFill.rotation.y = -Math.PI / 2;
  envScene.add(coolFill);

  const rt = pmrem.fromScene(envScene, 0.05);
  pmrem.dispose();
  return rt.texture;
}

/**
 * Generates an editorial matte Xuan-porcelain circular medallion face:
 * Fine TianZiGe hairlines, crisp calligraphic Song-serif Hanzi in sumi ink,
 * delicate vermilion seal dot, and Pinyin subtitle.
 */
function createPorcelainFrontTexture(
  char: string,
  pinyin: string,
  accentHex: string
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Matte Xuan porcelain disc surface
  const bg = ctx.createRadialGradient(220, 200, 20, 256, 256, 260);
  bg.addColorStop(0, '#FFFFFF');
  bg.addColorStop(0.7, '#FAF7F2');
  bg.addColorStop(1, '#EFEAE2');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Subtle concentric hairline circle
  ctx.strokeStyle = 'rgba(28, 25, 23, 0.14)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256, 256, 224, 0, Math.PI * 2);
  ctx.stroke();

  // Accent inner hairline circle
  ctx.strokeStyle = `${accentHex}55`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(256, 256, 208, 0, Math.PI * 2);
  ctx.stroke();

  // Whisper-thin TianZiGe cross behind the Hanzi
  ctx.strokeStyle = 'rgba(196, 30, 58, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(256, 72);
  ctx.lineTo(256, 440);
  ctx.moveTo(72, 256);
  ctx.lineTo(440, 256);
  ctx.stroke();
  ctx.setLineDash([]);

  // Small scholarly vermilion seal square at 12 o'clock
  ctx.fillStyle = accentHex;
  ctx.fillRect(246, 66, 20, 20);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 12px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('汉', 256, 76);

  // Sculptural Calligraphic Hanzi in deep sumi ink
  ctx.fillStyle = '#1C1917';
  ctx.font = '700 226px "Noto Serif SC", "Songti SC", "STSong", serif';
  ctx.fillText(char, 256, 252);

  // Clean Pinyin beneath
  if (pinyin) {
    ctx.fillStyle = accentHex;
    ctx.font = '700 32px "JetBrains Mono", monospace';
    ctx.fillText(pinyin, 256, 404);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates the reverse side: Traditional Vermilion Lacquer Seal Stamp (印章)
 * so rotating the ceramic disc 180° reveals an authentic red scholar stamp!
 */
function createVermilionBackTexture(char: string, pinyin: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#B81D36';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(252, 249, 245, 0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 212, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#FCF9F5';
  ctx.font = '700 218px "Noto Serif SC", "Songti SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, 256, 246);

  if (pinyin) {
    ctx.fillStyle = 'rgba(252, 249, 245, 0.85)';
    ctx.font = '600 28px "JetBrains Mono", monospace';
    ctx.fillText(pinyin, 256, 400);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Refined Museum-Grade 3D Ceramic & Brushed-Brass Hanzi Medallion:
 * - Matte Xuan-Porcelain circular disc (Sumi Ink Hanzi front, Vermilion Seal back)
 * - Brushed champagne-brass collar + 2 whisper-thin architectural orbital hairlines
 * - ZERO gamey neon particles, ZERO floating ruby/emerald RPG gems
 * - Tactile 360° pointer drag + calm breathing motion + synchronous frame-0 render
 */
export const ThreeMinimalZenSculpture: React.FC<ThreeMinimalZenSculptureProps> = ({
  activeHanzi = '汉',
  activePinyin = 'hàn',
  accentHex = '#C41E3A',
  isActive = true,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const frontMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const backMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const impulseRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(isActive);
  isActiveRef.current = isActive;
  const [webglUnsupported, setWebglUnsupported] = useState(false);

  useEffect(() => {
    if (frontMatRef.current) {
      const prev = frontMatRef.current.map;
      frontMatRef.current.map = createPorcelainFrontTexture(activeHanzi, activePinyin, accentHex);
      frontMatRef.current.needsUpdate = true;
      prev?.dispose();
    }
    if (backMatRef.current) {
      const prev = backMatRef.current.map;
      backMatRef.current.map = createVermilionBackTexture(activeHanzi, activePinyin);
      backMatRef.current.needsUpdate = true;
      prev?.dispose();
    }
    impulseRef.current = 2.0;
  }, [activeHanzi, activePinyin, accentHex]);

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
    renderer.toneMappingExposure = 1.04;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envTex = buildPorcelainStudioEnv(renderer);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 0.08, 7.2);

    // Calm daylight studio lighting
    const ambient = new THREE.AmbientLight(0xfffbf6, 1.15);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(4.5, 6.5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf6e6cc, 0.9);
    rimLight.position.set(-4.5, -2.5, 4);
    scene.add(rimLight);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const discGroup = new THREE.Group();
    masterGroup.add(discGroup);

    // Materials — Tactile matte ceramic & satin brushed brass
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc59b42,
      metalness: 0.78,
      roughness: 0.28,
    });
    const inkWireMat = new THREE.MeshStandardMaterial({
      color: 0x2a2524,
      metalness: 0.35,
      roughness: 0.45,
      transparent: true,
      opacity: 0.45,
    });

    const frontTex = createPorcelainFrontTexture(activeHanzi, activePinyin, accentHex);
    const backTex = createVermilionBackTexture(activeHanzi, activePinyin);

    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.42,
      metalness: 0.04,
    });
    const backMat = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.36,
      metalness: 0.08,
    });
    frontMatRef.current = frontMat;
    backMatRef.current = backMat;

    // 1. Matte Ceramic Disc Body (rotated so circular caps face +Z / -Z)
    const rimGeo = new THREE.CylinderGeometry(1.58, 1.58, 0.26, 72);
    const rimMesh = new THREE.Mesh(rimGeo, brassMat);
    rimMesh.rotation.x = Math.PI / 2;
    discGroup.add(rimMesh);

    const faceGeo = new THREE.CircleGeometry(1.52, 72);
    const frontFace = new THREE.Mesh(faceGeo, frontMat);
    frontFace.position.z = 0.132;
    discGroup.add(frontFace);

    const backFace = new THREE.Mesh(faceGeo, backMat);
    backFace.rotation.y = Math.PI;
    backFace.position.z = -0.132;
    discGroup.add(backFace);

    // 2. Two Whisper-Thin Architectural Meridian Rings (minimalist museum sculpture)
    const brassRingGeo = new THREE.TorusGeometry(2.04, 0.016, 16, 128);
    const brassRing = new THREE.Mesh(brassRingGeo, brassMat);
    brassRing.rotation.set(0.32, -0.25, 0);
    masterGroup.add(brassRing);

    const inkRingGeo = new THREE.TorusGeometry(2.34, 0.01, 12, 128);
    const inkRing = new THREE.Mesh(inkRingGeo, inkWireMat);
    inkRing.rotation.set(-0.28, 0.42, 0.12);
    masterGroup.add(inkRing);

    // Single subtle brushed-brass calibration bead gliding quietly on the outer ring
    const beadGeo = new THREE.SphereGeometry(0.055, 20, 20);
    const bead = new THREE.Mesh(beadGeo, brassMat);
    masterGroup.add(bead);

    // Interactive 360° drag + subtle inertial damping
    let targetTiltX = 0;
    let targetTiltY = 0;
    let dragRotX = -0.04;
    let dragRotY = 0.22;
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
      targetTiltY = THREE.MathUtils.clamp(nx, -1, 1) * 0.2;
      targetTiltX = THREE.MathUtils.clamp(ny, -1, 1) * 0.14;

      if (isDragging) {
        const dx = (e.clientX - prevX) * 0.009;
        const dy = (e.clientY - prevY) * 0.007;
        dragRotY += dx;
        dragRotX = THREE.MathUtils.clamp(dragRotX + dy, -0.75, 0.75);
        dragVelY = dx * 16;
        dragVelX = dy * 12;
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
      { threshold: 0.0 }
    );
    intersectionObserver.observe(container);

    // Synchronous frame 0 paint
    renderer.render(scene, camera);

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isActiveRef.current || !isVisible || document.hidden) {
        clock.getDelta();
        return;
      }

      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const m = reducedMotion ? 0 : 1;

      impulseRef.current *= Math.pow(0.06, dt);

      if (!isDragging) {
        dragRotY += dragVelY * dt;
        dragRotX = THREE.MathUtils.clamp(dragRotX + dragVelX * dt, -0.75, 0.75);
        dragVelY *= Math.pow(0.08, dt);
        dragVelX *= Math.pow(0.08, dt);
        const restY = 0.18 + Math.sin(t * 0.45) * 0.14 * m;
        const restX = -0.04 + Math.cos(t * 0.35) * 0.05 * m;
        dragRotY += (restY - dragRotY) * Math.min(1, dt * 1.1);
        dragRotX += (restX - dragRotX) * Math.min(1, dt * 1.1);
      }

      const targetY = dragRotY + targetTiltY + impulseRef.current * 0.48;
      const targetX = dragRotX + targetTiltX;
      discGroup.rotation.y += (targetY - discGroup.rotation.y) * Math.min(1, dt * 7);
      discGroup.rotation.x += (targetX - discGroup.rotation.x) * Math.min(1, dt * 7);
      discGroup.position.y = Math.sin(t * 1.1) * 0.06 * m;

      brassRing.rotation.z = t * 0.14 * m;
      inkRing.rotation.z = -t * 0.1 * m;

      const angle = t * 0.38 * m;
      bead.position.set(
        Math.cos(angle) * 2.04,
        Math.sin(angle) * 2.04 * 0.62,
        Math.sin(angle) * 0.9
      );

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
      frontMatRef.current = null;
      backMatRef.current = null;

      rimGeo.dispose();
      faceGeo.dispose();
      brassRingGeo.dispose();
      inkRingGeo.dispose();
      beadGeo.dispose();
      brassMat.dispose();
      inkWireMat.dispose();
      frontMat.map?.dispose();
      frontMat.dispose();
      backMat.map?.dispose();
      backMat.dispose();
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
        <div className="w-52 h-52 rounded-full bg-white border border-[#C41E3A]/40 flex flex-col items-center justify-center shadow-md">
          <span className="font-hanzi-serif text-8xl font-bold text-[#1C1917]">{activeHanzi}</span>
          <span className="font-mono text-sm text-[#C41E3A] mt-1">{activePinyin}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label={`Mô hình 3D chữ Hán ${activeHanzi}`}
      className={`relative w-full h-full select-none touch-pan-y ${className}`}
    />
  );
};
