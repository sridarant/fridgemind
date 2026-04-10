// src/components/ErrorBoundary.jsx
// Class component — catches render errors across the app tree.
// Logs crashes via submitFeedback service. Shows recovery UI.
import { Component } from 'react';
import { submitFeedback } from '../services/userService';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', muted:'#7C6A5E',
  cream:'#FFFAF5', border:'rgba(28,10,0,0.10)',
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError:false, error:null, errorInfo:null, reported:false };
  }

  static getDerivedStateFromError(error) {
    return { hasError:true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Report crash to Supabase via feedback service (fire-and-forget)
    submitFeedback({
      type: 'crash',
      message: 'CRASH: ' + (error?.message || 'unknown') +
               '\nStack: ' + (errorInfo?.componentStack || '').slice(0, 400),
    }).catch(() => {});
  }

  handleReport = () => {
    const body = encodeURIComponent(
      'Error: ' + this.state.error?.message +
      '\n\nStack: ' + this.state.errorInfo?.componentStack?.slice(0, 400) +
      '\n\nURL: ' + window.location.href
    );
    window.location.href = 'mailto:hello@jiff.app?subject=Bug report&body=' + body;
    this.setState({ reported: true });
  };

  getBackUrl() {
    return window.location.pathname.startsWith('/admin') ? '/admin' : '/app';
  }

  getBackLabel() {
    return window.location.pathname.startsWith('/admin') ? '← Back to admin' : '← Back to app';
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight:'100vh', background:C.cream, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px', fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ maxWidth:420, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>{'⚠️'}</div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:C.ink, marginBottom:8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize:13, color:C.muted, fontWeight:300, lineHeight:1.7, marginBottom:24 }}>
            Jiff hit an unexpected error. Our team has been notified. Try refreshing or go back.
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => { window.location.href = this.getBackUrl(); }}
              style={{ background:C.jiff, color:'white', border:'none', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              {this.getBackLabel()}
            </button>
            <button onClick={() => window.location.reload()}
              style={{ background:'white', color:C.ink, border:'1.5px solid rgba(28,10,0,0.18)', borderRadius:10, padding:'10px 20px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              Refresh page
            </button>
            {!this.state.reported ? (
              <button onClick={this.handleReport}
                style={{ background:'none', color:C.muted, border:'1px solid rgba(28,10,0,0.12)', borderRadius:10, padding:'10px 20px', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                Report issue
              </button>
            ) : (
              <span style={{ fontSize:12, color:'#1D9E75', padding:'10px', fontWeight:500 }}>{'✓ Report sent'}</span>
            )}
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop:20, textAlign:'left', fontSize:11, color:C.muted }}>
              <summary style={{ cursor:'pointer', marginBottom:6 }}>Error details</summary>
              <pre style={{ overflow:'auto', padding:'8px', background:'#f5f5f5', borderRadius:6 }}>
                {this.state.error.toString()}{'\n'}{this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
