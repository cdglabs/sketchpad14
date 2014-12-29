Examples.qbf = { }

rc.preventBrowserDefaultKeyEvents()

// --- Classes -------------------------------------------------------------

Examples.qbf.Belt = function Examples__qbf__Belt(position1, position2, speed) {
    this.position1 = position1
    this.position2 = position2
    this.speed = speed    
    this.line1 = new Line(position1, position2)
    this.line2 = new Line(plus(position1, new Point(0, 10)), plus(position2, new Point(0,10)))
}

sketchpad.addClass(Examples.qbf.Belt)

Examples.qbf.Belt.prototype.propertyTypes = {position1: 'Point', position2: 'Point', speed: 'Number', line1: 'Line', line2: 'Line'}

Examples.qbf.Belt.dummy = function(x, y) {
    return new Examples.qbf.Belt(new Point(x - 100, y), new Point(x + 100, y), 1)
}

Examples.qbf.Belt.prototype.draw = function(canvas, origin) {
    this.line1.draw(canvas, origin)
    this.line2.draw(canvas, origin)
    this.position1.draw(canvas, origin)
    this.position2.draw(canvas, origin)
}

Examples.qbf.Tile = function Examples__qbf__Tile(id, position, text, active, optFontColor) {
    this.id = id
    this.position = position
    this.text = text
    this.length = qbf.tileLength
    this.active = active
    this.fontColor = optFontColor || 'red'
}

sketchpad.addClass(Examples.qbf.Tile)

Examples.qbf.Tile.prototype.propertyTypes = {id: 'String', position: 'Point', text: 'String', length: 'Number', fontColor: 'String', active: 'Boolean'}

Examples.qbf.Tile.dummy = function(x, y) {
    return new Examples.qbf.Belt('d', new Point(x - 100, y), '')
}

Examples.qbf.Tile.prototype.grabPoint = function() {
    return this.position
}

Examples.qbf.Tile.prototype.draw = function(canvas, origin) {
    var position = plus(this.position, origin)
    var length = this.length
    var hLength = this.length / 2
    var tl = plus(position, {x: 0, y: 0})
    var tr = plus(position, {x: length, y: 0})
    var bl = plus(position, {x: 0, y: length})
    var br = plus(position, {x: length, y: length})
    var lt = new Line(tl, tr)
    var lr = new Line(tr, br)
    var ll = new Line(tl, bl)
    var lb = new Line(bl, br)
    var lines = [lt, lr, ll, lb]
    var text = this.text
    var val = isNaN(text) ? text : Math.floor(text)
    var space = isNaN(val) ? val.length : 1 + (Math.floor(Math.log(val) / Math.log(10)))
    var font = canvas.ctxt.font
    canvas.ctxt.font = '32px Arial'
    canvas.ctxt.fillStyle = this.active ? this.fontColor : 'pink'
    rc.ctxt.fillText(val, position.x + hLength - (5 + (space * 7)), position.y + hLength + 10)
    canvas.ctxt.font = font
    lines.forEach(function (line) { line.draw(canvas, origin) })    
}

Examples.qbf.Tile.prototype.border = function() {
    return new Box(this.position, this.length, this.length)
}

Examples.qbf.Tile.prototype.center = function() {
    return this.position
}

Examples.qbf.Tile.prototype.containsPoint = function(x, y) {
    var p = this.position
    var res = x >= p.x && x <= p.x + this.length && y >= p.y && y <= p.y + this.length
    return res
}

Examples.qbf.WordRack = function(count) {
    this.count = count
    this.index = 0
    this.tiles = []
}

sketchpad.addClass(Examples.qbf.WordRack)

Examples.qbf.WordRack.prototype.propertyTypes = {count: 'Number', index: 'Number'}

Examples.qbf.WordRack.dummy = function(x, y) {
    return new Examples.qbf.WordRack(0)
}

// --- Constraint Defs -------------------------------------------------------

// Solution Joins

Examples.qbf.Tile.prototype.solutionJoins = function() { 
    var lastGuyWinsJoinFn = rc.sketchpad.lastOneWinsJoinSolutions
    return {active: lastGuyWinsJoinFn, used: lastGuyWinsJoinFn, text: lastGuyWinsJoinFn, ref: lastGuyWinsJoinFn}
}
    
Examples.qbf.WordRack.prototype.solutionJoins = function() { 
    return {index: rc.sketchpad.lastOneWinsJoinSolutions}
}
   
//  TileActivation Constraint

Examples.qbf.TileActivationConstraint = function Examples__qbf__TileActivationConstraint(tile, surfaceP1, surfaceP2) {
    this.tile = tile
    this.surfaceP1 = surfaceP1
    this.surfaceP2 = surfaceP2
}

sketchpad.addClass(Examples.qbf.TileActivationConstraint, true)

Examples.qbf.TileActivationConstraint.prototype.description = function() {
    return "Examples.qbf.TileActivationConstraint(Tile T, Point P1, Point P2) states that tile T's 'active' property should be true when T is sitting on line section P1-2."
}

Examples.qbf.TileActivationConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var tile = this.tile
    var isOn = Sketchpad.simulation.detectContact(tile.length * 1.2, tile.position, {x: 0, y: 0}, this.surfaceP1, this.surfaceP2)
    var ok = (isOn && !tile.used) ? tile.active : !tile.active
    return ok ? 0 : 1    
}

Examples.qbf.TileActivationConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var tile = this.tile
    var isOn = Sketchpad.simulation.detectContact(tile.length * 1.2, tile.position, {x: 0, y: 0}, this.surfaceP1, this.surfaceP2)
    return {tile: {active: (isOn && !tile.used)}}
}

//  TileChoosing Constraint

Examples.qbf.TileChoosingConstraint = function Examples__qbf__TileChoosingConstraint(tile, tiles, wordRack) {
    this.tile = tile
    this.tiles = tiles
    this.wordRack = wordRack
    var wordTiles = wordRack.tiles
    for (var i = 0; i < wordTiles.length; i++)
	this['tile' + i] = wordTiles[i]
}

sketchpad.addClass(Examples.qbf.TileChoosingConstraint, true)

Examples.qbf.TileChoosingConstraint.prototype.description = function() {
    return "Examples.qbf.TileChoosingConstraint(Tile T, Tile[] Ts, WordRack Rack) states if tile is active and its letter matches with latest typed character (scratch.letterTyped) and there are no other matching tiles that come before this tile, then this tile T should become inactive and Rack's next character index should be incremented by 1."
}

Examples.qbf.TileChoosingConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var tile = this.tile
    var tiles = this.tiles
    var res = 0
    if (!tile.used && tile.active && scratch.letterTyped == tile.text) {
	var tilePositionX = tile.position.x
	var noSameTileBeforeMe = true
	for (var i = 0; i < tiles.length; i++) {
	    var aTile = tiles[i]
	    if (aTile.old.active && scratch.letterTyped == aTile.text && aTile.position.x < tilePositionX) {
		noSameTileBeforeMe = false
		break
	    }
	}
	if (noSameTileBeforeMe) {
	    res = tile.active ? 1 : 0
	}
    }
    return res
}

Examples.qbf.TileChoosingConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var tile = this.tile
    var wordRack = this.wordRack
    var wordTile = wordRack.tiles[wordRack.index]
    var soln = {tile: {active: false, used: true}, wordRack: {index: (wordRack.index + 1)}}
    soln['tile' + wordRack.index] = {text: scratch.letterTyped, ref: tile}
    return soln
}

//  TileUnchoosing Constraint

Examples.qbf.TileUnchoosingConstraint = function Examples__qbf__TileUnchoosingConstraint(tile, tiles, wordRack) {
    this.tile = tile
    this.tiles = tiles
    this.wordRack = wordRack
    //HACK FIXME: shouldnt have to do this!
    tiles.forEach(function(t) { this['tile' + t.id] = t }.bind(this)) 
}

sketchpad.addClass(Examples.qbf.TileUnchoosingConstraint, true)

Examples.qbf.TileUnchoosingConstraint.prototype.description = function() {
    return "Examples.qbf.TileUnchoosingConstraint(Tile T, Tile[] Ts, WordRack Rack) states that if user has pressed 'backspace' and tile T happens to be the last letter put on the Rack, then it must be reactivated."
}

Examples.qbf.TileUnchoosingConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var tile = this.tile
    var res = 0
    if (scratch.letterDeleted && tile.ref && tile.id == scratch.wordRackIndex - 1) {
	res = tile.ref.active ? 0 : 1
    }
    return res

}

Examples.qbf.TileUnchoosingConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    var tile = this.tile
    var soln = {tile: {text: '', ref: undefined}, wordRack: {index: wordRack.index - 1}}
    soln['tile' + tile.ref.id] = {active: true, used: false}
    return soln
}

//  Feeder Tile Count Constraint

Examples.qbf.FeederTileCountConstraint = function Examples__qbf__FeederTileCountConstraint(feeder, feederBelt, tiles) {
    this.feeder = feeder
    this.feederBelt = feederBelt
    this.tiles = tiles
}

sketchpad.addClass(Examples.qbf.FeederTileCountConstraint, true)

Examples.qbf.FeederTileCountConstraint.prototype.description = function() {
    return "Examples.qbf.FeederTileCountConstraint(Feeder F, Belt B, Tile[] Ts) states that the number displayed on the feeder should equal to the number of tiles in Ts that happen to be currently on top of belt B."
}

Examples.qbf.FeederTileCountConstraint.prototype.computeError = function(pseudoTime, prevPseudoTime) {
    var count = 0
    var feederBelt = this.feederBelt
    this.tiles.forEach(function(tile) {
	if (Sketchpad.simulation.detectContact(tile.length, tile.position, {x: 0, y: 0}, feederBelt.position1, feederBelt.position2))
	    count++
    })
    this.okCount = count
    return Math.abs(count - this.feeder.text)
}

Examples.qbf.FeederTileCountConstraint.prototype.solve = function(pseudoTime, prevPseudoTime) {
    return {feeder: {text: this.okCount}}
}

var qbf = {tileCount: 100, tileLength: 50, beltSpeed: 8, feederSpeed: 4, vowelRatio: .3}
var tiles = []
wordRack = new Examples.qbf.WordRack(8)
var plus = Sketchpad.geom.plus
var minus = Sketchpad.geom.minus

examples['quick brown fox'] = function() {

// --- Time / Event Handling ---------------------------------------------

    scratch = rc.sketchpad.scratch
    scratch.letterTyped = undefined
    scratch.letterDeleted = undefined

    Examples.qbf.Tile.prototype.onEachTimeStep = function(tMillis) { 
	if (!this.old)
            this.old = new Examples.qbf.Tile(this.id, this.position, this.text, this.active)
	this.old.active = this.active
    }

    Examples.qbf.Tile.prototype.onEachTimeStepDescription = function() { 
	return "Record the 'active' property in this.old copy."
    }

    rc.sketchpad.afterEachTimeStep = function() {	
	scratch.letterTyped = undefined
	scratch.letterDeleted = undefined
	scratch.wordRackIndex = wordRack.index
    }

    rc.sketchpad.registerEvent('keydown', function(e) { 
	var k = e.which
	if (k >= 65 && k <= 90) 
	    scratch.letterTyped = String.fromCharCode(k)
	else if (k == 8)
	    scratch.letterDeleted = true
	else if (k == 13)
	    wordSubmitted()
    }, "On 'backspace' sets scratch.letterDeleted = true, on 'enter' submits the work, on alpha characters sets scratch.letterTyped to character")

    var wordSubmitted = function() {
	// check word...
	if (wordRack.index > 1) {
	    var word = []
	    var score = 0
	    for (var i = 0; i < wordRack.index; i++) {
		var tile = wordRack.tiles[i]
		var letter = tile.text
		score += letterValues[letter]
		word.push(letter.toLowerCase())
		tile.text = ''
		tile.ref = undefined
	    }
	    word = word.join("")
	    var isWord = dictionary.indexOf(word) > 0
	    if (!isWord)
		score = -score
	    var scoreBoard = isWord ? goodWords : badWords
	    scoreBoard.add(word + '(' + score + ')')
	    wordRack.index = 0
	}
    }

// --- Data ----------------------------------------------------------------
// --- Constraints ---------------------------------------------------------

    var tileLength = qbf.tileLength
    var tileHLength = tileLength / 2
    var tileDLength = tileLength * 2

    var groundP1 = rc.add(new Point(300, 700))
    var groundP2 = rc.add(new Point(1100, 700))
    var ground = rc.add(new Line(groundP1, groundP2))
    var groundP3 = rc.add(new Point(1200, 10))
    var groundP4 = rc.add(new Point(1200 + qbf.tileCount * qbf.tileLength + 100, 10))
    var feederBelt = rc.add(new Examples.qbf.Belt(groundP3, groundP4, qbf.feederSpeed))
    var groundP5 = rc.add(new Point(920, 280))
    var groundP6 = rc.add(new Point(1200, 280))
    var belt = rc.add(new Examples.qbf.Belt(groundP5, groundP6, qbf.beltSpeed))
    var groundP5 = rc.add(new Point(550, 300))
    var groundP6 = rc.add(new Point(900, 300))
    var platform = rc.add(new Line(groundP5, groundP6))

    rc.addConstraint(Sketchpad.simulation.TimerConstraint, rc.add(new Timer(.5)))

    rc.add(new TextBox(new Point(550, 50), "-- ( 'backspace' to delete, 'enter' to submit ) --", 22))

    // score boards
    var goodWords = rc.add(new TextBox(new Point(150, 100), undefined, 22, 150, 500, undefined, undefined, 'green'))
    var badWords = rc.add(new TextBox(new Point(350, 100), undefined, 22, 150, 500, undefined, undefined, 'red'))

    // feeder
    var feederPos = new Point(1182 - tileHLength , 50 - tileHLength, 'gray', 5)
    var feeder = rc.add(new Examples.qbf.Tile('f', feederPos, qbf.tileCount, true, 'black'))	

    // word rack
    for (var i = 0; i < wordRack.count; i++) {
	var tilePos = new Point(570 + i * tileLength, 500 - tileHLength, 'gray', 5)
	var tile = new Examples.qbf.Tile(i, tilePos, '', true, 'green')
	wordRack.tiles.push(tile)
	rc.add(tile)
    }

    var isVowel = function(l) { return vowels.indexOf(l) > 0 }

    var getRandomLetter = function() {
	var ratio = qbf.vowelRatio
	var getVowel = getConsonant = false	
	if (numConsonants > 0 && numVowels > 0) {
	    var currR = numVowels / (numConsonants + numVowels)
	    if (currR < (ratio * 0.9))
		getVowel = true
	    else if (currR > (ratio * 1.1))
		getConsonant = true
	}
	var src = getVowel ? vowels : (getConsonant ? consonants : allLetters)
	var pick = src[Math.floor(Math.random() * src.length)]
	if (isVowel(pick)) { numVowels++ } else { numConsonants++ }
	return pick
    }

    var vowels = ['A', 'E', 'I', 'O', 'U']    
    var letterValues = { A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10}
    var allLetters = []
    for (var l in letterValues) if (letterValues.hasOwnProperty(l)) allLetters.push(l)
    var consonants = allLetters.filter(function(l) { return !isVowel(l) })
    var numVowels = 0, numConsonants = 0
    for (var i = 0; i < qbf.tileCount; i++) {
	var tilePos = new Point(feederBelt.position1.x + (i + 0.5) * tileLength, feederBelt.position1.y - tileLength, 'gray', 5)
	var tileBody = new Sketchpad.simulation.FreeBody(tilePos, tileDLength)
	var tile = rc.add(new Examples.qbf.Tile(i, tilePos, getRandomLetter(), false))
	tile.body = tileBody
	tiles.push(tile)
	rc.addConstraint(Sketchpad.simulation.HitSurfaceConstraint, tileBody, ground.p1, ground.p2)
	rc.addConstraint(Sketchpad.simulation.HitSurfaceConstraint, tileBody, belt.position1, belt.position2)
	rc.addConstraint(Sketchpad.simulation.HitSurfaceConstraint, tileBody, feederBelt.position1, feederBelt.position2)
	rc.addConstraint(Sketchpad.simulation.HitSurfaceConstraint, tileBody, platform.p1, platform.p2)
	rc.addConstraint(Sketchpad.simulation.ConveyorBeltConstraint, tileBody, belt)
	rc.addConstraint(Sketchpad.simulation.ConveyorBeltConstraint, tileBody, feederBelt)
	rc.addConstraint(Sketchpad.simulation.AccelerationConstraint, tileBody, {x: 0, y: Sketchpad.simulation.g})
	rc.addConstraint(Sketchpad.simulation.VelocityConstraint, tileBody)
	rc.addConstraint(Examples.qbf.TileActivationConstraint, tile, platform.p1, platform.p2)
	rc.addConstraint(Examples.qbf.TileChoosingConstraint, tile, tiles, wordRack)
    }
    var wrTiles = wordRack.tiles
    for (var i = 0; i < wordRack.count; i++) {
	rc.addConstraint(Examples.qbf.TileUnchoosingConstraint, wrTiles[i], tiles, wordRack)
    }    
    for (var i = 0; i < qbf.tileCount; i++) {
	var tile1 = tiles[i]
	for (var j = i + 1; j < qbf.tileCount; j++) {
	    var tile2 = tiles[j]
	    rc.addConstraint(Sketchpad.simulation.NoOverlapConstraint, tile2.body, tile1.body)
	}
    }
    rc.addConstraint(Examples.qbf.FeederTileCountConstraint, feeder, feederBelt, tiles)
 
}

