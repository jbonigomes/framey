import React from 'react'

export default () => (
  <svg width="60" height="50" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradient" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stopColor="#fff000" />
        <stop offset="100%" stopColor="#ff3600" />
      </linearGradient>
    </defs>
    <text x="6" y="22" style={{ fontFamily: 'Courier New' }} fill="url(#gradient)">
      <tspan style={{ fontSize: '1em', letterSpacing: '-0.4em' }}>[</tspan>
      <tspan style={{ fontSize: '1.5em', letterSpacing: '-0.4em' }}>[</tspan>
      <tspan style={{ fontSize: '2em', letterSpacing: '-0.2em' }}>[]</tspan>
    </text>
    <text x="0" y="42" style={{ fontFamily: 'Brush Script MT' }} fill="url(#gradient)">
      Framey
    </text>
  </svg>
)
