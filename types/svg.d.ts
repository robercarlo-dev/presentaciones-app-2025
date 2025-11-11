// types/global.d.ts o types/svg.d.ts
declare module '*.svg' {
    import React from 'react'
    const SVG: React.VFC<React.SVGProps<SVGSVGElement>>
    export default SVG
  }
  
  // Para SVG como URL (opcional)
  declare module '*.svg?url' {
    const content: string
    export default content
  }