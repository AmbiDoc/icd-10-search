export interface Code {
	code: string
	label: string
	modifierLabel: string | null

	meta: CodeMeta

	subCodes: Code[]
}

export interface CodeMeta {
	applicableForAmbulatory: boolean
	applicableForStationary: boolean
	minAge: number | null
	maxAge: number | null
	sex: 'male' | 'female' | null
}
