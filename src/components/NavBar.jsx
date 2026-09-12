import React from 'react'

export default function NavBar({ view, setView, zeroG, setZeroG, onCreateNew }) {
  return (
    <div className="navbar">
      <div className="nav-left">
        <div className="title">
          <div className="main">Alien Matrimony</div>
          <div className="sub">finding intergalactic love since absolutely nobody asked us to</div>
        </div>
      </div>

      <div className="nav-center">
        <div className="navlinks">
          {['YOUR PROFILE','PROFILES','REJECTED','ACCEPTED','COMPATIBILITY','TRANSLATOR','EARTH SURVIVAL','CREATE ALIEN'].map(v=> (
            <button
              key={v}
              className={view===v? 'active':''}
              onClick={() => {
                if(v === 'CREATE ALIEN') {
                  if(onCreateNew) onCreateNew()
                  else setView(v)
                  return
                }
                setView(v)
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="nav-right">
        <label className="zerog">
          <div className="switch">
            <input type="checkbox" checked={zeroG} onChange={e=>setZeroG(e.target.checked)} />
            <span className="knob"></span>
          </div>
          <div className="label">ZERO-G</div>
        </label>
      </div>
    </div>
  )
}
