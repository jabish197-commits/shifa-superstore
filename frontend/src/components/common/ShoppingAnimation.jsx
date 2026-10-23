import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './UI';
import './ShoppingAnimation.css';

export default function ShoppingAnimation() {
  const [paused, setPaused] = useState(false);
  return (
    <section
      className={`shopping-motion container ${paused ? 'shopping-motion-paused' : ''}`}
      aria-label="Fill your basket with everyday essentials"
    >
      <div className="shopping-motion-stage">
        <svg viewBox="70 22 390 290" aria-hidden="true" className="shopping-motion-art">
          <circle cx="279" cy="157" r="128" fill="#edf3e1" />
          <circle cx="408" cy="68" r="13" fill="#f9d798" />
          <circle cx="113" cy="206" r="8" fill="#cfdfb5" />
          <ellipse cx="267" cy="287" rx="104" ry="9" fill="#235b3820" />
          <g className="cart-sparkles" fill="#e6aa51">
            <path d="m123 81 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" />
            <path d="m402 184 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
          </g>
          <path
            className="cart-road"
            d="M50 282H478"
            stroke="#98b493"
            strokeWidth="4"
            strokeDasharray="29 23"
            strokeLinecap="round"
          />
          <g className="rolling-cart">
            <g className="cart-drop bag-blue">
              <path d="m192 160 14-18h25l14 18v78h-53Z" fill="#fffef4" stroke="#c6d9c6" strokeWidth="2" />
              <path d="m192 160 14-18 13 18Z" fill="#8abfa8" />
              <path d="M192 177h53v41h-53Z" fill="#80b8a1" />
              <path d="M210 194c10-14 20-6 12 4-5 7-13 5-12-4Z" fill="#f7fbe9" />
            </g>
            <g className="cart-drop bag-yellow">
              <path d="M250 235v-99c0-33 49-33 49 0v99Z" fill="#e6ad65" />
              <path d="m265 140 18-10m-18 32 18-10m-18 32 18-10" stroke="#fff1c7" strokeWidth="7" strokeLinecap="round" />
            </g>
            <g className="cart-drop bag-orange">
              <path d="M310 161c-35-34-13-70 10-35 2-48 39-49 31 1 36-28 57 2 20 36l-16 72h-40Z" fill="#6b9d58" />
              <path d="m334 142 3 87m-1-61-17-23m18 45 22-32" fill="none" stroke="#c3d9a0" strokeWidth="4" strokeLinecap="round" />
              <circle cx="309" cy="213" r="21" fill="#e87749" />
              <path d="m309 192-4-7m4 7 9-4" stroke="#3d784c" strokeWidth="4" strokeLinecap="round" />
            </g>
            <g className="cart-fresh-tag">
              <circle cx="385" cy="99" r="23" fill="#fffdf2" stroke="#dce7ce" strokeWidth="2" />
              <path d="m374 100 8 8 15-18" fill="none" stroke="#4b8a59" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <g
              fill="none"
              stroke="#237b62"
              strokeWidth="7"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <path d="M122 120h37l29 140h166M169 162h203l-20 79H185" />
              <path d="M177 190h186M182 216h174M211 164l-8 75M249 164l-8 75M287 164l-8 75M326 164l-8 75" />
            </g>
            <path d="M118 120h25" stroke="#4aaf8b" strokeWidth="12" strokeLinecap="round" />
            <g className="cart-wheel wheel-left">
              <circle cx="211" cy="272" r="13" fill="#237b62" />
              <circle cx="211" cy="272" r="8" fill="none" stroke="#91c5a5" strokeWidth="2" />
              <path d="M211 264v16m-8-8h16" stroke="#91c5a5" strokeWidth="2" />
            </g>
            <g className="cart-wheel wheel-right">
              <circle cx="336" cy="272" r="13" fill="#237b62" />
              <circle cx="336" cy="272" r="8" fill="none" stroke="#91c5a5" strokeWidth="2" />
              <path d="M336 264v16m-8-8h16" stroke="#91c5a5" strokeWidth="2" />
            </g>
          </g>
        </svg>
        <button
          type="button"
          className="shopping-motion-control"
          aria-pressed={paused}
          aria-label={paused ? 'Play cart animation' : 'Pause cart animation'}
          onClick={() => setPaused(!paused)}
        >
          <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>
        </button>
      </div>
      <div className="shopping-motion-actions">
        <Link to="/products" className="button">
          <Icon name="cart" size={18} /> Fill your basket <Icon name="arrow" size={17} />
        </Link>
      </div>
    </section>
  );
}
