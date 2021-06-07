function bublesDist(b1, b2){
    return Math.distance(b1.pos, b2.pos) - (b1.radius[0] + b2.radius[0])
}
function is_touch(dist){
    return dist < 0
}

function an_init(){
    state.bubles.forEach((buble, i) => {
        //get normal to center
        buble.velocity = [
            Math.random()*5,
            Math.random()*5,
            Math.random()*5
        ]
    });
}
function an_update(dt){
    state.bubles.forEach((buble, i) => {
        buble.npos = buble.pos
        buble.mass = 4/3 * Math.PI * Math.pow(buble.radius[0], 3)

        //calc moves
        for(let j = i-1; j>=0; j--){
            let bdist = bublesDist(buble, state.bubles[j])
            if(is_touch(bdist)){
                let direction = Math.normalize(Math.vecsub(buble.pos, state.bubles[j].pos))
                let dist = Math.distance(buble.pos, state.bubles[j].pos)
                let koef = Math.pow(bdist/Math.abs(buble.radius[0]+state.bubles[j].radius[0]), 3)

                buble.velocity = Math.vecadd(buble.velocity, Math.scale(direction, -koef))
                state.bubles[j].velocity = Math.vecadd(state.bubles[j].velocity, Math.scale(direction, koef))
            }else{
                //newton mechanics
                let direction = Math.normalize(Math.vecsub(buble.pos, state.bubles[j].pos))
                let dist = Math.distance(buble.pos, state.bubles[j].pos)
                let force = dt * (buble.mass * state.bubles[j].mass) / (dist*dist)

                buble.velocity = Math.vecadd(buble.velocity, Math.scale(direction, -force/buble.mass))
                state.bubles[j].velocity = Math.vecadd(state.bubles[j].velocity, Math.scale(direction, force/state.bubles[j].mass))
            }
        }

        //calc colision
        if(Math.length(buble.pos)+buble.radius[0] > (state.flask.value[0] - state.flask.value[1])/2){//out of flask)
            buble.velocity = Math.vecadd(
                buble.velocity,
                Math.scale(
                    Math.normalize(buble.pos),
                    dt*((state.flask.value[0] - state.flask.value[1])/2-buble.radius[0]-Math.length(buble.pos))
                )
            )
        }
        /*if(Math.length(buble.pos)-buble.radius[0] < 2.){//in lamp
            buble.pos = Math.scale(
                Math.normalize(buble.pos),
                (2.+buble.radius[0])/Math.length(buble.pos)
            )
        }*/
    });

    let newScattLightPos = [0,0,0]
    let massSum = 0
    state.bubles.forEach((buble, i) => {
        buble.npos = Math.vecadd(buble.npos, Math.scale(buble.velocity, dt))
        //calc scattering Light Position
        massSum += buble.radius[0]
        newScattLightPos = Math.vecadd(
            newScattLightPos,
            Math.scale(buble.pos, buble.radius[0])
        )
        //commit
        buble.pos.splice(0,3, ...buble.npos)
    });

    state.scattLightPos.value = Math.scale(newScattLightPos, massSum)

    state.rm_bubles.commit()
    state.scattLightPos.commit()
}
