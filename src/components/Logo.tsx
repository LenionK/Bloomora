import Svg, { Circle, ClipPath, Defs, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

const PETALS = 8;
const PETAL_PATH =
  'M0 0 C-16 -10 -18 -34 -6 -44 L0 -36 L6 -44 C18 -34 16 -10 0 0 Z';

type Props = {
  size: number;
  color: string;
  detailColor?: string;
};

export default function Logo({
  size,
  color,
  detailColor = colors.surface,
}: Props) {
  const petalStyle = {
    d: PETAL_PATH,
    fill: color,
    stroke: detailColor,
    strokeWidth: 2,
  };

  return (
    <Svg height={size} viewBox="-50 -50 100 100" width={size}>
      <Defs>
        <ClipPath id="firstPetalLeftHalf">
          <Rect height={100} width={50} x={-50} y={-50} />
        </ClipPath>
      </Defs>
      {Array.from({ length: PETALS }, (_, index) => (
        <Path
          {...petalStyle}
          key={index}
          transform={`rotate(${(index * 360) / PETALS})`}
        />
      ))}
      {/* Each petal covers the previous one, so the first must also cover the last. */}
      <Path {...petalStyle} clipPath="url(#firstPetalLeftHalf)" />
      <Circle fill={detailColor} r={7} />
    </Svg>
  );
}
