const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// プレイヤー
class Player {
    constructor(id, x, y, color){
        this.id = id;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = 30;
        this.weapon = "Combat Assault Rifle";
        this.bullets = [];
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
    shoot(targetX, targetY) {
        const dx = targetX - (this.x + this.size/2);
        const dy = targetY - (this.y + this.size/2);
        const len = Math.sqrt(dx*dx + dy*dy);
        const vx = dx / len * 5;
        const vy = dy / len * 5;
        this.bullets.push({x:this.x+this.size/2, y:this.y+this.size/2, vx, vy});
    }
    updateBullets() {
        this.bullets.forEach(b => { b.x += b.vx; b.y += b.vy; });
        this.bullets = this.bullets.filter(b => b.x>0 && b.x<canvas.width && b.y>0 && b.y<canvas.height);
    }
    drawBullets() {
        ctx.fillStyle = 'yellow';
        this.bullets.forEach(b => ctx.fillRect(b.x-2,b.y-2,4,4));
    }
}

// 自分と他プレイヤー
const myPlayer = new Player("me", canvas.width/2, canvas.height/2, "blue");
const otherPlayers = {};

// キー操作
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()]=true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()]=false);

// マウス射撃
canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    myPlayer.shoot(mouseX, mouseY);
    sendShoot(mouseX, mouseY);
});

// 移動
function updatePlayer() {
    const speed = 3;
    if(keys['w']) myPlayer.y -= speed;
    if(keys['s']) myPlayer.y += speed;
    if(keys['a']) myPlayer.x -= speed;
    if(keys['d']) myPlayer.x += speed;
}

// キルログ
const killLog = [];
const maxLog = 5;
const weapons = [
 "Combat Assault Rifle","Tactical Assault Rifle","Surge Assault Rifle","Elite Assault Rifle",
 "Burst Shotgun","Light Submachine Gun","Compact Submachine Gun",
 "Light Sniper Rifle","Heavy Sniper Rifle","Strike Pistol","Magnum Pistol"
];
const actions = [
 { action: "killed", connector: "with" },
 { action: "eliminated", connector: "with" },
 { action: "destroyed", connector: "using" }
];
function addKillLog(attacker, victim, weapon){
    const {action, connector} = actions[Math.floor(Math.random()*actions.length)];
    const logText = `${attacker} ${action} ${victim} ${connector} ${weapon}`;
    killLog.unshift(logText);
    if(killLog.length>maxLog) killLog.pop();
    updateKillLogUI();
}
function updateKillLogUI(){
    document.getElementById('killLog').innerHTML = killLog.map(l=>`<div>${l}</div>`).join('');
}

// 描画
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    myPlayer.draw();
    myPlayer.drawBullets();
    for(let id in otherPlayers){
        otherPlayers[id].draw();
        otherPlayers[id].drawBullets();
    }
}

// メインループ
function animate(){
    requestAnimationFrame(animate);
    updatePlayer();
    myPlayer.updateBullets();
    for(let id in otherPlayers) otherPlayers[id].updateBullets();
    draw();
}

// 初期設定開始
document.getElementById('startGame').addEventListener('click', ()=>{
    const name = document.getElementById('playerName').value;
    const color = document.getElementById('playerColor').value;
    const weapon = document.getElementById('playerWeapon').value;

    myPlayer.id = name;
    myPlayer.color = color;
    myPlayer.weapon = weapon;

    document.getElementById('settings').style.display='none';
    canvas.style.display='block';

    animate();
});

// P2P通信は既存コードと統合可能（省略）
