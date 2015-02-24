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

Examples.sudoku.Shape = function Examples__sudoku__Shape(position, kind, optRotation, optBoard, optSize, optColor) {
    this.position = position
    this.kind = kind
    this.image = //new Image1(position, this.getUrl(this.kind), optRotation /*|| randomRotation()*/, optSize || 0.6)
    new TextBox(position, kind, false, (optSize || 1) * 40, optBoard ? optBoard.squareLength : 50, optBoard ? optBoard.squareLength : 50, undefined,  undefined , optColor, true)
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

Examples.sudoku.Board = function Examples__sudoku__Board(position, width, height, regionSize, squareLength, cells, visible) {
    this.position = position
    this.width = width
    this.height = height
    this.regionSize = regionSize
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
	var position = this.position, regionSize = this.regionSize, squareLength = this.squareLength, width = this.width, height = this.height
	var x = position.x, y = position.y
	var w = width * squareLength, h = height * squareLength
	for (var i = 0; i <= height; i+=regionSize) {
	    new Line(new Point(x, y, 'white'), new Point(x + w, y, 'white'), 'black').draw(canvas, origin)
	    y += squareLength * regionSize
	}
	y = position.y
	for (var i = 0; i <= width; i+=regionSize) {	
	    new Line(new Point(x, y, 'white'), new Point(x, y + h, 'white'), 'black').draw(canvas, origin)
	    x += squareLength * regionSize	
	}
    }
    x = position.x
    y = position.y
    var conflicts = this.getConflicts()
    for (var i = 0; i < height; i++) {
	var rowConflict = conflicts.rows[i]
	for (var j = 0; j < width; j++) {
	    var colConflict = conflicts.cols[j]
	    var color = rowConflict || colConflict ? '#FFB2B2' : 'white'
	    new Box(new Point(x + (j *  squareLength), y + (i *  squareLength)), squareLength, squareLength, undefined, undefined, undefined, color, undefined, undefined, 0.5).draw(canvas, origin)
	}
    }
    
}

Examples.sudoku.Board.prototype.border = function() {  return new Box(this.position, this.width * this.squareLength, this.height * this.squareLength) }
Examples.sudoku.Board.prototype.center = function() { return this.position }
Examples.sudoku.Board.prototype.containsPoint = function(x, y) {
    return this.border().containsPoint(x, y)
}

Examples.sudoku.Board.prototype.positionIsInside = function(pos) {
    var hl = this.squareLength / 2
    var res = this.containsPoint(pos.x + hl, pos.y + hl)
    return res
}


Examples.sudoku.Board.prototype.fits = function(shape, pos) {
    var there = this.getCell(pos.i, pos.j)
    return there == 0 || there === shape
}

Examples.sudoku.Board.prototype.getConflicts = function() {
    var regionSize = this.regionSize, width = this.width, height = this.height, cells = this.cells
    var conflicts = {rows: {}, cols: {}}
    for (var i = 0; i < height; i++) {
	var es = {}
	for (var j = 0; j < width; j++) {
	    var e = this.getCell(i, j)
	    if (e !== 0) {
		e = e.kind
		var old = es[e]
		if (old === undefined) {
		    es[e] = true
		} else if (old !== e) {
		    conflicts.rows[i] = true
		    break
		}
	    }
	}
    }
    for (var j = 0; j < width; j++) {
	var es = {}
	for (var i = 0; i < height; i++) {
	    var e = this.getCell(i, j)
	    if (e !== 0) {
		e = e.kind
		var old = es[e]
		if (old === undefined) {
		    es[e] = true
		} else if (old !== e) {
		    conflicts.cols[j] = true
		    break
		}
	    }
	}
    }
    //log(conflicts)
    return conflicts
}

Examples.sudoku.Board.prototype.getCell = function(i, j) { return this.cells[i * this.width + j] }
Examples.sudoku.Board.prototype.setCell = function(i, j, p) { this.cells[i * this.width + j] = p }
Examples.sudoku.Board.prototype.getCoordFromIndex = function(k) { var i = Math.floor(k / this.width), j = k % this.width; return {i: i, j: j} }

Examples.sudoku.Board.prototype.getCoord = function(pos) {
    var res = undefined
    if (this.positionIsInside(pos)) {
	var unit = this.squareLength
	pos  = pos.plus({x: unit / 2, y: unit / 2})
	var offset = minus(pos, this.position)
	var offX = Math.floor(offset.x / unit)
	var offY = Math.floor(offset.y / unit)
	res = {i: offY, j: offX}
    }
    return res
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

Examples.sudoku.Board.prototype.remove = function(shape) {
    for (var j = 0; j < this.width; j++) {
	for (var i = 0; i < this.height; i++) {
	    if (this.getCell(i, j) === shape) {
		this.setCell(i, j, 0)
		return
	    }
	}
    }
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
    var diff = 0
    var unit = board.squareLength
    var posCoord = board.getCoord(shapePos)
    var offY = posCoord.i
    var offX = posCoord.j 
    if (posCoord && board.fits(this.shape, {i: offY, j: offX})) {
	this._offX = offX
	this._offY = offY
	this._placing = true
	this._target = plus(boardPoint, {x: offX * unit - 2, y: offY * unit + 5})
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
	var dict = {}
	dict[((this._offY * board.width) + this._offX)] = shape
	if (shape._origPos) {
	    var posCoord = board.getCoord(shape._origPos)
	    if (posCoord) {
		var offY = posCoord.i
		var offX = posCoord.j 	    
		dict[((offY * board.width) + offX)] = 0
	    }
	}
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
	var board = rc.add(new Examples.sudoku.Board(new Point(frame.x, frame.y), frame.cols, frame.rows, frame.regionSize, frame.squareLength, grid, true), undefined, undefined, false, {unselectable: true, unmovable: true})
	for (var i = 0; i < frame.rows; i++) {
	    for (var j = 0; j < frame.cols; j++) {
		var cell = board.getCell(i, j)
		if (cell == 0) continue
		var x = frame.x + j * frame.squareLength - 2
		var y = frame.y + i * frame.squareLength + 5
		var shape = rc.add(new Examples.sudoku.Shape(new Point(x, y), cell, undefined, board, shapeSize, 'gray'), undefined, undefined, true, {unselectable: true, unmovable: true})
		board.setCell(i, j, shape)
		boardShapes.push(shape)
	    }
	}
	//boardShapes.forEach(function(shape) {
	//    rc.addConstraint(Examples.sudoku.ImageSwingConstraint, undefined, shape, true)
	//})
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
    
    var frame1 = {x: 500, y: 120, width: 1150, height: 500, cols: 9, rows: 9, regionSize: 3, squareLength: 50}
    frame1.midx = frame1.x + (frame1.width / 2)
    frame1.endx = frame1.x + frame1.width
    frame1.endx = frame1.x + (frame1.width)
    frame1.endy = frame1.y + (frame1.height)
    
    var grid1 = [
	3,0,0,1,0,2,9,0,4,
	2,7,0,0,0,9,1,0,0,
	0,9,1,0,0,8,7,3,0,
	8,6,7,0,5,1,2,0,0,
	9,5,3,0,0,4,0,0,0,
	1,0,0,3,0,0,0,6,0,
	7,0,2,8,4,5,0,0,1,
	0,1,8,7,0,3,4,2,5,
	5,0,0,2,0,6,0,7,8
    ];

    var board1 = addBoard(frame1, grid1, 1)
    var shapeIcons = []
    for (var i = 1; i <= 9; i++)  {
	shapeIcons.push(rc.add(new Examples.sudoku.Shape(new Point(frame1.x + (frame1.squareLength * frame1.cols) + 25 , frame1.y - 40 + (i * frame1.squareLength)), i,  undefined, undefined, 1), undefined, undefined, undefined, {unselectable: true, unmovable: true}))
    }
    
    // --- Time / Event Handling ---------------------------------------------
    var distance = Sketchpad.geom.distance
   
    sketchpad.registerEvent('pointerup',
			    function(e) {
				var thing = rc.selection
				if (thing instanceof Examples.sudoku.Shape && thing.board) {
				    var pos = thing.position
				    if (thing.board.positionIsInside(pos)) {
					thing.boardPos = thing.board.getCoord(pos)
					scratch.dragPlacementConstraint = rc.addConstraint(Examples.sudoku.ShapePlacementConstraint, undefined, thing)
					//thing.image._swingSpeed = 2
				    } else {
					board1.remove(thing)
					rc.remove(thing)					
				    }
				}
				/*
				if (scratch.dragDangleConstraint !== undefined) {
				    rc.removeConstraint(scratch.dragDangleConstraint)
				    thing.image._swingSpeed = 2
				    scratch.dragDangleConstraint = undefined
				}
				*/
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
					    thing = rc.add(new Examples.sudoku.Shape(pos, t.kind,  undefined, board1, 1, 'blue'))
					    thing._origPos = thing.position.copy()
					    rc.pointerdown(e)
					    break
					}
				    }
				}
				
			    }, '')

}
