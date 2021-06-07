/*
Procedural library for rendering with ray marching
*/
const RM_SCREEN_COORDS = new Float32Array([
  -1,-1,
  1,-1,
  -1,1,
  1,1
])

const _RM_UPDATE = new Set()

var rm_gl = undefined
var rm_shader_program = undefined

var rm_debugMode = undefined

//support functions
function rm_compileShader(vertexShaderSource,fragmentShaderSource){
  function createShader( type, source){
		let shader = rm_gl.createShader(type)
		rm_gl.shaderSource(shader, source)
		rm_gl.compileShader(shader)
		let success = rm_gl.getShaderParameter(shader, rm_gl.COMPILE_STATUS)
		if(success){
			return shader
		}
        console.log(source)
		console.log(rm_gl.getShaderInfoLog(shader))
		rm_gl.deleteShader(shader)
	}

	function createProgram( vertexShader, fragmentShader){
		let program = rm_gl.createProgram()
		rm_gl.attachShader(program, vertexShader)
		rm_gl.attachShader(program, fragmentShader)
		rm_gl.linkProgram(program)
		let success = rm_gl.getProgramParameter(program, rm_gl.LINK_STATUS)
		if(success){
			return program
		}
		console.log(rm_gl.getProgramInfo)

	}

	let vertexShader = createShader( rm_gl.VERTEX_SHADER, vertexShaderSource)
	let fragmentShader = createShader( rm_gl.FRAGMENT_SHADER, fragmentShaderSource)

    if(vertexShader==undefined || fragmentShader==undefined){
        return undefined
    }
    let program = createProgram( vertexShader, fragmentShader)
    if(program==undefined){
        console.log(vertexShaderSource)
        console.log(fragmentShaderSource)
    }
	return program
}

function rm_generateShader({uniforms: uniforms, structures: structures, sdfs: sdfs }){
  if(uniforms == undefined) uniforms = []
  if(structures == undefined) structures = []
  if(sdfs == undefined) sdfs = []

  //TODO: generator of shaders

  return {
    vertex: "",
    fragment: ""
  }
}

function rm_downloadShader(path_to_source, name){

    function _rm_loadTextResources(url){
      return new Promise(function(resolve, reject){
          const request = new XMLHttpRequest()

          request.open('GET', url, true)
          request.onload = function(){
              if (request.status >=200 && request.status < 300){
                resolve(request.responseText)
              }else{
                reject("Error: HTTP-status - " + request.status + " on resource " + url)
              }
          }
          request.responseType = 'text'
          request.send()
      })
    }

    let urlVert = path_to_source + name+".vert"
    let urlFrag = path_to_source + name+".frag"

    let vertexShaderSource = undefined
    let fragmentShaderSource = undefined

    return _rm_loadTextResources(urlVert)
    .then((result)=>{
        vertexShaderSource = result
        return _rm_loadTextResources(urlFrag)
    })
    .then((result)=>{
        fragmentShaderSource = result
        console.log("Resources shader(",name,") downloaded succesfull!")

        return {
          vertex: vertexShaderSource,
          fragment: fragmentShaderSource
        }
    })
    .catch(function(error){
      console.log("Error on downloading resources shader(",name,"):"+error)
    })
}

function rm_initialWebGL(canvas){
    rm_gl = canvas.getContext('webgl2')
    if(!rm_gl) alert(
`WebGL2 is Not Found! Your browser is to old.
Or this Internet Explorer browser.
Or this Safari browser.
You need to install normal browser:
https://www.mozilla.org/en-US/firefox/browsers/`
    )

    rm_gl.viewport(0, 0, rm_gl.canvas.width, rm_gl.canvas.height)
	rm_gl.clearColor(0, 0, 0, 1)
	//rm_gl.enable(rm_gl.DEPTH_TEST)
}

function rm_createAndSetWebGLProgram({sources: sources, uniforms: uniforms}){
    //TODO:
    // better debugMode

    rm_shader_program = rm_compileShader(sources.vertex, sources.fragment)

    rm_gl.useProgram(rm_shader_program)
    for(let uniform of uniforms){
        uniform._relocate()
        uniform.commit()
    }

    //TODO:
    // create OOP realization for buffers
    const a_position_loc = rm_gl.getAttribLocation( rm_shader_program, "a_position")
    const positionsBuffer = rm_gl.createBuffer()

    rm_gl.bindBuffer(rm_gl.ARRAY_BUFFER, positionsBuffer)
    rm_gl.bufferData(rm_gl.ARRAY_BUFFER, RM_SCREEN_COORDS, rm_gl.STATIC_DRAW)

    rm_gl.enableVertexAttribArray(a_position_loc)
    rm_gl.vertexAttribPointer(
        a_position_loc, 2,
        rm_gl.FLOAT, false, 0, 0
    )

    return rm_shader_program
}

function rm_render(){
    rm_gl.clear(rm_gl.COLOR_BUFFER_BIT)

    if(_RM_UPDATE.size > 0){
        _RM_UPDATE.forEach((rmObject) => {
            rmObject._update()
        });
        _RM_UPDATE.clear()
    }

    rm_gl.drawArrays(rm_gl.TRIANGLE_STRIP, 0, 4)
    //rm_gl.deleteBuffer(positionsBuffer)
}

//TODO:
// particle system
