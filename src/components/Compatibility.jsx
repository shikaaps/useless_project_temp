import React, { useEffect, useMemo, useState } from 'react'

function clamp(score, min = 0, max = 100) {
  return Math.min(max, Math.max(min, score))
}

function makeCompatibility(a, b) {
  const reasons = []
  let score = 50

  const normalize = (value) => String(value || '').toLowerCase()
  const samePlanet = normalize(a.planet) === normalize(b.planet)
  const sameSpecies = normalize(a.species) === normalize(b.species)
  const sameAtmosphere = normalize(a.atmosphere) === normalize(b.atmosphere)
  const sameTransport = normalize(a.transportation) === normalize(b.transportation)
  const sameAppendages = normalize(a.appendages) === normalize(b.appendages)
  const sameDiet = normalize(a.diet) === normalize(b.diet)

  if (samePlanet) {
    score += 12
    reasons.push(`${a.name} and ${b.name} share a home world: ${a.planet}. That's strong cultural alignment.`)
  } else {
    reasons.push(`Different home worlds create a thrilling cross-planet dynamic between ${a.name} and ${b.name}.`)
  }

  if (sameSpecies) {
    score += 15
    reasons.push(`They are both ${a.species}, so their biology and social cues are highly compatible.`)
  }

  if (sameAtmosphere) {
    score += 18
    reasons.push(`Both thrive in ${a.atmosphere} environments, making habitat planning easy.`)
  } else if ((normalize(a.atmosphere).includes('oxygen') && normalize(b.atmosphere).includes('oxygen')) || (normalize(a.atmosphere).includes('oxygen') && normalize(b.atmosphere).includes('rich'))) {
    score += 10
    reasons.push(`Their atmospheres are breathable enough for a mutual long-term living arrangement.`)
  } else {
    score -= 4
    reasons.push(`Their atmosphere preferences differ, which could mean extra adaptation work.`)
  }

  if (sameTransport) {
    score += 14
    reasons.push(`They both prefer ${a.transportation}, so travel plans are effortlessly aligned.`)
  } else {
    score += 6
    reasons.push(`Their travel styles differ, but the combination creates a fun adventure rhythm.`)
  }

  if (sameAppendages) {
    score += 8
    reasons.push(`Matching appendage styles make touch, greeting rituals, and body language smoother.`)
  }

  if (sameDiet) {
    score += 10
    reasons.push(`They share a ${a.diet} diet, which simplifies meal logistics and shared dining plans.`)
  } else {
    reasons.push(`Their dietary preferences differ, but that can create a playful culinary fusion.`)
  }

  if (Number(a.eyes || 0) === Number(b.eyes || 0)) {
    score += 8
    reasons.push(`They have matching eye counts, which makes visual communication feel natural.`)
  }

  if ((Number(a.lifespan || 0) + Number(b.lifespan || 0)) > 600) {
    score += 10
    reasons.push(`Their life cycles are long enough to support a deep, enduring bond.`)
  }

  if ((a.greenFlags || '').length > 0 && (b.greenFlags || '').length > 0) {
    score += 8
    reasons.push(`Their shared strengths—${a.greenFlags} and ${b.greenFlags}—make them emotionally complementary.`)
  }

  if ((a.redFlags || '').length > 0 && (b.redFlags || '').length > 0) {
    score -= 6
    reasons.push(`They do both carry friction points, but those differences can be navigated with honest communication.`)
  }

  const summary = reasons.slice(0, 4).join(' ')
  const finalScore = clamp(Math.round(score), 18, 99)

  return {
    score: finalScore,
    reasons,
    summary,
  }
}

export default function Compatibility({ aliens = [] }) {
  const available = useMemo(() => aliens.filter(Boolean), [aliens])

  const [leftId, setLeftId] = useState(available[0]?.id || '')
  const [rightId, setRightId] = useState(available[1]?.id || available[0]?.id || '')
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!available.length) return
    if (!available.some((alien) => alien.id === leftId)) setLeftId(available[0].id)
    if (!available.some((alien) => alien.id === rightId)) setRightId(available[1]?.id || available[0].id)
  }, [available, leftId, rightId])

  const leftAlien = available.find((alien) => alien.id === leftId) || available[0]
  const rightAlien = available.find((alien) => alien.id === rightId) || available[1] || available[0]

  function handleSelectChange(nextLeftId, nextRightId) {
    setChecked(false)
    if (nextLeftId) setLeftId(nextLeftId)
    if (nextRightId) setRightId(nextRightId)
  }

  const comparison = useMemo(() => {
    if (!leftAlien || !rightAlien) return null
    if (leftAlien.id === rightAlien.id) {
      return {
        score: 100,
        reasons: ['They are the same profile, so the compatibility is perfectly aligned by default.'],
        summary: 'Same profile selected for a perfect match simulation.',
      }
    }
    return makeCompatibility(leftAlien, rightAlien)
  }, [leftAlien, rightAlien])

  return (
    <div className="compatibility-panel">
      <div className="compatibility-header">
        <div>
          <p className="eyebrow">LOVE QUOTIENT</p>
          <h2>COMPATIBILITY</h2>
        </div>
        <div className="compat-pill">Compare two alien profiles</div>
      </div>

      {available.length < 2 ? (
        <div className="none">Add at least two profiles to compare love compatibility.</div>
      ) : (
        <>
          <div className="compat-selection-row">
            <label className="compat-field">
              <span>Alien A</span>
              <select value={leftId} onChange={(e) => handleSelectChange(e.target.value, rightId)}>
                {available.map((alien) => (
                  <option key={alien.id} value={alien.id}>{alien.name}</option>
                ))}
              </select>
            </label>

            <label className="compat-field">
              <span>Alien B</span>
              <select value={rightId} onChange={(e) => handleSelectChange(leftId, e.target.value)}>
                {available.map((alien) => (
                  <option key={alien.id} value={alien.id}>{alien.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="compat-action-row">
            <button
              type="button"
              className="compat-check-btn"
              onClick={() => setChecked(true)}
              disabled={!leftId || !rightId}
            >
              Check compatibility
            </button>
          </div>

          {checked && comparison && (
            <div className="compat-result">
              <div className="compat-score-box">
                <div className="compat-score-label">Compatibility score</div>
                <div className="compat-score-number">{comparison.score}%</div>
                <div className="compat-meter">
                  <span style={{ width: `${comparison.score}%` }} />
                </div>
              </div>

              <div className="compat-compare-cards">
                <div className="compat-profile-card">
                  <h3>{leftAlien.name}</h3>
                  <p>{leftAlien.species}</p>
                  <ul>
                    <li>Planet: {leftAlien.planet}</li>
                    <li>Atmosphere: {leftAlien.atmosphere}</li>
                    <li>Transport: {leftAlien.transportation}</li>
                    <li>Diet: {leftAlien.diet}</li>
                  </ul>
                </div>

                <div className="compat-profile-card">
                  <h3>{rightAlien.name}</h3>
                  <p>{rightAlien.species}</p>
                  <ul>
                    <li>Planet: {rightAlien.planet}</li>
                    <li>Atmosphere: {rightAlien.atmosphere}</li>
                    <li>Transport: {rightAlien.transportation}</li>
                    <li>Diet: {rightAlien.diet}</li>
                  </ul>
                </div>
              </div>

              <div className="compat-reason-box">
                <h4>Detailed readout</h4>
                <p>{comparison.summary}</p>
                <ul>
                  {comparison.reasons.map((reason, index) => (
                    <li key={`${reason}-${index}`}>{reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
