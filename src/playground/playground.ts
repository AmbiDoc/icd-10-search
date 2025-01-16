import fs from 'fs'
import { parseClaML } from '../parse'

const xml = fs.readFileSync('./icd10.xml', 'utf-8')
const time = performance.now()
const json = parseClaML(xml)
console.log(`Parsing took ${performance.now() - time}ms`)

console.log(json.codes.length)

fs.writeFileSync('./icd10.json', JSON.stringify(json.topLevelCodes))
