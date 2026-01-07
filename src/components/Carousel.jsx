import React from 'react'

export default ({ images }) => (
  <div style={{ width: '100%', overflowX: 'scroll', display: 'flex', gap: '5px'  }}>
    {images.map((image) => (
      <img key={image} src={image} style={{ width: '200px' }} />
    ))}
  </div>
)
