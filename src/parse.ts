import { XMLParser } from 'fast-xml-parser'
import { Code, CodeMeta } from './types/Code'

type ModifiersMap = Record<
	string,
	{
		subModifiers: {
			code: string
			label: string
		}[]
	}
>

type FlatCode = {
	code: string
	label: string
	subCodes: string[]
	modifiers: { code: string; subModifiers: string[] | null }[]
	meta: CodeMeta
}

function ensureArray<T>(maybeArray: T | T[] | undefined): T[] {
	if (!maybeArray) {
		return []
	}

	if (Array.isArray(maybeArray)) {
		return maybeArray
	}

	return [maybeArray]
}

function getRubricLabel(maybeArrayRubric: any) {
	if (Array.isArray(maybeArrayRubric)) {
		maybeArrayRubric = maybeArrayRubric.find((rubric: any) => rubric['@_kind'] === 'preferred')
	}

	return maybeArrayRubric.Label['#text']
}

function getMetaValue(meta: any, key: string) {
	return meta.find((m: any) => m['@_name'] === key)?.['@_value']
}

function getCodeMeta(meta: any): CodeMeta {
	meta = ensureArray(meta)

	const applicableForAmbulatory = getMetaValue(meta, 'Para295')
	const applicableForStationary = getMetaValue(meta, 'Para301')
	const minAge = getMetaValue(meta, 'AgeLow')
	const maxAge = getMetaValue(meta, 'AgeHigh')
	const sex = getMetaValue(meta, 'SexCode')

	return {
		applicableForAmbulatory: applicableForAmbulatory !== 'V',
		applicableForStationary: applicableForStationary !== 'V',
		minAge:
			minAge === '9999' || !minAge
				? null
				: minAge.startsWith('t')
					? 1
					: Number(minAge.substring(1)),
		maxAge:
			maxAge === '9999' || !maxAge
				? null
				: maxAge.startsWith('t')
					? 1
					: Number(maxAge.substring(1)),
		sex: sex === 'M' ? 'male' : sex === 'F' ? 'female' : null,
	}
}

function parseModifiers(clamlJson: any) {
	const modifiers: ModifiersMap = {}

	for (const subModifier of clamlJson.ModifierClass) {
		const modifierCode = subModifier['@_modifier']
		const subCode = subModifier['@_code']
		const label = getRubricLabel(subModifier.Rubric)

		if (!modifiers[modifierCode]) {
			modifiers[modifierCode] = { subModifiers: [] }
		}

		modifiers[modifierCode].subModifiers.push({ code: subCode, label })
	}

	return modifiers
}

function parseFlatCodes(clamlJson: any) {
	const codes: FlatCode[] = []

	for (const code of clamlJson.Class) {
		if (code['@_kind'] !== 'category') {
			continue
		}

		const codeCode = code['@_code']
		const label = getRubricLabel(code.Rubric)
		const subCodes = ensureArray(code.SubClass).map((c) => c['@_code'])
		const modifiers = ensureArray(code.ModifiedBy).map((m) => {
			const subModifiers = ensureArray(m.ValidModifierClass).map((vm) => vm['@_code'])

			return {
				code: m['@_code'],
				subModifiers: subModifiers.length > 0 ? subModifiers : null,
			}
		})

		codes.push({ code: codeCode, label, subCodes, modifiers, meta: getCodeMeta(code.Meta) })
	}

	return codes
}

function codeModifiersAsSubCodes(code: FlatCode, modifiers: ModifiersMap) {
	const subCodes: Code[] = []

	for (const modifier of code.modifiers) {
		const allSubModifiers = modifiers[modifier.code].subModifiers
		const subModifiers = modifier.subModifiers
			? allSubModifiers.filter((subModifier) => modifier.subModifiers!.includes(subModifier.code))
			: allSubModifiers

		const modifierAsCodes = subModifiers.map(
			(subModifier) =>
				({
					code: `${code.code}${subModifier.code}`,
					label: code.label,
					modifierLabel: subModifier.label,
					subCodes: [],
					meta: code.meta,
				}) satisfies Code
		)

		subCodes.push(...modifierAsCodes)
	}

	return subCodes
}

function flatCodesAndModifiersToCodes(flatCodes: FlatCode[], modifiers: ModifiersMap) {
	// Sort by code length DESC so that we can build the tree bottom-up
	flatCodes.sort((a, b) => b.code.length - a.code.length)

	const codes: Record<string, Code> = {}

	for (const code of flatCodes) {
		// Get all sub codes for this code
		const subCodes = code.subCodes.map((subCode) => codes[subCode])

		// Transform modifiers for this code into sub codes
		const modifierAsCodes = codeModifiersAsSubCodes(code, modifiers)
		modifierAsCodes.forEach((modifierCode) => {
			codes[modifierCode.code] = modifierCode
		})
		subCodes.push(...modifierAsCodes)

		// Add this code to the map
		codes[code.code] = {
			code: code.code,
			label: code.label,
			modifierLabel: null,
			subCodes,
			meta: code.meta,
		}
	}

	return {
		codeMap: codes,
		codes: Object.values(codes),
	}
}

function getTopLevelCodes(codes: Code[]) {
	// Get all root codes (codes that are not root codes of other codes)
	return codes.filter((code) => !codes.some((c) => c.subCodes.includes(code)))
}

export function parseClaML(xml: string) {
	const parser = new XMLParser({
		ignoreAttributes: false,
	})
	const json = parser.parse(xml).ClaML

	const modifiers = parseModifiers(json)
	const flatCodes = parseFlatCodes(json)

	const { codes, codeMap } = flatCodesAndModifiersToCodes(flatCodes, modifiers)

	const topLevelCodes = getTopLevelCodes(codes)

	return { codes, topLevelCodes, codeMap }
}
