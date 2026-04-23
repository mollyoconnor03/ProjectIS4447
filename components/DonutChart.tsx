import { Palette } from '@/constants/theme';
import Svg, { Circle, Path } from 'react-native-svg';

type Segment = { name: string; color: string; count: number };

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function DonutChart({ data }: { data: Segment[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  const cx = 70, cy = 70, outerR = 60, innerR = 38;
  let angle = -90;

  const paths = data.map(seg => {
    const sweep = (seg.count / total) * 360;
    const gap = data.length > 1 ? 1.5 : 0;
    const start = polarToCartesian(cx, cy, outerR, angle + gap);
    const end = polarToCartesian(cx, cy, outerR, angle + sweep - gap);
    const iStart = polarToCartesian(cx, cy, innerR, angle + sweep - gap);
    const iEnd = polarToCartesian(cx, cy, innerR, angle + gap);
    const large = sweep > 180 ? 1 : 0;
    const d = `M${start.x} ${start.y} A${outerR} ${outerR} 0 ${large} 1 ${end.x} ${end.y} L${iStart.x} ${iStart.y} A${innerR} ${innerR} 0 ${large} 0 ${iEnd.x} ${iEnd.y} Z`;
    angle += sweep;
    return { d, color: seg.color };
  });

  return (
    <Svg width={140} height={140}>
      {paths.map((p, i) => <Path key={i} d={p.d} fill={p.color} />)}
      <Circle cx={cx} cy={cy} r={innerR - 1} fill={Palette.background} />
    </Svg>
  );
}
