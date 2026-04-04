// src/pages/admin/tabs/api.jsx
export default function Tab_API({ C, Card }) {
  return (
    <>
      <Card title="API usage">
        <div style={{fontSize:12,color:C.muted,fontWeight:300,marginBottom:12,lineHeight:1.6}}>
          API usage tracking is logged to the <code style={{fontSize:11,background:'rgba(28,10,0,0.06)',padding:'1px 4px',borderRadius:3}}>token_usage</code> Supabase table.
          View live stats in the <strong style={{color:C.ink}}>Token Usage</strong> tab. The <code style={{fontSize:11}}>api_keys</code> table controls per-key rate limits.
        </div>
        {[
          ['/api/suggest',      'POST', 'Recipe generation — main endpoint. Reads ANTHROPIC_API_KEY. Per-key daily limit enforced via api_keys table.'],
          ['/api/planner',      'POST', '7-day week plan generation. Uses claude-opus-4-5. No per-key limit — premium users only.'],
          ['/api/videos',       'GET',  'YouTube recipe video search. Reads YOUTUBE_API_KEY. Results cached 7 days in video_cache.'],
          ['/api/admin',        'GET/POST/PATCH/DELETE', 'Admin data: stats, users, waitlist, releases, token-stats, meal-history, settings.'],
          ['/api/payments',     'POST', 'Razorpay order creation and signature verification. Reads RAZORPAY keys server-side.'],
          ['/api/comms',        'POST', 'Mailchimp email capture and feedback submission.'],
          ['/api/whatsapp',     'GET/POST', 'WhatsApp webhook — GET for verification, POST for incoming messages.'],
          ['/api/deploy-hook',  'POST', 'Vercel deploy webhook — logs version to Supabase releases table on each deploy.'],
        ].map(([route, method, desc]) => (
          <div key={route} style={{padding:'10px 0',borderBottom:'1px solid rgba(28,10,0,0.05)'}}>
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:3}}>
              <code style={{fontSize:12,color:C.jiff,fontWeight:500}}>{route}</code>
              <span style={{fontSize:10,background:'rgba(28,10,0,0.06)',padding:'1px 6px',borderRadius:4,color:C.muted,fontWeight:500}}>{method}</span>
            </div>
            <div style={{fontSize:11,color:C.muted,fontWeight:300,lineHeight:1.5}}>{desc}</div>
          </div>
        ))}
      </Card>
    </>
  );
}
