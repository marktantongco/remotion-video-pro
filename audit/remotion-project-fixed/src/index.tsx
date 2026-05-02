import { registerRoot } from 'remotion';
import { Composition, calculateMetadata } from 'remotion';
import { z } from 'zod';
import { MainVideo } from './MainVideo';

export const videoSchema = z.object({
  title: z.string().min(1).max(100),
  subtitle: z.string().optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#ff0055'),
  showLogo: z.boolean().default(true),
  dataUrl: z.string().default('data/chapters.json'),
});

export type VideoProps = z.infer<typeof videoSchema>;

export const calculateVideoMetadata = calculateMetadata(async ({ props }) => {
  const parsed = videoSchema.parse(props);
  return {
    durationInFrames: 900,
    width: 1920,
    height: 1080,
    fps: 30,
    props: parsed,
  };
});

registerRoot(() => (
  <>
    <Composition
      id="MainVideo"
      component={MainVideo}
      calculateMetadata={calculateVideoMetadata}
      schema={videoSchema}
      defaultProps={{
        title: 'Hello World',
        accentColor: '#ff0055',
        showLogo: true,
        dataUrl: 'data/chapters.json',
      }}
    />
  </>
));
