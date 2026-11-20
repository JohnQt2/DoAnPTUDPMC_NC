import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeLiquidHeroSceneProps {
  /** Highlighted Chinese character reflected inside the 3D crystal sculpture */
  activeHanzi?: string;
  /** Visual mode: obsidian dark gallery or warm porcelain light */
  mode?: 'dark' | 'light';
  className?: string;
}

/**
 * Procedural Studio Softbox Environment (zero external HDR network fetches).
 * Gives Three.js MeshPhysicalMaterial authentic Apple/iPhone Liquid Glass specular reflections.
 */
function buildStudioEnvTexture(renderer: THREE.WebGLRenderer, isDark: boolean): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(isDark ? 0x0b0b12 : 0xf4f2ee);

  // Overhead softbox panel
  const topPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  topPanel.position.set(0, 9, 2);
  topPanel.rotation.x = Math.PI / 2;
  envScene.add(topPanel);

  // Warm Seal-Vermilion key reflector
  const leftPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 10),
    new THREE.MeshBasicMaterial({ color: isDark ? 0xf43f5e : 0xfda4af, side: THREE.DoubleSide })
  );
  leftPanel.position.set(-9, 2, 3);
  leftPanel.rotation.y = Math.PI / 2;
  envScene.add(leftPanel);

  // Cool Porcelain-Ice rim reflector
  const rightPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 10),
    new THREE.MeshBasicMaterial({ color: isDark ? 0x93c5fd : 0xe0f2fe, side: THREE.DoubleSide })
  );
  rightPanel.position.set(9, -1, 4);
  rightPanel.rotation.y = -Math.PI / 2;
  envScene.add(rightPanel);

  // Soft Warm Gold bottom bounce
  const bottomPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshBasicMaterial({ color: isDark ? 0xfbbf24 : 0xfef3c7, side: THREE.DoubleSide })
  );
  bottomPanel.position.set(0, -8, 2);
  bottomPanel.rotation.x = -Math.PI / 2;
  envScene.add(bottomPanel);

  const renderTarget = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  return renderTarget.texture;
}

/**
 * Render a crisp floating Hanzi character onto a transparent canvas texture
 * so it floats physically inside/around the 3D optical glass sculpture (inspired by Lettra & ThreeUI).
 */
function createHanziPlaneTexture(char: string, isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 512);

  // Subtle circular seal-ink halo
  const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 220);
  grad.addColorStop(0, isDark ? 'rgba(217, 58, 85, 0.24)' : 'rgba(217, 58, 85, 0.16)');
  grad.addColorStop(1, 'rgba(217, 58, 85, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.fill();

  // Crisp Song/Serif calligraphy character
  ctx.fillStyle = isDark ? 'rgba(248, 245, 240, 0.96)' : 'rgba(22, 21, 27, 0.92)';
  ctx.font = '700 280px "Noto Serif SC", "Songti SC", "STSong", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, 256, 268);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Interactive 3D WebGL Physical Liquid Glass Centerpiece
 * Inspired by MengTo/threeui (raw Three.js physical refraction) + Lettra / HOLM (Landing.love).
 */
export const ThreeLiquidHeroScene: React.FC<ThreeLiquidHeroSceneProps> = ({
  activeHanzi = '汉',
  mode = 'dark',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hanziMeshRef = useRef<THREE.Mesh | null>(null);
  const [webglUnsupported, setWebglUnsupported] = useState(false);

  // Swap floating 3D Hanzi texture smoothly whenever activeHanzi changes
  useEffect(() => {
    const mesh = hanziMeshRef.current;
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const oldTex = mat.map;
    mat.map = createHanziPlaneTexture(activeHanzi, mode === 'dark');
    mat.needsUpdate = true;
    oldTex?.dispose();
  }, [activeHanzi, mode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDark = mode === 'dark';

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
    renderer.toneMappingExposure = isDark ? 1.15 : 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envTex = buildStudioEnvTexture(renderer, isDark);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    // Sculpted Studio Lighting
    const ambient = new THREE.AmbientLight(0xffffff, isDark ? 0.5 : 0.85);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff5f5, 2.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const vermilionLight = new THREE.PointLight(0xd93a55, isDark ? 9 : 4.5, 16);
    vermilionLight.position.set(-3.2, -1.8, 2.4);
    scene.add(vermilionLight);

    const rimLight = new THREE.PointLight(0x93c5fd, isDark ? 6 : 3.2, 16);
    rimLight.position.set(3.4, 2.6, -2.0);
    scene.add(rimLight);

    // Master sculpture group for gentle pointer parallax
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. REAL OPTICAL LIQUID GLASS SCULPTURE (MeshPhysicalMaterial transmission + iridescence)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0xffffff : 0xffffff,
      transmission: 0.96,
      opacity: 1,
      transparent: true,
      roughness: 0.055,
      metalness: 0.0,
      ior: 1.48,
      thickness: 1.9,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      iridescence: 0.85,
      iridescenceIOR: 1.32,
      iridescenceThicknessRange: [120, 420],
      attenuationColor: new THREE.Color(isDark ? 0xfda4af : 0xfecdd3),
      attenuationDistance: 3.4,
      envMapIntensity: isDark ? 1.45 : 1.25,
    });

    const knotGeo = new THREE.TorusKnotGeometry(1.38, 0.36, 180, 36, 2, 3);
    const glassSculpture = new THREE.Mesh(knotGeo, glassMat);
    rootGroup.add(glassSculpture);

    // 2. Inner Seal-Vermilion Porcelain Core (visible refracting & magnifying through the crystal!)
    const coreGeo = new THREE.SphereGeometry(0.68, 48, 48);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xd93a55,
      emissive: 0x9f1239,
      emissiveIntensity: isDark ? 0.55 : 0.25,
      roughness: 0.22,
      metalness: 0.12,
    });
    const coreSphere = new THREE.Mesh(coreGeo, coreMat);
    coreSphere.position.set(0, 0, -0.35);
    rootGroup.add(coreSphere);

    // 3. Delicate Architectural Metallic Halo Ring
    const ringGeo = new THREE.TorusGeometry(2.25, 0.014, 16, 128);
    const ringMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0xe2e8f0 : 0x57535f,
      metalness: 0.85,
      roughness: 0.2,
      transparent: true,
      opacity: isDark ? 0.42 : 0.28,
    });
    const orbitRing = new THREE.Mesh(ringGeo, ringMat);
    orbitRing.rotation.x = Math.PI * 0.36;
    orbitRing.rotation.y = Math.PI * 0.14;
    rootGroup.add(orbitRing);

    // 4. Floating 3D Glass Dewdrops orbiting along the ring
    const dropGeo = new THREE.SphereGeometry(0.16, 32, 32);
    const droplets: Array<{ mesh: THREE.Mesh; angle: number; radius: number; speed: number; yOff: number }> = [
      { mesh: new THREE.Mesh(dropGeo, glassMat), angle: 0.4, radius: 2.25, speed: 0.35, yOff: 0.25 },
      { mesh: new THREE.Mesh(dropGeo, glassMat), angle: 2.5, radius: 2.05, speed: -0.28, yOff: -0.3 },
      { mesh: new THREE.Mesh(dropGeo, glassMat), angle: 4.6, radius: 2.35, speed: 0.24, yOff: 0.15 },
    ];
    droplets.forEach((d, idx) => {
      d.mesh.scale.setScalar(idx === 0 ? 1.15 : idx === 1 ? 0.85 : 0.68);
      rootGroup.add(d.mesh);
    });

    // 5. Floating Crisp 3D Hanzi Specimen Plane (weaves with the refractive sculpture like Lettra)
    const hanziGeo = new THREE.PlaneGeometry(1.75, 1.75);
    const hanziTex = createHanziPlaneTexture(activeHanzi, isDark);
    const hanziMat = new THREE.MeshBasicMaterial({
      map: hanziTex,
      transparent: true,
      depthWrite: false,
    });
    const hanziPlane = new THREE.Mesh(hanziGeo, hanziMat);
    hanziPlane.position.set(0, 0, 1.55);
    rootGroup.add(hanziPlane);
    hanziMeshRef.current = hanziPlane;

    // Smooth pointer parallax tracking
    let targetRotX = 0;
    let targetRotY = 0;
    let isVisible = true;
    let rafId = 0;
    const clock = new THREE.Clock();

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      targetRotY = THREE.MathUtils.clamp(nx, -1, 1) * 0.42;
      targetRotX = THREE.MathUtils.clamp(ny, -1, 1) * 0.32;
    };

    const onPointerLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
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
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden) return;

      const t = clock.getElapsedTime();
      const motionScale = reducedMotion ? 0.08 : 1;

      // Fluid organic sculpture rotation
      glassSculpture.rotation.x = t * 0.22 * motionScale;
      glassSculpture.rotation.y = t * 0.30 * motionScale;
      glassSculpture.position.y = Math.sin(t * 0.9) * 0.1 * motionScale;

      // Subtle breathing on vermilion seal core
      const pulse = 1 + Math.sin(t * 1.4) * 0.04 * motionScale;
      coreSphere.scale.setScalar(pulse);

      // Orbit ring & droplets
      orbitRing.rotation.z = t * 0.14 * motionScale;
      droplets.forEach((d) => {
        const a = d.angle + t * d.speed * motionScale;
        d.mesh.position.set(
          Math.cos(a) * d.radius,
          d.yOff + Math.sin(a * 1.5) * 0.35,
          Math.sin(a) * d.radius * 0.65
        );
      });

      // Gentle Hanzi float
      hanziPlane.position.y = Math.sin(t * 1.1 + 0.6) * 0.08 * motionScale;

      // Silky pointer parallax interpolation
      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.06;
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      hanziMeshRef.current = null;

      knotGeo.dispose();
      coreGeo.dispose();
      ringGeo.dispose();
      dropGeo.dispose();
      hanziGeo.dispose();
      glassMat.dispose();
      coreMat.dispose();
      ringMat.dispose();
      hanziMat.map?.dispose();
      hanziMat.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [mode]);

  if (webglUnsupported) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-rose-500/20 via-white/10 to-sky-400/20 border border-white/20 backdrop-blur-2xl flex items-center justify-center shadow-2xl">
          <span className="font-hanzi-serif text-8xl font-bold text-white/90">{activeHanzi}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      aria-label={`Khối kính lỏng 3D chữ ${activeHanzi}`}
      className={`relative w-full h-full select-none ${className}`}
    />
  );
};
