import { pdf, type DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import type { Pkg } from '../lib/types'
import Brochure from './Brochure'

function element(pkg: Pkg) {
  return (<Brochure pkg={pkg} />) as unknown as ReactElement<DocumentProps>
}

export async function downloadBrochure(pkg: Pkg): Promise<void> {
  const blob = await pdf(element(pkg)).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Keyplex-${pkg.slug}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function brochureBlobUrl(pkg: Pkg): Promise<string> {
  const blob = await pdf(element(pkg)).toBlob()
  return URL.createObjectURL(blob)
}
