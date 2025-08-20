import { Calendar } from './Calendar.ts'
import { AVAILABILITY_STATUS } from './__mocks__/availability.ts'
import { PRIMARY_LEGENDS, SECONDARY_LEGENDS } from './__mocks__/legends.ts'
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>Tripla Calendar Test</h1>
  <div id="calendar"></div>
`

new Calendar({
  target: '#calendar',
  shownMonths: 2,
  enableHolidays: true,
  availability: AVAILABILITY_STATUS,
  primaryLegends: PRIMARY_LEGENDS,
  secondaryLegends: SECONDARY_LEGENDS
})
