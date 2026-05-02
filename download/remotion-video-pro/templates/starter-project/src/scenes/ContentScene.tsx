import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface ContentSceneProps {
  title: string;
  accentColor: string;
}

const BULLET_POINTS = [
  'Frame-based animation engine',
  'React components as building blocks',
  'Programmatic video at scale',
];

export const ContentScene = React.memo<ContentSceneProps>(({ title, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f0f0f',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '80px 120px',
      }}
    >
      <h2
        style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: 60,
          color: '#ffffff',
          opacity: titleOpacity,
          marginBottom: 60,
        }}
      >
        {title}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {BULLET_POINTS.map((point, i) => {
          const itemFrame = frame - (i * 15);
          if (itemFrame < 0) return null;

          const opacity = interpolate(itemFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
          const translateY = interpolate(itemFrame, [0, 15], [20, 0], {
            extrapolateRight: 'clamp',
            easing: (t) => 1 - Math.pow(1 - t, 3),
          });

          const barScale = spring({
            fps,
            frame: itemFrame,
            config: { damping: 200, stiffness: 200 },
          });

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 48,
                  backgroundColor: accentColor,
                  borderRadius: 4,
                  transform: `scaleY(${barScale})`,
                  transformOrigin: 'bottom',
                }}
              />
              <span
                style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: 40,
                  color: '#cccccc',
                }}
              >
                {point}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
});
