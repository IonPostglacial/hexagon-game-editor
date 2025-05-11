import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Editor from './Editor.tsx'

createRoot(document.getElementById('editor')!).render(
  <StrictMode>
    <Editor />
  </StrictMode>,
)
