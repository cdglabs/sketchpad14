Examples.pentominoes = { }

var plus = Sketchpad.geom.plus
var minus = Sketchpad.geom.minus
var magnitude = Sketchpad.geom.magnitude
var scaledBy = Sketchpad.geom.scaledBy

// --- Classes -------------------------------------------------------------

Examples.pentominoes.Board = function Examples__pentominoes__Board(position, width, height, squareLength, pieces) {
    this.position = position
    this.width = width
    this.height = height
    this.squareLength = squareLength
    this.pieces = pieces
    this.piecesOn = {}
}

sketchpad.addClass(Examples.pentominoes.Board)

Examples.pentominoes.Board.prototype.propertyTypes = {position: 'Point', width: 'Number', height: 'Number'}

Examples.pentominoes.Board.prototype.solutionJoins = function() {
    return {piecesOn: sketchpad.dictionaryAddJoinSolutions}
}

 Examples.pentominoes.Board.prototype.draw = function(canvas, origin) {
    var position = this.position, squareLength = this.squareLength, width = this.width, height = this.height, piecesOn = this.piecesOn, pieces = this.pieces
    var x = position.x, y = position.y
    var w = width * squareLength, h = height * squareLength
    for (var i = 0; i <= height; i++) {	
	new Line(new Point(x, y, 'white'), new Point(x + w, y, 'white')).draw(canvas, origin)
	y += squareLength
    }
    y = position.y
    for (var i = 0; i <= width; i++) {	
	new Line(new Point(x, y, 'white'), new Point(x, y + h, 'white')).draw(canvas, origin)
	x += squareLength	
    }
}

Examples.pentominoes.Board.prototype.border = function() {  return new Box(this.position, this.width * this.squareLength, this.height * this.squareLength) }
Examples.pentominoes.Board.prototype.center = function() { return this.position }
Examples.pentominoes.Board.prototype.containsPoint = function(x, y) {
    return this.border().containsPoint(x, y)
}

Examples.pentominoes.Board.prototype.fits = function(piece, pos) {    
    var pieceSqrs =  piece.squarePositions()
    var x0 = pos.x, y0 = pos.y, x1 = 0, y1 = 0
    pieceSqrs.forEach(function(s) { if (s.x > x1) x1 = s.x; if (s.y > y1) y1 = s.y })
    var inside =  (x1 + x0) < this.width && (y1 + y0) < this.height
    var res = inside
    if (inside) {
	var occupied = this.occupiedSquares(piece)
	for (var i = 0; i < occupied.length; i++) {
	    var s1 = occupied[i]
	    var x = s1.x, y = s1.y
	    for (var j = 0; j < pieceSqrs.length; j++) {
		var s2 = plus(pieceSqrs[j], pos)
		if (s2.x == x && s2.y == y) return false
	    }
	}
    }
    return res
}

Examples.pentominoes.Board.prototype.occupiedSquares = function(exceptPiece) {
    var res = []
    var piecesOn = this.piecesOn, pieces = this.pieces
    for (var p in piecesOn) {
	var piece = pieces[p]
	if (piece === exceptPiece)
	    break
	var pos = piecesOn[p]
	var pSqrs = piece.squarePositions()
	pSqrs.forEach(function(s) { res.push(plus(pos, s)) })
    }
    return res
}

Examples.pentominoes.Board.prototype.placeSolvedPieces = function() {
    var piecesOn = this.piecesOn, pieces = this.pieces, position = this.position, squareLength = this.squareLength
    for (var p in piecesOn) {
	var newPos = plus(position, scaledBy(piecesOn[p], squareLength))
	var pos = pieces[p].position
	pos.x = newPos.x
	pos.y = newPos.y
    }
    rc.redraw()
}

Examples.pentominoes.Piece = function Examples__pentominoes__Piece(kind, possibleSquarePositions, flipOrientation, angleOrientation, color, position, squareLength) {
    this.position = position
    this.flipOrientation = flipOrientation
    this.angleOrientation = angleOrientation
    this.kind = kind
    this.color = color
    this.squareLength = squareLength
    this.possibleSquarePositions = possibleSquarePositions
    this.squares = [1,2,3,4,5].map(function(x) { return new Box(new Point(0, 0),  this.squareLength, this.squareLength, false, false, 'gray', color) }.bind(this))
}

sketchpad.addClass(Examples.pentominoes.Piece)

Examples.pentominoes.Piece.prototype.propertyTypes = {position: 'Point', flipOrientation: 'Number', angleOrientation: 'Number', kind: 'String', color: 'String'}

Examples.pentominoes.Piece.prototype.grabPoint = function() { return this.position }

Examples.pentominoes.Piece.prototype.draw = function(canvas, origin) {
    var position = this.position, squares = this.squares, squareLength = this.squareLength
    var sqrs =  this.squarePositions()
    for (var i = 0; i < squares.length; i++) {
	var sq = squares[i]
	var offset = sqrs[i]
	sq.draw(canvas, plus(position, scaledBy(offset, squareLength)))
    }
}

Examples.pentominoes.Piece.prototype.border = function() {
    var squares = this.squares
    var sqrs =   this.squarePositions()
    var maxX = 0, maxY = 0
    for (var i = 0; i < squares.length; i++) {
	var sq = squares[i]
	var offset = sqrs[i]
	if (offset.x > maxX)
	    maxX = offset.x
	if (offset.y > maxY)
	    maxY = offset.y
    }    
    return new Box(this.position, (1+maxX) * this.squareLength, (1+maxY) * this.squareLength)
}
Examples.pentominoes.Piece.prototype.center = function() { return this.position }
Examples.pentominoes.Piece.prototype.containsPoint = function(x, y) { return this.border().containsPoint(x, y) }

Examples.pentominoes.Piece.prototype.rotate = function() {
    this.angleOrientation = (this.angleOrientation + 1) % this.possibleSquarePositions[this.flipOrientation].length
}

Examples.pentominoes.Piece.prototype.flip = function() {
    this.flipOrientation = (this.flipOrientation + 1) % this.possibleSquarePositions.length
    this.angleOrientation = this.angleOrientation % this.possibleSquarePositions[this.flipOrientation].length
}

Examples.pentominoes.Piece.prototype.squarePositions = function(canvas, origin) {
    return  this.possibleSquarePositions[this.flipOrientation][this.angleOrientation]
}

// --- Constraint Defs -------------------------------------------------------

//  PiecePlacementConstraint

Examples.pentominoes.PiecePlacementConstraint = function Examples__pentominoes__PiecePlacementConstraint(piece, board) {
    this.board = board
    this.piece = piece
    this.piecePos = piece.position
}

sketchpad.addClass(Examples.pentominoes.PiecePlacementConstraint, true)

Examples.pentominoes.PiecePlacementConstraint.prototype.description = function() {
    return "Examples.pentominoes.PiecePlacementConstraint(Piece P, Board B) states that if P is moved inside the board and it fits in the current square it should be placed nicely on the board B and B should add it in its list of placed pieces."
}

Examples.pentominoes.PiecePlacementConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var piecePos = this.piecePos
    var board = this.board
    var boardPoint = board.position
    var inside = board.containsPoint(piecePos.x, piecePos.y)
    var diff = 0
    if (inside)  {
	var unit = board.squareLength
	var offset = minus(piecePos, boardPoint)
	var offX = Math.floor(offset.x / unit)
	var offY = Math.floor(offset.y / unit)
	if (board.fits(this.piece, {x: offX, y: offY})) {
	    this._offX = offX
	    this._offY = offY
	    this._target = plus(boardPoint, {x: offX * unit, y: offY * unit})
	    diff = magnitude(minus(this._target, piecePos))
	}
    }
    return diff
}

Examples.pentominoes.PiecePlacementConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var dict = {}
    dict[this.piece.kind] = {x: this._offX, y: this._offY}
    var sol = {piecePos: {x: this._target.x, y: this._target.y}, board: {piecesOn: dict}}
    return sol
}

// PentominoesConstraint

Examples.pentominoes.PentominoesConstraint = function Examples__pentominoes__PentominoesConstraint(board) {
    this.board = board
    this.pieces = board.pieces
    for (var p in this.pieces) {
	this['piece' + p] = this.pieces[p]
    }
}

sketchpad.addClass(Examples.pentominoes.PentominoesConstraint, true)

Examples.pentominoes.PentominoesConstraint.prototype.description = function() {
    return "Examples.pentominoes.PentominoesConstraint(Board B) states the definition of a solution for the Pentominoes problem: all pieces should be placed on the board."
}

Examples.pentominoes.PentominoesConstraint.prototype.__searchable = true

Examples.pentominoes.PentominoesConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var board = this.board, width = board.width, height = board.height
    var count = width * height
    var filtered = []
    var occupieds = board.occupiedSquares()
    for (var i = 0; i < occupieds.length; i++) {
	var s = occupieds[i]
	var x = s.x, y = s.y
	if (x >= width || y >= height)
	    return 1
	var key = x + ',' + y
	if (filtered.indexOf(key) < 0) filtered.push(key)
    }
    return filtered.length == count ? 0 : 1
}

Examples.pentominoes.PentominoesConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var board = this.board
    var width =  2//board.width
    var height = 2//board.height
    var pieces = board.pieces
    var sols = []
    //solution:
    /*
    var sol = {}
    sol['pieceT'] = {flipOrientation: 0, angleOrientation: 0}
    sol['pieceY'] = {flipOrientation: 1, angleOrientation: 2}
    sol['pieceL'] = {flipOrientation: 0, angleOrientation: 2}
    sol['board'] = {piecesOn: {T: {x:0,y:0}, Y:{x:1,y:1}, L:{x:0,y:1}}}
    */
    var allCombos = {}
    for (var p in pieces) {
	var piece = pieces[p]
	if (piece instanceof Examples.pentominoes.Piece) {
	    var combos = []
	    allCombos[p] = combos
	    var all = piece.possibleSquarePositions
	    for (var i = 0; i < all.length; i++) {	    
		var angles = all[i]
		for (var j = 0; j < angles.length; j++) {
		    combos.push([i, j])	
		}
	    }
	}
    }
    allCombos.T.forEach(function(t) {
	allCombos.Y.forEach(function(y) {	
	    allCombos.L.forEach(function(l) {
		for (var tx = 0; tx < width; tx++) {
		    for (var ty = 0; ty < height; ty++) {
			for (var yx = 0; yx < width; yx++) {
			    for (var yy = 0; yy < height; yy++) {
				if (tx == yx && ty == yy)
				    continue
				for (var lx = 0; lx < width; lx++) {
				    for (var ly = 0; ly < height; ly++) {					
					if ((tx == lx && ty == ly) || (yx == lx && yy == ly))
					    continue
					var sol = {}
					sol['pieceT'] = {flipOrientation: t[0], angleOrientation: t[1]}
					sol['pieceY'] = {flipOrientation: y[0], angleOrientation: y[1]}
					sol['pieceL'] = {flipOrientation: l[0], angleOrientation: l[1]}
					sol['board'] = {piecesOn: {T: {x: tx, y: ty}, Y: {x: yx, y: yy}, L: {x: lx, y: ly}}}
					sols.push(sol)
				    }
				}
			    }
			}
		    }
		}
	    })
	})
    })	
    return sols
}

examples['pentominoes'] = function() {
    rc.setOption('millisecondsPerFrame', 10000)
    sketchpad.debug = false
    sketchpad.searchOn = false
    scratch = sketchpad.scratch
    
    // --- Constraints ---------------------------------------------------------
    // --- Data ----------------------------------------------------------------
    var squareLength = 50
    // list of list of relative square positions: one for each flip orientation and
    // one for each angle orientation for each flip orientation
    var orients = {
	T: [
	    [[{x: 0, y: 0},  {x: 1, y: 0},  {x: 2, y: 0},  {x: 1, y: 1},  {x: 1, y: 2}],
	     [{x: 2, y: 0},  {x: 0, y: 1},  {x: 1, y: 1},  {x: 2, y: 1},  {x: 2, y: 2}],
	     [{x: 1, y: 0},  {x: 1, y: 1},  {x: 0, y: 2},  {x: 1, y: 2},  {x: 2, y: 2}],
	     [{x: 0, y: 0},  {x: 0, y: 1},  {x: 1, y: 1},  {x: 2, y: 1},  {x: 0, y: 2}]]
	],
	Y: [
	    [[{x: 0, y: 1},  {x: 1, y: 0},  {x: 1, y: 1},  {x: 1, y: 2},  {x: 1, y: 3}],
	     [{x: 2, y: 0},  {x: 0, y: 1},  {x: 1, y: 1},  {x: 2, y: 1},  {x: 3, y: 1}],
	     [{x: 0, y: 0},  {x: 0, y: 1},  {x: 0, y: 2},  {x: 1, y: 2},  {x: 0, y: 3}],
	     [{x: 0, y: 0},  {x: 1, y: 0},  {x: 2, y: 0},  {x: 3, y: 0},  {x: 1, y: 1}]],
	    [[{x: 0, y: 0},  {x: 0, y: 1},   {x: 1, y: 1},  {x: 0, y: 2},  {x: 0, y: 3}],
	     [{x: 0, y: 0},  {x: 1, y: 0},   {x: 2, y: 0},  {x: 3, y: 0},  {x: 2, y: 1}],
	     [{x: 1, y: 0},  {x: 1, y: 1},   {x: 0, y: 2},  {x: 1, y: 2},  {x: 1, y: 3}],
	     [{x: 1, y: 0},  {x: 0, y: 1},   {x: 1, y: 1},  {x: 2, y: 1},  {x: 3, y: 1}]
	    ]
	],	
	L: [
	    [[{x: 0, y: 0}, {x: 1, y: 0},  {x: 1, y: 1},  {x: 1, y: 2},  {x: 1, y: 3}],
	     [{x: 3, y: 0}, {x: 0, y: 1},  {x: 1, y: 1},  {x: 2, y: 1},  {x: 3, y: 1}],
	     [{x: 0, y: 0}, {x: 0, y: 1},  {x: 0, y: 2},  {x: 0, y: 3},  {x: 1, y: 3}],
	     [{x: 0, y: 0}, {x: 1, y: 0},  {x: 2, y: 0},  {x: 3, y: 0},  {x: 0, y: 1}]],
	    [[{x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1},  {x: 0, y: 2},  {x: 0, y: 3}],
	     [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0},  {x: 3, y: 0},  {x: 3, y: 1}],
	     [{x: 1, y: 0}, {x: 1, y: 1}, {x: 1, y: 2},  {x: 0, y: 3},  {x: 1, y: 3}],
	     [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1},  {x: 2, y: 1},  {x: 3, y: 1}]]
	]
    }
    var colors = {
	T: 'red',
	Y: 'green',
	L: 'yellow',
    }
    var pieces = {}
    var board = rc.add(new Examples.pentominoes.Board(new Point(700, 300), 3, 5, squareLength, pieces), undefined, undefined, undefined, {unselectable: true, unmovable: true})
    scratch.board = board
    scratch.drawnSolution = false
    scratch.solveMode = false
    for (o in orients) {
	var piece = rc.add(new Examples.pentominoes.Piece(o, orients[o], 0, 0, colors[o], rc.getRandomPoint(200, 150, 400, 400), squareLength), undefined, true)
	pieces[o] = piece
	rc.addConstraint(Examples.pentominoes.PiecePlacementConstraint, undefined, piece, board)
    }
    rc.add(new TextBox(new Point(350, 50), "Select piece by clicking on its shape. Press 'space' to rotate & 'shift' to flip.", false, 20, 670, 40, '#81f781'))
    scratch.solveButton = rc.add(new TextBox(new Point(420, 100), "Click to toggle solve mode (wait a while...):", false, 20, 450, 40, '#81f781'))
    scratch.modeLabel = rc.add(new TextBox(new Point(880, 100), ('"off"'), false, 20, 50, 40, '#f6ceec'))
    scratch.pentominoesConstraint = new Examples.pentominoes.PentominoesConstraint(board)

        // --- Time / Event Handling ---------------------------------------------
    sketchpad.registerEvent('pointermove',
			    function(e) {
				var finger = rc.fingers[e.pointerId]
				if (finger) {
				    var p = finger.point
				    var t = p.__owner
				    if (t instanceof Examples.pentominoes.Piece) {
					if (scratch.board.piecesOn[t.kind])
					    delete(scratch.board.piecesOn[t.kind])
				    }
				}
			    }, "If piece is picked up it's no longer on the board")
    sketchpad.registerEvent('keyup',
			    function(e) {
				var k = e.which
				var rotate = k == 32, flip = k == 16
				if (rotate || flip) {
				    if (rc.selection instanceof Examples.pentominoes.Piece) {
					rc.selection[rotate ? 'rotate' : 'flip'](); rc.redraw()
				    }
				} 
			    },
			    "When 'space' bar is pressed current piece is rotated 90 deg, when 'shift' is pressed it is flipped.")

    sketchpad.registerEvent('pointerup', function(e) {
	{
	    if (rc.selection == scratch.modeLabel) {
		sketchpad.searchOn = !sketchpad.searchOn
		if (scratch.solveMode) {
		    rc.removeConstraint(scratch.pentominoesConstraint)
		    sketchpad.unsetOnEachTimeStep()
		    scratch.board.piecesOn = {}
		    scratch.drawnSolution = false
		} else {
		    rc.addNewConstraint(scratch.pentominoesConstraint)
		    sketchpad.setOnEachTimeStep(function(pseudoTime, prevPseudoTime) {
			if (sketchpad.searchOn && !scratch.drawnSolution && scratch.pentominoesConstraint.computeError(pseudoTime, prevPseudoTime) == 0) {
			    scratch.drawnSolution = true
			    scratch.board.placeSolvedPieces()
			}
		    }, "Once solved place pieces in solved positions")					
		}
		scratch.solveMode = !scratch.solveMode
		scratch.modeLabel.text = '"' + (scratch.solveMode ? 'on' : 'off') + '"'
		rc.redraw()
	    }
	}}, "on button click we toggle the solve mode (which when true adds the main Pentominoes constraint forcing the problem to be solved automatically).")


}
