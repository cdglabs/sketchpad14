// --- Global Settings ---------------------------------------------------

log = function() { console.log.apply(console, arguments) }
log2 = function() { var args = []; for (var i = 0; i < arguments.length; i++) args.push(JSON.stringify(arguments[i]));  console.log.apply(console, args) }

// --- Canvas -------------------------------------------------------------

function SketchpadScene(sketchpad, canvas) {
    this.sketchpad = sketchpad
    this.millisecondsPerFrame = 1000 / 4 //65
    this.renderFrequencySlowdown = 5
    this.optionsRequiringSIILableUpdate = ['renderMode', 'millisecondsPerFrame',  'onlyRenderOnConvergence', 'onlyRenderOnNoError', 'showEachIteration']
    this.renderMode = 0
    this.onlyRenderOnConvergence = false
    this.renderEvenOnConvergence = false
    this.onlyRenderOnNoError = false
    this.showConstraints = false
    this.showEachIteration = false
    this.iterationsPerFrame = 0    
    this.paused = false
    this.things = []
    this.points = []
    this.thingGrabPoints = []
    this.constraintGrabPoints = []
    this.nonTopLevelThings = []
    this.temps = []
    this.sceneObjects = []
    this.selection = undefined
    this.secondarySelections = []
    this.selectionChoiceIdx = 0
    this.selectionPoints = []
    this.__origin = new Point(0, 0)
    this.tileConstructors = {
	//"Run": {}
    }

    this.keyShortcuts = {
	"Mouse click on space + move: Camera rotate": {},
	"Mouse scroll: Camera Zoom": {},
	"Mouse click on thing + move: Drag thing": {},
	"Opt/Alt + X: Describe program": {}
    }

    this.fingers = {}

    this.pointMode = false
    this.clickSelectMode = false
    this.inDragSelectMode = false
    this.startDragSelectMode = false
    this.codeEditMode = false
    this.selectionBox = undefined
    this.lastPoint = undefined

    this.initPlatformId()
    this.initCanvas(canvas)
    this.initCanvas3D()
    
    var self = this

    this.stepFn = this.step.bind(this)
    this.step()
}

SketchpadScene.prototype.initPlatformId = function() {
    this.isTablet = navigator.userAgent.match(/iPad/i) !== undefined ||
        navigator.userAgent.match(/Android/i) !== undefined
}

SketchpadScene.prototype.initCanvas = function(canvas) {

    this.canvas = canvas

    var self = this
    document.addEventListener('keydown',     this.keydown.bind(this), false)
    document.addEventListener('keyup',       this.keyup.bind(this), false)
    document.addEventListener('pointerdown', this.pointerdown.bind(this), false)
    document.addEventListener('pointermove', this.pointermove.bind(this), false)
    document.addEventListener('pointerup',   this.pointerup.bind(this), false)

    this.ctxt = canvas.getContext('2d')
    this.ctxt.font = '12px Arial'
    this.ctxt.shadowOffsetX = 1
    this.ctxt.shadowOffsetY = 1
    this.ctxt.shadowColor = '#999'
    this.ctxt.shadowBlur = 1
    this.initThingCodeInspector()

    var sii = document.getElementById('sii')

    sii.onclick = function() { this.setRenderMode((this.renderMode + 1) % 4) }.bind(this)
}

SketchpadScene.prototype.initCanvas3D = function() {
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize( window.innerWidth, window.innerHeight - 75)
    document.body.appendChild( this.renderer.domElement )
    //this.cameraControls = new THREE.OrbitControls(this.camera, this.renderer.domElement )
    // create an array with six textures for a cool cube
    this.cameraRefObj = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshBasicMaterial( {color: 'white'}))    
    this.cameraRefObj.position.set(0, 0, 0)
    var viewAngle = 45, aspect = window.innerWidth /  window.innerHeight, near = 1, far = 10000
    this.camera = new THREE.PerspectiveCamera(viewAngle, aspect, near, far)
    this.mouse = { x: 0, y: 0 }
    this.mouseClickOffset = new THREE.Vector3()
    this.mouseClickPlane = new THREE.Mesh(
	new THREE.PlaneBufferGeometry( 2000, 2000, 8, 8 ),
	new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true } )
    )
    this.mouseClickPlane.visible = false
    this.cameraControls = new THREE.OrbitControls( this.camera, this.renderer.domElement )
    this.resetScene()
}

SketchpadScene.prototype.setRenderMode = function(mode) {
        this.renderMode = mode
    if (this.renderMode == 0) {
	this.showEachIteration = false
	this.onlyRenderOnConvergence = false
	this.renderEvenOnConvergence = false
	this.onlyRenderOnNoError = false
    } else if (this.renderMode == 1) {
	this.showEachIteration = false
	this.onlyRenderOnConvergence = false
	this.renderEvenOnConvergence = true
	this.onlyRenderOnNoError = false
    } else if (this.renderMode == 2) {
	this.showEachIteration = true	
	this.onlyRenderOnConvergence = false
	this.renderEvenOnConvergence = false
	this.onlyRenderOnNoError = false
    } else if (this.renderMode == 3) {
	this.showEachIteration = false
	this.onlyRenderOnConvergence = true
	this.renderEvenOnConvergence = false
	this.onlyRenderOnNoError = false
    } else {
	this.showEachIteration = false
	this.onlyRenderOnConvergence = true
	this.renderEvenOnConvergence = false
	this.onlyRenderOnNoError = true
    }
    this.updateSIILabel()
}
    
SketchpadScene.prototype.initThingCodeInspector = function() {
    // editor
    this.thingCodeInspectorDiv = document.getElementById('code-inspector-div')
    this.thingCodeInspectorBottomDiv = document.getElementById('code-inspector-bottom-div')
    this.thingCodeInspector = CodeMirror.fromTextArea(document.getElementById('code-inspector'), {lineWrapping: true})
    this.thingCodeInspectorSize = {width: 1400, height: 400}
    this.thingCodeInspector.setSize(this.thingCodeInspectorSize.width, this.thingCodeInspectorSize.height)
}

// turn off backspace functionality in chrome:
SketchpadScene.prototype.preventSketchpadDefaultKeyEvents = function() {
    this.disableDefaultKeyEvents = true
}

SketchpadScene.prototype.preventBrowserDefaultKeyEvents = function() {
    window.onkeydown = function(event) {
	var tag = event.target.tagName
	if (event.keyCode == 8 && ['CANVAS', 'BODY'].indexOf(tag) >= 0) {
            event.preventDefault()
	    event.stopPropagation()
	}
    }
}

SketchpadScene.prototype.keydown = function(e) {
    var c = e.which // 16: sfht, 17: ctrl, 18: opt, 91: cmd    	
    var k = String.fromCharCode(c)
    var delta = 0.1
    var moveDistance = 200 * delta // 200 pixels per second
    var c = e.which // 16: sfht, 17: ctrl, 18: opt, 91: cmd    	
    switch (c) {
	//case 16: this.enterStartDragSelectMode(); return
	//case 32: this.enterClickSelectMode(); return
	case 18: this.optKeyDown = true; break
    }
    if (!this.optKeyDown || this.disableDefaultKeyEvents)
	return
    var k = String.fromCharCode(c)
    switch (k) {
    //case 'P': this.enterPointMode();  break
    //case 'Z': this.enterPointMode();  break
    //case 'D': this.removeAll(this.selection ? [this.selection] : this.secondarySelections); break
    //case 'C': this.showConstraints = !this.showConstraints; break
    //case 'I': this.inspectState(this.selection); break
    case 'X': this.toggleProgramExplainMode(); break
    //case 'E': this.toggleCodeEditMode(); break
    //case 'S': this.saveCodeEdit(); break
    //case 'N': this.newUserClassFromThings(this.selection ? [this.selection] : this.secondarySelections, false); break
   // case 'B': this.newUserClassFromThings(this.selection ? [this.selection] : this.secondarySelections, true); break
    default:;	
    }
    //this.redraw()
}

SketchpadScene.prototype.updateCamera = function() {
    var camera = this.camera
    var offset = this.cameraOffset.applyMatrix4(this.cameraRefObj.matrixWorld )
    camera.position.x = offset.x
    camera.position.y = offset.y
    camera.position.z = offset.z
    camera.lookAt( this.cameraRefObj.position )
}

SketchpadScene.prototype.resetCamera = function() {
    this.camera.position.set(0,0,0);
    this.cameraRefObj.position.set(0, 0, 0)
    this.cameraRefObj.rotation.set(0,0,0)
    this.cameraOffset = new THREE.Vector3(500,500,500)
    var lights = [[0xffffff, 500,500,500]] //[0xffffff, 500,0,0], [0xffffff, 0,500,0], [0xffffff, 0,0,500]]
    lights.forEach(function(l) { 
	var light = new THREE.PointLight(l[0])
	light.position.set(l[1], l[2], l[3])
	this.scene.add(light)
    }.bind(this))
}

SketchpadScene.prototype.keyup = function(e) {

}

SketchpadScene.prototype.toggleCodeEditMode = function() {
    if (this.selection || this.codeEditMode) {
	this.thingCodeInspectorDiv.hidden = this.codeEditMode
	this.codeEditMode = !this.codeEditMode
	if (this.codeEditMode) {
	    this.thingCodeInspectorBottomDiv.scrollIntoView()
	    this.inspectCode(this.selection)	
	}
    }
}

SketchpadScene.prototype.toggleProgramExplainMode = function() {
    this.thingCodeInspectorDiv.hidden = this.codeEditMode
    this.codeEditMode = !this.codeEditMode
    if (this.codeEditMode) {
	document.scrollTop = 200
	this.thingCodeInspectorBottomDiv.scrollIntoView()
	this.describeProgram()	
    }
}

SketchpadScene.prototype.enterPointMode = function() {
    this.pointMode = true
}

SketchpadScene.prototype.exitPointMode = function() {
    this.pointMode = false
    this.lastPoint = undefined
}

SketchpadScene.prototype.enterClickSelectMode = function() {
    this.clickSelectMode = true
}

SketchpadScene.prototype.exitClickSelectMode = function() {    
    this.clickSelectMode = false
}

SketchpadScene.prototype.enterStartDragSelectMode = function() {
    this.startDragSelectMode = true
}

SketchpadScene.prototype.exitStartDragSelectMode = function() {
    this.startDragSelectMode = false
}

SketchpadScene.prototype.clearSelectionPoints = function() {
    this.selectionPoints = []
    this.points.forEach(function(p) {
	p._selectionIndices = []
    })
}

SketchpadScene.prototype.describeProgram = function() {
    var self = this
    var state = '\n// -- State --\n\n'
    var events = ''
    var handlers = ''
    var description = "/* Program Description */\n"
    description += "\n// -- Constraints --\n"
    for (var name in sketchpad.eventDescriptions)
	sketchpad.eventDescriptions[name].forEach(function(dscr) { if (dscr) events += "'" + name + "': " + dscr + "\n" })
    for (var name in sketchpad.onEachTimeStepHandlerDescriptions)
	sketchpad.onEachTimeStepHandlerDescriptions[name].forEach(function(dscr) { if (dscr) handlers += "'" + name + "': " + dscr + "\n" })
    var constraints = {}, things = {}
    var numConstraints = this.sketchpad.constraints.length
    var i = 0
    var all = this.sketchpad.constraints.concat(this.things)
    all.forEach(function(t) { 
	var isThing = i++ >= numConstraints
	var dict1 = isThing ? things : constraints
	var tp = t.__type
	if (!dict1[tp])
	    dict1[tp] = []
	dict1[tp].push(t)
    })
    i = 0;
    [constraints, things].forEach(function(dict) {
	var one
	for (var tp in dict) {
	    var cs = dict[tp]
	    one = cs[0]
	    cs.forEach(function(c) { state += self.stateToString(c) + "\n" })
	    var ids = cs.map(function(t) { return t.__id })
	    var csList = ids.join(',')
	    var dscrFn = one.description
	    var plural = cs.length > 1 
	    description += "\n" + (i == 0 ? 'Constraint' : 'Thing') + (plural ? 's ' : ' ') + csList + ' ' + (plural ? 'are' : 'is') + ' ' + tp + "\n"
	    if (dscrFn)
		description += "\n" + dscrFn() + "\n"
	    if (one.onEachTimeStepDescription) 
		handlers += "'" + one.__type + "': " + one.onEachTimeStepDescription() + "\n" 		
	}
	if (i == 0) {
	    description += "\n// -- Things --\n"
	}
	i++})
    if (events !== '')
	description += '\n// -- Events --\n\n' + events
    if (handlers !== '')
	description += "\n// -- Ticking Handlers --\n\n" + handlers
    description += state
    this.codeEditMode = true
    this.thingCodeInspectorDiv.hidden = false
    this.thingCodeInspector.setValue(description)
}

SketchpadScene.prototype.computeAllSelectableThings = function() {
    var all = (this.showConstraints ? this.sketchpad.constraints : [])
	.concat(this.nonTopLevelThings)
	.concat(this.things)
	.concat(this.temps)
    return all
}

SketchpadScene.prototype.findThingPointedTo = function(e) {
    var thing = undefined, point = undefined, scenePoint = undefined

    e.preventDefault()
    var vector = new THREE.Vector3( this.mouse.x, this.mouse.y, 0.5 ).unproject( this.camera )
    this.raycaster = new THREE.Raycaster( this.camera.position, vector.sub( this.camera.position ).normalize() )
    var intersects = this.raycaster.intersectObjects(this.sceneObjects)
    // if there is one (or more) intersections
    if (intersects.length > 0) {
	var pointedSceneObj = intersects[ 0 ].object
	if (pointedSceneObj.__sketchpadThing.position) {
	    thing = pointedSceneObj.__sketchpadThing
	    this.selectedSceneObject = pointedSceneObj
	    point = thing.position
	    scenePoint = intersects[0].point
	}
    }
    return {thing: thing, point: point, scenePoint: scenePoint}
}

SketchpadScene.prototype.pointerdown = function(e) {
    var self = this
    var pointedToThing = this.findThingPointedTo(e)
    var thing = pointedToThing.thing
    var point = pointedToThing.point
    if (thing) {
	if (this.selection)
	    this.selection._isSelected = false	
	thing._isSelected = true
	this.setSelection(thing)
    } else {
	if (this.selection)
	    this.selection._isSelected = false	
	this.clearSelections()
    }
    if (point) {
	var scenePoint = pointedToThing.scenePoint
	this.cameraControls.enabled = false
	var intersects = this.raycaster.intersectObject( this.mouseClickPlane)
	this.mouseClickOffset.copy(scenePoint).sub( this.mouseClickPlane.position )
	var x = point.x
	var y = point.y
	var z = point.z
	this.mouseDragCoordConstraint = this.addConstraint(Sketchpad.geom3d.CoordinateConstraint, point, x, y, z)
	this.mouseDragCoordConstraint.__priority = this.dragConstraintPriority
    } 
    this.redraw()
}

SketchpadScene.prototype.pointermove = function(e) {
    e.preventDefault()
    this.mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1
    this.mouse.y = - ( (e.clientY + 30) / window.innerHeight ) * 2 + 1
    var vector = new THREE.Vector3( this.mouse.x, this.mouse.y, 0.5 ).unproject( this.camera )
    this.raycaster = new THREE.Raycaster( this.camera.position, vector.sub( this.camera.position ).normalize() )
    if (this.selectedSceneObject && this.mouseDragCoordConstraint) {
	var intersects = this.raycaster.intersectObject(this.mouseClickPlane)
	this.selectedSceneObject.position.copy( intersects[ 0 ].point.sub(this.mouseClickOffset))
	var pos = this.selectedSceneObject.position, ref = this.mouseDragCoordConstraint.c
	ref.x = pos.x
	ref.y = pos.y
	ref.z = pos.z
	return
    }
    var intersects = this.raycaster.intersectObjects( this.sceneObjects)
    if ( intersects.length > 0 ) {
	if ( this.selectedSceneObject != intersects[ 0 ].object ) {
	    this.selectedSceneObject = intersects[ 0 ].object
	    this.mouseClickPlane.position.copy( this.selectedSceneObject.position )
	    this.mouseClickPlane.lookAt( this.camera.position )    
	}
    } else {
	this.selectedSceneObject = undefined
    }
}

SketchpadScene.prototype.pointerup = function(e) {
    event.preventDefault()
    this.cameraControls.enabled = true
    if (this.selectedSceneObject) {
	this.mouseClickPlane.position.copy( this.selectedSceneObject.position )
	this.selectedSceneObject = undefined
	this.removeConstraint(this.mouseDragCoordConstraint)
	this.mouseDragCoordConstraint = undefined
   }
}

SketchpadScene.prototype.selectThingsWithinSelectionBox = function() {
    var box = this.selectionBox
    var origin = box.__container.__origin
    var res = []
    var all = this.computeAllSelectableThings()
    all.forEach(function(t) {
	var c = t.center()	
	if (box.containsPoint(c.x - origin.x, c.y - origin.y))
	    res.push(t)
    })
    this.secondarySelections = res
}

SketchpadScene.prototype.forEachFinger = function(fn) {
    for (var id in this.fingers) {
	fn(this.fingers[id])
    }
}

SketchpadScene.prototype.step = function() {
    if (!this.paused) {
	var totalError = 0, didSomething = false
	if (this.showEachIteration) {
	    var t0 = this.sketchpad.currentTime()
	    this.sketchpad.doTasksOnEachTimeStep(t0)
	    var iteration = this.sketchpad.doOneIteration(this.sketchpad.currentTime())
	    if (iteration > 0) {
		this.iterationsPerFrame = 1
		totalError = iteration
	    } else {
		this.iterationsPerFrame = 0
	    }
	    didSomething = true
	    this.sketchpad.doTasksAfterEachTimeStep(t0)
	} else {
	    var iterations = this.sketchpad.solveForUpToMillis(this.millisecondsPerFrame)
	    this.iterationsPerFrame = iterations.count
	    totalError = iterations.error
	}
	if (this.renderEvenOnConvergence || this.lastIterationError != totalError) {
	    didSomething = true
	    this.alreadyRenderedConvergence = false
	}
	var redraw = false
	if (this.onlyRenderOnConvergence) {
	    if (!didSomething && (!this.onlyRenderOnNoError || totalError <= this.sketchpad.epsilon) && !this.alreadyRenderedConvergence) {
		this.alreadyRenderedConvergence = true
		redraw = true
	    }
	} else
	    redraw = didSomething
	if (redraw || this.inDragSelectMode)
	    this.redraw()
	this.lastIterationError = totalError
    }
    requestAnimationFrame(this.stepFn)
}

SketchpadScene.prototype.togglePause = function() {
    this.paused = !this.paused
    this.updateSIILabel()
}

SketchpadScene.prototype.pause = function() {
    this.paused = true
    this.updateSIILabel()
}

SketchpadScene.prototype.unpause = function() {
    this.paused = false
    this.updateSIILabel()
}

SketchpadScene.prototype.resume = function() {
    this.paused = false
    this.updateSIILabel()
}

SketchpadScene.prototype.redraw = function() {
    this.cameraControls.update()
    if (this.renderSkipCount == 0) {
	this.renderer.render(this.scene, this.camera)
    }
    this.renderSkipCount = (this.renderSkipCount + 1) % this.renderFrequencySlowdown
}

SketchpadScene.prototype.drawArrow = function(from, to, origin, label, color) {
    var ctxt = this.ctxt
    ctxt.beginPath()
    ctxt.moveTo(from.x + origin.x, from.y + origin.y)
    ctxt.lineWidth = 3
    ctxt.strokeStyle = color || 'orange'
    ctxt.lineTo(to.x, to.y)
    var endLen = 10
    var angle = Math.atan2(to.y - from.y, to.x - from.x)
    var angle1 = angle + 3 * Math.PI / 4
    var e1 = {x: to.x + Math.cos(angle1) * endLen, y: to.y + Math.sin(angle1) * endLen}
    ctxt.lineTo(e1.x, e1.y)
    ctxt.moveTo(to.x, to.y)
    var angle2 = angle + 5 * Math.PI / 4
    var e2 = {x: to.x + Math.cos(angle2) * endLen, y: to.y + Math.sin(angle2) * endLen}
    ctxt.lineTo(e2.x, e2.y)
    ctxt.moveTo(to.x, to.y)
    var angle3 = angle + Math.PI
    ctxt.stroke()
    if (label) {
	ctxt.save()
	ctxt.font = '22px Arial'
	ctxt.fillStyle = ctxt.strokeStyle
	ctxt.fillText(label, to.x + Math.cos(angle3) * endLen * 5 , to.y + Math.sin(angle3) * endLen * 5)
	ctxt.restore()
    }
}

SketchpadScene.prototype.addPoint = function(x, y, optColor) {
    var p = new Point(x, y, optColor || 'slateBlue')
    return this.add(p)
}

SketchpadScene.prototype.addLine = function(p1, p2) {
    var l = new Line(p1, p2)
    return this.add(l)
}

SketchpadScene.prototype.get = function(id) {
    return this.sketchpad.getObject(id)
}

SketchpadScene.prototype.markIfNew = function(t) {
    return this.sketchpad.markObjectWithIdIfNew(t)
}

SketchpadScene.prototype.add = function(t, container, toEnd) {
    var sceneObj = t._sceneObj
    if (sceneObj) {
	this.sceneObjects.push(sceneObj)
	this.scene.add(sceneObj)
	sceneObj.__sketchpadThing = t
    }
    var isTopLevel = container === undefined
    var set = isTopLevel ? this.things : this.nonTopLevelThings
    if (set.indexOf(t) > 0)
	return t
    this.markIfNew(t)
    if (t instanceof Point) {
	if (isTopLevel)
	    this.points.push(t)
	set.push(t)
    } else {
	var addFn1 = toEnd ? 'push' : 'unshift' 
	set[addFn1](t)
	if (t.grabPoint)
	    this.addGrabPointFor(t, false, isTopLevel, container, toEnd)
    }
    if (t.onEachTimeStep)
	this.sketchpad.thingsWithOnEachTimeStepFn.push(t)
    if (t.afterEachTimeStep)
	this.sketchpad.thingsWithAfterEachTimeStepFn.push(t)
    return t
}

SketchpadScene.prototype.addTemp = function(t) {
    if (this.temps.indexOf(t) > 0)
	return t
    this.markIfNew(t)
    this.temps.push(t)
    t.__isTemp = true
    return t
}

SketchpadScene.prototype.addConstraint = function(ctor /* , arguments, ... */) {
    if (ctor) {
	var args = Array.prototype.slice.call(arguments)
	ctor = ctor.bind.apply(ctor, args)
	var c = new ctor()
	return this.addNewConstraint(c)
    } else
	alert('No such class')
}

SketchpadScene.prototype.addNewConstraint = function(c) {
    this.sketchpad.addConstraint(c)
    this.doOneTimeThingsForNewThing(c)
    if (c.grabPoint)
	this.addGrabPointFor(c, true, true)
    if (c.onEachTimeStep)
	this.sketchpad.thingsWithOnEachTimeStepFn.push(c)
    if (c.afterEachTimeStep)
	this.sketchpad.thingsWithAfterEachTimeStepFn.push(c)
    return c
}

SketchpadScene.prototype.addGrabPointFor = function(thing, isConstraint, isTopLevel, container, toEnd) {
    var grabP = thing.grabPoint()
    if (grabP && this.points.indexOf(grabP) < 0) {
	grabP.__owner = thing
	grabP.radius = 8
	grabP.color = 'gray'
	if (isTopLevel)
	    this.points.push(grabP)
	else
	    grabP.___container = container
        var addFn2 = toEnd ? 'unshift' : 'push'
	var gPointSet = isConstraint ? this.constraintGrabPoints : this.thingGrabPoints
	gPointSet[addFn2](grabP)
    }
}

SketchpadScene.prototype.doOneTimeThingsForNewThing = function(c) {
    this.defineDrawMethodForThing(c)
}

SketchpadScene.prototype.defineDrawMethodForThing = function(c) {
    if (!c.draw) {
	var label = new TextBox(this.getRandomPoint(), c.__toString, false, undefined, undefined, undefined, '#c0c0c0')
	c.__labelBox = label
	c.grabPoint = label.grabPoint.bind(label)
	c.containsPoint = label.containsPoint.bind(label)
	c.border = label.border.bind(label)
	c.draw = drawConstraint.bind(c)
    }    
}

SketchpadScene.prototype.getRandomPoint = function(minX, minY, maxX, maxY) {    
    return new Point((minX || 150) + Math.ceil(Math.random() * (maxX || 600)), (minY || 50) + Math.ceil(Math.random() * (maxY || 500)), 'gray')
}

SketchpadScene.prototype.mergePairwise = function(pwList) {
    var removes = []
    this.clearSelections()
    for (var i = 0; i < pwList.length; i += 2)
	this.merge(pwList[i], pwList[i + 1], removes)
    removes.forEach(function(src) { this.remove(src, true) }.bind(this))   
}
    
SketchpadScene.prototype.merge = function(src, dst, removes) {
    var srcs = [], dsts = []
    generateMergeList(src, dst, srcs, dsts)
    this.mergeFromMergeList(srcs, dsts, removes)    
}

SketchpadScene.prototype.mergeFromMergeList = function(srcs, dsts, removes) {
    var all = this.things.concat(this.sketchpad.constraints)
    var l = srcs.length
    for (var i = 0; i < l; i++) {
	var src = srcs[i]
	var dst = dsts[i]
	if (all.indexOf(src) >= 0 && all.indexOf(dst) >= 0) {
	    if (removes.indexOf(src) < 0)
		removes.push(src)
	    all = this.things.concat(this.sketchpad.constraints)
	    all.forEach(function(t) {
		getProperties(t).forEach(function(p) { if (t[p] === src && !(removes.indexOf(t) >= 0)) t[p] = dst})})
	}
    }
}

SketchpadScene.prototype.mergeInputElementValueWithSelection = function(inputElement, thing, setInputElement) {
    var currObject = inputElement.hasOwner.inspectorOfObj
    if (currObject) {
	var isThing = thing && thing.__isSketchpadThing
	var prop = inputElement.representsProperty
	var tp = currObject.propertyTypes ? currObject.propertyTypes[prop] : undefined
	if (tp === undefined || (tp === thing.__type)) {
	    var oldThing
	    if (isThing) {
		if (inputElement.pointerLine)
		    inputElement.pointerLine.p2 = thing.center()
		if (setInputElement) {
		    var v = thing.__toString
		    inputElement.value = function() { return v }
		    inputElement.propLabel.text = thing.__type + ' ' + prop + ':'
		    draw(inputElement.__container, this)
		}
		oldThing = currObject[prop]
	    }
	    currObject[prop] = thing
	    if (isThing) {
		this.mergePairwise([oldThing, thing])
	    }
	}
    }
    this.redraw()
}

SketchpadScene.prototype.removeAll = function(unwanteds, notInvolvingConstraintsOrOwnedThings) {
    unwanteds.forEach(function(unwanted) { this.remove(unwanted, notInvolvingConstraintsOrOwnedThings) }.bind(this))
}

SketchpadScene.prototype.remove = function(unwanted, notInvolvingConstraintsOrOwnedThings) {
    var sceneObj = unwanted._sceneObj
    if (sceneObj) {
	this.scene.remove(sceneObj)
	this.sceneObjects = this.sceneObjects.filter(function(t) { return t !== sceneObj })
    }
    this.things = this.things.filter(function(t) { return t !== unwanted && !thingInvolvesThing(t, unwanted, {}) && (notInvolvingConstraintsOrOwnedThings || !(unwanted.isOwnerOf && unwanted.isOwnerOf.indexOf(t) >= 0)) })
    if (!notInvolvingConstraintsOrOwnedThings) {
	this.removeConstraintsInvolving(unwanted)
    }
    if (unwanted.grabPoint) {
	var gPoint = unwanted.grabPoint()
	if (unwanted === gPoint || !anythingHasAsProperty(unwanted.grabPoint(), this)) {
            this.removeGrabPoint(gPoint)
	}
    }
    this.sketchpad.thingsWithOnEachTimeStepFn = this.sketchpad.thingsWithOnEachTimeStepFn.filter(function(thing) { return thing !== unwanted })
    this.sketchpad.thingsWithAfterEachTimeStepFn = this.sketchpad.thingsWithAfterEachTimeStepFn.filter(function(thing) { return thing !== unwanted })
    this.clearSelections()
    this.redraw()
}

SketchpadScene.prototype.removeGrabPoint = function(unwanted, isConstraint) {
    var gPointSet = isConstraint ? this.constraintGrabPoints : this.thingGrabPoints
    var newSet = gPointSet.filter(function(t) { return t !== unwanted })
    if (isConstraint)
	this.constraintGrabPoints = newSet
    else
	this.thingGrabPoints = newSet
}

SketchpadScene.prototype.removeTemp = function(unwanted) {
    if (unwanted.__type === 'SketchpadTile') {
	for (var p in unwanted.inputElements) {
	    var input = unwanted.inputElements[p]
	    document.body.removeChild(input._hiddenInput)	    
	    input.render = function() {} //HACK FIMXE: why removing is not enough?
	}
    }
    this.currentInputElement = undefined
    this.temps = this.temps.filter(function(t) { return t !== unwanted && !thingInvolvesThing(t, unwanted, {}) && !(unwanted.isOwnerOf && unwanted.isOwnerOf.indexOf(t) >= 0) })
    this.removeConstraintsInvolving(unwanted)
    if (unwanted.buttons) {
	var buttons = document.getElementById('buttons');
	var toRemove = []
	for (var i = 0; i < buttons.children.length; i++) {
	    var b = buttons.children[i]
	    if (unwanted.buttons.indexOf(b) >= 0) toRemove.push(b)
	}
	toRemove.forEach(function(b) { buttons.removeChild(b) })
    }
    this.clearSelections()
    this.redraw()
}

SketchpadScene.prototype.removeConstraintsInvolving = function(unwanted) {
    var constraintsToRemove = this.sketchpad.constraints.filter(function(t) { return (t === unwanted || thingInvolvesThing(t, unwanted, {}) || (unwanted.isOwnerOf && unwanted.isOwnerOf.indexOf(t) >= 0)) })
    constraintsToRemove.forEach(function(c) { this.removeConstraint(c) }.bind(this))
    this.redraw()
}

SketchpadScene.prototype.removeConstraint = function(unwanted) {
    if (unwanted.grabPoint && unwanted !== unwanted.grabPoint) 
        this.removeGrabPoint(unwanted.grabPoint(), true)
    this.sketchpad.removeConstraint(unwanted)
}

SketchpadScene.prototype.clear = function() {
    if (this.codeEditMode) this.toggleCodeEditMode()
    this.sketchpad.clear()
    this.onlyRenderOnConvergence = false
    this.renderEvenOnConvergence = false
    this.onlyRenderOnNoError = false
    this.points = []
    this.things = []
    this.thingGrabPoints = []
    this.constraintGrabPoints = []
    this.nonTopLevelThings = []
    this.temps = []
    this.sceneObjects = []
    this.lastIterationError = undefined
    this.selection = undefined
    this.secondarySelections = []
    this.selectionChoiceIdx = 0
    this.selectionPoints = []
    this.clickSelectMode = false
    this.inDragSelectMode = false
    this.startDragSelectMode = false
    this.codeEditMode = false
    this.dragConstraintPriority = 10
    this.fingers = {} // because fingers can refer to points
    this.disableDefaultKeyEvents = false
    this.renderSkipCount = 0
    this.clearTemps()
    this.resetScene()
}

SketchpadScene.prototype.resetScene = function() {
    this.scene = new THREE.Scene()
    // draw axes
    var origin = new Point3D(0, 0, 0)
    this.scene.add(new Line3D(origin, new Point3D(500, 0, 0), 'red')._sceneObj)
    this.scene.add(new Line3D(origin, new Point3D(0, 500, 0), 'green')._sceneObj)
    this.scene.add(new Line3D(origin, new Point3D(0, 0, 500), 'blue')._sceneObj)
    this.scene.add(this.cameraRefObj)
    this.scene.add( this.mouseClickPlane)
    this.resetCamera()
    this.updateCamera()
}

SketchpadScene.prototype.clearSelections = function() {    
    this.selection = undefined
    this.selectionChoiceIdx = 0
    if (!this.haveDragSelectionsMode) {
	this.secondarySelections.forEach(function(t) { if (t._selectionIndices) t._selectionIndices = [] })
	this.secondarySelections = []
    }
}

SketchpadScene.prototype.clearTemps = function() {
    this.clearSelections()
    this.temps = []
    var buttons = document.getElementById('buttons');
    while (buttons.firstChild)
        buttons.removeChild(buttons.firstChild)
}

SketchpadScene.prototype.makeDOMButton = function(a) {
    var style = a.style
    var name = a.name
    var button = document.createElement('button')
    if (!style.width)
	style.width = '20px'
    if (!style.height)
	style.height = '20px'
    for (p in style)
	if (style.hasOwnProperty(p))
	    button.style.setProperty(p, style[p])
    button.appendChild(document.createTextNode(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()))
    button.onclick = a.onclick
    document.getElementById('buttons').appendChild(button)
    return button
}

SketchpadScene.prototype.setSelection = function(thing) {
    this.selection = thing
    if (this.codeEditMode)
	this.inspectCode(thing)
}

SketchpadScene.prototype.inspectState = function(thing) {
    var self = this
    if (this.showConstraints || !thing.__isConstraint)
	this.setSelection(thing)
    var props = []
    getPublicNotFnProperties(thing).forEach(function(p) {
	var pVal = thing[p]
	var defined = pVal !== undefined
	props.push({name: p, type: defined ? pVal.__shortType : undefined, value: pVal, expr: defined ? self.unparseJS(pVal, true, false) : undefined, hiddenExpr: defined ? self.unparseJS(pVal, false, false) : undefined})
    })
    var randP = this.getRandomPoint()
    var posX = 50 + (thing.x ? thing.x : (thing.position ? thing.position.x : randP.x))
    var posY = 50 + (thing.y ? thing.y : (thing.position ? thing.position.y : randP.y))
    if (posX > 750)
	posX -= 100
    if (posY > 500)
	posY -= 100
    var pos = new Point(posX, posY, 'gray')
    this.addTemp(new SketchpadTile('View ' + thing.__toString, props, undefined, undefined, thing, true, undefined, pos, new Box(new Point(0, 0), 350, 250, false, false, 'gray', '#ffffcc')))
    rc.redraw()
}

SketchpadScene.prototype.stateToString = function(thing) {
    var self = this
    var res = thing.__toString + ' = {'
    var props = getPublicNotFnProperties(thing)
    var count = props.length
    var first = true
    for (var i = 0; i < count; i++) {	
	var p = props[i]
	var pVal = thing[p]
	if (pVal) {
	    if (first) 
		first = false 
	    else 
		res += ', '
	    res += p + ': ' + (self.unparseJS(pVal, false, true))
	}
    }
    return res + '}'
}

SketchpadScene.prototype.inspectCode = function(thing) {
    this.thingCodeInspectorCurrentProto = thing.__proto__
    this.thingCodeInspector.setValue(codeToString(this.thingCodeInspectorCurrentProto))
}

SketchpadScene.prototype.newUserClassFromThings = function(things, isConstraint) {
    var serializeCode1 = '', serializeCode2 = '', serializeCode3 = ''
    var serializeCode4 = '', serializeCode5 = ''
    var idMap = {}, idCtr = 0
    var getId = function(o) { var id = o.__id; if (idMap[id]) return idMap[id]; idMap[id] = ++idCtr; return idCtr }
    if (things.length == 0)
	things = [this.getRandomPoint()]
    var mainThing = things[0]
    var mainPropExpr = 'p' + getId(mainThing)
    things.forEach(function(thing) {
	var propName = 'p' + getId(thing)
	serializeCode1 += 'this.' + propName + ' = ' + serialize(thing) + '; '
	serializeCode2 += 'rc.add(this.' + propName + '); '
	serializeCode3 += propName + ": '" + thing.__type + "',"
	things.forEach(function(thang) {
	    var ps = thingHasAsProperty(thing, thang)
	    if (ps)
		ps.forEach(function(p) {
		    serializeCode5 += 'this.' + propName + '.' + p + ' = this.p' + getId(thang) + '; '})
	})
    })
    var constraints = this.getConstraintsInvolving(things)
    constraints.forEach(function(c) {
	serializeCode5 += '(function() { var c = ' + serialize(c) + '; '
	things.forEach(function(thing) {
	    var ps = thingHasAsProperty(c, thing)
	    if (ps)
		ps.forEach(function(p) {
		    serializeCode5 += 'c.' + p + ' = this.p' + getId(thing) + '; '})
	})
	serializeCode5 += 'rc.addNewConstraint(c); }.bind(this))(); '
    })
    var tag0 = isConstraint ? "constraint" : "class"
    var className = prompt('' + tag0.charAt(0).toUpperCase() + tag0.substring(1) + " name?")
    if (className) {
	var tag = isConstraint ? "constraints" : "classes"
	var addr = isConstraint ? ", true" : ""
	var serializeCode = 
	    "User." + tag + "." + className + " = function User__" + tag + "__" + className + "() { " + serializeCode1 + serializeCode2 + serializeCode5 + " }; sketchpad.addClass(User." + tag + "." + className + addr + "); User." + tag + "." +  className + ".prototype.propertyTypes = {" + serializeCode3 + "}; User." + tag + "." + className + ".dummy = function(x, y) { return new User." + tag + "." + className + "() };" + 
	    (isConstraint ?
	     ("User." + tag + "." + className + ".prototype.computeError = function(pseudoTime, prevPseudoTime) { return 0 };" + 
	      "User." + tag + "." + className + ".prototype.solve = function(pseudoTime, prevPseudoTime) { return {} };"
	     ) :
	     ("User." + tag + "." + className + ".prototype.draw = function(canvas, origin, options) { [" + serializeCode4 + "].forEach(function(t) { t.draw(canvas, origin, options) }) }; User." + tag + "." + className + ".prototype.containsPoint = function(x, y) { return this." + mainPropExpr + ".containsPoint(x, y) }; User." + tag + "." + className + ".prototype.border = function() { return this." + mainPropExpr + ".border() }; User." + tag + "." + className + ".prototype.center = function() { return this." + mainPropExpr + ".center() }; " +
	      "User." + tag + "." + className + ".prototype.grabPoint = function() { var f = this." + mainPropExpr + ".grabPoint; return f ? f() : undefined };"))
	alertMessage(serializeCode)
	eval(serializeCode)
    }
}

SketchpadScene.prototype.saveCodeEdit = function() {
    var proto = this.thingCodeInspectorCurrentProto
    var t = this.thingCodeInspector.getValue()
    if (proto && t) {
	var newProps = eval('({' + t + '})')
	for (var p in newProps) {
	    proto[p] = newProps[p]
	}
    }
}

// gets constraints exclusively involving the given set of things
SketchpadScene.prototype.getConstraintsInvolving = function(things) {
    var res = []
    var others = this.things.filter(function(t) { return things.indexOf(t) < 0 })
    this.sketchpad.constraints.forEach(function(constraint) {
	var nomatch = false
	for (var i = 0; i < others.length; i++)
	    if (thingInvolvesThing(constraint, others[i], {})) {
		nomatch = true
		break
	    }
	if (!nomatch)
	    things.forEach(function(thing) {	    
		if (thingInvolvesThing(constraint, thing, {}) && res.indexOf(constraint) < 0)
		    res.push(constraint)
	    })
    })
    return res
}

// --- Internal Classes ---------------------------------------------------

function SketchpadTile(name, inputs, ownRun, buttonsInfo, inspectorOfObj, fixedInputs, optDraw, optPosition, optBox) {
    var self = this
    this.name = name
    this.inputs = inputs
    this.childTileInputs = []
    ownRun = ownRun || function() {}
    var ownRunFn = ownRun.bind(self)
    this.run = function() { 
	childTiles = []
	this.childTileInputs.forEach(function(i) { var tileExp = i.hiddenValue; if (tileExp) childTiles.push(rc.evalJS(tileExp)) })
	childTiles.forEach(function(c) { c.run() })
	ownRunFn()	
	rc.removeTemp(self)
    }.bind(self)
    buttonsInfo = buttonsInfo || []
    this.drawMtd = optDraw
    this.position = optPosition || rc.getRandomPoint()
    this.__origin = this.position
    this.parts = []
    var o = new Point(0, 0)
    this.box = optBox || new Box(o, 350, 50, false, false, 'gray', '#ccccff')
    this.box.___container = this
    this.parts.push(this.box)
    var box = this.box
    var pos = box.position, width = box.width, height = 50, left = pos.x, top = pos.y
    this.isOwnerOf = [this.position]    
    rc.addTemp(this.position)
    this.tileLabel = new TextBox(new Point(15, top + 5), this.name, false, 16, undefined, undefined, undefined, undefined, 'gray', true)    
    this.tileLabel.___container = this
    this.parts.push(this.tileLabel)
    var y = top + 40
    this.inputsLabel = new TextBox(new Point(10, y), 'Inputs', false, 14, undefined, undefined, undefined, undefined, 'gray', true)
    this.inputsLabel.___container = this
    this.tilesLabel = new TextBox(new Point((width / 2) + 10, y), 'Tiles', false, 14, undefined, undefined, undefined, undefined, 'gray', true)
    this.tilesLabel.___container = this
    var inputElements = {}
    this.inputLabels = []
    if (inspectorOfObj)
	this.inspectorOfObj = inspectorOfObj
    this.inputs.forEach(function(inputInfo) {
	var inputName = inputInfo.name
	var inputType = inputInfo.type
	var inputValue = inputInfo.value
	var inputLabel = (inputType ? (inputType + ' ') : '') + inputName
	var isThing = inputValue && inputValue.__isSketchpadThing
        y += 35
	height += 35
	var pLabelLength = inputLabel.length
	var inputCoord = {x: 30 + pLabelLength * 8, y: y, w: 200 - (pLabelLength * 8), h: 20}
	var input = new CanvasInput({
	    canvas: rc.canvas,
	    x: inputCoord.x,
	    y: inputCoord.y,
	    placeHolder: isThing ? '' : inputName,
	    value: inputInfo.expr,
	    hiddenValue: inputInfo.hiddenExpr,
	    fontSize: 14,
	    fontFamily: 'Arial',
	    fontColor: 'blue',
	    fontWeight: 'bold',
	    width: isThing ? 10 : inputCoord.w,
	    padding: 8,
	    borderWidth: 1,
	    borderColor: 'gray',
	    borderRadius: 3,
	    boxShadow: '1px 1px 0px #fff',
	    innerShadow: '0px 0px 5px rgba(0, 0, 0, 0.5)',
	    onfocus: function(i) { if (rc.temps.indexOf(this.hasOwner) >= 0) rc.currentInputElement = i },
	    onblur: function(i) { 
		if (i._hasFocus && i.representsProperty && i.value) {
		    var iv = i.value()
		    if (iv !== '')
			rc.mergeInputElementValueWithSelection(i, rc.evalJS(iv), false)
		}
	    }
	})
	input.orig_x = input._x
	input.orig_y = input._y
	input.hasOwner = self
	input.___container = self
	self.parts.push(input)
	inputElements[inputName] = input
	var labelPoint = new Point(15, y)
	var label = new TextBox(labelPoint, inputLabel + ':', false, 14, undefined, undefined, undefined, undefined, 'gray', true)
	label.___container = self
	self.parts.push(label)
	self.inputLabels.push(label)
	input.propLabel = label
	if (inspectorOfObj) {
	    input.representsProperty = inputName
	    if (isThing) {
		//inputCoord.x += inputCoord.w / 2 + 7
		inputCoord.y += inputCoord.h / 2 + 7
		var pointerLinePt = new Point(inputCoord.x, inputCoord.y)
		var pointerLine = new Line(pointerLinePt, inputValue.center(), 'orange', 2, 4)
		input.pointerLine = pointerLine
		self.parts.push(pointerLine)
		self.isOwnerOf.push(rc.addConstraint(Sketchpad.arith.SumConstraint, {obj: self.position, prop: 'x'}, {obj: inputCoord, prop: 'x'}, {obj: pointerLinePt, prop: 'x'}, [3]))
		self.isOwnerOf.push(rc.addConstraint(Sketchpad.arith.SumConstraint, {obj: self.position, prop: 'y'}, {obj: inputCoord, prop: 'y'}, {obj: pointerLinePt, prop: 'y'}, [3]))
	    }
	}
    })
    this.inputElements = inputElements
    height += 50
    if (height > box.height)
	box.height = height
    this.buttons = []
    buttonsInfo.forEach(function(i) { i.onclick = i.onclick.bind(self) })
    if (!fixedInputs) {
	var addChildFn = function() {
	    var input = new CanvasInput({
		canvas: rc.canvas,
		x: 260,
		y: 75 + self.childTileInputs.length * 35,
		placeHolder: 'tile',
		value: '',
		fontSize: 14,
		fontFamily: 'Arial',
		fontColor: 'blue',
		fontWeight: 'bold',
		width: 60,
		padding: 8,
		borderWidth: 1,
		borderColor: 'gray',
		borderRadius: 3,
		boxShadow: '1px 1px 0px #fff',
		innerShadow: '0px 0px 5px rgba(0, 0, 0, 0.5)',
		onfocus: function(i) { if (rc.temps.indexOf(this.hasOwner) >= 0) rc.currentInputElement = i },
		onblur: function(i) {  }
	    })
	    input.orig_x = input._x
	    input.orig_y = input._y
	    self.addChildTileInput(input)
	    input.___container = self
	    self.parts.push(input)	  
	    input.hasOwner = self  
	}
	buttonsInfo.unshift({name: '+', onclick: addChildFn, style: {background: 'orange'}})
    }
    var removeFn = function() { rc.removeTemp(self) }
    buttonsInfo.unshift({name: 'X', onclick: removeFn, style: {background: '#ff6666'}})
    buttonsInfo.forEach(function(a) { self.buttons.push(rc.makeDOMButton(a)) })
}

SketchpadTile.prototype.addChildTileInput = function(input) {
    this.childTileInputs.push(input)
    var tileCount = this.childTileInputs.length
    var labelName = 'tile' + tileCount
    var h = 50 + (tileCount * 35)
    var label = new TextBox(new Point(this.box.width / 2 + 40, h + 5), labelName + ':', false, 14)
    label.___container = this
    this.parts.push(label)
    h += 30
    if (h > this.box.height)
	this.box.height = h
}


SketchpadTile.prototype.grabPoint = function() {
    return this.position
}

SketchpadTile.prototype.draw = function(canvas, origin) {
    var pos = this.position
    this.parts.forEach(function(p) { draw(p, canvas) })
    if (this.childTileInputs.length > 0)
	draw(this.tilesLabel, canvas)
    if (this.inputs.length > 0)
	draw(this.inputsLabel, canvas)
    var right = this.position.x + this.box.width - 50
    var bottom = this.position.y - (canvas.codeEditMode ? (canvas.thingCodeInspectorSize.height + 7) : 0)
    for (var i = 0; i < this.buttons.length; i++) {
	var b = this.buttons[i]
	b.style.setProperty('left', (right - (-23 + (20 * i))) + 'px')
	b.style.setProperty('top',  (bottom - 9) + 'px')
    }
    if (this.drawMtd)
	this.drawMtd(canvas, pos)
}

SketchpadTile.prototype.border = function() {
    return new Box(this.position, this.box.width, this.box.height)
}

SketchpadTile.prototype.containsPoint = function(x, y) {
    return new Box(this.position, 100, 50).containsPoint(x, y)
}


SketchpadScene.prototype.newInstantiationTile = function(name, isConstraint) {
    var contr = isConstraint ? this.sketchpad.constraintConstructors : this.sketchpad.thingConstructors
    var width = 350, height = 350    
    var hasClassPrototype = contr[name].dummy !== undefined  
    var proto = hasClassPrototype ? contr[name].dummy((3 * width / 4), (height / 2) - 50) : 
	new contr[name]()
    var addFn = isConstraint ? 'addNewConstraint' : 'add'
    this[addFn](proto)
    this.inspectState(proto)
}

SketchpadScene.prototype.newPrimitiveTile = function(name) {
    var doButtonFn = function() { this.run(); rc.removeTemp(this) }
    rc.addTemp(new SketchpadTile(name, [], undefined, [{name: '!', onclick:  doButtonFn, style: {background: '#66ff66'}}], undefined, false))
    rc.redraw()
}

SketchpadScene.prototype.unparseJS = function(value, hideThingTypes, hideNonThingTypes) {
    return this.unparseJSHelper(value, hideThingTypes, hideNonThingTypes, 0)
}

SketchpadScene.prototype.unparseJSHelper = function(value, hideThingTypes, hideNonThingTypes, depth) {
    var self = this
    var res = undefined
    var t = typeof value
    if (t === 'object' && value !== null) {
	if (value.__isSketchpadThing)
	    res = hideThingTypes ? '' : value.__toString
	else if (value instanceof Array) {
	    var els = ''
	    if (depth < 4)
		els = (value.map(function(e) { return self.unparseJSHelper(e, hideThingTypes, hideNonThingTypes, depth + 1) }).join(', '))
	    res = '[' + els + ']'
	} else {
	    var els = ''
	    if (!hideNonThingTypes) {
		if (depth < 4) {
		    var es = []
		    for (var k in value)
			if (value.hasOwnProperty(k))
			    es.push(k + ': ' + self.unparseJSHelper(value[k], hideThingTypes, hideNonThingTypes, depth + 1))
		    els = es.join(', ')
		}
	    }
	    res = '{' + els + '}'
	}
    }
    if (res === undefined)
	res = JSON.stringify(value)
    return res
}

SketchpadScene.prototype.evalJS = function(e) {
    //console.log('eval: ', e)
    var ma = e.match(/(\w+)@(\d+)/)
    if (ma) {
	var idTp = ma[1]
	var idStr = ma[2]
	e = e.replace(idTp + '@' + idStr, '(rc.get(' + idStr + '))')
    } 
    var res = eval(e)
    return res
}

SketchpadScene.prototype.updateSIILabel = function() {
    var sii = document.getElementById('sii')
    sii.innerHTML = this.paused ? 'paused' : 
	(this.showEachIteration ? ' rendering each iteration'
	 : (this.onlyRenderOnConvergence ? (' rendering only on convergence' + (this.onlyRenderOnNoError ? ' and no error' : '')) :	    
	    ' rendering every ' + Math.floor(this.millisecondsPerFrame) + ' ms.' + (this.renderEvenOnConvergence ? '' : ' until convergence')))
}

SketchpadScene.prototype.setOption = function(opt, val) {
    this[opt] = val
    if (opt === 'renderMode')
	this.setRenderMode(val)
    else if (this.optionsRequiringSIILableUpdate.indexOf(opt) >= 0)
	this.updateSIILabel()
}

// --- Helpers ---------------------------------------------------

function serializeOwnProps(thing, propName) {
    var res = ''
    getPublicProperties(thing).forEach(function(p) { res += 'this.' + propName + '_' + p + ' = this.' + propName + '.' + p + '; ' })
    return res
}

function serializeOwnPropTypes(thing, propName) {
    var res = ''
    getPublicProperties(thing).forEach(function(p) { var val = thing[p]; if (val !== undefined) res += ', ' + propName + '_' + p + ": '" + (val.__type) + "'"})
    return res
}

function serialize(thing) {
    var res = ''
    res += '(function() { var p = ' + thing.__type + '.dummy(0, 0, true); '
    for (var p in thing) {
	if (thing.hasOwnProperty(p) && (p.charAt(0) !== '_' || p.charAt(1) !== '_')) {
	    var t = thing[p]
	    res += 'p.' + p + ' = ' + (t && t.__isSketchpadThing ? (serialize(t) + ';') : JSON.stringify(t)) + '; '
	}
    }
    res += ' return p })() '
    return res
}

function draw(thing, canvas, options) {
    var origin = thing.__container.__origin    
    if (thing.draw) {
	var ctxt = canvas.ctxt
	ctxt.save()
	thing.draw(canvas, origin, options)
	ctxt.restore()
    }
}

function drawConstraint(canvas, options) {
    var origin = this.__container.__origin
    this.__labelBox.draw(canvas, origin, options)
}

function drawBorderOf(thing, color, canvas) {
    var border = thing.border()
    border.___container = thing.__container
    var bgColor = border.bgColor
    border.bgColor = undefined
    draw(border, canvas, {color: color})
    border.bgColor = bgColor
}

function rotateAroundObjectAxis(object, axis, radians) {
    var rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
    object.matrix.multiply(rotObjectMatrix);
    object.rotation.setFromRotationMatrix(object.matrix);
}

// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
    var rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix);                // pre-multiply
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
}


function generateMergeListH(src, dst, sofarSrcs, sofarDsts) {
    if (src.__type !== dst.__type)
	return
    var srcIdx = sofarSrcs.indexOf(src)
    var dstIdx = sofarDsts.indexOf(dst)
    if ((srcIdx >= 0 && srcIdx === dstIdx) || src === dst)
	return
    sofarSrcs.push(src)
    sofarSrcs.push(dst)
    sofarDsts.push(dst)
    sofarDsts.push(src)
    getProperties(src).forEach(function(p) { 
	var t = src[p]
	var d = dst[p]
	if (d !== undefined && typeof(t) === 'object') {
	    generateMergeListH(t, d, sofarSrcs, sofarDsts)
	}
    })    
}

function computeTransitiveClosure(sofarSrcs, sofarDsts, i) {
    var l = sofarSrcs.length
    if (i == l)
	return
    var src1 = sofarSrcs[i]
    var dst1 = sofarDsts[i]
    var srcAdds = [], dstAdds = []
    for (var j = i + 1; j < l; j++) {
	var src2 = sofarSrcs[j]
	var dst2 = sofarDsts[j]
	if (dst1 === src2) {
	    var srcIdx = sofarSrcs.indexOf(src1)
	    var dstIdx = sofarDsts.indexOf(dst2)
	    if (srcIdx >= 0 && srcIdx === dstIdx && src1 !== dst2) {
		srcAdds.push(src1)
		dstAdds.push(dst2)
	    }
	}
    }
    lAdds = srcAdds.length
    if (lAdds > 0) {
	for (var m = 0; m < lAdds; m++) {
	    sofarSrcs.push(srcAdds[m])
	    sofarDsts.push(dstAdds[m])
	}	
    }
    computeTransitiveClosure(sofarSrcs, sofarDsts, i + 1)
}

function removeRedundantsFromMergeList(sofarSrcs, sofarDsts, initSize) {
    var count = initSize / 2
    var i = 0
    while (i++ < count) {
	sofarSrcs.splice(i, 1)
	sofarDsts.splice(i, 1)
    }	
}

function generateMergeList(src, dst, sofarSrcs, sofarDsts) {
    var _ = generateMergeListH(src, dst, sofarSrcs, sofarDsts)
    var initSize = sofarSrcs.length
    var _ = computeTransitiveClosure(sofarSrcs, sofarDsts, 0)
    var _ = removeRedundantsFromMergeList(sofarSrcs, sofarDsts, initSize)
}

function getProperties(obj) {
    var res = []
    var keys = Object.keys(obj)
    for (var i = 0; i < keys.length; i++) {
	var p = keys[i]
	res.push(p)
    }
    return res    
}

function getPublicProperties(obj) {
    return getProperties(obj).filter(function(p) { return (p.charAt(0) !== '_') })
}

function getPublicNotFnProperties(obj) {
    return getPublicProperties(obj).filter(function(p) { return typeof obj[p] !== 'function' })
}

function getSketchpadThingProperties(obj) {
    var res = []
    var keys = Object.keys(obj)
    for (var i = 0; i < keys.length; i++) {
	var p = keys[i]
	if (p.charAt(0) !== '_') {
	    var v = obj[p]
	    if (v && v.__isSketchpadThing)
		res.push(p)
	}   
    }
    return res    
}

function thingInvolvesThing(thisT, thatT, seen) {
    if (thisT === thatT)
	return true
    var thisId = thisT.__id
    if (seen[thisId])
	return false
    seen[thisId] = true
    var ps = getSketchpadThingProperties(thisT)
    for (var i = 0; i < ps.length; i++) {
	var p = thisT[ps[i]]
	if (thingInvolvesThing(p, thatT, seen)) {
	    return true
	}
    }
    return false
}

function thingHasAsProperty(thisT, thatT) {
    var ps = getSketchpadThingProperties(thisT)
    res = undefined
    for (var i = 0; i < ps.length; i++) {
	var pN = ps[i]
	var p = thisT[pN]
	if (p === thatT) {
	    if (!res)
		res = []
	    res.push(pN)
	}
    }
    return res
}

function anythingHasAsProperty(t, canvas) {
    var res = false
    canvas.things.forEach(function(thing) { if (thingHasAsProperty(thing, t)) return true })
    return res
}

function alertMessage(m) {
    // alert box cuts off too long texts...
    var max = 2000
    var len = m.length
    var start = 0
    var end = Math.min(len, max)
    while (start < len) {
	var scriptUrl = alert(m.substring(start, end))
	start += max
	end = Math.min(len, end + max)
    }    
}

codeToString = function(thing) {
    var res = "/* " + thing.__type + " */\n\n"
    for (p in thing) {
	if (p.charAt(0) !== '_') {
	    var v = thing[p]
	    var t = typeof v
	    var expr = t === 'function' ? v : JSON.stringify(v)
	    res += p + ': ' + expr +  ",\n\n"
	}
    }
    return res
}
