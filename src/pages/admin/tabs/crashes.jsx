// src/pages/admin/tabs/crashes.jsx
export default function Tab_CRASHES({ C, Card, feedback }) {
  const crashes = (feedback||[]).filter(f => f.category === 'crash');
  return (
    <>
      <Card title={`Crash Reports — ${crashes.length} total`} accent={C.red}>
        {crashes.length === 0 ? (
          <div style={{color:C.muted,fontSize:13,fontWeight:300}}>
            🎉 No crashes recorded. ErrorBoundary logs crashes automatically to this table.
          </div>
        ) : crashes.map((f,i) => (
          <div key={i} style={{borderBottom:'1px solid rgba(229,62,62,0.1)',padding:'10px 0',
            borderLeft:'3px solid '+C.red,paddingLeft:10,marginLeft:-10,background:'rgba(229,62,62,0.03)'}}>
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
              <span>💥</span>
              <span style={{fontSize:11,color:C.muted}}>{f.page||'unknown page'}</span>
              <span style={{fontSize:11,color:C.muted,marginLeft:'auto'}}>
                {f.created_at ? new Date(f.created_at).toLocaleString() : ''}
              </span>
            </div>
            <div style={{fontSize:11,color:C.red,fontWeight:300,lineHeight:1.6,
              fontFamily:'monospace',wordBreak:'break-all',
              background:'rgba(229,62,62,0.05)',padding:'6px 8px',borderRadius:6}}>
              {f.message}
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
