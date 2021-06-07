function RmFloat(x){
    this.x = this.r = this.s = x
}
function RmVec2(x, y){
    this.x = this.r = this.s = x
    this.y = this.g = this.t = y
}
function RmVec3(x, y, z, w){
    this.x = this.r = this.s = x
    this.y = this.g = this.t = y
    this.z = this.b = this.p = z
    this.w = this.a = this.q = w
}
function RmVec4(x, y, z, w){
    this.x = this.r = this.s = x
    this.y = this.g = this.t = y
    this.z = this.b = this.p = z
    this.w = this.a = this.q = w
}

function RmUniformObj(name){
    this.name = name
}
RmUniformObj.TYPES = {
  U1: 0,
  U2: 1,
  U3: 2,
  U4: 3,
  I1: 4,
  I2: 5,
  I3: 6,
  I4: 7,
  F1: 8,
  F2: 9,
  F3: 10,
  F4: 11,
  M2X2: 12,
  M2X3: 13,
  M2X4: 14,
  M3X2: 15,
  M3X3: 16,
  M3X4: 17,
  M4X2: 18,
  M4X3: 19,
  M4X4: 20,
}
RmUniformObj.prototype.TYPE_LENGTH = [
    1, 2, 3, 4,
    1, 2, 3, 4,
    1, 2, 3 ,4,

    4, 9, 16,
    9, 9, 16,
    16, 16, 16
]
RmUniformObj.prototype._update = function(){
    console.log("[Warning!] You updating abstract uniform!")
}
RmUniformObj.prototype.commit = function(){
    _RM_UPDATE.add(this)
}

function RmUniformVar(name, value, type, normalize){
  RmUniformObj.call(this, name)
  this.value = value
  this.type = type

  if(normalize == undefined) this.normalize = false
  else this.normalize = normalize
}
RmUniformVar.prototype = Object.create(RmUniformObj.prototype)
RmUniformVar.prototype.constructor = RmUniformVar
RmUniformVar.prototype._uniforms = [//in order with RM_UNIFORM_TYPES
    (location, value) => {rm_gl.uniform1uiv(location, value)},
    (location, value) => {rm_gl.uniform2uiv(location, value)},
    (location, value) => {rm_gl.uniform3uiv(location, value)},
    (location, value) => {rm_gl.uniform4uiv(location, value)},
    (location, value) => {rm_gl.uniform1iv(location, value)},
    (location, value) => {rm_gl.uniform2iv(location, value)},
    (location, value) => {rm_gl.uniform3iv(location, value)},
    (location, value) => {rm_gl.uniform4iv(location, value)},
    (location, value) => {rm_gl.uniform1fv(location, value)},
    (location, value) => {rm_gl.uniform2fv(location, value)},
    (location, value) => {rm_gl.uniform3fv(location, value)},
    (location, value) => {rm_gl.uniform4fv(location, value)},

    (location, value) => {rm_gl.uniformMatrix2fv(location, false, value)},
    (location, value) => {rm_gl.uniformMatrix2x3fv(location, false, value)},
    (location, value) => {rm_gl.uniformMatrix2x4fv(location, false, value)},
    (location, value) => {rm_gl.uniformMatrix3x2fv(location, false, value)},
    (location, value) => {rm_gl.uniformMatrix3fv(location, false, value)},
    (location, value) => {rm_gl.uniformMatrix3x4fv(location, false, value)},
    (location, value) => {rm_gl.uniformMatrix4x2fv(location, false, value)},
    (location, value) => {rm_gl.uniformMatrix4x3fv(location, false, value)},
    (location, value) => {rm_gl.uniformMatrix4fv(location, false, value)}
]
RmUniformVar.prototype._glsl_types = [//in order with RM_UNIFORM_TYPES
    "uint", "uvec2", "uvec3", "uvec4",
    "int", "ivec2", "ivec3", "ivec4",
    "float", "vec2", "vec3", "vec4",

    "mat2","mat3","mat4",
    "mat3","mat3","mat4",
    "mat4","mat4","mat4",
]
RmUniformVar.prototype._update = function(){
    if(this.normalize) this.value = Math.normalize(this.value)
    this._uniforms[this.type](this.location, this.value)
}
RmUniformVar.prototype._relocate = function(){
    this.location = rm_gl.getUniformLocation( rm_shader_program, "u_"+this.name)
}

function RmUniformArray(name, value, type, normalize){
    RmUniformVar.call(this, name, value, type, normalize)
}
RmUniformArray.prototype = Object.create(RmUniformVar.prototype)
RmUniformArray.prototype.constructor = RmUniformArray
RmUniformArray.prototype._update = function(){
    if(this.normalize) {
        for(let i=0; i<this.value.length; i++){
            this.value[i] = Math.normalize(this.value[i])
        }
    }
    for(let i=0; i<this.value.length; i++){
        this._uniforms[this.type](this.location[i], this.value[i])
    }
}
RmUniformArray.prototype._relocate = function(){
    this.location = new Array()
    this.value.forEach((value_i, i) => {
        this.location.push(rm_gl.getUniformLocation( rm_shader_program, "u_"+this.name+"["+i+"]"))
    });
}


function RmUniformStruct(name, props){
    RmUniformObj.call(this, name)
    this.props = props
}
RmUniformStruct.prototype = Object.create(RmUniformObj.prototype)
RmUniformStruct.prototype.constructor = RmUniformStruct
RmUniformStruct.prototype._update = function(){
    this.props.forEach((prop) => {
        prop._update()
    });
}
RmUniformStruct.prototype._relocate = function(parrent_name){
    if(parrent_name == undefined) parrent_name = ""
    this.props.forEach((prop) => {
        if(prop.__proto__ === RmUniformVar.prototype){
            prop.location = rm_gl.getUniformLocation( rm_shader_program, "u_"+ parrent_name + this.name+"." + prop.name)

        }else if(prop.__proto__ === RmUniformVar.prototype){
            prop.location = new Array()
            for(let i=0;i<prop.value.length;i++){
                prop.location.push(
                    rm_gl.getUniformLocation( rm_shader_program, "u_"+ parrent_name + this.name+"." + prop.name+"["+i+"]")
                )
            }

        }else{
            prop._relocate(parrent_name + this.name+".")
        }

    });
}


function RmUniformStructArray(name, props){
    RmUniformStruct.call(this, name, props)
}
RmUniformStructArray.prototype = Object.create(RmUniformStruct.prototype)
RmUniformStructArray.prototype.constructor = RmUniformStructArray
RmUniformStructArray.prototype._update = function(){
    this.props.forEach((props_item) => {
        props_item.forEach((prop) => {
            prop._update()
        });
    });
}
RmUniformStructArray.prototype._relocate = function(parrent_name){
    if(parrent_name == undefined) parrent_name = ""
    this.props.forEach((props_item, index) => {
        props_item.forEach((prop) => {

            if(prop.__proto__ === RmUniformVar.prototype){
                prop.location = rm_gl.getUniformLocation( rm_shader_program, "u_"+ parrent_name + this.name+"["+index+"]." + prop.name)

            }else if(prop.__proto__ === RmUniformVar.prototype){
                prop.location = new Array()
                for(let i=0;i<prop.value.length;i++){
                    prop.location.push(
                        rm_gl.getUniformLocation( rm_shader_program, "u_"+ parrent_name + this.name+"["+index+"]." + prop.name+"["+i+"]")
                    )
                }

            }else{
                prop._relocate(parrent_name + this.name+"["+index+"].")
            }

        });
    });
}

//fast synonims
/*var Ruo = RmUniformObj
var Ruv = RmUniformVar
var Rua = RmUniformArray
var Rus = RmUniformStruct
var Rusa = RmUniformStructArray*/
