export const metadata = {
  title: 'Remotion Video Pro — Video Personalization Engine',
  description:
    'Programmatic video rendering API with A/B testing, Stripe integration, batch processing, and real-time personalization at scale.',
  openGraph: {
    title: 'Remotion Video Pro — Video Personalization Engine',
    description:
      'Render millions of personalized videos. A/B testing, Stripe checkout triggers, and enterprise-grade security built in.',
    type: 'website',
    siteName: 'Remotion Video Pro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Remotion Video Pro — Video Personalization Engine',
    description:
      'Programmatic video rendering API with A/B testing and real-time personalization.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
