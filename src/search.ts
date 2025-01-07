import { Code } from './types/Code'

type IndexedCode = Code & {
	fullLabel: string
	fullLabelSegments: string[]
}

export class CodeSearch {
	private codes: IndexedCode[]
	private codeMap: Record<string, Code>

	constructor(topLevelCodes: Code[]) {
		// Flat map all codes from code tree (subCodes)
		function flatMapCodes(codes: Code[]): Code[] {
			return codes.flatMap((code) => [code, ...flatMapCodes(code.subCodes)])
		}

		this.codes = flatMapCodes(topLevelCodes).map((code) => {
			const fullLabel = (
				code.label + (code.modifierLabel ? ` ${code.modifierLabel}` : '')
			).toLowerCase()
			return {
				...code,
				fullLabel,
				fullLabelSegments: fullLabel.split(/[\s-]+/),
			}
		})

		// Create a map of codes for quick lookup
		this.codeMap = this.codes.reduce(
			(map, code) => {
				map[code.code] = code
				return map
			},
			{} as Record<string, Code>
		)
	}

	search(query: string): Code[] {
		const querySegments = query.toLowerCase().split(/[\s-]+/)

		const filteredCodes = this.codes.filter((code) =>
			querySegments.every((segment) => code.fullLabel.includes(segment))
		)

		const scoredCodes = filteredCodes.map((code) => {
			const score = querySegments.reduce((score, segment) => {
				return score + (code.fullLabelSegments.some((s) => s.startsWith(segment)) ? 1 : 0)
			}, 0)
			return { ...code, score }
		})

		return scoredCodes.sort((a, b) => b.score - a.score)
	}

	getCount() {
		return this.codes.length
	}

	getCode(code: string): Code | null {
		return this.codeMap[code] || null
	}
}
