// Three.js 基本設定
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// FPS操作
const controls = new THREE.PointerLockControls(camera, document.body);
document.body.addEventListener('click', ()=>controls.lock());
camera.position.set(0,2,5);

// 平地
const groundGeo = new THREE.BoxGeometry(50,1,50);
const groundMat = new THREE.MeshBasicMaterial({color:0x228B22});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -0.5;
scene.add(ground);

// 武器
let currentWeapon = document.getElementById('weaponSelect').value;
document.getElementById('weaponSelect').addEventListener('change', e=>{
  currentWeapon = e.target.value;
});

// モブ
class Mob {
    constructor(type, x, z){
        this.type = type;
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1,2,1),
            new THREE.MeshBasicMaterial({color: type==="zombie"?0x00ff00:0x808080})
        );
        this.mesh.position.set(x,1,z);
        scene.add(this.mesh);
        this.hp = 100;
    }
    moveTowardsPlayer() {
        const dir = new THREE.Vector3();
        dir.subVectors(camera.position, this.mesh.position).normalize();
        this.mesh.position.add(dir.multiplyScalar(0.02));
    }
}
const mobs = [new Mob("zombie",5,0), new Mob("skeleton",-5,0)];

// キルログ
const killLog = [];
const maxLog = 5;
const actions = [
 { action: "killed", connector: "with" },
 { action: "eliminated", connector: "with" },
 { action: "destroyed", connector: "using" }
];
function addKillLog(mobType, weapon){
    const {action, connector} = actions[Math.floor(Math.random()*actions.length)];
    const logText = `Player#1234 ${action} ${mobType} ${connector} ${weapon}`;
    killLog.unshift(logText);
    if(killLog.length>maxLog) killLog.pop();
    document.getElementById('killLog').innerHTML = killLog.map(l=>`<div>${l}</div>`).join('');
}

// 射撃
window.addEventListener('click', ()=>{
    const raycaster = new THREE.Raycaster();
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    raycaster.set(camera.position, dir);
    const intersects = raycaster.intersectObjects(mobs.map(m=>m.mesh));
    if(intersects.length>0){
        const mob = mobs.find(m=>m.mesh===intersects[0].object);
        mob.hp -= 50;
        if(mob.hp<=0){
            scene.remove(mob.mesh);
            addKillLog(mob.type, currentWeapon);
        }
    }
});

// キー移動
const keys = {};
window.addEventListener('keydown', e=>keys[e.key.toLowerCase()]=true);
window.addEventListener('keyup', e=>keys[e.key.toLowerCase()]=false);

function updatePlayer(){
    const speed = 0.1;
    if(keys['w']) controls.moveForward(speed);
    if(keys['s']) controls.moveForward(-speed);
    if(keys['a']) controls.moveRight(-speed);
    if(keys['d']) controls.moveRight(speed);
}

// アニメーションループ
function animate(){
    requestAnimationFrame(animate);
    updatePlayer();
    mobs.forEach(m=>m.moveTowardsPlayer());
    renderer.render(scene, camera);
}
animate();
