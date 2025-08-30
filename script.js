// ====== PLEXUS CANVAS ======
const canvas = document.getElementById("plexus");
const ctx = canvas.getContext("2d");

const rem =  parseFloat(getComputedStyle(document.documentElement).fontSize)

let W, H, particles = [];
// == Parametres ==
const Param = {
    dotRadius: 2,
    lineWidth: 2 * rem / 16,

    maxLineDistance : 190,
    maxPointSpeed : 1,
    maxAddedSpeed : .05,
    startMaxPointSpeed : 0.08,
    maxLinks : 3,
    minPointSpeed : 0.001,
    density: 0.00003,

    mouseForce: 0.1,
    mouseRadius: 70,
    frictionForce: 0.999,
}

// récup de la taille de l'écran
function resizeCanvas() {
    //  Densité de pixel réelle
    const dpr = Math.max(1, Math.min(1.5, window.devicePixelRatio || 1));  // 1 <= dpr <= 2 pour de bonnes perfs

    W =  Math.floor(window.innerWidth * dpr);
    canvas.width = W;
    H = Math.floor(window.innerHeight * dpr);
    canvas.height = H;

    canvas.style.width  = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles()

}

function initParticles() {
    const particlesCount = Param.density * W * H;
    particles = [];
    let angle, speed = 0;
    for (let i = 0; i < particlesCount; i++) {
        angle = Math.random() * 2 * Math.PI;
        speed = Math.random() * Param.startMaxPointSpeed;

        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,

            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        })
    }
}

const mouse = { x: -9999, y: -9999, active: false };
window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
}, { passive: true });
window.addEventListener('mouseleave', () => { mouse.active = false; });


function draw(){
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // --- Points
    ctx.fillStyle = getVar('--dot-color');
    for (const p of particles){

        // influence souris (répulsion douce)
        if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist <= Param.mouseRadius) {
                const force = Param.mouseForce / (dist + 0.01); // 1/d type
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }
        }

        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * Param.startMaxPointSpeed;

        // --- friction + min speed---

        p.vx = Math.abs(p.vx * Param.frictionForce) >= Param.minPointSpeed ? p.vx * Param.frictionForce : Math.cos(angle) * speed;
        p.vy = Math.abs(p.vy * Param.frictionForce) >= Param.minPointSpeed ? p.vy * Param.frictionForce : Math.sin(angle) * speed;

        // --- vitesse max  ---
        const v2 = p.vx*p.vx + p.vy*p.vy;
        const vmax = Param.maxPointSpeed;
        const vmax2 = vmax * vmax;
        if (v2 > vmax2) {
            const s = vmax / Math.sqrt(v2);
            p.vx *= s;
            p.vy *= s;
        }

        // mise à jour position
        p.x += p.vx;
        p.y += p.vy;


        // rebonds bords
        if (p.x < 0 || p.x > window.innerWidth)  p.vx *= -1;
        if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;

        // dessin point
        ctx.beginPath();
        ctx.arc(p.x, p.y, Param.dotRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // --- Lignes entre points proches
    ctx.strokeStyle = getVar('--line-color');
    ctx.lineWidth = Param.lineWidth;

    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        let links = 0;

        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x, dy = p1.y - p2.y;
            const d2 = dx * dx + dy * dy;
            const L2 = Param.maxLineDistance ** 2;

            if (d2 < L2 && links < Param.maxLinks) {
                links++;
                ctx.globalAlpha = 1.2 - Math.sqrt(d2) / Param.maxLineDistance;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(draw);
}

function getVar(name){
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Boucle + perf (pause quand onglet caché)
let rafId = null;
function start(){ if (!rafId) rafId = requestAnimationFrame(draw); }
function stop(){ if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
start();

document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
});


