# Audio, Voiceover & Captions

## ElevenLabs Integration

Official package: `@remotion/elevenlabs`

```tsx
import { TextToSpeech, elevenLabsTranscriptToCaptions } from '@remotion/elevenlabs';

const { audioBuffer, transcript } = await TextToSpeech({
  text: "Welcome to the future of video.",
  voiceId: '...',
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const captions = elevenLabsTranscriptToCaptions(transcript);
```

## Caption Component with Word-Level Highlighting

```tsx
import { useCurrentFrame, interpolate, AbsoluteFill } from 'remotion';

interface Caption {
  text: string;
  startInSeconds: number;
  endInSeconds: number;
}

interface CaptionsProps {
  captions: Caption[];
  fps: number;
}

export const WordHighlightCaptions: React.FC<CaptionsProps> = React.memo(({ captions, fps }) => {
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
        backgroundColor: 'rgba(0,0,0,0.6)', 
        padding: '20px 40px',
        borderRadius: 12,
        maxWidth: '80%',
      }}>
        {captions.map((caption, i) => {
          const isActive = currentTime >= caption.startInSeconds && currentTime <= caption.endInSeconds;
          const isPast = currentTime > caption.endInSeconds;

          return (
            <span key={i} style={{ 
              color: isActive ? '#fff' : isPast ? '#666' : '#999',
              fontWeight: isActive ? 700 : 400,
              fontSize: 48,
              fontFamily: 'Oswald, sans-serif',
              marginRight: 16,
              transition: 'none',
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

## Audio Tag Usage

```tsx
import { Audio } from '@remotion/media';
import { staticFile } from 'remotion';

<Audio 
  src={staticFile('voiceover.mp3')} 
  volume={0.8}
  trimBefore={0}
  trimAfter={900}
/>
```

## Audio Visualization (Spectrum/Waveform)

```tsx
import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const AudioSpectrum: React.FC<{ src: string }> = React.memo(({ src }) => {
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

For music-driven visuals:
1. Get BPM of track
2. Calculate frames per beat: `fps * 60 / BPM`
3. Drive animations off beat multiples

```tsx
const bpm = 128;
const framesPerBeat = (fps * 60) / bpm;
const beatIndex = Math.floor(frame / framesPerBeat);
const pulse = spring({ 
  fps, 
  frame: frame % framesPerBeat, 
  config: { damping: 20 } 
});
```

## OffthreadVideo for Input Video

Always use `OffthreadVideo` for MP4 inputs to prevent stutter:

```tsx
import { OffthreadVideo } from 'remotion';

<OffthreadVideo 
  src={staticFile('background.mp4')} 
  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
/>
```
