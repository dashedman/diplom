var requestAnimationFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function(callback){ window.setTimeout(callback, 66) }

function ParticleList(name, particleProps){
	/*
	Scheme
	this
	UStruct -> props:
	UVar, UStructArray -> props[]:
	[UVar, UVar...]
	*/
	this.length = 0
	this.values = new Array()
	this._name = name
	this._particle_props = particleProps

	this._length = new RmUniformVar("len", [this.length], RmUniformObj.TYPES.U1)
	this._arr = new RmUniformStructArray("a", [])
	this._struct = new RmUniformStruct(
		this._name,
		[
			this._length,
			this._arr
		]
	)
}
ParticleList.prototype.append = function(prop_val){
	let new_struct = []
	for(let prop of Object.getOwnPropertyNames(this._particle_props)){
		new_struct.push( new RmUniformVar(
			prop,
			prop_val[prop],
			this._particle_props[prop]
		))
	}
	this._arr.props.push(new_struct)
	this.values.push( new_struct )
	this.length += 1
	this._length.value[0] = this.length
	this._struct._relocate()
	this._struct.commit()
}
ParticleList.prototype.pop = function(){
	this.length -= 1
	this._length.value[0] = this.length
	this._length.commit()
	return this._arr.props.pop()
}
ParticleList.prototype.commit = function(){
	this._struct.commit()
}
ParticleList.prototype.getUniform = function(){
	return this._struct
}
ParticleList.prototype.get = function(index){
	let struct_props = {}
	for(let prop of this._arr.props[index]){
		struct_props[prop.name] = prop.value
	}
	return struct_props
}
ParticleList.prototype.set = function(index, new_props){
	for(let prop of this._arr.props[index]){
		if(new_props[prop.name] != undefined){
			prop.value = new_props[prop.name]
			prop.commit()
		}
	}
}
//main obj
var state = {}

//vars for metrics
var fpsCounter = 0
var fps = 0
var onesecond = 0
var lastTime = 0

function frame(){
	// metrics
	let now = performance.now()
	let dt = Math.min(100,now - lastTime)/1000
	onesecond += dt

	if(onesecond>1){
		onesecond -= 1
		fps = fpsCounter
		fpsCounter = 0
    //console.log(fps)
	}else{
		fpsCounter++;
	}

	//action frame
	if(dt>0.0001){
		//console.log("hi",state.go_physic)
		dp_update(dt)
		if(state.go_physic){
			an_update(dt)//ph_update(dt)
			if(state.lock_physic) state.go_physic = false
		}
		rm_render()

		lastTime = now
	}
	requestAnimationFrame(frame)
}

function start_demo(){
	state.lock_physic = true
	state.go_physic = true

	state.cameraDir = new RmUniformVar(
		"cameraDirection", [0,0,1],
		RmUniformObj.TYPES.F3,
		true // normalize
	)
	state.cameraPos = new RmUniformVar(
		"cameraPosition", [0,0, -42],
		RmUniformObj.TYPES.F3
	)
	state.cameraRad = Math.length(state.cameraPos.value)
	state.cameraRotateAcceleration = 0
	state.cameraRotateSpeed = 0

	state.scattLightPos = new RmUniformVar(
		"scattLightPos", [0,0,0],
		RmUniformObj.TYPES.F3,
		true // normalize
	)
	state.debugMode = new RmUniformVar(
		"debugMode", [0],
		RmUniformObj.TYPES.U1
	)

	state.flask = new RmUniformVar(
		"flask", [25, 3],
		RmUniformObj.TYPES.F2
	)

	state.bubles = new Array()
	state.rm_bubles = new ParticleList("bubles",{
		pos: RmUniformObj.TYPES.F3,
		radius: RmUniformObj.TYPES.F1
	})

	console.log("State:\n",state)

	rm_downloadShader("", "raymarching")
	.then((sources)=>{

		rm_createAndSetWebGLProgram({
			sources: sources,
			uniforms:[
				state.cameraDir,
				state.cameraPos,
				state.scattLightPos,
				state.debugMode,
				state.flask,
				state.rm_bubles.getUniform()
			]
		})

		//generating
		let getRandomParticle = function(){
			while(true){
				let x = (Math.random()*2 - 1)*10
				let y = (Math.random()*2 - 1)*10
				let z = (Math.random()*2 - 1)*10
				let r = 2+Math.random()

				if(Math.length([x, y, z]) - r > 2)return {pos: [x,y,z], radius: [r]}
			}
		}
		console.log("BUBLES:")
		for(let i=0;i<13;i++){
			let buble = getRandomParticle()
			state.rm_bubles.append(buble)
			console.log(i+')', buble.pos, buble.radius)
		}

		for(let i=0; i<state.rm_bubles.length; i++){
	        state.bubles.push(state.rm_bubles.get(i))
			state.bubles[i].velocity = [0,0,0]
	    }

		console.log("Start frame loop.")
		dp_init(canvas)
		//ph_init()
		an_init()
		requestAnimationFrame(frame)
	})
}

document.addEventListener("DOMContentLoaded", ()=>{
	console.log("Initial WebGL...")
	let canvas = document.getElementById("canvas")
	rm_initialWebGL(canvas)

	start_demo()
})
