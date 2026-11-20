import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface ThreeStudyDioramaStageProps {
  /** 0 = 4 Tones 3D Curves, 1 = TianZiGe Porcelain Stone, 2 = 3D Flashcards, 3 = HSK 1–6 Steps */
  activeScene: 0 | 1 | 2 | 3;
  activeToneIdx: number;
  activeStrokeChar: string;
  activeStrokePinyin: string;
  activeStrokeCount: number;
  flippedCards: Record<string, boolean>;
  activeCardIdx: number;
  activeHskLevel: number;
  theme?: 'dark' | 'light';
  className?: string;
}

const CARD_SPECS = [
  {
    id: 'nihao',
    hanzi: '你好',
    pinyin: 'nǐ hǎo',
    sino: 'Nhĩ hảo',
    meaning: 'Xin chào',
    example: '你好，很高兴认识你！',
    accent: '#C41E3A',
    cover: '#FFFFFF',
    ink: '#1C1917',
  },
  {
    id: 'xuexi',
    hanzi: '学习',
    pinyin: 'xuéxí',
    sino: 'Học tập',
    meaning: 'Học tập',
    example: '我每天学习中文。',
    accent: '#157A57',
    cover: '#FAF7F2',
    ink: '#1C1917',
  },
  {
    id: 'xiexie',
    hanzi: '谢谢',
    pinyin: 'xièxie',
    sino: 'Tạ tạ',
    meaning: 'Cảm ơn',
    example: '谢谢你的帮助！',
    accent: '#B5841A',
    cover: '#FFFFFF',
    ink: '#1C1917',
  },
];

function buildDaylightEnv(renderer: THREE.WebGLRenderer, isLight: boolean): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(isLight ? 0xf5f2ec : 0x1b1817);

  const overhead = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  overhead.position.set(0, 10, 3);
  overhead.rotation.x = Math.PI / 2;
  envScene.add(overhead);

  const warmSide = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 14),
    new THREE.MeshBasicMaterial({ color: 0xf7eee0, side: THREE.DoubleSide })
  );
  warmSide.position.set(-10, 2, 3);
  warmSide.rotation.y = Math.PI / 2;
  envScene.add(warmSide);

  const rt = pmrem.fromScene(envScene, 0.05);
  pmrem.dispose();
  return rt.texture;
}

/** Crisp 512x512 Matte Xuan-Paper TianZiGe Slab Texture */
function createTianZiGeTexture(char: string, pinyin: string, strokes: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FCF9F4';
  ctx.fillRect(0, 0, size, size);

  // Fine vermilion outer square
  ctx.strokeStyle = 'rgba(196, 30, 58, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(42, 42, size - 84, size - 84);

  // Subtle dashed TianZiGe cross + diagonal guides
  ctx.strokeStyle = 'rgba(196, 30, 58, 0.2)';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(size / 2, 42);
  ctx.lineTo(size / 2, size - 42);
  ctx.moveTo(42, size / 2);
  ctx.lineTo(size - 42, size / 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(28, 25, 23, 0.08)';
  ctx.beginPath();
  ctx.moveTo(42, 42);
  ctx.lineTo(size - 42, size - 42);
  ctx.moveTo(size - 42, 42);
  ctx.lineTo(42, size - 42);
  ctx.stroke();
  ctx.setLineDash([]);

  // Clean minimalist metadata header
  ctx.fillStyle = '#C41E3A';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(pinyin, 58, 76);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6B625C';
  ctx.fillText(`${strokes} nét`, size - 58, 76);

  // Calligraphic Hanzi in sumi ink
  ctx.fillStyle = '#1C1917';
  ctx.font = '700 260px "Noto Serif SC", "Songti SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, size / 2, size / 2 + 12);

  // Small red scholar seal stamp in corner
  ctx.fillStyle = '#C41E3A';
  ctx.fillRect(size - 90, size - 90, 34, 34);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 18px "Noto Serif SC", serif';
  ctx.fillText('笔', size - 73, size - 72);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Tactile Linen Paper Flashcard Front Texture (editorial typography — zero game neon) */
function createCardFrontTexture(spec: (typeof CARD_SPECS)[number]): THREE.CanvasTexture {
  const w = 384;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spec.cover;
  ctx.fillRect(0, 0, w, h);

  // Top 8px subtle pigment bar
  ctx.fillStyle = spec.accent;
  ctx.fillRect(0, 0, w, 10);

  // Minimal hairline inner frame
  ctx.strokeStyle = 'rgba(28, 25, 23, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 26, w - 40, h - 46);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#78716C';
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.fillText('HSK 1 · TỪ VỰNG', w / 2, 66);

  ctx.fillStyle = spec.ink;
  ctx.font = '700 124px "Noto Serif SC", serif';
  ctx.fillText(spec.hanzi, w / 2, h / 2 - 20);

  ctx.fillStyle = spec.accent;
  ctx.font = '700 30px "JetBrains Mono", monospace';
  ctx.fillText(spec.pinyin, w / 2, h / 2 + 92);

  ctx.fillStyle = '#57534E';
  ctx.font = '500 22px "Be Vietnam Pro", sans-serif';
  ctx.fillText(spec.meaning, w / 2, h - 78);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Tactile Vermilion & Ink Reverse Flashcard Texture (Study Notes + Example) */
function createCardBackTexture(spec: (typeof CARD_SPECS)[number]): THREE.CanvasTexture {
  const w = 384;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1C1917';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = spec.accent;
  ctx.fillRect(0, 0, w, 10);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 26, w - 40, h - 46);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#E6BE4C';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillText(`HÁN-VIỆT: ${spec.sino.toUpperCase()}`, w / 2, 80);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 66px "Noto Serif SC", serif';
  ctx.fillText(spec.hanzi, w / 2, 166);

  ctx.fillStyle = '#F5EFE6';
  ctx.font = '600 24px "Be Vietnam Pro", sans-serif';
  ctx.fillText(spec.meaning, w / 2, 236);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(32, 290, w - 64, 126, 10);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 25px "Noto Serif SC", serif';
  ctx.fillText(spec.example, w / 2, 336);

  ctx.fillStyle = '#D6D0C8';
  ctx.font = '500 17px "JetBrains Mono", monospace';
  ctx.fillText(spec.pinyin, w / 2, 382);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '500 15px "JetBrains Mono", monospace';
  ctx.fillText('ÔN LẠI THEO LỊCH SM-2', w / 2, h - 48);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Clean Ceramic HSK Plinth Top Label */
function createHskLabelTexture(level: number, words: string, accent: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, size - 20, size - 20);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1C1917';
  ctx.font = '800 54px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`HSK ${level}`, size / 2, size / 2 - 22);

  ctx.fillStyle = accent;
  ctx.font = '700 24px "JetBrains Mono", monospace';
  ctx.fillText(words, size / 2, size / 2 + 40);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export const ThreeStudyDioramaStage: React.FC<ThreeStudyDioramaStageProps> = ({
  activeScene,
  activeToneIdx,
  activeStrokeChar,
  activeStrokePinyin,
  activeStrokeCount,
  flippedCards,
  activeCardIdx,
  activeHskLevel,
  theme = 'light',
  className = '',
}) => {
  const isLight = theme === 'light';
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnsupported, setWebglUnsupported] = useState(false);

  const stateRef = useRef({
    activeScene,
    activeToneIdx,
    activeCardIdx,
    activeHskLevel,
    flippedCards,
  });
  stateRef.current = {
    activeScene,
    activeToneIdx,
    activeCardIdx,
    activeHskLevel,
    flippedCards,
  };

  const tabletMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    const mat = tabletMatRef.current;
    if (!mat) return;
    const prev = mat.map;
    mat.map = createTianZiGeTexture(activeStrokeChar, activeStrokePinyin, activeStrokeCount);
    mat.needsUpdate = true;
    prev?.dispose();
  }, [activeStrokeChar, activeStrokePinyin, activeStrokeCount]);

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

    const w = container.clientWidth || 640;
    const h = container.clientHeight || 520;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envTex = buildDaylightEnv(renderer, isLight);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(0, 0.35, 8.0);

    // Calm daylight gallery lighting (zero neon game glow)
    const ambient = new THREE.AmbientLight(0xfffaf4, 1.25);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(4.5, 7, 6.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf2e8db, 0.75);
    fillLight.position.set(-5, 2, 4);
    scene.add(fillLight);

    const rootRig = new THREE.Group();
    scene.add(rootRig);

    const walnutMat = new THREE.MeshStandardMaterial({
      color: 0x3b2c25,
      metalness: 0.12,
      roughness: 0.52,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc29940,
      metalness: 0.75,
      roughness: 0.28,
    });
    const crimsonMat = new THREE.MeshStandardMaterial({
      color: 0xc41e3a,
      metalness: 0.15,
      roughness: 0.34,
    });
    const porcelainEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xe6dfd6,
      metalness: 0.05,
      roughness: 0.45,
    });

    // Subtle hairline circular calibration ring beneath exhibits
    const baseRingGeo = new THREE.TorusGeometry(2.65, 0.012, 12, 112);
    const baseRingMat = new THREE.MeshBasicMaterial({
      color: isLight ? 0x1c1917 : 0xd4a017,
      transparent: true,
      opacity: isLight ? 0.14 : 0.24,
    });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = -2.0;
    rootRig.add(baseRing);

    // ══════════════════════════════════════════════════════════════════════════
    // SCENE 0: 4 TONES SCULPTURAL ACOUSTIC CURVES (mā · má · mǎ · mà)
    // ══════════════════════════════════════════════════════════════════════════
    const tonesGroup = new THREE.Group();
    rootRig.add(tonesGroup);

    const railGeo = new THREE.BoxGeometry(4.5, 0.014, 0.014);
    const railMat = new THREE.MeshBasicMaterial({
      color: isLight ? 0x1c1917 : 0xffffff,
      transparent: true,
      opacity: isLight ? 0.16 : 0.15,
    });
    [-1.1, 0, 1.1].forEach((ry) => {
      const r = new THREE.Mesh(railGeo, railMat);
      r.position.set(0, ry, -0.5);
      tonesGroup.add(r);
    });

    const toneCurves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.95, 1.05, 0),
        new THREE.Vector3(-0.65, 1.05, 0),
        new THREE.Vector3(0.65, 1.05, 0),
        new THREE.Vector3(1.95, 1.05, 0),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.95, -0.45, 0),
        new THREE.Vector3(-0.5, -0.1, 0),
        new THREE.Vector3(0.85, 0.52, 0),
        new THREE.Vector3(1.95, 1.15, 0),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.95, -0.25, 0),
        new THREE.Vector3(-0.55, -1.1, 0),
        new THREE.Vector3(0.75, -0.75, 0),
        new THREE.Vector3(1.95, 0.42, 0),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.95, 1.12, 0),
        new THREE.Vector3(-0.55, 0.48, 0),
        new THREE.Vector3(0.75, -0.35, 0),
        new THREE.Vector3(1.95, -1.12, 0),
      ]),
    ];

    // Refined academic pigments (Muted Jade, Imperial Crimson, Warm Ochre, Sumi Ink)
    const toneColors = [0x157a57, 0xc41e3a, 0xb8860b, 0x2c2524];
    const toneMeshes: Array<{
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      baseZ: number;
      curve: THREE.CatmullRomCurve3;
    }> = [];

    toneCurves.forEach((curve, idx) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.11, 18, false);
      const mat = new THREE.MeshStandardMaterial({
        color: toneColors[idx],
        metalness: 0.12,
        roughness: 0.32,
      });
      const mesh = new THREE.Mesh(tubeGeo, mat);
      const baseZ = (1.5 - idx) * 0.5;
      mesh.position.z = baseZ;
      tonesGroup.add(mesh);
      toneMeshes.push({ mesh, mat, baseZ, curve });
    });

    // Clean matte ivory bead tracing along the active pitch contour
    const orbGeo = new THREE.SphereGeometry(0.18, 24, 24);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.08,
    });
    const pitchOrb = new THREE.Mesh(orbGeo, orbMat);
    tonesGroup.add(pitchOrb);

    // ══════════════════════════════════════════════════════════════════════════
    // SCENE 1: REFINED TIANZIGE MATTE PORCELAIN & WALNUT CALLIGRAPHY SLAB
    // ══════════════════════════════════════════════════════════════════════════
    const strokeGroup = new THREE.Group();
    rootRig.add(strokeGroup);

    const tabletTex = createTianZiGeTexture(
      activeStrokeChar,
      activeStrokePinyin,
      activeStrokeCount
    );
    const tabletFaceMat = new THREE.MeshStandardMaterial({
      map: tabletTex,
      roughness: 0.42,
      metalness: 0.04,
    });
    tabletMatRef.current = tabletFaceMat;

    const tabletGeo = new THREE.BoxGeometry(2.95, 2.95, 0.18);
    const tabletMesh = new THREE.Mesh(tabletGeo, [
      porcelainEdgeMat,
      porcelainEdgeMat,
      porcelainEdgeMat,
      porcelainEdgeMat,
      tabletFaceMat,
      walnutMat,
    ]);
    strokeGroup.add(tabletMesh);

    // Thin handcrafted walnut-wood outer frame (zero clunky cartoon yellow corners!)
    const bezelGeo = new THREE.BoxGeometry(3.12, 3.12, 0.14);
    const bezelMesh = new THREE.Mesh(bezelGeo, walnutMat);
    bezelMesh.position.z = -0.04;
    strokeGroup.add(bezelMesh);

    // Subtle brass trim hairline
    const trimGeo = new THREE.BoxGeometry(3.16, 3.16, 0.04);
    const trimMesh = new THREE.Mesh(trimGeo, brassMat);
    trimMesh.position.z = -0.09;
    strokeGroup.add(trimMesh);

    // ══════════════════════════════════════════════════════════════════════════
    // SCENE 2: TACTILE 3D DOUBLE-SIDED LINEN & SUMI FLASHCARDS (180° FLIP)
    // ══════════════════════════════════════════════════════════════════════════
    const cardsGroup = new THREE.Group();
    rootRig.add(cardsGroup);

    const cardGeo = new THREE.BoxGeometry(1.75, 2.38, 0.07);
    const cardEntries = CARD_SPECS.map((spec, idx) => {
      const frontTex = createCardFrontTexture(spec);
      const backTex = createCardBackTexture(spec);
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
      const mesh = new THREE.Mesh(cardGeo, [
        porcelainEdgeMat,
        porcelainEdgeMat,
        porcelainEdgeMat,
        porcelainEdgeMat,
        frontMat,
        backMat,
      ]);
      const baseX = (idx - 1) * 1.98;
      mesh.position.set(baseX, 0, idx === 1 ? 0.35 : -0.2);
      cardsGroup.add(mesh);
      return {
        id: spec.id,
        mesh,
        frontMat,
        backMat,
        baseX,
        currentFlipY: 0,
      };
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SCENE 3: ARCHITECTURAL HSK 1 → 6 GRADUATED CERAMIC STEPS (ZERO RPG RUBY!)
    // ══════════════════════════════════════════════════════════════════════════
    const hskGroup = new THREE.Group();
    rootRig.add(hskGroup);

    const hskSpecs = [
      { level: 1, words: '150 từ', accent: '#157A57', hex: 0xe7efe9 },
      { level: 2, words: '300 từ', accent: '#157A57', hex: 0xd4e5db },
      { level: 3, words: '600 từ', accent: '#B8860B', hex: 0xf1e6cf },
      { level: 4, words: '1.200 từ', accent: '#B8860B', hex: 0xe6d3ae },
      { level: 5, words: '2.500 từ', accent: '#C41E3A', hex: 0xdfb8be },
      { level: 6, words: '5.000+ từ', accent: '#C41E3A', hex: 0xc41e3a },
    ];

    const hskBlocks: Array<{
      group: THREE.Group;
      topMat: THREE.MeshStandardMaterial;
      sideMat: THREE.MeshStandardMaterial;
      basePos: THREE.Vector3;
    }> = [];

    hskSpecs.forEach((spec, i) => {
      const g = new THREE.Group();
      const colH = 0.62 + i * 0.4;
      const boxGeo = new THREE.BoxGeometry(0.84, colH, 0.84);
      const labelTex = createHskLabelTexture(spec.level, spec.words, spec.accent);
      const topMat = new THREE.MeshStandardMaterial({
        map: labelTex,
        roughness: 0.38,
        metalness: 0.05,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        color: spec.hex,
        metalness: 0.08,
        roughness: 0.38,
      });
      const mesh = new THREE.Mesh(boxGeo, [
        sideMat,
        sideMat,
        topMat,
        walnutMat,
        sideMat,
        sideMat,
      ]);
      mesh.position.y = colH / 2 - 1.55;
      g.add(mesh);

      const x = (i - 2.5) * 0.96;
      const z = Math.sin((i / 5) * Math.PI) * 0.55 - 0.15;
      g.position.set(x, 0, z);
      hskGroup.add(g);
      hskBlocks.push({
        group: g,
        topMat,
        sideMat,
        basePos: new THREE.Vector3(x, colH - 1.55, z),
      });
    });

    // Clean brushed-brass horizontal pointer ring highlighting the active HSK step
    const markerRingGeo = new THREE.TorusGeometry(0.56, 0.02, 16, 64);
    const markerRing = new THREE.Mesh(markerRingGeo, crimsonMat);
    markerRing.rotation.x = Math.PI / 2;
    hskGroup.add(markerRing);

    const sceneGroups = [tonesGroup, strokeGroup, cardsGroup, hskGroup];
    const sceneScales = [0, 1, 2, 3].map((idx) => (idx === stateRef.current.activeScene ? 1 : 0));
    sceneGroups.forEach((grp, idx) => {
      grp.visible = sceneScales[idx] > 0.08;
      grp.scale.setScalar(Math.max(0.001, sceneScales[idx]));
    });

    let dragRotX = 0.06;
    let dragRotY = -0.16;
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let isVisible = true;
    let rafId = 0;
    const clock = new THREE.Clock();

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      container.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      dragRotY += (e.clientX - prevX) * 0.008;
      dragRotX = THREE.MathUtils.clamp(dragRotX + (e.clientY - prevY) * 0.006, -0.65, 0.65);
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onUp = () => {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = 'grab';
      }
    };

    container.style.cursor = 'grab';
    container.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);

    const ro = new ResizeObserver(() => {
      const nw = container.clientWidth || 640;
      const nh = container.clientHeight || 520;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(container);

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.0 }
    );
    io.observe(container);

    renderer.render(scene, camera);

    const sceneCameraTargets: Array<{ y: number; z: number; rotX: number; rotY: number }> = [
      { y: 0.2, z: 7.4, rotX: 0.12, rotY: -0.2 },
      { y: 0.08, z: 6.7, rotX: -0.08, rotY: 0.2 },
      { y: 0.1, z: 7.8, rotX: 0.05, rotY: 0.0 },
      { y: 0.9, z: 8.2, rotX: 0.28, rotY: -0.3 },
    ];

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const m = reducedMotion ? 0 : 1;
      const st = stateRef.current;

      sceneGroups.forEach((grp, idx) => {
        const isTarget = idx === st.activeScene;
        const target = isTarget ? 1 : 0;
        const speed = isTarget ? 11 : 18;
        sceneScales[idx] += (target - sceneScales[idx]) * Math.min(1, dt * speed);
        const s = sceneScales[idx];
        grp.visible = s > 0.08;
        if (grp.visible) {
          grp.scale.setScalar(s);
          grp.position.y = (1 - s) * -0.65;
        }
      });

      const camTarget = sceneCameraTargets[st.activeScene];
      camera.position.y += (camTarget.y - camera.position.y) * Math.min(1, dt * 4);
      camera.position.z += (camTarget.z - camera.position.z) * Math.min(1, dt * 4);
      camera.lookAt(0, 0, 0);

      if (!isDragging) {
        const breatheY = camTarget.rotY + Math.sin(t * 0.45) * 0.1 * m;
        const breatheX = camTarget.rotX + Math.cos(t * 0.35) * 0.03 * m;
        dragRotY += (breatheY - dragRotY) * Math.min(1, dt * 2.2);
        dragRotX += (breatheX - dragRotX) * Math.min(1, dt * 2.2);
      }

      rootRig.rotation.y += (dragRotY - rootRig.rotation.y) * Math.min(1, dt * 8);
      rootRig.rotation.x += (dragRotX - rootRig.rotation.x) * Math.min(1, dt * 8);

      if (tonesGroup.visible) {
        toneMeshes.forEach((entry, idx) => {
          const isSelected = idx === st.activeToneIdx;
          const targetZ = isSelected ? 0.98 : entry.baseZ - 0.35;
          const targetScale = isSelected ? 1.1 : 0.88;
          entry.mesh.position.z += (targetZ - entry.mesh.position.z) * Math.min(1, dt * 8);
          entry.mesh.scale.x += (targetScale - entry.mesh.scale.x) * Math.min(1, dt * 8);
          entry.mesh.scale.y += (targetScale - entry.mesh.scale.y) * Math.min(1, dt * 8);
        });
        const activeTone = toneMeshes[st.activeToneIdx] || toneMeshes[0];
        const u = ((t * 0.48 * m) % 1 + 1) % 1;
        const pt = activeTone.curve.getPointAt(u);
        pitchOrb.position.set(
          pt.x * activeTone.mesh.scale.x,
          pt.y * activeTone.mesh.scale.y,
          activeTone.mesh.position.z
        );
      }

      if (strokeGroup.visible) {
        tabletMesh.position.y = Math.sin(t * 1.0 * m) * 0.05;
        bezelMesh.position.y = tabletMesh.position.y;
        trimMesh.position.y = tabletMesh.position.y;
      }

      if (cardsGroup.visible) {
        cardEntries.forEach((entry, idx) => {
          const flipped = !!st.flippedCards[entry.id];
          const isFocus = idx === st.activeCardIdx;
          const targetRotY = (flipped ? Math.PI : 0) + (idx - 1) * -0.14;
          entry.currentFlipY += (targetRotY - entry.currentFlipY) * Math.min(1, dt * 13);
          entry.mesh.rotation.y = entry.currentFlipY;

          const targetZ = isFocus ? 0.72 : -0.22;
          const targetScale = isFocus ? 1.08 : 0.93;
          entry.mesh.position.z += (targetZ - entry.mesh.position.z) * Math.min(1, dt * 10);
          entry.mesh.position.y = Math.sin(t * 1.2 * m + idx * 1.2) * 0.06;
          entry.mesh.scale.setScalar(
            entry.mesh.scale.x + (targetScale - entry.mesh.scale.x) * Math.min(1, dt * 10)
          );
        });
      }

      if (hskGroup.visible) {
        const activeIdx = Math.min(5, Math.max(0, st.activeHskLevel - 1));
        hskBlocks.forEach((blk, idx) => {
          const selected = idx === activeIdx;
          const targetY = selected ? 0.2 : 0;
          blk.group.position.y += (targetY - blk.group.position.y) * Math.min(1, dt * 7);
        });
        const targetBlock = hskBlocks[activeIdx];
        markerRing.position.x += (targetBlock.basePos.x - markerRing.position.x) * Math.min(1, dt * 8);
        markerRing.position.y +=
          (targetBlock.basePos.y + 0.34 - markerRing.position.y) * Math.min(1, dt * 8);
        markerRing.position.z += (targetBlock.basePos.z - markerRing.position.z) * Math.min(1, dt * 8);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      ro.disconnect();
      io.disconnect();
      tabletMatRef.current = null;

      baseRingGeo.dispose();
      baseRingMat.dispose();
      railGeo.dispose();
      railMat.dispose();
      toneMeshes.forEach((tm) => {
        tm.mesh.geometry.dispose();
        tm.mat.dispose();
      });
      orbGeo.dispose();
      orbMat.dispose();
      tabletGeo.dispose();
      bezelGeo.dispose();
      trimGeo.dispose();
      tabletFaceMat.map?.dispose();
      tabletFaceMat.dispose();
      cardGeo.dispose();
      cardEntries.forEach((c) => {
        c.frontMat.map?.dispose();
        c.frontMat.dispose();
        c.backMat.map?.dispose();
        c.backMat.dispose();
      });
      hskBlocks.forEach((b) => {
        b.topMat.map?.dispose();
        b.topMat.dispose();
        b.sideMat.dispose();
      });
      markerRingGeo.dispose();
      walnutMat.dispose();
      brassMat.dispose();
      crimsonMat.dispose();
      porcelainEdgeMat.dispose();
      envTex.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isLight]);

  if (webglUnsupported) {
    return (
      <div className={`flex items-center justify-center bg-[#F4F0E8] text-[#1C1917] ${className}`}>
        <div className="text-center space-y-2 p-6">
          <span className="font-hanzi-serif text-7xl font-bold text-[#C41E3A]">汉</span>
          <p className="text-xs font-mono text-[#57534E]">Không gian học Hanzi4U</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label="Mô hình học tiếng Trung 3D Hanzi4U"
      className={`relative w-full h-full select-none touch-pan-y ${className}`}
    />
  );
};
