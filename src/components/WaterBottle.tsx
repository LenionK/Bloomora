import { View } from 'react-native';
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

const BOTTLE_PATH =
  'M36 30 L64 30 L64 46 Q86 58 86 82 L86 182 Q86 194 74 194 L26 194 Q14 194 14 182 L14 82 Q14 58 36 46 Z';
const BOTTOM = 194;
// Water stops at the shoulder: the neck stays empty even when the goal is reached.
const FULL_LEVEL = 64;

type Props = {
  // From 0 to 1.
  share: number;
  height: number;
};

export default function WaterBottle({ share, height }: Props) {
  const waterTop = BOTTOM - share * (BOTTOM - FULL_LEVEL);

  return (
    <View
      accessibilityLabel={`Bottle ${Math.round(share * 100)}% full`}
      accessible
    >
      <Svg height={height} viewBox="0 0 100 200" width={height / 2}>
        <Defs>
          <ClipPath id="bottleShape">
            <Path d={BOTTLE_PATH} />
          </ClipPath>
        </Defs>
        <Path d={BOTTLE_PATH} fill={colors.waterSoft} />
        <Rect
          clipPath="url(#bottleShape)"
          fill={colors.water}
          height={BOTTOM - waterTop}
          width={100}
          x={0}
          y={waterTop}
        />
        <Path
          d={BOTTLE_PATH}
          fill="none"
          stroke={colors.water}
          strokeLinejoin="round"
          strokeWidth={3}
        />
        <Rect fill={colors.water} height={14} rx={4} width={36} x={32} y={16} />
      </Svg>
    </View>
  );
}
