// src/styles/jiffStyles.js
// CSS-in-JS styles for the main Jiff page.
// Extracted from Jiff.jsx to keep component under 500 lines.

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --jiff:#FF4500;--jiff-dark:#CC3700;--ink:#1C0A00;
    --cream:#FFFAF5;--warm:#FFF0E5;--muted:#7C6A5E;
    --border:rgba(28,10,0,0.10);--border-mid:rgba(28,10,0,0.18);
    --shadow:0 4px 28px rgba(28,10,0,0.08);
    --fav:#E53E3E;--fav-bg:#FFF5F5;--fav-border:rgba(229,62,62,0.2);
    --whatsapp:#25D366;--whatsapp-dark:#1DA851;
    --need-bg:#FEF3E2;--need-text:#92400E;
    --have-bg:#ECFDF5;--have-text:#065F46;
    --timer-idle:#FF6B35;--timer-active:#2D6A4F;--timer-done:#1D9E75;
    --gold:#FFB800;
  }
  body{background:var(--cream);font-family:'DM Sans',sans-serif;color:var(--ink);}
  .app{min-height:100vh;background:var(--cream);}
  .header{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:20;background:rgba(255,250,245,0.95);backdrop-filter:blur(12px);}
  .header-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .hdr-btn{font-size:12px;font-weight:500;color:var(--muted);background:none;border:1.5px solid var(--border-mid);border-radius:8px;padding:6px 12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.18s;white-space:nowrap;display:flex;align-items:center;gap:5px;}
  .hdr-btn:hover{border-color:var(--jiff);color:var(--jiff);}
  .hdr-btn.premium{border-color:var(--gold);color:#854F0B;background:rgba(255,184,0,0.1);}
  .trial-badge{background:rgba(255,184,0,0.15);border:1px solid rgba(255,184,0,0.3);border-radius:20px;padding:4px 10px;font-size:11px;font-weight:500;color:#854F0B;white-space:nowrap;}
  .notif-btn{position:relative;background:none;border:1.5px solid var(--border-mid);border-radius:20px;padding:6px 10px;cursor:pointer;font-size:15px;display:flex;align-items:center;gap:4px;}
  .notif-badge{position:absolute;top:-4px;right:-4px;background:#E53E3E;color:white;font-size:9px;font-weight:700;border-radius:20px;padding:1px 5px;min-width:16px;text-align:center;border:2px solid white;}
  .notif-panel{position:absolute;right:0;top:calc(100% + 8px);width:320px;background:white;border:1px solid rgba(28,10,0,0.10);border-radius:16px;box-shadow:0 12px 40px rgba(28,10,0,0.14);z-index:200;overflow:hidden;}
  .notif-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(28,10,0,0.08);}
  .notif-item{display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(28,10,0,0.05);}
  .notif-item.unread{background:rgba(255,69,0,0.03);}
  .notif-empty{padding:28px 16px;text-align:center;color:var(--muted);font-size:13px;font-weight:300;}
  .auth-gate{position:fixed;inset:0;background:rgba(28,10,0,0.6);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;backdrop-filter:blur(4px);}
  .auth-card{background:white;border-radius:24px;padding:40px 36px;max-width:440px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(28,10,0,0.2);}
  .auth-icon{font-size:48px;margin-bottom:16px;}
  .auth-title{font-family:'Fraunces',serif;font-size:28px;font-weight:900;color:var(--ink);margin-bottom:8px;letter-spacing:-0.5px;}
  .auth-sub{font-size:15px;color:var(--muted);font-weight:300;line-height:1.65;margin-bottom:28px;}
  .auth-google-btn{width:100%;background:var(--jiff);color:white;border:none;border-radius:12px;padding:16px;font-size:16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;margin-bottom:12px;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:10px;}
  .auth-email-row{display:flex;border:1.5px solid var(--border-mid);border-radius:10px;overflow:hidden;margin-bottom:8px;}
  .auth-email-input{flex:1;border:none;outline:none;padding:12px 14px;font-size:14px;font-family:'DM Sans',sans-serif;color:var(--ink);}
  .auth-email-go{background:var(--warm);border:none;border-left:1px solid var(--border-mid);padding:12px 18px;font-size:14px;font-weight:500;cursor:pointer;color:var(--ink);font-family:'DM Sans',sans-serif;}
  .auth-magic{font-size:13px;color:var(--timer-done);font-weight:500;padding:8px;}
  .auth-perks{display:flex;flex-direction:column;gap:8px;margin-bottom:24px;text-align:left;}
  .auth-perk{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ink);font-weight:300;}
  .auth-perk-icon{width:28px;height:28px;border-radius:8px;background:var(--warm);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
  .gate-overlay{position:fixed;inset:0;background:rgba(28,10,0,0.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}
  .gate-card{background:white;border-radius:24px;padding:36px 32px;max-width:440px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(28,10,0,0.2);animation:slideUp 0.25s ease;}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .gate-icon{font-size:44px;margin-bottom:14px;}
  .gate-title{font-family:'Fraunces',serif;font-size:26px;font-weight:900;color:var(--ink);margin-bottom:8px;}
  .gate-sub{font-size:15px;color:var(--muted);font-weight:300;line-height:1.65;margin-bottom:24px;}
  .gate-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;}
  .gate-plan{border:1.5px solid var(--border-mid);border-radius:12px;padding:14px 10px;cursor:pointer;text-align:center;}
  .gate-plan.selected{border-color:var(--jiff);background:rgba(255,69,0,0.05);}
  .gate-plan-price{font-family:'Fraunces',serif;font-size:20px;font-weight:900;color:var(--ink);}
  .gate-plan-label{font-size:11px;color:var(--muted);margin-top:2px;}
  .gate-plan-saving{font-size:10px;font-weight:600;color:var(--jiff);margin-top:3px;}
  .gate-cta{background:var(--jiff);color:white;border:none;border-radius:12px;padding:15px 32px;font-size:15px;font-weight:500;cursor:pointer;width:100%;font-family:'DM Sans',sans-serif;margin-bottom:10px;}
  .gate-skip{background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;padding:4px;}
  .main-layout{max-width:700px;margin:0 auto;padding:32px 24px 60px;}
  .section-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--jiff);font-weight:500;margin-bottom:10px;}
  .cta-wrap{text-align:center;padding:16px;}
  .cta-btn{background:var(--jiff);color:white;border:none;border-radius:14px;padding:16px 40px;font-size:16px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:10px;transition:all 0.2s;}
  .cta-btn:hover:not(:disabled){background:var(--jiff-dark);transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,69,0,0.35);}
  .cta-btn:disabled{opacity:0.55;cursor:not-allowed;}
  .cta-note{font-size:12px;color:var(--muted);margin-top:8px;}
  .trial-note{font-size:12px;color:#854F0B;margin-top:8px;background:rgba(255,184,0,0.1);border-radius:8px;padding:6px 12px;display:inline-block;}
  .loading-wrap{text-align:center;padding:64px 24px;max-width:480px;margin:0 auto;}
  .spinner{width:44px;height:44px;border:3px solid var(--border-mid);border-top-color:var(--jiff);border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto 20px;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loading-title{font-family:'Fraunces',serif;font-size:24px;font-weight:700;color:var(--ink);margin-bottom:8px;}
  .loading-sub{font-size:14px;color:var(--muted);font-weight:300;margin-bottom:24px;}
  .loading-fact{font-size:13px;color:var(--muted);padding:12px 0;border-top:1px solid var(--border);animation:fadeIn 0.4s ease;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .results-wrap{max-width:860px;margin:0 auto;padding:32px 24px 60px;}
  .results-header{margin-bottom:16px;}
  .results-title{font-family:'Fraunces',serif;font-size:26px;font-weight:900;color:var(--ink);margin-bottom:4px;letter-spacing:-0.5px;}
  .results-sub{font-size:13px;color:var(--muted);font-weight:300;}
  .filter-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;}
  .filter-pill{background:white;border:1px solid var(--border-mid);border-radius:20px;padding:3px 11px;font-size:11px;color:var(--muted);}
  .meals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;}
  .meal-card{background:white;border:1px solid var(--border);border-radius:18px;overflow:hidden;box-shadow:var(--shadow);animation:slideUp 0.3s ease both;transition:transform 0.2s,box-shadow 0.2s;}
  .meal-card:not(.expanded){cursor:pointer;}
  .meal-card:not(.expanded):hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(28,10,0,0.12);}
  .meal-hdr{padding:18px 18px 10px;}
  .meal-hdr-top{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:7px;}
  .meal-num{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--jiff);font-weight:600;}
  .meal-name{font-family:'Fraunces',serif;font-size:19px;font-weight:700;color:var(--ink);margin-bottom:7px;line-height:1.2;}
  .meal-meta{display:flex;gap:10px;flex-wrap:wrap;}
  .meal-meta-item{font-size:11px;color:var(--muted);}
  .meal-desc{padding:0 18px 12px;font-size:13px;color:var(--muted);line-height:1.6;font-weight:300;}
  .heart-btn{background:none;border:1.5px solid var(--border-mid);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;flex-shrink:0;padding:0;}
  .heart-btn:hover,.heart-btn.saved{border-color:var(--fav);background:var(--fav-bg);}
  .heart-btn svg{width:14px;height:14px;}
  .reset-wrap{text-align:center;padding:0 24px 48px;}
  .reset-btn{background:none;border:1.5px solid var(--border-mid);border-radius:10px;padding:10px 24px;font-size:13px;font-family:'DM Sans',sans-serif;cursor:pointer;color:var(--muted);}
  .reset-btn:hover{border-color:var(--jiff);color:var(--jiff);}
  .error-wrap{text-align:center;padding:56px 24px;max-width:440px;margin:0 auto;}
  .error-icon{font-size:38px;margin-bottom:12px;}
  .error-title{font-family:'Fraunces',serif;font-size:20px;font-weight:700;color:var(--ink);margin-bottom:7px;}
  .error-msg{font-size:13px;color:var(--muted);margin-bottom:22px;font-weight:300;}
  .chip{border:1.5px solid var(--border-mid);border-radius:10px;padding:6px 13px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;background:white;color:var(--muted);}
  .chip.active{background:var(--ink);border-color:var(--ink);color:white;font-weight:500;}
  .grocery-panel{margin:0 18px 14px;border:1px solid var(--border);border-radius:13px;overflow:hidden;}
  .grocery-header{background:var(--ink);padding:11px 13px;display:flex;align-items:center;justify-content:space-between;}
  .grocery-item{display:flex;align-items:flex-start;gap:8px;padding:6px 8px;border-radius:7px;font-size:12px;line-height:1.4;font-weight:300;cursor:pointer;}
  .grocery-item.need{background:var(--need-bg);color:var(--need-text);}
  .grocery-item.have{background:var(--have-bg);color:var(--have-text);cursor:default;}
  .nutr-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
  .nutr-item{background:var(--warm);border-radius:8px;padding:8px;text-align:center;}
  .nutr-val{font-family:'Fraunces',serif;font-size:15px;font-weight:700;color:var(--ink);}
  .nutr-lbl{font-size:9px;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:1px;}
  .steps-list{counter-reset:step;list-style:none;}
  .steps-list li{font-size:12px;color:var(--ink);padding:7px 0 7px 26px;border-bottom:1px solid rgba(0,0,0,0.04);position:relative;line-height:1.6;font-weight:300;counter-increment:step;display:flex;flex-direction:column;gap:7px;}
  .steps-list li::before{content:counter(step);position:absolute;left:0;top:9px;width:17px;height:17px;background:var(--jiff);color:white;font-size:9px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;}
  .step-text{flex:1;}
  .step-timer.idle{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;background:rgba(255,69,0,0.08);border:1.5px solid rgba(255,69,0,0.2);border-radius:20px;padding:4px 10px 4px 8px;font-size:11px;font-weight:500;color:var(--timer-idle);cursor:pointer;font-family:'DM Sans',sans-serif;}
  .step-timer.done{align-self:flex-start;display:inline-flex;align-items:center;gap:7px;background:rgba(29,158,117,0.1);border:1.5px solid rgba(29,158,117,0.3);border-radius:20px;padding:5px 12px 5px 9px;}
  .timer-done-icon{font-size:15px;}
  .timer-done-text{font-size:12px;font-weight:600;color:var(--timer-done);}
  .scaler-bar{padding:11px 14px;background:var(--warm);border:1px solid rgba(255,69,0,0.15);border-radius:9px 9px 0 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
  .favs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;padding-bottom:36px;}
  .share-actions{display:flex;gap:7px;flex-wrap:wrap;}
  @media(max-width:700px){
    /* Layout */
    .main-layout{padding:12px 14px 80px;}
    .meals-grid,.favs-grid{grid-template-columns:1fr;}
    .results-wrap{padding:12px 14px 80px;}
    /* Header — compact on mobile */
    .header{padding:10px 14px;}
    .header-right{gap:5px;}
    .hdr-btn{padding:5px 9px;font-size:11px;}
    /* Typography */
    .results-title{font-size:17px;}
    .meal-name{font-size:16px;}
    /* Cards */
    .nutr-grid{grid-template-columns:repeat(2,1fr);}
    .auth-card{padding:22px 18px;}
    /* Prevent horizontal overflow */
    .filter-pills{flex-wrap:wrap;gap:6px;}
    .meal-meta{flex-wrap:wrap;gap:6px;}
    /* Gates */
    .gate-plans{grid-template-columns:1fr;}
    .gate-card{padding:28px 20px;}
    /* Actions */
    .share-actions{flex-direction:column;}
    .cta-btn{width:100%;justify-content:center;}
    /* Hide desktop-only elements */
    .scaler-orig{display:none;}
    .trial-badge{display:none;}
    .desktop-only{display:none!important;}
    /* Grocery panel — full width */
    .grocery-panel{margin:0 0 14px;}
    /* Steps — larger tap targets */
    .steps-list li{padding:9px 0 9px 28px;}
    /* Auth */
    .auth-perks{gap:6px;}
  }
`;


export default styles;
