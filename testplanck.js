const PATHS = {
    DOME: '0 0 0 250 19 250 20 231.9 25.7 196.1 36.9 161.7 53.3 129.5 74.6 100.2 100.2 74.6 129.5 53.3 161.7 36.9 196.1 25.7 231.9 20 268.1 20 303.9 25.7 338.3 36.9 370.5 53.3 399.8 74.6 425.4 100.2 446.7 129.5 463.1 161.7 474.3 196.1 480 231.9 480 250 500 250 500 0 0 0',
    // DROP_LEFT: '0 0 20 0 70 100 20 150 0 150 0 0',
    DROP_LEFT: '0 0 10 -5 20 0 60 100 50 105 0 75',
    // DROP_RIGHT: '50 0 68 0 68 150 50 150 0 100 50 0',
    DROP_RIGHT: '50 0 58 -5 68 0 68 75 5 105 0 100',
    APRON_LEFT: '0 0 120 120 0 120 0 0',
    APRON_RIGHT: '180 0 180 120 60 120 180 0'
};
const COLOR = {
    BACKGROUND: '#212529',
    OUTER: '#495057',
    INNER: '#15aabf',
    BUMPER: '#fab005',
    BUMPER_LIT: '#fff3bf',
    PADDLE: '#e64980',
    PINBALL: '#dee2e6'
};

const GRAVITY = 0.75;
const WIREFRAMES = false;
const BUMPER_BOUNCE = 1.5;
const PADDLE_PULL = 0.005;
const MAX_VELOCITY = 50;

// shared variables
let dpr;
let currentScore, highScore;
let fieldBumper, fieldBumper2;
let engine, world, render, pinball, stopperGroup;
let leftPaddle, leftUpStopper, leftDownStopper, isLeftPaddleUp;
let rightPaddle, rightUpStopper, rightDownStopper, isRightPaddleUp;
let isFalling = false;
const delta = 1000 / 60;
const subSteps = 3;
const subDelta = delta / subSteps;
var matterTimeStep = 16.666;
var btnSpaceHold = false;

//static variable
var OBSTACLE = 0xFFFF;

// The boxes don't collide with triangles (except if both are small).
var OBSTACLE_GROUP = -1;
var BALL_GROUP = -2;

window.onload = function () {
    let gameConfig = {
        type: Phaser.CANVAS,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "canvas",
            width: 305.5 * window.devicePixelRatio,
            height: 624 * window.devicePixelRatio,
        },
        dom: {
            createContainer: true
        },
        backgroundColor: 0xD30000,
        // physics: {
        //     default: 'matter', //arcade
        //     matter: {
        //         gravity: { //global gravity
        //             y: GRAVITY
        //         },
        //         plugins: {
        //             attractors: true,
        //         },
        //         positionIterations: 6,
        //         velocityIterations: 4,
        //         constraintIterations: 2,
        //         enableSleeping: false,
        //         timing: {
        //             timestamp: 0,
        //             timeScale: 1
        //         },
        //         debug: true
        //     },
        // },
        // plugins: {
        //     scene: [{
        //         plugin: PhaserMatterCollisionPlugin.default,
        //         key: 'matterCollision',
        //         mapping: 'matterCollision'
        //     }]
        // },
        scene: [PlayGame]
    };
    game = new Phaser.Game(gameConfig);
    window.focus();

    // (function run() {
    //     window.requestAnimationFrame(run);
    //     for (let i = 0; i < subSteps; i += 1) {
    //         PlayGame.update(engine, subDelta);
    //     }
    // })();

}

class PlayGame extends Phaser.Scene {
    constructor() {
        super("PlayGame");
    }

    init() {
        // Init World
        this.world = planck.World(planck.Vec2(0, 3));
        currentScore = 0;
        //init scale window
        dpr = window.devicePixelRatio;

        // init canvas size
        this.gameWidth = this.sys.game.scale.width
        this.gameHeight = this.sys.game.scale.height
        this.halfWidth = this.gameWidth / 2;
        this.halfHeight = this.gameHeight / 2;
        let PX2M = 0.01;

        // Box2D works with meters. We need to convert meters to pixels.
        // let's say 30 pixels = 1 meter.
        // this.worldScale = 30;
        this.scaleFactor = 30;

        this.bodies = [];
        this.gravity = 0; // 3 is normal
    }

    preload() {
        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect((this.gameWidth / 2) - (320 / 2), this.gameHeight / 2, 320, 50);

        var textLoading = this.make.text({
            x: this.gameWidth / 2,
            y: this.gameHeight / 2 - 50,
            text: "Loading...",
            style: {
                fontFamily: "Arial Black",
                fontSize: 12 * window.devicePixelRatio,
                fill: "#FFFFFF"
            }
        });

        var percentText = this.make.text({
            x: this.gameWidth / 2,
            y: this.gameHeight / 2 + 5,
            text: "0%",
            style: {
                fontFamily: "Arial Black",
                fontSize: 12 * window.devicePixelRatio,
                fill: "#FFFFFF"
            }
        });

        textLoading.setOrigin(0.5, 0.5);
        percentText.setOrigin(0.5, 0.5);

        this.load.on("progress", function (value) {
            progressBar.clear();
            percentText.setText(parseInt(value * 100) + "%");
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(((this.gameWidth / 2) - (300 / 2)), (this.gameHeight / 2) + 10, 300 * value, 30);
        });

        this.load.on("complete", function () {
            progressBar.destroy();
            progressBox.destroy();
            textLoading.destroy();
            percentText.destroy();
        });

        this.load.plugin('rexmovetoplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexmovetoplugin.min.js', true);

        // fetch("", {
        //     method: "get",
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${userToken}`
        //     }
        // }).then(res => {
        //     res.json().then(res2 => {
        //         userpull = res2;
        //         console.log(`User's Pull : ${res2}`);
        //     })
        // }).catch(err => {
        //     console.log(err);
        // });

        /*
         *Load ASSET
         */
        this.load.path = "./asset/img/";
        this.load.image("btnStart", "btnStart.png");
        this.load.image("bgIntro", "bg_intro.jpg");
        this.load.image("bgStart", "bg_start.png");
        this.load.image("trigger", "trigger_top.png");
        this.load.image("ball", "ball.png");
        this.load.image("pegas", "pegas.png");
        this.load.image("dome", "dome.png");
        this.load.image("wall1", "wall1.png");
        this.load.image("wall2", "wall2.png");
        this.load.image("wall3", "wall3.png");
        this.load.image("leftA", "left_a.png");
        this.load.image("rightA", "right_a.png");
        this.load.image("leftB", "left_b.png");
        this.load.image("rightB", "right_b.png");
        this.load.image("leftC", "left_c.png");
        this.load.image("rightC", "right_c.png");
        this.load.image("leftD", "left_d.png");
        this.load.image("rightD", "right_d.png");
        this.load.image("toggleLeft", "toggle_left.png");
        this.load.image("toggleRight", "toggle_right.png");
        this.load.image("bumper100", "bumper_100.png");
        this.load.image("bumper200", "bumper_200.png");
        this.load.image("bumper500", "bumper_500.png");
        this.load.image("appronsLeft", "approns_left.png");
        this.load.image("appronsRight", "approns_right.png");
        this.load.image("closestopperLeft", "closestopperLeft.png");
        this.load.image("closestopperRight", "closestopperRight.png");
        this.load.image("stopper", "stopper.png");
        this.load.image("bgPinball", "bg_pinball.png");
        this.load.image("fieldBumper", "field_bumper.png");
        this.load.json("shapes", "shapes.json");
    }

    // scaling sprite atau lainnya dengan mempertahankan ratio pixel
    scaleWithRatioPixel(offset) {
        return ((1 * window.devicePixelRatio) / 4) - offset;
    }

    create() {
        console.log(`DPR: ${window.devicePixelRatio}`);
        console.log(this.scaleWithRatioPixel(0));
        // this.bgIntro = this.add.sprite(this.gameWidth / 2, this.gameHeight / 2, "bgIntro");
        // this.btnStart = this.add.sprite(this.gameWidth / 2, this.gameHeight / 1.5, "btnStart")
        //     .setScale(this.scaleWithRatioPixel(0.1));
        // this.btnStart.setInteractive() // impartant for make sprite or image event
        // let btnStart = this.btnStart;
        // let btnStartOver = this.scaleWithRatioPixel(0);
        // let btnStartOut = this.scaleWithRatioPixel(0.1);
        // this.bgIntro.setDisplaySize(this.gameWidth, this.gameHeight);
        // this.btnStart.on("pointerover", function () {
        //     btnStart.setScale(btnStartOver);
        // });
        // this.btnStart.on("pointerout", function () {
        //     btnStart.setScale(btnStartOut);
        // });
        this.enterGame();
        // this.btnStart.on("pointerdown", this.enterGame, this);
    }

    enterGame() {
        this.shapes = this.cache.json.get('shapes');

        this.add.image(this.halfWidth - (3 * dpr), this.halfHeight + (11 * dpr), 'bgPinball', null, {
            isStatic: true,
            isSensor: true,
        })
            .setScale(0.25 * dpr);

        this.createWall();
        this.createPaddle();
        this.createBumper();
        this.createStopper();
        this.createBall();
        this.createContactEvents();
        this.createSpring();
        this.createControlKey();

        // const runner = new Runner(ww, {
        //     fps: 60,
        //     speed: 1,
        // })

        // runner.start(() => {
        //     renderer.renderWorld()
        // });
        // this.testtestbed(); // for debug purpose
    }

    createWall() {
        this.topWall = new Edge(this, 0, this.gameHeight, this.gameWidth, this.gameHeight, false, "topWall");
        this.bottomWall = new Edge(this, 0, 0, this.gameWidth, 0, false, "bottomWall");
        this.leftWall = new Edge(this, 0, 0, 0, this.gameHeight, false, "leftWall");
        this.rightWall = new Edge(this, this.gameWidth, 0, this.gameWidth, this.gameHeight, false, "rightWall");

        const {
            points: rightInnerWallPoints
        } = getPoints(this.shapes, "wall4");
        // this.rightInnerWall = new Poly(this, this.gameWidth - (50 * dpr), this.halfHeight + (100 * dpr), "wall3", rightInnerWallPoints, false, true, 0.45);
        new ChainShape(this, this.halfWidth, (75 * dpr), "dome", this.shapes.dome2.fixtures[0].vertices, false, true, 0.5, "dome");
        new ChainShape(this, this.halfWidth + (105 * dpr), this.halfHeight + (57 * dpr), "wall1", this.shapes.wall4.fixtures[0].vertices, false, true, 0.5, "wall1");
        new ChainShape(this, (25 * dpr), this.halfHeight + (65 * dpr), "wall2", this.shapes.wall5.fixtures[0].vertices, false, true, 0.5, "wall2");
        new ChainShape(this, (75 * dpr), this.halfHeight - (125 * dpr), "wall3", this.shapes.wall6.fixtures[0].vertices, false, true, 0.5, "wall6");

        //top wall
        new ChainShape(this, this.halfWidth - (15 * dpr), (145 * dpr), "leftD", this.shapes.leftD.fixtures[0].vertices, false, true, 0.5, "leftD", OBSTACLE_GROUP);
        new ChainShape(this, this.halfWidth + (15 * dpr), (145 * dpr), "rightD", this.shapes.rightD.fixtures[0].vertices, false, true, 0.5, "rightD", OBSTACLE_GROUP);

        // bottom wall
        new ChainShape(this, (70 * dpr), this.halfHeight + (275 * dpr), "appronsLeft", this.shapes.appronsLeft.fixtures[0].vertices, false, true, 0.5, "appronsLeft", OBSTACLE_GROUP);
        new ChainShape(this, this.halfWidth + (75 * dpr), this.halfHeight + (275 * dpr), "appronsRight", this.shapes.appronsRight.fixtures[0].vertices, false, true, 0.5, "appronsRight", OBSTACLE_GROUP);
        new OtherBumper(this, this.halfWidth - (20 * dpr), this.halfHeight + (125 * dpr), "leftA", this.shapes.leftA.fixtures[0].vertices, false, true, 0.5, "leftA", OBSTACLE_GROUP, 0.5);
        new OtherBumper(this, this.halfWidth + (15 * dpr), this.halfHeight + (125 * dpr), "rightA", this.shapes.rightA.fixtures[0].vertices, false, true, 0.5, "rightA", OBSTACLE_GROUP, 0.5);
        new OtherBumper(this, this.halfWidth - (75 * dpr), this.halfHeight + (165 * dpr), "leftB", this.shapes.leftB.fixtures[0].vertices, false, true, 0.5, "leftB", OBSTACLE_GROUP, 1);
        new OtherBumper(this, this.halfWidth + (65 * dpr), this.halfHeight + (165 * dpr), "rightB", this.shapes.rightB.fixtures[0].vertices, false, true, 0.5, "rightB", OBSTACLE_GROUP, 1);
    }

    createStopper() {
        this.stopperLeft = new ChainShape(this, this.halfWidth - (127 * dpr), this.halfHeight + (302 * dpr), "stopper", this.shapes.stopper.fixtures[0].vertices, false, true, 0.7, "stopperLeft", OBSTACLE_GROUP);
        this.stopperRight = new ChainShape(this, this.halfWidth + (117 * dpr), this.halfHeight + (302 * dpr), "stopper", this.shapes.stopper.fixtures[0].vertices, false, true, 0.7, "stopperRight", OBSTACLE_GROUP);
    }

    createLeftStop() {
        this.closeLeft = new ChainShape(this, this.halfWidth - (127 * dpr), this.halfHeight + (230 * dpr), "closestopperLeft", this.shapes.closestopperLeft.fixtures[0].vertices, false, true, 0.7, "closestopperLeft", OBSTACLE_GROUP);
    }

    createRigthStop() {
        this.closeRight = new ChainShape(this, this.halfWidth + (117 * dpr), this.halfHeight + (230 * dpr), "closestopperRight", this.shapes.closestopperRight.fixtures[0].vertices, false, true, 0.7, "closestopperRight", OBSTACLE_GROUP);
    }

    createSpring() {
        // this.springdot = new Rectangle(this, this.halfWidth + (138 * dpr), this.halfHeight + (310 * dpr), "trigger", (10 * dpr), (5 * dpr), false, false);
        this.springdot = new Rectangle(this, this.halfWidth + (145 * dpr), this.halfHeight + (240 * dpr), "trigger", (10 * dpr), (5 * dpr), 0.55, false, false);
        this.trigger = new Rectangle(this, this.halfWidth + (145 * dpr), this.halfHeight + (240 * dpr), "trigger", (10 * dpr), (5 * dpr), 0.55, true, false);
        this.spring = this.add.sprite(this.halfWidth + (145 * dpr), this.halfHeight + (240 * dpr), "pegas");
        this.spring.setScale(0.55);
        this.spring.setOrigin(0.5, 1);
        var worldAxis = planck.Vec2(0, -1);
        this.triggerSpring = this.world.createJoint(planck.PrismaticJoint({
            lowerTranslation: -6.4,
            upperTranslation: 0,
            enableLimit: true,
            maxMotorForce: -500,
            motorSpeed: 100,
            enableMotor: true
        }, this.trigger.b, this.springdot.b, this.trigger.b.getWorldCenter(), worldAxis));

    }

    createPaddle() {
        const {
            points: toggleLeftPoints
        } = getPoints(this.shapes, "toggle_left");

        const {
            points: toggleRightPoints
        } = getPoints(this.shapes, "toggle_right");

        this.paddleWall1 = new ChainShape(this, this.halfWidth - (91 * dpr), this.halfHeight + (186 * dpr), "leftC", this.shapes.paddlewall1.fixtures[0].vertices, false, true, 0.45, "leftC", OBSTACLE_GROUP);
        this.paddleWall1 = new ChainShape(this, this.halfWidth + (80 * dpr), this.halfHeight + (188 * dpr), "rightC", this.shapes.paddlewall2.fixtures[0].vertices, false, true, 0.45, "rightC", OBSTACLE_GROUP);
        this.circle2 = new Circle(this, this.halfWidth - (63 * dpr), this.halfHeight + (233.5 * dpr), "", (6 * dpr), false, false, OBSTACLE_GROUP);
        this.circle3 = new Circle(this, this.halfWidth + (51 * dpr), this.halfHeight + (233.5 * dpr), "", (6 * dpr), false, false, OBSTACLE_GROUP);
        this.flipper = new Poly(this, this.halfWidth - (43 * dpr), this.halfHeight + (243.5 * dpr), "toggleLeft", toggleLeftPoints, true, false, 0.5, "leftPaddle", OBSTACLE_GROUP);
        this.flipper2 = new Poly(this, this.halfWidth + (32.5 * dpr), this.halfHeight + (243.5 * dpr), "toggleRight", toggleRightPoints, true, false, 0.5, "rightPaddle", OBSTACLE_GROUP);

        this.jointLeftPaddle = this.world.createJoint(planck.RevoluteJoint({
            enableMotor: true,
            motorSpeed: 0.0,
            maxMotorTorque: 2000,
            enableLimit: true,
            lowerAngle: -0.5 * Math.PI, // -90 degrees
            upperAngle: 0 * Math.PI, // 45 degrees
            // lowerAngle: -20 * (Math.PI / 180.0),
            // upperAngle: 25 * (Math.PI / 180.0),
        }, this.circle2.b, this.flipper.b, this.circle2.b.m_sweep.c));

        this.jointRightPaddle = this.world.createJoint(planck.RevoluteJoint({
            enableMotor: true,
            motorSpeed: 0.0,
            maxMotorTorque: 2000,
            enableLimit: true,
            lowerAngle: 0 * Math.PI,
            upperAngle: 0.5 * Math.PI
        }, this.circle3.b, this.flipper2.b, this.circle3.b.m_sweep.c));
    }

    createBumper() {
        this.bumperField = new Circle(this, this.halfWidth + (3 * dpr), this.halfHeight - (66 * dpr), "fieldBumper", (75 * dpr), false, true, "bumperField", BALL_GROUP);
        this.bumper100 = new Bumper(this, this.halfWidth + (45 * dpr), this.halfHeight - (65 * dpr), "bumper100", (25 * dpr), false, true, "bumper100");
        this.bumper200 = new Bumper(this, this.halfWidth - (25 * dpr), this.halfHeight - (95 * dpr), "bumper200", (22 * dpr), false, true, "bumper200");
        this.bumper500 = new Bumper(this, this.halfWidth - (28 * dpr), this.halfHeight - (30 * dpr), "bumper500", (20 * dpr), false, true, "bumper500");
    }

    createControlKey() {
        // keyboard paddle events
        let triggerPer = this.triggerSpring;
        this.btnSpace = this.input.keyboard.addKey("SPACE");
        this.btnSpace.on("down", function () {
            btnSpaceHold = true;
            triggerPer.setMaxMotorForce(-5);
            // triggerPer.setMotorSpeed(10);
            // triggerPer.enableMotor(false);
            // console.log("SPACE BTN DOWN");
        }, this);
        this.btnSpace.on("up", function () {
            btnSpaceHold = false;
            // triggerPer.setMotorSpeed(0);
            // triggerPer.setMaxMotorForce(-100);
            triggerPer.setMaxMotorForce(-200);
            // triggerPer.enableMotor(true);
            // console.log("SPACE BTN UP");
        }, this);

        let leftPaddle = this.jointLeftPaddle;
        this.leftBtn = this.input.keyboard.addKey("LEFT");
        this.leftBtn.on("down", function () {
            leftPaddle.setMotorSpeed(-20);
        }, this);
        this.leftBtn.on("up", function () {
            leftPaddle.setMotorSpeed(20);
        }, this);

        let rightPaddle = this.jointRightPaddle;
        this.rightBtn = this.input.keyboard.addKey("RIGHT");
        this.rightBtn.on("down", function () {
            rightPaddle.setMotorSpeed(20);
        }, this);

        this.rightBtn.on("up", function () {
            rightPaddle.setMotorSpeed(-20);
        }, this);
    }

    createContactEvents() {
        let ww = this;
        let ball = this.circle;
        let stopperLeft = this.stopperLeft;
        let stopperRight = this.stopperRight;
        let closeLeft = this.closeLeft;
        let closeRight = this.closeRight;
        // console.log(this.circle.b);
        ww.world.on("begin-contact", function (contact) {
            let labelBodyA = contact.m_fixtureA.m_userData;
            let labelBodyB = contact.m_fixtureB.m_userData;
            if (labelBodyA == "topWall" && labelBodyB == "ballss") {
                ww.circle.destroy();
            }
            if (labelBodyA == "wall4" && labelBodyB == "ballss") {
                // console.log(labelBodyA);
            }
            if (labelBodyA == "bumper100" && labelBodyB == "ballss") {
                currentScore += 100;
                // console.log(labelBodyA);
            }
            if (labelBodyA == "bumper200" && labelBodyB == "ballss") {
                currentScore += 200;
                // console.log(labelBodyA);
            }
            if (labelBodyA == "bumper500" && labelBodyB == "ballss") {
                currentScore += 500;
                // console.log(labelBodyA);
            }
            if (labelBodyA == "stopperLeft" && labelBodyB == "ballss") {
                ball.stopper();
                setTimeout(function () {
                    ball.launchBall();
                }, 2500);
                setTimeout(function () {
                    ww.createLeftStop();
                }, 3000);
            }
            if (labelBodyA == "stopperRight" && labelBodyB == "ballss") {
                ball.stopper();
                setTimeout(function () {
                    ball.launchBall();
                }, 2500);
                setTimeout(function () {
                    ww.createRigthStop();
                }, 3000);
            }
        });
    }

    createBall() {
        // create ball
        this.circle = new Circle(this, this.halfWidth + (138 * dpr), this.halfHeight, "ball", 7 * dpr, true, false, "ballss", BALL_GROUP);
    }

    update() {

        let spring = this.spring;
        if (btnSpaceHold) {
            if (spring.scaleY > 0.013) {
                if (spring.scaleY < 0.45) {
                    spring.scaleY -= 0.015;
                } else {
                    spring.scaleY -= 0.005;
                }
            }
        } else {
            spring.scaleY = 0.55;
        }

        // advance the simulation by 1/20 seconds
        this.world.step(1 / 16, 10, 8);
        // console.log(this.game.loop.delta);
        // console.log(this.game.loop.actualFps);

        // crearForces  method should be added at the end on each step
        this.world.clearForces();
    }

    testtestbed() {
        let gw = this.gameWidth;
        let gh = this.gameHeight;
        let ww = this.world;
        planck.testbed(function (testbed) {
            var world = ww;
            testbed.width = 10.25 * dpr;
            testbed.height = 2.5 * dpr;
            testbed.x = 5.1 * dpr;
            testbed.y = -10 * dpr;
            // console.log(testbed);
            return world;
        });
    }

}

class Circle extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, key, radius, isDynamic, isFixed, label, groupIndex) {
        super(scene, x, y);

        const rnd =
            Math.random()
                .toString(36)
                .substring(2, 15) +
            Math.random()
                .toString(36)
                .substring(2, 15);

        const graphics = scene.add.graphics();
        graphics.fillStyle(0x333333, 1);
        graphics.fillCircle(radius, radius, radius);

        graphics.generateTexture(rnd, radius * 2, radius * 2);
        graphics.destroy();

        if (key != "") {
            this.setTexture(key);
        }
        this.displayWidth = radius * 2;
        this.displayHeight = radius * 2;
        this.scene = scene;
        this.isDynamic = isDynamic;
        this.isFixed = isFixed;
        this.scene.add.existing(this);

        this.radius = radius;

        this.x = x;
        this.y = y;

        // Body
        this.b = scene.world.createBody({
            userData: label,
            bullet: true
        });
        if (this.isDynamic) {
            this.b.setDynamic();
        }
        // console.log(scene.world);
        // const init = img => {
        this.b.createFixture(planck.Circle(radius / 30), {
            friction: 0,
            restitution: 0.5,
            density: 1,
            userData: label,
            filterGroupIndex: groupIndex,
        });
        // console.log(this.b);

        this.b.setPosition(
            planck.Vec2(this.x / 30, this.y / 30)
        );

        this.b.setMassData({
            mass: 0.5,
            center: planck.Vec2(),
            I: 1
        });

        //     this.b.render = {
        //         stroke: 'tomato',
        //         custom: (ctx, pos, size) => {
        //             ctx.drawImage(img, pos.x, pos.y, size, size)
        //             return true // optional
        //         }
        //     }

        // }

        // const img = new Image()
        // img.src = "./asset/img/ball.png" //"https://www.pngall.com/wp-content/uploads/5/Sports-Ball-Transparent.png"
        // img.onload = () => {
        //     init(img)
        // }
    }

    stopper() {
        let ball = this.b;
        // do not change world immediately
        setTimeout(function () {
            ball.setAwake(false);
        }, 1);
        console.log(ball.isSleepingAllowed());
    }

    launchBall() {
        let ball = this.b;
        // do not change world immediately
        setTimeout(function () {
            ball.setAwake(true);
            // ball.setTransform(planck.Vec2(0, 100), 0);
            ball.applyLinearImpulse(planck.Vec2(0, -50), planck.Vec2(0, 0), true);
        }, 1);
    }

    destroy() {
        let world = this.scene.world;
        let ball = this.b;
        // do not change world immediately
        setTimeout(function () {
            world.destroyBody(ball);
        }, 1);
        this.removeFromDisplayList();
        // this.removedFromScene();
        // this.scene.world.destroyBody(this.b);
        // console.log(this.scene.world.destroyBody());
        // this.b.m_destroyed = true
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        let p = this.b.getPosition();
        this.x = p.x * 30;
        this.y = p.y * 30;
        this.rotation = this.b.getAngle();
    }
}

class Bumper extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, key, radius, isDynamic, isFixed, label, groupIndex) {
        super(scene, x, y);

        const rnd =
            Math.random()
                .toString(36)
                .substring(2, 15) +
            Math.random()
                .toString(36)
                .substring(2, 15);

        const graphics = scene.add.graphics();
        graphics.fillStyle(0x333333, 1);
        graphics.fillCircle(radius, radius, radius);

        graphics.generateTexture(rnd, radius * 2, radius * 2);
        graphics.destroy();

        if (key != "") {
            this.setTexture(key);
        }
        this.displayWidth = radius * 2;
        this.displayHeight = radius * 2;
        this.scene = scene;
        this.isDynamic = isDynamic;
        this.isFixed = isFixed;
        this.scene.add.existing(this);

        this.radius = radius;

        this.x = x;
        this.y = y;

        // Body
        this.b = scene.world.createBody({
            userData: label,
            bullet: true
        });
        if (this.isDynamic) {
            this.b.setDynamic();
        }
        // console.log(scene.world);
        // const init = img => {
        this.b.createFixture(planck.Circle(radius / 30), {
            friction: 0.1,
            restitution: 1,
            density: 1,
            userData: label,
            filterGroupIndex: groupIndex,
        });
        // console.log(this.b);

        this.b.setPosition(
            planck.Vec2(this.x / 30, this.y / 30)
        );

        this.b.setMassData({
            mass: 0.5,
            center: planck.Vec2(),
            I: 1
        });

        //     this.b.render = {
        //         stroke: 'tomato',
        //         custom: (ctx, pos, size) => {
        //             ctx.drawImage(img, pos.x, pos.y, size, size)
        //             return true // optional
        //         }
        //     }

        // }

        // const img = new Image()
        // img.src = "./asset/img/ball.png" //"https://www.pngall.com/wp-content/uploads/5/Sports-Ball-Transparent.png"
        // img.onload = () => {
        //     init(img)
        // }
    }

    destroy() {
        let world = this.scene.world;
        let ball = this.b;
        // do not change world immediately
        setTimeout(function () {
            world.destroyBody(ball);
        }, 1);
        this.removeFromDisplayList();
        // this.removedFromScene();
        // this.scene.world.destroyBody(this.b);
        // console.log(this.scene.world.destroyBody());
        // this.b.m_destroyed = true
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        let p = this.b.getPosition();
        this.x = p.x * 30;
        this.y = p.y * 30;
        this.rotation = this.b.getAngle();
    }
}

class Rectangle extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, key, width, height, scale, isDynamic, isFixed, groupIndex) {
        super(scene, x, y);

        const rnd =
            Math.random()
                .toString(36)
                .substring(2, 15) +
            Math.random()
                .toString(36)
                .substring(2, 15);

        const graphics = scene.add.graphics();
        graphics.fillStyle(0x333333, 1);
        graphics.fillRect(x, y, width, height);

        graphics.generateTexture(rnd, width * 2, height * 2);
        graphics.destroy();

        if (key != "") {
            this.setTexture(key);
        }
        this.displayWidth = width * 2;
        this.displayHeight = height * 2;
        this.scale = scale;
        this.scene = scene;
        this.isDynamic = isDynamic;
        this.isFixed = isFixed;
        this.scene.add.existing(this);

        this.width = width;
        this.height = height;

        this.x = x;
        this.y = y;

        // Body
        this.b = scene.world.createBody();
        if (this.isDynamic) {
            this.b.setDynamic();
        }
        // const init = img => {
        this.b.createFixture(planck.Box(width * scale / 30, height * scale / 30), {
            friction: 1,
            restitution: 0.5,
            density: 1,
            filterGroupIndex: groupIndex,
        });

        this.b.setPosition(
            planck.Vec2(this.x / 30, this.y / 30)
        );

        this.b.setMassData({
            mass: 3,
            center: planck.Vec2(),
            I: 1
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        let p = this.b.getPosition();
        this.x = p.x * 30;
        this.y = p.y * 30;
        this.rotation = this.b.getAngle();
    }
}

class Edge extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, x2, y2, isDynamic, label, groupIndex) {
        super(scene, x, y);

        // We don't generate a texture because the bounds logic is annoying
        const graphics = scene.add.graphics();
        graphics.lineStyle(4, 0x333333, 1);
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x2, y2);
        graphics.closePath();
        graphics.strokePath();

        this.scene = scene;
        this.isDynamic = isDynamic;
        this.isFixed = true;
        this.scene.add.existing(this);

        this.x = x;
        this.y = y;
        this.x2 = x2;
        this.y2 = y2;

        this.b = scene.world.createBody();
        if (this.isDynamic) {
            this.b.setDynamic();
        }

        this.b.createFixture(
            planck.Edge(
                planck.Vec2(this.x / 30, this.y / 30),
                planck.Vec2(this.x2 / 30, this.y2 / 30)
            ), {
            friction: 1,
            restitution: 0.5,
            density: 1,
            userData: label,
            filterGroupIndex: groupIndex,
        }
        );

        this.b.setMassData({
            mass: 1,
            center: planck.Vec2(),
            I: 0
        });
        let PX2M = 0.01;
        const positionMeter = this.b.getPosition();
        const positionPixel = {
            x: (1 / PX2M) * positionMeter.x,
            y: (1 / PX2M) * positionMeter.y,
        };

        // const graphics2 = scene.add.graphics();
        // graphics2.lineStyle(5, 0xFF00FF, 1.0);
        // graphics2.fillStyle(0xFFFFFF, 1.0);
        // graphics2.fillRect(positionMeter.x / 30, positionMeter.y / 30, 200, 200);
        // graphics2.strokeRect(positionMeter.x / 30, positionMeter.y / 30, 200, 200);

        // graphics2.fillCircleShape(circle); // circle: {x, y, radius}
        // graphics2.fillRect(positionPixel.x, positionPixel.y, PX2M * (40 / Math.cos(Math.PI / 4)), PX2M * (THICKNESS / 2));
        // graphics2.strokeCircleShape(circle); // circle: {x, y, radius}
        // graphics2.strokeCircle(positionPixel.x, positionPixel.y, 14);

        // this.wallBottom = scene.world.createBody({
        //     type: 'static',
        // });

        // this.wallBottom.createFixture(
        //     planck.Box(
        //         400, 200,
        //         // PX2M * (40 / Math.cos(Math.PI / 4)),
        //         // PX2M * (THICKNESS / 2),
        //         // positionPixel,
        //         // Math.PI / 4,
        //     ), {
        //         density: 1.0,
        //         friction: 0.0,
        //         userData: 'wall-bottom-left',
        //     },
        // );
        // this.wallBottom.setPosition(planck.Vec2(positionPixel.x + 120, 800));

        // this.wallBottom = scene.world.createBody();
        // if (isDynamic) {
        //     this.wallBottom.setDynamic();
        // }
        // this.wallBottom.createFixture(planck.Box(20, 20));
        // // this.wallBottom.setPosition(planck.Vec2(positionMeter.x / 30, positionMeter.y / 30));
        // this.wallBottom.setMassData({
        //     mass: 1,
        //     center: planck.Vec2(),
        //     I: 1
        // });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
    }
}

class Poly extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, key, points, isDynamic, isFixed, scale, label, groupIndex) {
        super(scene, x, y);

        const rnd =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

        var arrTemp = [];
        points.map(function (e) {
            arrTemp.push({ x: e[0] / 2 * dpr * scale, y: e[1] / 2 * dpr * scale });
            return arrTemp;
        });
        const poly = new Polygon(arrTemp);
        const bbox = poly.aabb();

        const width = bbox.w;
        const height = bbox.h;

        // console.log(`width : ${this.width}`);
        // console.log(`width2 : ${width}`);
        // console.log(`height : ${this.height}`);
        // console.log(`height2 : ${height}`);
        // const assetsDPR = window.devicePixelRatio;
        this.scale = scale;
        // this.setDisplaySize(width, height);
        // this.setScale(assetsDPR / 10, assetsDPR / 10);

        // const graphics = scene.add.graphics();
        // graphics.fillStyle(0x333333, 1);
        // graphics.beginPath();
        // graphics.moveTo(points[0][0], points[0][1]);
        // for (let i = 1; i < points.length; i += 1) {
        //     graphics.lineTo(points[i][0], points[i][1]);
        // }
        // graphics.lineTo(points[0][0], points[0][1]);
        // graphics.closePath();
        // graphics.fill();
        // graphics.generateTexture(rnd, width, height);
        // graphics.destroy();

        if (key != "") {
            this.setTexture(key);
            // console.log();
        }
        this.scene = scene;
        this.isDynamic = isDynamic;
        this.isFixed = isFixed;
        this.scene.add.existing(this);

        this.setPosition(x, y);
        this.x = x;
        this.y = y;

        this.b = scene.world.createBody();
        if (this.isDynamic) {
            this.b.setDynamic();
        }

        const vertices = [];
        arrTemp.forEach((p) => {
            vertices.push(
                new planck.Vec2(
                    ((p.x - width / 1.9) / scene.scaleFactor),
                    ((p.y - height / 2) / scene.scaleFactor)
                )
            );
        });

        // console.log(vertices);
        // const init = img => {
        this.b.createFixture(planck.Polygon(vertices, arrTemp.length), {
            friction: 0.5,
            restitution: 0.5,
            density: 1,
            userData: label,
            filterGroupIndex: groupIndex,
        });
        this.b.setPosition(
            planck.Vec2(x / scene.scaleFactor, y / scene.scaleFactor)
        );
        this.b.setMassData({
            mass: 3,
            center: planck.Vec2(),
            I: this.isFixed ? 0 : 1
        });
        // this.setDisplayOrigin(this.b.getWorldCenter().x, this.b.getWorldCenter().y);

        // console.log(vertices);
        // console.log(points.length);
        // console.log(this.b.m_fixtureList.m_shape.m_vertices);

        //     this.b.render = {
        //         stroke: 'tomato',
        //         custom: (ctx, pos, size) => {
        //             ctx.drawImage(img, pos.x, pos.y, size, size)
        //             return true // optional
        //         }
        //     }

        // }

        // const img = new Image()
        // img.src = "./asset/img/toggle_left.png"
        // img.onload = () => {
        //     init(img)
        // }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        let p = this.b.getPosition();
        // console.log(p);
        this.x = p.x * this.scene.scaleFactor;
        this.y = p.y * this.scene.scaleFactor;
        this.rotation = this.b.getAngle();
    }
}

class ChainShape extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, key, points, isDynamic, isFixed, scale, label, groupIndex) {
        super(scene, x, y, key);

        const rnd =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
        // console.log(points);
        var arrTemp = [];
        points.map(function (e) {
            arrTemp.push({ x: e.x / 2 * dpr * scale, y: e.y / 2 * dpr * scale });
            return arrTemp;
        });

        const poly = new Polygon(arrTemp);
        const bbox = poly.aabb();

        const width = bbox.w;
        const height = bbox.h;
        // this.setDisplayOrigin(bbox.x, bbox.y);
        // const assetsDPR = window.devicePixelRatio;
        // this.scale = scale;
        // this.setScale(0.8);
        // this.setScale(assetsDPR / 10, assetsDPR / 10);

        // this.setScale(scale);
        const graphics = scene.add.graphics();
        graphics.fillStyle(0x333333, 1);
        graphics.beginPath();
        graphics.moveTo(arrTemp[0].x, arrTemp[0].y);
        for (let i = 1; i < arrTemp.length; i += 1) {
            graphics.lineTo(arrTemp[i].x, arrTemp[i].y);
        }
        graphics.lineTo(arrTemp[0].x, arrTemp[0].y);
        graphics.closePath();
        graphics.fill();
        graphics.generateTexture(rnd, width, height);
        graphics.destroy();
        // if (key != "") {
        //     this.setTexture(key);
        // }
        // this.setTexture(rnd);
        this.displayWidth = width / (scale + 0.4);
        this.displayHeight = height;
        this.scale = scale

        // this.displayOriginY = 0.5;
        // this.setDisplayOrigin(((width / 2) / scene.scaleFactor) * scale, ((height / 2) / scene.scaleFactor) * scale);
        // this.displayOriginY = ((height / 2) / scene.scaleFactor) * scale;
        this.scene = scene;
        this.isDynamic = isDynamic;
        this.isFixed = isFixed;
        this.scene.add.existing(this);

        // this.setPosition(x, y);
        // this.x = x;
        // this.y = y;

        this.b = scene.world.createBody();
        if (this.isDynamic) {
            this.b.setDynamic();
        }

        const vertices = [];
        arrTemp.forEach((p) => {
            vertices.push(
                new planck.Vec2(
                    ((p.x - width / 1.9) / scene.scaleFactor),
                    -((p.y - height / 2) / scene.scaleFactor)
                )
            );
        });

        this.b.createFixture(planck.Chain(vertices, arrTemp.length), {
            friction: 0.5,
            restitution: 0.5,
            density: 1,
            userData: label,
            filterGroupIndex: groupIndex,
        });
        this.b.setPosition(
            planck.Vec2(x / scene.scaleFactor, y / scene.scaleFactor)
        );
        this.b.setMassData({
            mass: 0,
            center: planck.Vec2(),
            I: this.isFixed ? 0 : 1
        });

        console.log(this.b);
        // let p = this.b.getPosition();
        // this.x = p.x * this.scene.scaleFactor;
        // this.y = p.y * this.scene.scaleFactor;
        // console.log(width);
        // console.log(this.width);
        // console.log(width * (scale));
        // console.log(`originbody x ${this.x}`);
        // console.log(`origin x ${this.displayOriginX}`);
        // this.setDisplayOrigin(550, 50);
        // this.displayOriginX = this.displayOriginX - 20;
        // this.displayOriginY = this.displayOriginY + 5;
        // console.log(`${label}: ${this.displayOriginY}`);
        // this.displayWidth = (width * (scale)) - scene.scaleFactor;
        // this.displayHeight = (height * (scale)) + scene.scaleFactor;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        let p = this.b.m_sweep.c;
        this.x = p.x * this.scene.scaleFactor;
        this.y = p.y * this.scene.scaleFactor;
        this.rotation = this.b.getAngle();
    }
}

class OtherBumper extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, key, points, isDynamic, isFixed, scale, label, groupIndex, restitution) {
        super(scene, x, y, key);

        const rnd =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
        // console.log(points);
        var arrTemp = [];
        points.map(function (e) {
            arrTemp.push({ x: e.x / 2 * dpr * scale, y: e.y / 2 * dpr * scale });
            return arrTemp;
        });

        const poly = new Polygon(arrTemp);
        const bbox = poly.aabb();

        const width = bbox.w;
        const height = bbox.h;
        // this.setDisplayOrigin(bbox.x, bbox.y);
        // const assetsDPR = window.devicePixelRatio;
        // this.scale = scale;
        // this.setScale(0.8);
        // this.setScale(assetsDPR / 10, assetsDPR / 10);

        // this.setScale(scale);
        const graphics = scene.add.graphics();
        graphics.fillStyle(0x333333, 1);
        graphics.beginPath();
        graphics.moveTo(arrTemp[0].x, arrTemp[0].y);
        for (let i = 1; i < arrTemp.length; i += 1) {
            graphics.lineTo(arrTemp[i].x, arrTemp[i].y);
        }
        graphics.lineTo(arrTemp[0].x, arrTemp[0].y);
        graphics.closePath();
        graphics.fill();
        graphics.generateTexture(rnd, width, height);
        graphics.destroy();
        // if (key != "") {
        //     this.setTexture(key);
        // }
        // this.setTexture(rnd);
        this.displayWidth = width / (scale + 0.4);
        this.displayHeight = height;
        this.scale = scale

        // this.displayOriginY = 0.5;
        // this.setDisplayOrigin(((width / 2) / scene.scaleFactor) * scale, ((height / 2) / scene.scaleFactor) * scale);
        // this.displayOriginY = ((height / 2) / scene.scaleFactor) * scale;
        this.scene = scene;
        this.isDynamic = isDynamic;
        this.isFixed = isFixed;
        this.scene.add.existing(this);

        // this.setPosition(x, y);
        // this.x = x;
        // this.y = y;

        this.b = scene.world.createBody();
        if (this.isDynamic) {
            this.b.setDynamic();
        }

        const vertices = [];
        arrTemp.forEach((p) => {
            vertices.push(
                new planck.Vec2(
                    ((p.x - width / 1.9) / scene.scaleFactor),
                    -((p.y - height / 2) / scene.scaleFactor)
                )
            );
        });

        this.b.createFixture(planck.Chain(vertices, arrTemp.length), {
            friction: 0.5,
            restitution: restitution,
            density: 1,
            userData: label,
            filterGroupIndex: groupIndex,
        });
        this.b.setPosition(
            planck.Vec2(x / scene.scaleFactor, y / scene.scaleFactor)
        );
        this.b.setMassData({
            mass: 0,
            center: planck.Vec2(),
            I: this.isFixed ? 0 : 1
        });

        // console.log(this.b);
        // let p = this.b.getPosition();
        // this.x = p.x * this.scene.scaleFactor;
        // this.y = p.y * this.scene.scaleFactor;
        // console.log(width);
        // console.log(this.width);
        // console.log(width * (scale));
        // console.log(`originbody x ${this.x}`);
        // console.log(`origin x ${this.displayOriginX}`);
        // this.setDisplayOrigin(550, 50);
        // this.displayOriginX = this.displayOriginX - 20;
        // this.displayOriginY = this.displayOriginY + 5;
        // console.log(`${label}: ${this.displayOriginY}`);
        // this.displayWidth = (width * (scale)) - scene.scaleFactor;
        // this.displayHeight = (height * (scale)) + scene.scaleFactor;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        let p = this.b.m_sweep.c;
        this.x = p.x * this.scene.scaleFactor;
        this.y = p.y * this.scene.scaleFactor;
        this.rotation = this.b.getAngle();
    }
}

const getPoints = (json, key) => {
    const points = [];
    const circles = [];
    for (var i = 0; i < json[key].fixtures.length; i++) {
        if (json[key].fixtures[i].circle) {
            circles.push({
                x: json[key].fixtures[i].circle.x,
                y: json[key].fixtures[i].circle.y,
                radius: json[key].fixtures[i].circle.radius
            });
        } else {
            for (var j = 0; j < json[key].fixtures[i].vertices.length; j++) {
                for (var k = 0; k < json[key].fixtures[i].vertices[j].length; k++) {
                    points.push([
                        json[key].fixtures[i].vertices[j][k].x,
                        json[key].fixtures[i].vertices[j][k].y
                    ]);
                }
            }
        }
    }
    return {
        points,
        circles
    };
};