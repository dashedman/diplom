function Vec2(a,b){
    this._data = new Float32Array(2)
    this._data[0] = a; this._data[1] = b
}
// x,r,s
Object.defineProperty(Vec2.prototype, 'x', {
    get: function(){return this._data[0]},
    set: function(val){this._data[0]=val}
})
Object.defineProperty(Vec2.prototype, "r", {
    get: function(){return this._data[0]},
    set: function(val){this._data[0]=val}
})
Object.defineProperty(Vec2.prototype, "s", {
    get: function(){return this._data[0]},
    set: function(val){this._data[0]=val}
})
// y,g,t
Object.defineProperty(Vec2.prototype, "y", {
    get: function(){return this._data[1]},
    set: function(val){this._data[1]=val}
})
Object.defineProperty(Vec2.prototype, "g", {
    get: function(){return this._data[1]},
    set: function(val){this._data[1]=val}
})
Object.defineProperty(Vec2.prototype, "t", {
    get: function(){return this._data[1]},
    set: function(val){this._data[1]=val}
})

function Vec3(a,b,c){
    this._data = new Float32Array(3)
    this._data[0] = a; this._data[1] = b; this._data[2] = c
}
Object.defineProperty(Vec3.prototype, "x", {
    get: function(){return this._data[0]},
    set: function(val){this._data[0]=val}
})
Object.defineProperty(Vec3.prototype, "r", {
    get: function(){return this._data[0]},
    set: function(val){this._data[0]=val}
})
Object.defineProperty(Vec3.prototype, "s", {
    get: function(){return this._data[0]},
    set: function(val){this._data[0]=val}
})
Object.defineProperty(Vec3.prototype, "y", {
    get: function(){return this._data[1]},
    set: function(val){this._data[1]=val}
})
Object.defineProperty(Vec3.prototype, "g", {
    get: function(){return this._data[1]},
    set: function(val){this._data[1]=val}
})
Object.defineProperty(Vec3.prototype, "t", {
    get: function(){return this._data[1]},
    set: function(val){this._data[1]=val}
})
Object.defineProperty(Vec3.prototype, "z", {
    get: function(){return this._data[2]},
    set: function(val){this._data[2]=val}
})
Object.defineProperty(Vec3.prototype, "b", {
    get: function(){return this._data[2]},
    set: function(val){this._data[2]=val}
})
Object.defineProperty(Vec3.prototype, "p", {
    get: function(){return this._data[2]},
    set: function(val){this._data[2]=val}
})
function Vec4(x,y,z,w){
    this._data = new Float32Array(4)
    this._data[0] = x; this._data[1] = y; this._data[2] = z; this._data[3] = w
}
Object.defineProperty(Vec4.prototype, "x", {
    get: function(){return this._data[0]},
    set: function(val){this._data[0]=val}
})
Object.defineProperty(Vec4.prototype, "r", {
    get: function(){return this._data[0]},
    set: function(val){this._data[0]=val}
})
Object.defineProperty(Vec4.prototype, "s", {
    get: function(){return this._data[0]},
    set: function(val){this._data[0]=val}
})
Object.defineProperty(Vec4.prototype, "y", {
    get: function(){return this._data[1]},
    set: function(val){this._data[1]=val}
})
Object.defineProperty(Vec4.prototype, "g", {
    get: function(){return this._data[1]},
    set: function(val){this._data[1]=val}
})
Object.defineProperty(Vec4.prototype, "t", {
    get: function(){return this._data[1]},
    set: function(val){this._data[1]=val}
})
Object.defineProperty(Vec4.prototype, "z", {
    get: function(){return this._data[2]},
    set: function(val){this._data[2]=val}
})
Object.defineProperty(Vec4.prototype, "b", {
    get: function(){return this._data[2]},
    set: function(val){this._data[2]=val}
})
Object.defineProperty(Vec4.prototype, "p", {
    get: function(){return this._data[2]},
    set: function(val){this._data[2]=val}
})
Object.defineProperty(Vec4.prototype, "w", {
    get: function(){return this._data[3]},
    set: function(val){this._data[3]=val}
})
Object.defineProperty(Vec4.prototype, "a", {
    get: function(){return this._data[3]},
    set: function(val){this._data[3]=val}
})
Object.defineProperty(Vec4.prototype, "q", {
    get: function(){return this._data[3]},
    set: function(val){this._data[3]=val}
})

Math.radians = function(degrees){
    //Convert a quantity in degrees to radians
    return Math.PI*degrees/180.0;
}
Math.degrees = function(radians){
    //Convert a quantity in radians to degrees
    return 180.0*radians/Math.PI;
}
Math.inversesqrt = function(x){
    //Return the inverse of the square root of the parameter
    return 1./Math.sqrt(x);
}
Math.fract = function(x){
    //Compute the fractional part of the argument
    return x - Math.floor(x);
}
Math.mod = function(x, y){
    //Compute the value of x modulo y
    //Have some sign differences with js modulo operator `%`
    return x - y * Math.floor(x/y);
}
Math.clamp = function(mainVal, minVal, maxVal){
    //Constrain a value to lie between two further values
    return Math.max(minVal, Math.min(mainVal, maxVal));
}
Math.mix = function(fromVal, toVal, a){
    //Performs a linear interpolation between x and y using a to weight between them
    return fromVal*(1 - a) + toVal*a;
}
Math.step = function(edge, x){
    //Generates a step function by comparing x to edge
    return (x<edge) ? 0.0 : 1.0;
}
Math.smoothstep = function(minEdge, maxEdge, x){
    //Perform Hermite interpolation between two values
    const t = Math.clamp((x - minEdge) / (maxEdge1 - minEdge), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
}
Math.length = function(v){
    //Calculate the length of a vector
    return Math.hypot(...v);
}
Math.distance = function(v1, v2){
    //Calculate the distance between two vector points
    return Math.hypot(...v1.map((v1_value, index) => v1_value - v2[index] ))
}
Math.vecadd = function(v1, v2){
    //Calculate the dot product of two vectors
    return v1.map((vi, i) => vi+v2[i]);
}
Math.vecsub = function(v1, v2){
    //Calculate the dot product of two vectors
    return v1.map((vi, i) => vi-v2[i]);
}
Math.scale = function(v, scale){
    //Calculate the dot product of two vectors
    return v.map((vi, i) => vi*scale);
}
Math.dot = function(v1, v2){
    //Calculate the dot product of two vectors
    return v1.reduce((accumulator, v1_value, index) => accumulator + v1_value*v2[index] )
}
Math.cross = function(v1, v2){
    //Calculate the cross product of two 3-component vectors
    return v1.constructor([
        v1[1]*v2[2] - v1[2]*v1[1],//x
        v1[2]*v2[0] - v1[0]*v1[2],//y
        v1[0]*v2[1] - v1[1]*v1[0],//z
    ])
}
Math.normalize = function(v){
    //Calculate the unit vector in the same direction as the input vector
    const length = Math.hypot(...v);
    return v.map((vi) => vi/length);
}
Math.faceforward = function(vecN,vecI,Nref){
    //faceforward() orients a vector to point away from a surface as defined by its normal.
    //If dot(Nref, I) < 0 faceforward returns N, otherwise it returns -N.
    const sign = Math.sign(Math.dot(Nref, vecI));
    return vecN.map((val) => -sign*val);
}
Math.reflect = function(vecI, vecN){
    //For a given incident vector I and surface normal N reflect
    //returns the reflection direction calculated as I - 2.0 * dot(N, I) * N.
    //
    //N should be normalized in order to achieve the desired result.
    const calcDot = Math.dot(vecN, vecI);
    return vecI.map((vecI_val, index) => vecI_val - 2.0*calcDot*vecN[index]);
}
Math.refract = function(vecI, vecN, eta){
    //For a given incident vector I, surface normal N
    //and ratio of indices of refraction - eta,
    //refract returns the refraction vector R.
    //
    //The input parameters I and N should be normalized in order to achieve the desired result.
    const calcDot = Math.dot(vecN, vecI);
    const k = 1.0 - eta * eta * (1.0 - calcDot * calcDot);
    if(k < 0.0) return vecI.constructor(vecI.length)
    return vecI.map((vecI_val, index) => eta * vecI_val - (eta * calcDot + Math.sqrt(k)) * vecN[index])
}
