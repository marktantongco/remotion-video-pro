export const metadata = {
  title: 'Remotion Webhook Service',
  description: 'Programmatic video rendering API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
