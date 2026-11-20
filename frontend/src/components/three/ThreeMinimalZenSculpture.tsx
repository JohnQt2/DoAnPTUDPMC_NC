import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeMinimalZenSculptureProps {
  /** Active Chinese character rendered crisply at the optical center */
  activeHanzi?: string;
  /** 'parchment' (warm ivory study shelf) or 'dark' (moody espresso/jade hero) */
  tone?: 'parchment' | 'dark';
  className?: string;
}

/**
 * Procedural Warm Scholar Studio Softbox Environment (zero external HDR fetch).
 * Reflects warm antique gold, Xuan ivory, and subtle jade onto the 3D optical jade/crystal rings.
 */
function buildWarmStudioEnv(renderer: THREE.WebGLRenderer, isDark: boolean): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(isDark ? 0x1a140f : 0xf3ecdc);

  const topLight = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({ color: 0xfffaf0, side: THREE.DoubleSide })
  );
  topLight.position.set(0, 10, 2);
  topLight.rotation.x = Math.PI / 2;
  envScene.add(topLight);

  // Antique Brass warm bounce
  const leftBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 12),
    new THREE.MeshBasicMaterial({ color: 0xd4b26a, side: THREE.DoubleSide })
  );
  leftBounce.position.set(-10, 1, 3);
  leftBounce.rotation.y = Math.PI / 2;
  envScene.add(leftBounce);

  // Imperial Jade subtle rim
  const rightRim = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 12),
    new THREE.MeshBasicMaterial({ color: isDark ? 0x1f3a2e : 0x2d5443, side: THREE.DoubleSide })
  );
  rightRim.position.set(10, -2, -2);
  rightRim.rotation.y = -Math.PI / 2;
  envScene.add(rightRim);

  // Cinnabar warm under-bounce
  const bottomBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshBasicMaterial({ color: isDark ? 0x7a2e2b : 0xdecfaa, side: THREE.DoubleSide })
  );
  bottomBounce.position.set(0, -9, 1);
  bottomBounce.rotation.x = -Math.PI / 2;
  envScene.add(bottomBounce);

  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  return rt.texture;
}

/**
 * Renders a crisp Song-dynasty calligraphic Hanzi seal onto a transparent canvas texture
 * framed cleanly in front of the 3D brass & celadon crystal armillary rings.
 */
function createCenterHanziSealTexture(char: string, isDark: boolean): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  // Soft warm Xuan paper seal disc
  const halo = ctx.createRadialGradient(256, 256, 20, 256, 256, 210);
  if (isDark) {
    halo.addColorStop(0, 'rgba(30, 22, 16, 0.88)');
    halo.addColorStop(0.66, 'rgba(30, 22, 16, 0.56)');
    halo.addColorStop(1, 'rgba(30, 22, 16, 0)');
  } else {
    halo.addColorStop(0, 'rgba(251, 247, 236, 0.96)');
    halo.addColorStop(0.68, 'rgba(243, 236, 220, 0.72)');
    halo.addColorStop(1, 'rgba(243, 236, 220, 0)');
  }
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(256, 256, 210, 0, Math.PI * 2);
  ctx.fill();

  // Delicate antique gold seal border
  ctx.strokeStyle = isDark ? 'rgba(212, 178, 106, 0.55)' : 'rgba(176, 141, 60, 0.45)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(256, 256, 172, 0, Math.PI * 2);
  ctx.stroke();

  // Cinnabar scholar seal accent dot at 12 o'clock
  ctx.fillStyle = '#7A2E2B';
  ctx.beginPath();
  ctx.arc(256, 96, 6, 0, Math.PI * 2);
  ctx.fill();

  // Song/Serif calligraphy Hanzi
  ctx.fillStyle = isDark ? '#FBF7EC' : '#2A2118';
  ctx.font = '700 242px "Noto Serif SC", "Songti SC", "STSong", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, 256, 268);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Interactive 3D Brass & Celadon Crystal Armillary Sphere (inspired by antique scholar armillary spheres):
 * - Tactile brushed antique brass rings + optical celadon jade crystal halo
 * - Single-draw-call InstancedMesh gold-dust particles (60 particles = 1 draw call)
 * - Unobstructed floating Hanzi seal centered in front
 * - Drag-to-spin inertial physics + spring impulse on character switch
 */
export const ThreeMinimalZenSculpture: React.FC<ThreeMinimalZenSculptureProps> = ({
  activeHanzi = '汉',
  tone = 'parchment',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hanziMeshRef = useRef<THREE.Mesh | null>(null);
  const impulseRef = useRef<number>(0);
  const [webglUnsupported, setWebglUnsupported] = useState(false);
  const isDark = tone === 'dark';

  useEffect(() => {
    const mesh = hanziMeshRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const prev = mat.map;
    mat.map = createCenterHanziSealTexture(activeHanzi, isDark);
    mat.needsUpdate = true;
    prev?.dispose();
    impulseRef.current = 2.1;
  }, [activeHanzi, isDark]);

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

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 440;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envTex = buildWarmStudioEnv(renderer, isDark);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.6);

    const ambient = new THREE.AmbientLight(0xfff7e6, 0.85);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff5e0, 2.2);
    keyLight.position.set(4.5, 6, 6);
    scene.add(keyLight);

    const goldAccentLight = new THREE.PointLight(0xd4b26a, 3.2, 16);
    goldAccentLight.position.set(-3.5, 2.5, 3);
    scene.add(goldAccentLight);

    const cinnabarRimLight = new THREE.PointLight(0x7a2e2b, 2.6, 16);
    cinnabarRimLight.position.set(3.5, -2.2, 2.5);
    scene.add(cinnabarRimLight);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const sculptureGroup = new THREE.Group();
    masterGroup.add(sculptureGroup);

    // 1. Optical Celadon-Ivory Crystal Halo Ring (single-pass physical glass — 3x faster than transmission FBO)
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xe6f0ea,
      opacity: 0.72,
      transparent: true,
      roughness: 0.08,
      metalness: 0.12,
      ior: 1.5,
      reflectivity: 1.0,
      specularIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 0.42,
      iridescenceIOR: 1.32,
      sheen: 0.65,
      sheenColor: new THREE.Color(0xd4b26a),
      envMapIntensity: 1.55,
    });

    // 2. Antique Scholar Brass Material (echoes libri.id.vn brass armillary sphere!)
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xb08d3c,
      metalness: 0.88,
      roughness: 0.24,
    });

    // 3. Deep Imperial Jade Lacquer Material
    const jadeMat = new THREE.MeshStandardMaterial({
      color: 0x1f3a2e,
      metalness: 0.35,
      roughness: 0.28,
    });

    // 4. Imperial Cinnabar Seal Material
    const cinnabarMat = new THREE.MeshStandardMaterial({
      color: 0x7a2e2b,
      metalness: 0.22,
      roughness: 0.3,
    });

    // Outer Optical Celadon Crystal Halo (behind the Hanzi seal)
    const outerCrystalGeo = new THREE.TorusGeometry(1.9, 0.2, 40, 128);
    const outerCrystalRing = new THREE.Mesh(outerCrystalGeo, crystalMat);
    outerCrystalRing.position.set(0, 0, -0.45);
    outerCrystalRing.rotation.x = 0.26;
    outerCrystalRing.rotation.y = -0.22;
    sculptureGroup.add(outerCrystalRing);

    // Antique Brass Armillary Meridian Rings
    const brassRing1Geo = new THREE.TorusGeometry(2.28, 0.032, 20, 128);
    const brassRing1 = new THREE.Mesh(brassRing1Geo, brassMat);
    brassRing1.position.set(0, 0, -0.35);
    brassRing1.rotation.x = Math.PI * 0.34;
    brassRing1.rotation.y = Math.PI * 0.16;
    sculptureGroup.add(brassRing1);

    const brassRing2Geo = new THREE.TorusGeometry(2.04, 0.022, 16, 128);
    const brassRing2 = new THREE.Mesh(brassRing2Geo, brassMat);
    brassRing2.position.set(0, 0, -0.45);
    brassRing2.rotation.x = -Math.PI * 0.28;
    brassRing2.rotation.y = -Math.PI * 0.24;
    sculptureGroup.add(brassRing2);

    const jadeRingGeo = new THREE.TorusGeometry(1.62, 0.045, 20, 112);
    const jadeRing = new THREE.Mesh(jadeRingGeo, jadeMat);
    jadeRing.position.set(0, 0, -0.6);
    jadeRing.rotation.x = Math.PI * 0.4;
    jadeRing.rotation.y = 0.35;
    sculptureGroup.add(jadeRing);

    // Orbiting Faceted Jade & Cinnabar Scholar Beads
    const prismGeo = new THREE.OctahedronGeometry(0.15, 0);
    const beadGeo = new THREE.SphereGeometry(0.09, 24, 24);
    const satellites = [
      { mesh: new THREE.Mesh(prismGeo, brassMat), radius: 2.28, angle: 0.4, speed: 0.34, yTilt: 0.42 },
      { mesh: new THREE.Mesh(prismGeo, crystalMat), radius: 2.04, angle: 2.5, speed: -0.26, yTilt: -0.32 },
      { mesh: new THREE.Mesh(beadGeo, cinnabarMat), radius: 2.28, angle: 4.3, speed: 0.34, yTilt: 0.22 },
      { mesh: new THREE.Mesh(beadGeo, jadeMat), radius: 1.92, angle: 5.5, speed: 0.22, yTilt: -0.25 },
    ];
    satellites.forEach((s) => sculptureGroup.add(s.mesh));

    // Single-draw-call InstancedMesh Gold Dust Motes (60 particles = 1 draw call)
    const PARTICLE_COUNT = 60;
    const dotGeo = new THREE.IcosahedronGeometry(0.022, 0);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0xb08d3c,
      metalness: 0.75,
      roughness: 0.3,
      transparent: true,
      opacity: 0.55,
    });
    const instancedDots = new THREE.InstancedMesh(dotGeo, dotMat, PARTICLE_COUNT);
    const dummy = new THREE.Object3D();
    for (let idx = 0; idx < PARTICLE_COUNT; idx++) {
      const phi = Math.acos(1 - (2 * (idx + 0.5)) / PARTICLE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
      const r = 2.48 + (idx % 5) * 0.2;
      dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) * 0.84,
        r * Math.sin(phi) * Math.sin(theta) - 0.7
      );
      dummy.scale.setScalar(0.6 + (idx % 4) * 0.24);
      dummy.updateMatrix();
      instancedDots.setMatrixAt(idx, dummy.matrix);
    }
    instancedDots.instanceMatrix.needsUpdate = true;
    masterGroup.add(instancedDots);

    // Unobstructed Center Hanzi Seal Plane cleanly in front
    const hanziGeo = new THREE.PlaneGeometry(1.9, 1.9);
    const hanziTex = createCenterHanziSealTexture(activeHanzi, isDark);
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
      targetTiltY = THREE.MathUtils.clamp(nx, -1, 1) * 0.34;
      targetTiltX = THREE.MathUtils.clamp(ny, -1, 1) * 0.24;

      if (isDragging) {
        dragRotY += (e.clientX - prevX) * 0.0085;
        dragRotX = THREE.MathUtils.clamp(dragRotX + (e.clientY - prevY) * 0.006, -0.8, 0.8);
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
      const w = container.clientWidth || 440;
      const h = container.clientHeight || 440;
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

      impulseRef.current *= Math.pow(0.08, dt);
      spinAccum += dt * (0.26 * motion + impulseRef.current);

      outerCrystalRing.rotation.z = spinAccum * 0.5;
      outerCrystalRing.rotation.x = 0.28 + Math.sin(t * 0.55) * 0.14 * motion;
      outerCrystalRing.rotation.y = -0.22 + Math.cos(t * 0.45) * 0.16 * motion;

      jadeRing.rotation.z = -spinAccum * 0.65;
      jadeRing.rotation.x = Math.PI * 0.38 + Math.cos(t * 0.6) * 0.14 * motion;

      brassRing1.rotation.z = t * 0.18 * motion + spinAccum * 0.3;
      brassRing2.rotation.z = -t * 0.14 * motion - spinAccum * 0.22;

      satellites.forEach((s, idx) => {
        const a = s.angle + t * s.speed * motion + spinAccum * 0.35;
        s.mesh.position.set(
          Math.cos(a) * s.radius,
          Math.sin(a * 1.2) * s.radius * s.yTilt,
          Math.sin(a) * s.radius * 0.55 - 0.35
        );
        s.mesh.rotation.x = t * 0.65 * motion + idx;
        s.mesh.rotation.y = t * 0.85 * motion;
      });

      instancedDots.rotation.y = t * 0.045 * motion;
      hanziPlane.position.y = Math.sin(t * 1.1) * 0.04 * motion;
      hanziPlane.scale.setScalar(1 + Math.min(impulseRef.current * 0.04, 0.075));

      if (!isDragging) {
        dragRotY *= Math.pow(0.25, dt);
        dragRotX *= Math.pow(0.25, dt);
      }
      sculptureGroup.rotation.y += (targetTiltY + dragRotY - sculptureGroup.rotation.y) * Math.min(1, dt * 7);
      sculptureGroup.rotation.x += (targetTiltX + dragRotX - sculptureGroup.rotation.x) * Math.min(1, dt * 7);

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

      outerCrystalGeo.dispose();
      brassRing1Geo.dispose();
      brassRing2Geo.dispose();
      jadeRingGeo.dispose();
      prismGeo.dispose();
      beadGeo.dispose();
      dotGeo.dispose();
      hanziGeo.dispose();

      crystalMat.dispose();
      brassMat.dispose();
      jadeMat.dispose();
      cinnabarMat.dispose();
      dotMat.dispose();
      hanziMat.map?.dispose();
      hanziMat.dispose();
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
        <div className="w-52 h-52 rounded-full bg-[#FBF7EC] border-2 border-[#B08D3C] flex items-center justify-center shadow-sm">
          <span className="font-hanzi-serif text-8xl font-bold text-[#2A2118]">{activeHanzi}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label={`Hỗn thiên nghi 3D chữ Hán ${activeHanzi}`}
      className={`relative w-full h-full select-none touch-pan-y ${className}`}
    />
  );
};
