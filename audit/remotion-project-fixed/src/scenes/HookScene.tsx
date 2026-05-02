import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface HookSceneProps {
  headline: string;
}

export const HookScene = React.memo<HookSceneProps>(({ headline }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
      <h1 style={{ opacity, color: '#fff', fontFamily: 'Oswald, sans-serif', fontSize: 140 }}>
        {headline}
      </h1>
    </AbsoluteFill>
  );
});
