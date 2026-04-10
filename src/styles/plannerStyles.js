// src/styles/plannerStyles.js — CSS string for Planner page
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#FFFAF5;}
  .page{min-height:100vh;background:#FFFAF5;font-family:'DM Sans',sans-serif;color:#1C0A00;}
  .header{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;border-bottom:1px solid rgba(28,10,0,0.08);position:sticky;top:0;z-index:10;background:rgba(255,250,245,0.95);backdrop-filter:blur(12px);}
  .logo{display:flex;align-items:center;gap:6px;cursor:pointer;}
  .logo-name{font-family:'Fraunces',serif;font-size:20px;font-weight:900;color:#1C0A00;}
  .nav-links{display:flex;align-items:center;gap:8px;margin-left:auto;}
  .nav-link{padding:7px 14px;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;border:1.5px solid rgba(28,10,0,0.15);background:white;color:#7C6A5E;transition:all 0.15s;}
  .nav-link:hover,.nav-link.active{background:#1C0A00;color:white;border-color:#1C0A00;}
  .hero{text-align:center;padding:48px 24px 24px;max-width:600px;margin:0 auto;}
  .hero-eyebrow{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#FF4500;font-weight:500;margin-bottom:10px;}
  .hero-title{font-family:'Fraunces',serif;font-size:clamp(28px,5vw,44px);font-weight:900;color:#1C0A00;letter-spacing:-1.5px;line-height:1.05;margin-bottom:10px;}
  .hero-title em{font-style:italic;color:#FF4500;}
  .hero-sub{font-size:14px;color:#7C6A5E;font-weight:300;line-height:1.6;}
  .card{background:white;border:1px solid rgba(28,10,0,0.08);border-radius:20px;padding:22px;box-shadow:0 4px 24px rgba(28,10,0,0.06);max-width:860px;margin:0 auto 24px;}
  .section{margin-bottom:18px;}
  .section:last-child{margin-bottom:0;}
  .section-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#FF4500;font-weight:500;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
  .section-label::after{content:'';flex:1;height:1px;background:rgba(28,10,0,0.08);}
  .meal-type-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;}
  @media(min-width:480px){.meal-type-grid{grid-template-columns:repeat(4,1fr);}}
  .meal-type-toggle{border:1.5px solid rgba(28,10,0,0.14);border-radius:12px;padding:12px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;transition:all 0.15s;background:white;}
  .meal-type-toggle.selected{box-shadow:0 3px 10px rgba(0,0,0,0.08);}
  .meal-type-toggle-emoji{font-size:22px;}
  .meal-type-toggle-label{font-size:12px;font-weight:500;}
  .meal-type-toggle-check{width:16px;height:16px;border-radius:50%;border:1.5px solid rgba(28,10,0,0.2);display:flex;align-items:center;justify-content:center;transition:all 0.15s;margin-top:2px;}
  .servings-time-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  @media(max-width:480px){.servings-time-row{grid-template-columns:1fr;}}
  .serving-controls{display:flex;align-items:center;gap:8px;}
  .serving-btn{width:30px;height:30px;border-radius:8px;border:1.5px solid rgba(28,10,0,0.18);background:white;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#FF4500;transition:all 0.1s;}
  .serving-btn:disabled{opacity:0.35;cursor:not-allowed;}
  .serving-count{font-size:16px;font-weight:500;min-width:24px;text-align:center;}
  .chips{display:flex;flex-wrap:wrap;gap:7px;}
  .chip{border:1.5px solid rgba(28,10,0,0.18);border-radius:20px;padding:5px 14px;font-size:12px;cursor:pointer;transition:all 0.15s;font-family:'DM Sans',sans-serif;background:white;color:#7C6A5E;}
  .chip.active{background:#FF4500;border-color:#FF4500;color:white;font-weight:500;}
  .cta-btn{background:#FF4500;color:white;border:none;border-radius:14px;padding:14px 36px;font-size:15px;font-family:'DM Sans',sans-serif;font-weight:500;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:10px;}
  .cta-btn:hover:not(:disabled){background:#CC3700;transform:translateY(-2px);box-shadow:0 8px 28px rgba(255,69,0,0.35);}
  .cta-btn:disabled{opacity:0.55;cursor:not-allowed;}
  .cta-wrap{text-align:center;padding-top:4px;}
  .cta-note{font-size:12px;color:#7C6A5E;margin-top:8px;text-align:center;}
  .loading-wrap{text-align:center;padding:60px 24px;max-width:500px;margin:0 auto;}
  .loading-title{font-family:'Fraunces',serif;font-size:26px;font-weight:900;color:#1C0A00;margin-bottom:8px;}
  .loading-sub{font-size:13px;color:#7C6A5E;font-weight:300;margin-bottom:32px;}
  .loading-days{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;}
  .loading-day{width:36px;height:36px;border-radius:10px;border:1.5px solid rgba(28,10,0,0.12);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500;color:#7C6A5E;transition:all 0.3s;}
  .loading-day.done{background:#1C0A00;color:white;border-color:#1C0A00;}
  .results-wrap{max-width:1100px;margin:0 auto;padding:24px 20px;}
  .plan-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;}
  .plan-title{font-family:'Fraunces',serif;font-size:22px;font-weight:900;color:#1C0A00;letter-spacing:-0.5px;}
  .plan-sub{font-size:12px;color:#7C6A5E;font-weight:300;margin-top:2px;}
  .plan-actions{display:flex;gap:8px;flex-wrap:wrap;}
  .plan-btn{padding:7px 14px;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;border:1.5px solid rgba(28,10,0,0.15);background:white;color:#1C0A00;display:flex;align-items:center;gap:5px;transition:all 0.15s;}
  .plan-btn:hover{background:#1C0A00;color:white;border-color:#1C0A00;}
  .plan-btn.secondary{background:white;}
  .plan-btn.grocery{background:#FF4500;color:white;border-color:#FF4500;}
  .plan-btn.grocery:hover{background:#CC3700;}
  .days-tabs{display:flex;gap:4px;overflow-x:auto;padding-bottom:4px;margin-bottom:16px;scrollbar-width:none;}
  .days-tabs::-webkit-scrollbar{display:none;}
  .day-tab{flex-shrink:0;padding:6px 14px;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;border:1.5px solid rgba(28,10,0,0.12);background:white;color:#7C6A5E;transition:all 0.15s;font-weight:400;}
  .day-tab.active{background:#1C0A00;color:white;border-color:#1C0A00;font-weight:500;}
  .day-meals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:16px;}
  .meal-slot-card{background:white;border:1px solid rgba(28,10,0,0.08);border-radius:14px;padding:14px;box-shadow:0 2px 8px rgba(28,10,0,0.04);}
  .meal-slot-type{font-size:9px;letter-spacing:2px;text-transform:uppercase;font-weight:500;margin-bottom:6px;}
  .error-wrap{text-align:center;padding:48px 24px;max-width:400px;margin:0 auto;}
  .error-title{font-family:'Fraunces',serif;font-size:22px;font-weight:900;color:#1C0A00;margin-bottom:8px;}
  .error-msg{font-size:13px;color:#7C6A5E;margin-bottom:20px;}
  .profile-redirect{background:rgba(255,69,0,0.06);border:1.5px solid rgba(255,69,0,0.2);border-radius:14px;padding:20px 22px;text-align:center;margin:32px auto;max-width:480px;}
  .grocery-panel-wide{max-width:1100px;margin:0 auto 48px;padding:0 20px;}
  .grocery-card{background:white;border:1px solid rgba(28,10,0,0.08);border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(28,10,0,0.06);}
  .grocery-card-hdr{background:#1C0A00;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
  .grocery-card-title{font-family:'Fraunces',serif;font-size:18px;font-weight:900;color:white;letter-spacing:-0.3px;}
  .grocery-card-sub{font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;}
  .grocery-grid-wide{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));}
  .grocery-category{padding:14px 18px;border-right:1px solid rgba(28,10,0,0.06);border-bottom:1px solid rgba(28,10,0,0.06);}
  .grocery-category:nth-child(odd){background:rgba(255,250,245,0.6);}
  .grocery-cat-title{font-size:9px;letter-spacing:2px;text-transform:uppercase;font-weight:600;color:#FF4500;margin-bottom:9px;}
  .grocery-item-row{display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.04);cursor:pointer;}
  .grocery-item-row:last-child{border-bottom:none;}
  .g-checkbox{width:14px;height:14px;border-radius:3px;border:1.5px solid rgba(28,10,0,0.25);flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;}
  .g-checkbox.checked{background:#1D9E75;border-color:#1D9E75;}
  .g-checkbox.checked svg{display:block;}
  .g-checkbox svg{display:none;width:8px;height:8px;stroke:white;stroke-width:2.5;}
  .g-item-text{font-size:12px;font-weight:300;flex:1;line-height:1.4;}
  .g-item-text.done{text-decoration:line-through;color:#B0A097;}
  .g-action-btn{padding:7px 14px;border-radius:8px;font-size:12px;font-family:'DM Sans',sans-serif;cursor:pointer;display:flex;align-items:center;gap:5px;border:none;font-weight:500;transition:all 0.15s;}
  .g-action-btn.copy{background:rgba(255,250,245,0.1);color:white;border:1.5px solid rgba(255,250,245,0.2);}
  .g-action-btn.wa{background:#25D366;color:white;}
  @media(max-width:768px){
    .header{padding:12px 16px;}
    .hero{padding:32px 16px 16px;}
    .card{margin:0 12px 20px;padding:16px;}
    .grocery-grid-wide{grid-template-columns:1fr;}
    .day-meals-grid{grid-template-columns:1fr 1fr;}
  }
`;

export default styles;
