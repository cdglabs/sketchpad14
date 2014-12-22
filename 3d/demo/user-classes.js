// --- 3D User Classes -------------------------------------------------------------

function Point3D(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
}

sketchpad.addClass(Point3D)

Point3D.prototype.asVector = function() { return new THREE.Vector3(this.x, this.y, this.z) }

function Vector3D(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
}

sketchpad.addClass(Vector3D)

function Line3D(p1, p2, optColor, optWidth, optLineDash, optOpacity) {
    this.p1 = p1
    this.p2 = p2
    this.color = optColor || 'white'
    if (optWidth)
	this.width = optWidth
    this.lineDash = optLineDash
    this.opacity = optOpacity
    var geometry = new THREE.Geometry()
    geometry.vertices.push(
	p1,
	p2
    )
    this._sceneObj = new THREE.Line( geometry, new THREE.LineBasicMaterial({color: this.color}))
}

function PointVector3D(origin, end, scale, optColor, optLabel) {
    this.origin = origin
    this.end = end
    this.scale = scale
    this.color = optColor || 'green'
    this._line = rc.add(new Cylinder(origin, end, this.color))
    this.label = optLabel || ''
}

sketchpad.addClass(PointVector3D)

PointVector3D.prototype.propertyTypes = {origin: 'Point3D', end: 'Point3D', scale: 'Number', label: 'String'}

PointVector3D.prototype.magnitude = function() {
    return Sketchpad.geom3d.scaledBy(Sketchpad.geom3d.minus(this.end, this.origin), this.scale)
}

function Sphere(position, optColor, optRadius, optUnfilled, optOpacity) {
    this.position = position
    this.color = optColor || 0x8888ff
    this.radius = (optRadius || 15)
    this.unfilled = optUnfilled
    this.opacity = optOpacity
    var sphereMaterial = 
	this._sceneObj = new THREE.Mesh(new THREE.SphereGeometry(this.radius), new THREE.MeshLambertMaterial( {color: this.color}))
    this._sceneObj.position.set(position.x, position.y, position.z)
}

sketchpad.addClass(Sphere)

Sphere.prototype.afterEachTimeStep = function() {
    var position = this.position
    this._sceneObj.position.set(position.x, position.y, position.z)    
}

function Cylinder(p1, p2, optColor, optWidth, optLineDash, optOpacity) {
    this.p1 = p1 
    this.p2 = p2
    this.color = optColor || 'gray'
    this.width = optWidth || 3
    this.lineDash = optLineDash
    this.opacity = optOpacity
    this._sceneObj = new THREE.Mesh(new THREE.CylinderGeometry(this.width, this.width, 0), 
				    new THREE.MeshLambertMaterial({color: this.color}))
    this.updateBasedOnEndPoints()
}

Cylinder.prototype.getHeight = function() {
    var p1 = this.p1, p2 = this.p2
    var height = Sketchpad.geom3d.distance(p1, p2)
    return height
}

Cylinder.prototype.updateBasedOnEndPoints = function() {
    var p1 = this.p1, p2 = this.p2
    this._sceneObj.rotation.set(0,0,0)    
    this._sceneObj.updateMatrix()
    var mid = Sketchpad.geom3d.midpoint(p1, p2)
    this._sceneObj.geometry = new THREE.CylinderGeometry(this.width, this.width, this.getHeight())
    var vector1 = p1.asVector(), vector2 = p2.asVector()
    var diff = new THREE.Vector3().subVectors(vector1,vector2) //delta vector
    var orientation = new THREE.Matrix4() //a new orientation matrix to offset pivot
    var offsetRotation = new THREE.Matrix4() //a matrix to fix pivot rotation
    var offsetPosition = new THREE.Matrix4() //a matrix to fix pivot position
    orientation.lookAt(vector1,vector2,new THREE.Vector3(0,1,0)) //look at destination
    matrixSetRotationX(offsetRotation, -Math.PI * .5) //rotate 90 degs on X
    offsetPosition.setPosition(new THREE.Vector3(-vector1.x,diff.length()*.5+vector1.z,vector1.y*.5)) //move by pivot offset on Y
    orientation = orientation.multiplyMatrices(orientation, offsetRotation) //combine orientation with rotation transformations
    orientation = orientation.multiplyMatrices(orientation, offsetPosition) //combine orientation with position transformations
    this._sceneObj.applyMatrix(orientation) //apply the final matrix
    this._sceneObj.position.set(mid.x, mid.y, mid.z)
}

Cylinder.prototype.afterEachTimeStep = function() {
    this.updateBasedOnEndPoints()
}

function matrixSetRotationX(m, theta ) {
    var c = Math.cos( theta ), s = Math.sin( theta )
    m.set(
	1, 0,  0, 0,
	0, c, -s, 0,
	0, s,  c, 0,
	0, 0,  0, 1
    )
    return m
}

function Timer3D(stepSize) {
    this.stepSize = stepSize
}

sketchpad.addClass(Timer3D)
    
Timer3D.prototype.propertyTypes = {stepSize: 'Number'}
