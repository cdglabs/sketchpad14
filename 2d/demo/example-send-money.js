Examples.sendmoney = { }

var plus = Sketchpad.geom.plus

// --- Classes -------------------------------------------------------------
Examples.sendmoney.Tile = function Examples__sendmoney__Tile(position, letter, values, optFontColor) {
    this.position = position
    this.letter = letter
    this.values = values
    this.length = 75
    this.fontColor = optFontColor || 'red'
}

sketchpad.addClass(Examples.sendmoney.Tile)

Examples.sendmoney.Tile.prototype.propertyTypes = {position: 'Point', letter: 'String', fontColor: 'String'}

Examples.sendmoney.Tile.prototype.grabPoint = function() { return this.position }

Examples.sendmoney.Tile.prototype.draw = function(canvas, origin) {
    var position = plus(this.position, origin)
    var length = this.length, hLength = this.length / 2
    var tl = plus(position, {x: 0, y: 0}), tr = plus(position, {x: length, y: 0})
    var bl = plus(position, {x: 0, y: length}), br = plus(position, {x: length, y: length})
    var lt = new Line(tl, tr), lr = new Line(tr, br), ll = new Line(tl, bl), lb = new Line(bl, br)
    canvas.ctxt.font = '32px Arial'
    canvas.ctxt.fillStyle = 'gray'
    rc.ctxt.fillText(this.letter, position.x + 5, position.y + 25)
    canvas.ctxt.fillStyle = 'red'
    rc.ctxt.fillText(this.values[this.letter], position.x + hLength - 10, position.y + hLength + 15);
    [lt, lr, ll, lb].forEach(function (line) { line.draw(canvas, origin) })    
}

Examples.sendmoney.Tile.prototype.border = function() {  return new Box(this.position, this.length, this.length) }
Examples.sendmoney.Tile.prototype.center = function() { return this.position }
Examples.sendmoney.Tile.prototype.value = function() { return this.values[this.letter] }

Examples.sendmoney.Tile.prototype.containsPoint = function(x, y) {
    var p = this.position
    return x >= p.x && x <= p.x + this.length && y >= p.y && y <= p.y + this.length
}

// --- Constraint Defs -------------------------------------------------------

//  SendMoreMoneyConstraint

Examples.sendmoney.SendMoreMoneyConstraint = function Examples__sendmoney__SendMoreMoneyConstraint(rows, values) {
    this.values = values
    this.rows = rows
}

sketchpad.addClass(Examples.sendmoney.SendMoreMoneyConstraint, true)

Examples.sendmoney.SendMoreMoneyConstraint.prototype.description = function() {
    return "Examples.sendmoney.SendMoreMoneyConstraint(Tile[][] Rows, Dictionary Vs) states the SEND+MORE=MONERY problem: Rows is an array of words (one for each three word here) where each word is an array of letters represented as Tile types. Vs is a mapping from a letter (one of {S, E, N, D, M, O, R, Y}) to an integer in range [0, 9]."
}

Examples.sendmoney.SendMoreMoneyConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var rows = this.rows
    var values = this.values
    var seen = {}
    for (var k in values) {
	var val = values[k]
	if (seen[val])
	    return 1
	seen[val] = true
    }	
    var nums = this.rows.map(function(r) { return Number.parseInt(r.map(function(t) { return t.value() }).join('')) })
    return (nums[2] == nums[1] + nums[0]
	    && rows[0][0].value() != 0 && rows[1][0].value() != 0 && rows[1][0].value() != 0) ? 0 : 1
}

Examples.sendmoney.SendMoreMoneyConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    return {}
}

// ChooseLetterConstraint

Examples.sendmoney.ChooseLetterConstraint = function Examples__sendmoney__ChooseLetterConstraint(letter, values) {
    this.letter = letter
    this.values = values
}

sketchpad.addClass(Examples.sendmoney.ChooseLetterConstraint, true)

Examples.sendmoney.ChooseLetterConstraint.prototype.description = function() {
    return "Examples.sendmoney.ChooseLetterConstraint(String Letter, Dictionary M) says that mapping M should map Letter to an integer in range [0, 9]."
}

Examples.sendmoney.ChooseLetterConstraint.prototype.__searchable = true

Examples.sendmoney.ChooseLetterConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var val = this.values[this.letter]
    return val >= 0 && val <= 9 ? 0 : 1
}

Examples.sendmoney.ChooseLetterConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var letter = this.letter
    return [0, 1, 2, 5, 6, 7].map(function(v) { var sol = {}; sol[letter] = v; return {values: sol} })
}

function resetValues(vs) {
    var def = {s: 9, e: 5,  n: 6, d: -1, m: -1, o: -1, r: 8, e: -1, y: -1}
    for (var i in def)
	vs[i] = def[i]
}

examples['send money'] = function() {
    rc.setOption('millisecondsPerFrame', 10000)
    sketchpad.debug = false
    sketchpad.searchOn = true
    sketchpad.rho = 1
    // --- Constraints ---------------------------------------------------------
    // --- Data ----------------------------------------------------------------
    solveButton = rc.add(new TextBox(new Point(800, 300), ('click to solve (wait a while)'), false, 20, 250, 40, '#f6ceec'))

    for (var i = 0; i < 10; i++) {	
	var o1 = rc.add(new Point(400 + i * 75, 600, 'gray', 12))
	o1._selectionIndices.push(i)
    }
    //var values = {s: 9, e: 5, n: 6, d: 7, m: 1, o: 0, r: 8, y: 2} <-- solution
    var values =  {s: -1, e: -1,  n: -1, d: -1, m: -1, o: -1, r: -1, e: -1, y: -1}
    resetValues(values)
    var rows = []
    var words = ["money", "more", "send"]
    var x = 300, y = 400
    words.forEach(function(w) {
	var currRow = []
	w.split('').forEach(function(l) {
	    currRow.push(rc.add(new Examples.sendmoney.Tile(new Point(x, y), l, values)))
	    x += 85
	})
	rows.unshift(currRow)
	x = 385
	y-= 85
    })
    var origin = {x: 400, y: 550}, unit = 75
    for (var letter in values) {
	if (values[letter] == -1) {
	    rc.addConstraint(Examples.sendmoney.ChooseLetterConstraint, letter, values)
	}
	var letterPos = rc.add(new Point(0, 550, 'red', 14))
	var letterVec = new Vector(0, 0)
	letterPos._selectionIndices.push(letter)
	rc.addConstraint(Sketchpad.arith.EqualityConstraint, {obj: letterVec, prop: 'x'}, {obj: values, prop: letter}, [1])
	rc.addConstraint(Sketchpad.geom.CartesianPointConstraint, letterPos, letterVec, origin, unit)
    }
    var problemConstraint = new Examples.sendmoney.SendMoreMoneyConstraint(rows, values)
    var solveOn = false
    
    // --- Time / Event Handling ---------------------------------------------
    sketchpad.registerEvent('pointerup', function(e) {
	solveOn = !solveOn
	if (rc.selection == solveButton) {
	    if (solveOn) {
		solveButton.text = 'solved'
		rc.redraw()
		rc.addNewConstraint(problemConstraint)
		resetValues(values)
	    } else {
		solveButton.text = 'click to solve (wait a while)'
		rc.removeConstraint(problemConstraint)	
	    }
	}})
    
}

