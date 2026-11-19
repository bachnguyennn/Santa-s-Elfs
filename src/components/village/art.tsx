import * as React from "react";

/**
 * Village artwork. Original in-house SVG (REDESIGN_BRIEF.md §2): bright winter daytime, light from the
 * upper left, chunky rooflines, slightly crooked chimneys, a short blue shadow on the snow to the lower
 * right of every object. All pieces are decorative <g> groups placed inside a scene's <svg aria-hidden>.
 * One even outline (2.5px, non-scaling) in midnight ink; flat fills; no gradients.
 */

export const C = {
  sky: "#BDEBFA",
  snow: "#F7FCFF",
  snowShadow: "#A8CDDF",
  evergreen: "#175541",
  evergreenSoft: "#2E7A5C",
  evergreenDeep: "#0F3D2E",
  cranberry: "#B52F46",
  cranberryDeep: "#8F2236",
  golden: "#FFD166",
  goldenDeep: "#E9A93A",
  paper: "#FFF7E8",
  paperDeep: "#F4E6C8",
  timber: "#8A5A3C",
  timberDeep: "#6B4029",
  ink: "#172D38",
  skin: "#F2C6A0",
  skinShade: "#D99C78",
} as const;

export const line = {
  stroke: C.ink,
  strokeWidth: 2.5,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
  vectorEffect: "non-scaling-stroke" as const,
};
const thin = { ...line, strokeWidth: 1.75 };

type At = { x?: number; y?: number; s?: number; flip?: boolean };
const place = ({ x = 0, y = 0, s = 1, flip }: At) => `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;

/** The short blue shadow an object casts on the snow (light from the upper left). */
export function SnowShadow({ cx, cy, rx, ry = rx * 0.18 }: { cx: number; cy: number; rx: number; ry?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={C.snowShadow} />;
}

/** A rounded snowbank. `d` is its top silhouette; the bank is closed down to `bottom`. */
export function Snowbank({ d, fill = C.snow }: { d: string; fill?: string }) {
  return <path d={d} fill={fill} {...line} />;
}

/* ───────── Trees ───────── */

export function Pine({ x, y, s = 1, star = false, baubles = false }: At & { star?: boolean; baubles?: boolean }) {
  return (
    <g transform={place({ x, y, s })}>
      <SnowShadow cx={22} cy={2} rx={46} ry={8} />
      <rect x={-7} y={-26} width={14} height={28} rx={2} fill={C.timber} {...line} />
      <path d="M0 -180 L44 -112 L28 -114 L62 -60 L40 -62 L76 -18 L-76 -18 L-40 -62 L-62 -60 L-28 -114 L-44 -112 Z" fill={C.evergreen} {...line} />
      {/* light side (upper left) */}
      <path d="M0 -172 L-38 -114 L-24 -112 L-56 -62 L-36 -60 L-68 -22 L-40 -22 L-12 -70 L-26 -70 L-4 -118 L-16 -118 Z" fill={C.evergreenSoft} />
      {/* snow on the boughs */}
      <path d="M-30 -112c10 4 22 4 32 0 10 4 20 4 28 0M-46 -60c14 5 30 5 44 0 14 5 30 5 42 0M-60 -18c18 6 40 6 60 0 18 6 40 6 58 0" fill="none" stroke={C.snow} strokeWidth={5} strokeLinecap="round" />
      {baubles && (
        <g {...thin}>
          <circle cx={-18} cy={-84} r={6} fill={C.cranberry} />
          <circle cx={22} cy={-44} r={6} fill={C.golden} />
          <circle cx={-34} cy={-36} r={6} fill={C.golden} />
          <circle cx={10} cy={-130} r={5} fill={C.cranberry} />
          <circle cx={38} cy={-86} r={5} fill={C.paper} />
        </g>
      )}
      {star && <path d="M0 -206l7 14 15 2-11 10 3 15-14-8-14 8 3-15-11-10 15-2z" fill={C.golden} {...line} />}
    </g>
  );
}

/* ───────── Characters ───────── */

/** Santa, lifting a parcel up into the sleigh. Faces right. */
export function Santa({ x, y, s = 1, flip }: At) {
  return (
    <g transform={place({ x, y, s, flip })}>
      <SnowShadow cx={30} cy={0} rx={58} ry={9} />
      {/* boots */}
      <path d="M-22 -16h20v14h-28c0-8 3-14 8-14z" fill={C.ink} {...line} />
      <path d="M8 -16h20c5 0 9 6 9 14H8z" fill={C.ink} {...line} />
      {/* coat */}
      <path d="M-34 -70c-6 18-8 36-8 56h82c0-20-2-38-8-56-10-16-56-16-66 0z" fill={C.cranberry} {...line} />
      <path d="M-30 -66c-4 14-6 30-6 50h18c0-18 2-34 6-48z" fill="#C9485D" />
      <path d="M-42 -20h82v10h-82z" fill={C.snow} {...line} />
      <path d="M-1 -78v58" fill="none" {...thin} />
      {/* belt */}
      <path d="M-38 -44h76v11h-76z" fill={C.ink} {...line} />
      <rect x={-8} y={-47} width={16} height={17} rx={3} fill={C.golden} {...line} />
      {/* arms up, holding a parcel */}
      <path d="M-26 -72c-6-16-4-34 4-50l12 4c-6 12-7 26-2 40z" fill={C.cranberry} {...line} />
      <path d="M26 -72c10-14 14-30 12-48l-12-1c1 14-2 28-10 40z" fill={C.cranberry} {...line} />
      <g transform="rotate(-8 6 -140)">
        <rect x={-26} y={-168} width={62} height={42} rx={4} fill={C.golden} {...line} />
        <rect x={0} y={-168} width={10} height={42} fill={C.cranberry} {...thin} />
        <path d="M5 -168c-10-14-22-8-16 0M5 -168c10-14 22-8 16 0" fill={C.cranberry} {...thin} />
      </g>
      <circle cx={-20} cy={-124} r={7} fill={C.snow} {...line} />
      <circle cx={34} cy={-124} r={7} fill={C.snow} {...line} />
      {/* head */}
      <circle cx={2} cy={-92} r={20} fill={C.skin} {...line} />
      <path d="M-18 -92c0 20 8 34 20 36 12-2 20-16 20-36-6 8-12 10-20 10s-14-2-20-10z" fill={C.snow} {...line} />
      <path d="M-6 -84c4 3 12 3 16 0" fill="none" {...thin} />
      <circle cx={-5} cy={-96} r={2.4} fill={C.ink} />
      <circle cx={10} cy={-96} r={2.4} fill={C.ink} />
      <circle cx={2} cy={-89} r={3.6} fill={C.skinShade} />
      {/* hat, flopping back */}
      <path d="M-20 -104c2-22 22-34 44-26 10 4 16 12 22 22-10-4-18-2-22 6z" fill={C.cranberry} {...line} />
      <path d="M-22 -110c14-6 30-6 46 0v9c-16-5-32-5-46 0z" fill={C.snow} {...line} />
      <circle cx={48} cy={-104} r={7} fill={C.snow} {...line} />
    </g>
  );
}

/** An elf crossing the square with a stack of letters. Faces right, mid-stride. */
export function ElfCourier({ x, y, s = 1, flip }: At) {
  return (
    <g transform={place({ x, y, s, flip })}>
      <SnowShadow cx={18} cy={0} rx={40} ry={7} />
      {/* legs mid-stride */}
      <path d="M-6 -30l-12 24M8 -30l10 22" fill="none" {...line} />
      <path d="M-16 -8h-14c-5 0-8-3-8-7 3 2 5 1 6-1l16 1z" fill={C.cranberry} {...line} />
      <path d="M18 -10h14c5 0 8-3 9-7-3 2-5 1-6-1l-17 1z" fill={C.cranberry} {...line} />
      {/* tunic */}
      <path d="M-18 -72c-4 14-6 28-8 44h50c-2-16-4-30-8-44z" fill={C.evergreen} {...line} />
      <path d="M-16 -68c-3 12-5 24-6 38h10c1-12 3-24 6-36z" fill={C.evergreenSoft} />
      <path d="M-24 -42h46v7h-46z" fill={C.ink} {...line} />
      <rect x={-4} y={-44} width={9} height={11} rx={2} fill={C.golden} {...thin} />
      {/* satchel strap + bag */}
      <path d="M-14 -72l30 34" fill="none" {...line} />
      <path d="M8 -44h22l-2 20h-18z" fill={C.timber} {...line} />
      {/* letters held out front */}
      <g transform="rotate(-10 34 -64)">
        <rect x={20} y={-78} width={34} height={22} rx={2} fill={C.paper} {...line} />
        <path d="M20 -78l17 12 17-12" fill="none" {...thin} />
        <rect x={24} y={-88} width={34} height={22} rx={2} fill={C.snow} {...line} />
        <path d="M24 -88l17 12 17-12" fill="none" {...thin} />
        <circle cx={41} cy={-76} r={3.5} fill={C.cranberry} />
      </g>
      <path d="M12 -68c8 2 14 4 18 0" fill="none" {...line} />
      <circle cx={30} cy={-68} r={4.5} fill={C.skin} {...thin} />
      {/* collar */}
      <path d="M-18 -74l6 9 5-7 5 9 5-9 5 7 6-9z" fill={C.snow} {...thin} />
      {/* ears + head */}
      <path d="M-18 -94c-7-2-12-7-16-11 1 10 6 20 16 24z" fill={C.skin} {...line} />
      <path d="M20 -94c7-2 12-7 16-11-1 10-6 20-16 24z" fill={C.skin} {...line} />
      <circle cx={1} cy={-92} r={19} fill={C.skin} {...line} />
      <ellipse cx={-5} cy={-93} rx={2} ry={2.6} fill={C.ink} />
      <ellipse cx={9} cy={-93} rx={2} ry={2.6} fill={C.ink} />
      <circle cx={-10} cy={-86} r={3.4} fill={C.cranberry} opacity={0.3} />
      <circle cx={14} cy={-86} r={3.4} fill={C.cranberry} opacity={0.3} />
      <path d="M-2 -84q4 4 8 0" fill="none" {...thin} />
      {/* hat */}
      <path d="M-20 -102c2-18 14-30 32-36 8-2 16-3 20 1-8 3-14 10-14 18 0 6 1 12 2 17z" fill={C.evergreen} {...line} />
      <path d="M-22 -105c14-4 28-4 42 0v8c-14-4-28-4-42 0z" fill={C.cranberry} {...line} />
      <circle cx={33} cy={-136} r={4.5} fill={C.golden} {...line} />
    </g>
  );
}

/** Santa's sleigh, loaded with parcels. Faces right. */
export function Sleigh({ x, y, s = 1, flip }: At) {
  return (
    <g transform={place({ x, y, s, flip })}>
      <SnowShadow cx={40} cy={2} rx={130} ry={12} />
      {/* runners */}
      <path d="M-104 -6h196c22 0 30-18 22-30" fill="none" stroke={C.goldenDeep} strokeWidth={7} strokeLinecap="round" />
      <path d="M-104 -6h196c22 0 30-18 22-30" fill="none" {...thin} />
      <path d="M-70 -6v-22M50 -6v-22" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      {/* parcels piled in the back */}
      <rect x={-92} y={-128} width={50} height={46} rx={4} fill={C.evergreen} {...line} />
      <rect x={-72} y={-128} width={9} height={46} fill={C.golden} {...thin} />
      <rect x={-46} y={-146} width={44} height={64} rx={4} fill={C.paper} {...line} />
      <rect x={-46} y={-118} width={44} height={9} fill={C.cranberry} {...thin} />
      <rect x={-28} y={-146} width={9} height={64} fill={C.cranberry} {...thin} />
      <path d="M-24 -146c-8-12-20-6-14 0M-24 -146c8-12 20-6 14 0" fill={C.cranberry} {...thin} />
      <rect x={-4} y={-112} width={40} height={30} rx={4} fill={C.golden} {...line} />
      <rect x={12} y={-112} width={8} height={30} fill={C.evergreen} {...thin} />
      {/* body */}
      <path d="M-108 -28c-6-30-4-56 4-74 6 4 10 12 10 22v30h132c10 0 18-6 22-16 10 2 16 10 16 22 0 10-8 16-20 16z" fill={C.cranberry} {...line} />
      <path d="M-102 -94c-4 18-4 40 0 60h8v-46c0-6-4-12-8-14z" fill="#C9485D" />
      <path d="M-94 -48h132c10 0 18-6 22-16" fill="none" stroke={C.golden} strokeWidth={5} strokeLinecap="round" />
      <path d="M-108 -104c4-8 14-8 16 2" fill="none" stroke={C.golden} strokeWidth={5} strokeLinecap="round" />
      {/* snow resting on the front curl */}
      <path d="M72 -66c4-6 14-8 20-2 2 4-2 6-6 6h-12c-3 0-4-2-2-4z" fill={C.snow} {...thin} />
    </g>
  );
}

/* ───────── Buildings ───────── */

type BuildingProps = At & { lit?: boolean };

/** A plain village cottage for the backdrop. */
export function Cottage({ x, y, s = 1, flip, wall = C.paper, roof = C.cranberry, chimneyTilt = -5 }: At & { wall?: string; roof?: string; chimneyTilt?: number }) {
  return (
    <g transform={place({ x, y, s, flip })}>
      <SnowShadow cx={30} cy={0} rx={86} ry={10} />
      <g transform={`rotate(${chimneyTilt} 38 -128)`}>
        <rect x={28} y={-146} width={20} height={38} fill={C.timber} {...line} />
        <rect x={24} y={-152} width={28} height={10} rx={3} fill={C.snow} {...line} />
      </g>
      <rect x={-62} y={-92} width={124} height={92} fill={wall} {...line} />
      <rect x={30} y={-92} width={32} height={92} fill={C.ink} opacity={0.07} />
      <path d="M-76 -86L0 -150L76 -86z" fill={roof} {...line} />
      <path d="M-82 -84c6-6 12-10 18-14L0 -152l64 54c6 4 12 8 18 14-10 6-20 4-30-2-10 6-24 6-34 0-10 6-26 6-36 0-10 6-26 6-36 0-10 6-26 6-36 0-12 6-22 6-30-2z" fill={C.snow} {...line} />
      <rect x={-44} y={-64} width={28} height={26} rx={3} className="building-window" fill={C.golden} {...line} />
      <path d="M-30 -64v26M-44 -51h28" fill="none" {...thin} />
      <path d="M16 0v-46a14 14 0 0 1 28 0V0z" fill={C.evergreen} {...line} />
    </g>
  );
}

/** The Workshop: wide timber-and-plaster front, green arched door with a brass bell. */
export function Workshop({ x, y, s = 1 }: BuildingProps) {
  return (
    <g transform={place({ x, y, s })}>
      <SnowShadow cx={50} cy={2} rx={210} ry={16} />
      {/* crooked chimney with a puff of smoke */}
      <g transform="rotate(6 110 -268)">
        <rect x={96} y={-296} width={30} height={64} fill={C.timber} {...line} />
        <rect x={90} y={-304} width={42} height={14} rx={4} fill={C.snow} {...line} />
      </g>
      <path d="M118 -318c-10-6-6-20 6-18 2-12 20-12 22 0 12-2 16 14 6 18z" fill={C.snow} {...thin} opacity={0.95} />
      {/* walls */}
      <rect x={-170} y={-176} width={340} height={176} fill={C.paper} {...line} />
      <rect x={110} y={-176} width={60} height={176} fill={C.ink} opacity={0.07} />
      {/* timber frame */}
      <path d="M-170 -120h340M-110 -176v176M110 -176v176" fill="none" stroke={C.timber} strokeWidth={9} />
      <path d="M-170 -120h340M-110 -176v176M110 -176v176" fill="none" {...thin} />
      {/* roof */}
      <path d="M-196 -168L0 -282L196 -168z" fill={C.cranberry} {...line} />
      <path d="M-180 -170L0 -274" fill="none" stroke="#C9485D" strokeWidth={10} strokeLinecap="round" />
      <path d="M-206 -164c8-8 18-14 28-18L0 -286l178 104c10 4 20 10 28 18-14 8-28 6-40-2-14 8-32 8-46 0-14 8-32 8-46 0-14 8-32 8-46 0-14 8-32 8-46 0-14 8-32 8-46 0-14 8-32 8-46 0-12 8-28 8-42-2-12 8-24 8-36 2z" fill={C.snow} {...line} />
      {/* round attic window */}
      <circle cx={0} cy={-212} r={20} className="building-window" fill={C.golden} {...line} />
      <path d="M0 -232v40M-20 -212h40" fill="none" {...thin} />
      {/* big workshop windows */}
      {[-150, 126].map((wx) => (
        <g key={wx}>
          <rect x={wx} y={-100} width={-wx > 0 ? 28 : 28} height={64} rx={3} className="building-window" fill={C.golden} {...line} />
        </g>
      ))}
      <rect x={-96} y={-104} width={58} height={70} rx={4} className="building-window" fill={C.golden} {...line} />
      <path d="M-67 -104v70M-96 -69h58" fill="none" {...thin} />
      <rect x={42} y={-104} width={58} height={70} rx={4} className="building-window" fill={C.golden} {...line} />
      <path d="M71 -104v70M42 -69h58" fill="none" {...thin} />
      <path d="M-100 -34h66M38 -34h66" fill="none" stroke={C.snow} strokeWidth={6} strokeLinecap="round" />
      {/* the green arched door */}
      <path d="M-30 0v-78a30 30 0 0 1 60 0V0z" fill={C.evergreenDeep} {...line} />
      <g className="building-door">
        <path d="M-26 0v-76a26 26 0 0 1 52 0V0z" fill={C.evergreen} {...line} />
        <path d="M-14 -8v-62M0 -8v-74M14 -8v-62" fill="none" stroke={C.evergreenSoft} strokeWidth={4} />
        <circle cx={16} cy={-36} r={3.5} fill={C.golden} {...thin} />
      </g>
      {/* brass bell */}
      <path d="M40 -112v10" fill="none" {...thin} />
      <path d="M30 -84c0-12 4-18 10-18s10 6 10 18z" fill={C.golden} {...line} />
      <circle cx={40} cy={-82} r={3} fill={C.goldenDeep} {...thin} />
      {/* step */}
      <rect x={-40} y={-4} width={80} height={8} rx={3} fill={C.snow} {...line} />
    </g>
  );
}

/** The Post Office: evergreen front, cranberry door with a brass mail slot, a lamp. */
export function PostOffice({ x, y, s = 1 }: BuildingProps) {
  return (
    <g transform={place({ x, y, s })}>
      <SnowShadow cx={44} cy={2} rx={170} ry={14} />
      <g transform="rotate(-5 -90 -250)">
        <rect x={-106} y={-262} width={26} height={52} fill={C.timber} {...line} />
        <rect x={-112} y={-270} width={38} height={12} rx={4} fill={C.snow} {...line} />
      </g>
      <rect x={-140} y={-196} width={280} height={196} fill={C.evergreen} {...line} />
      <rect x={-140} y={-196} width={60} height={196} fill={C.evergreenSoft} opacity={0.55} />
      <rect x={90} y={-196} width={50} height={196} fill={C.ink} opacity={0.12} />
      {/* stepped roof */}
      <path d="M-156 -190h312l-30 -46h-252z" fill={C.cranberry} {...line} />
      <path d="M-166 -186c6-6 14-10 22-10h288c8 0 16 4 22 10-10 8-24 8-36 0-12 8-28 8-40 0-12 8-28 8-40 0-12 8-28 8-40 0-12 8-28 8-40 0-12 8-28 8-40 0-12 8-28 8-40 0-12 8-24 6-36-2z" fill={C.snow} {...line} />
      <path d="M-126 -238c4-6 10-10 18-10h216c8 0 14 4 18 10-8 6-20 6-30 0-10 6-24 6-34 0-10 6-24 6-34 0-10 6-24 6-34 0-10 6-24 6-34 0-10 6-24 6-34 0-10 6-22 6-32-2z" fill={C.snow} {...thin} />
      {/* windows */}
      <rect x={-118} y={-150} width={60} height={72} rx={4} className="building-window" fill={C.golden} {...line} />
      <path d="M-88 -150v72M-118 -114h60" fill="none" {...thin} />
      <rect x={58} y={-150} width={60} height={72} rx={4} className="building-window" fill={C.golden} {...line} />
      <path d="M88 -150v72M58 -114h60" fill="none" {...thin} />
      {/* letters on the windowsill */}
      <rect x={-112} y={-90} width={22} height={14} rx={1} fill={C.paper} {...thin} />
      <rect x={-96} y={-94} width={22} height={14} rx={1} fill={C.snow} {...thin} />
      {/* door */}
      <rect x={-32} y={-104} width={64} height={104} rx={4} fill={C.cranberryDeep} {...line} />
      <g className="building-door">
        <rect x={-28} y={-100} width={56} height={100} rx={3} fill={C.cranberry} {...line} />
        <rect x={-16} y={-60} width={32} height={8} rx={2} fill={C.golden} {...line} />
        <circle cx={18} cy={-34} r={3.5} fill={C.golden} {...thin} />
      </g>
      {/* lamp */}
      <path d="M52 -170h18v14" fill="none" {...line} />
      <path d="M62 -156h16l-3 18h-10z" fill={C.golden} {...line} />
      {/* post box */}
      <rect x={112} y={-58} width={34} height={58} rx={10} fill={C.cranberry} {...line} />
      <rect x={118} y={-44} width={22} height={5} rx={2} fill={C.ink} />
      <path d="M110 -54c4-8 10-12 18-12s14 4 18 12" fill={C.snow} {...thin} />
      <rect x={-44} y={-4} width={88} height={8} rx={3} fill={C.snow} {...line} />
    </g>
  );
}

/** The Gift House: cranberry front with a big ribbon bow on the roof and a golden door. */
export function GiftHouse({ x, y, s = 1 }: BuildingProps) {
  return (
    <g transform={place({ x, y, s })}>
      <SnowShadow cx={40} cy={2} rx={150} ry={13} />
      <rect x={-120} y={-170} width={240} height={170} fill={C.cranberry} {...line} />
      <rect x={70} y={-170} width={50} height={170} fill={C.ink} opacity={0.12} />
      {/* ribbon around the house */}
      <rect x={-14} y={-170} width={28} height={66} fill={C.golden} {...line} />
      <path d="M-160 -164L0 -250L160 -164z" fill={C.evergreen} {...line} />
      <path d="M-168 -160c8-8 16-12 24-14L0 -254l144 80c8 2 16 6 24 14-12 8-26 6-38-2-12 8-28 8-40 0-12 8-28 8-40 0-12 8-28 8-40 0-12 8-28 8-40 0-12 8-28 8-40 0-12 8-28 8-40 0-10 8-24 8-36-2z" fill={C.snow} {...line} />
      {/* bow */}
      <path d="M0 -252c-30-30-62-14-46 6 10 10 30 8 46-6zM0 -252c30-30 62-14 46 6-10 10-30 8-46-6z" fill={C.golden} {...line} />
      <circle cx={0} cy={-252} r={9} fill={C.goldenDeep} {...line} />
      <rect x={-96} y={-130} width={52} height={60} rx={26} className="building-window" fill={C.golden} {...line} />
      <path d="M-70 -130v60" fill="none" {...thin} />
      <rect x={44} y={-130} width={52} height={60} rx={26} className="building-window" fill={C.golden} {...line} />
      <path d="M70 -130v60" fill="none" {...thin} />
      <rect x={-30} y={-96} width={60} height={96} rx={4} fill={C.goldenDeep} {...line} />
      <g className="building-door">
        <rect x={-26} y={-92} width={52} height={92} rx={3} fill={C.golden} {...line} />
        <path d="M-26 -46h52" fill="none" {...thin} />
        <circle cx={16} cy={-40} r={3.5} fill={C.timber} {...thin} />
      </g>
      <rect x={-40} y={-4} width={80} height={8} rx={3} fill={C.snow} {...line} />
    </g>
  );
}

/** A post-box on a stake, its flag up and a letter peeking out. For the participant's own envelope. */
export function Mailbox({ x, y, s = 1, flagUp = true }: At & { flagUp?: boolean }) {
  return (
    <g transform={place({ x, y, s })}>
      <SnowShadow cx={16} cy={1} rx={34} ry={5} />
      <rect x={-5} y={-78} width={10} height={78} fill={C.timber} {...line} />
      <path d="M-34 -78v-30a22 22 0 0 1 22-22h44a22 22 0 0 1 22 22v30z" fill={C.cranberry} {...line} />
      <path d="M-30 -116a20 20 0 0 1 16-12" fill="none" stroke="#C9485D" strokeWidth={5} strokeLinecap="round" />
      <path d="M-36 -126c8-10 26-12 44-10 12 1 22 4 28 10-8 4-18 4-26 0-10 4-24 4-34 0-4 3-8 2-12 0z" fill={C.snow} {...line} />
      <rect x={-22} y={-104} width={30} height={18} rx={2} fill={C.paper} {...line} transform="rotate(-12 -7 -95)" />
      <path d="M-22 -104l15 10 15-10" fill="none" {...thin} transform="rotate(-12 -7 -95)" />
      {flagUp ? (
        <path d="M34 -84v-44h20v14H38" fill={C.golden} {...line} />
      ) : (
        <path d="M34 -84h40v-12H38" fill={C.golden} {...line} />
      )}
    </g>
  );
}

/** A lamp post with a golden lantern. */
export function LampPost({ x, y, s = 1 }: At) {
  return (
    <g transform={place({ x, y, s })}>
      <SnowShadow cx={14} cy={1} rx={22} ry={4} />
      <path d="M0 0v-120" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
      <path d="M-12 -120h24l-4 -26h-16z" fill={C.golden} {...line} />
      <path d="M-15 -146h30l-15 -12z" fill={C.ink} {...line} />
      <path d="M-14 -150c4-4 24-4 28 0" fill="none" stroke={C.snow} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

/** Footprints along a path, for small discoveries. */
export function Footprints({ points }: { points: [number, number][] }) {
  return (
    <g fill={C.snowShadow}>
      {points.map(([px, py], i) => (
        <ellipse key={i} cx={px} cy={py} rx={4} ry={2.4} transform={`rotate(${i % 2 ? 12 : -12} ${px} ${py})`} />
      ))}
    </g>
  );
}
