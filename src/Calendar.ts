import Holidays from "date-holidays"
import dayjs from "dayjs"

import { CALENDAR_WIDTH, ONE_DAY_MS } from "./constants"
import type { CalendarOptions, LocaleType, SelectionModeType, AvailabilityItem, LegendItem, LegendType } from "./types"

export class Calendar {
	// main
  private root: HTMLElement
  private dateLocale: LocaleType
  private startWeekOn: number
  private selectionMode: SelectionModeType

	// disable rules
  private minDate?: Date
  private maxDate?: Date
  private isDateDisabled?: (d: Date) => boolean

  // info
  private hasInfo: boolean

  // shown months
  private shownMonths: number

  // availability
  private availability?: AvailabilityItem

	// holidays
  private holiday?: Holidays
  private holidaysCache: Record<string, string | true> = {}

	// legends
  private primaryLegends: LegendItem[]
  private secondaryLegends: LegendItem[]

  // view state
  private viewYear: number
  private viewMonth: number

  // selection state
  private selectedStartDate?: Date
  private selectedEndDate?: Date
  private hoverDate?: Date

  constructor(opts: CalendarOptions) {
    if (!opts.target) throw new Error("Calendar: 'target' is required.")
    if (opts.shownMonths! > 2) throw new Error("Calendar: max 'shownMonths' is 2")
    this.root =
      typeof opts.target === "string"
        ? (document.querySelector(opts.target) as HTMLElement)
        : opts.target

    if (!this.root) throw new Error("Calendar: target element not found.")

    this.dateLocale = opts.dateLocale ?? "en-US"
    this.startWeekOn = Math.min(Math.max(opts.startWeekOn ?? 0, 0), 6)
    this.selectionMode = opts.selectionMode ?? "range"

		// disable rules
    this.minDate = opts.minDate || new Date
    this.maxDate = opts.maxDate
    this.isDateDisabled = opts.isDateDisabled

    // info
    this.hasInfo = opts.hasInfo || false

    // shown months
    this.shownMonths = Math.max(1, opts.shownMonths ?? 1)
    const roolEl = document.documentElement
    roolEl.style.setProperty('--t-cal-months', this.shownMonths.toString());
    const calendarWidth = CALENDAR_WIDTH[this.shownMonths as keyof typeof CALENDAR_WIDTH]
    roolEl.style.setProperty('--t-cal-w', calendarWidth)

    // availability
    this.availability = opts.availability

		// holidays
    if (opts.enableHolidays) {
      const country = opts.holidayCountry ?? "JP"
      const languages = opts.holidayLanguage ?? (this.dateLocale.startsWith("ja") ? "ja" : "en")
      this.holiday = new Holidays(country, { languages })
    }

		// legends
    this.primaryLegends = opts.primaryLegends ?? []
    this.secondaryLegends = opts.secondaryLegends ?? []

		// view state
    const init = opts.initialDate ?? new Date()
    this.viewYear = init.getFullYear()
    this.viewMonth = init.getMonth()

    // accessibility
    this.root.setAttribute("role", "application")
    this.root.classList.add("t-cal-root")

    this.render()
  }

  // ---------- Public API ----------
  public goto(date: Date) {
    this.viewYear = date.getFullYear()
    this.viewMonth = date.getMonth()
    this.render(true)
  }

  public nextMonth() {
    if (this.viewMonth === 11) {
      this.viewMonth = 0
      this.viewYear += 1
    } else {
			this.viewMonth += 1
		}
    this.render(true)
  }

  public prevMonth() {
    if (this.viewMonth === 0) {
      this.viewMonth = 11
      this.viewYear -= 1
    } else {
			this.viewMonth -= 1
		}
    this.render(true)
  }

  public setPrimaryLegends(legends: LegendItem[]) {
    this.primaryLegends = legends
    this.render()
  }

  public setSecondaryLegends(legends: LegendItem[]) {
    this.secondaryLegends = legends
    this.render()
  }

  public clearSelection() {
    this.selectedStartDate = undefined
    this.selectedEndDate = undefined
    this.hoverDate = undefined
    this.render()
  }

  public getSelection(): { startDate?: Date; endDate?: Date; nights?: number } {
    const nights =
      this.selectedStartDate && this.selectedEndDate
        ? Math.max(0, Math.round((+this.selectedEndDate - +this.selectedStartDate) / ONE_DAY_MS))
        : undefined
    return { startDate: this.selectedStartDate, endDate: this.selectedEndDate, nights }
  }

  // ---------- Private API ----------
  private render(emitChange = false) {
    const header = this.renderHeader()
    // const grid = this.renderGrid()
    const months = this.renderMonths()
    const footer = this.renderFooter()

    this.root.innerHTML = ""
    this.root.appendChild(header)
    // this.root.appendChild(grid)
    this.root.appendChild(months)
    this.root.appendChild(footer)

    if (emitChange) {
      this.dispatch("calendar:month-change", {
        year: this.viewYear,
        month: this.viewMonth,
      })
    }
  }

  private renderHeader(): HTMLElement {
    const header = document.createElement("div")
		header.className = "t-cal-header"

    // info
		if (this.hasInfo) {
      const selected = this.getSelection()
      const info = document.createElement("div")
      info.className = "t-cal-header-info"
  
      const startDateEl = document.createElement("span")
      const endDateEl = document.createElement("span")
      const nightsEl = document.createElement("span")
      const dateDivider = document.createElement("div")
      dateDivider.className = "t-cal-header-info-date-divider"
      const nightsDivider = document.createElement("div")
      nightsDivider.className = "t-cal-header-info-night-divider"
  
      if (this.selectionMode === "range") {
        const startDate = selected.startDate ? this.toISO(selected.startDate) : "—--/--/--"
        const endDate = selected.endDate ? this.toISO(selected.endDate) : "—--/--/--"
        const nights = selected.nights ?? 0
        startDateEl.textContent = startDate
        endDateEl.textContent = endDate
        // TODO change to translation
        nightsEl.textContent = `${nights} Nights`
      } else if (selected.startDate) {
        info.textContent = `Selected: ${this.toISO(selected.startDate)}`
      } else {
        info.textContent = "Select a date"
      }
      info.append(startDateEl, dateDivider, endDateEl, nightsDivider, nightsEl)
      header.appendChild(info)
    }

    // header navigation
		const headerNav = document.createElement("div")
		headerNav.className = "t-cal-header-nav"

    const prev = document.createElement("button")
    prev.className = "t-cal-nav t-cal-prev"
    prev.type = "button"
    prev.setAttribute("aria-label", "Previous month")
    prev.addEventListener("click", () => this.prevMonth())

    const next = document.createElement("button")
    next.className = "t-cal-nav t-cal-next"
    next.type = "button"
    next.setAttribute("aria-label", "Next month")
    next.addEventListener("click", () => this.nextMonth())

    const titleWrapper = document.createElement("div")
    titleWrapper.className = "t-cal-title-wrapper"

    for (let i = 0; i < this.shownMonths; i++) {
      const titleEl = document.createElement("div")
      titleEl.className = "t-cal-title"
      // TODO change format for each locales
      const label = new Intl.DateTimeFormat(this.dateLocale, { month: "long", year: "numeric" }).format(
        new Date(this.viewYear, this.viewMonth + i, 1)
      )
      titleEl.textContent = label
      titleWrapper.appendChild(titleEl)
    }

		const today = new Date()
		if (today.getMonth() === this.viewMonth) {
			prev.classList.add("hide")
		} else {
			prev.classList.add("show")
		}
		headerNav.append(prev, titleWrapper, next)
    header.appendChild(headerNav)
    return header
  }

  private renderMonths(): HTMLElement {
    const monthsWrapper = document.createElement("div")
    monthsWrapper.className = this.shownMonths > 1 ? "t-cal-months" : "t-cal-months single"

    monthsWrapper.addEventListener("mouseleave", () => {
      this.hoverDate = undefined
      this.updateHoverClasses(monthsWrapper)
    })

    for (let i = 0; i < this.shownMonths; i++) {
      const { year, month } = this.addMonths(this.viewYear, this.viewMonth, i)

      const monthEl = document.createElement("div")
      monthEl.className = "t-cal-month"

      // const inlineTitle = document.createElement("div")
      // inlineTitle.className = "t-cal-title-inline"
      // inlineTitle.textContent = new Intl.DateTimeFormat(this.dateLocale, { month: "long", year: "numeric" })
      //   .format(new Date(year, month, 1))
      // monthEl.appendChild(inlineTitle)

      const grid = this.renderGrid(year, month, monthsWrapper)
      monthEl.append(grid)
      monthsWrapper.appendChild(monthEl)
    }

    this.updateSelectionClasses(monthsWrapper)
    this.updateHoverClasses(monthsWrapper)

    return monthsWrapper
  }

  private renderGrid(year: number, month: number, monthsContainer: HTMLElement): HTMLElement {
    const grid = document.createElement("div")
    grid.className = "t-cal-grid"

    // week header (Sun - Sat)
    const weekHeader = document.createElement("div")
    weekHeader.className = "t-cal-week t-cal-week-head"
    const weekdayFormat = new Intl.DateTimeFormat(this.dateLocale, { weekday: "short" })
		// dows means Day of Week
    const dows = Array.from({ length: 7 }, (_, i) => (i + this.startWeekOn) % 7)
    dows.forEach((dow) => {
			// random date, just search for Sunday first
			const fake = new Date(2021, 7, dow + 1)
      const weekHeaderCell = document.createElement("div")
      weekHeaderCell.className = "t-cal-head-cell"
      weekHeaderCell.textContent = weekdayFormat.format(fake)
      weekHeader.appendChild(weekHeaderCell)
    })
    grid.appendChild(weekHeader)

    // dates (1-31)
    const firstDate = new Date(year, month, 1)
    const lastDate = new Date(year, month + 1, 0)
    const days = lastDate.getDate()
    const offset = this.mod(firstDate.getDay() - this.startWeekOn, 7)
    const totalCells = Math.ceil((offset + days) / 7) * 7

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < totalCells; i++) {
      if (i % 7 === 0) {
        const row = document.createElement("div")
        row.className = "t-cal-week"
        grid.appendChild(row)
      }
      const row = grid.lastElementChild as HTMLElement

      const cell = document.createElement("div")
      cell.className = "t-cal-cell"
      const day = i - offset + 1

      if (day < 1 || day > days) {
        cell.classList.add("t-cal-empty")
        row.appendChild(cell)
        continue
      }

      const date = new Date(year, month, day)
      const isoDate = this.toISO(date)

      const dayButton = document.createElement("button")
      dayButton.type = "button"
      dayButton.className = "t-cal-day"
      dayButton.dataset.date = isoDate
      dayButton.textContent = String(day)

      // disabled logic
      const isDisabled = this.isDisabled(date)
      if (isDisabled) dayButton.classList.add("is-disabled")

      // today
      if (date.getTime() === today.getTime()) dayButton.classList.add("is-today")

      // holiday
      if (this.holiday) {
        const title = this.holidayName(date)
        if (title) {
          dayButton.classList.add("is-holiday")
          dayButton.title = title
        }
      }

      // availability
      if (this.availability && !isDisabled) {
        const availabilityBar = document.createElement("div")
        availabilityBar.className = "t-cal-availability"
        const dot = document.createElement("span")
        const isPrice = this.availability?.type === "price"
        const currentDateValue = this.availability?.inventory[dayjs(date).format("YYYY/MM/DD")]
        dot.className = isPrice ? 
          "t-cal-availability-dot price" : 
          `
            t-cal-availability-dot 
            symbol 
            ${this.getAvailabilityStatus(
              parseInt(currentDateValue, 10)
            )}
          `
        dot.textContent = isPrice ? currentDateValue : ''
        availabilityBar.appendChild(dot)
        dayButton.appendChild(availabilityBar)
      }

      // click selection + hover
      if (!isDisabled) {
        dayButton.addEventListener("click", () => this.handleSelect(date))
        dayButton.addEventListener("mouseenter", () => {
          this.hoverDate = date
          this.updateHoverClasses(monthsContainer)
        })
      }

      cell.appendChild(dayButton)
      row.appendChild(cell)
    }

    return grid
  }

  private renderFooter(): HTMLElement {
    const footer = document.createElement("div")
    footer.className = "t-cal-footer"

    if (this.primaryLegends.length > 0) {
      const primaryLegendWrapper = document.createElement('div')
      primaryLegendWrapper.className = "t-cal-legend"
      this.primaryLegends.forEach((legend) => {
        const primaryLegendEl = document.createElement("div")
        primaryLegendEl.className = "t-cal-legend-primary"

        const primaryLegendDotEl = document.createElement("span")
        primaryLegendDotEl.style.backgroundColor = legend.color!

        primaryLegendEl.appendChild(primaryLegendDotEl)
        primaryLegendEl.append(legend.label)

        primaryLegendWrapper.appendChild(primaryLegendEl)
      })
      footer.appendChild(primaryLegendWrapper)
    }

    if (this.secondaryLegends.length > 0) {
      const secondaryLegendWrapper = document.createElement('div')
      secondaryLegendWrapper.className = "t-cal-legend"  
      this.secondaryLegends.forEach((legend) => {
        const secondaryLegendEl = document.createElement("div")
        secondaryLegendEl.className = `t-cal-legend-secondary ${legend.type}`
        const secondaryLegendDotEl = document.createElement("span")
        secondaryLegendDotEl.textContent = legend.label

        secondaryLegendEl.appendChild(secondaryLegendDotEl)

        secondaryLegendWrapper.appendChild(secondaryLegendEl)
      })
      footer.appendChild(secondaryLegendWrapper)
    }

    return footer
  }

  private handleSelect(date: Date) {
    if (this.selectionMode === "single") {
      this.selectedStartDate = date
      this.selectedEndDate = undefined
      this.dispatch("calendar:date-select", { date })
      this.render()
      return
    }

    // range mode
    if (!this.selectedStartDate || (this.selectedStartDate && this.selectedEndDate)) {
      this.selectedStartDate = date
      this.selectedEndDate = undefined
      this.hoverDate = undefined
      this.dispatch("calendar:range-start", { start: date })
      this.render()
      return
    }

    // set end
    this.selectedEndDate = date
    if (this.selectedEndDate < this.selectedStartDate) {
      [this.selectedStartDate, this.selectedEndDate] = [this.selectedEndDate, this.selectedStartDate]
    }

    const nights = Math.max(
      0,
      Math.round((+this.selectedEndDate - +this.selectedStartDate) / ONE_DAY_MS)
    )

    this.dispatch("calendar:range-complete", {
      start: this.selectedStartDate,
      end: this.selectedEndDate,
      nights,
    })

    this.render()
  }

  private updateSelectionClasses(grid: HTMLElement) {
    const allDay = grid.querySelectorAll<HTMLButtonElement>(".t-cal-day")
    allDay.forEach((el) => el.classList.remove("is-selected", "is-in-range", "is-start", "is-end"))

    if (!this.selectedStartDate) return

    const startISODate = this.toISO(this.selectedStartDate)
    const endISODate = this.selectedEndDate ? this.toISO(this.selectedEndDate) : undefined

    allDay.forEach((el) => {
      const isoDate = el.dataset.date!
      if (isoDate === startISODate) el.classList.add("is-selected", "is-start")
      if (endISODate && isoDate === endISODate) el.classList.add("is-selected", "is-end")

      if (endISODate && isoDate > startISODate && isoDate < endISODate) {
        el.classList.add("is-in-range")
      }
    })
  }

  private updateHoverClasses(grid: HTMLElement) {
    const allDay = grid.querySelectorAll<HTMLButtonElement>(".t-cal-day")
    allDay.forEach((el) => el.classList.remove("is-hover-range"))

    if (!this.selectedStartDate || this.selectedEndDate || !this.hoverDate) return

    const startISODate = this.toISO(this.selectedStartDate)
    const hoverISODate = this.toISO(this.hoverDate)

    const [fromDate, toDate] = startISODate <= hoverISODate ? [startISODate, hoverISODate] : [hoverISODate, startISODate]

    allDay.forEach((el) => {
      const isoDate = el.dataset.date!
      if (isoDate > fromDate && isoDate < toDate) el.classList.add("is-hover-range")
    })
  }
  
  private getAvailabilityStatus(value: number): LegendType | '' {
    console.log(value, value >= 5)
    if (value === 0) return 'cross'
    if (value < 5) return 'triangle'
    if (value >= 5) return 'circle'
    return ''
  }

  private isDisabled(date: Date): boolean {
    if (this.minDate && date < this.stripTime(this.minDate)) return true
    if (this.maxDate && date > this.stripTime(this.maxDate)) return true
    if (this.isDateDisabled && this.isDateDisabled(date)) return true
    return false
  }

  private stripTime(date: Date): Date {
    const currentDate = new Date(date)
    currentDate.setHours(0, 0, 0, 0)
    return currentDate
  }

  private addMonths(year: number, month: number, delta: number) {
    const date = new Date(year, month + delta, 1)
    return { year: date.getFullYear(), month: date.getMonth() }
  }

  private holidayName(date: Date): string | undefined {
    const isoDate = this.toISO(date)
    if (this.holidaysCache[isoDate] !== undefined) {
      const value = this.holidaysCache[isoDate]
      return value === true ? undefined : (value as string)
    }
    if (!this.holiday) return undefined

    const holidayInfo = this.holiday.isHoliday(date)
    if (!holidayInfo) {
      this.holidaysCache[isoDate] = true
      return undefined
    }
    // holidayInfo can be object or array
    const name = Array.isArray(holidayInfo) ? holidayInfo[0]?.name : holidayInfo.name
    this.holidaysCache[isoDate] = name || true
    return name || undefined
  }

  private toISO(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}/${month}/${day}`
  }

  private dispatch(name: string, detail: Record<string, unknown>) {
    this.root.dispatchEvent(new CustomEvent(name, { detail }))
  }

  private mod(n: number, m: number) {
    return ((n % m) + m) % m
  }
}
