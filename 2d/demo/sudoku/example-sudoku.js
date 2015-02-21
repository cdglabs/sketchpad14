Examples.sudoku = {
    urls: [
	'./sudoku/img/0.png',
	'./sudoku/img/1.png',
	'./sudoku/img/2.png',
	'./sudoku/img/3.png',
	'./sudoku/img/4.png',
	'./sudoku/img/5.png',
	'./sudoku/img/6.png',
	'./sudoku/img/7.png',
	'./sudoku/img/8.png',
	'./sudoku/img/9.png'
    ]
}

var plus = Sketchpad.geom.plus
var minus = Sketchpad.geom.minus
var magnitude = Sketchpad.geom.magnitude
var scaledBy = Sketchpad.geom.scaledBy

// --- Classes -------------------------------------------------------------

Examples.sudoku.Shape = function Examples__sudoku__Shape(position, kind, optRotation, optBoard, optSize) {
    this.position = position
    this.kind = kind
    this.image = new Image1(position, this.getUrl(this.kind), optRotation /*|| randomRotation()*/, optSize || 0.6)
    if (optBoard) {
	this.board = optBoard
	this.boardPos = optBoard.getCoord(position)
    }
}

sketchpad.addClass(Examples.sudoku.Shape)

Examples.sudoku.Shape.prototype.propertyTypes = {position: 'Point', kind: 'Number'}

Examples.sudoku.Shape.prototype.draw = function(canvas, origin) { this.image.draw(canvas, origin) }
Examples.sudoku.Shape.prototype.grabPoint = function() { return this.position }
Examples.sudoku.Shape.prototype.border = function() { return this.image.border() }
Examples.sudoku.Shape.prototype.center = function() { return this.image.center() }
Examples.sudoku.Shape.prototype.containsPoint = function(x, y) { return this.image.containsPoint(x, y) }
Examples.sudoku.Shape.prototype.getUrl = function(kind) { return Examples.sudoku.urls[kind] }

Examples.sudoku.Board = function Examples__sudoku__Board(position, width, height, squareLength, cells, visible) {
    this.position = position
    this.width = width
    this.height = height
    this.squareLength = squareLength
    this.cells = cells
    this.visible = visible
}

sketchpad.addClass(Examples.sudoku.Board)

Examples.sudoku.Board.prototype.propertyTypes = {position: 'Point', width: 'Number', height: 'Number'}

Examples.sudoku.Board.prototype.solutionJoins = function() {
    return {cells: sketchpad.dictionaryAddJoinSolutions}
}

Examples.sudoku.Board.prototype.draw = function(canvas, origin) {
    if (this.visible) {
	var position = this.position, squareLength = this.squareLength, width = this.width, height = this.height
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
}

Examples.sudoku.Board.prototype.border = function() {  return new Box(this.position, this.width * this.squareLength, this.height * this.squareLength) }
Examples.sudoku.Board.prototype.center = function() { return this.position }
Examples.sudoku.Board.prototype.containsPoint = function(x, y) {
    return this.border().containsPoint(x, y)
}

Examples.sudoku.Board.prototype.fits = function(shape, pos) {
    var there = this.getCell(pos.i, pos.j)
    return there == 0 || there === shape
}

Examples.sudoku.Board.prototype.getCell = function(i, j) { return this.cells[i * this.width + j] }
Examples.sudoku.Board.prototype.setCell = function(i, j, p) { this.cells[i * this.width + j] = p }
Examples.sudoku.Board.prototype.getCoordFromIndex = function(k) { var i = Math.floor(k / this.width), j = k % this.width; return {i: i, j: j} }

Examples.sudoku.Board.prototype.getCoord = function(pos) {
    var unit = this.squareLength
    var offset = minus(pos.plus({x: unit / 2, y: unit / 2}), this.position)
    var offX = Math.floor(offset.x / unit)
    var offY = Math.floor(offset.y / unit)
    return {i: offY, j: offX}
}

Examples.sudoku.Board.prototype.getPos = function(coord) {
    var unit = this.squareLength
    return this.position.plus({x: (coord.j * unit) , y:  (coord.i * unit) })
}

Examples.sudoku.Board.prototype.getEmptyCoord = function(shape) {
    var pos = shape.boardPos
    var i = pos.i, j = pos.j
    var cells = this.cells
    var count = cells.length
    var k = -1
    var empties = []
    for (var k = 0; k < count; k++)
	if (cells[k] == 0)
	    empties.push(k)
    var res = undefined
    if (empties.length > 0) {
	k = Math.floor(Math.random() * empties.length)
	var ij = this.getCoordFromIndex(empties[k])
	res = {i: ij.i, j: ij.j}
    }
    return res
}

// --- Constraint Defs -------------------------------------------------------

Examples.sudoku.ImageSwingConstraint = function Sketchpad__geom__ImageSwingConstraint(shape, onlyOnDangle) {
    this.shape = shape
    this.onlyOnDangle = onlyOnDangle
    this.image = shape.image
    this.image._origRotation = this.image.rotation
    this.image._swingSpeed = onlyOnDangle ? .5 : 2
    this.rotationOffset = Math.random() * Math.PI
    this._lastPos = shape.position
}

sketchpad.addClass(Examples.sudoku.ImageSwingConstraint, true)

Examples.sudoku.ImageSwingConstraint.description = function() { return  "Examples.sudoku.ImageSwingConstraint(Shape S) causes image of S to swing." } 

Examples.sudoku.ImageSwingConstraint.prototype.description = function() { return  "image of shape" + this.shape.__toString + " should swing." } 

Examples.sudoku.ImageSwingConstraint.prototype.propertyTypes = {image: 'Shape'}

Examples.sudoku.ImageSwingConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var shape = this.shape, pos = shape.position
    var image = this.image
    var t = image._swingSpeed * (pseudoTime / 10)
    this._targetRotation = (image._origRotation + (Math.sin(t + this.rotationOffset) * Math.PI / 10))
    return this._targetRotation - image.rotation
}

Examples.sudoku.ImageSwingConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    return {image: {rotation: this._targetRotation}}
}

Examples.sudoku.ImageSwingConstraint.prototype.onEachTimeStep = function(pseudoTime, prevPseudoTime) {
    if (this.onlyOnDangle) {
	var movement = this.shape.position.x - this._lastPos.x
	var movementA = Math.abs(movement)
	if (movementA > 0)
	    this.image._swingSpeed += (movement / 200)
	else {
	    this.image._swingSpeed /= 1.05
	    if (this.image._swingSpeed < 0.001)
		this.image._swingSpeed = 0
	}
	this._lastPos = this.shape.position.copy()
    }
}

//  ShapePlacementConstraint

Examples.sudoku.ShapePlacementConstraint = function Examples__sudoku__ShapePlacementConstraint(shape) {
    this.shape = shape
    this.board = shape.board
    this.shapePos = shape.position
    this.shapeBoardPos = shape.boardPos
    this.boardCells = this.board.cells
}

sketchpad.addClass(Examples.sudoku.ShapePlacementConstraint, true)

Examples.sudoku.ShapePlacementConstraint.description = function() {
    return "Examples.sudoku.ShapePlacementConstraint(Shape P) states that if P is moved inside the board and it fits in the current square it should be placed nicely on the P's board B and B should add it in its list of placed shapes."
}

Examples.sudoku.ShapePlacementConstraint.prototype.description = function() {
    return "if shape " + this.shape.__toString + " is moved inside the board " + this.board.__toString + "and it fits in the current square it should be placed nicely on the shapes's board and board should add it in its list of placed shapes."
}

Examples.sudoku.ShapePlacementConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var shapePos = this.shapePos
    var board = this.board
    var boardPoint = board.position
    var inside = board.containsPoint(shapePos.x, shapePos.y)
    var diff = 0
    var unit = board.squareLength
    var posCoord = board.getCoord(shapePos)
    var offY = posCoord.i
    var offX = posCoord.j 
    if (inside && board.fits(this.shape, {i: offY, j: offX})) {
	this._offX = offX
	this._offY = offY
	this._placing = true
	this._target = plus(boardPoint, {x: offX * unit, y: offY * unit})
    } else {
	this._placing = false
	this._target = this.shape._origPos
    }
    diff = magnitude(minus(this._target, shapePos))
    return diff
}

Examples.sudoku.ShapePlacementConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var board = this.board, shape = this.shape
    var dict = {}
    var sol = {shapePos: {x: this._target.x, y: this._target.y}}
    if (this._placing) {
	var posCoord = shape.boardPos
	var offY = posCoord.i
	var offX = posCoord.j 
	var dict = {}
	dict[((this._offY * board.width) + this._offX)] = shape
	dict[((offY * board.width) + offX)] = 0
	sol.board = {cells: dict}
	sol.shapeBoardPos = {i: this._offY, j: this._offX}
    }
    return sol
}

// SudokuConstraint

Examples.sudoku.SudokuConstraint = function Examples__sudoku__SudokuConstraint(board) {
    this.board = board
    this.pieces = board.pieces
    for (var p in this.pieces) {
	this['piece' + p] = this.pieces[p]
    }
}

sketchpad.addClass(Examples.sudoku.SudokuConstraint, true)

Examples.sudoku.SudokuConstraint.description = function() {
    return "Examples.sudoku.SudokuConstraint(Board B) states the definition of a solution for the Sudoku problem: all pieces should be placed on the board."
}

Examples.sudoku.SudokuConstraint.prototype.description = function() {
    return "Sudoku problem should be solved: all pieces should be placed on the board."
}

Examples.sudoku.SudokuConstraint.prototype.__searchable = true

Examples.sudoku.SudokuConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    return 0
}

Examples.sudoku.SudokuConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var board = this.board
    return {}
}

examples['sudoku'] = function() {
    //sketchpad.setOption('debug', true)
    //rc.preventBrowserDefaultKeyEvents()
    sketchpad.setOption('solveEvenWithoutErrorOnPriorityDifferences', true)
    rc.setOption('dragConstraintPriority', 0)

    // ==================== Intro =================

    
    function addBoard(frame, grid, shapeSize, currBoard) {
	if (currBoard) {
	    currBoard.cells.forEach(function (s) { if (s !== 0) { rc.remove(s) } })
	    rc.remove(currBoard)
	}
	var boardShapes = []
	var board = rc.add(new Examples.sudoku.Board(new Point(frame.x, frame.y), frame.cols, frame.rows, frame.squareLength, grid, true), undefined, undefined, false, {unselectable: true, unmovable: true})
	for (var i = 0; i < frame.rows; i++) {
	    for (var j = 0; j < frame.cols; j++) {
		var cell = board.getCell(i, j)
		if (cell == 0) continue
		var x = frame.x + j * frame.squareLength
		var y = frame.y + i * frame.squareLength
		var shape = rc.add(new Examples.sudoku.Shape(new Point(x, y), cell, undefined, board, shapeSize), undefined, undefined, true)
		board.setCell(i, j, shape)
		boardShapes.push(shape)
	    }
	}
	boardShapes.forEach(function(shape) {
	    rc.addConstraint(Examples.sudoku.ImageSwingConstraint, undefined, shape, true)
	})
	return board
    }

    function getGrid(cols, rows) {
	var res = new Array()
	var ctr = 0
	for (var i = 0 ; i < rows; i++)
	    for (var j = 0; j < cols; j++)
		res[ctr++] = (Math.random() < 0.80 ? (Math.random() < 0.5 ? 2 : 1) : 0)
	return res
    }

    function resetBoard(frame, shapeSize, currBoard) {
        var grid = getGrid(frame.cols, frame.rows)
	return addBoard(frame, grid, shapeSize, currBoard)
    }
    // --- Data ----------------------------------------------------------------    
    scratch = sketchpad.scratch
    
    var frame1 = {x: 300, y: 100, width: 1150, height: 500, cols: 10, rows: 10, squareLength: 50}
    frame1.midx = frame1.x + (frame1.width / 2)
    frame1.endx = frame1.x + frame1.width
    frame1.endx = frame1.x + (frame1.width)
    frame1.endy = frame1.y + (frame1.height)
    
    var grid1 = [
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
	0,0,0,0,0,0,0,0,0,0,
    ];

    var board1 = addBoard(frame1, grid1, .6)
    var shapeIcons = []
    for (var i = 0; i <= 9; i++)  {
	shapeIcons.push(rc.add(new Examples.sudoku.Shape(new Point(frame1.x + (frame1.squareLength * frame1.cols) + 25 , frame1.y - 0 + (i * frame1.squareLength)), i,  undefined, undefined, .25), undefined, undefined, undefined, {unselectable: true, unmovable: true}))
    }
    
    // --- Time / Event Handling ---------------------------------------------
    var distance = Sketchpad.geom.distance

   
    sketchpad.registerEvent('pointerup',
			    function(e) {
				var thing = rc.selection
				if (thing instanceof Examples.sudoku.Shape && thing.board) {
				    scratch.dragPlacementConstraint = rc.addConstraint(Examples.sudoku.ShapePlacementConstraint, undefined, thing)
				    thing.image._swingSpeed = 2
				}
				if (scratch.dragDangleConstraint !== undefined) {
				    rc.removeConstraint(scratch.dragDangleConstraint)
				    thing.image._swingSpeed = 2
				    scratch.dragDangleConstraint = undefined
				}
			    }, 'add shape placement constraint when shape is dropped')
    
    sketchpad.registerEvent('pointerdown',
			    function(e) {
				if (scratch.dragPlacementConstraint !== undefined) {
				    rc.removeConstraint(scratch.dragPlacementConstraint)
				    scratch.dragPlacementConstraint = undefined
				}
				var thing = rc.selection
				if (thing instanceof Examples.sudoku.Shape) {
				    var pos = thing.position.copy()
				    thing._origPos = pos.copy()					
				    //scratch.dragDangleConstraint = rc.addConstraint(Examples.sudoku.ImageSwingConstraint, undefined, thing, false, true)
				} else {
				    var x = e.clientX + window.scrollX  
				    var y = e.clientY + window.scrollY
				    for (var idx = 0; idx < shapeIcons.length; idx++) {
					var t = shapeIcons[idx]
					if (t.containsPoint(x, y)) {
					    pos = t.position.copy()
					    thing = rc.add(new Examples.sudoku.Shape(pos, t.kind,  undefined, board1, .25))
					    thing._origPos = thing.position.copy()
					    rc.pointerdown(e)
					    break
					}
				    }
				}
				
			    }, '')

}
