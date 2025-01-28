import React from 'react'
import { useState} from 'react'

import ReactDOM from 'react-dom/client'
import { LhasaComponent } from './Lhasa.tsx'
import './index.scss'
import Module from '/lhasa.js?url'
// /* @vite-ignore */
// const Module = await import(`/public/lhasa.js`)
// Type definitions for TS linter, auto-generated by Embind
import { MainModule } from './lhasa'
import { FormControl, FormControlLabel, Switch } from '@mui/material'

const lhasa_module : MainModule = await Module();



export function App() {
  const [showLhasa, setShowLhasa] = useState(true);

  return (
    <>
    <FormControl>
      <FormControlLabel
        control={<Switch checked={showLhasa} onChange={(event) => setShowLhasa(event.target.checked)} />}
        label={"Show Lhasa"} 
      />
    </FormControl>
     {showLhasa && 
      <LhasaComponent 
        Lhasa={lhasa_module} 
        show_top_panel={true}
        // show_footer={true}
        icons_path_prefix='/icons'
        smiles_callback={(internal_id, id_from_prop, smiles) => console.log("ID=", internal_id," SMILES=", smiles, "Id-From-Prop", id_from_prop)}
        // Works when using `npx vite server --port 5174`
        // Inside `vite.config.js` there is a proxy setup to redirect this to an actual bansu instance.
        // CORS stuff is broken for localhost connections, it seems.
        bansu_endpoint='http://localhost:5174'
      />}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)