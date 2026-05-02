import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface HookSceneProps {
  headline: string;
  accentColor: string;
}

export const HookScene = React.memo<HookSceneProps>(({ headline, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ fps, frame, config: { damping: 200, stiffness: 100 } });
  const translateY = interpolate(frame, [0, 20], [30, 0], {
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      <h1
        style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: 140,
          color: accentColor,
          opacity,
          transform: `scale(${scale}) translateY(${translateY}px)`,
          textAlign: 'center',
          lineHeight: 1.1,
          margin: 0,
        }}
      >
        {headline}
      </h1>
    </AbsoluteFill>
  );
});
