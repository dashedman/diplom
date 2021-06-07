var temperatureRegulators = [
    {
        pos: [0,-100,0],
        temperature: 1250
    }/*{
        pos: [0,-24,0],
        temperature: 10
    },
    {
        pos: [10,-20,10],
        temperature: 15
    },
    {
        pos: [-10,-20,10],
        temperature: 15
    },
    {
        pos: [2,-23,-5],
        temperature: 15
    },*/
]
var globalTemperature = 4
var globalDensity = 1261 //glicerine

function parafineDensity(temperature){
    // t = 15 -> d = 915
    // t = 16 -> d = 880
    return (880 - 915) * (temperature-15) + 915;
}

function globalHeatExcange(buble){//convection
    const alpha = 0.01;
    return alpha * (globalTemperature - buble.temp[0]) * (4 * Math.PI * buble.radius[0]*buble.radius[0]); // a * dtm * 4pir^2
}
function emmiterHeatExcange(buble, regulator){
    let dist = Math.distance(regulator.pos, buble.pos)
    return regulator.temperature/(dist*dist)
}
function conductionHeatExcange(buble1, buble2){
    const k = 0.21; //parafine coef

    let dist = Math.distance(buble1.pos, buble2.pos)
    let a = (buble1.radius[0]*buble1.radius[0] - buble2.radius[0]*buble2.radius[0] + dist*dist)/(2*dist)
    let r2 = buble1.radius[0]*buble1.radius[0] - a*a
    let area = Math.PI*r2

    return -k*area*(buble1.temp[0] - buble2.temp[0])
}

function bubleDist(b1,b2){
    return Math.distance(b1.pos, b2.pos) - (b1.radius[0] + b2.radius[0])
}


function ph_init(){}
function ph_update(dt){
    //calc temperature
    let bubles = state.bubles
    for(let i=0; i < bubles.length; i++){
        bubles[i].ntemp = bubles[i].temp[0]

        //global temperature calc
        bubles[i].ntemp += globalHeatExcange(bubles[i])*dt

        for(let regulator of temperatureRegulators){
            bubles[i].ntemp += emmiterHeatExcange(bubles[i], regulator)*dt
        }

        for(let j=0; j < i; j++){
            //local temperature calc

            if(bubleDist(bubles[i], bubles[j]) < 0){
                let q = conductionHeatExcange(bubles[i], bubles[j])
                bubles[i].ntemp += q*dt
                bubles[j].ntemp -= q*dt
            }

        }
    }
    //calc mechanichs
    for(let i=0; i < bubles.length; i++){
        //calc density
        bubles[i].npos = bubles[i].pos
        bubles[i].temp[0] = bubles[i].ntemp
        bubles[i].density = parafineDensity(bubles[i].ntemp)

        //calc velocity with density
        bubles[i].velocity[1] += (globalDensity - bubles[i].density) * (4/3)*Math.PI*(bubles[i].radius[0]**3) * 9.8 * dt

        //calc pos
        bubles[i].npos[0] += bubles[i].velocity[0]*dt
        bubles[i].npos[1] += bubles[i].velocity[1]*dt
        bubles[i].npos[2] += bubles[i].velocity[2]*dt

        //calc other bubles
        for(let j=0; j < i; j++){
            //local temperature calc
            let dist = bubleDist(bubles[i], bubles[j])
            if( dist < -0.5 ){
                let dist_dir = Math.normalize(Math.vecsub(bubles[i].npos, bubles[j].npos))// vector (j -> i)

                bubles[i].npos = Math.vecadd(bubles[i].npos, Math.scale(dist_dir, dist*0.5))
                bubles[j].npos = Math.vecadd(bubles[j].npos, Math.scale(dist_dir, -dist*0.5))

                //vector projection on react normal
                let reactI = Math.scale(dist_dir, -Math.dot(dist_dir, bubles[i].velocity))
                let reactJ = Math.scale(dist_dir, Math.dot(dist_dir, bubles[j].velocity))

                let newVelocityI = Math.vecadd(Math.vecsub(bubles[i].velocity, reactI), reactJ)//own impulse + other impulse
                let newVelocityJ = Math.vecadd(Math.vecsub(bubles[j].velocity, reactJ), reactI)
                bubles[i].velocity = newVelocityI
                bubles[j].velocity = newVelocityJ
            }
        }

        //calc wals
        //in sphere c = (0,0,0); r = 7
        let container_dist = 25 - Math.length(bubles[i].npos) + bubles[i].radius[0]
        if( container_dist < 0 ){//container.radius
            bubles[i].npos = Math.scale(Math.normalize(bubles[i].npos), 25)
            bubles[i].velocity = Math.reflect(Math.scale(bubles[i].velocity, 0.5), Math.normalize(Math.scale(bubles[i].npos, -1)))
        }

        //commit
        //if(i==0)console.log(dt,bubles[i].ntemp, bubles[i].density, bubles[i].npos, bubles[i].velocity)
        //console.log(bubles[i].velocity)
        bubles[i].pos.splice(0,3, ...bubles[i].npos)
    }

    state.rm_bubles.commit()
}
