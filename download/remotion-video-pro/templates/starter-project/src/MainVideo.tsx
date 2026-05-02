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
import { TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import type { VideoProps } from './Root';
import { HookScene } from './scenes/HookScene';
import { ContentScene } from './scenes/ContentScene';
import { CTAScene } from './scenes/CTAScene';

export const MainVideo = React.memo<VideoProps>(({ title, accentColor }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <HookScene headline={title} accentColor={accentColor} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} />
        <TransitionSeries.Sequence durationInFrames={720}>
          <ContentScene title={title} accentColor={accentColor} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} />
        <TransitionSeries.Sequence durationInFrames={90}>
          <CTAScene accentColor={accentColor} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
});
