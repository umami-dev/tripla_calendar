import type { LegendItem } from "../types"

export const PRIMARY_LEGENDS: LegendItem[] = [
	{
		color: '#c4af87',
		label: 'Planned Stay Date'
	}
]

export const SECONDARY_LEGENDS: LegendItem[] = [
	{
		type: 'circle',
		label: '5 or more rooms available'
	},
	{
		type: 'triangle',
		label: '4 or fewer rooms left'
	},
	{
		type: 'cross',
		label: 'Fully booked'
	},
]
