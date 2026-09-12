import React, {useState} from 'react'

function randomSplit(total, parts){
  const arr = []
  let left = total
  for(let i=0;i<parts-1;i++){ const v = Math.max(0, Math.floor(Math.random()*left)); arr.push(v); left -= v }
  arr.push(left)
  return arr
}

export default function EarthSurvival({ aliens=[] }){
  const [selected, setSelected] = useState(aliens[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  function scoreFor(a){
    if(!a) return { total:0, breakdown: {} }
    // atmosphere matching
    const atmScore = a.atmosphere && a.atmosphere.includes('oxygen') ? 35 : 10
    const gravity = a.height && a.height.toString().includes('cm') ? 20 : 15
    const social = a.greenFlags? 20:10
    const danger = (a.redFlags && a.redFlags.length>5)? -10:0
    const adaptability = a.transportation && a.transportation.includes('warp')? 25:15
    const total = Math.max(0, Math.min(100, atmScore + gravity + social + adaptability + danger))
    return { total, breakdown: { atmosphere: atmScore, gravity, social, adaptability, danger } }
  }

  async function run(){
    setLoading(true)
    setResult(null)
    await new Promise(r=>setTimeout(r,600))
    const a = aliens.find(x=>x.id===selected)
    const out = scoreFor(a)
    setResult({ alien: a, ...out })
    setLoading(false)
  }

  return (
    <div className="earth-survival">
      <div className="row">
        <select value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">Select an alien profile</option>
          {aliens.map(a=> <option key={a.id} value={a.id}>{a.name} — {a.species}</option>)}
        </select>
        <button onClick={run} disabled={loading || !selected}>CALCULATE EARTH SURVIVAL</button>
      </div>
      {loading && <div className="loading">SCANNING: <span className="dots">...</span></div>}
      {result && (
        <div className="res">
          <div className="total">Survival: {result.total}%</div>
          <div className="breakdown">
            <div>Atmosphere tolerance: {result.breakdown.atmosphere}%</div>
            <div>Gravity impact: {result.breakdown.gravity}%</div>
            <div>Social adaptability: {result.breakdown.social}%</div>
            <div>Adaptability (transport): {result.breakdown.adaptability}%</div>
            <div>Human interaction risk: {result.breakdown.danger}%</div>
          </div>
          <div className="notes">Profile: {result.alien?.name} — {result.alien?.biography}</div>
        </div>
      )}
    </div>
  )
}
