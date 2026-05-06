const navToggle = document.querySelector(".nav-toggle")
const navLinks = document.querySelectorAll(".nav__link")

navToggle.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
})

navLinks.forEach((link) => {
    link.addEventListener("click", () => {
        document.body.classList.remove('nav-open')
    })
})

// Help iframe of webgl demos get access to the keyboard by giving them focus when clicked
document.addEventListener("DOMContentLoaded", function () {
    const iframe = document.getElementById("demo");
    if (!iframe) {
        return;
    }
    iframe.addEventListener("load", function () {
        try {
            const iframeDoc = iframe.contentWindow.document;
            iframeDoc.addEventListener("mousedown", function () {
                iframe.contentWindow.Module.canvas.focus();
            });
        } catch (e) {
            console.error(e);
        }
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("suika-container");
    if (!container || typeof Matter === 'undefined') return;

    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          Events = Matter.Events;

    const engine = Engine.create();
    const world = engine.world;

    const width = 300;
    const height = 400;

    const render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent'
        }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    const wallOptions = { isStatic: true, render: { fillStyle: '#303030' } };
    const ground = Bodies.rectangle(width / 2, height + 25, width, 50, wallOptions);
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height, wallOptions);
    const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, wallOptions);

    Composite.add(world, [ground, leftWall, rightWall]);

    let score = 0;
    let isGameOver = false; 
    const scoreDisplay = document.getElementById('score-display');
    const resetButton = document.getElementById('reset-button');
    
    const radii = [10, 15, 22, 32, 42, 54, 68, 84, 100, 118, 138];
    const faceImgSrc = 'img/faceball.png'; 

    function createFaceBody(x, y, level) {
        const radius = radii[level];
        const scale = (radius * 2) / 300;

        const body = Bodies.circle(x, y, radius, {
            restitution: 0.2,   
            friction: 0.01,     
            density: 0.001,     
            render: {
                sprite: {
                    texture: faceImgSrc,
                    xScale: scale,
                    yScale: scale
                }
            }
        });
        body.level = level;
        return body;
    }

    container.addEventListener('mousedown', (e) => {

        if (isGameOver) return;

        const rect = container.getBoundingClientRect();
        const scaleX = width / rect.width;
        let x = (e.clientX - rect.left) * scaleX;

        x = Math.max(30, Math.min(x, width - 30));

        const startLevel = Math.floor(Math.random() * 3);

        const newFace = createFaceBody(x, 20, startLevel);
        Composite.add(world, newFace);
    });

    Events.on(engine, 'collisionStart', (event) => {
        const pairs = event.pairs;
        const bodiesToRemove = [];
        const bodiesToAdd = [];

        for (let i = 0; i < pairs.length; i++) {
            const bodyA = pairs[i].bodyA;
            const bodyB = pairs[i].bodyB;

            if (bodyA.level !== undefined && bodyB.level !== undefined && bodyA.level === bodyB.level) {
                if (bodyA.isMerging || bodyB.isMerging) continue;

                bodyA.isMerging = true;
                bodyB.isMerging = true;

                const nextLevel = bodyA.level + 1;

                score += (nextLevel * 10);
                if (!isGameOver) {
                    scoreDisplay.innerText = `Score: ${score}`;
                }

                if (nextLevel < radii.length) {
                    const midX = (bodyA.position.x + bodyB.position.x) / 2;
                    const midY = (bodyA.position.y + bodyB.position.y) / 2 - 10;

                    const newFace = createFaceBody(midX, midY, nextLevel);
                    bodiesToAdd.push(newFace);
                }

                bodiesToRemove.push(bodyA, bodyB);
            }
        }

        if (bodiesToRemove.length > 0) {
            Composite.remove(world, bodiesToRemove);
        }
        if (bodiesToAdd.length > 0) {
            Composite.add(world, bodiesToAdd);
        }
    });

    Events.on(engine, 'beforeUpdate', () => {
        if (isGameOver) return;

        const allBodies = Composite.allBodies(world);
        for (let i = 0; i < allBodies.length; i++) {
            const body = allBodies[i];
            if (body.level !== undefined) {
                if (body.position.y < 0 || body.position.y > height + 50) {
                    isGameOver = true;
                    scoreDisplay.innerText = `Game Over! Score: ${score}`;
                    scoreDisplay.style.color = '#ff4d4d';
                    break;
                }
            }
        }
    });

    // Reset
    resetButton.addEventListener('click', () => {
        isGameOver = false;
        score = 0;
        scoreDisplay.innerText = `Score: ${score}`;
        scoreDisplay.style.color = 'var(--clr-accent)';

        const allBodies = Composite.allBodies(world);
        const fruits = allBodies.filter(body => body.level !== undefined);
        Composite.remove(world, fruits);
    });
});