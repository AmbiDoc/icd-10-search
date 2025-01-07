# ICD-10 Search

A TypeScript library for parsing and searching medical classification systems in ClaML format, with a focus on ICD-10-GM (German Modification). While primarily developed for ICD-10-GM, it works with any classification system in ClaML format, including:

- International ICD-10
- ICD-10-GM (German Modification)
- OPS (Operationen- und Prozedurenschlüssel, German procedure classification)

## Features

- Fast parsing of ClaML XML files
- Efficient full-text search across codes and labels
- Support for code modifiers/sub-classifications
- TypeScript types included
- Simple Vue.js demo interface included

## Installation

```bash
npm install icd-10-search
```

## Usage

```typescript
import { parseClaML, CodeSearch } from 'icd-10-search'

// Parse ClaML XML file
const xml = fs.readFileSync('./icd10gm.xml', 'utf-8')
const { topLevelCodes } = parseClaML(xml)

// Create search instance
const search = new CodeSearch(topLevelCodes)

// Search for codes
const results = search.search('diabetes')
```

## Demo Interface

The repository includes a simple Vue.js demo interface in `src/playground/index.html`. To use it:

1. Parse your ClaML file using the playground script:

```bash
npm run dev
```

2. Serve the `src/playground` directory with a web server
3. Open `index.html` in your browser

## Getting Classification Files

Official ClaML files for ICD-10-GM and OPS can be downloaded from the German Federal Institute for Drugs and Medical Devices (BfArM):

[www.bfarm.de/DE/Kodiersysteme/Services/Downloads/\_node.html](https://www.bfarm.de/DE/Kodiersysteme/Services/Downloads/_node.html)

Look for files with "ClaML" in their name, such as:

- `icd10gm2024syst-claml_YYYYMMDD.xml` for ICD-10-GM
- `ops2024syst-claml_YYYYMMDD.xml` for OPS

## License

MIT
