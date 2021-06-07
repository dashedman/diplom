var accelerationForce = 1.5
var verticalSpeed = 2
var zoomSpeed = 5
var stopForse = 0
var speedLimit = 100

var mouse = {
  isLock: false,
  isDown: false,
  x: 0,
  y: 0,
}

function horizontalRotateCamera(rdx){
    let newX = state.cameraDir.value[0]*Math.cos(rdx) - state.cameraDir.value[2]*Math.sin(rdx)
    let newZ = state.cameraDir.value[0]*Math.sin(rdx) + state.cameraDir.value[2]*Math.cos(rdx)

    state.cameraDir.value[0] = newX
    state.cameraDir.value[2] = newZ

    state.cameraPos.value[0] = -state.cameraDir.value[0] * state.cameraRad
    state.cameraPos.value[2] = -state.cameraDir.value[2] * state.cameraRad

    state.cameraPos.commit()
    state.cameraDir.commit()
}

function dp_init(canvas_window){
    state.rotateAcceleration = new Float32Array([0,0,0])

    canvas_window.addEventListener("click",(event)=>{
        canvas_window.requestPointerLock()
    })
    document.addEventListener("pointerlockchange",(event)=>{
        if(document.pointerLockElement === canvas_window){
            mouse.isLock = true
        }else{
            mouse.isLock = false
        }
    })
    document.addEventListener("pointerlockerror",(event)=>{
        mouse.isLock = false
        alert("PointerAPI is not aviable in this browser!")
    })
    canvas_window.addEventListener("mousedown",(event)=>{
        mouse.isDown = true
    })
    canvas_window.addEventListener("mouseup",(event)=>{
        mouse.isDown = false
    })
    canvas_window.addEventListener("mousemove",(event)=>{

        if(mouse.isLock){
            //TODO: mouse control

        }
    })
    document.addEventListener('keydown', function(event) {
        PRESSED_KEYS[event.keyCode] = true
        ONCE_PRESSED_KEYS.add(event.keyCode)
    });
    document.addEventListener('keyup', function(event) {
        PRESSED_KEYS[event.keyCode] = false
    });
}

function dp_update(dt){
    if(mouse.isLock){
        //TODO: cameraAcceleration
        if(PRESSED_KEYS[ KEY_D ] || PRESSED_KEYS[ KEY_RIGHT ]){
            state.cameraRotateSpeed = Math.max(state.cameraRotateSpeed - accelerationForce*dt, -speedLimit)
        }else if(PRESSED_KEYS[ KEY_A ] || PRESSED_KEYS[ KEY_LEFT ]){
            state.cameraRotateSpeed = Math.min(state.cameraRotateSpeed + accelerationForce*dt, speedLimit)
        }

        if(PRESSED_KEYS[ KEY_E ]){
            horizontalRotateCamera(-2*accelerationForce * dt)
        }else if(PRESSED_KEYS[ KEY_Q ]){
            horizontalRotateCamera(2*accelerationForce * dt)
        }

        if(PRESSED_KEYS[ KEY_W ] || PRESSED_KEYS[ KEY_UP ] || PRESSED_KEYS[ KEY_S ] || PRESSED_KEYS[ KEY_DOWN ]){
            let dy;
            if(PRESSED_KEYS[ KEY_W ] || PRESSED_KEYS[ KEY_UP ])
                dy = dt*verticalSpeed;
            else dy = -dt*verticalSpeed;

            const dirT = Math.hypot(state.cameraDir.value[0] - state.cameraDir.value[2])
            let newY = state.cameraDir.value[1] * Math.cos(dy) - dirT * Math.sin(dy)
            let newT = state.cameraDir.value[1] * Math.sin(dy) + dirT * Math.cos(dy)

            if(newT > 0.1){
                state.cameraDir.value[1] = newY
                state.cameraDir.value[0] = state.cameraDir.value[0] * (newT/dirT)
                state.cameraDir.value[2] = state.cameraDir.value[2] * (newT/dirT)

                state.cameraPos.value[0] = -state.cameraDir.value[0] * state.cameraRad
                state.cameraPos.value[1] = -state.cameraDir.value[1] * state.cameraRad
                state.cameraPos.value[2] = -state.cameraDir.value[2] * state.cameraRad

                state.cameraPos.commit()
                state.cameraDir.commit()
            }
        }

        if(PRESSED_KEYS[ KEY_X ] || PRESSED_KEYS[ KEY_PLUS ]){
            state.cameraRad = Math.min(1000, state.cameraRad + dt*zoomSpeed)
            state.cameraPos.value = Math.scale(state.cameraDir.value, -state.cameraRad)
            state.cameraPos.commit()
        }else if(PRESSED_KEYS[ KEY_Z ] || PRESSED_KEYS[ KEY_MINUS ]){
            state.cameraRad = Math.max(0.1, state.cameraRad - dt*zoomSpeed)
            state.cameraPos.value = Math.scale(state.cameraDir.value, -state.cameraRad)
            state.cameraPos.commit()
        }

        if(PRESSED_KEYS[ KEY_F ]){
            state.go_physic = true
        }

    // TODO:
    // change recompile for debug mode
        if(ONCE_PRESSED_KEYS.size > 0){
            if(ONCE_PRESSED_KEYS.has(KEY_G)){
                state.go_physic = true
                if(state.lock_physic) state.lock_physic=false
                else state.lock_physic=true
                console.log("lock_physic",state.lock_physic)
            }
          if(ONCE_PRESSED_KEYS.has(KEY_ONE)){
              state.debugMode.value[0] = 1
              state.debugMode.commit()
          }
          if(ONCE_PRESSED_KEYS.has(KEY_TWO)){
              state.debugMode.value[0] = 2
              state.debugMode.commit()
          }
          if(ONCE_PRESSED_KEYS.has(KEY_THREE)){
              state.debugMode.value[0] = 3
              state.debugMode.commit()
          }
          if(ONCE_PRESSED_KEYS.has(KEY_FOUR)){
              state.debugMode.value[0] = 4
              state.debugMode.commit()
          }
          if(ONCE_PRESSED_KEYS.has(KEY_FIVE)){
              state.debugMode.value[0] = 5
              state.debugMode.commit()
          }
          if(ONCE_PRESSED_KEYS.has(KEY_SIX)){
              state.debugMode.value[0] = 6
              state.debugMode.commit()
          }
          if(ONCE_PRESSED_KEYS.has(KEY_SEVEN)){
              state.debugMode.value[0] = 7
              state.debugMode.commit()
          }
          if(ONCE_PRESSED_KEYS.has(KEY_EIGHT)){
              state.debugMode.value[0] = 8
              state.debugMode.commit()
          }
          if(ONCE_PRESSED_KEYS.has(KEY_NINE)){
              state.debugMode.value[0] = 9
              state.debugMode.commit()
          }
          if(ONCE_PRESSED_KEYS.has(KEY_ZERO)){
              state.debugMode.value[0] = 0
              state.debugMode.commit()
          }
          if(ONCE_PRESSED_KEYS.has(KEY_SPACE)){
              state.cameraRotateSpeed = 0
          }
          console.log(state.debugMode.value[0])
          ONCE_PRESSED_KEYS.clear()
        }
    }else{
        if(ONCE_PRESSED_KEYS.size > 0){
          ONCE_PRESSED_KEYS.clear()
        }
    }

    //
    if(state.cameraRotateSpeed != 0){
        const rdx = state.cameraRotateSpeed*dt
        horizontalRotateCamera(rdx)
        state.cameraRotateSpeed = Math.sign(state.cameraRotateSpeed)*Math.max(0, Math.abs(state.cameraRotateSpeed) - stopForse*dt)
    }
}

const PRESSED_KEYS = new Int32Array(256)
const ONCE_PRESSED_KEYS = new Set()
//keycodes
const KEY_ESCAPE = 27
const KEY_BACKSPACE = 8
const KEY_TAB = 9
const KEY_SPACE = 32
const KEY_ENTER = 13
const KEY_SHIFT = 16
const KEY_CTRL = 17
const KEY_ALT = 18

const KEY_LEFT = 37
const KEY_UP = 38
const KEY_RIGHT = 39
const KEY_DOWN = 40

const KEY_PLUS = 187
const KEY_EQUAL = 187
const KEY_MINUS = 189

const KEY_A = 65
const KEY_B = 66
const KEY_C = 67
const KEY_D = 68
const KEY_E = 69
const KEY_F = 70
const KEY_G = 71
const KEY_H = 72
const KEY_I = 73
const KEY_J = 74
const KEY_K = 75
const KEY_L = 76
const KEY_M = 77
const KEY_N = 78
const KEY_O = 79
const KEY_P = 80
const KEY_Q = 81
const KEY_R = 82
const KEY_S = 83
const KEY_T = 84
const KEY_U = 85
const KEY_V = 86
const KEY_W = 87
const KEY_X = 88
const KEY_Y = 89
const KEY_Z = 90

const KEY_ZERO = 48
const KEY_ONE = 49
const KEY_TWO = 50
const KEY_THREE = 51
const KEY_FOUR = 52
const KEY_FIVE = 53
const KEY_SIX = 54
const KEY_SEVEN = 55
const KEY_EIGHT = 56
const KEY_NINE = 57
