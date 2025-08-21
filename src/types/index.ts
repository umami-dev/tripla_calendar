export type LegendType = 'circle' | 'triangle' | 'cross'
export type LocaleType = "ja-JP" | "en-US" | "ko-KR" | "zh-CN" | "zh-TW" | "id-ID" | "th-TH" | "ar-SA"
export type SelectionModeType = "single" | "range" | "multiple"
export type AvailabilityType = 'price' | 'status'
export type SupportedLocaleType = "ja" | "en" | "ko" | "zh_Hans" | "zh_Hant" | "id" | "th" | "ar"
export type SupportedHolidayCountryType = "JP"

export interface AvailabilityItem {
	type: AvailabilityType
	inventory: Record<string, string>
}

export interface LegendItem {
	label: string
	color?: string
	type?: LegendType
}

export interface CalendarOptions {
	// main
	target: HTMLElement | string
	dateLocale?: LocaleType
	startWeekOn?: number
	selectionMode?: SelectionModeType

	// disable rules
	minDate?: Date
	maxDate?: Date
	isDateDisabled?: (date: Date) => boolean

	// info
	hasInfo?: boolean

	// shown months
	shownMonths?: 1 | 2

	// availability
	availability?: AvailabilityItem

	// holidays
	enableHolidays?: boolean
	holidayCountry?: SupportedHolidayCountryType
	holidayLanguage?: SupportedLocaleType

	// legends
	primaryLegends?: LegendItem[]
	secondaryLegends?: LegendItem[]

	// initial month to show
	initialDate?: Date

	// accessibility
	ariaLabelMonth?: (date: Date) => string
}