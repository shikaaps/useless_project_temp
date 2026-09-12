import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { error: null, info: null } }
  componentDidCatch(error, info){
    console.error('ErrorBoundary caught', error, info)
    this.setState({ error, info })
  }
  render(){
    if(this.state.error){
      return (
        <div style={{padding:24}}>
          <h2 style={{color:'#ff8aa3'}}>Something went wrong</h2>
          <pre style={{whiteSpace:'pre-wrap',background:'#111',padding:12,borderRadius:8,color:'#ffd7e6'}}>{String(this.state.error && this.state.error.toString())}</pre>
          <details style={{color:'#ddd',marginTop:12}}>
            <summary>Stack / info</summary>
            <pre style={{whiteSpace:'pre-wrap',background:'#0b0b0b',padding:12,borderRadius:8,color:'#ddd'}}>{this.state.info && this.state.info.componentStack}</pre>
          </details>
        </div>
      )
    }
    return this.props.children
  }
}
