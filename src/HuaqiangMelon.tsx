import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import type {Caption as RemotionCaption} from '@remotion/captions';
import {ThreeCanvas} from '@remotion/three';
import {Quaternion, Vector3} from 'three';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';
import '@fontsource/noto-sans-sc/800.css';
import '@fontsource/noto-sans-sc/900.css';

type Point = [number, number];
type Point3D = [number, number, number];

const TAU = Math.PI * 2;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const seeded = (seed: number) => {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const grassRand = seeded(12);
const farGrass = Array.from({length: 900}, () => ({
  x: grassRand() * 1280,
  y: 405 + grassRand() * 315,
  h: 14 + grassRand() * 62,
  lean: -10 + grassRand() * 20,
  tone: grassRand(),
}));

const nearGrass = Array.from({length: 620}, () => ({
  x: -30 + grassRand() * 1340,
  y: 520 + grassRand() * 230,
  h: 42 + grassRand() * 155,
  lean: -18 + grassRand() * 36,
  tone: grassRand(),
}));

const dustRand = seeded(77);
const dust = Array.from({length: 170}, () => ({
  x: -240 + dustRand() * 360,
  y: 72 + dustRand() * 122,
  r: 4 + dustRand() * 18,
  phase: dustRand() * TAU,
  alpha: 0.18 + dustRand() * 0.42,
}));

const path = (points: Point[]) =>
  points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') +
  ' Z';

const legPoint = (
  origin: Point,
  upper: number,
  lower: number,
  phase: number,
  offset: number,
  isFront: boolean,
) => {
  const p = (phase + offset) % 1;
  const reach = Math.sin(p * TAU);
  const lift = Math.max(0, Math.sin((p - 0.1) * TAU));
  const plant = p > 0.3 && p < 0.64;
  const upperAngle = (isFront ? 1.56 : 1.68) + reach * 0.48 - lift * 0.24;
  const lowerAngle = (isFront ? 1.46 : 1.62) + reach * 0.42 + lift * 0.44;
  const knee: Point = [
    origin[0] + Math.cos(upperAngle) * upper,
    origin[1] + Math.sin(upperAngle) * upper - lift * 22,
  ];
  const hoof: Point = [
    knee[0] + Math.cos(lowerAngle) * lower + reach * 18,
    plant ? 174 : knee[1] + Math.sin(lowerAngle) * lower + lift * 6,
  ];
  return {knee, hoof, plant, p};
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const light = interpolate(frame, [0, 150, 300, 449], [0.88, 1.05, 0.96, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const parallax = Math.sin(seconds * 0.18) * 10;

  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(180deg, #20385d 0%, #6e7890 31%, #e0a260 57%, #81723e 58%, #334424 100%)',
        filter: `brightness(${light}) contrast(1.06) saturate(1.08)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 61% 33%, rgba(255,224,164,0.62), rgba(255,210,132,0.22) 15%, transparent 39%)',
          mixBlendMode: 'screen',
        }}
      />
      <svg width="1280" height="720" viewBox="0 0 1280 720">
        <g opacity={0.72} transform={`translate(${parallax * 0.15} 0)`}>
          <path
            d="M0 358 C130 330 230 365 360 344 C515 320 650 375 820 342 C990 315 1110 360 1280 337 L1280 720 L0 720 Z"
            fill="#526451"
            filter="url(#soft)"
          />
          <path
            d="M0 400 C160 372 300 420 465 386 C650 350 820 415 990 382 C1110 360 1180 390 1280 371 L1280 720 L0 720 Z"
            fill="#40563a"
            opacity={0.9}
          />
          <path
            d="M0 437 C190 410 345 455 540 420 C720 390 870 462 1060 416 C1160 392 1220 410 1280 402 L1280 720 L0 720 Z"
            fill="#314428"
            opacity={0.92}
          />
        </g>
        <defs>
          <filter id="soft">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};

const GrassField: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const wind = Math.sin(seconds * 1.18) * 18 + Math.sin(seconds * 2.4) * 6;
  const groundTravel = (frame * 4.1) % 1280;

  return (
    <AbsoluteFill>
      <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <g opacity={0.72} transform={`translate(${-groundTravel * 0.13} 0)`}>
          {[0, 1280].map((offset) => (
            <g key={offset} transform={`translate(${offset} 0)`}>
              {farGrass.map((blade, index) => {
                const sway = wind * (0.15 + blade.tone * 0.7) + blade.lean;
                const color =
                  blade.tone < 0.35
                    ? 'rgba(61,84,40,0.66)'
                    : blade.tone < 0.76
                      ? 'rgba(142,127,65,0.58)'
                      : 'rgba(232,192,108,0.38)';
                return (
                  <line
                    key={index}
                    x1={blade.x}
                    y1={blade.y}
                    x2={blade.x + sway}
                    y2={blade.y - blade.h}
                    stroke={color}
                    strokeWidth={1}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const DustSystem: React.FC<{x: number; y: number; phase: number}> = ({x, y, phase}) => {
  const frame = useCurrentFrame();
  return (
    <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute'}}>
      <g filter="url(#dustBlur)">
        {dust.map((p, i) => {
          const drift = (frame * 1.8 + i * 11) % 180;
          const alpha = p.alpha * (0.45 + 0.55 * Math.sin(phase * TAU + p.phase) ** 2);
          return (
            <ellipse
              key={i}
              cx={x + p.x - drift}
              cy={y + p.y + Math.sin(phase * TAU + p.phase) * 9}
              rx={p.r * 2.7}
              ry={p.r}
              fill={`rgba(230,184,106,${alpha})`}
            />
          );
        })}
      </g>
      <defs>
        <filter id="dustBlur">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
    </svg>
  );
};

const HorseRig: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const phase = (seconds * 1.9) % 1;
  const bob = Math.sin(phase * TAU) * 4 + Math.sin(phase * TAU * 2) * 2;
  const x = 610 + Math.sin(seconds * 0.34) * 18;
  const y = 486 + bob;
  const riderBob = Math.sin(phase * TAU + 0.72) * 5;
  const bodyRotate = Math.sin(phase * TAU + 0.2) * 0.8;
  const legs = [
    {origin: [148, 70] as Point, offset: 0, front: true, near: false},
    {origin: [78, 78] as Point, offset: 0.18, front: true, near: true},
    {origin: [-118, 78] as Point, offset: 0.52, front: false, near: true},
    {origin: [-202, 68] as Point, offset: 0.7, front: false, near: false},
  ];

  return (
    <AbsoluteFill>
      <DustSystem x={x} y={y} phase={phase} />
      <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <ellipse cx={x + 32} cy={y + 132} rx={365} ry={42} fill="rgba(0,0,0,0.35)" filter="url(#shadowBlur)" />
        <g transform={`translate(${x} ${y}) scale(0.72) rotate(${bodyRotate})`}>
          <g opacity={0.78} filter="url(#motionBlur)">
            {legs
              .filter((leg) => !leg.near)
              .map((leg, index) => {
                const {knee, hoof} = legPoint(leg.origin, 80, 86, phase, leg.offset, leg.front);
                return (
                  <path
                    key={index}
                    d={`M ${leg.origin[0]} ${leg.origin[1]} Q ${knee[0]} ${knee[1]} ${hoof[0]} ${hoof[1]}`}
                    fill="none"
                    stroke="#2a1a14"
                    strokeWidth={16}
                    strokeLinecap="round"
                  />
                );
              })}
          </g>
          <path
            d="M -332 44 C -302 -34 -218 -91 -90 -116 C 56 -142 188 -108 286 -42 C 344 -4 360 44 326 88 C 274 140 112 154 -58 132 C -214 112 -316 88 -332 44 Z"
            fill="#241713"
          />
          <path
            d="M -306 28 C -260 -36 -162 -84 -34 -102 C 90 -119 206 -88 288 -32 C 330 0 334 43 300 78 C 242 128 92 136 -66 116 C -218 98 -324 68 -306 28 Z"
            fill="url(#horseCoat)"
          />
          <path d="M -258 12 C -206 -76 -72 -114 50 -108 C -46 -86 -108 -38 -132 38 C -174 42 -222 32 -258 12 Z" fill="rgba(167,104,60,0.2)" />
          <path d="M -84 108 C 24 134 184 124 286 72 C 216 122 96 148 -58 132 C -184 118 -274 82 -306 48 C -260 72 -184 96 -84 108 Z" fill="rgba(25,17,14,0.2)" />
          <ellipse cx="-76" cy="-3" rx="98" ry="64" fill="rgba(150,91,52,0.14)" />
          <ellipse cx="118" cy="0" rx="108" ry="66" fill="rgba(112,63,38,0.15)" />
          <path
            d="M 170 -78 C 222 -150 312 -196 402 -192 C 448 -190 466 -162 446 -124 C 414 -66 328 -34 242 16 C 238 -24 214 -54 170 -78 Z"
            fill="#633c2b"
          />
          <path
            d="M 398 -190 C 472 -208 566 -190 612 -142 C 644 -108 622 -72 560 -62 C 496 -52 430 -74 396 -120 C 376 -146 378 -174 398 -190 Z"
            fill="url(#horseCoat)"
          />
          <path d="M 438 -189 C 444 -226 462 -254 486 -272 C 493 -232 484 -204 462 -184 Z" fill="#4f3023" />
          <path d="M 498 -188 C 518 -224 546 -252 578 -270 C 574 -230 556 -202 526 -181 Z" fill="#4f3023" />
          <ellipse cx="540" cy="-142" rx="5.5" ry="4.5" fill="#0b0908" />
          <circle cx="542" cy="-144" r="1.8" fill="rgba(255,235,190,0.82)" />
          <path d="M 585 -107 C 606 -102 624 -95 638 -84" fill="none" stroke="rgba(30,20,15,0.46)" strokeWidth="4" strokeLinecap="round" />
          <path d="M 392 -134 C 452 -112 516 -96 628 -88" fill="none" stroke="rgba(32,20,14,0.46)" strokeWidth="5" strokeLinecap="round" />
          <path d="M 418 -184 C 407 -128 398 -96 372 -52" fill="none" stroke="rgba(28,18,13,0.52)" strokeWidth="7" strokeLinecap="round" />
          {Array.from({length: 34}, (_, i) => (
            <path
              key={i}
              d={`M ${238 + i * 5} ${-160 + i * 1.2} C ${220 + i * 3} ${-118 + i} ${218 + i * 3} ${-75 + i} ${206 + i * 3} ${-42 + i}`}
              fill="none"
              stroke={`rgba(30,19,14,${0.44 + (i % 4) * 0.09})`}
              strokeWidth={2 + (i % 3)}
              strokeLinecap="round"
            />
          ))}
          {Array.from({length: 44}, (_, i) => {
            const wave = Math.sin(phase * TAU + i * 0.2) * 36;
            return (
              <path
                key={i}
                d={`M -305 ${-2 + (i % 9) * 4} C ${-400 - wave * 0.3} ${-28 + (i % 7) * 10} ${-455 - wave} ${18 + (i % 11) * 8} ${-555 - wave * 0.7} ${18 + (i % 15) * 8}`}
                fill="none"
                stroke={`rgba(29,18,14,${0.34 + (i % 5) * 0.08})`}
                strokeWidth={2 + (i % 4)}
                strokeLinecap="round"
              />
            );
          })}
          {legs
            .filter((leg) => leg.near)
            .map((leg, index) => {
              const {knee, hoof} = legPoint(leg.origin, 84, 92, phase, leg.offset, leg.front);
              return (
                <g key={index}>
                  <path
                    d={`M ${leg.origin[0]} ${leg.origin[1]} Q ${knee[0]} ${knee[1]} ${hoof[0]} ${hoof[1]}`}
                    fill="none"
                    stroke="#2f1d15"
                    strokeWidth={19}
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${leg.origin[0] + 4} ${leg.origin[1] - 2} Q ${knee[0] + 4} ${knee[1] - 3} ${hoof[0] + 4} ${hoof[1] - 3}`}
                    fill="none"
                    stroke="rgba(188,118,70,0.42)"
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                  <ellipse cx={hoof[0] + 6} cy={hoof[1] + 2} rx={19} ry={6} fill="#11100d" />
                </g>
              );
            })}
          <g transform={`translate(-16 ${riderBob - 16}) scale(0.66) rotate(-5)`}>
            <path d="M -122 -70 C -72 -120 70 -126 154 -74 C 114 -36 -62 -32 -122 -70 Z" fill="rgba(18,13,11,0.9)" />
            <path d="M -92 -102 C -26 -138 82 -130 140 -92 C 122 -62 -68 -60 -92 -102 Z" fill="#2a1b15" />
            <path d="M -92 -56 C -36 -28 78 -28 134 -54 C 100 -30 -54 -22 -110 -48 Z" fill="rgba(178,92,44,0.28)" />
            <path d="M -18 -142 C -4 -220 34 -282 80 -304 C 124 -258 136 -188 108 -118 C 70 -100 24 -104 -18 -142 Z" fill="#26221e" />
            <path d="M 6 -144 C 22 -206 52 -250 84 -274 C 104 -230 106 -174 90 -126 C 58 -114 30 -118 6 -144 Z" fill="rgba(70,58,46,0.5)" />
            <path d="M 12 -268 C 42 -292 78 -296 106 -274 C 100 -236 70 -214 34 -220 C 16 -230 8 -248 12 -268 Z" fill="#34251d" />
            <path d="M -2 -276 C 30 -318 88 -324 136 -290 C 112 -284 52 -276 -2 -276 Z" fill="#211815" />
            <path d="M 72 -192 Q 192 -142 392 -166" fill="none" stroke="#17120f" strokeWidth={9} strokeLinecap="round" />
            <path d="M 56 -188 Q 8 -138 -48 -82" fill="none" stroke="#17120f" strokeWidth={8} strokeLinecap="round" />
            <path d="M 92 -82 Q 118 -16 158 70" fill="none" stroke="#17120f" strokeWidth={15} strokeLinecap="round" />
            <path d="M -42 -80 Q -70 -4 -114 72" fill="none" stroke="#17120f" strokeWidth={14} strokeLinecap="round" />
            <ellipse cx="166" cy="76" rx="21" ry="8" fill="#11100d" />
            <ellipse cx="-122" cy="78" rx="21" ry="8" fill="#11100d" />
            <path d="M -82 -8 L -124 84" fill="none" stroke="rgba(18,13,11,0.62)" strokeWidth={4} strokeLinecap="round" />
            <path d="M 132 2 L 166 84" fill="none" stroke="rgba(18,13,11,0.62)" strokeWidth={4} strokeLinecap="round" />
            <path d="M 124 -146 Q 292 -166 520 -148" fill="none" stroke="rgba(22,16,12,0.66)" strokeWidth={3.5} />
          </g>
          <g filter="url(#rimBlur)" opacity={0.58}>
            <path d="M -278 -2 C -144 -84 18 -122 174 -91 C 246 -76 294 -44 328 -12" fill="none" stroke="#ffd99a" strokeWidth={5} />
            <path d="M 230 -74 C 306 -158 416 -194 574 -184" fill="none" stroke="#ffe0a9" strokeWidth={5} />
            <path d={`M -32 ${-128 + riderBob * 0.55} C -2 ${-214 + riderBob * 0.55} 54 ${-216 + riderBob * 0.55} 104 ${-118 + riderBob * 0.55}`} fill="none" stroke="#ffd99a" strokeWidth={3} />
          </g>
        </g>
        <defs>
          <filter id="shadowBlur">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id="rimBlur">
            <feGaussianBlur stdDeviation="1.3" />
          </filter>
          <filter id="motionBlur">
            <feGaussianBlur stdDeviation="1.1 0.4" />
          </filter>
          <linearGradient id="horseCoat" x1="-320" x2="620" y1="-150" y2="165" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#7a4a31" />
            <stop offset="0.44" stopColor="#9a5d38" />
            <stop offset="1" stopColor="#70442f" />
          </linearGradient>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};

const ForegroundGrass: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const wind = Math.sin(seconds * 1.18) * 24 + Math.sin(seconds * 2.4) * 9;
  const travel = (frame * 7.8) % 1280;

  return (
    <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute', filter: 'blur(0.35px)', opacity: 0.52}}>
      <g transform={`translate(${-travel} 0)`}>
        {[0, 1280, 2560].map((offset) => (
          <g key={offset} transform={`translate(${offset} 0)`}>
            {nearGrass.map((blade, index) => {
              const sway = wind * (0.2 + blade.tone) + blade.lean;
              const color =
                blade.tone < 0.42
                  ? 'rgba(38,58,30,0.54)'
                  : blade.tone < 0.77
                    ? 'rgba(98,96,48,0.48)'
                    : 'rgba(228,198,116,0.28)';
              return (
                <line
                  key={index}
                  x1={blade.x}
                  y1={blade.y}
                  x2={blade.x + sway}
                  y2={blade.y - blade.h}
                  stroke={color}
                  strokeWidth={blade.y > 650 ? 2 : 1}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        ))}
      </g>
    </svg>
  );
};

const SpeedStreaks: React.FC<{intensity: number}> = ({intensity}) => {
  const frame = useCurrentFrame();
  const offset = (frame * 18) % 260;

  return (
    <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute', opacity: intensity}}>
      <g transform={`translate(${-offset} 0)`} filter="url(#streakBlur)">
        {[0, 260, 520, 780, 1040, 1300].map((xOffset) => (
          <g key={xOffset} transform={`translate(${xOffset} 0)`}>
            {Array.from({length: 10}, (_, index) => {
              const y = 440 + index * 28 + Math.sin(index * 1.7) * 12;
              return (
                <line
                  key={index}
                  x1={20 + index * 17}
                  y1={y}
                  x2={155 + index * 17}
                  y2={y - 18}
                  stroke="rgba(238,204,132,0.32)"
                  strokeWidth={index % 3 === 0 ? 3 : 1.5}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        ))}
      </g>
      <defs>
        <filter id="streakBlur">
          <feGaussianBlur stdDeviation="4 1" />
        </filter>
      </defs>
    </svg>
  );
};

const Ellipsoid: React.FC<{
  position: Point3D;
  scale: Point3D;
  color: string;
  roughness?: number;
}> = ({position, scale, color, roughness = 0.72}) => (
  <mesh position={position} scale={scale}>
    <sphereGeometry args={[1, 32, 20]} />
    <meshStandardMaterial color={color} roughness={roughness} metalness={0.02} />
  </mesh>
);

const Segment3D: React.FC<{
  from: Point3D;
  to: Point3D;
  radius: number;
  color: string;
  roughness?: number;
}> = ({from, to, radius, color, roughness = 0.76}) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const quaternion = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    new Vector3(dx, dy, dz).normalize(),
  );

  return (
    <mesh
      position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]}
      quaternion={quaternion}
    >
      <cylinderGeometry args={[radius, radius * 0.82, length, 18]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={0.01} />
    </mesh>
  );
};

const gallopLeg = (hip: Point3D, phase: number, offset: number, isFront: boolean) => {
  const p = (phase + offset) % 1;
  const stride = Math.sin(p * TAU);
  const compression = Math.max(0, Math.sin((p + 0.1) * TAU));
  const extension = Math.max(0, Math.sin((p + 0.55) * TAU));
  const plant = p > 0.48 && p < 0.72;
  const frontBias = isFront ? 0.2 : -0.18;
  const knee: Point3D = [
    hip[0] + frontBias + stride * 0.28,
    hip[1] - 0.68 + compression * 0.2 - extension * 0.12,
    hip[2],
  ];
  const hoof: Point3D = [
    hip[0] + frontBias + stride * 0.82 + (isFront ? 0.24 : -0.22),
    plant ? -1.46 : -1.18 + compression * 0.34,
    hip[2],
  ];

  return {hip, knee, hoof, plant};
};

const ThreeHorseRig: React.FC<{speedIntensity: number}> = ({speedIntensity}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const seconds = frame / fps;
  const phase = (seconds * 2.65) % 1;
  const gallop = Math.sin(phase * TAU);
  const bodyLift = Math.max(0, Math.sin((phase + 0.12) * TAU)) * 0.16 - 0.06;
  const bodyPitch = Math.sin(phase * TAU + 0.45) * 0.12;
  const orbitY = interpolate(frame, [0, 70, 190, 340, 449], [-0.55, 0.15, 3.75, 6.05, 6.95], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const heroScale = interpolate(frame, [0, 80, 210, 330, 449], [0.84, 1.04, 0.92, 1.08, 0.96], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.34, 1.08, 0.44, 1),
  });
  const legs = [
    gallopLeg([1.14, -0.14, -0.26], phase, 0.02, true),
    gallopLeg([0.78, -0.12, 0.28], phase, 0.29, true),
    gallopLeg([-1.08, -0.13, 0.28], phase, 0.55, false),
    gallopLeg([-1.42, -0.15, -0.26], phase, 0.8, false),
  ];

  return (
    <AbsoluteFill style={{filter: `drop-shadow(0 36px 26px rgba(0,0,0,${0.35 + speedIntensity * 0.18}))`}}>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 1.18, 6.2], fov: 38}}>
        <ambientLight intensity={0.58} />
        <directionalLight position={[-4, 5, 4]} intensity={1.45} />
        <pointLight position={[2.8, 2.2, 2.5]} intensity={1.1} color="#ffd28a" />
        <group position={[0, -0.46 + bodyLift, 0]} scale={[heroScale, heroScale, heroScale]} rotation={[0.08, orbitY, bodyPitch]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
            <circleGeometry args={[4.1, 72]} />
            <meshStandardMaterial color="#29341d" roughness={0.95} transparent opacity={0.46} />
          </mesh>
          <Ellipsoid position={[-0.28, 0.18, 0]} scale={[1.96, 0.4, 0.34]} color="#8f5734" />
          <Ellipsoid position={[-1.26, 0.14, 0]} scale={[0.7, 0.38, 0.35]} color="#7b482f" />
          <Ellipsoid position={[1.16, 0.2, 0]} scale={[0.68, 0.38, 0.33]} color="#9b613a" />
          <Segment3D from={[1.2, 0.48, 0]} to={[1.78, 0.95, 0]} radius={0.22} color="#75472f" />
          <Ellipsoid position={[2.05, 1.06 + Math.sin(phase * TAU + 1.1) * 0.04, 0]} scale={[0.44, 0.24, 0.25]} color="#976039" />
          <Ellipsoid position={[2.4, 1.04, 0]} scale={[0.19, 0.13, 0.14]} color="#8a5435" />
          <mesh position={[1.86, 1.36, -0.1]} rotation={[0.25, 0, -0.24]}>
            <coneGeometry args={[0.1, 0.34, 12]} />
            <meshStandardMaterial color="#41271d" roughness={0.8} />
          </mesh>
          <mesh position={[2.14, 1.36, 0.12]} rotation={[0.25, 0, 0.24]}>
            <coneGeometry args={[0.1, 0.34, 12]} />
            <meshStandardMaterial color="#41271d" roughness={0.8} />
          </mesh>
          <Ellipsoid position={[2.45, 1.08, -0.16]} scale={[0.035, 0.035, 0.035]} color="#070604" roughness={0.4} />
          {[0, 1, 2, 3, 4].map((index) => (
            <Segment3D
              key={index}
              from={[1.25 + index * 0.14, 0.62 + index * 0.08, -0.03]}
              to={[1.48 + index * 0.12, 0.96 + index * 0.07, -0.04]}
              radius={0.035}
              color="#271913"
            />
          ))}
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Segment3D
              key={index}
              from={[-1.58 - index * 0.1, 0.18 - index * 0.02, Math.sin(phase * TAU + index * 0.3) * 0.08]}
              to={[-2.0 - index * 0.18, 0.02 - index * 0.04, Math.sin(phase * TAU + index * 0.35) * 0.16]}
              radius={0.045 - index * 0.004}
              color="#21140f"
            />
          ))}
          {legs.map((leg, index) => (
            <group key={index}>
              <Segment3D from={leg.hip} to={leg.knee} radius={0.082} color={index % 2 === 0 ? '#70432c' : '#4a2c20'} />
              <Segment3D from={leg.knee} to={leg.hoof} radius={0.058} color={index % 2 === 0 ? '#3b251c' : '#261812'} />
              <Ellipsoid position={leg.hoof} scale={[0.18, 0.055, 0.11]} color="#0c0a08" roughness={0.88} />
            </group>
          ))}
          <Ellipsoid position={[0.0, 0.7, 0]} scale={[0.64, 0.13, 0.38]} color="#1b120f" />
          <Ellipsoid position={[-0.04, 1.0 + Math.sin(phase * TAU + 0.7) * 0.05, 0]} scale={[0.2, 0.36, 0.14]} color="#22201d" />
          <Ellipsoid position={[0.02, 1.43 + Math.sin(phase * TAU + 0.9) * 0.035, 0]} scale={[0.12, 0.14, 0.12]} color="#33251e" />
          <mesh position={[0.06, 1.58, 0]} rotation={[0, 0, -0.08]}>
            <coneGeometry args={[0.22, 0.11, 24]} />
            <meshStandardMaterial color="#1b1411" roughness={0.75} />
          </mesh>
          <Segment3D from={[0.1, 1.14, -0.04]} to={[0.8, 0.74, -0.16]} radius={0.03} color="#15100d" />
          <Segment3D from={[-0.12, 1.14, 0.04]} to={[-0.42, 0.56, 0.2]} radius={0.03} color="#15100d" />
          <Segment3D from={[0.18, 0.7, -0.1]} to={[0.46, 0.02, -0.18]} radius={0.052} color="#15100d" />
          <Segment3D from={[-0.22, 0.7, 0.12]} to={[-0.48, -0.02, 0.22]} radius={0.052} color="#15100d" />
          <Segment3D from={[0.78, 0.72, -0.16]} to={[2.3, 1.0, -0.07]} radius={0.015} color="#120d0a" />
          <Segment3D from={[0.78, 0.72, 0.16]} to={[2.3, 1.0, 0.07]} radius={0.015} color="#120d0a" />
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

const HeroDustAndWind: React.FC<{speedIntensity: number; impact: number}> = ({speedIntensity, impact}) => {
  const frame = useCurrentFrame();
  const dustBoost = 0.42 + speedIntensity * 0.42 + impact * 0.5;

  return (
    <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute', opacity: dustBoost}}>
      <g filter="url(#heroDustBlur)">
        {dust.slice(0, 95).map((p, index) => {
          const spread = (frame * (3.4 + speedIntensity * 2.2) + index * 18) % 520;
          return (
            <ellipse
              key={index}
              cx={650 + p.x * 0.55 - spread}
              cy={548 + p.y * 0.28 + Math.sin(frame * 0.06 + p.phase) * 18}
              rx={p.r * (3.3 + impact * 3)}
              ry={p.r * (0.7 + impact * 0.7)}
              fill={`rgba(224,172,91,${p.alpha * 0.78})`}
            />
          );
        })}
      </g>
      <g filter="url(#heroWindBlur)">
        {Array.from({length: 22}, (_, index) => {
          const x = (1180 - ((frame * 22 + index * 113) % 1500));
          const y = 150 + index * 24 + Math.sin(frame * 0.04 + index) * 18;
          return (
            <line
              key={index}
              x1={x}
              y1={y}
              x2={x + 260 + speedIntensity * 160}
              y2={y - 34}
              stroke={`rgba(255,223,158,${0.05 + speedIntensity * 0.06})`}
              strokeWidth={index % 4 === 0 ? 4 : 2}
              strokeLinecap="round"
            />
          );
        })}
      </g>
      <defs>
        <filter id="heroDustBlur">
          <feGaussianBlur stdDeviation="8 3" />
        </filter>
        <filter id="heroWindBlur">
          <feGaussianBlur stdDeviation="7 1" />
        </filter>
      </defs>
    </svg>
  );
};

const CameraAndFx: React.FC<{speedIntensity: number}> = ({speedIntensity}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const flare = 0.35 + Math.sin(seconds * 0.55) * 0.18;
  const focusBloom = 0.1 + speedIntensity * 0.18 + Math.max(0, Math.sin(seconds * 0.72 - 0.8)) * 0.08;
  const fadeIn = interpolate(frame, [0, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const fadeOut = interpolate(frame, [410, 449], [1, 0.72], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        opacity: fadeIn * fadeOut,
        pointerEvents: 'none',
      }}
    >
      <SpeedStreaks intensity={speedIntensity * 0.34} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 53% 55%, transparent 0%, transparent 45%, rgba(0,0,0,0.5) 100%)',
          mixBlendMode: 'multiply',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: interpolate(frame, [0, 180, 360, 449], [360, 440, 390, 470], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          top: interpolate(frame, [0, 220, 449], [330, 300, 318], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          width: 540 + speedIntensity * 180,
          height: 2,
          background: `rgba(255,221,156,${flare})`,
          rotate: `${-22 + Math.sin(seconds * 0.42) * 2}deg`,
          filter: `blur(${5 + focusBloom * 10}px)`,
          mixBlendMode: 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.42), transparent 7%, transparent 93%, rgba(0,0,0,0.5))',
        }}
      />
    </AbsoluteFill>
  );
};

export const HorseRun: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const hoofPhase = (seconds * 2.65) % 1;
  const impact =
    Math.max(0, Math.sin(hoofPhase * TAU * 2.0)) ** 9 +
    Math.max(0, Math.sin(hoofPhase * TAU * 2.0 + Math.PI * 0.72)) ** 9;
  const trackingPan = interpolate(frame, [0, 60, 145, 245, 340, 449], [-142, 90, -120, 132, -82, 58], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const cameraX =
    trackingPan +
    Math.sin(seconds * 0.52) * 22 +
    Math.sin(seconds * 1.85) * 8 +
    Math.sin(seconds * 18.5) * impact * 13;
  const cameraY =
    interpolate(frame, [0, 70, 165, 255, 360, 449], [34, -46, 24, -58, 42, -18], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }) +
    Math.sin(seconds * 0.9) * 10 +
    Math.sin(seconds * 22) * impact * 10;
  const speedIntensity =
    0.74 +
    Math.max(0, Math.sin(seconds * 0.58 - 0.5)) * 0.46 +
    Math.max(0, Math.sin(seconds * 2.15)) * 0.24;
  const scale = interpolate(frame, [0, 55, 130, 230, 330, 450], [1.02, 1.18, 0.96, 1.24, 1.04, 1.14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.34, 1.08, 0.44, 1),
  });
  const roll =
    interpolate(frame, [0, 80, 170, 270, 365, 449], [-4.8, 3.6, -5.2, 4.2, -3.4, 2.2], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }) +
    Math.sin(seconds * 2.1) * 0.55 +
    Math.sin(seconds * 24) * impact * 0.75;
  const backgroundFocus = 0.7 + speedIntensity * 1.05 + Math.max(0, Math.sin(seconds * 0.9)) * 0.5;
  const foregroundFocus = 1.35 + speedIntensity * 2.4;

  return (
    <AbsoluteFill style={{backgroundColor: '#050607'}}>
      <Audio src={staticFile('audio/horse-run-remotion-audio.wav')} volume={0.92} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          scale,
          translate: `${cameraX}px ${cameraY}px`,
          rotate: `${roll}deg`,
          transformOrigin: '50% 62%',
        }}
      >
        <div style={{position: 'absolute', inset: 0, filter: `blur(${backgroundFocus}px)`}}>
          <Background />
        </div>
        <div style={{position: 'absolute', inset: 0, filter: `blur(${backgroundFocus * 0.38}px)`}}>
          <GrassField />
        </div>
        <ThreeHorseRig speedIntensity={speedIntensity} />
        <HeroDustAndWind speedIntensity={speedIntensity} impact={impact} />
        <div style={{position: 'absolute', inset: 0, filter: `blur(${foregroundFocus}px)`}}>
          <ForegroundGrass />
        </div>
      </div>
      <CameraAndFx speedIntensity={speedIntensity} />
    </AbsoluteFill>
  );
};

const melonRand = seeded(921);
const marketMelons = Array.from({length: 34}, (_, index) => ({
  x: 170 + (index % 12) * 72 + (melonRand() - 0.5) * 18,
  y: 402 - Math.floor(index / 12) * 34 + (melonRand() - 0.5) * 8,
  s: 0.74 + melonRand() * 0.34,
  r: -12 + melonRand() * 24,
}));

const crowd = Array.from({length: 18}, (_, index) => ({
  x: 20 + melonRand() * 1230,
  y: 354 + melonRand() * 72,
  h: 42 + melonRand() * 34,
  tone: melonRand(),
  delay: index * 17,
}));

const takeProgress = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });

const cutOpacity = (frame: number, start: number, end: number, fade = 10) =>
  interpolate(frame, [start, start + fade, end - fade, end], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Melon: React.FC<{x: number; y: number; s?: number; r?: number; split?: boolean}> = ({
  x,
  y,
  s = 1,
  r = 0,
  split = false,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    {split ? (
      <>
        <ellipse cx="-20" cy="0" rx="34" ry="24" fill="#d9d1aa" />
        <ellipse cx="-20" cy="0" rx="26" ry="17" fill="#e49a77" />
        <ellipse cx="22" cy="0" rx="34" ry="24" fill="#d9d1aa" />
        <ellipse cx="22" cy="0" rx="26" ry="17" fill="#e7a17e" />
        <path d="M-42 -8 C-26 -20 -9 -18 5 -6 M5 5 C18 17 34 18 49 7" fill="none" stroke="#31512b" strokeWidth="7" />
      </>
    ) : (
      <>
        <ellipse cx="0" cy="0" rx="38" ry="26" fill="#1f5d36" />
        <path d="M-32 -9 C-12 -23 12 -23 32 -8 M-34 8 C-12 23 14 22 34 8" fill="none" stroke="#9ebe57" strokeWidth="5" opacity="0.88" />
        <path d="M-9 -24 C-1 -9 0 10 -9 24 M12 -23 C20 -8 20 8 11 23" fill="none" stroke="#477b38" strokeWidth="4" opacity="0.72" />
      </>
    )}
  </g>
);

const Person: React.FC<{
  x: number;
  y: number;
  scale?: number;
  kind: 'buyer' | 'seller' | 'sidekick' | 'passer';
  pose?: 'walk' | 'stand' | 'sit' | 'lean' | 'recoil' | 'ride';
  look?: number;
}> = ({x, y, scale = 1, kind, pose = 'stand', look = 1}) => {
  const buyer = kind === 'buyer';
  const seller = kind === 'seller';
  const side = kind === 'sidekick';
  const jacket = buyer ? '#151719' : seller ? '#34302a' : side ? '#30343a' : '#7a6751';
  const shirt = buyer ? '#0a0b0c' : seller ? '#43613c' : side ? '#775f3b' : '#b68c5d';
  const skin = buyer ? '#b98663' : '#c59468';
  const lean = pose === 'lean' ? -7 : pose === 'recoil' ? 10 : pose === 'walk' ? -3 : 0;
  const sit = pose === 'sit';
  const armLift = pose === 'lean' ? -18 : pose === 'recoil' ? 22 : 0;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${lean})`}>
      <ellipse cx="0" cy="74" rx="31" ry="8" fill="rgba(0,0,0,0.32)" />
      <path d={sit ? 'M-12 8 L18 8 L26 56 L-22 56 Z' : 'M-20 0 C-9 -20 15 -20 25 0 L20 58 L-18 58 Z'} fill={jacket} />
      <path d="M-10 6 L15 6 L12 50 L-8 50 Z" fill={shirt} opacity="0.88" />
      <ellipse cx="2" cy="-23" rx={buyer ? 15 : 18} ry={buyer ? 16 : 18} fill={skin} />
      <path
        d={buyer ? 'M-14 -38 C-5 -50 13 -49 19 -36 C8 -39 -3 -39 -14 -38 Z' : 'M-20 -35 C-6 -49 14 -46 24 -31 C9 -36 -6 -35 -20 -35 Z'}
        fill={buyer ? '#111' : '#2a211a'}
      />
      {seller ? <rect x="16" y="-20" width="34" height="5" rx="2" fill="#e6d5a3" transform="rotate(-8)" /> : null}
      <circle cx={look > 0 ? 8 : -4} cy="-25" r="2.4" fill="#111" />
      <path d={`M-18 18 Q-42 ${34 + armLift} -54 ${55 + armLift * 0.3}`} fill="none" stroke={jacket} strokeWidth="9" strokeLinecap="round" />
      <path d={`M20 18 Q48 ${32 - armLift} 56 ${50 - armLift * 0.2}`} fill="none" stroke={jacket} strokeWidth="9" strokeLinecap="round" />
      <path d={sit ? 'M-8 55 L-42 82 M18 55 L48 82' : 'M-10 55 L-22 98 M15 55 L30 98'} fill="none" stroke="#171411" strokeWidth="10" strokeLinecap="round" />
    </g>
  );
};

const Motorcycle: React.FC<{x: number; y: number; scale?: number; rider?: boolean; tilt?: number}> = ({
  x,
  y,
  scale = 1,
  rider = false,
  tilt = 0,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${tilt})`}>
    <ellipse cx="2" cy="54" rx="126" ry="16" fill="rgba(0,0,0,0.28)" />
    <circle cx="-72" cy="44" r="30" fill="#151719" />
    <circle cx="-72" cy="44" r="15" fill="#5b6060" />
    <circle cx="76" cy="44" r="30" fill="#151719" />
    <circle cx="76" cy="44" r="15" fill="#5b6060" />
    <path d="M-70 28 C-34 -18 34 -16 72 30 L48 36 C8 20 -28 20 -54 36 Z" fill="#101316" />
    <path d="M24 -12 L74 -44 M72 -44 L96 -38" fill="none" stroke="#17191b" strokeWidth="8" strokeLinecap="round" />
    <rect x="-28" y="-8" width="78" height="22" rx="10" fill="#23282b" />
    <rect x="-6" y="16" width="58" height="14" rx="4" fill="#d7d1bd" />
    <text x="2" y="27" fontSize="11" fontWeight="800" fill="#1a1a1a">ZE·7168</text>
    {rider ? <Person x={-8} y={-48} scale={0.82} kind="buyer" pose="ride" /> : null}
  </g>
);

const MarketSet: React.FC<{frame: number; intensity?: number}> = ({frame, intensity = 1}) => {
  const traffic = (frame * 2.2) % 1600;
  const walk = Math.sin(frame * 0.04);

  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(180deg, #314568 0%, #9b8b72 38%, #d0a265 39%, #796a43 56%, #4b5234 100%)',
        filter: `saturate(${0.86 + intensity * 0.18}) contrast(1.08)`,
      }}
    >
      <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <defs>
          <filter id="melonSoft"><feGaussianBlur stdDeviation="2.2" /></filter>
          <linearGradient id="shopRed" x1="0" x2="1">
            <stop offset="0" stopColor="#8b1d17" />
            <stop offset="1" stopColor="#c23a24" />
          </linearGradient>
        </defs>
        <circle cx="880" cy="138" r="86" fill="rgba(255,223,162,0.56)" filter="url(#melonSoft)" />
        <rect x="0" y="248" width="1280" height="168" fill="#71644d" />
        <rect x="0" y="408" width="1280" height="312" fill="#505134" />
        <path d="M0 418 C220 386 380 454 576 412 C770 372 980 452 1280 398 L1280 720 L0 720 Z" fill="#384827" />
        <g opacity="0.86">
          <rect x="44" y="178" width="206" height="116" fill="#b9a681" />
          <rect x="62" y="196" width="172" height="34" fill="url(#shopRed)" />
          <text x="82" y="221" fontSize="23" fontWeight="900" fill="#f7e5c6">工农路洗衣</text>
          <rect x="300" y="190" width="185" height="100" fill="#a99170" />
          <rect x="315" y="204" width="155" height="31" fill="#284b62" />
          <text x="348" y="228" fontSize="22" fontWeight="900" fill="#e7efe8">冻 食</text>
          <rect x="530" y="172" width="238" height="125" fill="#c0a77c" />
          <rect x="548" y="190" width="198" height="35" fill="#2d342a" />
          <text x="585" y="216" fontSize="22" fontWeight="900" fill="#e7dabd">大众理发</text>
        </g>
        {[165, 822, 1118].map((x, i) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <rect x="-8" y="212" width="17" height="198" fill="#403521" />
            <circle cx="0" cy="186" r={i === 1 ? 72 : 58} fill="#42542f" />
            <circle cx="-38" cy="210" r="44" fill="#506236" />
            <circle cx="34" cy="220" r="48" fill="#344a2c" />
          </g>
        ))}
        <g transform={`translate(${1280 - traffic} 0)`}>
          <rect x="0" y="332" width="164" height="48" rx="10" fill="#a92c25" />
          <circle cx="34" cy="382" r="14" fill="#171717" />
          <circle cx="126" cy="382" r="14" fill="#171717" />
        </g>
        <g transform={`translate(${520 - traffic * 0.55} 0)`}>
          <rect x="0" y="315" width="126" height="54" rx="6" fill="#b9b9b2" />
          <circle cx="26" cy="371" r="13" fill="#171717" />
          <circle cx="102" cy="371" r="13" fill="#171717" />
        </g>
        {crowd.map((p, index) => (
          <g key={index} transform={`translate(${p.x + Math.sin((frame + p.delay) * 0.025) * 28} ${p.y}) scale(${0.66 + p.tone * 0.3})`} opacity="0.5">
            <Person x={0} y={0} scale={0.55} kind="passer" pose="walk" look={walk > 0 ? 1 : -1} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

const MelonStand: React.FC<{frame: number; reveal?: number; split?: number; chaos?: number}> = ({
  frame,
  reveal = 0,
  split = 0,
  chaos = 0,
}) => {
  const shake = Math.sin(frame * 0.9) * chaos * 8;

  return (
    <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute'}}>
      <g transform={`translate(${shake} ${Math.cos(frame * 0.7) * chaos * 5})`}>
        <polygon points="138,422 856,422 922,594 72,594" fill="#5a321d" />
        <polygon points="164,386 836,386 862,432 132,432" fill="#7a4a2b" />
        <path d="M130 430 L864 430" stroke="#2d180f" strokeWidth="10" />
        <rect x="214" y="590" width="33" height="94" fill="#3a2115" />
        <rect x="704" y="590" width="33" height="94" fill="#3a2115" />
        {marketMelons.map((m, index) => (
          <Melon
            key={index}
            x={m.x + chaos * Math.sin(index * 8) * 14}
            y={m.y + chaos * Math.cos(index * 4) * 12}
            s={m.s}
            r={m.r + chaos * 30}
          />
        ))}
        <Melon x={610 + split * 16} y={480 - split * 18} s={1.55} r={-8 + split * 8} split={split > 0.5} />
        <g transform={`translate(${442} ${372 + reveal * 84}) rotate(${reveal * 178})`}>
          <ellipse cx="0" cy="0" rx="52" ry="28" fill="#b4aa94" />
          <line x1="-68" y1="-24" x2="78" y2="-24" stroke="#4d321f" strokeWidth="7" />
          <line x1="0" y1="-22" x2="0" y2="-88" stroke="#5c3e23" strokeWidth="6" />
          <circle cx="0" cy="-94" r="11" fill="#312319" />
          <rect x="-30" y={24 + reveal * 6} width="60" height="18" rx="7" fill="#171717" opacity={reveal} />
        </g>
        <g transform={`translate(${690} ${378}) rotate(${-18 - split * 80})`}>
          <rect x="-8" y="-8" width="170" height="16" rx="5" fill="#d6d7cb" />
          <rect x="-42" y="-12" width="44" height="24" rx="6" fill="#4c2a1a" />
          <path d="M112 -8 L158 0 L112 8 Z" fill="#f8f1d7" opacity={0.92 + split * 0.08} />
        </g>
        <rect x="770" y="338" width="146" height="44" fill="#e7d8b3" />
        <text x="786" y="368" fontSize="22" fontWeight="900" fill="#8c281e">香草莓 特甜</text>
      </g>
    </svg>
  );
};

const NoirGrade: React.FC<{frame: number; shock?: number}> = ({frame, shock = 0}) => {
  const grain = (frame % 7) / 7;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 54% 48%, transparent 0%, transparent 43%, rgba(0,0,0,0.62) 100%)',
          mixBlendMode: 'multiply',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${82 + grain * 12}deg, rgba(255,215,142,0.08), transparent 32%, rgba(31,48,75,0.18))`,
          mixBlendMode: 'overlay',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.09 + shock * 0.08,
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.24) 0px, transparent 1px, transparent 4px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 86,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.74), transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 94,
          background: 'linear-gradient(0deg, rgba(0,0,0,0.8), transparent)',
        }}
      />
    </AbsoluteFill>
  );
};

const TitleCard: React.FC<{frame: number}> = ({frame}) => {
  const enter = takeProgress(frame, 0, 60);
  const exit = takeProgress(frame, 94, 132);

  return (
    <AbsoluteFill
      style={{
        background: '#0b0b0b',
        opacity: 1 - exit,
        justifyContent: 'center',
        alignItems: 'center',
        color: '#f1d6a0',
        fontFamily: '"Noto Sans SC", sans-serif',
      }}
    >
      <div style={{fontSize: 76, fontWeight: 900, letterSpacing: 10, scale: 0.82 + enter * 0.18}}>
        街口买瓜
      </div>
      <div style={{fontSize: 23, marginTop: 20, opacity: 0.72}}>
        九十年代街市 · 原创致敬短片
      </div>
    </AbsoluteFill>
  );
};

const FaceCloseup: React.FC<{kind: 'buyer' | 'seller'; tension: number}> = ({kind, tension}) => {
  const buyer = kind === 'buyer';
  const {width, height} = useVideoConfig();

  return (
    <AbsoluteFill style={{background: buyer ? '#0e1214' : '#19130e'}}>
      <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute'}}>
        <radialGradient id={buyer ? 'buyerPortraitGlow' : 'sellerPortraitGlow'} cx="50%" cy="42%" r="60%">
          <stop offset="0" stopColor={buyer ? '#6b7880' : '#7d563a'} stopOpacity="0.4" />
          <stop offset="1" stopColor="#000" stopOpacity="0.92" />
        </radialGradient>
        <rect width="1280" height="720" fill={`url(#${buyer ? 'buyerPortraitGlow' : 'sellerPortraitGlow'})`} />
      </svg>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 0.05, 3.05], fov: 28}}>
        <ambientLight intensity={0.52} />
        <directionalLight position={buyer ? [-2, 3, 4] : [2, 3, 4]} intensity={1.35} />
        <pointLight position={[buyer ? -1.4 : 1.4, 1.8, 2]} intensity={1.1 + tension * 0.35} color="#ffd7a0" />
        <group position={[buyer ? -0.18 : 0.1, -3.68, 0]} rotation={[0.04, buyer ? 0.24 : -0.28, 0]} scale={[2.28, 2.28, 2.28]}>
          <Character3D role={buyer ? 'buyer' : 'seller'} pose={tension > 0.55 ? 'lean' : 'stand'} tension={tension} position={[0, 0, 0]} rotationY={0} />
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

const EvidenceCloseup: React.FC<{frame: number; reveal: number; split: number}> = ({frame, reveal, split}) => {
  const flash = Math.max(0, Math.sin((frame - 1340) * 0.2)) * split;

  return (
    <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute'}}>
      <rect x="0" y="0" width="1280" height="720" fill="#160f09" opacity="0.94" />
      <polygon points="0,420 1280,330 1280,720 0,720" fill="#7a4b29" />
      <g transform={`translate(${438 - reveal * 70} ${342 + reveal * 48}) rotate(${reveal * 188 - 8}) scale(${1.75 - reveal * 0.38})`}>
        <ellipse cx="0" cy="0" rx="118" ry="64" fill="#bdb19a" />
        <line x1="-165" y1="-58" x2="180" y2="-58" stroke="#4b301d" strokeWidth="18" />
        <rect x="-58" y="52" width="116" height="38" rx="14" fill="#111" opacity={reveal} />
      </g>
      <g transform={`translate(${760 + split * 18} ${390 - split * 8}) rotate(${-18 - split * 84}) scale(${1.45})`}>
        <rect x="-24" y="-12" width="356" height="26" rx="8" fill="#d8d9cc" />
        <rect x="-96" y="-22" width="82" height="44" rx="9" fill="#462615" />
        <path d="M248 -13 L338 0 L248 13 Z" fill="#fff4d2" opacity={0.92 + flash * 0.08} />
      </g>
      <g opacity={split}>
        <Melon x={646} y={516} s={2.7} split r={-5} />
        <path d="M546 500 C620 465 710 462 792 502" fill="none" stroke={`rgba(255,232,176,${0.35 + flash * 0.42})`} strokeWidth="7" />
      </g>
    </svg>
  );
};

const EscapeCloseup: React.FC<{progress: number}> = ({progress}) => (
  <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute'}}>
    <rect width="1280" height="720" fill="#101923" />
    <circle cx="846" cy="212" r="104" fill="rgba(255,214,142,0.56)" />
    <path d="M0 465 C230 420 420 502 650 450 C850 406 1040 462 1280 430 L1280 720 L0 720 Z" fill="#3b472c" />
    <g transform={`translate(${310 + progress * 360} ${390 - progress * 30}) scale(1.58) rotate(${-3 + progress * 5})`}>
      <Motorcycle x={0} y={0} scale={1} rider tilt={0} />
      <path d={`M-8 -98 C30 ${-142 + progress * 24} 70 ${-132 + progress * 16} 98 -100`} fill="none" stroke="#c49b72" strokeWidth="9" strokeLinecap="round" opacity={progress} />
      <path d="M86 -132 C120 -120 142 -104 158 -82" fill="none" stroke="#0b0b0b" strokeWidth="11" strokeLinecap="round" opacity={progress} />
    </g>
  </svg>
);

const CinematicInserts: React.FC<{frame: number; pressure: number; reveal: number; split: number; exit: number}> = ({
  frame,
  pressure,
  reveal,
  split,
  exit,
}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {frame >= 610 && frame < 760 ? (
      <div style={{opacity: cutOpacity(frame, 610, 760, 12)}}>
        <FaceCloseup kind="seller" tension={pressure} />
      </div>
    ) : null}
    {frame >= 780 && frame < 990 ? (
      <div style={{opacity: cutOpacity(frame, 780, 990, 12)}}>
        <FaceCloseup kind="buyer" tension={pressure} />
      </div>
    ) : null}
    {frame >= 1500 && frame < 1845 ? (
      <div style={{opacity: cutOpacity(frame, 1500, 1845, 12)}}>
        <EvidenceCloseup frame={frame} reveal={reveal} split={split} />
      </div>
    ) : null}
    {frame >= 1930 && frame < 2095 ? (
      <div style={{opacity: cutOpacity(frame, 1930, 2095, 14)}}>
        <EscapeCloseup progress={exit} />
      </div>
    ) : null}
  </AbsoluteFill>
);

type DialogueBeat = RemotionCaption & {
  startFrame: number;
  endFrame: number;
  speaker: '旁白' | '买瓜人' | '摊主' | '同伙' | '路人';
  translation: string;
};

const dialogueBeats: DialogueBeat[] = [
  {startFrame: 140, endFrame: 245, startMs: 4667, endMs: 8167, timestampMs: null, confidence: null, speaker: '旁白', text: '有个人，来到了瓜摊前。', translation: 'A man arrived at the melon stand.'},
  {startFrame: 402, endFrame: 505, startMs: 13400, endMs: 16833, timestampMs: null, confidence: null, speaker: '买瓜人', text: '哥们儿，瓜怎么称？', translation: 'How much are the melons?'},
  {startFrame: 506, endFrame: 570, startMs: 16867, endMs: 19000, timestampMs: null, confidence: null, speaker: '摊主', text: '两块一斤，都是好瓜。', translation: 'Two yuan a jin. All good melons.'},
  {startFrame: 585, endFrame: 690, startMs: 19500, endMs: 23000, timestampMs: null, confidence: null, speaker: '买瓜人', text: '这价儿不低啊，瓜皮镶金了？', translation: 'That is steep. Is the rind made of gold?'},
  {startFrame: 690, endFrame: 780, startMs: 23000, endMs: 26000, timestampMs: null, confidence: null, speaker: '摊主', text: '大棚瓜就这个价，嫌贵我还嫌贵。', translation: 'That is the greenhouse price. I do not like it either.'},
  {startFrame: 790, endFrame: 850, startMs: 26333, endMs: 28333, timestampMs: null, confidence: null, speaker: '买瓜人', text: '那你给挑一个。', translation: 'Pick one for me.'},
  {startFrame: 850, endFrame: 925, startMs: 28333, endMs: 30833, timestampMs: null, confidence: null, speaker: '摊主', text: '行，这个沉，声儿也闷。', translation: 'This one is heavy. Nice dull sound.'},
  {startFrame: 930, endFrame: 1000, startMs: 31000, endMs: 33333, timestampMs: null, confidence: null, speaker: '买瓜人', text: '能保证熟甜吗？', translation: 'Can you guarantee it is ripe and sweet?'},
  {startFrame: 1000, endFrame: 1080, startMs: 33333, endMs: 36000, timestampMs: null, confidence: null, speaker: '摊主', text: '我卖瓜的，能坑你个生的？', translation: 'I sell melons. Would I give you an unripe one?'},
  {startFrame: 1080, endFrame: 1160, startMs: 36000, endMs: 38667, timestampMs: null, confidence: null, speaker: '买瓜人', text: '我再问一遍，能保证吗？', translation: 'I will ask once more. Can you guarantee it?'},
  {startFrame: 1160, endFrame: 1238, startMs: 38667, endMs: 41267, timestampMs: null, confidence: null, speaker: '摊主', text: '你是来找事儿的吧？要不要？', translation: 'Are you here to make trouble? Buying or not?'},
  {startFrame: 1242, endFrame: 1328, startMs: 41400, endMs: 44267, timestampMs: null, confidence: null, speaker: '买瓜人', text: '熟我就要，不熟呢？', translation: 'If it is ripe, I will take it. If not?'},
  {startFrame: 1328, endFrame: 1398, startMs: 44267, endMs: 46600, timestampMs: null, confidence: null, speaker: '摊主', text: '不熟我当场吃，够不够？', translation: 'If not, I will eat it here. Good enough?'},
  {startFrame: 1400, endFrame: 1460, startMs: 46667, endMs: 48667, timestampMs: null, confidence: null, speaker: '摊主', text: '十五斤，三十。', translation: 'Fifteen jin. Thirty yuan.'},
  {startFrame: 1460, endFrame: 1538, startMs: 48667, endMs: 51267, timestampMs: null, confidence: null, speaker: '买瓜人', text: '这秤，不够这个数。', translation: 'This scale does not add up.'},
  {startFrame: 1538, endFrame: 1600, startMs: 51267, endMs: 53333, timestampMs: null, confidence: null, speaker: '摊主', text: '你到底买不买？', translation: 'Are you buying or not?'},
  {startFrame: 1602, endFrame: 1668, startMs: 53400, endMs: 55600, timestampMs: null, confidence: null, speaker: '买瓜人', text: '看见了吗，吸在底下。', translation: 'See that? It is stuck underneath.'},
  {startFrame: 1680, endFrame: 1760, startMs: 56000, endMs: 58667, timestampMs: null, confidence: null, speaker: '买瓜人', text: '刚才的话，你自己记着。', translation: 'Remember what you just said.'},
  {startFrame: 1760, endFrame: 1835, startMs: 58667, endMs: 61167, timestampMs: null, confidence: null, speaker: '摊主', text: '你敢动我的瓜？', translation: 'You dare touch my melon?'},
  {startFrame: 1835, endFrame: 1910, startMs: 61167, endMs: 63667, timestampMs: null, confidence: null, speaker: '同伙', text: '出事了！快让开！', translation: 'Trouble! Move!'},
  {startFrame: 1930, endFrame: 1995, startMs: 64333, endMs: 66500, timestampMs: null, confidence: null, speaker: '路人', text: '哎——那个人！', translation: 'Hey! Stop that man!'},
];

const sfxEvents = [
  {from: 95, src: 'motor-pass.wav', volume: 0.58},
  {from: 250, src: 'motor.wav', volume: 0.22},
  {from: 820, src: 'tap.wav', volume: 0.7},
  {from: 888, src: 'tap.wav', volume: 0.58},
  {from: 1080, src: 'bass-hit.wav', volume: 0.76},
  {from: 1240, src: 'clang.wav', volume: 0.38},
  {from: 1460, src: 'bass-hit.wav', volume: 0.48},
  {from: 1536, src: 'clang.wav', volume: 0.82},
  {from: 1602, src: 'clang.wav', volume: 0.52},
  {from: 1684, src: 'slash.wav', volume: 0.82},
  {from: 1700, src: 'bass-hit.wav', volume: 0.72},
  {from: 1832, src: 'crowd.wav', volume: 0.78},
  {from: 1930, src: 'motor-pass.wav', volume: 0.72},
  {from: 1968, src: 'crowd.wav', volume: 0.34},
];

const AudioTimeline: React.FC<{frame: number}> = ({frame}) => {
  const pressureDuck = takeProgress(frame, 1040, 1180) * (1 - takeProgress(frame, 1400, 1500));
  const evidenceDuck = takeProgress(frame, 1500, 1540) * (1 - takeProgress(frame, 1668, 1720));
  const chaosLift = takeProgress(frame, 1830, 1900);
  const bgmVolume = clamp(0.24 - pressureDuck * 0.08 - evidenceDuck * 0.1 + chaosLift * 0.05, 0.12, 0.31);

  return (
    <>
      <Audio src={staticFile('audio/huaqiang/bgm-noir.wav')} volume={bgmVolume} />
      {sfxEvents.map((event, index) => (
        <Sequence key={`${event.src}-${event.from}-${index}`} from={event.from} layout="none">
          <Audio src={staticFile(`audio/huaqiang/${event.src}`)} volume={event.volume} />
        </Sequence>
      ))}
      {dialogueBeats.map((line, index) => {
        const voiceVolume = line.speaker === '旁白' ? 0.52 : line.speaker === '买瓜人' ? 0.72 : line.speaker === '摊主' ? 0.74 : 0.64;
        return (
          <Sequence key={`${line.speaker}-${line.startFrame}`} from={line.startFrame} layout="none">
            <Audio src={staticFile(`audio/huaqiang/voice/${String(index).padStart(2, '0')}.wav`)} volume={voiceVolume} />
          </Sequence>
        );
      })}
    </>
  );
};

const DialogueTrack: React.FC<{frame: number}> = ({frame}) => {
  const line = dialogueBeats.find((item) => frame >= item.startFrame && frame < item.endFrame);
  if (!line) {
    return null;
  }

  const opacity = cutOpacity(frame, line.startFrame, line.endFrame, 6);

  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        right: 110,
        bottom: 78,
        textAlign: 'center',
        opacity,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          maxWidth: 920,
          color: '#fff7e8',
          fontFamily: '"Noto Sans SC", sans-serif',
          textShadow: '0 2px 3px #000, 0 0 9px #000, 0 0 18px rgba(0,0,0,0.9)',
        }}
      >
        <div style={{fontSize: 34, fontWeight: 800, lineHeight: 1.18, letterSpacing: 0.5}}>{line.text}</div>
        <div style={{fontSize: 22, fontWeight: 600, lineHeight: 1.25, marginTop: 4, color: '#f0f0f0', letterSpacing: 0.2}}>
          {line.translation}
        </div>
      </div>
    </div>
  );
};

const VisualSfx: React.FC<{frame: number; shock: number}> = ({frame, shock}) => {
  const pop = (start: number, end: number) => cutOpacity(frame, start, end, 5);
  const pat = pop(830, 900);
  const bass = pop(1080, 1160);
  const clang = pop(1540, 1688);
  const slash = pop(1688, 1830);
  const shout = pop(1830, 1950);
  const motor = pop(95, 260) + pop(1930, 2100);

  return (
    <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute', pointerEvents: 'none'}}>
      <g opacity={motor * 0.58} transform={`translate(${150 + frame * 0.15} 505)`}>
        <text fontSize="26" fontWeight="900" fill="#d8d0bd">突突突突——</text>
        <path d="M0 18 C80 4 152 34 230 12" fill="none" stroke="#d8d0bd" strokeWidth="3" opacity="0.55" />
      </g>
      <g opacity={pat} transform={`translate(${560 + Math.sin(frame) * 8} ${336 + Math.cos(frame) * 4}) rotate(-10)`}>
        <text fontSize="46" fontWeight="900" fill="#f1d39a">啪！啪！</text>
      </g>
      <g opacity={bass} transform={`translate(640 360) scale(${1 + bass * 0.3})`}>
        <circle r={120 + bass * 60} fill="none" stroke="#e6c17a" strokeWidth="5" opacity="0.2" />
        <text x="-62" y="10" fontSize="38" fontWeight="900" fill="#e6c17a">咚——</text>
      </g>
      <g opacity={clang} transform={`translate(430 408) rotate(${shock * 20 - 8})`}>
        <text fontSize="52" fontWeight="900" fill="#fff1bc">哐当！</text>
        <path d="M-26 22 L166 -16" stroke="#fff1bc" strokeWidth="6" opacity="0.55" />
      </g>
      <g opacity={slash} transform={`translate(620 340) rotate(-17)`}>
        <path d="M-220 0 C-70 -50 80 -48 250 4" fill="none" stroke="#fff8d8" strokeWidth="10" />
        <text x="36" y="-22" fontSize="44" fontWeight="900" fill="#fff8d8">嚓！</text>
      </g>
      <g opacity={shout} transform={`translate(${815 + Math.sin(frame * 0.4) * 18} ${160 + Math.cos(frame * 0.5) * 10})`}>
        <text fontSize="44" fontWeight="900" fill="#f0d29a">散开！散开！</text>
      </g>
    </svg>
  );
};

const melonBeats = [
  {range: '00:00-00:05', camera: '远景横移，街口、店招、树影、瓜摊建立', action: '摩托从画面左后方进场', emotion: '平静里藏着目的'},
  {range: '00:05-00:10', camera: '中远景低机位，摩托靠马路牙子停下', action: '买瓜人不拔钥匙，脚撑地扫视退路', emotion: '克制、计算'},
  {range: '00:10-00:15', camera: '侧跟拍到摊前，前景西瓜遮挡切入', action: '买瓜人步入摊前，摊主和同伙松散站位', emotion: '市井闲散'},
  {range: '00:15-00:20', camera: '摊主近景，烟横在嘴边', action: '摊主斜眼报价，手压在瓜上', emotion: '轻慢、不耐烦'},
  {range: '00:20-00:25', camera: '买瓜人近景微仰，背景虚化', action: '买瓜人用玩笑式质疑压价', emotion: '笑着试探'},
  {range: '00:25-00:30', camera: '手部特写，拍瓜、烟灰、秤盘', action: '摊主挑瓜拍两下', emotion: '自信、敷衍'},
  {range: '00:30-00:35', camera: '正反打收紧，环境声降低', action: '买瓜人第一次追问甜熟，眼睛扫同伙', emotion: '冷意出现'},
  {range: '00:35-00:40', camera: '摊主近景轻微推入', action: '摊主笑容塌掉，身体前探', emotion: '被冒犯'},
  {range: '00:40-00:45', camera: '俯视空间关系，椅子、刀、秤在同一轴线', action: '买瓜人绕入内侧坐下', emotion: '局面反转'},
  {range: '00:45-00:50', camera: '秤杆特写到买瓜人眼神', action: '摊主报重量，买瓜人指出问题', emotion: '证据逼近'},
  {range: '00:50-00:55', camera: '高速插入，秤盘翻转', action: '黑色吸附块露出', emotion: '真相落地'},
  {range: '00:55-01:00', camera: '刀光横切到瓜瓤特写', action: '瓜被劈开，瓤发白', emotion: '沉默胜过争吵'},
  {range: '01:00-01:05', camera: '晃动中景，前景人群后退', action: '摊主扑上，冲突留在遮挡与声响里', emotion: '失控'},
  {range: '01:05-01:10', camera: '跟拍撤离，摩托启动，最后侧脸回望', action: '买瓜人离开，摊前混乱渐远', emotion: '冷静、余波'},
];

const DirectorSlate: React.FC<{frame: number}> = ({frame}) => {
  const index = Math.min(melonBeats.length - 1, Math.floor(frame / 150));
  const beat = melonBeats[index];

  return (
    <div
      style={{
        position: 'absolute',
        top: 18,
        left: 22,
        width: 430,
        padding: '12px 16px',
        border: '1px solid rgba(245,213,154,0.26)',
        background: 'rgba(10,8,6,0.48)',
        color: '#efd39a',
        fontFamily: '"Noto Sans SC", sans-serif',
        fontSize: 15,
        lineHeight: 1.45,
        opacity: 0.38,
      }}
    >
      <strong>{beat.range}</strong> {beat.camera}
      <br />
      动作：{beat.action}
      <br />
      情绪：{beat.emotion}
    </div>
  );
};

const Character3D: React.FC<{
  role: 'buyer' | 'seller' | 'sidekick';
  pose: 'stand' | 'walk' | 'sit' | 'lean' | 'recoil' | 'ride';
  tension: number;
  position: Point3D;
  rotationY?: number;
  scale?: number;
}> = ({role, pose, tension, position, rotationY = 0, scale = 1}) => {
  const buyer = role === 'buyer';
  const seller = role === 'seller';
  const jacket = buyer ? '#111417' : seller ? '#3a342c' : '#30343a';
  const shirt = buyer ? '#08090a' : seller ? '#385b35' : '#7a5b32';
  const skin = buyer ? '#b77c58' : '#c28a62';
  const lean = pose === 'lean' ? -0.18 : pose === 'recoil' ? 0.22 : pose === 'walk' ? -0.08 : 0;
  const sitDrop = pose === 'sit' ? -0.16 : 0;
  const armThreat = pose === 'lean' ? 0.35 : pose === 'recoil' ? -0.25 : 0;
  const legBend = pose === 'sit' ? 0.42 : pose === 'walk' ? Math.sin(tension * TAU) * 0.16 : 0;
  const eyeY = 1.42 + sitDrop;

  return (
    <group position={position} rotation={[0, rotationY, lean]} scale={[scale, scale, scale]}>
      <Ellipsoid position={[0, 1.06 + sitDrop, 0]} scale={[0.24, 0.5, 0.16]} color={jacket} />
      <Ellipsoid position={[0, 1.1 + sitDrop, 0.01]} scale={[0.16, 0.36, 0.105]} color={shirt} />
      <Ellipsoid position={[0, 1.66 + sitDrop, 0]} scale={[0.16, 0.18, 0.14]} color={skin} roughness={0.68} />
      <Ellipsoid position={[buyer ? -0.02 : 0.02, 1.82 + sitDrop, 0]} scale={[buyer ? 0.18 : 0.22, buyer ? 0.055 : 0.08, 0.15]} color={buyer ? '#070809' : '#221913'} />
      <Ellipsoid position={[-0.055, eyeY + 0.19, 0.128]} scale={[0.018 + tension * 0.006, 0.01, 0.01]} color="#070605" roughness={0.38} />
      <Ellipsoid position={[0.06, eyeY + 0.19, 0.128]} scale={[0.018 + tension * 0.006, 0.01, 0.01]} color="#070605" roughness={0.38} />
      <Segment3D from={[-0.08, 1.57 + sitDrop, 0.13]} to={[-0.14, 1.61 + tension * 0.04 + sitDrop, 0.15]} radius={0.009} color="#1a0f0b" />
      <Segment3D from={[0.06, 1.6 + sitDrop, 0.13]} to={[0.17, 1.62 + tension * 0.035 + sitDrop, 0.15]} radius={0.009} color="#1a0f0b" />
      {seller ? <Segment3D from={[0.13, 1.58 + sitDrop, 0.16]} to={[0.42, 1.62 + sitDrop, 0.2]} radius={0.014} color="#eadab6" /> : null}
      <Segment3D from={[-0.18, 1.28 + sitDrop, 0]} to={[-0.44, 0.95 + armThreat + sitDrop, 0.08]} radius={0.045} color={jacket} />
      <Segment3D from={[0.18, 1.28 + sitDrop, 0]} to={[0.44, 0.95 - armThreat + sitDrop, 0.08]} radius={0.045} color={jacket} />
      <Segment3D from={[-0.09, 0.65 + sitDrop, 0]} to={[-0.23, 0.08 + legBend, 0.05]} radius={0.06} color="#15120f" />
      <Segment3D from={[0.1, 0.65 + sitDrop, 0]} to={[0.28, 0.08 - legBend, 0.05]} radius={0.06} color="#15120f" />
      <Ellipsoid position={[-0.26, 0.02 + legBend, 0.08]} scale={[0.12, 0.035, 0.055]} color="#080706" />
      <Ellipsoid position={[0.31, 0.02 - legBend, 0.08]} scale={[0.12, 0.035, 0.055]} color="#080706" />
    </group>
  );
};

const MelonDrama3D: React.FC<{frame: number; pressure: number; reveal: number; split: number; chaos: number; exit: number}> = ({
  frame,
  pressure,
  reveal,
  split,
  chaos,
  exit,
}) => {
  const {width, height} = useVideoConfig();
  const walkIn = takeProgress(frame, 250, 430);
  const buyerX = interpolate(frame, [250, 430, 900, 1660, 1960], [-2.7, -0.92, -0.86, -0.72, 2.55], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const buyerPose = exit > 0.12 ? 'ride' : frame >= 1240 && frame < 1910 ? 'sit' : walkIn < 0.86 ? 'walk' : 'stand';
  const sellerPose = chaos > 0.25 ? 'recoil' : pressure > 0.55 ? 'lean' : 'stand';
  const knifeFlash = split > 0.2 ? 1 : 0;

  return (
    <AbsoluteFill style={{opacity: 0.98, filter: `drop-shadow(0 18px 18px rgba(0,0,0,${0.38 + pressure * 0.18}))`}}>
      <ThreeCanvas width={width} height={height} camera={{position: [0, 1.45, 5.1], fov: 42}}>
        <ambientLight intensity={0.52} />
        <directionalLight position={[-3, 5, 4]} intensity={1.28} />
        <pointLight position={[2.2, 2.1, 2.4]} intensity={0.85 + reveal * 0.35} color="#ffd38f" />
        <group position={[0, -1.05, 0]} rotation={[0.02, -0.08 + pressure * 0.1, 0]}>
          <mesh position={[-0.12, 0.72, -0.12]} scale={[2.4, 0.12, 0.7]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#704324" roughness={0.82} />
          </mesh>
          <mesh position={[-0.12, 0.86, -0.12]} scale={[2.5, 0.05, 0.75]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#8a5a30" roughness={0.76} />
          </mesh>
          {[-1.05, -0.68, -0.31, 0.06, 0.43, 0.8].map((x, index) => (
            <Ellipsoid key={x} position={[x, 1.02 + (index % 2) * 0.08, -0.1 + (index % 3) * 0.12]} scale={[0.17, 0.12, 0.14]} color="#245e33" />
          ))}
          <Ellipsoid position={[0.28, 1.08 - split * 0.06, 0.28]} scale={[0.23, 0.14, 0.16]} color={split > 0.45 ? '#e0a07a' : '#285f35'} />
          <mesh position={[-0.35, 1.03 + reveal * 0.14, 0.28]} rotation={[0, 0, reveal * Math.PI]}>
            <cylinderGeometry args={[0.22, 0.22, 0.055, 28]} />
            <meshStandardMaterial color="#c4b79e" roughness={0.72} />
          </mesh>
          <mesh position={[-0.35, 0.92 + reveal * 0.23, 0.28]} scale={[0.18, 0.04, 0.1]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#101010" roughness={0.6} transparent opacity={reveal} />
          </mesh>
          <Segment3D from={[0.62, 1.05, 0.32]} to={[1.24, 1.12 + split * 0.18, 0.34]} radius={0.035} color={knifeFlash ? '#f7f0d4' : '#d6d3c5'} roughness={0.32} />
          <Segment3D from={[0.52, 1.04, 0.32]} to={[0.34, 1.02, 0.32]} radius={0.055} color="#432818" />
          <Character3D role="buyer" pose={buyerPose} tension={pressure + reveal} position={[buyerX, 0.06, 0.82]} rotationY={0.22} scale={0.9 + pressure * 0.06} />
          <Character3D role="seller" pose={sellerPose} tension={pressure + chaos} position={[1.36 + chaos * 0.18, 0.08 + chaos * 0.08, 0.62]} rotationY={-0.45} scale={1.02} />
          <Character3D role="sidekick" pose={chaos > 0.15 ? 'recoil' : 'stand'} tension={chaos} position={[1.92 + chaos * 0.2, 0.04, 0.05]} rotationY={-0.48} scale={0.82} />
          <Character3D role="sidekick" pose={chaos > 0.15 ? 'recoil' : 'stand'} tension={chaos} position={[2.35 + chaos * 0.28, 0.02, 0.36]} rotationY={-0.58} scale={0.78} />
          <mesh position={[buyerX - 0.12, 0.09, 0.92]} scale={[0.34, 0.18, 0.26]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#3b2618" roughness={0.9} transparent opacity={pressure > 0.38 && exit < 0.1 ? 1 : 0} />
          </mesh>
          {chaos > 0.08 ? (
            <group>
              <Segment3D from={[1.92, 0.9, 0.05]} to={[2.36, 1.14, 0.38]} radius={0.035} color="#5a321d" />
              <Ellipsoid position={[0.26 + Math.sin(frame * 0.4) * 0.18, 1.12, 0.28]} scale={[0.16, 0.07, 0.07]} color="#e2a281" roughness={0.7} />
            </group>
          ) : null}
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const HuaqiangMelon: React.FC = () => {
  const frame = useCurrentFrame();
  const motorIn = takeProgress(frame, 95, 280);
  const walkIn = takeProgress(frame, 250, 430);
  const bargain = takeProgress(frame, 430, 760);
  const pressure = takeProgress(frame, 760, 1240);
  const reveal = takeProgress(frame, 1460, 1668);
  const split = takeProgress(frame, 1680, 1830);
  const chaos = takeProgress(frame, 1830, 1950);
  const exit = takeProgress(frame, 1930, 2100);
  const finalLook = takeProgress(frame, 1980, 2090);
  const shock =
    Math.max(0, Math.sin((frame - 1688) * 0.17)) * split * (1 - takeProgress(frame, 1840, 1900)) +
    Math.max(0, Math.sin((frame - 1830) * 0.22)) * chaos;
  const camX =
    interpolate(frame, [0, 260, 520, 760, 1060, 1320, 1580, 1810, 1960, 2100], [0, -90, 72, -122, 96, -166, 138, -74, 128, -60], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.45, 0, 0.2, 1),
    }) + Math.sin(frame * 0.025) * 10 + shock * Math.sin(frame * 1.7) * 18;
  const camY =
    interpolate(frame, [0, 360, 760, 1160, 1500, 1760, 1940, 2100], [0, 18, -42, -18, -56, 28, -30, -12], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) + shock * Math.cos(frame * 1.4) * 12;
  const camScale = interpolate(frame, [0, 300, 560, 760, 1040, 1380, 1640, 1840, 1980, 2100], [1, 1.08, 1.18, 1.36, 1.5, 1.62, 1.72, 1.14, 1.42, 1.18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.34, 1.08, 0.44, 1),
  });
  const camRoll =
    interpolate(frame, [0, 620, 1130, 1510, 1880, 2100], [0, -1.6, 2.4, -4.8, 1.8, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) + shock * Math.sin(frame * 1.1) * 1.5;
  const buyerX = interpolate(frame, [95, 280, 430, 910, 1660, 1960], [-260, 245, 430, 454, 462, 1030], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const sellerPose = chaos > 0.15 ? 'recoil' : pressure > 0.35 ? 'lean' : 'stand';

  return (
    <AbsoluteFill style={{backgroundColor: '#08090a', overflow: 'hidden'}}>
      <AudioTimeline frame={frame} />
      <div
        style={{
          position: 'absolute',
          inset: -70,
          scale: camScale,
          translate: `${camX}px ${camY}px`,
          rotate: `${camRoll}deg`,
          transformOrigin: '50% 58%',
          filter: `brightness(${0.86 + reveal * 0.12 + split * 0.15}) saturate(${0.86 + pressure * 0.22})`,
        }}
      >
        <MarketSet frame={frame} intensity={pressure + split} />
        <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute'}}>
          <g opacity={(1 - takeProgress(frame, 330, 430)) * 0.42}>
            <Motorcycle x={-120 + motorIn * 420} y={430 - motorIn * 32} scale={0.88 + motorIn * 0.12} rider />
          </g>
          <g opacity={takeProgress(frame, 245, 330) * (1 - exit) * 0.55}>
            <Motorcycle x={302} y={398} scale={0.9} tilt={-3} />
          </g>
          <g opacity={walkIn * (1 - exit) * 0.08}>
            <Person x={buyerX} y={371 - pressure * 10} scale={1.06 + pressure * 0.08} kind="buyer" pose={frame >= 1240 ? 'sit' : 'walk'} look={1} />
          </g>
          <g opacity={(1 - exit) * 0.08}>
            <Person x={770} y={344 + chaos * 24} scale={1.18} kind="seller" pose={sellerPose} look={-1} />
            <Person x={895} y={358} scale={0.88} kind="sidekick" pose={chaos > 0.2 ? 'recoil' : 'stand'} look={-1} />
            <Person x={972} y={365} scale={0.82} kind="sidekick" pose={chaos > 0.2 ? 'recoil' : 'stand'} look={-1} />
          </g>
          <g opacity={exit}>
            <Motorcycle x={470 + exit * 690} y={404 - exit * 34} scale={0.98} rider tilt={-2 + finalLook * 5} />
          </g>
        </svg>
        <MelonStand frame={frame} reveal={reveal} split={split} chaos={chaos} />
        <MelonDrama3D frame={frame} pressure={pressure} reveal={reveal} split={split} chaos={chaos} exit={exit} />
        <svg width="1280" height="720" viewBox="0 0 1280 720" style={{position: 'absolute', opacity: 0.3 + pressure * 0.35}}>
          <g filter="url(#melonSmoke)">
            {dust.map((p, index) => {
              const drift = (frame * 1.4 + index * 19) % 420;
              return (
                <ellipse
                  key={index}
                  cx={760 + p.x * 0.65 - drift + chaos * Math.sin(index) * 90}
                  cy={455 + p.y * 0.42 + Math.sin(frame * 0.04 + p.phase) * 16}
                  rx={p.r * (2.4 + chaos * 3.2)}
                  ry={p.r * 0.72}
                  fill={`rgba(211,168,104,${p.alpha * 0.55})`}
                />
              );
            })}
          </g>
          <defs>
            <filter id="melonSmoke"><feGaussianBlur stdDeviation="7 3" /></filter>
          </defs>
        </svg>
      </div>

      <CinematicInserts frame={frame} pressure={pressure} reveal={reveal} split={split} exit={exit} />
      <VisualSfx frame={frame} shock={shock} />
      <NoirGrade frame={frame} shock={shock} />
      <DialogueTrack frame={frame} />
    </AbsoluteFill>
  );
};
