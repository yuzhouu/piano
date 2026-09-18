import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

// Pin upstream data so a rebuild never silently changes the instrument samples.
const revision = '23ca907d4370a04fd89ca483a92915e4d6159ab9'
const instruments = ['0000', '0100', '0130', '0240']
const directory = new URL('../public/soundfonts/', import.meta.url)
await mkdir(directory, { recursive: true })
const manifest = []
for (const program of instruments) {
  const name = `${program}_GeneralUserGS_sf2_file`
  const url = `https://raw.githubusercontent.com/surikov/webaudiofontdata/${revision}/sound/${name}.js`
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`${response.status}: ${url}`)
  const content = await response.text()
  if (!content.includes(`var _tone_${name}`)) throw new Error(`Unexpected soundfont: ${name}`)
  await writeFile(new URL(`${name}.js`, directory), content)
  manifest.push({ file: `${name}.js`, url, bytes: Buffer.byteLength(content), sha256: createHash('sha256').update(content).digest('hex') })
  console.log(`${name}: ${(Buffer.byteLength(content) / 1024).toFixed(0)} KB`)
}
await writeFile(new URL('sources.json', directory), JSON.stringify({ revision, instruments: manifest }, null, 2) + '\n')
