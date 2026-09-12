import React, {useEffect, useState} from 'react'
import supabase from '../supabaseClient'

function corrupt(text){
  const glyphs = ['¤','¶','∆','Ω','ø','λ','Ψ','Ȣ','∑','≡','≈','◊']
  // produce a string with the exact same length as input
  return text.split('').map(ch=>{
    if(ch === ' ') return ' ';
    if(Math.random()>0.6) return glyphs[Math.floor(Math.random()*glyphs.length)];
    // replace with a visually 'alien' letter but keep single char
    const code = 0x2500 + Math.floor(Math.random()*100);
    return String.fromCharCode(code);
  }).join('')
}

export default function Translator(){
  const [input, setInput] = useState('')
  const [out, setOut] = useState('')
  const [conf, setConf] = useState(0)

  async function translate(){
    // produce an output with exact same length as input
    const glitched = corrupt(input || '')
    setOut(glitched)
    setConf(Math.floor(50+Math.random()*50))

    try{
      await supabase.from('chat_messages').insert([{ sender: 'User', original_text: input, corrupted_text: glitched }])
    }catch(e){ /* ignore persist errors */ }

    setInput('')
  }

  function resetAll(){
    setInput('')
    setOut('')
    setConf(0)
  }

  return (
    <div className="translator">
      <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Type text to translate..." />
      <div className="row">
        <div style={{display:'flex',gap:8}}>
          <button onClick={translate}>TRANSLATE</button>
          <button onClick={resetAll} className="neumorphic reset">Reset</button>
        </div>
        <div className="conf">Confidence: {conf}%</div>
      </div>
      <div className="output">{out}</div>
    </div>
  )
}
