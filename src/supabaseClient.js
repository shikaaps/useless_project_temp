// Lightweight Supabase shim: stores inserts to localStorage when no real Supabase configured.
const SUPABASE_URL = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined
const SUPABASE_KEY = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined

let supabase = null

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    // Attempt to create a real client if available in the environment.
    // We avoid adding @supabase/supabase-js as a dependency; if you want a real client,
    // install it and replace this shim.
    supabase = { real: true }
  } catch (e) {
    supabase = null
  }
}

if (!supabase) {
  supabase = (function(){
    // Simple event dispatcher for inserts
    function dispatchInsert(table, rows){
      try{
        const ev = new CustomEvent('supabase_insert', { detail: { table, rows } })
        window.dispatchEvent(ev)
      }catch(e){ /* ignore */ }
    }

    return {
      from(table){
        return {
          insert: async (rows) => {
            try {
              const key = 'am_supabase_' + table
              const existing = JSON.parse(localStorage.getItem(key) || '[]')
              const toInsert = rows.map(r => ({ ...r, id: r.id || ('db_' + Date.now() + '_' + Math.floor(Math.random()*1000)) }))
              const next = [...toInsert, ...existing]
              localStorage.setItem(key, JSON.stringify(next))
              // notify listeners
              dispatchInsert(table, toInsert)
              return { data: toInsert, error: null }
            } catch (error) {
              return { data: null, error }
            }
          },
          delete: async (opts) => {
            try {
              const key = 'am_supabase_' + table
              const existing = JSON.parse(localStorage.getItem(key) || '[]')
              if(!opts || typeof opts !== 'object'){
                // no filter provided: remove nothing
                return { data: [], error: null }
              }
              const removed = []
              const keep = existing.filter(item => {
                for(const k of Object.keys(opts)){
                  if(String(item[k]) !== String(opts[k])){
                    return true // keep
                  }
                }
                // all keys matched -> remove
                removed.push(item)
                return false
              })
              localStorage.setItem(key, JSON.stringify(keep))
              return { data: removed, error: null }
            } catch (error) {
              return { data: null, error }
            }
          },
          select: async (cols) => {
            try {
              const key = 'am_supabase_' + table
              const existing = JSON.parse(localStorage.getItem(key) || '[]')
              return { data: existing, error: null }
            } catch (error) {
              return { data: null, error }
            }
          }
        }
      },
      // minimal channel shim supporting .on('postgres_changes', opts, cb).subscribe()
      channel(name){
        return {
          on(event, opts, cb){
            const handler = (e) => {
              try{
                const detail = e.detail || {}
                if(detail.table && opts && opts.table && detail.table === opts.table){
                  // emulate Postgres change payloads
                  detail.rows.forEach(r => cb({ new: r }))
                }
              }catch(err){ }
            }
            window.addEventListener('supabase_insert', handler)
            return {
              subscribe: () => ({
                unsubscribe: () => window.removeEventListener('supabase_insert', handler)
              })
            }
          }
        }
      }
    }
  })()
}

export default supabase
