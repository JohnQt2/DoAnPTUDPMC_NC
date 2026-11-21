import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { LANDING_HANZI_STROKE_DATA } from '../landing/landingHanziStrokes.data';
import { fetchHanziStrokeData, MakeMeAHanziData } from '../hanziStrokes.data';

interface ThreeMinimalZenSculptureProps {
  /** Active Chinese character sculpted as true 3D extruded strokes */
  activeHanzi?: string;
  /** Pinyin subtitle */
  activePinyin?: string;
  /** Tone accent hex color */
  accentHex?: string;
  /** When false, keeps WebGL context warm in memory while pausing rAF render work */
  isActive?: boolean;
  tone?: 'porcelain' | 'obsidian';
  className?: string;
}

/**
 * Soft Natural Daylight Studio Softbox Environment for 3D Crystal Sphere & Brushed Gold Bevels.
 */
function buildCrystalStudioEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xf5f2ec);

  const overhead = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  overhead.position.set(0, 10, 4);
  overhead.rotation.x = Math.PI / 2;
  envScene.add(overhead);

  const warmSide = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 14),
    new THREE.MeshBasicMaterial({ color: 0xffeacc, side: THREE.DoubleSide })
  );
  warmSide.position.set(-10, 3, 4);
  warmSide.rotation.y = Math.PI / 2;
  envScene.add(warmSide);

  const rimPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  rimPanel.position.set(9, -2, -5);
  rimPanel.rotation.y = -Math.PI / 3;
  envScene.add(rimPanel);

  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  return rt.texture;
}

/**
 * Converts a MakeMeAHanzi SVG stroke path string (1024x1024 space, M/L/Q/C/Z commands)
 * directly into Three.js Shape objects centered at (0, 0) for true 3D extrusion.
 */
function svgStrokePathToThreeShapes(d: string, scale = 1 / 355): THREE.Shape[] {
  const sp = new THREE.ShapePath();
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  let i = 0;
  let cmd = '';
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let qx = 0;
  let qy = 0;

  const tx = (x: number) => (x - 512) * scale;
  const ty = (y: number) => (y - 388) * scale;

  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) {
      cmd = tokens[i++];
    }
    switch (cmd) {
      case 'M':
        cx = Number(tokens[i++]);
        cy = Number(tokens[i++]);
        sx = cx;
        sy = cy;
        sp.moveTo(tx(cx), ty(cy));
        cmd = 'L';
        break;
      case 'L':
        cx = Number(tokens[i++]);
        cy = Number(tokens[i++]);
        sp.lineTo(tx(cx), ty(cy));
        break;
      case 'Q':
        qx = Number(tokens[i++]);
        qy = Number(tokens[i++]);
        cx = Number(tokens[i++]);
        cy = Number(tokens[i++]);
        sp.quadraticCurveTo(tx(qx), ty(qy), tx(cx), ty(cy));
        break;
      case 'C': {
        const x1 = Number(tokens[i++]);
        const y1 = Number(tokens[i++]);
        const x2 = Number(tokens[i++]);
        const y2 = Number(tokens[i++]);
        cx = Number(tokens[i++]);
        cy = Number(tokens[i++]);
        sp.bezierCurveTo(tx(x1), ty(y1), tx(x2), ty(y2), tx(cx), ty(cy));
        break;
      }
      case 'Z':
      case 'z':
        sp.lineTo(tx(sx), ty(sy));
        break;
      default:
        i++;
        break;
    }
  }

  return (sp as any).toShapes(true);
}

interface StrokeMeshEntry {
  mesh: THREE.Mesh;
  geo: THREE.ExtrudeGeometry;
  targetZ: number;
  spawnDelay: number;
}

/**
 * 3D Transparent Crystal Sphere & Pure 3D Extruded Calligraphic Hanzi Strokes Sculpture:
 * - Each stroke of the Chinese character is extruded into a real 3D solid mesh with brushed-gold beveled walls
 * - Encased inside a crystal-clear optical glass sphere (or toggled to pure floating 3D strokes mode)
 * - Full 360° multi-axis rotation on pointer/touch drag + staggered 3D stroke pop-in
 */
export const ThreeMinimalZenSculpture: React.FC<ThreeMinimalZenSculptureProps> = ({
  activeHanzi = '汉',
  activePinyin = 'hàn',
  accentHex = '#C41E3A',
  isActive = true,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const isActiveRef = useRef<boolean>(isActive);
  isActiveRef.current = isActive;

  // Toggle between "orb" (Crystal Glass Sphere + 3D Character) and "strokes" (Pure 3D Strokes Only)
  const [showCrystalOrb, setShowCrystalOrb] = useState<boolean>(true);
  const showCrystalOrbRef = useRef<boolean>(true);
  showCrystalOrbRef.current = showCrystalOrb;

  const [webglUnsupported, setWebglUnsupported] = useState(false);

  const rebuildCharRef = useRef<((hanzi: string, hex: string) => void) | null>(null);
  const impulseRef = useRef<number>(0);

  useEffect(() => {
    if (rebuildCharRef.current) {
      rebuildCharRef.current(activeHanzi, accentHex);
    }
    impulseRef.current = 1.65;
  }, [activeHanzi, accentHex]);

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.85));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envTex = buildCrystalStudioEnv(renderer);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 0.05, 7.15);

    const ambient = new THREE.AmbientLight(0xfffbf6, 1.25);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.65);
    keyLight.position.set(4.8, 6.8, 6.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf6e3ba, 1.05);
    rimLight.position.set(-5.0, -3.0, 4.5);
    scene.add(rimLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.75);
    backLight.position.set(0, 3, -6);
    scene.add(backLight);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Group holding the true 3D extruded calligraphic strokes
    const strokesGroup = new THREE.Group();
    masterGroup.add(strokesGroup);

    // Group holding the transparent crystal glass sphere & delicate astrolabe rings
    const crystalOrbGroup = new THREE.Group();
    masterGroup.add(crystalOrbGroup);

    // Materials for the 3D Extruded Strokes
    const inkFaceMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.28,
      metalness: 0.12,
    });
    const accentFaceMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      roughness: 0.24,
      metalness: 0.15,
    });
    const goldBevelSideMat = new THREE.MeshStandardMaterial({
      color: 0xd4a646,
      metalness: 0.82,
      roughness: 0.24,
    });
    const accentBevelSideMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex).lerp(new THREE.Color(0xd4a646), 0.45),
      metalness: 0.65,
      roughness: 0.28,
    });

    // Materials & Meshes for the Transparent 3D Crystal Sphere
    const glassOrbGeo = new THREE.SphereGeometry(1.78, 64, 64);
    const glassOrbMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.26,
      roughness: 0.06,
      metalness: 0.04,
      ior: 1.45,
      reflectivity: 0.92,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.45,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const glassOrbMesh = new THREE.Mesh(glassOrbGeo, glassOrbMat);
    glassOrbMesh.renderOrder = 3;
    crystalOrbGroup.add(glassOrbMesh);

    // Subtle back-hemisphere inner refraction sheen for crystal depth
    const innerGlassMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      transparent: true,
      opacity: 0.055,
      roughness: 0.2,
      metalness: 0.1,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const innerGlassMesh = new THREE.Mesh(glassOrbGeo, innerGlassMat);
    innerGlassMesh.scale.setScalar(0.985);
    innerGlassMesh.renderOrder = 1;
    crystalOrbGroup.add(innerGlassMesh);

    // Crisp Fresnel-like equatorial & meridian astrolabe hairlines hugging the crystal sphere
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc59b42,
      metalness: 0.8,
      roughness: 0.26,
    });
    const accentRingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentHex),
      metalness: 0.45,
      roughness: 0.32,
      transparent: true,
      opacity: 0.65,
    });

    const outerRingGeo = new THREE.TorusGeometry(1.98, 0.015, 16, 128);
    const outerRing = new THREE.Mesh(outerRingGeo, brassMat);
    outerRing.rotation.set(0.38, -0.26, 0);
    crystalOrbGroup.add(outerRing);

    const innerRingGeo = new THREE.TorusGeometry(1.82, 0.01, 14, 128);
    const innerRing = new THREE.Mesh(innerRingGeo, accentRingMat);
    innerRing.rotation.set(-0.32, 0.44, 0.14);
    crystalOrbGroup.add(innerRing);

    const beadGeo = new THREE.SphereGeometry(0.05, 20, 20);
    const beadMesh = new THREE.Mesh(beadGeo, brassMat);
    crystalOrbGroup.add(beadMesh);

    let strokeEntries: StrokeMeshEntry[] = [];
    let charSpawnTime = performance.now();

    const clearStrokeEntries = () => {
      strokeEntries.forEach((entry) => {
        strokesGroup.remove(entry.mesh);
        entry.geo.dispose();
      });
      strokeEntries = [];
    };

    const buildExtrudedStrokesFromData = (data: MakeMeAHanziData, hex: string) => {
      clearStrokeEntries();
      accentFaceMat.color.set(hex);
      accentBevelSideMat.color.set(hex).lerp(new THREE.Color(0xd4a646), 0.45);
      innerGlassMat.color.set(hex);
      accentRingMat.color.set(hex);

      const total = data.strokes.length;
      const extrudeDepth = 0.28;
      charSpawnTime = performance.now();

      data.strokes.forEach((pathStr, idx) => {
        try {
          const shapes = svgStrokePathToThreeShapes(pathStr, 1 / 355);
          if (!shapes || shapes.length === 0) return;

          const geo = new THREE.ExtrudeGeometry(shapes, {
            depth: extrudeDepth,
            bevelEnabled: true,
            bevelThickness: 0.042,
            bevelSize: 0.03,
            bevelSegments: 2,
            curveSegments: 7,
          });

          // Highlight the key first/signature stroke in the tone's accent lacquer, others in deep sumi ink + gold bevels
          const isAccentStroke = idx === 0 || (total >= 5 && idx === total - 1);
          const mesh = new THREE.Mesh(
            geo,
            isAccentStroke
              ? [accentFaceMat, accentBevelSideMat]
              : [inkFaceMat, goldBevelSideMat]
          );

          // Center extrusion around Z=0 with slight per-stroke depth offset so crossing strokes never Z-fight
          const targetZ = -extrudeDepth / 2 + (idx - (total - 1) / 2) * 0.022;
          mesh.position.set(0, 0, targetZ);
          mesh.renderOrder = 2;
          strokesGroup.add(mesh);

          strokeEntries.push({
            mesh,
            geo,
            targetZ,
            spawnDelay: idx * 0.055,
          });
        } catch {
          // Ignore malformed path segment gracefully
        }
      });
    };

    const loadAndBuildCharacter = (hanzi: string, hex: string) => {
      const prebundled = LANDING_HANZI_STROKE_DATA[hanzi];
      if (prebundled) {
        buildExtrudedStrokesFromData(prebundled, hex);
        return;
      }
      fetchHanziStrokeData(hanzi).then((fetched) => {
        if (fetched) {
          buildExtrudedStrokesFromData(fetched, hex);
        }
      });
    };

    rebuildCharRef.current = loadAndBuildCharacter;
    loadAndBuildCharacter(activeHanzi, accentHex);

    // Interactive 360° multi-axis drag rotation + inertial damping
    let targetTiltX = 0;
    let targetTiltY = 0;
    let dragRotX = 0.06;
    let dragRotY = -0.24;
    let dragVelX = 0;
    let dragVelY = 0;
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let isVisible = true;
    let rafId = 0;
    const startTime = performance.now();
    let prevTime = startTime;

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest('button')) return;
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
      targetTiltY = THREE.MathUtils.clamp(nx, -1, 1) * 0.18;
      targetTiltX = THREE.MathUtils.clamp(ny, -1, 1) * 0.14;

      if (isDragging) {
        const dx = (e.clientX - prevX) * 0.011;
        const dy = (e.clientY - prevY) * 0.009;
        // Full 360° free rotation around Y and generous X tilt so user can inspect all 3D stroke bevels
        dragRotY += dx;
        dragRotX = THREE.MathUtils.clamp(dragRotX + dy, -1.35, 1.35);
        dragVelY = dx * 15;
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
      const aspectScale =
        camera.aspect < 0.95 ? Math.min(1.42, 0.95 / Math.max(0.55, camera.aspect)) : 1;
      camera.position.z = 7.15 * aspectScale;
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

    renderer.render(scene, camera);

    let orbScale = 1;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const now = performance.now();
      if (!isActiveRef.current || !isVisible || document.hidden) {
        prevTime = now;
        return;
      }

      const dt = Math.min((now - prevTime) * 0.001, 0.05);
      prevTime = now;
      const t = (now - startTime) * 0.001;
      const m = reducedMotion ? 0 : 1;

      impulseRef.current *= Math.pow(0.06, dt);

      if (!isDragging) {
        dragRotY += dragVelY * dt;
        dragRotX = THREE.MathUtils.clamp(dragRotX + dragVelX * dt, -1.35, 1.35);
        dragVelY *= Math.pow(0.08, dt);
        dragVelX *= Math.pow(0.08, dt);
        // Gentle idle 3D showcase sway so the 3D gold stroke bevels catch the studio light
        dragRotY += 0.22 * dt * m;
        dragRotX += (0.05 + Math.cos(t * 0.45) * 0.06 * m - dragRotX) * Math.min(1, dt * 1.4);
      }

      const targetY = dragRotY + targetTiltY + impulseRef.current * 0.35;
      const targetX = dragRotX + targetTiltX;
      strokesGroup.rotation.y += (targetY - strokesGroup.rotation.y) * Math.min(1, dt * 8);
      strokesGroup.rotation.x += (targetX - strokesGroup.rotation.x) * Math.min(1, dt * 8);
      strokesGroup.position.y = Math.sin(t * 1.15) * 0.05 * m;

      // Staggered 3D stroke pop-in animation when switching characters
      const elapsedSinceSpawn = (now - charSpawnTime) * 0.001;
      strokeEntries.forEach((entry) => {
        const localT = Math.max(0, elapsedSinceSpawn - entry.spawnDelay);
        const progress = reducedMotion ? 1 : Math.min(1, localT / 0.28);
        const eased = 1 - Math.pow(1 - progress, 3);
        entry.mesh.scale.setScalar(Math.max(0.001, eased));
        entry.mesh.position.z = entry.targetZ + (1 - eased) * 0.45;
      });

      // Smoothly show/hide the outer transparent crystal orb & rings based on user toggle
      const targetOrbScale = showCrystalOrbRef.current ? 1 : 0;
      orbScale += (targetOrbScale - orbScale) * Math.min(1, dt * 10);
      crystalOrbGroup.visible = orbScale > 0.02;
      if (crystalOrbGroup.visible) {
        crystalOrbGroup.scale.setScalar(Math.max(0.001, orbScale));
        crystalOrbGroup.position.y = strokesGroup.position.y;
        crystalOrbGroup.rotation.y = strokesGroup.rotation.y * 0.35;
        crystalOrbGroup.rotation.x = strokesGroup.rotation.x * 0.35;

        outerRing.rotation.z = t * 0.16 * m;
        innerRing.rotation.z = -t * 0.12 * m;

        const angle = t * 0.42 * m;
        beadMesh.position.set(
          Math.cos(angle) * 1.98,
          Math.sin(angle) * 1.98 * 0.62,
          Math.sin(angle) * 0.85
        );
      }

      // Scale up pure 3D character slightly when crystal sphere is hidden
      const charGroupScale = 1 + (1 - orbScale) * 0.18;
      strokesGroup.scale.setScalar(charGroupScale);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      rebuildCharRef.current = null;
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerleave', onPointerLeave);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      clearStrokeEntries();
      glassOrbGeo.dispose();
      glassOrbMat.dispose();
      innerGlassMat.dispose();
      outerRingGeo.dispose();
      innerRingGeo.dispose();
      beadGeo.dispose();
      brassMat.dispose();
      accentRingMat.dispose();
      inkFaceMat.dispose();
      accentFaceMat.dispose();
      goldBevelSideMat.dispose();
      accentBevelSideMat.dispose();
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
        <div className="w-52 h-52 rounded-full bg-white/80 border border-[#C41E3A]/40 flex flex-col items-center justify-center shadow-md">
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
      aria-label={`Mô hình chữ Hán 3D ${activeHanzi}`}
      className={`relative w-full h-full select-none touch-none ${className}`}
    >
      {/* Quick Pill Switcher: Crystal Glass Sphere + 3D Strokes vs Pure 3D Extruded Strokes Only */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 inline-flex items-center p-0.5 rounded-full bg-white/85 backdrop-blur-sm border border-[#1C1917]/15 shadow-xs">
        <button
          type="button"
          onClick={() => setShowCrystalOrb(true)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
            showCrystalOrb
              ? 'bg-[#1C1917] text-white'
              : 'text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          Cầu pha lê 3D
        </button>
        <button
          type="button"
          onClick={() => setShowCrystalOrb(false)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
            !showCrystalOrb
              ? 'bg-[#C41E3A] text-white'
              : 'text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          Chỉ chữ 3D nét nổi
        </button>
      </div>
    </div>
  );
};
