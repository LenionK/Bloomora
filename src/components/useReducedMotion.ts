import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// True when the phone asks for less motion. Animations then change at once,
// and the ambient waves, bubbles and confetti stay still.
export function useReducedMotion(): boolean {
  const [isReduced, setIsReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setIsReduced)
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduced,
    );

    return () => subscription.remove();
  }, []);

  return isReduced;
}
