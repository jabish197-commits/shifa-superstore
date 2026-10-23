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
        <svg viewBox="0 0 520 330" aria-hidden="true" className="shopping-motion-art">
          <circle cx="279" cy="157" r="128" fill="#edf3e1" />
          <circle cx="408" cy="68" r="13" fill="#f9d798" />
          <circle cx="113" cy="206" r="8" fill="#cfdfb5" />
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
              <path d="M195 171h49l6 67h-59Z" fill="#4e9bab" />
              <path
                d="M207 177v-12a12 12 0 0 1 24 0v12"
                fill="none"
                stroke="#28747f"
                strokeWidth="4"
              />
              <path d="M230 181v50" stroke="#79b9c3" strokeWidth="3" />
            </g>
            <g className="cart-drop bag-yellow">
              <path d="M250 157h49l5 81h-57Z" fill="#eac54e" />
              <path
                d="M262 162v-13a12 12 0 0 1 24 0v13"
                fill="none"
                stroke="#a68f32"
                strokeWidth="4"
              />
            </g>
            <g className="cart-drop bag-orange">
              <path d="M307 141h44l8 95h-58Z" fill="#ed7847" />
              <path
                d="M317 148v-15a12 12 0 0 1 24 0v15"
                fill="none"
                stroke="#b44b31"
                strokeWidth="4"
              />
              <path d="M341 155v70" stroke="#f9a074" strokeWidth="3" />
            </g>
            <g className="cart-fresh-tag">
              <path
                d="M278 73l29-19 70 20-24 78-72-22Z"
                fill="#ffd475"
                stroke="#e6b44c"
                strokeWidth="2"
              />
              <circle cx="295" cy="77" r="5" fill="#fff8df" />
              <path d="M295 77c-46-43-56-10-19 6" fill="none" stroke="#bc944d" strokeWidth="3" />
              <text
                x="331"
                y="99"
                textAnchor="middle"
                fill="#526032"
                fontSize="17"
                fontWeight="800"
              >
                FRESH
              </text>
              <text x="328" y="120" textAnchor="middle" fill="#526032" fontSize="13">
                picks
              </text>
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

