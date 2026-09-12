import React from 'react'

export default function Filters({ filters, setFilters, reset, speciesOptions, appendOptions, atmosphereOptions, dietOptions, transportOptions }){
  function update(k,v){
    // Auto-reset all other filters when one is changed
    setFilters(prev=>{
      const keys = Object.keys(prev || {})
      const next = {}
      keys.forEach(kk=> next[kk]='')
      next[k] = v
      return next
    })
  }
  return (
    <div className="filters">
      <select value={filters.species} onChange={e=>update('species', e.target.value)}>
        <option value="">All Species</option>
        {speciesOptions.map(s=> <option key={s}>{s}</option>)}
      </select>
      <select value={filters.appendages} onChange={e=>update('appendages', e.target.value)}>
        <option value="">Any Appendages</option>
        {appendOptions.map(s=> <option key={s}>{s}</option>)}
      </select>
      <select value={filters.atmosphere} onChange={e=>update('atmosphere', e.target.value)}>
        <option value="">Any Atmosphere</option>
        {atmosphereOptions.map(s=> <option key={s}>{s}</option>)}
      </select>
      <select value={filters.diet} onChange={e=>update('diet', e.target.value)}>
        <option value="">Any Diet</option>
        {dietOptions.map(s=> <option key={s}>{s}</option>)}
      </select>
      <select value={filters.eyes} onChange={e=>update('eyes', e.target.value)}>
        <option value="">Any Eyes</option>
        <option>0</option>
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>4</option>
        <option>5</option>
        <option>6</option>
        <option>8</option>
      </select>
      <select value={filters.transportation} onChange={e=>update('transportation', e.target.value)}>
        <option value="">Any Transport</option>
        {transportOptions.map(s=> <option key={s}>{s}</option>)}
      </select>
      <select value={filters.lifespan} onChange={e=>update('lifespan', e.target.value)}>
        <option value="">Any Lifespan</option>
        <option value="short">Short (&lt;50)</option>
        <option value="medium">Medium (50-500)</option>
        <option value="long">Long (&gt;500)</option>
      </select>
      <button className="reset" onClick={reset}>Reset Filters</button>
    </div>
  )
}
