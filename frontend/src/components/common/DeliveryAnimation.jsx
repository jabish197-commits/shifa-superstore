import { useState } from 'react';
import './DeliveryAnimation.css';

export default function DeliveryAnimation() {
  const [paused, setPaused] = useState(false);
  return (
    <div className={`delivery-animation ${paused ? 'delivery-animation-paused' : ''}`}>
      <svg viewBox="0 0 480 280" role="img" aria-label="A Shifa grocery van arrives at a home and delivers a parcel.">
        <circle cx="269" cy="132" r="113" fill="#e0edce" />
        <circle cx="94" cy="63" r="22" fill="#ffd48b" />
        <path d="M40 218H450" stroke="#9db697" strokeWidth="3" strokeLinecap="round" />
        <path d="M45 240H445" stroke="#c2d3af" strokeWidth="2" strokeDasharray="14 16" />
        <g>
          <path d="M320 130L380 80L440 130V216H320Z" fill="#fffaf0" />
          <path d="M310 132L380 73L450 132" fill="none" stroke="#126447" strokeWidth="12" strokeLinejoin="round" />
          <rect x="366" y="158" width="34" height="58" rx="4" fill="#df934e" />
          <circle cx="391" cy="188" r="2" fill="#fff4dc" />
          <rect x="328" y="144" width="24" height="28" rx="4" fill="#a9d6ce" />
          <path d="M340 144V172M328 158H352" stroke="#fff" strokeWidth="3" />
        </g>
        <g className="delivery-van">
          <rect x="42" y="137" width="139" height="66" rx="13" fill="#11764f" />
          <path d="M181 153H215L240 182V203H181Z" fill="#ffac52" />
          <path d="M190 162H211L226 180H190Z" fill="#d9f3ef" />
          <rect x="40" y="194" width="204" height="12" rx="6" fill="#084a38" />
          <text x="110" y="166" textAnchor="middle" fill="#fff9e9" fontSize="18" fontWeight="800" letterSpacing="2">SHIFA</text>
          <text x="110" y="183" textAnchor="middle" fill="#d5ebc5" fontSize="9" letterSpacing="2">TO YOUR DOOR</text>
          {[78, 210].map(x => <g key={x} transform={`translate(${x} 207)`}>
            <g className="delivery-wheel">
              <circle r="16" fill="#25483c" />
              <circle r="8" fill="#fff7e5" />
              <path d="M-7 0H7M0 -7V7" stroke="#759384" strokeWidth="3" />
            </g>
          </g>)}
        </g>
        <g className="delivery-parcel">
          <rect x="336" y="190" width="26" height="26" rx="3" fill="#edaa61" />
          <path d="M349 190V202" stroke="#fff0cf" strokeWidth="5" />
        </g>
        <g className="delivery-arrived">
          <circle cx="383" cy="51" r="19" fill="#11764f" />
          <path d="M374 51L381 58L393 44" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <div className="delivery-animation-caption">A little closer. A little easier.</div>
      <button type="button" className="delivery-animation-toggle" aria-pressed={paused} onClick={() => setPaused(!paused)}>
        {paused ? 'Play delivery animation' : 'Pause delivery animation'}
      </button>
    </div>
  );
}
