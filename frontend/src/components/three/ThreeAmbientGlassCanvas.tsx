import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Ultra-calm, low-GPU 3D WebGL Liquid Glass Ambient Backdrop for the warm rice-paper (#F4F2EE) workspace.
 * Inspired by MengTo/threeui (LiquidFormBackground) + Landing.love (OTTO / Infinite Garden / HOLM):
 * - Restrained porcelain + seal-vermilion + mist-jade lighting (ZERO rainbow AI slop).
 * - Renders slowly rotating translucent 3D liquid glass spheres & sculptural ring behind transparent
 *   iPhone Liquid Glass cards so cards visibly refract real 3D depth without visual noise.
 * - Capped at DPR 1.0 and pauses automatically when tab is hidden or prefers-reduced-motion is on.
 */
export const ThreeAmbientGlassCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      return;
    }

    const getSize = () => ({
      w: Math.max(1, window.innerWidth),
      h: Math.max(1, window.innerHeight),
    });

    const { w, h } = getSize();
    renderer.setPixelRatio(1); // Keep ultra-lightweight behind translucent glass UI
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Minimal studio environment for crisp porcelain-glass reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0xf4f2ee);

    const topLightPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    topLightPlane.position.set(0, 10, 0);
    topLightPlane.rotation.x = Math.PI / 2;
    envScene.add(topLightPlane);

    const roseReflect = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 10),
      new THREE.MeshBasicMaterial({ color: 0xfecdd3, side: THREE.DoubleSide })
    );
    roseReflect.position.set(-10, 2, 2);
    roseReflect.rotation.y = Math.PI / 2;
    envScene.add(roseReflect);

    const jadeReflect = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 10),
      new THREE.MeshBasicMaterial({ color: 0xd1fae5, side: THREE.DoubleSide })
    );
    jadeReflect.position.set(10, -2, 2);
    jadeReflect.rotation.y = -Math.PI / 2;
    envScene.add(jadeReflect);

    const envTex = pmrem.fromScene(envScene, 0.05).texture;
    pmrem.dispose();
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0, 11);

    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const dirLight = new THREE.DirectionalLight(0xfff1f2, 1.4);
    dirLight.position.set(5, 7, 6);
    scene.add(dirLight);

    // Sculptural Liquid Glass Material
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      transparent: true,
      roughness: 0.14,
      metalness: 0.0,
      ior: 1.44,
      thickness: 2.2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      iridescence: 0.45,
      attenuationColor: new THREE.Color(0xfda4af),
      attenuationDistance: 4.5,
      envMapIntensity: 1.15,
    });

    // Soft Seal-Vermilion Porcelain Accent Orb (sits behind Sidebar/Hero edge)
    const sealOrbGeo = new THREE.SphereGeometry(2.1, 48, 48);
    const sealOrbMat = new THREE.MeshStandardMaterial({
      color: 0xfda4af,
      roughness: 0.55,
      metalness: 0.05,
      transparent: true,
      opacity: 0.52,
    });
    const sealOrb = new THREE.Mesh(sealOrbGeo, sealOrbMat);
    sealOrb.position.set(-5.2, 2.6, -3.5);
    scene.add(sealOrb);

    // Soft Mist-Jade Porcelain Accent Orb (sits behind bottom-right grid)
    const jadeOrbGeo = new THREE.SphereGeometry(2.4, 48, 48);
    const jadeOrbMat = new THREE.MeshStandardMaterial({
      color: 0xa7f3d0,
      roughness: 0.6,
      metalness: 0.05,
      transparent: true,
      opacity: 0.42,
    });
    const jadeOrb = new THREE.Mesh(jadeOrbGeo, jadeOrbMat);
    jadeOrb.position.set(5.4, -2.8, -4.2);
    scene.add(jadeOrb);

    // Architectural Sculpted Glass Torus (right-top, behind Hero & right cards)
    const torusGeo = new THREE.TorusGeometry(2.3, 0.58, 36, 96);
    const torusMesh = new THREE.Mesh(torusGeo, glassMat);
    torusMesh.position.set(4.5, 2.2, -1.6);
    scene.add(torusMesh);

    // Secondary Sculpted Glass Capsule/Sphere (mid-left behind floating Sidebar)
    const sphereGeo = new THREE.IcosahedronGeometry(1.55, 5);
    const sphereMesh = new THREE.Mesh(sphereGeo, glassMat);
    sphereMesh.position.set(-4.6, -2.2, -1.4);
    scene.add(sphereMesh);

    const onResize = () => {
      const next = getSize();
      camera.aspect = next.w / next.h;
      camera.updateProjectionMatrix();
      renderer.setSize(next.w, next.h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let rafId = 0;

    const renderFrame = () => {
      const t = clock.getElapsedTime();
      torusMesh.rotation.x = 0.55 + t * 0.08;
      torusMesh.rotation.y = -0.35 + t * 0.11;
      torusMesh.position.y = 2.2 + Math.sin(t * 0.35) * 0.25;

      sphereMesh.rotation.y = t * 0.09;
      sphereMesh.position.y = -2.2 + Math.cos(t * 0.3) * 0.22;

      sealOrb.position.x = -5.2 + Math.sin(t * 0.2) * 0.35;
      jadeOrb.position.x = 5.4 + Math.cos(t * 0.18) * 0.35;

      renderer.render(scene, camera);
    };

    if (reducedMotion) {
      // Render 1 crisp static 3D frame when prefers-reduced-motion is active
      renderFrame();
    } else {
      const animate = () => {
        rafId = requestAnimationFrame(animate);
        if (document.hidden) return;
        renderFrame();
      };
      animate();
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      sealOrbGeo.dispose();
      sealOrbMat.dispose();
      jadeOrbGeo.dispose();
      jadeOrbMat.dispose();
      torusGeo.dispose();
      sphereGeo.dispose();
      glassMat.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-90"
    />
  );
};
