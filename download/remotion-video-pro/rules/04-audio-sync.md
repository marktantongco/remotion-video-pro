# Audio, Voiceover & Captions

## ElevenLabs Integration

For AI-generated voiceovers, use the official `@remotion/elevenlabs` package:

```bash
npm install @remotion/elevenlabs
```

```tsx
import { TextToSpeech, elevenLabsTranscriptToCaptions } from '@remotion/elevenlabs';

const { audioBuffer, transcript } = await TextToSpeech({
  text: "Welcome to the future of video.",
  voiceId: 'YOUR_VOICE_ID',
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Convert transcript to caption data structure
const captions = elevenLabsTranscriptToCaptions(transcript);
```

## Caption Component with Word-Level Highlighting

Word-by-word karaoke captions dramatically increase retention on short-form video. Each word highlights as it is spoken, guiding the viewer's eye through the text.

```tsx
import React from 'react';
import { useCurrentFrame, AbsoluteFill } from 'remotion';

interface Caption {
  text: string;
  startInSeconds: number;
  endInSeconds: number;
}

interface CaptionsProps {
  captions: Caption[];
  fps: number;
}

export const WordHighlightCaptions = React.memo<CaptionsProps>(({ captions, fps }) => {
  const frame = useCurrentFrame();
  const currentTime = frame / fps;

  return (
    <AbsoluteFill style={{
      bottom: 100,
      height: 'auto',
      justifyContent: 'center',
      alignItems: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '20px 40px',
        borderRadius: 12,
        maxWidth: '80%',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: 'center',
      }}>
        {captions.map((caption, i) => {
          const isActive = currentTime >= caption.startInSeconds && currentTime <= caption.endInSeconds;
          const isPast = currentTime > caption.endInSeconds;

          return (
            <span key={i} style={{
              color: isActive ? '#ffffff' : isPast ? '#666666' : '#999999',
              fontWeight: isActive ? 700 : 400,
              fontSize: 48,
              fontFamily: 'Oswald, sans-serif',
            }}>
              {caption.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
});
```

## Audio Playback

```tsx
import { Audio } from 'remotion';
import { staticFile } from 'remotion';

<Audio
  src={staticFile('voiceover.mp3')}
  volume={0.8}
  trimBefore={0}
  trimAfter={900}
/>
```

For background music layered with voiceover:

```tsx
<AbsoluteFill>
  <Audio src={staticFile('voiceover.mp3')} volume={1.0} />
  <Audio src={staticFile('background-music.mp3')} volume={0.15} />
  {/* Video content here */}
</AbsoluteFill>
```

## Audio Visualization (Spectrum/Waveform)

Visualize audio frequencies in real-time using `@remotion/media-utils`:

```bash
npm install @remotion/media-utils
```

```tsx
import React from 'react';
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const AudioSpectrum = React.memo<{ src: string }>(({ src }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(src));

  if (!audioData) return null;

  const visualization = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 16,
    audioStartTime: 0,
  });

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 200 }}>
      {visualization.map((v, i) => (
        <div key={i} style={{
          width: 20,
          height: `${v * 200}px`,
          backgroundColor: '#00ff88',
          borderRadius: 4,
        }} />
      ))}
    </div>
  );
});
```

## Beat Synchronization

For music-driven visuals, derive all animation timing from BPM:

```tsx
const bpm = 128;
const framesPerBeat = (fps * 60) / bpm; // ~14 frames at 30fps
const beatIndex = Math.floor(frame / framesPerBeat);
const pulse = spring({
  fps,
  frame: frame % framesPerBeat,
  config: { damping: 20 },
});
```

Drive visual changes on every Nth beat:

```tsx
const beatIndex = Math.floor(frame / framesPerBeat);
const isDownbeat = beatIndex % 4 === 0;
const beatPulse = isDownbeat ? spring({ fps, frame: frame % framesPerBeat, config: { damping: 15 } }) : 1;
```

## Getting Audio Duration

Use `getAudioDurationInSeconds` to derive video duration from audio length:

```tsx
import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { staticFile } from 'remotion';

// In calculateMetadata:
const duration = await getAudioDurationInSeconds(staticFile('voice.mp3'));
const durationInFrames = Math.ceil(duration * fps) + 15; // +15 frames for end padding
```

## OffthreadVideo for Input Video

Always use `OffthreadVideo` for any MP4 input to prevent frame drops during rendering:

```tsx
import { OffthreadVideo } from 'remotion';

<OffthreadVideo
  src={staticFile('background.mp4')}
  startFrom={0}
  endAt={300}
  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
/>
```

Never use `<Video>` for input MP4s in production renders. `<Video>` renders on the main thread and causes stutter in headless Chromium.
