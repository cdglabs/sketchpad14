Examples.textlayout = { }

var plus = Sketchpad.geom.plus
var minus = Sketchpad.geom.minus
var magnitude = Sketchpad.geom.magnitude

rc.preventBrowserDefaultKeyEvents()

// --- Classes -------------------------------------------------------------

Examples.textlayout.TextArea = function Examples__textlayout__TextArea(lineHeight, columnMargin, box) {    
    this.lineHeight = lineHeight
    this.columnMargin = columnMargin
    this.box = box
    this.chars = []    
    this.__origin = this.box.__origin
    this.viewOffset = 0
    this.maxLineCount = Math.floor(box.height / lineHeight)
}

sketchpad.addClass(Examples.textlayout.TextArea)

Examples.textlayout.TextArea.prototype.init = function() {
    rc.add(this.box)
    this.cursor = new Examples.textlayout.Char(new Point(0, 0, 'gray', 2), '|', undefined, undefined, undefined, 'green')
    rc.add(this.cursor, this)
    this.slider = rc.add(new Examples.slider.Slider({obj: this, prop: 'viewOffset'}, false, new Point(this.box.width, 0), 20, this.box.height, {start: 0, end: 1}, true), this.box)
    this.slider.init()
    //rc.addConstraint(Sketchpad.arith.EqualityConstraint, {obj: this.box.bottomCorner, prop: 'x'}, {obj: this.slider.frame.position, prop: 'x'}, [2])
    //rc.addConstraint(Sketchpad.arith.EqualityConstraint, {obj: this.box.position, prop: 'y'}, {obj: this.slider.frame.position, prop: 'y'}, [2])
    //rc.addConstraint(Sketchpad.arith.EqualityConstraint, {obj: this.box, prop: 'height'}, {obj: this.slider.frame, prop: 'height'}, [2])
    this.cursorConstraint = rc.addConstraint(Examples.textlayout.CharFollowAdjacentsConstraint, this.cursor, this)
    this.optimalBreaksConstraint = new Examples.textlayout.WordWrapOptimalBreaks(this)
    this.optimalBreaksConstraint.__priority = 2
    this.justifyConstraint = new Examples.textlayout.WordWrapJustify(this)
    var mode = sketchpad.scratch.wordWrapModes[sketchpad.scratch.wordWrapMode]
    if (mode === 'optimal' || mode === 'justify') {
	rc.addNewConstraint(this.optimalBreaksConstraint)
	if (mode === 'justify')
	    rc.addNewConstraint(this.justifyConstraint)
    }
    return this
}

Examples.textlayout.TextArea.prototype.draw = function(canvas, origin) {
    this.viewOffset = this.cursorLineOffset()
    var pos = this.box.position.minus({x: 0, y: this.viewOffset * this.lineHeight})
    var box = this.box
    var posX = pos.x, posY = pos.y
    this.chars.forEach(function(c) {
	p = c.position
	if (box.containsPoint(p.x + posX, p.y + posY - 2))
	    c.draw(canvas, pos)
    })
    this.cursor.draw(canvas, pos)
}

Examples.textlayout.TextArea.prototype.center = function() { return this.box.center() }
Examples.textlayout.TextArea.prototype.width = function() { return this.box.width }
Examples.textlayout.TextArea.prototype.lineCharLimit = function() { return Math.floor((this.width() - ( 2 * this.columnMargin)) / this.cursor.width) }
Examples.textlayout.TextArea.prototype.position = function() { return this.box.position }
Examples.textlayout.TextArea.prototype.topLeft = function() { return {x: this.columnMargin, y: this.lineHeight} }
Examples.textlayout.TextArea.prototype.text = function() {return this.chars.map(function(c) { return c.chr }).join('') }
Examples.textlayout.TextArea.prototype.topLeft = function() { return {x: this.columnMargin, y: this.lineHeight} }
Examples.textlayout.TextArea.prototype.cursorLineOffset = function() {
    var o = Math.ceil((this.cursor.position.y - this.box.height) / this.lineHeight)
    return Math.max(0, o)
}

Examples.textlayout.TextArea.prototype.addText = function(text) { 
    rc.pause()
    text.split('').forEach(function(c) { this.addChar(c) }.bind(this)) 
    rc.unpause()
}

Examples.textlayout.TextArea.prototype.addChar = function(chr) {
    var cursor = this.cursor
    var newChar = new Examples.textlayout.Char(new Point(0, 0, 'gray', 5), chr)
    rc.add(newChar, this)
    this.chars.splice(cursor.next ? this.chars.indexOf(cursor.next) : this.chars.length, 0, newChar)
    var prev = cursor.prev
    if (prev)
	prev.next = newChar
    newChar.prev = prev
    newChar.next = cursor.next    
    if (cursor.next) {
	cursor.next.prev = newChar
    }
    cursor.prev = newChar
    var constraint = rc.addConstraint(Examples.textlayout.CharFollowAdjacentsConstraint, newChar, this)
    constraint.___container = this.box
    var mode = sketchpad.scratch.wordWrapModes[sketchpad.scratch.wordWrapMode]
    if (mode === 'optimal' || mode === 'justify') {
	textArea.optimalBreaksConstraint['pos' + newChar.__id] = newChar.position
	if (newChar.isSpace())
	    textArea.justifyConstraint['char' + newChar.__id] = newChar
    }
}

Examples.textlayout.TextArea.prototype.deleteChar = function() {
    var cursor = this.cursor
    var deletedChar = cursor.prev
    if (deletedChar) {
	var chars = this.chars
	chars.splice(chars.indexOf(deletedChar), 1)
	if (deletedChar.prev)
	    deletedChar.prev.next = cursor.next
	if (cursor.next)
	    cursor.next.prev = deletedChar.prev
	cursor.prev = deletedChar.prev
	cursor.next = deletedChar.next
	rc.remove(deletedChar, true)
    }
}

Examples.textlayout.TextArea.prototype.moveCursorLeft = function() {
    var cursor = this.cursor
    if (cursor.prev) {
	cursor.next = cursor.prev
	cursor.prev = cursor.prev.prev
    }
}

Examples.textlayout.TextArea.prototype.moveCursorRight = function() {
    var cursor = this.cursor
    if (cursor.next) {
	cursor.prev = cursor.next
	cursor.next = cursor.next.next
    } 
}

Examples.textlayout.TextArea.prototype.computePerSpaceCharPaddingForEvenColumns = function() {
    var res = []
    var newLines = this.newLineIdxs
    var colWidth = this.width() - (this.columnMargin * 2)
    var idx = 0
    var next = newLines[idx]
    var takenSp = 0, sps = []
    for (var i = 0; i < this.chars.length; i++) {
	var c = this.chars[i]	
	if (i == next) {
	    var d = c.prev
	    while (d && d.isSpace()) {
		sps.pop()
		takenSp -= d.width
		d = d.prev
	    }
	    var empty = colWidth - takenSp - (idx > 0 ? this.columnMargin : 0)
	    var paddingNeeded = empty > 0 && sps.length > 0 ? (empty / sps.length) : 0
	    if (paddingNeeded) {
		//console.log(c, i, colWidth, takenSp, paddingNeeded, sps.length)
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

Examples.textlayout.TextArea.prototype.wordJustifyWrapSlackTable = function(W, L, n) {
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
Examples.textlayout.TextArea.prototype.wordJustifyWrapFirstInLineWords = function(words, L) {
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

Examples.textlayout.TextArea.prototype.wordJustifyWrapNewLineCharIndices = function(text, L) {
    var res = ''
    var words = text.split(' ')
    //console.log(words)
    var F = this.wordJustifyWrapFirstInLineWords(words, L)
    //console.log(JSON.stringify(F))
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

Examples.textlayout.Char = function Examples__textlayout__Char(position, chr, width, height, fontSize, color) {
    this.position = position
    this.chr = chr
    this.width = width || 12
    this.height = height || 22
    this.fontSize = fontSize || 18
    this.color = color || 'black'
    this.origWidth = this.width
}

sketchpad.addClass(Examples.textlayout.Char)

Examples.textlayout.Char.prototype.grabPoint = function() { 
    return this.position
}

Examples.textlayout.Char.prototype.center = function() { 
    return this.position.center()
}

Examples.textlayout.Char.prototype.draw = function(canvas, origin) {
    var position = origin.plus(this.position)
    //var hSize = this.fontSize / 2, hWidth = this.width / 2, hHeight = this.height / 2
    var text = this.chr
    var space = text.length
    var font = canvas.ctxt.font
    canvas.ctxt.font = this.fontSize + 'px Monaco'
    canvas.ctxt.fillStyle = this.color
    canvas.ctxt.shadowOffsetX = 0
    canvas.ctxt.shadowOffsetY = 0
    rc.ctxt.fillText(text, position.x /*- hWidth*/, position.y /*+ hHeight - 5*/)
    canvas.ctxt.font = font
}

Examples.textlayout.Char.prototype.isSpace = function() { return this.chr === ' ' }
Examples.textlayout.Char.prototype.isNewLine = function() { return this.chr === '\n' }
Examples.textlayout.Char.prototype.isFirstInWord = function() { return this.isSpace() || this.prev === undefined || this.prev.isSpace() }
Examples.textlayout.Char.prototype.wordWidth = function() {  return this.isSpace() ? 0 : (this.width + (this.next === undefined ? 0 : this.next.wordWidth())) }
Examples.textlayout.Char.prototype.pastMarginX = function(marginX) { return this.position.x + this.width > marginX }
Examples.textlayout.Char.prototype.revertWidth = function() { this.width = this.origWidth }


// --- Constraint Defs -------------------------------------------------------

//  CharFollowAdjacentsConstraint

Examples.textlayout.CharFollowAdjacentsConstraint = function Examples__textlayout__CharFollowAdjacentsConstraint(character, textArea) {
    this.character = character
    this.pos = character.position
    this.textArea = textArea
}

sketchpad.addClass(Examples.textlayout.CharFollowAdjacentsConstraint, true)

Examples.textlayout.CharFollowAdjacentsConstraint.prototype.description = function() {
    var mode = sketchpad.scratch.wordWrapModes[sketchpad.scratch.wordWrapMode]
    var isGreedy = mode === 'greedy'
    return "Examples.textlayout.CharFollowAdjacentsConstraint(Char C, TextArea T) states that character C should follow its predecessor character, or if it has none should reside on the top left corner of the T's paragraph." + (isGreedy ? "If character's word would not fit in the same line, it should be placed at the beginning of the next line." : '')
}

Examples.textlayout.CharFollowAdjacentsConstraint.prototype.effects = function() {
    return [{obj: this.pos, props: ['x', 'y']}]
}

Examples.textlayout.CharFollowAdjacentsConstraint.prototype.computeTarget = function(previous, character, topLeft, marginX, lineHeight) {
    var target
    // nobody before me: should be at line beginning
    if (previous === undefined) {
	target = topLeft
    } else {
	var mode = sketchpad.scratch.wordWrapModes[sketchpad.scratch.wordWrapMode]
	var previousP = previous.position
	var targetX = previousP.x + previous.width
	var columnMargin = this.textArea.columnMargin
	var firstInLine = false
	if (previous.isNewLine() && !character.isSpace()) {
	    firstInLine = true
	} else if (mode === 'greedy') {
	    firstInLine = !character.isSpace() && previous.isSpace() && targetX + character.wordWidth() > marginX
	}
	// im the first letter in word and the word doesnt fit in this line
	if (firstInLine)
	    target = {x: topLeft.x, y: previousP.y + lineHeight}
	else // it fits, just go to the right of my previous
	    target = {x: targetX, y: previousP.y}
    }
    return target
}

Examples.textlayout.CharFollowAdjacentsConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    this.targetPos = this.computeTarget(this.character.prev, this.character, this.textArea.topLeft(), this.textArea.width() - this.textArea.columnMargin, this.textArea.lineHeight)
    var res = magnitude(minus(this.targetPos, this.character.position))
    return res
}

Examples.textlayout.CharFollowAdjacentsConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    return {pos: this.targetPos}
}

Examples.textlayout.CharFollowAdjacentsConstraint.prototype.draw = function(canvas, origin) {
    var p = new Point(this.pos.x, this.pos.y - 20, undefined, undefined, undefined, 0.5)
    p.draw(canvas, origin)
}

Examples.textlayout.CharFollowAdjacentsConstraint.prototype.containsPoint = function(x, y) {
    var p = new Point(this.pos.x, this.pos.y - 20, undefined, undefined, undefined, 0.5)
    return p.containsPoint(x, y)
}

Examples.textlayout.CharFollowAdjacentsConstraint.prototype.border = function() {
    var p = new Point(this.pos.x, this.pos.y - 20, undefined, undefined, undefined, 0.5)
    return p.border()
}

Examples.textlayout.CharFollowAdjacentsConstraint.prototype.grabPoint = function() {
    return this.pos
}

// WordWrapOptimalBreaks

Examples.textlayout.WordWrapOptimalBreaks = function Examples__textlayout__WordWrapOptimalBreaks(textArea) {
    this.textArea = textArea
}

Examples.textlayout.WordWrapOptimalBreaks.prototype.description = function() {
    return "Examples.textlayout.WordWrapOptimalBreaks(TextArea T) states that the text in the T should have optimal placement of line breaks (based on the dynamic programming algorithm). For those character's that have been chosen to be first in lines, the constraint sates that they should be placed in the beginning of the lines."
}


sketchpad.addClass(Examples.textlayout.WordWrapOptimalBreaks, true)


Examples.textlayout.WordWrapOptimalBreaks.prototype.effects = function() {
    var textArea = this.textArea
    var res = []
    for (var i = 0; i < textArea.chars.length; i++) {
	var c = textArea.chars[i]
	res.push({obj: c.position, props: ['x', 'y']})
    }
    return res
}

Examples.textlayout.WordWrapOptimalBreaks.prototype.computeTarget = function(pseudoTime, prevPseudoTime) {
    var textArea = this.textArea
    var soln = {} 
    var newLines = textArea.wordJustifyWrapNewLineCharIndices(textArea.text(), textArea.lineCharLimit())    
    //log(newLines)
    var idx = 0
    var next = newLines[idx]
    var topLeft = textArea.topLeft()
    var targetY = topLeft.y
    for (var i = 0; i < textArea.chars.length; i++) {
	var c = textArea.chars[i]
	if (i == next) {
	    next = newLines[++idx]
	    var prop = 'pos' + c.__id
	    targetY += textArea.lineHeight
	    //console.log(targetY, c.position.y)
	    soln[prop] = {x: topLeft.x, y: targetY}
	} 
    }
    //log2(soln)
    return soln
}

Examples.textlayout.WordWrapOptimalBreaks.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var soln = this.computeTarget(pseudoTime, prevPseudoTime)
    this.soln = soln
    var e = 0
    var textArea = this.textArea
    for (var i = 0; i < textArea.chars.length; i++) {
	var c = textArea.chars[i]
	var currPos = {x: c.position.x, y: c.position.y}
	var prop = 'pos' + c.__id
	if (soln[prop])
	    e += magnitude(minus(soln[prop], currPos))
    }
    return e
}

Examples.textlayout.WordWrapOptimalBreaks.prototype.solve = function(pseudoTime, prevPseudoTime) {
    return this.soln
}

// WordWrapJustify

Examples.textlayout.WordWrapJustify = function Examples__textlayout__WordWrapJustify(textArea) {
    this.textArea = textArea
}

sketchpad.addClass(Examples.textlayout.WordWrapJustify, true)

Examples.textlayout.WordWrapJustify.prototype.description = function() {
    return "Examples.textlayout.WordWrapJustify(TextArea T) states that spaces in each line of T's paragraph should be paded so that each line is expanded to the fully fill the margins of the column."
}

Examples.textlayout.WordWrapJustify.prototype.computeTarget = function(pseudoTime, prevPseudoTime) {
    var textArea = this.textArea
    this.paddings = textArea.computePerSpaceCharPaddingForEvenColumns()
    var soln = {} 
    this.paddings.forEach(function(p) {
	var c = p.character
	var pad = p.padding
	var prop = 'char' + c.__id
	soln[prop] = {width: pad + c.width}
    })
    this.soln = soln
    return soln
}

Examples.textlayout.WordWrapJustify.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var soln = this.computeTarget(pseudoTime, prevPseudoTime)
    var e = 0
    this.paddings.forEach(function(p) { e += p.padding })
    return e
}

Examples.textlayout.WordWrapJustify.prototype.solve = function(pseudoTime, prevPseudoTime) {
    return this.soln
}


examples['text layout'] = function() {

// --- Time / Event Handling ---------------------------------------------
// --- Constraints ---------------------------------------------------------

    rc.showGrabPoints = true
    rc.grabPointOpacity = 0
    sketchpad.rho = 1
    sketchpad.solveEvenWithoutErrorOnPriorityDifferences = true
    rc.setOption('renderMode', 3)
    sketchpad.scratch.wordWrapModes = ['greedy', 'optimal', 'justify']
    sketchpad.scratch.wordWrapMode = 0

    rc.sketchpad.registerEvent('keypress', function(e) { 
	var k = e.keyCode
	if (k >= 32 && k <= 126) {
	    textArea.addChar(String.fromCharCode(k))
	} 
    }, "If a character add character to textarea.")
    
    rc.sketchpad.registerEvent('keydown', function(e) { 
	var k = e.keyCode
	switch (k) {
	    // return
	    case 8: textArea.deleteChar(); break
	    // enter
	    case  13: textArea.addChar("\n"); break
	    // left
	    case 37: textArea.moveCursorLeft(); break
	    // right
	    case 39: textArea.moveCursorRight(); break
	    // toggle wrap mode
	    case 18: toggleWordWrapMode(); break
	}
    }, "on 'backspace' delete character to left of cursor, 'Return' add a newline char, 'left'/'right': move cursor left/right.")

    var toggleWordWrapMode = function() {	
	sketchpad.scratch.wordWrapMode = (sketchpad.scratch.wordWrapMode + 1) % 3
	var mode = sketchpad.scratch.wordWrapModes[sketchpad.scratch.wordWrapMode]
	modeLabel.text = '"' + mode + '"'
	if (mode === 'optimal' || mode === 'justify') {
	    for (var i = 0; i < textArea.chars.length; i++) {	    
		var c = textArea.chars[i]
		textArea.optimalBreaksConstraint['pos' + c.__id] = c.position
		if (c.isSpace())
		    textArea.justifyConstraint['char' + c.__id] = c
	    }	    
	    if (mode === 'justify') {
		rc.addNewConstraint(textArea.justifyConstraint)		
	    } else {
		rc.addNewConstraint(textArea.optimalBreaksConstraint)
	    }
	} else {
	    rc.removeConstraint(textArea.optimalBreaksConstraint)
	    rc.removeConstraint(textArea.justifyConstraint)		
	    for (var i = 0; i < textArea.chars.length; i++) {	    
		var c = textArea.chars[i]
		if (c.isSpace())
		    c.revertWidth()
	    }
	}
    }

// --- Data ----------------------------------------------------------------
    modeText = rc.add(new TextBox(new Point(400, 50), 'Press "Option/Alt" to toggle word-wrap mode:', false, 20, 500, 40, '#81f781'))
    modeLabel = rc.add(new TextBox(modeText.position.plus({x: modeText.width + 10, y: 0}), ('"' + sketchpad.scratch.wordWrapModes[sketchpad.scratch.wordWrapMode] + '"'), false, 20, 90, 40, '#f6ceec'))
    textArea = rc.add(new Examples.textlayout.TextArea(22, 10, new Box(rc.add(new Point(200, 200, 'gray', 6)), 200, 100, true, true, undefined, '#f0ee9e'))).init()
    textArea.addText("Call me Ishmael. Some years ago, never mind how long precisey.")
    //textArea.box.width = 850
    //textArea.addText("Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen, and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people's hats off, then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship")//"if c2 is after none:\n  c2's position = upper left corner\n\nif c2 is after c1:\n  if (c1 is whitespace and c1's position's x + c1's width + c2's word width is past the right margin) or c1 is a new line character:\n    c2's position = start of 1 line(s) below c1\n  otherwise:\n    c2 is to the right of c1")    
}
