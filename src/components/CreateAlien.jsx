import React, {useState} from 'react'
import supabase from '../supabaseClient.js'

const makeBlank = () => ({
  name:'', species:'', planet:'', age:'', occupation:'', height:'', imageUrl:'',
  appendages:'', atmosphere:'', transportation:'', travelSpeed:'', language:'',
  biography:'', greenFlags:'', redFlags:'', partnerPreferences:''
})

export default function CreateAlien({ onCreate, initialData, onUpdate, onCancel }){
  const [form, setForm] = useState(() => initialData ? { ...initialData } : makeBlank())
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [stepError, setStepError] = useState('')
  function update(k,v){ setForm(prev=>({...prev,[k]:v})) }

  // when editing existing profile, populate form
  React.useEffect(()=>{
    if(initialData){ setForm({ ...initialData }) }
    else { setForm(makeBlank()) }
  },[initialData])

  // handle image upload and set data URL
  function handleFile(e){
    const f = e.target.files && e.target.files[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = ()=>{ update('imageUrl', reader.result) }
    reader.readAsDataURL(f)
  }

  async function submit(e){
    e.preventDefault()
    setLoading(true)
    const id = 'u'+Date.now()
    // if editing, call onUpdate and let parent persist
    if(initialData && onUpdate){
      const updated = {...initialData, ...form}
      try{ onUpdate(updated) }catch(e){ console.error('Update callback failed', e) }
      setForm(makeBlank())
      setStep(0)
      setLoading(false)
      return
    }

    const newAlien = {...form, id}
    try{
      const res = await supabase.from('aliens').insert([newAlien])
      if(res && res.error){ console.error('Supabase insert error', res.error) }
      const data = (res && res.data && res.data[0]) ? res.data[0] : newAlien
      onCreate(data)
      setForm(makeBlank())
      setStep(0)
    }catch(err){
      console.error('Insert failed', err)
      onCreate(newAlien)
      setForm(makeBlank())
      setStep(0)
    }finally{ setLoading(false) }
  }

  const steps = [
    {title:'Basic Info', content: (
      <table className="form-table section">
        <tbody>
          <tr><td>Name</td><td><input value={form.name} onChange={e=>update('name',e.target.value)} required /></td></tr>
          <tr><td>Species</td><td><input value={form.species} onChange={e=>update('species',e.target.value)} required /></td></tr>
          <tr><td>Planet</td><td><input value={form.planet} onChange={e=>update('planet',e.target.value)} required /></td></tr>
          <tr><td>Age</td><td><input className="no-spinner" type="number" value={form.age} onChange={e=>update('age', e.target.value === '' ? '' : Number(e.target.value))} required /></td></tr>
          <tr><td>Occupation</td><td><input value={form.occupation} onChange={e=>update('occupation',e.target.value)} required /></td></tr>
          <tr><td>Height</td><td><input value={form.height} onChange={e=>update('height',e.target.value)} required /></td></tr>
          <tr><td>Upload</td><td><label className="uploader">Choose file <input type="file" accept="image/*" onChange={handleFile} required /></label></td></tr>
          <tr><td>Image URL</td><td><input value={form.imageUrl} onChange={e=>update('imageUrl', e.target.value)} required /></td></tr>
          {form.imageUrl && (<tr><td>Preview</td><td><img src={form.imageUrl} alt="preview" style={{width:120,height:120,borderRadius:999,objectFit:'cover',border:'1px solid rgba(255,255,255,0.04)'}} /></td></tr>)}
        </tbody>
      </table>
    )},
    {title:'Physical & Environmental', content: (
      <table className="form-table section"><tbody>
        <tr><td>Appendages</td><td><input value={form.appendages} onChange={e=>update('appendages',e.target.value)} required /></td></tr>
        <tr><td>Atmosphere</td><td><input value={form.atmosphere} onChange={e=>update('atmosphere',e.target.value)} required /></td></tr>
        <tr><td>Transport</td><td><input value={form.transportation} onChange={e=>update('transportation',e.target.value)} required /></td></tr>
        <tr><td>Speed</td><td><input value={form.travelSpeed} onChange={e=>update('travelSpeed',e.target.value)} required /></td></tr>
        <tr><td>Language</td><td><input value={form.language} onChange={e=>update('language',e.target.value)} required /></td></tr>
      </tbody></table>
    )},
    {title:'Behavioral', content:(
      <table className="form-table section"><tbody>
        <tr><td>Biography</td><td><textarea value={form.biography} onChange={e=>update('biography',e.target.value)} required /></td></tr>
        <tr><td>Green Flags</td><td><input value={form.greenFlags} onChange={e=>update('greenFlags',e.target.value)} required /></td></tr>
        <tr><td>Red Flags</td><td><input value={form.redFlags} onChange={e=>update('redFlags',e.target.value)} required /></td></tr>
      </tbody></table>
    )},
    {title:'Match Criteria', content:(
      <table className="form-table section"><tbody>
        <tr><td>Partner Preferences</td><td><textarea value={form.partnerPreferences} onChange={e=>update('partnerPreferences',e.target.value)} required /></td></tr>
      </tbody></table>
    )}
  ]

  // Validation helpers: ensure required fields for each step are filled
  function validateStep(index){
    if(index===0){
      const required = ['name','species','planet','age','occupation','height','imageUrl']
      for(const k of required){ const v = form[k]; if(v===undefined || v===null || String(v).trim()==='') return false }
      if(Number.isNaN(Number(form.age)) || Number(form.age) <= 0) return false
      return true
    }
    if(index===1){
      const required = ['appendages','atmosphere','transportation','travelSpeed','language']
      for(const k of required){ const v = form[k]; if(v===undefined || v===null || String(v).trim()==='') return false }
      return true
    }
    if(index===2){
      const required = ['biography','greenFlags','redFlags']
      for(const k of required){ const v = form[k]; if(v===undefined || v===null || String(v).trim()==='') return false }
      return true
    }
    if(index===3){
      const required = ['partnerPreferences']
      for(const k of required){ const v = form[k]; if(v===undefined || v===null || String(v).trim()==='') return false }
      return true
    }
    return true
  }

  // Check if we can navigate to a target step (all previous steps valid)
  function canGoToStep(targetIndex){
    if(targetIndex<=0) return true
    for(let i=0;i<targetIndex;i++){ if(!validateStep(i)) return false }
    return true
  }

  return (
    <form className="create" onSubmit={submit}>
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        {steps.map((s,i)=> (
          <button type="button" key={s.title} onClick={()=>{ if(canGoToStep(i)) { setStepError(''); setStep(i) } }} disabled={!canGoToStep(i)} className={`step-btn ${i===step? 'active':''}`}>{s.title}</button>
        ))}
      </div>
      {stepError && <div className="step-error">{stepError}</div>}
      {steps[step].content}
      <div style={{display:'flex',gap:8,marginTop:8}}>
        {step>0 && <button type="button" className="btn primary" onClick={()=>{ setStepError(''); setStep(step-1) }}>Back</button>}
        {step<steps.length-1 && <button type="button" className="btn primary" onClick={()=>{
            if(!validateStep(step)){
              setStepError('Please complete all required fields in this step before continuing.')
              return
            }
            setStepError('')
            setStep(step+1)
          }}>Next</button>}
        {step===steps.length-1 && (
          <>
            {initialData && <button type="button" className="btn" onClick={()=>{ setForm(makeBlank()); onCancel && onCancel(); }}>Cancel</button>}
            <button type="submit" disabled={loading || !validateStep(step)} className="btn primary">{loading? (initialData? 'SAVING...':'CREATING...') : (initialData? 'Save Changes' : 'Create Alien')}</button>
          </>
        )}
      </div>
    </form>
  )
}
