// src/components/jiff/LoadingView.jsx
import { parseStepTime } from '../../lib/timers.js';

const FACTS = [
  'Raiding your fridge…','Cross-referencing 50,000+ recipes…',
  'Matching cuisine and flavour profile…','Crunching nutrition numbers…',
  'Preparing 5 great options for you…',
];

export default function LoadingView({ cuisine, mealType, ingredients, isPremium, PAID_RECIPE_CAP, factIdx, loadingMessage }) {
  const FACTS = [
    'Raiding your fridge…','Cross-referencing 50,000+ recipes…',
    'Matching cuisine and flavour profile…','Crunching nutrition numbers…',
    'Preparing 5 great options for you…',
  ];
  const fact = FACTS[factIdx % FACTS.length];

  return (
    <div style={{textAlign:'center',padding:'48px 24px',maxWidth:500,margin:'0 auto'}}>
      {/* CSS Fridge Animation */}
      <div style={{position:'relative',width:200,height:200,margin:'0 auto 28px',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <style>{`
          @keyframes fridgeDoor{0%{transform:perspective(400px) rotateY(0deg)}60%{transform:perspective(400px) rotateY(-75deg)}100%{transform:perspective(400px) rotateY(-75deg)}}
          @keyframes ingredientFly{0%{opacity:0;transform:translate(0,0) scale(0.5)}30%{opacity:1}70%{opacity:1;transform:translate(var(--tx),var(--ty)) scale(1.1)}100%{opacity:0;transform:translate(calc(var(--tx)*2),calc(var(--ty)*2 + 40px)) scale(0.8)}}
          @keyframes plateAppear{0%,50%{opacity:0;transform:scale(0.6) translateY(20px)}75%{opacity:1;transform:scale(1.1) translateY(-5px)}100%{opacity:1;transform:scale(1) translateY(0)}}
          @keyframes steam{0%{opacity:0;transform:translateY(0) scaleX(1)}50%{opacity:0.7;transform:translateY(-15px) scaleX(1.3)}100%{opacity:0;transform:translateY(-30px) scaleX(0.8)}}
          @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
          .fridge-door{animation:fridgeDoor 0.8s ease-in-out 0.3s both;transform-origin:left center;}
          .ingredient-fly{animation:ingredientFly 1.2s ease-in-out infinite;}
          .plate-appear{animation:plateAppear 0.6s ease-out 1s both;}
          .steam-puff{animation:steam 1.5s ease-out infinite;}
          .fridge-pulse{animation:pulse 2s ease-in-out infinite;}
        `}</style>
        {/* Fridge body */}
        <div className="fridge-pulse" style={{position:'relative',width:90,height:130,background:'#F5F5F5',borderRadius:10,border:'2px solid #E0E0E0',boxShadow:'4px 4px 12px rgba(0,0,0,0.15)',overflow:'visible'}}>
          {/* Fridge door swinging open */}
          <div className="fridge-door" style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#FAFAFA,#E8E8E8)',borderRadius:10,border:'2px solid #D0D0D0',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',gap:6}}>
            <div style={{fontSize:8,color:'#999',fontWeight:700,letterSpacing:'1px'}}>JIFF</div>
            <div style={{width:8,height:22,background:'#C0C0C0',borderRadius:4}}/>
          </div>
          {/* Inside fridge — ingredients */}
          <div style={{position:'absolute',inset:4,display:'flex',flexWrap:'wrap',gap:3,padding:4,alignContent:'flex-start',fontSize:14}}>
            {['🥚','🧅','🫑','🥬','🍅','🧄'].map((e,i)=>(
              <span key={i} style={{lineHeight:1.2}}>{e}</span>
            ))}
          </div>
        </div>
        {/* Flying ingredients */}
        {['🌶️','🧅','🥩','🫛'].map((e,i)=>(
          <span key={i} className="ingredient-fly" style={{
            position:'absolute', fontSize:18, lineHeight:1,
            '--tx': [60,-60,50,-50][i] + 'px',
            '--ty': [-40,-30,-55,-25][i] + 'px',
            animationDelay: (i*0.3) + 's',
            animationDuration: (1.2 + i*0.2) + 's',
          }}>{e}</span>
        ))}
        {/* Plate appearing */}
        <div className="plate-appear" style={{position:'absolute',right:-20,bottom:10,fontSize:42,lineHeight:1,filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'}}>
          🍽️
        </div>
        {/* Steam puffs */}
        {[0,1,2].map(i=>(
          <div key={i} className="steam-puff" style={{
            position:'absolute',right:-10+i*10,bottom:50-i*5,
            width:8,height:8,borderRadius:'50%',
            background:'rgba(200,200,200,0.6)',
            animationDelay:`${i*0.4}s`,
          }}/>
        ))}
      </div>

      <div style={{fontFamily:"'Fraunces',serif",fontSize:'clamp(20px,3.5vw,28px)',fontWeight:900,color:'var(--ink)',letterSpacing:'-0.5px',marginBottom:8}}>
        {loadingMessage}
      </div>
      <div style={{fontSize:13,color:'var(--muted)',fontWeight:300,marginBottom:20,minHeight:20}}>{fact}</div>
      {isPremium && (
        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,69,0,0.08)',borderRadius:20,padding:'4px 14px',fontSize:11,color:'var(--jiff)',fontWeight:500}}>
          ⚡ Generating {PAID_RECIPE_CAP} recipes
        </div>
      )}
    </div>
  );
}

