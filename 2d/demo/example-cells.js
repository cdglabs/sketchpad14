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
    this.rowLabels = []
    this.colLabels = []
    this.cells = []    
    this.__origin = this.box.__origin
    this.viewOffsetY = 0
    this.viewOffsetX = 0
}

sketchpad.addClass(Examples.cells.Sheet)

Examples.cells.Sheet.prototype.init = function() {
    var rows = this.rows, cols = this.cols, cellWidth = this.cellWidth, cellHeight = this.cellHeight, width = this.width, height = this.height
    var rowsCap = rows - Math.floor(height / cellHeight)  + 1
    var colsCap = cols - Math.floor(width / cellWidth) + 1
    //rc.add(this.box)
    for (var i = 1; i <= rows; i++) {
	var c = new Examples.cells.Cell(new Point(i * cellWidth, 0), letters[i-1], cellWidth, cellHeight, 20, '#cccccc')
	this.colLabels.push(c)
	//rc.add(c, this)	
    }
    for (var j = 1; j <= cols; j++) {
	var c = new Examples.cells.Cell(new Point(0, j * cellHeight), j-1, cellWidth, cellHeight, 20, '#cccccc')
	this.rowLabels.push(c)
	//rc.add(c, this)
    }
    for (var i = 1; i <= rows; i++) {
	var row = []
	this.cells.push(row)
	for (var j = 1; j <= cols; j++) { 
	    var c = new Examples.cells.Cell(new Point(j * cellWidth, i * cellHeight), letters[j-1] + (i-1), cellWidth, cellHeight, 20, '#f0ee9e')
	    row.push(c)
	    //rc.add(c, this)
	}
    }
	
    this.cursor = this.cells[0][0]
    this.sliderY = rc.add(new Examples.slider.Slider({obj: this, prop: 'viewOffsetY'}, false, new Point(0, 0), 20, this.box.height, {start: 0, end: rowsCap}, true))
    this.sliderY.init()
    this.sliderX = rc.add(new Examples.slider.Slider({obj: this, prop: 'viewOffsetX'}, true, new Point(0, 0), this.box.width, 20, {start: 0, end: colsCap}, true))
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
    var rows = this.rows, cols = this.cols, cellWidth = this.cellWidth, cellHeight = this.cellHeight, width = this.width, height = this.height
    if (this.sliderY.valueToSliderPositionMode) {
	//this.viewOffsetY = this.cursorLineOffset()
	//this.setSliderRange()
    }
    var bPos = this.box.position
    var pos = bPos.minus({x: this.viewOffsetX * this.cellWidth, y: this.viewOffsetY * this.cellHeight})
    var posPx = bPos.minus({x: this.viewOffsetX * this.cellWidth, y: 0})
    var posPy = bPos.minus({x: 0, y: this.viewOffsetY * this.cellHeight})
    var box = this.box
    var posX = pos.x, posY = pos.y, cells = this.cells, size = cells.length, start = 0, end = size - 1
    // find which portion is visible within the view of page
    this.viewOffsetX = Math.max(this.viewOffsetX, 0)
    this.viewOffsetY = Math.max(this.viewOffsetY, 0)
    for (var i =  this.viewOffsetY; i < this.rowLabels.length; i++) {
	var c = this.rowLabels[i]
	var p = c.position
	if (box.containsPoint(p.x + bPos.x + c.width, p.y + posY + c.height))
	    c.draw(canvas, posPy)
    }
    for (var i =  this.viewOffsetX; i < this.colLabels.length; i++) {
	var c = this.colLabels[i]
	var p = c.position
	if (box.containsPoint(p.x + posX + c.width, p.y + bPos.y + c.height))
	    c.draw(canvas, posPx)
    }
    for (var i = this.viewOffsetY; i < this.rows; i++) {
	var row = cells[i]
	for (var j = this.viewOffsetX; j < this.cols; j++) {	    
	var c = row[j]
	var p = c.position
	    if (box.containsPoint(p.x + posX + c.width, p.y + posY + c.height)) {
		c.tbox.box.bgColor = c === this.cursor ? '#81f781' : '#f0ee9e'
		c.draw(canvas, pos)
	    }
	}
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

Examples.cells.Sheet.prototype.setCursorByPos = function(posX, posY) {
    var diff = new Point(posX, posY).minus(this.box.position)
    var coord = {j: Math.floor(diff.x / this.cellWidth) - 1 + this.viewOffsetX, i: Math.floor(diff.y / this.cellHeight) - 1 + this.viewOffsetY}
    if (coord.i >= 0 && coord.j >= 0)
	this.cursor = this.cells[coord.i][coord.j]
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
    sketchpad.setOption('solveEvenWithoutErrorOnPriorityDifferences', true)
    rc.setOption('dragConstraintPriority', 0)
    rc.setOption('renderMode', 1)

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
	if (sel instanceof Examples.slider.Slider) {
	    sel.valueToSliderPositionMode = false
	} else {
	    var posX = e.clientX, posY = e.clientY	    
	    if (sheet.box.containsPoint(posX, posY)) {
		sheet.sliderX.valueToSliderPositionMode = true
		sheet.sliderY.valueToSliderPositionMode = true
		sheet.setCursorByPos(posX, posY)
	    }
	}
    }, "...")
    

// --- Data ----------------------------------------------------------------
    sheet = rc.add(new Examples.cells.Sheet(10, 10, rc.add(new Point(200, 200, 'gray', 6)), 300, 300)).init()
}
