import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Lightweight Ambient 3D Orbital Seal Rings & Floating Gold Dust for the dark
 * conversion pavilion (#bat-dau). Uses 1 InstancedMesh draw call + auto-pauses
 * via IntersectionObserver when offscreen so GPU cost is 0 when not visible.
 */
export const ThreeAmbientSealRings: React.FC<{ className?: string }> = ({ className = '' }) => {
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
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const w = container.clientWidth || 960;
    const h = container.clientHeight || 420;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 0, 10);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const crimsonLight = new THREE.PointLight(0xc41e3a, 5, 22);
    crimsonLight.position.set(-5, 3, 5);
    scene.add(crimsonLight);

    const goldLight = new THREE.PointLight(0xe6be4c, 4.5, 22);
    goldLight.position.set(5, -2, 5);
    scene.add(goldLight);

    const rig = new THREE.Group();
    scene.add(rig);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      metalness: 0.85,
      roughness: 0.25,
      transparent: true,
      opacity: 0.52,
    });
    const crimsonMat = new THREE.MeshStandardMaterial({
      color: 0xc41e3a,
      metalness: 0.65,
      roughness: 0.28,
      transparent: true,
      opacity: 0.45,
    });

    const ring1Geo = new THREE.TorusGeometry(4.4, 0.032, 16, 128);
    const ring1 = new THREE.Mesh(ring1Geo, goldMat);
    ring1.rotation.set(0.65, 0.25, 0);
    rig.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.4, 0.028, 16, 112);
    const ring2 = new THREE.Mesh(ring2Geo, crimsonMat);
    ring2.rotation.set(-0.55, 0.4, 0.2);
    rig.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(5.5, 0.02, 12, 128);
    const ring3 = new THREE.Mesh(ring3Geo, goldMat);
    ring3.rotation.set(0.2, -0.5, 0.35);
    rig.add(ring3);

    // 80 Gold & Crimson dust particles (1 draw call)
    const COUNT = 80;
    const dotGeo = new THREE.OctahedronGeometry(0.04, 0);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.InstancedMesh(dotGeo, dotMat, COUNT);
    const dummy = new THREE.Object3D();
    const cGold = new THREE.Color(0xe6be4c);
    const cCrimson = new THREE.Color(0xe14962);
    for (let i = 0; i < COUNT; i++) {
      const a = (i / COUNT) * Math.PI * 2;
      const rad = 2.6 + (i % 7) * 0.62;
      dummy.position.set(
        Math.cos(a) * rad * 1.35,
        Math.sin(a * 1.7) * 2.2,
        Math.sin(a) * 2.4 - 1.2
      );
      dummy.scale.setScalar(0.6 + (i % 4) * 0.3);
      dummy.updateMatrix();
      particles.setMatrixAt(i, dummy.matrix);
      particles.setColorAt(i, i % 3 === 0 ? cCrimson : cGold);
    }
    particles.instanceMatrix.needsUpdate = true;
    if (particles.instanceColor) particles.instanceColor.needsUpdate = true;
    rig.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    let isVisible = false;
    let rafId = 0;
    const clock = new THREE.Clock();

    const onMove = (e: PointerEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.35;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.25;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const ro = new ResizeObserver(() => {
      const nw = container.clientWidth || 960;
      const nh = container.clientHeight || 420;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(container);

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.02 }
    );
    io.observe(container);

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      if (!isVisible || document.hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const m = reducedMotion ? 0 : 1;

      ring1.rotation.z = t * 0.14 * m;
      ring2.rotation.z = -t * 0.18 * m;
      ring3.rotation.y = -0.5 + t * 0.09 * m;
      particles.rotation.y = t * 0.05 * m;

      rig.rotation.y += (mouseX - rig.rotation.y) * Math.min(1, dt * 3);
      rig.rotation.x += (mouseY - rig.rotation.x) * Math.min(1, dt * 3);

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onMove);
      ro.disconnect();
      io.disconnect();
      ring1Geo.dispose();
      ring2Geo.dispose();
      ring3Geo.dispose();
      dotGeo.dispose();
      goldMat.dispose();
      crimsonMat.dispose();
      dotMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} aria-hidden="true" className={`pointer-events-none ${className}`} />;
};
