// --- User Classes -------------------------------------------------------------

function Point(x, y, optColor, optRadius, optUnfilled, optOpacity, optTextColor, optTextSize, optTextFont) {
    this.x = x
    this.y = y
    this.color = optColor || 'slateBlue'
    this.radius = (optRadius || 8)// * (isTablet ? 2 : 1)
    this.unfilled = optUnfilled
    this.opacity = optOpacity
    this.optTextColor = optTextColor
    this.optTextSize = optTextSize
    this.optTextFont = optTextFont
    this._selectionIndices = []
}

sketchpad.addClass(Point)

Point.dummy = function(x, y, optColor, optRadius) {
    return new Point(x, y, optColor, optRadius)
}

Point.prototype.propertyTypes = {x: 'Number', y: 'Number', color: 'String', radius: 'Number'}

Point.prototype.solutionJoins = function() { 
    var lastGuyWinsJoinFn = sketchpad.lastOneWinsJoinSolutions
    return {color: lastGuyWinsJoinFn}
}

Point.prototype.draw = function(canvas, origin) {
    var ctxt = canvas.ctxt
    ctxt.fillStyle = this.color
    if (this.opacity)
	ctxt.globalAlpha = this.opacity
    ctxt.beginPath()
    ctxt.arc(origin.x + this.x, origin.y + this.y, this.radius, 0, 2 * Math.PI)
    ctxt.closePath()
    ctxt[this.unfilled ? 'stroke' : 'fill']()
    if (this._selectionIndices.length > 0) {
	this.drawSelectionIndices(ctxt, this.radius, origin, this.color, this.optTextColor, this.optTextSize, this.optTextFont)
    }
}

Point.prototype.center = function() {
    return this
}

Point.prototype.border = function() {
    var r = this.radius
    return new Box(new Point(this.x - r, this.y - r), r + r, r + r)
}

Point.prototype.grabPoint = function() {
    return this
}

Point.prototype.drawSelectionIndices = function(ctxt, radius, origin, pointColor, optTextColor, optTextSize, optTextFont) {
    var text = this._selectionIndices.join(', ')
    var x = this.x + origin.x, y = this.y + origin.y
    ctxt.shadowOffsetX = 0
    ctxt.shadowOffsetY = 0
    ctxt.textAlign = 'center'
    ctxt.textBaseline = 'middle'
    ctxt.lineWidth = 1
    ctxt.font = (optTextSize || (this.radius * 2)) + 'px ' + (optTextFont || 'Arial')
    var color = optTextColor || 'yellow'
    ctxt.strokeStyle = pointColor
    ctxt.fillStyle = color
    ctxt.fillText(text, x, y)
    ctxt.stroke()
}

Point.prototype.containsPoint = function(x, y) {
    function square(x) { return x * x }
    return square(this.radius) >= square(x - this.x) + square(y - this.y)
}

Point.prototype.plus = function(p) {
    return new Point(this.x + p.x, this.y + p.y)
}

Point.prototype.minus = function(p) {
    return new Point(this.x - p.x, this.y - p.y)
}

Point.prototype.scale = function(s) {
    return new Point(this.x * s, this.y * s)
}

Point.prototype.copy = function() {
    return new Point(this.x, this.y)
}

Point.prototype.midPoint = function(p) {
    return this.plus(p).scale(.5)
}

Point.prototype.set = function(p) {
    this.x = p.x
    this.y = p.y
    return this
}

function Line(p1, p2, optColor, optWidth, optLineDash, optOpacity) {
    this.p1 = p1
    this.p2 = p2
    this.color = optColor || 'gray'
    if (optWidth)
	this.width = optWidth
    this.lineDash = optLineDash
    this.opacity = optOpacity
}

Line.prototype.propertyTypes = {p1: 'Point', p2: 'Point', color: 'String', width: 'Number'}

Line.dummy = function(x, y) {
    return new Line(new Point(x - 50, y - 50), new Point(x + 50, y + 50), 'gray')
}

sketchpad.addClass(Line)

Line.prototype.draw = function(canvas, origin, options) {
    var ctxt = canvas.ctxt
    var p1 = this.p1, p2 = this.p2
    if (this.opacity)
	ctxt.globalAlpha = this.opacity
    ctxt.beginPath()
    ctxt.moveTo(p1.x + origin.x, p1.y + origin.y)
    ctxt.lineWidth = this.width || 3
    var color = options && options['color'] ? options['color'] : this.color
    ctxt.strokeStyle = color
    ctxt.lineTo(p2.x + origin.x, p2.y + origin.y)
    ctxt.closePath()
    if (this.lineDash)
	ctxt.setLineDash([this.lineDash])
    ctxt.stroke()
}

Line.prototype.containsPoint = function(x, y) {
    var p1 = this.p1, p2 = this.p2
    var x1 = p1.x, x2 = p2.x, y1 = p1.y, y2 = p2.y
    var p = {x: x, y: y}
    var l = Sketchpad.geom.distance(p1, p2)
    var d = Sketchpad.geom.distance(p1, p) + Sketchpad.geom.distance(p2, p)
    var err = d - l
    return err <= 0.2
}

Line.prototype.center = function() {
    return this.p1.midPoint(this.p2)
}

Line.prototype.border = function() {
    return this
}

function Box(position, width, height, resizable, optMaintainBottomCorner, optColor, optBgColor, optNoBorder, optLineDash) {
    this.__origin = position
    this.position = position    
    this.width = width
    this.height = height
    this.color = optColor || 'black'
    this.bgColor = optBgColor
    this.hasBorder = !optNoBorder
    this.lineDash = optLineDash
    if (optMaintainBottomCorner || resizable) {
	this.bottomCorner = new Point(position.x + width, position.y + height, 'gray', 6)
	this.bottomCornerConstraint1 = rc.addConstraint(Sketchpad.arith.SumConstraint, {obj: position, prop: 'x'}, {obj: this, prop: 'width'}, {obj: this.bottomCorner, prop: 'x'}, [3])
	this.bottomCornerConstraint2 = rc.addConstraint(Sketchpad.arith.SumConstraint, {obj: position, prop: 'y'}, {obj: this, prop: 'height'}, {obj: this.bottomCorner, prop: 'y'}, [3])
	this.addMaintainSizeConstraints()
    }
    if (resizable) {
	rc.add(this.bottomCorner)
	self = this	
	rc.sketchpad.registerEvent('pointerdown', function(e) { 
	    if (rc.selection === self.bottomCorner && !self.constraintsRemoved)
		self.removeMaintainSizeConstraints()
	})
	rc.sketchpad.registerEvent('pointerup', function(e) { 
	    if (rc.selection === self.bottomCorner && self.constraintsRemoved) 
		self.addMaintainSizeConstraints()
	})
    }
}

sketchpad.addClass(Box)

Box.dummy = function(x, y) {
    return new Box(new Point(x, y), 200, 200)
}

Box.prototype.addMaintainSizeConstraints = function() {
    this.maintainWidthConstraint = new Sketchpad.arith.ValueConstraint({obj: this, prop: 'width'}, this.width) 
    this.maintainHeightConstraint = new Sketchpad.arith.ValueConstraint({obj: this, prop: 'height'}, this.height) 
    rc.addNewConstraint(this.maintainWidthConstraint)
    rc.addNewConstraint(this.maintainHeightConstraint)
    this.bottomCornerConstraint1.onlyWriteTo = [3]
    this.bottomCornerConstraint2.onlyWriteTo = [3]
    this.constraintsRemoved = false
}

Box.prototype.removeMaintainSizeConstraints = function() {
    rc.removeConstraint(self.maintainWidthConstraint)
    rc.removeConstraint(self.maintainHeightConstraint)
    this.bottomCornerConstraint1.onlyWriteTo = [2]
    this.bottomCornerConstraint2.onlyWriteTo = [2]
    self.constraintsRemoved = true
}

Box.prototype.grabPoint = function() {
    return this.position
}

Box.prototype.draw = function(canvas, origin, options) {
    var ctxt = canvas.ctxt
    ctxt.beginPath()
    ctxt.rect(this.position.x + origin.x, this.position.y + origin.y, this.width, this.height)
    ctxt.lineWidth = 1
    var color = options && options['color'] ? options['color'] : this.color
    ctxt.strokeStyle = color
    if (this.hasBorder) {
	if (this.lineDash) {
	    ctxt.setLineDash([this.lineDash])
	}
	ctxt.stroke()
    }
    if (this.bgColor) {
	ctxt.fillStyle = this.bgColor
	ctxt.fill()
    }
}

Box.prototype.containsPoint = function(x, y) {
    var p = this.position
    var x1 = p.x, y1 = p.y
    var x2 = x1 + this.width, y2 = y1 + this.height
    var xS = x1 <= x2 ? x1 : x2, xE = x1 + x2 - xS
    var yS = y1 <= y2 ? y1 : y2, yE = y1 + y2 - yS
    var res = x >= xS && x <= xE && y >= yS && y <= yE
    return res
}

Box.prototype.border = function() {
    return this
}

Box.prototype.center = function() {
    return this.position.midPoint(new Point(this.position.x + this.width, this.position.y + this.height))
}

function TextBox(position, optText, optMultiLine, optFontSize, optWidth, optHeight, optBgColor, optFont, optFontColor, optHasNoBorder) {
    this.position = position
    this.text = optText || ''
    this.multiLine = optMultiLine
    this.bgColor = optBgColor// || 'white'
    this.fontSize = optFontSize || '12'
    this.width = optWidth || ((1+('' + this.text).length) * this.fontSize * .5)
    this.height = optHeight || (this.fontSize * 3)
    this.font = optFont || 'Georgia'
    this.fontColor = optFontColor || 'black'
    this.box = new Box(position, this.width, this.height, false, false, optBgColor, optBgColor, optHasNoBorder)
    if (this.multiLine) {
	this.lines = []
	if (optText)
	    this.lines.push(optText)
    } 
}

TextBox.prototype.propertyTypes = {position: 'Point', text: 'String'}

sketchpad.addClass(TextBox)

TextBox.dummy = function(x, y) {
    return new TextBox(new Point(x, y))
}

TextBox.prototype.solutionJoins = function() { 
    return {text: sketchpad.lastOneWinsJoinSolutions}
}

TextBox.prototype.draw = function(canvas, origin) {
    var ctxt = canvas.ctxt
    var x = this.position.x + origin.x, y = this.position.y + origin.y
    this.box.draw(canvas, origin)
    ctxt.font = this.fontSize + 'px ' + this.font
    ctxt.fillStyle = this.fontColor    
    var lines = this.multiLine ? this.lines : [this.text]
    var width = this.width
    var margin = this.fontSize / 3
    for (var i = 0; i < lines.length; i++) {
	var txt = lines[i]
	var offset = (width - (('' + txt).length * this.fontSize / 2.5)) / 2
	ctxt.fillText(txt, x + offset, y + margin + i * this.fontSize + 20)
    }
}

TextBox.prototype.border = function() {
    return this.box
}

TextBox.prototype.center = function() {
    return this.box.center()
}

TextBox.prototype.containsPoint = function(x, y) { return this.box.containsPoint(x, y) }

TextBox.prototype.grabPoint = function() {
    return this.box.grabPoint()
}

TextBox.prototype.add = function(text) {
    if (this.multiLine)
	this.lines.push(text)
    else
	this.text += text
}


function Vector(x, y, optPos, optLabel, optColor) {
    this.x = x
    this.y = y
    this.position = optPos || new Point(700,300)
    this.label = optLabel || ''
    this.color = optColor || 'orange'
}

sketchpad.addClass(Vector)

Vector.prototype.propertyTypes = {x: 'Number', y: 'Number', position: 'Point', label: 'String', color: 'String'}

Vector.dummy = function(x, y) {
    return new Vector(50, 50, new Point(x, y), 'label')
}

Vector.prototype.draw = function(canvas, origin) {
    canvas.drawArrow(this.position, {x: this.position.x + this.x + origin.x, y: this.position.y + this.y + origin.y}, origin, this.label + ' (' + this.x + ', ' + this.y + ')', this.color)
}

Vector.prototype.border = function() {
    return new Line(this.position, new Point(this.position.x + this.x + 5, this.position.y + this.y + 5), undefined, 8).border()
}

Vector.prototype.containsPoint = function(x, y) {
    return new Box(new Point(this.position.x - 25, this.position.y - 25), 25, 25).containsPoint(x, y)
}

Vector.prototype.center = function(x, y) {
    return this.position
}

function PointVector(origin, end, scale, optLabel) {
    this.origin = origin
    this.end = end
    this.scale = scale
    this.label = optLabel || ''
}

sketchpad.addClass(PointVector)

PointVector.prototype.propertyTypes = {origin: 'Point', end: 'Point', scale: 'Number', label: 'String', color: 'String'}

PointVector.dummy = function(x, y) {
    var l = Line.dummy(x, y)
    return new PointVector(l.p1, l.p2, 1)
}

PointVector.prototype.grabPoint = function() {
    return this.end
}

PointVector.prototype.containsPoint = function(x, y) {
    return new Box(new Point(this.origin.x - 25, this.origin.y - 25), 50, 50).containsPoint(x, y)
}

PointVector.prototype.center = function() {
    return this.origin
}

PointVector.prototype.border = function() {
    return new Line(this.origin, this.end, undefined, 8).border()
}

PointVector.prototype.draw = function(canvas, origin) {
    canvas.drawArrow(this.origin, this.end, origin, this.color)
    this.end.draw(canvas, origin)
    var ctxt = canvas.ctxt
    ctxt.fillStyle = 'orange'
    ctxt.fillText(this.label, origin.x + this.origin.x - 20, origin.y + this.origin.y - 20, 32)
}

PointVector.prototype.magnitude = function() {
    return scaledBy(minus(this.end, this.origin), this.scale)
}

function Timer(stepSize, optPos) {
    this.stepSize = stepSize
    this.position = optPos || new Point(150,25)
}

sketchpad.addClass(Timer)
    
Timer.prototype.propertyTypes = {stepSize: 'Number', position: 'Point'}

Timer.dummy = function(x, y) {
    // we don't want multiple timers being running around!
    if (!Timer.timer)
	Timer.timer = new Timer(1, new Point(x, y))
    return Timer.timer
}

Timer.prototype.grabPoint = function() {
    return this.position
}

Timer.prototype.border = function() {
    return new Box(new Point(this.position.x - 50, this.position.y - 25), 100, 75).border()
}

Timer.prototype.containsPoint = function(x, y) {
    return new Box(new Point(this.position.x - 25, this.position.y + 5), 50, 50).containsPoint(x, y)
}

Timer.prototype.center = function(x, y) {
    return this.position
}

Timer.prototype.draw = function(canvas, origin) {
    this.position.draw(canvas, origin)
    var txt = 'time: ' + Math.floor(rc.sketchpad.pseudoTime) + ', step: ' + this.stepSize
    rc.ctxt.fillText(txt, this.position.x + origin.x - 30, this.position.y + origin.y + 25)
}
