import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface CTASceneProps {
  accentColor: string;
}

export const CTAScene = React.memo<CTASceneProps>(({ accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ fps, frame, config: { damping: 200, stiffness: 100 } });

  const buttonPulse = interpolate(
    frame,
    [30, 38, 46],
    [1, 1.03, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: 72,
            color: '#ffffff',
            margin: '0 0 40px 0',
          }}
        >
          Get Started Today
        </h2>
        <div
          style={{
            display: 'inline-block',
            backgroundColor: accentColor,
            padding: '20px 60px',
            borderRadius: 8,
            transform: `scale(${buttonPulse})`,
          }}
        >
          <span
            style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: 36,
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            Learn More
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
});
