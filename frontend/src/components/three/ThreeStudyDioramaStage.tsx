import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface ThreeStudyDioramaStageProps {
  /** 0 = 4 Tones 3D Ribbons, 1 = TianZiGe 3D Tablet & Brush, 2 = 3D Flashcards, 3 = HSK 1–6 Pagoda */
  activeScene: 0 | 1 | 2 | 3;
  activeToneIdx: number;
  activeStrokeChar: string;
  activeStrokePinyin: string;
  activeStrokeCount: number;
  flippedCards: Record<string, boolean>;
  activeCardIdx: number;
  activeHskLevel: number;
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
    color: '#C41E3A',
  },
  {
    id: 'xuexi',
    hanzi: '学习',
    pinyin: 'xuéxí',
    sino: 'Học tập',
    meaning: 'Học tập',
    example: '我每天学习中文。',
    color: '#1E1A1D',
  },
  {
    id: 'xiexie',
    hanzi: '谢谢',
    pinyin: 'xièxie',
    sino: 'Tạ tạ',
    meaning: 'Cảm ơn',
    example: '谢谢你的帮助！',
    color: '#0B6E4F',
  },
];

function buildDioramaEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x161214);

  const top = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff8f2, side: THREE.DoubleSide })
  );
  top.position.set(0, 10, 2);
  top.rotation.x = Math.PI / 2;
  envScene.add(top);

  const left = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshBasicMaterial({ color: 0xc41e3a, side: THREE.DoubleSide })
  );
  left.position.set(-10, 1, 2);
  left.rotation.y = Math.PI / 2;
  envScene.add(left);

  const right = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshBasicMaterial({ color: 0xe6be4c, side: THREE.DoubleSide })
  );
  right.position.set(10, 2, 2);
  right.rotation.y = -Math.PI / 2;
  envScene.add(right);

  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  return rt.texture;
}

/** Crisp 512x512 TianZiGe calligraphy stone texture */
function createTianZiGeTexture(char: string, pinyin: string, strokes: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm porcelain paper base
  ctx.fillStyle = '#FCF9F5';
  ctx.fillRect(0, 0, size, size);

  // Subtle crimson outer box
  ctx.strokeStyle = 'rgba(196, 30, 58, 0.55)';
  ctx.lineWidth = 5;
  ctx.strokeRect(36, 36, size - 72, size - 72);

  // Classic TianZiGe cross + diagonal dashed hairlines
  ctx.strokeStyle = 'rgba(196, 30, 58, 0.24)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(size / 2, 36);
  ctx.lineTo(size / 2, size - 36);
  ctx.moveTo(36, size / 2);
  ctx.lineTo(size - 36, size / 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(212, 160, 23, 0.22)';
  ctx.beginPath();
  ctx.moveTo(36, 36);
  ctx.lineTo(size - 36, size - 36);
  ctx.moveTo(size - 36, 36);
  ctx.lineTo(36, size - 36);
  ctx.stroke();
  ctx.setLineDash([]);

  // Header metadata
  ctx.fillStyle = '#C41E3A';
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`PINYIN: ${pinyin.toUpperCase()}`, 52, 72);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#5F5658';
  ctx.fillText(`${strokes} NÉT`, size - 52, 72);

  // Sculptural calligraphic Hanzi in deep sumi ink with subtle crimson stroke aura
  ctx.shadowColor = 'rgba(196, 30, 58, 0.18)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#181415';
  ctx.font = '700 264px "Noto Serif SC", "Songti SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, size / 2, size / 2 + 16);
  ctx.shadowBlur = 0;

  // Tiny crimson scholar seal stamp in bottom right corner
  ctx.fillStyle = '#C41E3A';
  ctx.fillRect(size - 92, size - 92, 42, 42);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 22px "Noto Serif SC", serif';
  ctx.fillText('笔', size - 71, size - 70);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Crisp 3D Flashcard Front Texture */
function createCardFrontTexture(spec: (typeof CARD_SPECS)[number]): THREE.CanvasTexture {
  const w = 384;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spec.color;
  ctx.fillRect(0, 0, w, h);

  // Gold hairline inner border
  ctx.strokeStyle = 'rgba(230, 190, 76, 0.72)';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, w - 40, h - 40);

  ctx.fillStyle = '#F2D16B';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HSK 1 · FLASHCARD 3D', w / 2, 66);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 124px "Noto Serif SC", serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(spec.hanzi, w / 2, h / 2 - 18);

  ctx.fillStyle = '#F2D16B';
  ctx.font = '700 32px "JetBrains Mono", monospace';
  ctx.fillText(spec.pinyin, w / 2, h / 2 + 96);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '500 22px "Be Vietnam Pro", sans-serif';
  ctx.fillText(spec.meaning, w / 2, h - 76);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Crisp 3D Flashcard Back Texture (Porcelain study notes) */
function createCardBackTexture(spec: (typeof CARD_SPECS)[number]): THREE.CanvasTexture {
  const w = 384;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FCF9F5';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#C41E3A';
  ctx.fillRect(0, 0, w, 14);

  ctx.strokeStyle = '#EAE3DE';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 28, w - 36, h - 46);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#C41E3A';
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.fillText(`HÁN-VIỆT: ${spec.sino.toUpperCase()}`, w / 2, 86);

  ctx.fillStyle = '#181415';
  ctx.font = '700 68px "Noto Serif SC", serif';
  ctx.fillText(spec.hanzi, w / 2, 168);

  ctx.fillStyle = '#00A86B';
  ctx.font = '700 28px "Be Vietnam Pro", sans-serif';
  ctx.fillText(spec.meaning, w / 2, 240);

  // Example card box
  ctx.fillStyle = '#F5F0EB';
  ctx.beginPath();
  ctx.roundRect(34, 290, w - 68, 128, 14);
  ctx.fill();

  ctx.fillStyle = '#181415';
  ctx.font = '700 26px "Noto Serif SC", serif';
  ctx.fillText(spec.example, w / 2, 338);

  ctx.fillStyle = '#5F5658';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillText(spec.pinyin, w / 2, 384);

  ctx.fillStyle = '#8C7F82';
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.fillText('LẶP LẠI THÔNG MINH · SM-2', w / 2, h - 48);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Crisp HSK Level Plinth Top Label */
function createHskLabelTexture(level: number, words: string, accent: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1B1618';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, size - 20, size - 20);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 54px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`HSK ${level}`, size / 2, size / 2 - 20);

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
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnsupported, setWebglUnsupported] = useState(false);

  // Live reactive refs read inside the 120fps rAF loop (zero WebGL re-init on state updates!)
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
    const h = container.clientHeight || 540;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const envTex = buildDioramaEnv(renderer);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
    camera.position.set(0, 0.4, 8.2);

    // Rich gallery lighting matching Hanzi4U palette
    const ambient = new THREE.AmbientLight(0xfff7f2, 0.95);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(4, 7, 7);
    scene.add(keyLight);

    const crimsonKey = new THREE.PointLight(0xc41e3a, 4.2, 20);
    crimsonKey.position.set(-4.5, -1.5, 4);
    scene.add(crimsonKey);

    const goldRim = new THREE.PointLight(0xe6be4c, 3.8, 20);
    goldRim.position.set(4.5, 3, 3.5);
    scene.add(goldRim);

    const rootRig = new THREE.Group();
    scene.add(rootRig);

    // Shared materials
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      metalness: 0.88,
      roughness: 0.22,
    });
    const crimsonMat = new THREE.MeshStandardMaterial({
      color: 0xc41e3a,
      metalness: 0.35,
      roughness: 0.22,
    });
    const jadeMat = new THREE.MeshStandardMaterial({
      color: 0x00a86b,
      metalness: 0.3,
      roughness: 0.24,
    });
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x1b1618,
      metalness: 0.4,
      roughness: 0.32,
    });

    // Subtle ambient architectural circular pedestal ring beneath every exhibit
    const baseRingGeo = new THREE.TorusGeometry(2.75, 0.018, 12, 112);
    const baseRingMat = new THREE.MeshBasicMaterial({
      color: 0xd4a017,
      transparent: true,
      opacity: 0.25,
    });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = -2.05;
    rootRig.add(baseRing);

    // ══════════════════════════════════════════════════════════════════════════
    // SCENE 0: 4 TONES 3D ACOUSTIC PITCH RIBBONS (mā · má · mǎ · mà)
    // ══════════════════════════════════════════════════════════════════════════
    const tonesGroup = new THREE.Group();
    rootRig.add(tonesGroup);

    // Architectural 3D pitch guide rails (high pitch 5 & low pitch 1)
    const railGeo = new THREE.BoxGeometry(4.6, 0.018, 0.018);
    const railMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.14,
    });
    [-1.1, 0, 1.1].forEach((ry) => {
      const r = new THREE.Mesh(railGeo, railMat);
      r.position.set(0, ry, -0.5);
      tonesGroup.add(r);
    });

    const toneCurves = [
      // Tone 1 (55 flat high)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.95, 1.05, 0),
        new THREE.Vector3(-0.65, 1.05, 0),
        new THREE.Vector3(0.65, 1.05, 0),
        new THREE.Vector3(1.95, 1.05, 0),
      ]),
      // Tone 2 (35 rising)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.95, -0.45, 0),
        new THREE.Vector3(-0.5, -0.1, 0),
        new THREE.Vector3(0.85, 0.52, 0),
        new THREE.Vector3(1.95, 1.15, 0),
      ]),
      // Tone 3 (214 dipping valley)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.95, -0.25, 0),
        new THREE.Vector3(-0.55, -1.12, 0),
        new THREE.Vector3(0.75, -0.78, 0),
        new THREE.Vector3(1.95, 0.42, 0),
      ]),
      // Tone 4 (51 sharp falling)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.95, 1.12, 0),
        new THREE.Vector3(-0.55, 0.48, 0),
        new THREE.Vector3(0.75, -0.35, 0),
        new THREE.Vector3(1.95, -1.12, 0),
      ]),
    ];

    const toneColors = [0x00a86b, 0xc41e3a, 0xe6be4c, 0xf87171];
    const toneMeshes: Array<{
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      baseZ: number;
      curve: THREE.CatmullRomCurve3;
    }> = [];

    toneCurves.forEach((curve, idx) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.13, 18, false);
      const mat = new THREE.MeshStandardMaterial({
        color: toneColors[idx],
        emissive: new THREE.Color(toneColors[idx]),
        emissiveIntensity: 0.25,
        metalness: 0.35,
        roughness: 0.18,
      });
      const mesh = new THREE.Mesh(tubeGeo, mat);
      const baseZ = (1.5 - idx) * 0.52;
      mesh.position.z = baseZ;
      tonesGroup.add(mesh);
      toneMeshes.push({ mesh, mat, baseZ, curve });
    });

    // Luminous pitch-tracer orb gliding smoothly along the selected tone's 3D curve
    const orbGeo = new THREE.SphereGeometry(0.22, 24, 24);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf2d16b,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.2,
    });
    const pitchOrb = new THREE.Mesh(orbGeo, orbMat);
    tonesGroup.add(pitchOrb);

    // ══════════════════════════════════════════════════════════════════════════
    // SCENE 1: 3D TIANZIGE PORCELAIN STONE TABLET + ANIMATED CALLIGRAPHY BRUSH
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
      roughness: 0.24,
      metalness: 0.08,
    });
    tabletMatRef.current = tabletFaceMat;

    const tabletGeo = new THREE.BoxGeometry(3.1, 3.1, 0.24);
    const tabletMesh = new THREE.Mesh(tabletGeo, [
      obsidianMat,
      obsidianMat,
      obsidianMat,
      obsidianMat,
      tabletFaceMat,
      obsidianMat,
    ]);
    strokeGroup.add(tabletMesh);

    // Crimson lacquer frame bezel behind the porcelain tablet
    const bezelGeo = new THREE.BoxGeometry(3.26, 3.26, 0.16);
    const bezelMesh = new THREE.Mesh(bezelGeo, crimsonMat);
    bezelMesh.position.z = -0.06;
    strokeGroup.add(bezelMesh);

    // Corner brushed-gold architectural brackets
    const bracketGeo = new THREE.BoxGeometry(0.32, 0.32, 0.3);
    [
      [-1.56, 1.56],
      [1.56, 1.56],
      [-1.56, -1.56],
      [1.56, -1.56],
    ].forEach(([bx, by]) => {
      const b = new THREE.Mesh(bracketGeo, goldMat);
      b.position.set(bx, by, 0);
      strokeGroup.add(b);
    });

    // Procedural 3D Chinese Calligraphy Brush floating above the stone tablet
    const brushGroup = new THREE.Group();
    const shaftGeo = new THREE.CylinderGeometry(0.065, 0.085, 2.3, 18);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      metalness: 0.65,
      roughness: 0.32,
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 1.45;
    brushGroup.add(shaft);

    const ferruleGeo = new THREE.CylinderGeometry(0.095, 0.085, 0.28, 18);
    const ferrule = new THREE.Mesh(ferruleGeo, crimsonMat);
    ferrule.position.y = 0.22;
    brushGroup.add(ferrule);

    const bristleGeo = new THREE.ConeGeometry(0.09, 0.48, 20);
    const bristleMat = new THREE.MeshStandardMaterial({
      color: 0x1a1517,
      emissive: 0xc41e3a,
      emissiveIntensity: 0.35,
      roughness: 0.35,
    });
    const bristle = new THREE.Mesh(bristleGeo, bristleMat);
    bristle.rotation.x = Math.PI;
    bristle.position.y = -0.14;
    brushGroup.add(bristle);

    brushGroup.rotation.set(0.45, 0, -0.35);
    strokeGroup.add(brushGroup);

    // ══════════════════════════════════════════════════════════════════════════
    // SCENE 2: 3D DOUBLE-SIDED LACQUER FLASHCARDS (PHYSICAL 180° WEBGL FLIP)
    // ══════════════════════════════════════════════════════════════════════════
    const cardsGroup = new THREE.Group();
    rootRig.add(cardsGroup);

    const cardGeo = new THREE.BoxGeometry(1.75, 2.38, 0.09);
    const cardEntries = CARD_SPECS.map((spec, idx) => {
      const frontTex = createCardFrontTexture(spec);
      const backTex = createCardBackTexture(spec);
      const frontMat = new THREE.MeshStandardMaterial({
        map: frontTex,
        roughness: 0.25,
        metalness: 0.14,
      });
      const backMat = new THREE.MeshStandardMaterial({
        map: backTex,
        roughness: 0.3,
        metalness: 0.06,
      });
      const mesh = new THREE.Mesh(cardGeo, [
        goldMat,
        goldMat,
        goldMat,
        goldMat,
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
    // SCENE 3: 3D ASCENDING HSK 1 → 6 ARCHITECTURAL MASTERY TERRACES
    // ══════════════════════════════════════════════════════════════════════════
    const hskGroup = new THREE.Group();
    rootRig.add(hskGroup);

    const hskSpecs = [
      { level: 1, words: '150 từ', accent: '#00A86B', hex: 0x00a86b },
      { level: 2, words: '300 từ', accent: '#10B981', hex: 0x10b981 },
      { level: 3, words: '600 từ', accent: '#D4A017', hex: 0xd4a017 },
      { level: 4, words: '1.200 từ', accent: '#E6BE4C', hex: 0xe6be4c },
      { level: 5, words: '2.500 từ', accent: '#E11D48', hex: 0xe11d48 },
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
      const colH = 0.6 + i * 0.42;
      const boxGeo = new THREE.BoxGeometry(0.84, colH, 0.84);
      const labelTex = createHskLabelTexture(spec.level, spec.words, spec.accent);
      const topMat = new THREE.MeshStandardMaterial({
        map: labelTex,
        roughness: 0.25,
        metalness: 0.2,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        color: spec.hex,
        emissive: new THREE.Color(spec.hex),
        emissiveIntensity: 0.16,
        metalness: 0.45,
        roughness: 0.26,
      });
      const mesh = new THREE.Mesh(boxGeo, [
        sideMat,
        sideMat,
        topMat,
        obsidianMat,
        sideMat,
        sideMat,
      ]);
      mesh.position.y = colH / 2 - 1.55;
      g.add(mesh);

      const x = (i - 2.5) * 0.96;
      const z = Math.sin((i / 5) * Math.PI) * 0.65 - 0.2;
      g.position.set(x, 0, z);
      hskGroup.add(g);
      hskBlocks.push({
        group: g,
        topMat,
        sideMat,
        basePos: new THREE.Vector3(x, colH - 1.55, z),
      });
    });

    // Hovering Faceted Ruby/Gold Beacon Crown above the active HSK level
    const beaconGroup = new THREE.Group();
    const crownGemGeo = new THREE.OctahedronGeometry(0.26, 0);
    const crownGem = new THREE.Mesh(crownGemGeo, crimsonMat);
    beaconGroup.add(crownGem);

    const crownHaloGeo = new THREE.TorusGeometry(0.42, 0.025, 16, 48);
    const crownHalo = new THREE.Mesh(crownHaloGeo, goldMat);
    crownHalo.rotation.x = Math.PI / 2;
    beaconGroup.add(crownHalo);
    hskGroup.add(beaconGroup);

    // ── SINGLE-DRAW-CALL AMBIENT GOLD PARTICLES ACROSS ALL 4 SCENES ──
    const P_COUNT = 56;
    const pGeo = new THREE.OctahedronGeometry(0.025, 0);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xe6be4c,
      transparent: true,
      opacity: 0.55,
    });
    const instParticles = new THREE.InstancedMesh(pGeo, pMat, P_COUNT);
    const pDummy = new THREE.Object3D();
    for (let i = 0; i < P_COUNT; i++) {
      const a = (i / P_COUNT) * Math.PI * 2;
      const rad = 2.9 + (i % 4) * 0.45;
      pDummy.position.set(Math.cos(a) * rad, ((i % 7) - 3) * 0.65, Math.sin(a) * rad - 0.8);
      pDummy.scale.setScalar(0.6 + (i % 3) * 0.35);
      pDummy.updateMatrix();
      instParticles.setMatrixAt(i, pDummy.matrix);
    }
    instParticles.instanceMatrix.needsUpdate = true;
    rootRig.add(instParticles);

    const sceneGroups = [tonesGroup, strokeGroup, cardsGroup, hskGroup];
    const sceneScales = [1, 0.001, 0.001, 0.001];

    // Interactive 360° pointer drag on the 3D stage
    let dragRotX = 0.08;
    let dragRotY = -0.18;
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
      const nh = container.clientHeight || 540;
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

    // Target hero camera pose per 3D exhibit
    const sceneCameraTargets: Array<{ y: number; z: number; rotX: number; rotY: number }> = [
      { y: 0.25, z: 7.5, rotX: 0.14, rotY: -0.22 }, // Scene 0: 4 Tones
      { y: 0.1, z: 6.9, rotX: -0.16, rotY: 0.24 }, // Scene 1: TianZiGe Stone Tablet + Brush
      { y: 0.1, z: 8.1, rotX: 0.06, rotY: 0.0 }, // Scene 2: 3D Flashcards
      { y: 0.85, z: 8.2, rotX: 0.28, rotY: -0.32 }, // Scene 3: HSK 1-6 Pagoda
    ];

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isVisible || document.hidden) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const m = reducedMotion ? 0 : 1;
      const st = stateRef.current;

      // Smoothly morph scene scales (fast clean exit so inactive scenes vanish cleanly with 0 overlap)
      sceneGroups.forEach((grp, idx) => {
        const isTarget = idx === st.activeScene;
        const target = isTarget ? 1 : 0;
        const speed = isTarget ? 11 : 18;
        sceneScales[idx] += (target - sceneScales[idx]) * Math.min(1, dt * speed);
        const s = sceneScales[idx];
        grp.visible = s > 0.08;
        if (grp.visible) {
          grp.scale.setScalar(s);
          grp.position.y = (1 - s) * -0.75;
        }
      });

      // Smoothly glide camera & gentle breathing rotation toward scene's optimal showcase angle
      const camTarget = sceneCameraTargets[st.activeScene];
      camera.position.y += (camTarget.y - camera.position.y) * Math.min(1, dt * 4);
      camera.position.z += (camTarget.z - camera.position.z) * Math.min(1, dt * 4);
      camera.lookAt(0, 0, 0);

      if (!isDragging) {
        const breatheY = camTarget.rotY + Math.sin(t * 0.5) * 0.12 * m;
        const breatheX = camTarget.rotX + Math.cos(t * 0.42) * 0.04 * m;
        dragRotY += (breatheY - dragRotY) * Math.min(1, dt * 2.4);
        dragRotX += (breatheX - dragRotX) * Math.min(1, dt * 2.4);
      }

      rootRig.rotation.y += (dragRotY - rootRig.rotation.y) * Math.min(1, dt * 8);
      rootRig.rotation.x += (dragRotX - rootRig.rotation.x) * Math.min(1, dt * 8);
      instParticles.rotation.y = t * 0.06 * m;
      baseRing.rotation.z = t * 0.12 * m;

      // ── SCENE 0 ANIMATION: 4 TONE RIBBONS + TRACER ORB ──
      if (tonesGroup.visible) {
        toneMeshes.forEach((entry, idx) => {
          const isSelected = idx === st.activeToneIdx;
          const targetZ = isSelected ? 1.05 : entry.baseZ - 0.35;
          const targetScale = isSelected ? 1.12 : 0.88;
          entry.mesh.position.z += (targetZ - entry.mesh.position.z) * Math.min(1, dt * 8);
          entry.mesh.scale.x += (targetScale - entry.mesh.scale.x) * Math.min(1, dt * 8);
          entry.mesh.scale.y += (targetScale - entry.mesh.scale.y) * Math.min(1, dt * 8);
          entry.mat.emissiveIntensity +=
            ((isSelected ? 0.65 : 0.1) - entry.mat.emissiveIntensity) * Math.min(1, dt * 8);
        });
        const activeTone = toneMeshes[st.activeToneIdx] || toneMeshes[0];
        const u = ((t * 0.55 * m) % 1 + 1) % 1;
        const pt = activeTone.curve.getPointAt(u);
        pitchOrb.position.set(
          pt.x * activeTone.mesh.scale.x,
          pt.y * activeTone.mesh.scale.y,
          activeTone.mesh.position.z
        );
      }

      // ── SCENE 1 ANIMATION: CALLIGRAPHY BRUSH GLIDING OVER TIANZIGE TABLET ──
      if (strokeGroup.visible) {
        const bx = Math.sin(t * 1.1 * m) * 0.78;
        const by = Math.sin(t * 2.2 * m) * 0.45 + 0.15;
        brushGroup.position.set(bx, by, 0.55 + Math.cos(t * 1.1 * m) * 0.1);
        brushGroup.rotation.z = -0.35 + Math.cos(t * 1.1 * m) * 0.15;
        tabletMesh.position.y = Math.sin(t * 1.2 * m) * 0.05;
        bezelMesh.position.y = tabletMesh.position.y;
      }

      // ── SCENE 2 ANIMATION: PHYSICAL 180° 3D FLASHCARD FLIP ──
      if (cardsGroup.visible) {
        cardEntries.forEach((entry, idx) => {
          const flipped = !!st.flippedCards[entry.id];
          const isFocus = idx === st.activeCardIdx;
          const targetRotY = (flipped ? Math.PI : 0) + (idx - 1) * -0.14;
          entry.currentFlipY += (targetRotY - entry.currentFlipY) * Math.min(1, dt * 13);
          entry.mesh.rotation.y = entry.currentFlipY;

          const targetZ = isFocus ? 0.78 : -0.25;
          const targetScale = isFocus ? 1.08 : 0.92;
          entry.mesh.position.z += (targetZ - entry.mesh.position.z) * Math.min(1, dt * 10);
          entry.mesh.position.y = Math.sin(t * 1.4 * m + idx * 1.3) * 0.09;
          entry.mesh.scale.setScalar(
            entry.mesh.scale.x + (targetScale - entry.mesh.scale.x) * Math.min(1, dt * 10)
          );
        });
      }

      // ── SCENE 3 ANIMATION: HSK 1-6 ASCENDING TERRACES + BEACON CROWN ──
      if (hskGroup.visible) {
        const activeIdx = Math.min(5, Math.max(0, st.activeHskLevel - 1));
        hskBlocks.forEach((blk, idx) => {
          const selected = idx === activeIdx;
          const targetY = selected ? 0.22 : 0;
          blk.group.position.y += (targetY - blk.group.position.y) * Math.min(1, dt * 7);
          blk.sideMat.emissiveIntensity +=
            ((selected ? 0.6 : 0.12) - blk.sideMat.emissiveIntensity) * Math.min(1, dt * 7);
        });
        const targetBlock = hskBlocks[activeIdx];
        const bx = targetBlock.basePos.x;
        const by = targetBlock.basePos.y + 0.82 + Math.sin(t * 2.4 * m) * 0.1;
        const bz = targetBlock.basePos.z;
        beaconGroup.position.x += (bx - beaconGroup.position.x) * Math.min(1, dt * 8);
        beaconGroup.position.y += (by - beaconGroup.position.y) * Math.min(1, dt * 8);
        beaconGroup.position.z += (bz - beaconGroup.position.z) * Math.min(1, dt * 8);
        crownGem.rotation.y = t * 1.4 * m;
        crownHalo.rotation.z = -t * 1.1 * m;
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
      bracketGeo.dispose();
      shaftGeo.dispose();
      shaftMat.dispose();
      ferruleGeo.dispose();
      bristleGeo.dispose();
      bristleMat.dispose();
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
      crownGemGeo.dispose();
      crownHaloGeo.dispose();
      pGeo.dispose();
      pMat.dispose();
      goldMat.dispose();
      crimsonMat.dispose();
      jadeMat.dispose();
      obsidianMat.dispose();
      envTex.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglUnsupported) {
    return (
      <div className={`flex items-center justify-center bg-[#141112] text-white ${className}`}>
        <div className="text-center space-y-2 p-6">
          <span className="font-hanzi-serif text-7xl font-bold text-[#E6BE4C]">汉</span>
          <p className="text-xs font-mono text-white/60">Phòng Học 3D Hanzi4U</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label="Không gian mô phỏng học tiếng Trung 3D Hanzi4U"
      className={`relative w-full h-full select-none touch-pan-y ${className}`}
    />
  );
};
