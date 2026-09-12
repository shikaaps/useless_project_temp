import React, {useState} from 'react'
import supabase from '../supabaseClient'

function hashCode(s){ let h=0; for(let i=0;i<s.length;i++){ h = ((h<<5)-h)+s.charCodeAt(i); h |= 0 } return Math.abs(h) }

function makeSVGDataUri(alien){
  const seed = (alien.name||'x') + (alien.id||'0')
  const h = hashCode(seed)
  const hue = (h % 360)
  const base = `hsl(${hue} 60% 45%)`
  const eyeColor = '#071422'
  const pupil = '#0b0f12'
  const eyes = Math.max(1, (alien.eyes || 1))
  const append = (alien.appendages || '').toLowerCase()

  // head
  const head = `<ellipse cx='180' cy='130' rx='88' ry='90' fill='${base}' stroke='rgba(255,255,255,0.03)' stroke-width='2'/>`

  // eyes
  const eyesSVG = Array.from({length: eyes}).map((_,i)=>{
    const spacing = Math.max(20, 160 - (eyes-1)*20 + i*40)
    const cx = 80 + i*spacing/1.2
    return `<g><circle cx='${cx}' cy='120' r='14' fill='${eyeColor}'/><circle cx='${cx}' cy='120' r='7' fill='${pupil}'/></g>`
  }).join('')

  // mouth / features
  const mouth = `<path d='M120 170 q40 18 120 0' stroke='rgba(0,0,0,0.4)' stroke-width='3' fill='none' stroke-linecap='round'/>`

  // appendages stylized
  let appendSVG = ''
  if(append.includes('tent') || append.includes('tentacles')){
    appendSVG = Array.from({length:4}).map((_,i)=>{
      const x = 60 + i*60
      const path = `<path d='M${x} 200 q10 20 0 50' stroke='rgba(255,255,255,0.05)' stroke-width='10' stroke-linecap='round' fill='none'/>`
      return path
    }).join('')
  }else if(append.includes('antennae') || append.includes('antennae')){
    appendSVG = `<path d='M140 60 q10 -30 30 -40' stroke='rgba(255,255,255,0.06)' stroke-width='4' fill='none'/>`+
                `<circle cx='170' cy='30' r='6' fill='${pupil}'/>`
  }else if(append.includes('spine') || append.includes('spines')){
    appendSVG = Array.from({length:6}).map((_,i)=>`<rect x='${40+i*20}' y='40' width='6' height='24' fill='rgba(255,255,255,0.03)' transform='rotate(${(i-3)*6}  ${40+i*20} 40)'/>`).join('')
  } else {
    appendSVG = ''
  }

  const speciesText = (alien.species||'Alien')
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360' viewBox='0 0 360 360'>
    <rect width='100%' height='100%' fill='rgba(0,0,0,0)' />
    ${head}
    ${appendSVG}
    <g>${eyesSVG}</g>
    ${mouth}
    <text x='20' y='320' fill='rgba(233,246,255,0.8)' font-size='14' font-family='Rajdhani'>${speciesText}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export default function ProfileCard({ alien, onAbduct, zeroG, favorites=[], onToggleFavorite, isAbducted=false, onToggleAbduct, onEdit, onDelete }){
  const [abducting, setAbducting] = useState(false)
  const avatar = alien.imageUrl || alien.avatar || makeSVGDataUri(alien)

  const isFavorite = (favorites || []).includes(alien.id)
  const isSupreme = alien && alien.id === 'supreme'

  async function handleAbduct(){
    setAbducting(true)
    try{
      await supabase.from('abducted_matches').insert([{ alien_id: alien.id }])
    }catch(e){
      console.error('Abduct insert failed', e)
    }
    setTimeout(()=>{
      if(onAbduct) onAbduct(alien.id)
      setAbducting(false)
    },900)
  }

  function handleToggleFavorite(e){
    e.stopPropagation()
    if(onToggleFavorite) onToggleFavorite(alien.id)
  }

  function handleToggleAbduct(e){
    e.stopPropagation()
    if(onToggleAbduct) onToggleAbduct(alien.id)
  }

  return (
    <div className={`card ${isSupreme? 'supreme':''} ${zeroG? 'zero-g':''} ${abducting? 'abducting':''} ${isAbducted? 'is-abducted':''}`}>
      <div className="card-inner">
        <div className="pfp-col">
          <div className="avatar-wrap">
            <img src={avatar} alt={`${alien.name} avatar`} className="avatar" onError={(e)=>{ e.currentTarget.src = makeSVGDataUri(alien) }} />
          </div>
          <div className="likes-row">
            {!isSupreme && <button className={`fav ${isFavorite? 'on':''}`} onClick={handleToggleFavorite} aria-label="accept">{isFavorite? 'UN-ACCEPT':'ACCEPT'}</button>}
          </div>
        </div>

        <div className="meta-col">
          <div className="header-row">
            <div className="name">{alien.name}</div>
            <div className="species">{alien.species}</div>
          </div>

          <div className="chips">
            <span className="chip">{alien.planet}</span>
            <span className="chip">{alien.appendages}</span>
            <span className="chip">{alien.eyes} eyes</span>
            <span className="chip">{alien.transportation}</span>
          </div>

          <div className="bio">{(alien.biography||'').length>120? (alien.biography||'').slice(0,110)+'…' : alien.biography}</div>

          <div className="stat-row">
            <div className="stat">{alien.occupation}</div>
            <div className="stat">{alien.height}</div>
            <div className="stat">{alien.age}</div>
            <div className="stat">{alien.language}</div>
          </div>

          <div className="flags">
            <span className="chip green">{alien.greenFlags}</span>
            <span className="chip red">{alien.redFlags}</span>
          </div>

          <div className="actions">
            <div className="admin-actions">
              <button className="edit" onClick={(e)=>{ e.stopPropagation(); onEdit && onEdit(alien) }}>Edit</button>
              {!isSupreme && <button className="delete" onClick={(e)=>{ e.stopPropagation(); if(confirm('Delete this profile?')) onDelete && onDelete(alien.id) }}>Delete</button>}
            </div>
            {!isSupreme && (
              !isAbducted ? (
                <button className="abduct" onClick={handleAbduct}>{abducting? 'REJECTING…':'REJECT'}</button>
              ) : (
                <button className="abduct release" onClick={handleToggleAbduct}>UN-REJECT</button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
