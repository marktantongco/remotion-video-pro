import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  random,
  staticFile,
  OffthreadVideo,
} from 'remotion';
import type { VideoProps } from './index';

export const MainVideo: React.FC<VideoProps> = React.memo(({ title, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = spring({
    fps,
    frame,
    config: { damping: 200, stiffness: 100 },
  });

  const randomX = useMemo(() => random('seed-42') * 100, []);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <OffthreadVideo
        src={staticFile('videos/intro.mp4')}
        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }}
      />
      <h1
        style={{
          opacity,
          transform: `scale(${scale}) translateX(${randomX}px)`,
          color: accentColor,
          fontFamily: 'Oswald, sans-serif',
          fontSize: 120,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {title}
      </h1>
    </AbsoluteFill>
  );
});
