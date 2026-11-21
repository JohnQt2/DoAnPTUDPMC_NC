import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface ThreeStudyDioramaStageProps {
  /** 0 = 4 Tones 3D Curves, 1 = TianZiGe Porcelain Stone, 2 = 3D Flashcards, 3 = 3D HSK 1–6 Real Textbooks */
  activeScene: 0 | 1 | 2 | 3;
  activeToneIdx: number;
  activeStrokeChar: string;
  activeStrokePinyin: string;
  activeStrokeCount: number;
  flippedCards: Record<string, boolean>;
  activeCardIdx: number;
  activeHskLevel: number;
  /** When false, keeps WebGL context warm in memory while pausing rAF render work */
  isActive?: boolean;
  /** Optional subset of scenes to allocate in this instance (avoids creating unused textures) */
  enabledScenes?: Array<0 | 1 | 2 | 3>;
  /** Called when the user clicks directly on a 3D flashcard mesh in Scene 2 */
  onCardClick?: (cardId: string, cardIdx: number) => void;
  /** Called when the user clicks directly on a 3D HSK textbook mesh in Scene 3 */
  onBookClick?: (level: number) => void;
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
    exampleVi: 'Xin chào, rất vui được làm quen với bạn!',
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
    exampleVi: 'Mỗi ngày tôi đều học tiếng Trung.',
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
    exampleVi: 'Cảm ơn sự giúp đỡ của bạn!',
    accent: '#B5841A',
    cover: '#FFFFFF',
    ink: '#1C1917',
  },
];

const HSK_BOOK_SPECS = [
  {
    level: 1,
    coverUrl: '/images/books/hsk1.webp',
    spineHex: '#E57C23',
    jacketColor: 0xe57c23,
  },
  {
    level: 2,
    coverUrl: '/images/books/hsk2.webp',
    spineHex: '#1F7A68',
    jacketColor: 0x1f7a68,
  },
  {
    level: 3,
    coverUrl: '/images/books/hsk3.webp',
    spineHex: '#D95B18',
    jacketColor: 0xd95b18,
  },
  {
    level: 4,
    coverUrl: '/images/books/hsk4.webp',
    spineHex: '#B61F24',
    jacketColor: 0xb61f24,
  },
  {
    level: 5,
    coverUrl: '/images/books/hsk5.webp',
    spineHex: '#184375',
    jacketColor: 0x184375,
  },
  {
    level: 6,
    coverUrl: '/images/books/hsk6.webp',
    spineHex: '#5A1063',
    jacketColor: 0x5a1063,
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

/** Crisp 512x512 Matte Xuan-Paper TianZiGe Slab Front Texture */
function createTianZiGeTexture(char: string, pinyin: string, strokes: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm walnut outer border inlaid around Xuan paper face
  ctx.fillStyle = '#3B2C25';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#C29940';
  ctx.fillRect(12, 12, size - 24, size - 24);

  ctx.fillStyle = '#FCF9F4';
  ctx.fillRect(16, 16, size - 32, size - 32);

  // Fine vermilion outer square
  ctx.strokeStyle = 'rgba(196, 30, 58, 0.5)';
  ctx.lineWidth = 3;
  ctx.strokeRect(46, 46, size - 92, size - 92);

  // Subtle dashed TianZiGe cross + diagonal guides
  ctx.strokeStyle = 'rgba(196, 30, 58, 0.22)';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(size / 2, 46);
  ctx.lineTo(size / 2, size - 46);
  ctx.moveTo(46, size / 2);
  ctx.lineTo(size - 46, size / 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(28, 25, 23, 0.08)';
  ctx.beginPath();
  ctx.moveTo(46, 46);
  ctx.lineTo(size - 46, size - 46);
  ctx.moveTo(size - 46, 46);
  ctx.lineTo(46, size - 46);
  ctx.stroke();
  ctx.setLineDash([]);

  // Clean minimalist metadata header
  ctx.fillStyle = '#C41E3A';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(pinyin, 62, 80);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#6B625C';
  ctx.fillText(`${strokes} nét`, size - 62, 80);

  // Calligraphic Hanzi in sumi ink
  ctx.fillStyle = '#1C1917';
  ctx.font = '700 252px "Noto Serif SC", "Songti SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, size / 2, size / 2 + 12);

  // Small red scholar seal stamp in corner
  ctx.fillStyle = '#C41E3A';
  ctx.fillRect(size - 94, size - 94, 34, 34);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 18px "Noto Serif SC", serif';
  ctx.fillText('笔', size - 77, size - 76);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Crisp 512x512 Engraved Walnut & Vermilion Seal Reverse Texture for TianZiGe Slab
 * (Eliminates overlapping box Z-fighting and gives the back of the 3D slab an authentic engraved finish).
 */
function createTianZiGeBackTexture(
  char: string,
  pinyin: string,
  strokes: number
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Deep espresso walnut lacquer back
  ctx.fillStyle = '#261C18';
  ctx.fillRect(0, 0, size, size);

  // Inlaid brushed brass double frame
  ctx.strokeStyle = 'rgba(212, 168, 75, 0.58)';
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, size - 52, size - 52);

  ctx.strokeStyle = 'rgba(212, 168, 75, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(38, 38, size - 76, size - 76);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Top scholarly inscription
  ctx.fillStyle = '#E6BE4C';
  ctx.font = '600 17px "JetBrains Mono", monospace';
  ctx.fillText('ĐIỀN TỰ CÁCH · QUY TẮC BÚT THUẬN', size / 2, 82);

  // Central Traditional Vermilion Seal Square (印章)
  const sealSize = 216;
  const sealX = (size - sealSize) / 2;
  const sealY = 128;
  ctx.fillStyle = '#B81D36';
  ctx.fillRect(sealX, sealY, sealSize, sealSize);

  ctx.strokeStyle = 'rgba(252, 249, 245, 0.75)';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(sealX + 10, sealY + 10, sealSize - 20, sealSize - 20);

  // Engraved White Seal Character
  ctx.fillStyle = '#FCF9F4';
  ctx.font = '700 144px "Noto Serif SC", "Songti SC", serif';
  ctx.fillText(char, size / 2, sealY + sealSize / 2 + 6);

  // Pinyin & stroke metadata below seal
  ctx.fillStyle = '#F5EFE6';
  ctx.font = '700 24px "JetBrains Mono", monospace';
  ctx.fillText(`${pinyin} · ${strokes} nét chuẩn`, size / 2, 392);

  ctx.fillStyle = 'rgba(230, 190, 76, 0.78)';
  ctx.font = '500 18px "Noto Serif SC", serif';
  ctx.fillText('先横后竖 · 先撇后捺 · 从上到下', size / 2, 438);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** High-DPI Tactile Linen Paper Flashcard Front Texture */
function createCardFrontTexture(spec: (typeof CARD_SPECS)[number]): THREE.CanvasTexture {
  const w = 512;
  const h = 680;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spec.cover;
  ctx.fillRect(0, 0, w, h);

  // Top 14px accent pigment bar
  ctx.fillStyle = spec.accent;
  ctx.fillRect(0, 0, w, 14);

  // Minimal hairline inner frame
  ctx.strokeStyle = 'rgba(28, 25, 23, 0.14)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(26, 36, w - 52, h - 64);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#78716C';
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillText('HSK 1 · THẺ LẬT TỪ', w / 2, 88);

  ctx.fillStyle = spec.ink;
  ctx.font = '700 164px "Noto Serif SC", serif';
  ctx.fillText(spec.hanzi, w / 2, h / 2 - 28);

  ctx.fillStyle = spec.accent;
  ctx.font = '700 40px "JetBrains Mono", monospace';
  ctx.fillText(spec.pinyin, w / 2, h / 2 + 114);

  ctx.fillStyle = '#44403C';
  ctx.font = '600 30px "Be Vietnam Pro", sans-serif';
  ctx.fillText(spec.meaning, w / 2, h - 122);

  // Subtle interactive click prompt on bottom of card face
  ctx.fillStyle = 'rgba(28, 25, 23, 0.42)';
  ctx.font = '500 16px "JetBrains Mono", monospace';
  ctx.fillText('↻ BẤM VÀO THẺ ĐỂ LẬT', w / 2, h - 62);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** High-DPI Tactile Reverse Flashcard Texture (Hán-Việt + Example Sentence) */
function createCardBackTexture(spec: (typeof CARD_SPECS)[number]): THREE.CanvasTexture {
  const w = 512;
  const h = 680;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1C1917';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = spec.accent;
  ctx.fillRect(0, 0, w, 14);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(26, 36, w - 52, h - 64);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#F2C94C';
  ctx.font = '600 22px "JetBrains Mono", monospace';
  ctx.fillText(`HÁN-VIỆT: ${spec.sino.toUpperCase()}`, w / 2, 102);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 92px "Noto Serif SC", serif';
  ctx.fillText(spec.hanzi, w / 2, 214);

  ctx.fillStyle = '#F5EFE6';
  ctx.font = '600 32px "Be Vietnam Pro", sans-serif';
  ctx.fillText(spec.meaning, w / 2, 306);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.roundRect(40, 368, w - 80, 178, 12);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 32px "Noto Serif SC", serif';
  ctx.fillText(spec.example, w / 2, 426);

  ctx.fillStyle = '#D6D0C8';
  ctx.font = '500 20px "Be Vietnam Pro", sans-serif';
  ctx.fillText(spec.exampleVi, w / 2, 494);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '500 16px "JetBrains Mono", monospace';
  ctx.fillText('↻ BẤM ĐỂ LẬT MẶT TRƯỚC', w / 2, h - 62);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Realistic Book Spine Texture (`HSK 1..6 · 标准教程`) */
function createBookSpineTexture(level: number, spineHex: string): THREE.CanvasTexture {
  const w = 96;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spineHex;
  ctx.fillRect(0, 0, w, h);

  // Subtle top & bottom publisher bands
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(0, 26, w, 6);
  ctx.fillRect(0, h - 64, w, 4);

  // Level badge on spine
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`HSK`, w / 2, 74);
  ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${level}`, w / 2, 112);

  // Vertical Chinese spine title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.font = '700 26px "Noto Serif SC", serif';
  const chars = ['标', '准', '教', '程'];
  chars.forEach((c, idx) => {
    ctx.fillText(c, w / 2, 200 + idx * 46);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Realistic Stacked Paper Page-Edge Texture for 3D Books */
function createBookPageEdgeTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F7F3EA';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(28, 25, 23, 0.08)';
  for (let x = 4; x < w; x += 5) {
    ctx.fillRect(x, 0, 1.5, h);
  }

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
  isActive = true,
  enabledScenes = [0, 1, 2, 3],
  onCardClick,
  onBookClick,
  theme = 'light',
  className = '',
}) => {
  const isLight = theme === 'light';
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnsupported, setWebglUnsupported] = useState(false);

  const isActiveRef = useRef<boolean>(isActive);
  isActiveRef.current = isActive;

  const callbacksRef = useRef({ onCardClick, onBookClick });
  callbacksRef.current = { onCardClick, onBookClick };

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
  const tabletBackMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    const mat = tabletMatRef.current;
    if (mat) {
      const prev = mat.map;
      mat.map = createTianZiGeTexture(activeStrokeChar, activeStrokePinyin, activeStrokeCount);
      mat.needsUpdate = true;
      prev?.dispose();
    }
    const backMat = tabletBackMatRef.current;
    if (backMat) {
      const prevBack = backMat.map;
      backMat.map = createTianZiGeBackTexture(
        activeStrokeChar,
        activeStrokePinyin,
        activeStrokeCount
      );
      backMat.needsUpdate = true;
      prevBack?.dispose();
    }
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

    const fillLight = new THREE.DirectionalLight(0xf2e8db, 0.78);
    fillLight.position.set(-5, 2, 4);
    scene.add(fillLight);

    const rootRig = new THREE.Group();
    scene.add(rootRig);

    const walnutMat = new THREE.MeshStandardMaterial({
      color: 0x3b2c25,
      metalness: 0.12,
      roughness: 0.48,
    });
    const porcelainEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xe6dfd6,
      metalness: 0.05,
      roughness: 0.45,
    });

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
    // Single solid slab with dedicated front & back textures (0% Z-fighting!)
    // ══════════════════════════════════════════════════════════════════════════
    const strokeGroup = new THREE.Group();
    rootRig.add(strokeGroup);

    const hasStrokeScene = enabledScenes.includes(1);
    const tabletTex = hasStrokeScene
      ? createTianZiGeTexture(activeStrokeChar, activeStrokePinyin, activeStrokeCount)
      : null;
    const tabletBackTex = hasStrokeScene
      ? createTianZiGeBackTexture(activeStrokeChar, activeStrokePinyin, activeStrokeCount)
      : null;

    const tabletFaceMat = new THREE.MeshStandardMaterial({
      map: tabletTex,
      roughness: 0.4,
      metalness: 0.04,
    });
    const tabletBackMat = new THREE.MeshStandardMaterial({
      map: tabletBackTex,
      roughness: 0.38,
      metalness: 0.08,
    });

    if (hasStrokeScene) {
      tabletMatRef.current = tabletFaceMat;
      tabletBackMatRef.current = tabletBackMat;
    }

    const tabletGeo = new THREE.BoxGeometry(3.04, 3.04, 0.2);
    const tabletMesh = new THREE.Mesh(tabletGeo, [
      walnutMat,
      walnutMat,
      walnutMat,
      walnutMat,
      tabletFaceMat,
      tabletBackMat,
    ]);
    strokeGroup.add(tabletMesh);

    // ══════════════════════════════════════════════════════════════════════════
    // SCENE 2: FRAMELESS 3D DOUBLE-SIDED FLASHCARDS (CLICK DIRECTLY TO FLIP)
    // ══════════════════════════════════════════════════════════════════════════
    const cardsGroup = new THREE.Group();
    rootRig.add(cardsGroup);

    const cardGeo = new THREE.BoxGeometry(1.96, 2.66, 0.08);
    const hasCardsScene = enabledScenes.includes(2);
    const cardEntries = (hasCardsScene ? CARD_SPECS : []).map((spec, idx) => {
      const frontTex = createCardFrontTexture(spec);
      const backTex = createCardBackTexture(spec);
      const frontMat = new THREE.MeshStandardMaterial({
        map: frontTex,
        roughness: 0.38,
        metalness: 0.04,
      });
      const backMat = new THREE.MeshStandardMaterial({
        map: backTex,
        roughness: 0.34,
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
      mesh.userData = { kind: 'card', cardId: spec.id, cardIdx: idx };
      const baseX = (idx - 1) * 2.28;
      mesh.position.set(baseX, 0, idx === 0 ? 0.35 : -0.15);
      cardsGroup.add(mesh);
      return {
        id: spec.id,
        idx,
        mesh,
        frontMat,
        backMat,
        baseX,
        currentFlipY: 0,
        userRotX: 0,
        userRotY: 0,
      };
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SCENE 3: 6 INDIVIDUAL 3D HSK 1 → 6 TEXTBOOKS (ROTATE ONLY SELECTED BOOK)
    // ══════════════════════════════════════════════════════════════════════════
    const hskGroup = new THREE.Group();
    rootRig.add(hskGroup);

    const hasHskScene = enabledScenes.includes(3);
    const textureLoader = new THREE.TextureLoader();
    const pageEdgeTex = hasHskScene ? createBookPageEdgeTexture() : null;
    const pageEdgeMat = new THREE.MeshStandardMaterial({
      map: pageEdgeTex,
      roughness: 0.65,
      metalness: 0.02,
    });

    const bookGeo = new THREE.BoxGeometry(1.22, 1.72, 0.24);
    const hskBookEntries: Array<{
      level: number;
      mesh: THREE.Mesh;
      frontMat: THREE.MeshStandardMaterial;
      spineMat: THREE.MeshStandardMaterial;
      backMat: THREE.MeshStandardMaterial;
      baseX: number;
      baseZ: number;
      baseRotY: number;
      userRotX: number;
      userRotY: number;
    }> = [];

    (hasHskScene ? HSK_BOOK_SPECS : []).forEach((spec, i) => {
      const spineTex = createBookSpineTexture(spec.level, spec.spineHex);
      const spineMat = new THREE.MeshStandardMaterial({
        map: spineTex,
        roughness: 0.38,
        metalness: 0.06,
      });

      const frontMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.32,
        metalness: 0.05,
      });

      textureLoader.load(spec.coverUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        frontMat.map = tex;
        frontMat.needsUpdate = true;
      });

      const backMat = new THREE.MeshStandardMaterial({
        color: spec.jacketColor,
        roughness: 0.42,
        metalness: 0.05,
      });

      // BoxGeometry faces: 0=+X(pages), 1=-X(spine), 2=+Y(top pages), 3=-Y(bottom pages), 4=+Z(front cover), 5=-Z(back cover)
      const mesh = new THREE.Mesh(bookGeo, [
        pageEdgeMat,
        spineMat,
        pageEdgeMat,
        pageEdgeMat,
        frontMat,
        backMat,
      ]);
      mesh.userData = { kind: 'book', level: spec.level, bookIdx: i };

      const baseX = (i - 2.5) * 1.18;
      const baseZ = -Math.abs(i - 2.5) * 0.16;
      const baseRotY = -0.22 + (i - 2.5) * 0.03;

      mesh.position.set(baseX, 0, baseZ);
      mesh.rotation.y = baseRotY;
      hskGroup.add(mesh);

      hskBookEntries.push({
        level: spec.level,
        mesh,
        frontMat,
        spineMat,
        backMat,
        baseX,
        baseZ,
        baseRotY,
        userRotX: 0,
        userRotY: 0,
      });
    });

    const sceneGroups = [tonesGroup, strokeGroup, cardsGroup, hskGroup];
    const sceneScales = [0, 1, 2, 3].map((idx) => (idx === stateRef.current.activeScene ? 1 : 0));
    sceneGroups.forEach((grp, idx) => {
      grp.visible = sceneScales[idx] > 0.08;
      grp.scale.setScalar(Math.max(0.001, sceneScales[idx]));
    });

    // ══════════════════════════════════════════════════════════════════════════
    // RAYCASTER & PER-OBJECT ROTATION (INDIVIDUAL BOOK / CARD ROTATION)
    // ══════════════════════════════════════════════════════════════════════════
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let hoveredCardIdx: number | null = null;
    let hoveredBookIdx: number | null = null;
    let grabbedCardIdx: number | null = null;
    let grabbedBookIdx: number | null = null;

    let dragRotX = 0.05;
    let dragRotY = -0.1;
    let isDragging = false;
    let downX = 0;
    let downY = 0;
    let prevX = 0;
    let prevY = 0;
    let pointerTravel = 0;
    let isVisible = true;
    let rafId = 0;
    const clock = new THREE.Clock();

    const updateRaycasterFromEvent = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      return true;
    };

    const getInteractiveTargets = (): THREE.Object3D[] => {
      const sc = stateRef.current.activeScene;
      if (sc === 2) return cardEntries.map((c) => c.mesh);
      if (sc === 3) return hskBookEntries.map((b) => b.mesh);
      return [];
    };

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      downX = e.clientX;
      downY = e.clientY;
      prevX = e.clientX;
      prevY = e.clientY;
      pointerTravel = 0;
      grabbedCardIdx = null;
      grabbedBookIdx = null;

      const sc = stateRef.current.activeScene;
      if (sc === 2 || sc === 3) {
        const targets = getInteractiveTargets();
        if (targets.length > 0 && updateRaycasterFromEvent(e)) {
          const hits = raycaster.intersectObjects(targets, false);
          if (hits.length > 0) {
            const ud = hits[0].object.userData;
            if (ud.kind === 'card') {
              grabbedCardIdx = ud.cardIdx;
            } else if (ud.kind === 'book') {
              grabbedBookIdx = ud.bookIdx;
              // Clicking/grabbing a book immediately focuses that book so only it rotates
              if (callbacksRef.current.onBookClick) {
                callbacksRef.current.onBookClick(ud.level);
              }
            }
          }
        }
        // Fallback: if dragging anywhere in Scene 3, only rotate the currently active book
        if (sc === 3 && grabbedBookIdx === null) {
          grabbedBookIdx = Math.min(5, Math.max(0, stateRef.current.activeHskLevel - 1));
        }
        if (sc === 2 && grabbedCardIdx === null) {
          grabbedCardIdx = stateRef.current.activeCardIdx;
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        pointerTravel = Math.hypot(e.clientX - downX, e.clientY - downY);
        if (pointerTravel > 5) {
          container.style.cursor = 'grabbing';
          const sc = stateRef.current.activeScene;
          if (sc === 3 && grabbedBookIdx !== null && hskBookEntries[grabbedBookIdx]) {
            // Rotate ONLY the grabbed/selected individual 3D HSK textbook!
            const targetBook = hskBookEntries[grabbedBookIdx];
            targetBook.userRotY += dx * 0.012;
            targetBook.userRotX = THREE.MathUtils.clamp(
              targetBook.userRotX + dy * 0.008,
              -0.65,
              0.65
            );
          } else if (sc === 2 && grabbedCardIdx !== null && cardEntries[grabbedCardIdx]) {
            // Rotate ONLY the grabbed/selected individual 3D flashcard!
            const targetCard = cardEntries[grabbedCardIdx];
            targetCard.userRotY += dx * 0.011;
            targetCard.userRotX = THREE.MathUtils.clamp(
              targetCard.userRotX + dy * 0.008,
              -0.55,
              0.55
            );
          } else {
            // Scene 0 (Tones) & Scene 1 (Single TianZiGe Slab) rotate rootRig
            dragRotY += dx * 0.009;
            dragRotX = THREE.MathUtils.clamp(dragRotX + dy * 0.006, -0.65, 0.65);
          }
        }
        prevX = e.clientX;
        prevY = e.clientY;
        return;
      }

      // Hover raycasting on active 3D cards or 3D HSK books
      const targets = getInteractiveTargets();
      if (targets.length === 0) {
        hoveredCardIdx = null;
        hoveredBookIdx = null;
        container.style.cursor = 'grab';
        return;
      }

      if (!updateRaycasterFromEvent(e)) return;
      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length > 0) {
        const ud = hits[0].object.userData;
        if (ud.kind === 'card') {
          hoveredCardIdx = ud.cardIdx;
          hoveredBookIdx = null;
        } else if (ud.kind === 'book') {
          hoveredBookIdx = ud.bookIdx;
          hoveredCardIdx = null;
        }
        container.style.cursor = 'pointer';
      } else {
        hoveredCardIdx = null;
        hoveredBookIdx = null;
        container.style.cursor = 'grab';
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      grabbedCardIdx = null;
      grabbedBookIdx = null;

      // If pointer movement was small (< 8px), treat as direct 3D object click!
      if (pointerTravel < 8) {
        const targets = getInteractiveTargets();
        if (targets.length > 0 && updateRaycasterFromEvent(e)) {
          const hits = raycaster.intersectObjects(targets, false);
          if (hits.length > 0) {
            const ud = hits[0].object.userData;
            if (ud.kind === 'card' && callbacksRef.current.onCardClick) {
              if (cardEntries[ud.cardIdx]) {
                cardEntries[ud.cardIdx].userRotY = 0;
                cardEntries[ud.cardIdx].userRotX = 0;
              }
              callbacksRef.current.onCardClick(ud.cardId, ud.cardIdx);
              container.style.cursor = 'pointer';
              return;
            }
            if (ud.kind === 'book' && callbacksRef.current.onBookClick) {
              callbacksRef.current.onBookClick(ud.level);
              container.style.cursor = 'pointer';
              return;
            }
          }
        }
      }

      container.style.cursor = hoveredCardIdx !== null || hoveredBookIdx !== null ? 'pointer' : 'grab';
    };

    const onLeave = () => {
      hoveredCardIdx = null;
      hoveredBookIdx = null;
    };

    container.style.cursor = 'grab';
    container.addEventListener('pointerdown', onDown);
    container.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    container.addEventListener('pointerleave', onLeave);

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
      { y: 0.08, z: 6.7, rotX: -0.06, rotY: 0.18 },
      { y: 0.06, z: 7.45, rotX: 0.0, rotY: 0.0 },
      { y: 0.12, z: 7.85, rotX: 0.0, rotY: 0.0 },
    ];

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isActiveRef.current || !isVisible || document.hidden) {
        clock.getDelta();
        return;
      }

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
      // Automatically pull camera back on portrait mobile screens so all 3 cards / 6 books fit horizontally
      const wideSceneFactor = st.activeScene === 2 || st.activeScene === 3 ? 1.32 : 1.05;
      const aspectScale =
        camera.aspect < wideSceneFactor
          ? Math.min(1.88, wideSceneFactor / Math.max(0.54, camera.aspect))
          : 1;
      const targetCamZ = camTarget.z * aspectScale;

      camera.position.y += (camTarget.y - camera.position.y) * Math.min(1, dt * 4);
      camera.position.z += (targetCamZ - camera.position.z) * Math.min(1, dt * 5);
      camera.lookAt(0, 0, 0);

      // In Scene 2 (Cards) and Scene 3 (HSK Books), keep rootRig level so items stay independent!
      if (st.activeScene === 2 || st.activeScene === 3) {
        dragRotY += (0 - dragRotY) * Math.min(1, dt * 6);
        dragRotX += (0 - dragRotX) * Math.min(1, dt * 6);
      } else if (!isDragging) {
        const breatheY = camTarget.rotY + Math.sin(t * 0.45) * 0.07 * m;
        const breatheX = camTarget.rotX + Math.cos(t * 0.35) * 0.025 * m;
        dragRotY += (breatheY - dragRotY) * Math.min(1, dt * 1.8);
        dragRotX += (breatheX - dragRotX) * Math.min(1, dt * 1.8);
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
      }

      if (cardsGroup.visible) {
        cardEntries.forEach((entry, idx) => {
          const flipped = !!st.flippedCards[entry.id];
          const isFocus = idx === st.activeCardIdx;
          const isHovered = idx === hoveredCardIdx;
          if (!isFocus && grabbedCardIdx !== idx) {
            entry.userRotX += (0 - entry.userRotX) * Math.min(1, dt * 6);
            entry.userRotY += (0 - entry.userRotY) * Math.min(1, dt * 6);
          }

          const targetRotY = (flipped ? Math.PI : 0) + (idx - 1) * -0.1 + entry.userRotY;
          entry.currentFlipY += (targetRotY - entry.currentFlipY) * Math.min(1, dt * 13);
          entry.mesh.rotation.y = entry.currentFlipY;
          entry.mesh.rotation.x += (entry.userRotX - entry.mesh.rotation.x) * Math.min(1, dt * 11);

          const targetZ = (isFocus ? 0.55 : -0.1) + (isHovered ? 0.22 : 0);
          const targetY =
            Math.sin(t * 1.15 * m + idx * 1.2) * 0.05 + (isHovered ? 0.12 : 0);
          const targetScale = (isFocus ? 1.07 : 0.96) + (isHovered ? 0.04 : 0);

          entry.mesh.position.z += (targetZ - entry.mesh.position.z) * Math.min(1, dt * 11);
          entry.mesh.position.y += (targetY - entry.mesh.position.y) * Math.min(1, dt * 11);
          entry.mesh.scale.setScalar(
            entry.mesh.scale.x + (targetScale - entry.mesh.scale.x) * Math.min(1, dt * 11)
          );
        });
      }

      if (hskGroup.visible) {
        const activeIdx = Math.min(5, Math.max(0, st.activeHskLevel - 1));
        hskBookEntries.forEach((book, idx) => {
          const selected = idx === activeIdx;
          const hovered = idx === hoveredBookIdx;

          // Non-selected books smoothly return to their neat shelf rotation
          if (!selected) {
            book.userRotX += (0 - book.userRotX) * Math.min(1, dt * 7);
            book.userRotY += (0 - book.userRotY) * Math.min(1, dt * 7);
          }

          const targetZ =
            book.baseZ + (selected ? 0.92 : 0) + (hovered && !selected ? 0.24 : 0);
          const targetY =
            (selected ? 0.16 : 0) +
            (hovered ? 0.09 : 0) +
            Math.sin(t * 1.05 * m + idx * 0.9) * 0.03;
          const targetRotY =
            (selected ? 0.06 : hovered ? book.baseRotY * 0.5 : book.baseRotY) + book.userRotY;
          const targetRotX = (selected ? -0.03 : 0) + book.userRotX;
          const targetScale = selected ? 1.16 : hovered ? 1.04 : 0.95;

          book.mesh.position.z += (targetZ - book.mesh.position.z) * Math.min(1, dt * 10);
          book.mesh.position.y += (targetY - book.mesh.position.y) * Math.min(1, dt * 10);
          book.mesh.rotation.y += (targetRotY - book.mesh.rotation.y) * Math.min(1, dt * 11);
          book.mesh.rotation.x += (targetRotX - book.mesh.rotation.x) * Math.min(1, dt * 11);
          book.mesh.scale.setScalar(
            book.mesh.scale.x + (targetScale - book.mesh.scale.x) * Math.min(1, dt * 10)
          );
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener('pointerdown', onDown);
      container.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      container.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
      io.disconnect();
      tabletMatRef.current = null;
      tabletBackMatRef.current = null;

      railGeo.dispose();
      railMat.dispose();
      toneMeshes.forEach((tm) => {
        tm.mesh.geometry.dispose();
        tm.mat.dispose();
      });
      orbGeo.dispose();
      orbMat.dispose();
      tabletGeo.dispose();
      tabletFaceMat.map?.dispose();
      tabletFaceMat.dispose();
      tabletBackMat.map?.dispose();
      tabletBackMat.dispose();
      cardGeo.dispose();
      cardEntries.forEach((c) => {
        c.frontMat.map?.dispose();
        c.frontMat.dispose();
        c.backMat.map?.dispose();
        c.backMat.dispose();
      });
      bookGeo.dispose();
      pageEdgeTex?.dispose();
      pageEdgeMat.dispose();
      hskBookEntries.forEach((b) => {
        b.frontMat.map?.dispose();
        b.frontMat.dispose();
        b.spineMat.map?.dispose();
        b.spineMat.dispose();
        b.backMat.dispose();
      });
      walnutMat.dispose();
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
      className={`relative w-full h-full select-none touch-none ${className}`}
    />
  );
};
