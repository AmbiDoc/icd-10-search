import fs from 'fs'
import { parseClaML } from '../parse'

const xml = fs.readFileSync('./ops.xml', 'utf-8')
const time = performance.now()
const json = parseClaML(xml)
console.log(`Parsing took ${performance.now() - time}ms`)

console.log(json.codes.length)

fs.writeFileSync('./ops-top-level.json', JSON.stringify(json.topLevelCodes))
