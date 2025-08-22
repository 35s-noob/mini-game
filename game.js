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

// 自分のプレイヤー
const myPlayer = new Player("me", canvas.width/2, canvas.height/2, "blue");
const otherPlayers = {}; // id: Player

// キー操作
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// マウス操作
canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    myPlayer.shoot(mouseX, mouseY);
    sendShoot(mouseX, mouseY);
});

// 移動更新
function updatePlayer() {
    const speed = 3;
    if(keys['w']) myPlayer.y -= speed;
    if(keys['s']) myPlayer.y += speed;
    if(keys['a']) myPlayer.x -= speed;
    if(keys['d']) myPlayer.x += speed;
}

// キルログ配列
const killLog = [];
const maxLog = 5;

// 武器リスト
const weapons = [
 "Combat Assault Rifle","Tactical Assault Rifle","Surge Assault Rifle","Elite Assault Rifle",
 "Burst Shotgun","Light Submachine Gun","Compact Submachine Gun",
 "Light Sniper Rifle","Heavy Sniper Rifle","Strike Pistol","Magnum Pistol"
];

// アクションと接続詞
const actions = [
 { action: "killed", connector: "with" },
 { action: "eliminated", connector: "with" },
 { action: "destroyed", connector: "using" }
];

// キルログ追加関数（アクションランダム）
function addKillLog(attacker, victim, weapon){
    const {action, connector} = actions[Math.floor(Math.random() * actions.length)];
    const logText = `${attacker} ${action} ${victim} ${connector} ${weapon}`;
    killLog.unshift(logText);
    if(killLog.length > maxLog) killLog.pop();
    updateKillLogUI();
}

function updateKillLogUI(){
    const logDiv = document.getElementById('killLog');
    logDiv.innerHTML = killLog.map(l => `<div>${l}</div>`).join('');
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
animate();

// ==========================
// P2P通信（PeerJS）
const peer = new Peer();
peer.on('open', id => console.log('My peer ID: '+id));

const connections = {};
peer.on('connection', conn => {
    connections[conn.peer] = conn;
    conn.on('data', handleData);
});

function handleData(data){
    if(data.type === 'playerMove'){
        if(!otherPlayers[data.id]) otherPlayers[data.id] = new Player(data.id,data.x,data.y,"red");
        else{
            otherPlayers[data.id].x = data.x;
            otherPlayers[data.id].y = data.y;
        }
    }
    if(data.type === 'shoot'){
        if(otherPlayers[data.id]){
            otherPlayers[data.id].shoot(data.targetX, data.targetY);
        }
    }
    if(data.type === 'kill'){
        addKillLog(data.attacker, data.victim, data.weapon);
    }
}

// 自分の移動情報送信
function sendPosition(){
    for(let id in connections){
        connections[id].send({type:'playerMove', id:myPlayer.id, x:myPlayer.x, y:myPlayer.y});
    }
}
setInterval(sendPosition,50);

// 自分の射撃情報送信
function sendShoot(x,y){
    for(let id in connections){
        connections[id].send({type:'shoot', id:myPlayer.id, targetX:x, targetY:y});
    }
}

// キル発生時送信例（弾命中判定後に呼ぶ）
function sendKill(attacker, victim, weapon){
    for(let id in connections){
        connections[id].send({type:'kill', attacker, victim, weapon});
    }
    addKillLog(attacker, victim, weapon); // 自分用にも表示
}

// デモ用：3秒ごとにランダムキルログ演出
const demoPlayers = ["Player#1234","User#1234","Guest#1234","Solider#1234"];
setInterval(()=>{
    let attacker = demoPlayers[Math.floor(Math.random()*demoPlayers.length)];
    let victim = demoPlayers[Math.floor(Math.random()*demoPlayers.length)];
    while(victim===attacker) victim = demoPlayers[Math.floor(Math.random()*demoPlayers.length)];
    let weapon = weapons[Math.floor(Math.random()*weapons.length)];
    addKillLog(attacker, victim, weapon);
}, 3000);
