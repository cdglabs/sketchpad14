Examples.cells = { }

var plus = Sketchpad.geom.plus
var minus = Sketchpad.geom.minus
var magnitude = Sketchpad.geom.magnitude
var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
rc.preventBrowserDefaultKeyEvents()

// --- Classes -------------------------------------------------------------

Examples.cells.Sheet = function Examples__cells__Sheet(rows, cols, position, width, height) {
    this.cellWidth = 100
    this.cellHeight = 50
    this.width = width
    this.height = height
    this.box = new Box(position, width, height, true, true, undefined, '#f0ee9e')
    this.rows = rows
    this.cols = cols
    this.cells = []    
    this.__origin = this.box.__origin
    this.viewOffsetY = 0
    this.viewOffsetX = 0
}

sketchpad.addClass(Examples.cells.Sheet)

Examples.cells.Sheet.prototype.init = function() {
    var rows = this.rows, cols = this.cols, cellWidth = this.cellWidth, cellHeight = this.cellHeight 
    //rc.add(this.box)
    for (var i = 0; i < rows + 1; i++) {
	for (var j = 0; j < cols + 1; j++) { 
	    var c = new Examples.cells.Cell(new Point(j * cellWidth, i * cellHeight), j == 0 && i !== 0 ? i - 1 : i == 0 && j != 0 ? letters[j - 1] : '', cellWidth, cellHeight, 20, i == 0 || j == 0 ? '#cccccc' : '#f0ee9e')
	    this.cells.push(c)
	    rc.add(c, this)
	}
    }
	
    this.cursor = this.cells[0]
    this.sliderY = rc.add(new Examples.slider.Slider({obj: this, prop: 'viewOffsetY'}, false, new Point(0, 0), 20, this.box.height, {start: 0, end: 1}, true))
    this.sliderY.init()
    this.sliderX = rc.add(new Examples.slider.Slider({obj: this, prop: 'viewOffsetX'}, true, new Point(0, 0), this.box.width, 20, {start: 0, end: 1}, true))
    this.sliderX.init()
    
    rc.addConstraint(Sketchpad.arith.EqualProperties, undefined, {obj: this.box.bottomCorner, prop: 'x'}, {obj: this.sliderY.frame.position, prop: 'x'}, [2])
    rc.addConstraint(Sketchpad.arith.EqualProperties, undefined, {obj: this.box.position, prop: 'y'}, {obj: this.sliderY.frame.position, prop: 'y'}, [2])
    rc.addConstraint(Sketchpad.arith.EqualProperties, undefined, {obj: this.box, prop: 'height'}, {obj: this.sliderY.frame, prop: 'height'}, [2])
    rc.addConstraint(Sketchpad.arith.EqualProperties, undefined, {obj: this.box.bottomCorner, prop: 'y'}, {obj: this.sliderX.frame.position, prop: 'y'}, [2])
    rc.addConstraint(Sketchpad.arith.EqualProperties, undefined, {obj: this.box.position, prop: 'x'}, {obj: this.sliderX.frame.position, prop: 'x'}, [2])
    rc.addConstraint(Sketchpad.arith.EqualProperties, undefined, {obj: this.box, prop: 'width'}, {obj: this.sliderX.frame, prop: 'width'}, [2])
    return this
}

Examples.cells.Sheet.prototype.draw = function(canvas, origin) {
    if (this.sliderY.valueToSliderPositionMode) {
	this.viewOffsetY = this.cursorLineOffset()
	this.setSliderRange()
    }
    var bPos = this.box.position
    var pos = bPos.minus({x: 0, y: this.viewOffsetY * this.rows})
    var box = this.box
    var posX = pos.x, posY = pos.y, cells = this.cells, size = cells.length, start = 0, end = size - 1
    // find which portion is visible within the view of page
    for (var i = 0; i < cells.length; i++) {
	var c = cells[i]
	var p = c.position
	if (box.containsPoint(p.x + posX + c.width, p.y + posY + c.height))
	    c.draw(canvas, pos)
    }
}

Examples.cells.Sheet.prototype.center = function() { return this.box.center() }
Examples.cells.Sheet.prototype.width = function() { return this.box.width }
Examples.cells.Sheet.prototype.lineCellLimit = function() { return Math.floor((this.width() - ( 2 * this.cols)) / this.cursor.width) }
Examples.cells.Sheet.prototype.position = function() { return this.box.position }
Examples.cells.Sheet.prototype.topLeft = function() { return {x: this.cols, y: this.rows} }
Examples.cells.Sheet.prototype.text = function() {return this.cells.map(function(c) { return c.text }).join('') }
Examples.cells.Sheet.prototype.topLeft = function() { return {x: this.cols, y: this.rows} }
Examples.cells.Sheet.prototype.cursorLineOffset = function() {
    return Math.max(0, Math.ceil((this.cursor.position.y - this.box.height) / this.rows))
}
Examples.cells.Sheet.prototype.setSliderRange = function() {
    //this.sliderY.range.end = Math.max(0, Math.ceil((this.cells[this.cells.length - 1].position.y - this.box.height) / this.rows))
}

Examples.cells.Sheet.prototype.addText = function(text) { 
    rc.pause()
    text.split('').forEach(function(c) { this.addCell(c) }.bind(this)) 
    rc.unpause()
}

Examples.cells.Sheet.prototype.addCell = function(text) {
    var cursor = this.cursor
    var newCell = new Examples.cells.Cell(new Point(0, 0, 'gray', 5), text)
    rc.add(newCell, this)
    this.cells.splice(cursor.next ? this.cells.indexOf(cursor.next) : this.cells.length, 0, newCell)
    var prev = cursor.prev
    if (prev)
	prev.next = newCell
    newCell.prev = prev
    newCell.next = cursor.next    
    if (cursor.next) {
	cursor.next.prev = newCell
    }
    cursor.prev = newCell

    var constraint = rc.addConstraint(Examples.cells.CellPositioning, undefined, newCell, this)
    constraint.___container = this.box
    var mode = sketchpad.scratch.wordWrapModes[sketchpad.scratch.wordWrapMode]
    if (mode === 'optimal' || mode === 'justify') {
	sheet.optimalBreaksConstraint['pos' + newCell.__id] = newCell.position
	if (newCell.isSpace())
	    sheet.justifyConstraint['char' + newCell.__id] = newCell
    }
}

Examples.cells.Sheet.prototype.deleteCell = function() {
    var cursor = this.cursor
    var deletedCell = cursor.prev
    if (deletedCell) {
	var cells = this.cells
	cells.splice(cells.indexOf(deletedCell), 1)
	if (deletedCell.prev)
	    deletedCell.prev.next = cursor.next
	if (cursor.next)
	    cursor.next.prev = deletedCell.prev
	cursor.prev = deletedCell.prev
	cursor.next = deletedCell.next
	rc.remove(deletedCell, true)
    }
}

Examples.cells.Sheet.prototype.moveCursorLeft = function() {
    var cursor = this.cursor
    if (cursor.prev) {
	cursor.next = cursor.prev
	cursor.prev = cursor.prev.prev
    }
}

Examples.cells.Sheet.prototype.moveCursorRight = function() {
    var cursor = this.cursor
    if (cursor.next) {
	cursor.prev = cursor.next
	cursor.next = cursor.next.next
    } 
}

Examples.cells.Sheet.prototype.computePerSpaceCellPaddingForEvenColumns = function() {
    var res = []
    var newLines = this.newLineIdxs
    var colWidth = this.width() - (this.cols * 2)
    var idx = 0
    var next = newLines[idx]
    var takenSp = 0, sps = []
    for (var i = 0; i < this.cells.length; i++) {
	var c = this.cells[i]	
	if (i == next) {
	    var d = c.prev
	    while (d && d.isSpace()) {
		sps.pop()
		takenSp -= d.width
		d = d.prev
	    }
	    var empty = colWidth - takenSp - (idx > 0 ? this.cols : 0)
	    var paddingNeeded = empty > 0 && sps.length > 0 ? (empty / sps.length) : 0
	    if (paddingNeeded) {
		sps.forEach(function(s) { res.push({character: s, padding: paddingNeeded}) })
	    }
	    next = newLines[++idx]
	    takenSp = 0
	    sps = []
	} else {
	    if (c.isSpace())
		sps.push(c)
	    takenSp += c.width
	}
    }
    return res
}

Examples.cells.Sheet.prototype.wordJustifyWrapSlackTable = function(W, L, n) {
    // Initialize slack table S
    var S = [], K = []
    for (var i = 1; i <= n; i++) {
	var a = []
	for (var j = 1; j <= n; j++)
	    a.push(0)
	S.push(a)	
    }
    S[0][0] = W[0]
    K[0] = n
    for (k = 2; k <= n; k++)
	S[0][k - 1] = S[0][k - 2] + W[k - 1]
    for (var i = 2; i <= n; i++) {
	var k = i	
	S[i - 1][k - 1] = S[0][k - 1] - S[0][i - 2]
	while (k <= n - 1 && (L - S[i - 1][k - 1] - (k - i) > 0)) {
	    k = k + 1
	    S[i - 1][k - 1] = S[0][k - 1] - S[0][i - 2]
	}
	K[i - 1] = k
    }
    // Evaluate sum-of-squares for valid entries
    for (var i = 1; i <= n; i++) {
	for (var k = i; k <= K[i - 1]; k++) {
	    S[i - 1][k - 1] = L - S[i - 1][k - 1] - (k - i)
	    if (S[i - 1][k - 1] < 0) {
		    S[i - 1][k - 1] = Number.MAX_VALUE
	    } else
		S[i - 1][k - 1] = (S[i - 1][k - 1]) * (S[i - 1][k - 1]) 		    
	}
    }
    for (var i = 1; i <= n; i++) {
	if (K[i - 1] < n) {
	    for (var m = K[i - 1]; m < n; m++)
		S[i - 1][m] = Number.MAX_VALUE	    
	}
    }
    return S
}

// return value is the indices of the first word on each line
Examples.cells.Sheet.prototype.wordJustifyWrapFirstInLineWords = function(words, L) {
    var W = words.map(function(w) { return w.length })
    var n = W.length
    var S = this.wordJustifyWrapSlackTable(W, L, n), C = [], B = []
    // Determine the least-cost arrangement 
    C[0] = 0
    for (var i = 1; i <= n; i++) {
	C[i] = Number.MAX_VALUE
	var k = i
	var T = C[k - 1] + S[k - 1][i - 1] 
	if (T < C[i]) {
	    C[i] = T
	    B[i - 1] = k
	}
	while (k >= 2 && T < Number.MAX_VALUE) {
	    k = k - 1
	    T = C[k - 1] + S[k - 1][i - 1]
	    if (T < C[i]) {
		C[i] = T
		B[i - 1] = k
	    }
	}
    }
    // Determine the first word on each line 
    var F = []
    F.unshift(B[n - 1])
    var i = B[n - 1] - 1 
    while (i > 0) {
	F.unshift(B[i - 1])
	i = B[i - 1] - 1
    }
    for (var i = 0; i < F.length; i++)
	F[i]--
    F.shift()
    return F
}

Examples.cells.Sheet.prototype.wordJustifyWrapNewLineCellIndices = function(text, L) {
    var res = ''
    var words = text.split(' ')
    var F = this.wordJustifyWrapFirstInLineWords(words, L)
    var cIdx = 0, wIdx = 0
    var res = []
    F.forEach(function(f) { 
	while (wIdx < f)
	    cIdx += words[wIdx++].length + 1
	res.push(cIdx)
    })
    this.newLineIdxs = res
    return res
}

Examples.cells.Cell = function Examples__cells__Cell(position, text, width, height, fontSize, color) {
    this.position = position
    this.text = text
    this.width = width || 12
    this.height = height || 22
    this.fontSize = fontSize || 18
    this.color = color || 'black'
    this.origWidth = this.width
    this.tbox = new TextBox(position, text, false, 25, width, height, this.color, undefined, undefined, undefined, undefined, undefined, undefined, 'black')
    //new Box(position, width, height, false, false, 'black', '#f0ee9e')
}

sketchpad.addClass(Examples.cells.Cell)

Examples.cells.Cell.prototype.grabPoint = function() { 
    return this.position
}

Examples.cells.Cell.prototype.center = function() { 
    return this.position.center()
}

Examples.cells.Cell.prototype.draw = function(canvas, origin) {
    //var position = origin.plus(this.position)
    this.tbox.draw(canvas, origin)
}



// --- Constraint Defs -------------------------------------------------------


examples['cells'] = function() {

// --- Time / Event Handling ---------------------------------------------
// --- Constraints ---------------------------------------------------------

    //sketchpad.solveEvenWithoutErrorOnPriorityDifferences = true
    rc.setOption('renderMode', 2)

    rc.sketchpad.registerEvent('keypress', function(e) {
	sheet.sliderY.valueToSliderPositionMode = true
	var k = e.keyCode
	if (k >= 32 && k <= 126) {
	    sheet.addCell(String.fromCharCode(k))
	}
    }, "If a character add character to textarea.")
    
    rc.sketchpad.registerEvent('keydown', function(e) {
	var k = e.keyCode
	sheet.sliderY.valueToSliderPositionMode = true
	switch (k) {
	    // return
	    case 8: sheet.deleteCell(); break
	    // enter
	    case  13: sheet.addCell("\n"); break
	    // left
	    case 37: sheet.moveCursorLeft(); break
	    // right
	    case 39: sheet.moveCursorRight(); break
	    // space (why not getting in keypress??)
	    case 32: sheet.addCell(String.fromCharCode(k)); break
	}
    }, "on 'backspace' delete character to left of cursor, 'Return' add a newline char, 'left'/'right': move cursor left/right.")

        rc.sketchpad.registerEvent('pointerup', function(e) { 
	    // toggle wrap mode
	    var sel = rc.selection	     
    }, "word wrap mode is toggled when mode button is clicked.")

    rc.sketchpad.registerEvent('pointerdown', function(e) { 
	var sel = rc.selection
	if (sel == sheet.sliderY) {
	    sheet.sliderY.valueToSliderPositionMode = false
	} else if (sel == sheet.box) {
	    sheet.sliderY.valueToSliderPositionMode = true
	}
    }, "...")
    

// --- Data ----------------------------------------------------------------
    sheet = rc.add(new Examples.cells.Sheet(10, 10, rc.add(new Point(200, 200, 'gray', 6)), 300, 300)).init()
}
