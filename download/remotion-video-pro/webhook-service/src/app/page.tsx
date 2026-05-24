export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Remotion Webhook Service</h1>
      <p>Programmatic video rendering API powered by Next.js, BullMQ, and AWS Lambda.</p>
      <h2>Endpoints</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>Endpoint</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>Method</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #333' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>/api/render</code></td><td>POST</td><td>Trigger a render job</td></tr>
          <tr><td><code>/api/render?jobId=xxx</code></td><td>GET</td><td>Poll job status</td></tr>
          <tr><td><code>/api/stripe-webhook</code></td><td>POST</td><td>Stripe webhook handler</td></tr>
          <tr><td><code>/api/batch</code></td><td>POST</td><td>Batch render (up to 10K)</td></tr>
          <tr><td><code>/api/composition/activate</code></td><td>POST</td><td>Activate a version</td></tr>
          <tr><td><code>/api/composition/activate</code></td><td>GET</td><td>List all versions</td></tr>
        </tbody>
      </table>
    </main>
  );
}
