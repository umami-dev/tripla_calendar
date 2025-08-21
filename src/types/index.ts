export type LegendType = 'circle' | 'triangle' | 'cross'
export type LocaleType = "ja-JP" | "en-US" | "ko-KR" | "zh-CN" | "zh-TW" | "id-ID" | "th-TH" | "ar-SA"
export type SelectionModeType = "single" | "range" | "multiple"
export type AvailabilityType = 'price' | 'status'
export type SupportedLocaleType = "ja" | "en" | "ko" | "zh_Hans" | "zh_Hant" | "id" | "th" | "ar"
export type SupportedHolidayCountryType = "JP"
export type ActiveInputType = "start" | "end" | null
export type ShownMonthsType = 1 | 2

export interface AvailabilityItem {
	type: AvailabilityType
	inventory: Record<string, string>
}

export interface LegendItem {
	label: string
	color?: string
	type?: LegendType
}

export interface DateItem {
	start: Date
	end?: Date
}

export interface CalendarOptions {
	// main
	target: HTMLElement | string
	dateLocale?: LocaleType
	startWeekOn?: number
	selectionMode?: SelectionModeType
	initialDate?: Date
	onSelect?: ({ start, end }: DateItem) => void

	// disable rules
	minDate?: Date
	maxDate?: Date
	isDateDisabled?: (date: Date) => boolean

	// info
	hasInfo?: boolean

	// shown months
	shownMonths?: ShownMonthsType

	// availability
	availability?: AvailabilityItem

	// holidays
	enableHolidays?: boolean
	holidayCountry?: SupportedHolidayCountryType
	holidayLanguage?: SupportedLocaleType

	// legends
	primaryLegends?: LegendItem[]
	secondaryLegends?: LegendItem[]

	// accessibility
	ariaLabelMonth?: (date: Date) => string
}