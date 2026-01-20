;(() => {
	const STORAGE_KEY = 'tasting_table_v2'

	const tbody = document.getElementById('tbody')
	const headerRow = document.getElementById('headerRow')
	const footerRow = document.getElementById('footerRow')
	const colgroup = document.getElementById('colgroup')
	const printArea = document.getElementById('printArea')
	const dateCell = document.getElementById('dateCell')

	// ---- helpers ----
	const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

	function parseScore(text) {
		if (!text) return null
		const normalized = text.toString().trim().replace(',', '.')
		if (!normalized) return null
		const n = Number(normalized)
		if (!Number.isFinite(n)) return null
		return n
	}

	function roundToInt(n) {
		return Math.round(n)
	}

	function buildInitial() {
		const initialPeople = [
			'Даша',
			'Віка',
			'Вікторія',
			'Оля',
			'Діма',
			'Аня',
			'Катя ВЭД',
			'Строкань',
			'Лєна',
			'Віка ВЭД',
			'Поліна',
			'Настя',
			'Сом Наталі',
			'Сом Андрей'
		]
		const rows = 10

		setPeople(initialPeople)
		setRows(rows)
		recalcAll()
	}

	function getPeopleCount() {
		// header: 2 fixed + people + 1 summary
		return headerRow.children.length - 3
	}

	function setPeople(names) {
		// colgroup: keep 2 base cols
		while (colgroup.children.length > 2) colgroup.removeChild(colgroup.lastElementChild)

		// header: keep 2 base th
		while (headerRow.children.length > 2) headerRow.removeChild(headerRow.lastElementChild)

		// footer: keep label cell (colspan=2)
		while (footerRow.children.length > 1) footerRow.removeChild(footerRow.lastElementChild)

		// add person columns
		names.forEach(name => {
			const col = document.createElement('col')
			col.className = 'col-person'
			colgroup.appendChild(col)

			const th = document.createElement('th')
			th.className = 'editable'
			th.contentEditable = 'true'
			th.textContent = name || "Ім'я"
			headerRow.appendChild(th)

			const tdSum = document.createElement('td')
			tdSum.textContent = '0'
			tdSum.dataset.kind = 'colSum'
			footerRow.appendChild(tdSum)
		})

		// summary col
		const colS = document.createElement('col')
		colS.className = 'col-summary'
		colgroup.appendChild(colS)

		const thS = document.createElement('th')
		thS.textContent = 'Підсумок'
		headerRow.appendChild(thS)

		// footer summary cell: TOTAL under "Підсумок"
		const tdTotal = document.createElement('td')
		tdTotal.textContent = '0'
		tdTotal.dataset.kind = 'grandTotal'
		footerRow.appendChild(tdTotal)

		// update existing body rows to new people count
		const peopleCount = names.length
		;[...tbody.querySelectorAll('tr')].forEach(tr => {
			while (tr.children.length > 2) tr.removeChild(tr.lastElementChild)

			for (let i = 0; i < peopleCount; i++) {
				tr.appendChild(makeScoreCell(''))
			}
			tr.appendChild(makeSummaryCell())
		})
	}

	function setRows(count) {
		tbody.innerHTML = ''
		const peopleCount = getPeopleCount()

		for (let r = 1; r <= count; r++) {
			const tr = document.createElement('tr')

			const tdNum = document.createElement('td')
			tdNum.className = 'num'
			tdNum.textContent = String(r)
			tr.appendChild(tdNum)

			const tdPos = document.createElement('td')
			tdPos.className = 'editable'
			tdPos.contentEditable = 'true'
			tdPos.textContent = ''
			tr.appendChild(tdPos)

			for (let i = 0; i < peopleCount; i++) {
				tr.appendChild(makeScoreCell(''))
			}
			tr.appendChild(makeSummaryCell())

			tbody.appendChild(tr)
		}
	}

	function makeScoreCell(val) {
		const td = document.createElement('td')
		td.className = 'score editable'
		td.contentEditable = 'true'
		td.textContent = val
		td.addEventListener('input', recalcAll)
		return td
	}

	function makeSummaryCell() {
		const td = document.createElement('td')
		td.className = 'summary'
		td.dataset.kind = 'rowAvg'
		td.textContent = '—'
		return td
	}

	function renumberRows() {
		;[...tbody.querySelectorAll('tr')].forEach((tr, idx) => {
			tr.children[0].textContent = String(idx + 1)
		})
	}

	function recalcAll() {
		const peopleCount = getPeopleCount()
		const colSums = new Array(peopleCount).fill(0)
		let grandTotal = 0

		;[...tbody.querySelectorAll('tr')].forEach(tr => {
			const scoreTds = []
			for (let i = 0; i < peopleCount; i++) {
				scoreTds.push(tr.children[2 + i])
			}
			const summaryTd = tr.querySelector('td[data-kind="rowAvg"]')

			let sum = 0
			let cnt = 0

			scoreTds.forEach((td, i) => {
				const n = parseScore(td.textContent)

				// очистка старых классов
				td.classList.remove('good-score', 'excellent-score')

				if (n !== null) {
					sum += n
					cnt += 1
					colSums[i] += n

					// подсветка
					if (n >= 9.5) {
						td.classList.add('excellent-score')
					} else if (n >= 8) {
						td.classList.add('good-score')
					}
				}
			})

			grandTotal += sum

			if (cnt === 0) {
				summaryTd.textContent = '—'
			} else {
				const avg = sum / cnt
				summaryTd.textContent = String(roundToInt(avg))
			}
		})

		// footer sums per person + total under summary
		const footerCells = [...footerRow.children].slice(1) // after label
		// footerCells: [sumPerson0..sumPersonN-1, grandTotalCell]
		for (let i = 0; i < peopleCount; i++) {
			footerCells[i].textContent = String(Math.round(colSums[i] * 10) / 10)
		}
		const totalCell = footerRow.querySelector('td[data-kind="grandTotal"]')
		if (totalCell) {
			totalCell.textContent = String(Math.round(grandTotal * 10) / 10)
		}
	}

	// ---- add/remove rows/cols ----
	function addRow() {
		const peopleCount = getPeopleCount()
		const tr = document.createElement('tr')

		const tdNum = document.createElement('td')
		tdNum.className = 'num'
		tdNum.textContent = String(tbody.children.length + 1)
		tr.appendChild(tdNum)

		const tdPos = document.createElement('td')
		tdPos.className = 'editable'
		tdPos.contentEditable = 'true'
		tdPos.textContent = ''
		tr.appendChild(tdPos)

		for (let i = 0; i < peopleCount; i++) {
			tr.appendChild(makeScoreCell(''))
		}
		tr.appendChild(makeSummaryCell())

		tbody.appendChild(tr)
		recalcAll()
	}

	function delRow() {
		if (tbody.children.length <= 1) return
		tbody.removeChild(tbody.lastElementChild)
		renumberRows()
		recalcAll()
	}

	function addCol() {
		// add a taster column before summary
		// colgroup: insert before last (summary col)
		const newCol = document.createElement('col')
		newCol.className = 'col-person'
		colgroup.insertBefore(newCol, colgroup.lastElementChild)

		// header: insert before last th (Підсумок)
		const th = document.createElement('th')
		th.className = 'editable'
		th.contentEditable = 'true'
		th.textContent = 'Новий'
		headerRow.insertBefore(th, headerRow.lastElementChild)

		// body: insert score cell before summary td
		;[...tbody.querySelectorAll('tr')].forEach(tr => {
			const summaryTd = tr.querySelector('td[data-kind="rowAvg"]')
			tr.insertBefore(makeScoreCell(''), summaryTd)
		})

		// footer: insert sum before last (grandTotal cell)
		const tdSum = document.createElement('td')
		tdSum.textContent = '0'
		tdSum.dataset.kind = 'colSum'
		footerRow.insertBefore(tdSum, footerRow.lastElementChild)

		recalcAll()
	}

	function delCol() {
		const peopleCount = getPeopleCount()
		if (peopleCount <= 1) return

		// colgroup: remove penultimate (last is summary col)
		colgroup.removeChild(colgroup.children[colgroup.children.length - 2])

		// header: remove penultimate th
		headerRow.removeChild(headerRow.children[headerRow.children.length - 2])

		// body: remove penultimate score cell in each row
		;[...tbody.querySelectorAll('tr')].forEach(tr => {
			const idxToRemove = tr.children.length - 2 // before summary
			tr.removeChild(tr.children[idxToRemove])
		})

		// footer: remove penultimate td (before grandTotal)
		footerRow.removeChild(footerRow.children[footerRow.children.length - 2])

		recalcAll()
	}

	// ---- save/load ----
	function serialize() {
		const people = []
		const peopleCount = getPeopleCount()

		for (let i = 0; i < peopleCount; i++) {
			people.push(headerRow.children[2 + i].textContent.trim())
		}

		const rows = []
		;[...tbody.querySelectorAll('tr')].forEach(tr => {
			const pos = tr.children[1].textContent
			const scores = []
			for (let i = 0; i < peopleCount; i++) {
				scores.push(tr.children[2 + i].textContent)
			}
			rows.push({ pos, scores })
		})

		return { date: dateCell.textContent, people, rows }
	}

	function applyData(data) {
		if (!data || !Array.isArray(data.people) || !Array.isArray(data.rows)) return

		dateCell.textContent = data.date ?? ''

		setPeople(data.people)
		setRows(data.rows.length || 1)

		const peopleCount = getPeopleCount()
		;[...tbody.querySelectorAll('tr')].forEach((tr, r) => {
			const row = data.rows[r]
			tr.children[1].textContent = row?.pos ?? ''
			for (let i = 0; i < peopleCount; i++) {
				tr.children[2 + i].textContent = row?.scores?.[i] ?? ''
			}
		})

		recalcAll()
	}

	function save() {
		const payload = serialize()
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
	}

	function load() {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return
		try {
			applyData(JSON.parse(raw))
		} catch (e) {}
	}

	function reset() {
		localStorage.removeItem(STORAGE_KEY)
		buildInitial()
	}

	// ---- print fit (auto scale to 1 page) ----
	function fitToA4ForPrint() {
		printArea.style.transform = 'scale(1)'

		// px approximation for A4 landscape with margins (8mm each side)
		const pageWidthPx = (297 - 16) * 3.78
		const pageHeightPx = (210 - 16) * 3.78

		const rect = printArea.getBoundingClientRect()
		const sx = pageWidthPx / rect.width
		const sy = pageHeightPx / rect.height

		const scale = clamp(Math.min(sx, sy, 1), 0.35, 1)
		printArea.style.transform = `scale(${scale})`
	}

	window.addEventListener('beforeprint', fitToA4ForPrint)
	window.addEventListener('afterprint', () => {
		printArea.style.transform = 'scale(1)'
	})

	// ---- events ----
	document.getElementById('addRow').addEventListener('click', addRow)
	document.getElementById('delRow').addEventListener('click', delRow)
	document.getElementById('addCol').addEventListener('click', addCol)
	document.getElementById('delCol').addEventListener('click', delCol)

	document.getElementById('save').addEventListener('click', save)
	document.getElementById('load').addEventListener('click', load)
	document.getElementById('reset').addEventListener('click', reset)

	// recalc on edits (names/positions)
	tbody.addEventListener('input', recalcAll)
	headerRow.addEventListener('input', recalcAll)

	// init
	buildInitial()
	load()
})()
