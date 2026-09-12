import React, {useEffect, useMemo, useState} from 'react'
import baseAliens from './data/aliens'
import supabase from './supabaseClient'
import NavBar from './components/NavBar'
import ErrorBoundary from './components/ErrorBoundary'
import ProfileCard from './components/ProfileCard'
import Filters from './components/Filters'
import CreateAlien from './components/CreateAlien'
import Compatibility from './components/Compatibility'
import Translator from './components/Translator'
import EarthSurvival from './components/EarthSurvival'
import gromvorImg from "./assets/Grom-Vor-09.png";

function useLocalStorage(key, initial){
  const [state, setState] = useState(()=>{
    try{ const s = localStorage.getItem(key); return s? JSON.parse(s): initial }catch(e){ return initial }
  })
  useEffect(()=>{ localStorage.setItem(key, JSON.stringify(state)) },[key,state])
  return [state, setState]
}

export default function App(){
  const [view, setView] = useState('PROFILES')
  const [zeroG, setZeroG] = useLocalStorage('am_zero_g', false)
  const [abducted, setAbducted] = useLocalStorage('am_abducted', [])
  const [favorites, setFavorites] = useLocalStorage('am_favorites', [])
  const [created, setCreated] = useLocalStorage('am_created', [])
  const [systemMessages, setSystemMessages] = useState([])
  const [toast, setToast] = useState(null)

  // Show transient toast when systemMessages updates
  useEffect(()=>{
    if(systemMessages && systemMessages.length>0){
      setToast(systemMessages[0])
      const id = setTimeout(()=> setToast(null), 2500)
      return ()=> clearTimeout(id)
    }
  },[systemMessages])

  const allAliens = useMemo(()=>{
    const merged = [...created, ...baseAliens]
    const map = new Map()
    for(const a of merged){ if(!map.has(a.id)) map.set(a.id, a) }
    return Array.from(map.values())
  }, [created])

  const [editing, setEditing] = useState(null)
  const [createKey, setCreateKey] = useState(0)
  const defaultSupreme = { 
    id: 'supreme', 
    name: 'Grom-Vor-09', 
    species: 'Carcharoth', 
    planet: 'Thalassa-Prime', 
    age: 64, 
    occupation: 'Warlord', 
    height: '8ft 4in', 
    imageUrl: gromvorImg, 
    avatar: gromvorImg, 
    appendages: 'Fin & Tail', 
    atmosphere: 'Sulfuric Methane', 
    transportation: 'Heavy Dreadnought', 
    travelSpeed: 'Sub-light', 
    language: 'High Karkan', 
    biography: 'Battle-hardened warlord seeking a companion who respects honor, heavy armor, and massive war axes.', 
    greenFlags: 'Protective, extremely loyal, respects strength', 
    redFlags: 'Smashes furniture during intense discussions', 
    partnerPreferences: 'Must survive combat training', 
    eyes: 'Yellow', 
    lifespan: 200, 
    diet: 'Carnivorous' 
  }
const [supreme, setSupreme] = useLocalStorage('am_supreme_v2', defaultSupreme)

  // On initial load, fetch aliens stored via supabase shim and merge into created list
  useEffect(()=>{
    let mounted = true
    async function fetchCustom(){
      try{
        const res = await supabase.from('aliens').select('*')
        if(res && res.data && mounted){
          // merge without duplicating ids
          setCreated(prev=>{
            const existingIds = new Set(prev.map(p=>p.id))
            const incoming = res.data.filter(r=>!existingIds.has(r.id))
            return [...incoming, ...prev]
          })
        }
      }catch(e){
        console.error('Failed to fetch custom aliens', e)
      }
    }
    fetchCustom()
    return ()=>{ mounted = false }
  }, [])

  function onAbduct(id){
    if(abducted.includes(id)) return
    const next = [...abducted, id]
    setAbducted(next)
    // switch view to Rejected tab when an item is rejected
    setView('REJECTED')
    // ensure an abducted (rejected) profile is not also in favorites
    setFavorites(f=> f.filter(x=> x!==id))
    const who = allAliens.find(a=>a.id===id)
    const msg = `REJECTION LOG: ${who?.name||id} rejected.`
    setSystemMessages(m=>[msg,...m].slice(0,6))
  }

  // toggle abducted status (remove if exists)
  function toggleAbduct(id){
    if(abducted.includes(id)){
      const next = abducted.filter(x=>x!==id)
      setAbducted(next)
      // remove from shim
      supabase.from('abducted_matches').delete({ alien_id: id }).catch(()=>{})
      setSystemMessages(m=>[`RECONSIDER: ${id} removed from rejected list.`,...m].slice(0,6))
    }else{
      onAbduct(id)
    }
  }

  // favorites
  async function toggleFavorite(id){
    if(favorites.includes(id)){
      const next = favorites.filter(x=>x!==id)
      setFavorites(next)
      try{ await supabase.from('favorites').delete({ alien_id: id }) }catch(e){ }
      setSystemMessages(m=>[`ACCEPT REMOVED: ${id}`,...m].slice(0,6))
    }else{
      const next = [id, ...favorites]
      setFavorites(next)
      // switch view to Accepted tab when an item is accepted
      setView('ACCEPTED')
      // ensure accepted profiles are removed from rejected
      setAbducted(a=> a.filter(x=> x!==id))
      try{ await supabase.from('favorites').insert([{ alien_id: id }]) }catch(e){ }
      setSystemMessages(m=>[`ACCEPTED: ${id}`,...m].slice(0,6))
    }
  }

  function onCreate(obj){
    const avatarSeed = obj.name + Date.now()
    const alien = {...obj, id: obj.id || 'c'+Date.now(), name: obj.name||'Unnamed', avatarSeed}
    setCreated(prev=>[alien,...prev])
    setView('PROFILES')
    setSystemMessages(m=>[`CREATION: ${alien.name} added to registry.`,...m].slice(0,6))
  }

  async function onUpdate(alien){
    // special handling for the supreme leader profile
    if(alien && alien.id === 'supreme'){
      setSupreme(alien)
      setEditing(null)
      setView('PROFILES')
      setSystemMessages(m=>[`UPDATE: Supreme profile updated.`,...m].slice(0,6))
      return
    }
    try{
      await supabase.from('aliens').delete({ id: alien.id })
    }catch(e){ }
    try{
      await supabase.from('aliens').insert([alien])
    }catch(e){ }
    setCreated(prev=>{
      const found = prev.find(p=>p.id===alien.id)
      if(found){ return prev.map(p=> p.id===alien.id? alien: p) }
      return [alien, ...prev]
    })
    setEditing(null)
    setView('PROFILES')
    setSystemMessages(m=>[`UPDATE: ${alien.name} updated.`,...m].slice(0,6))
  }

  async function onDelete(id){
    try{
      await supabase.from('aliens').delete({ id })
    }catch(e){ }
    // remove from created if present
    setCreated(prev=> prev.filter(p=> p.id!==id))
    // if this id exists only in baseAliens, add a tombstone so it is hidden
    const existsInBase = baseAliens.find(a=>a.id===id)
    if(existsInBase){ setCreated(prev=> [{ id, _deleted:true }, ...prev.filter(p=>p.id!==id)]) }
    // remove any favorites/abducted references
    setFavorites(f=> f.filter(x=> x!==id))
    setAbducted(a=> a.filter(x=> x!==id))
    setSystemMessages(m=>[`DELETE: ${id} removed from registry.`,...m].slice(0,6))
  }

  const [filters, setFilters] = useState({species:'',appendages:'',atmosphere:'',diet:'',eyes:'',transportation:'',lifespan:''})

  function openCreateNew(){
    setEditing(null)
    setCreateKey(k => k + 1)
    setView('CREATE ALIEN')
  }

  useEffect(()=>{
    if(view === 'CREATE ALIEN' && editing === null){
      setCreateKey(k => k + 1)
    }
  }, [view, editing])

  function resetFilters(){ setFilters({species:'',appendages:'',atmosphere:'',diet:'',eyes:'',transportation:'',lifespan:''}) }

  const speciesOptions = Array.from(new Set(allAliens.map(a=>a.species))).filter(Boolean)
  const appendOptions = Array.from(new Set(allAliens.map(a=>a.appendages))).filter(Boolean)
  const atmosphereOptions = Array.from(new Set(allAliens.map(a=>a.atmosphere))).filter(Boolean)
  const dietOptions = Array.from(new Set(allAliens.map(a=>a.diet))).filter(Boolean)
  const transportOptions = Array.from(new Set(allAliens.map(a=>a.transportation))).filter(Boolean)

  const filtered = allAliens.filter(a=>{
    if(a._deleted) return false
    if(filters.species && a.species!==filters.species) return false
    if(filters.appendages && a.appendages!==filters.appendages) return false
    if(filters.atmosphere && a.atmosphere!==filters.atmosphere) return false
    if(filters.diet && a.diet!==filters.diet) return false
    if(filters.eyes && String(a.eyes)!==filters.eyes) return false
    if(filters.transportation && a.transportation!==filters.transportation) return false
    if(filters.lifespan){
      if(filters.lifespan==='short' && a.lifespan>=50) return false
      if(filters.lifespan==='medium' && (a.lifespan<50||a.lifespan>500)) return false
      if(filters.lifespan==='long' && a.lifespan<=500) return false
    }
    // remove any accepted or rejected items from main profiles feed
    if(favorites.includes(a.id)) return false
    if(abducted.includes(a.id)) return false
    return true
  })

  useEffect(()=>{
    // Toggle a global class on the root app container so Zero-G affects all elements
    // (the `app` element receives the class via its `className` binding)
    // keep this effect no-op to preserve previous behavior side-effects if needed
    return () => {}
  },[zeroG])

  return (
    <ErrorBoundary>
      <div className={`app ${zeroG ? 'zero-g-mode' : ''}`}>
        <NavBar view={view} setView={setView} zeroG={zeroG} setZeroG={setZeroG} onCreateNew={openCreateNew} />

        <div className={`container ${view === 'PROFILES' ? 'with-left' : 'full'}`}>
          {view === 'PROFILES' && (
            <aside className="left">
              <Filters
                filters={filters}
                setFilters={setFilters}
                reset={resetFilters}
                speciesOptions={speciesOptions}
                appendOptions={appendOptions}
                atmosphereOptions={atmosphereOptions}
                dietOptions={dietOptions}
                transportOptions={transportOptions}
              />
            </aside>
          )}

          <main className="main">
            {view === 'YOUR PROFILE' && (
              <div className="main-profile">
                <ProfileCard
                  alien={supreme}
                  onAbduct={() => {}}
                  zeroG={zeroG}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  isAbducted={abducted.includes(supreme.id)}
                  onToggleAbduct={toggleAbduct}
                  onEdit={(al) => { setEditing(al); setView('CREATE ALIEN') }}
                />
              </div>
            )}

            {view === 'PROFILES' && (
              <div className="profiles-feed">
                <div className="grid">
                  {filtered.length === 0 && <div className="none">No profiles match the current filters.</div>}
                  {filtered.map((alien) => (
                    <ProfileCard
                      key={alien.id}
                      alien={alien}
                      onAbduct={onAbduct}
                      zeroG={zeroG}
                      favorites={favorites}
                      onToggleFavorite={toggleFavorite}
                      isAbducted={abducted.includes(alien.id)}
                      onToggleAbduct={toggleAbduct}
                      onEdit={(al) => { setEditing(al); setView('CREATE ALIEN') }}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {view === 'REJECTED' && (
              <div className="rejected">
                <h2>REJECTED</h2>
                <div className="grid">
                  {abducted.length === 0 && <div className="none">No profiles rejected.</div>}
                  {abducted.map((id) => {
                    const a = allAliens.find((x) => x.id === id)
                    return a ? (
                      <ProfileCard
                        key={id}
                        alien={a}
                        onAbduct={() => {}}
                        zeroG={zeroG}
                        isAbducted={true}
                        onToggleAbduct={toggleAbduct}
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                        onEdit={(al) => { setEditing(al); setView('CREATE ALIEN') }}
                        onDelete={onDelete}
                      />
                    ) : null
                  })}
                </div>
              </div>
            )}

            {view === 'ACCEPTED' && (
              <div className="accepted">
                <h2>ACCEPTED</h2>
                <div className="grid">
                  {favorites.length === 0 && <div className="none">No profiles accepted.</div>}
                  {favorites.map((id) => {
                    const a = allAliens.find((x) => x.id === id)
                    return a ? (
                      <ProfileCard
                        key={id}
                        alien={a}
                        onAbduct={onAbduct}
                        zeroG={zeroG}
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                        isAbducted={abducted.includes(a.id)}
                        onToggleAbduct={toggleAbduct}
                        onEdit={(al) => { setEditing(al); setView('CREATE ALIEN') }}
                        onDelete={onDelete}
                      />
                    ) : null
                  })}
                </div>
              </div>
            )}

            {view === 'COMPATIBILITY' && <Compatibility aliens={allAliens} />}
            {view === 'TRANSLATOR' && <Translator />}
            {view === 'EARTH SURVIVAL' && (
              <div className="survival-panel">
                <EarthSurvival aliens={allAliens} />
              </div>
            )}
            {view === 'CREATE ALIEN' && (
              <CreateAlien
                key={createKey}
                onCreate={onCreate}
                initialData={editing}
                onUpdate={onUpdate}
                onCancel={() => { setEditing(null); setView('PROFILES') }}
              />
            )}
          </main>
        </div>

        {toast && (
          <div className="toast" role="status" aria-live="polite">{toast}</div>
        )}
      </div>
    </ErrorBoundary>
  )
}
