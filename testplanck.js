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
let currentScore, highScore, bufferScore;
let fieldBumper, fieldBumper2;
let engine, world, render, pinball, stopperGroup;
let leftPaddle, leftUpStopper, leftDownStopper, isLeftPaddleUp;
let rightPaddle, rightUpStopper, rightDownStopper, isRightPaddleUp;
let isFalling = false;
let topLedOne = false, topLedTwo = false, topLedThree = false;
let leftLedOne = false, leftLedTwo = false, leftLedThree = false;
let logoLed = false;
let centerLed = false;
let joint = null;
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
        this.gravity = 3; // 3 is normal
        this.world = planck.World(planck.Vec2(0, this.gravity));
        currentScore = 0;
        bufferScore = 0;
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
        this.load.image("puck", "puck.png");
        this.load.image("appronsLeft", "approns_left.png");
        this.load.image("appronsRight", "approns_right.png");
        this.load.image("closestopperLeft", "closestopperLeft.png");
        this.load.image("closestopperRight", "closestopperRight.png");
        this.load.image("stopper", "stopper.png");
        this.load.image("bridge", "bridge.png");
        this.load.image("entranceBridge", "entrance_bridge.png");
        this.load.image("exitBridge", "exit_bridge.png");
        this.load.image("topLedOff", "top_led_off.png");
        this.load.image("topLedOn", "top_led_on.png");
        this.load.image("top1", "top_1.png");
        this.load.image("top2", "top_2.png");
        this.load.image("top3", "top_3.png");
        this.load.image("hole", "hole.png");
        this.load.image("logo", "logo.png");
        this.load.image("logo2", "logo2.png");
        this.load.image("puckLedOn", "puck_led_on.png");
        this.load.image("puckLedOff", "puck_led_off.png");
        this.load.image("arrowLedBridge1Off", "arrow_led_bridge1.png");
        this.load.image("arrowLedBridge1On", "arrow_led_bridge12.png");
        this.load.image("arrowLedBridge2Off", "arrow_led_bridge2.png");
        this.load.image("arrowLedBridge2On", "arrow_led_bridge22.png");
        this.load.image("arrowLedBridge3Off", "arrow_led_bridge3.png");
        this.load.image("arrowLedBridge3On", "arrow_led_bridge32.png");
        this.load.image("arrowLedBridge4Off", "arrow_led_bridge4.png");
        this.load.image("arrowLedBridge4On", "arrow_led_bridge42.png");
        this.load.image("arrowLedBridge5Off", "arrow_led_bridge5.png");
        this.load.image("arrowLedBridge5On", "arrow_led_bridge52.png");
        this.load.image("bgPinball", "bg_pinball.png");
        this.load.image("bonus", "bonus.png");
        this.load.image("fieldBumper", "field_bumper.png");
        this.load.json("shapes", "shapes.json");

        // Font
        this.load.path = "./asset/font/";
        this.load.bitmapFont(
            'kanitBlack',
            'Kanit-Black.png',
            'Kanit-Black.xml'
        );
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
            .setScale(0.25 * dpr).setDepth(0);


        this.textScore = this.make.text({
            x: this.halfWidth + (100 * dpr),
            y: 20 * dpr,
            text: "0",
            style: {
                fontFamily: "Arial Black",
                fontSize: 12 * dpr,
                fill: "#FFFFFF"
            }
        }).setDepth(2);

        this.createWall();
        this.createPaddle();
        this.createLed();
        this.createBumper();
        this.createBonus();
        this.createLabelScore();
        this.createBall();
        this.createStopper();
        this.createBridge();
        this.createTrigger();
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

    createLabelScore() {
        this.add.bitmapText(this.halfWidth - (90 * dpr), this.halfHeight + (150 * dpr), "kanitBlack", "100", 30).setAngle(90);
        this.add.bitmapText(this.halfWidth + (95 * dpr), this.halfHeight + (150 * dpr), "kanitBlack", "100", 30).setAngle(90);
        this.add.bitmapText(this.halfWidth - (120 * dpr), this.halfHeight + (250 * dpr), "kanitBlack", "500", 30).setAngle(90);
        this.add.bitmapText(this.halfWidth + (125 * dpr), this.halfHeight + (250 * dpr), "kanitBlack", "500", 30).setAngle(90);
    }

    createWall() {
        this.topWall = new Edge(this, 0, this.gameHeight, this.gameWidth, this.gameHeight, false, "topWall", null, 1);
        this.bottomWall = new Edge(this, 0, 0, this.gameWidth, 0, false, "bottomWall", null, 1);
        this.leftWall = new Edge(this, 0, 0, 0, this.gameHeight, false, "leftWall", null, 1);
        this.rightWall = new Edge(this, this.gameWidth, 0, this.gameWidth, this.gameHeight, false, "rightWall", null, 1);

        const {
            points: rightInnerWallPoints
        } = getPoints(this.shapes, "wall4");
        // this.rightInnerWall = new Poly(this, this.gameWidth - (50 * dpr), this.halfHeight + (100 * dpr), "wall3", rightInnerWallPoints, false, true, 0.45);
        new ChainShape(this, this.halfWidth, (75 * dpr), "dome", this.shapes.dome2.fixtures[0].vertices, false, true, false, 0.5, "dome", null, 0, 1);
        this.wall1 = new ChainShape(this, this.halfWidth + (105 * dpr), this.halfHeight + (57 * dpr), "wall1", this.shapes.wall4.fixtures[0].vertices, false, true, false, 0.5, "wall1", null, 0, 1);
        this.wall2 = new ChainShape(this, (25 * dpr), this.halfHeight + (65 * dpr), "wall2", this.shapes.wall5.fixtures[0].vertices, false, true, false, 0.5, "wall2", null, 0, 1);
        this.wall3 = new ChainShape(this, (75 * dpr), this.halfHeight - (125 * dpr), "wall3", this.shapes.wall6.fixtures[0].vertices, false, true, false, 0.5, "wall6", null, 0, 1);

        // trigger and ball paddock
        new Rectangle(this, this.halfWidth + (145 * dpr), this.halfHeight + (280 * dpr), "", (30 * dpr), (70 * dpr), 0.5, false, false, true, "", OBSTACLE_GROUP, 0, 1);
        new Rectangle(this, this.halfWidth + (145 * dpr), this.halfHeight + (270 * dpr), "", (30 * dpr), (35 * dpr), 0.5, false, false, true, "", OBSTACLE_GROUP, 0, 1);

        //top wall
        new ChainShape(this, this.halfWidth - (15 * dpr), (155 * dpr), "leftD", this.shapes.leftD.fixtures[0].vertices, false, true, false, 0.5, "leftD", OBSTACLE_GROUP, 0.5, 1);
        new ChainShape(this, this.halfWidth + (15 * dpr), (155 * dpr), "rightD", this.shapes.rightD.fixtures[0].vertices, false, true, false, 0.5, "rightD", OBSTACLE_GROUP, 0.5, 1);

        // bottom wall
        new ChainShape(this, (70 * dpr), this.halfHeight + (275 * dpr), "appronsLeft", this.shapes.appronsLeft.fixtures[0].vertices, false, true, false, 0.5, "appronsLeft", OBSTACLE_GROUP, 0.25, 1);
        new ChainShape(this, this.halfWidth + (75 * dpr), this.halfHeight + (275 * dpr), "appronsRight", this.shapes.appronsRight.fixtures[0].vertices, false, true, false, 0.5, "appronsRight", OBSTACLE_GROUP, 0.25, 1);
        new OtherBumper(this, this.halfWidth - (20 * dpr), this.halfHeight + (105 * dpr), "leftA", this.shapes.leftA.fixtures[0].vertices, false, true, 0.5, "leftA", OBSTACLE_GROUP, 0.5, 1);
        new OtherBumper(this, this.halfWidth + (15 * dpr), this.halfHeight + (105 * dpr), "rightA", this.shapes.rightA.fixtures[0].vertices, false, true, 0.5, "rightA", OBSTACLE_GROUP, 0.5, 1);
        new OtherBumper(this, this.halfWidth - (70 * dpr), this.halfHeight + (172 * dpr), "leftB", this.shapes.leftB.fixtures[0].vertices, false, true, 0.5, "leftB", OBSTACLE_GROUP, 0.7, 1);
        new OtherBumper(this, this.halfWidth + (60 * dpr), this.halfHeight + (172 * dpr), "rightB", this.shapes.rightB.fixtures[0].vertices, false, true, 0.5, "rightB", OBSTACLE_GROUP, 0.7, 1);
    }

    createStopper() {
        this.stopperLeft = new ChainShape(this, this.halfWidth - (127 * dpr), this.halfHeight + (302 * dpr), "stopper", this.shapes.stopper.fixtures[0].vertices, false, true, false, 0.7, "stopperLeft", OBSTACLE_GROUP, 0, 1);
        this.stopperRight = new ChainShape(this, this.halfWidth + (117 * dpr), this.halfHeight + (302 * dpr), "stopper", this.shapes.stopper.fixtures[0].vertices, false, true, false, 0.7, "stopperRight", OBSTACLE_GROUP, 0, 1);

        //closer
        this.closeLeft = new ChainShape(this, this.halfWidth - (127 * dpr), this.halfHeight + (230 * dpr), "closestopperLeft", this.shapes.closestopperLeft.fixtures[0].vertices, false, true, false, 0.7, "closestopperLeft", OBSTACLE_GROUP, 0.1, 2);
        this.closeRight = new ChainShape(this, this.halfWidth + (117 * dpr), this.halfHeight + (230 * dpr), "closestopperRight", this.shapes.closestopperRight.fixtures[0].vertices, false, true, false, 0.7, "closestopperRight", OBSTACLE_GROUP, 0.1, 2);
        this.closeBegin = new ChainShape(this, this.halfWidth + (125 * dpr), this.halfHeight - (205 * dpr), "closestopperRight", this.shapes.closestopperRight.fixtures[0].vertices, false, true, false, 0.7, "closeBegin", OBSTACLE_GROUP, 0.1, 2);
        this.closeLeft.b.setActive(false);
        this.closeLeft.setAlpha(0);
        this.closeRight.b.setActive(false);
        this.closeRight.setAlpha(0);
        this.closeBegin.b.setActive(false);
        this.closeBegin.setAlpha(0);
    }

    // createLeftStop() {
    //     this.closeLeft = new ChainShape(this, this.halfWidth - (127 * dpr), this.halfHeight + (230 * dpr), "closestopperLeft", this.shapes.closestopperLeft.fixtures[0].vertices, false, true, false, 0.7, "closestopperLeft", OBSTACLE_GROUP);
    // }

    // createRigthStop() {
    //     this.closeRight = new ChainShape(this, this.halfWidth + (117 * dpr), this.halfHeight + (230 * dpr), "closestopperRight", this.shapes.closestopperRight.fixtures[0].vertices, false, true, false, 0.7, "closestopperRight", OBSTACLE_GROUP);
    // }

    // createBeginStop() {
    //     this.closeBegin = new ChainShape(this, this.halfWidth + (125 * dpr), this.halfHeight - (205 * dpr), "closestopperRight", this.shapes.closestopperRight.fixtures[0].vertices, false, true, false, 0.7, "closeBegin", OBSTACLE_GROUP);
    // }

    createSpring() {
        this.springdot = new Rectangle(this, this.halfWidth + (145 * dpr), this.halfHeight + (240 * dpr), "trigger", (10 * dpr), (5 * dpr), 0.55, false, false, false, "springDot", null, 0, 1);
        this.trigger = new Rectangle(this, this.halfWidth + (145 * dpr), this.halfHeight + (240 * dpr), "trigger", (10 * dpr), (5 * dpr), 0.55, true, false, false, "trigger", null, 0, 1);
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

        // console.log(this.triggerSpring);
    }

    createPaddle() {
        const {
            points: toggleLeftPoints
        } = getPoints(this.shapes, "toggle_left");

        const {
            points: toggleRightPoints
        } = getPoints(this.shapes, "toggle_right");

        this.paddleWall1 = new ChainShape(this, this.halfWidth - (91 * dpr), this.halfHeight + (186 * dpr), "leftC", this.shapes.paddlewall1.fixtures[0].vertices, false, true, false, 0.45, "leftC", OBSTACLE_GROUP, 0.3, 1);
        this.paddleWall1 = new ChainShape(this, this.halfWidth + (80 * dpr), this.halfHeight + (186 * dpr), "rightC", this.shapes.paddlewall2.fixtures[0].vertices, false, true, false, 0.45, "rightC", OBSTACLE_GROUP, 0.3, 1);
        this.circle2 = new Circle(this, this.halfWidth - (63 * dpr), this.halfHeight + (233.5 * dpr), "", (6 * dpr), false, false, false, OBSTACLE_GROUP, 1);
        this.circle3 = new Circle(this, this.halfWidth + (56 * dpr), this.halfHeight + (234 * dpr), "", (6 * dpr), false, false, false, OBSTACLE_GROUP, 1);
        this.flipper = new Poly(this, this.halfWidth - (43 * dpr), this.halfHeight + (243.5 * dpr), "toggleLeft", toggleLeftPoints, true, false, 0.5, "leftPaddle", OBSTACLE_GROUP, 1);
        this.flipper2 = new Poly(this, this.halfWidth + (37.5 * dpr), this.halfHeight + (244 * dpr), "toggleRight", toggleRightPoints, true, false, 0.5, "rightPaddle", OBSTACLE_GROUP, 1);

        this.jointLeftPaddle = this.world.createJoint(planck.RevoluteJoint({
            enableMotor: true,
            motorSpeed: 0.0,
            maxMotorTorque: 400,
            enableLimit: true,
            lowerAngle: -0.3 * Math.PI, // -90 degrees
            upperAngle: 0 * Math.PI, // 45 degrees
            // lowerAngle: -20 * (Math.PI / 180.0),
            // upperAngle: 25 * (Math.PI / 180.0),
        }, this.circle2.b, this.flipper.b, this.circle2.b.m_sweep.c));

        this.jointRightPaddle = this.world.createJoint(planck.RevoluteJoint({
            enableMotor: true,
            motorSpeed: 0.0,
            maxMotorTorque: 400,
            enableLimit: true,
            lowerAngle: 0 * Math.PI,
            upperAngle: 0.3 * Math.PI
        }, this.circle3.b, this.flipper2.b, this.circle3.b.m_sweep.c));
    }

    createBumper() {
        this.bumperField = new Circle(this, this.halfWidth + (3 * dpr), this.halfHeight - (66 * dpr), "fieldBumper", (75 * dpr), false, true, false, "bumperField", BALL_GROUP, 0);
        this.fieldBonus = new ChainShape(this, this.halfWidth + (3 * dpr), this.halfHeight - (66 * dpr), "fieldBumper", this.shapes.fieldBonus.fixtures[0].vertices, false, true, false, 0.5, "fieldBonus", null, 0, 0);
        this.fieldBonus.b.setActive(false);
        this.fieldBonus.b.m_fixtureList.setRestitution(1);
        this.bumper100 = new Bumper(this, this.halfWidth + (45 * dpr), this.halfHeight - (65 * dpr), "bumper100", (25 * dpr), false, true, "bumper100", null, 1);
        this.bumper200 = new Bumper(this, this.halfWidth - (25 * dpr), this.halfHeight - (95 * dpr), "bumper200", (22 * dpr), false, true, "bumper200", null, 1);
        this.bumper500 = new Bumper(this, this.halfWidth - (28 * dpr), this.halfHeight - (30 * dpr), "bumper500", (20 * dpr), false, true, "bumper500", null, 1);

        //Puck
        this.puck1 = new ChainShape(this, this.halfWidth + (75 * dpr), this.halfHeight - (136 * dpr), "puck", this.shapes.puck.fixtures[0].vertices, true, true, false, 0.5, "puck1", null, 0, 0);
        this.puck2 = new ChainShape(this, this.halfWidth + (92 * dpr), this.halfHeight - (137 * dpr), "puck", this.shapes.puck.fixtures[0].vertices, true, true, false, 0.5, "puck2", null, 0, 0);
        this.puck3 = new ChainShape(this, this.halfWidth + (108 * dpr), this.halfHeight - (137 * dpr), "puck", this.shapes.puck.fixtures[0].vertices, true, true, false, 0.5, "puck3", null, 0, 0);
        // this.puck4 = new ChainShape(this, this.halfWidth + (145 * dpr), this.halfHeight - (117 * dpr), "puck", this.shapes.puck.fixtures[0].vertices, true, true, false, 0.5, "puck3", null, 0, 0);

        //Puck Handler
        // Temp just get body not important
        this.puckHandler = new Rectangle(this, this.halfWidth + (98 * dpr), this.halfHeight - (152 * dpr), "", (35 * dpr), (5 * dpr), 0.55, false, true, true, "puckHandler", null, 0, 0);
        this.puckHandler2 = new Rectangle(this, this.halfWidth + (98 * dpr), this.halfHeight - (152 * dpr), "", (35 * dpr), (5 * dpr), 0.55, false, true, true, "puckHandler2", 2, 0, 0);

        //PrismaticJoint Puck
        var worldAxis = planck.Vec2(1, -1.25);
        this.puckJoint1 = this.world.createJoint(planck.PrismaticJoint({
            lowerTranslation: -0.5,
            upperTranslation: 0,
            enableLimit: true,
            maxMotorForce: 5,
            motorSpeed: 100,
            enableMotor: true
        }, this.puck1.b, this.puckHandler.b, this.puck1.b.getPosition(), worldAxis));

        this.puckJoint2 = this.world.createJoint(planck.PrismaticJoint({
            lowerTranslation: -0.5,
            upperTranslation: 0,
            enableLimit: true,
            maxMotorForce: 5,
            motorSpeed: 100,
            enableMotor: true
        }, this.puck2.b, this.puckHandler.b, this.puck2.b.getPosition(), worldAxis));

        this.puckJoint3 = this.world.createJoint(planck.PrismaticJoint({
            lowerTranslation: -0.5,
            upperTranslation: 0,
            enableLimit: true,
            maxMotorForce: 5,
            motorSpeed: 100,
            enableMotor: true
        }, this.puck3.b, this.puckHandler.b, this.puck3.b.getPosition(), worldAxis));
    }

    createBonus() {
        this.enterBonus = new Circle(this, this.halfWidth + (95 * dpr), this.halfHeight + (50 * dpr), "hole", (8 * dpr), false, false, true, "enterBonus", null, 1);
        this.enterBonus2 = new Circle(this, this.halfWidth + (10 * dpr), this.halfHeight - (125 * dpr), "hole", (8 * dpr), false, false, true, "enterBonus2", null, 1);
        this.enterBonus2.setAlpha(0);
        this.bonus = this.add.image(this.halfWidth + (26 * dpr), this.halfHeight - (23 * dpr), "bonus").setScale(0.5);
        this.bonus.setAlpha(0);
    }

    createLed() {
        //Top LED
        this.topLedOne = new Circle(this, this.halfWidth - (30 * dpr), this.halfHeight - (155 * dpr), "topLedOff", (6 * dpr), false, false, true, "topLedOne", null, 0);
        this.topLedTwo = new Circle(this, this.halfWidth, this.halfHeight - (155 * dpr), "topLedOff", (6 * dpr), false, false, true, "topLedTwo", null, 0);
        this.topLedThree = new Circle(this, this.halfWidth + (30 * dpr), this.halfHeight - (155 * dpr), "topLedOff", (6 * dpr), false, false, true, "topLedThree", null, 0);

        // Top Info Led
        this.topLedOneInfo = new Circle(this, this.halfWidth - (30 * dpr), this.halfHeight - (175 * dpr), "top1", (8 * dpr), false, false, true, "topLedOneInfo", null, 0);
        this.topLedTwoInfo = new Circle(this, this.halfWidth, this.halfHeight - (175 * dpr), "top2", (8 * dpr), false, false, true, "topLedTwoInfo", null, 0);
        this.topLedThreeInfo = new Circle(this, this.halfWidth + (30 * dpr), this.halfHeight - (175 * dpr), "top3", (8 * dpr), false, false, true, "topLedThreeInfo", null, 0);

        // Left LED
        this.leftLedOne = new Circle(this, this.halfWidth - (98 * dpr), this.halfHeight + (50 * dpr), "topLedOff", (6 * dpr), false, false, true, "leftLedOne", null, 0);
        this.leftLedTwo = new Circle(this, this.halfWidth - (108 * dpr), this.halfHeight + (65 * dpr), "topLedOff", (6 * dpr), false, false, true, "leftLedTwo", null, 0);
        this.leftLedThree = new Circle(this, this.halfWidth - (118 * dpr), this.halfHeight + (80 * dpr), "topLedOff", (6 * dpr), false, false, true, "leftLedThree", null, 0);

        // Logo Led
        // this.logoLed = new ChainShape(this, this.halfWidth - (2 * dpr), this.halfHeight + (50 * dpr), "logo2", this.shapes.logoLed.fixtures[0].vertices, false, false, true, 0.5, "logoLed", 0);
        this.logoLed = new Rectangle(this, this.halfWidth - (2 * dpr), this.halfHeight + (50 * dpr), "logo2", (25 * dpr), (25 * dpr), 0.55, false, false, true, "logoLed", null, 0, 0);

        //Center Led
        this.centerLed = new Circle(this, this.halfWidth - (2 * dpr), this.halfHeight + (105 * dpr), "topLedOff", (6 * dpr), false, false, true, "centerLed", null, 0);

        // Arrow Led to Bridge
        this.arrowLedBridge1 = new ChainShape(this, this.halfWidth + (79 * dpr), this.halfHeight + (11.5 * dpr), "arrowLedBridge1Off", this.shapes.arrowLedBridge1.fixtures[0].vertices, false, false, true, 0.55, "arrowLedBridge1", null, 0, 0);
        this.arrowLedBridge2 = new ChainShape(this, this.halfWidth + (85 * dpr), this.halfHeight + (1 * dpr), "arrowLedBridge2Off", this.shapes.arrowLedBridge2.fixtures[0].vertices, false, false, true, 0.55, "arrowLedBridge2", null, 0, 0);
        this.arrowLedBridge3 = new ChainShape(this, this.halfWidth + (90.5 * dpr), this.halfHeight - (7.5 * dpr), "arrowLedBridge3Off", this.shapes.arrowLedBridge3.fixtures[0].vertices, false, false, true, 0.55, "arrowLedBridge3", null, 0, 0);
        this.arrowLedBridge4 = new ChainShape(this, this.halfWidth + (95.5 * dpr), this.halfHeight - (16 * dpr), "arrowLedBridge4Off", this.shapes.arrowLedBridge4.fixtures[0].vertices, false, false, true, 0.55, "arrowLedBridge4", null, 0, 0);
        this.arrowLedBridge5 = new ChainShape(this, this.halfWidth + (100 * dpr), this.halfHeight - (24 * dpr), "arrowLedBridge5Off", this.shapes.arrowLedBridge5.fixtures[0].vertices, false, false, true, 0.55, "arrowLedBridge5", null, 0, 0);

        // Puck Led
        this.puckLed1 = this.add.sprite(this.halfWidth + (80 * dpr), this.halfHeight - (142 * dpr), 'puckLedOff', null, {
            isStatic: true,
            isSensor: true,
        })
            .setScale(0.55)
            .setDepth(2);
        this.puckLed2 = this.add.sprite(this.halfWidth + (98 * dpr), this.halfHeight - (145 * dpr), 'puckLedOff', null, {
            isStatic: true,
            isSensor: true,
        })
            .setScale(0.55)
            .setDepth(2);
        this.puckLed3 = this.add.sprite(this.halfWidth + (115 * dpr), this.halfHeight - (145 * dpr), 'puckLedOff', null, {
            isStatic: true,
            isSensor: true,
        })
            .setScale(0.55)
            .setDepth(2);
    }

    createTrigger() {
        this.circleTriggerClose = new Circle(this, this.halfWidth + (110 * dpr), this.halfHeight - (220 * dpr), "", (12 * dpr), false, false, true, "triggerClose");
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

        // Testing with mouse clik for ball
        let world = this;
        let ball = this.ball;
        let bodyA = this.ball.b;
        let bodyB = this.ball.b;
        let target = this.ball.b.getWorldCenter();
        this.input.on('pointerdown', function (pointer) {

            let dummyBody = world.world.createBody();
            // ball.ball2Bridge(planck.Vec2(pointer.x / world.scaleFactor, pointer.y / world.scaleFactor));
            joint = world.world.createJoint(planck.MouseJoint({
                maxForce: 1000,
            }, dummyBody, bodyA, planck.Vec2.clone(planck.Vec2(pointer.x / world.scaleFactor, pointer.y / world.scaleFactor))));
            // joint = world.world.createJoint(planck.PulleyJoint({
            //     localAnchorB: planck.Vec2(pointer.x / world.scaleFactor, pointer.y / world.scaleFactor),
            // }));

            console.log(dummyBody.getPosition());
            // console.log(`${pointer.x}, ${pointer.y}`);
        }, this);

        this.input.on('pointerup', function (pointer) {
            world.world.destroyJoint(joint);
        }, this);
    }

    createContactEvents() {
        let ww = this;
        let ball = this.ball;
        let stopperLeft = this.stopperLeft;
        let stopperRight = this.stopperRight;
        let closeLeft = this.closeLeft;
        let closeRight = this.closeRight;
        // console.log(this.circle.b);
        ww.world.on("begin-contact", function (contact) {
            let bodyA = contact.m_fixtureA;
            let bodyB = contact.m_fixtureB;
            let dataBodyA = bodyA.m_userData;
            let dataBodyB = bodyB.m_userData;
            if (dataBodyA != null && dataBodyB != null) {
                let labelBodyA = bodyA.m_userData.label;
                let labelBodyB = bodyB.m_userData.label;

                // Ball when falling down (game over destroy ball)
                if (labelBodyA == "topWall" && labelBodyB == "ballss") {
                    // ww.ball.destroy();
                    setTimeout(function () {
                        let x = (ww.halfWidth / ww.scaleFactor) + (138 * dpr / ww.scaleFactor);
                        let y = ww.halfHeight / ww.scaleFactor;
                        ball.ball2Bridge(planck.Vec2(x, y));
                        ww.closeBegin.b.setActive(false);
                        ww.closeBegin.setAlpha(0);
                    }, 1);
                }
                // if (labelBodyA == "wall4" && labelBodyB == "ballss") {
                //     // console.log(labelBodyA);
                // }

                // balls contact with bumper for getting score
                if (labelBodyA == "bumper100" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        bufferScore += 100
                        bodyA.setUserData({ label: labelBodyA, isScore: false });
                    }
                }
                if (labelBodyA == "bumper200" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        bufferScore += 200
                        bodyA.setUserData({ label: labelBodyA, isScore: false });
                    }
                }
                if (labelBodyA == "bumper500" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        bufferScore += 500;
                        bodyA.setUserData({ label: labelBodyA, isScore: false });
                    }
                }

                // Ball contact with stopper and close the field
                if (labelBodyA == "stopperLeft" && labelBodyB == "ballss") {
                    let scale = ww.scaleFactor;
                    let pos = ww.stopperLeft.b.getPosition();
                    let x = pos.x;
                    let y = pos.y - (15 * dpr / scale);
                    let position = planck.Vec2(x, y);
                    if (dataBodyA.isScore) {
                        bufferScore += 500;
                        bodyA.setUserData({ label: labelBodyA, isScore: false });
                    }

                    setTimeout(function () {
                        ball.ball2Bridge(position);
                        // ball.stopper();
                        ball.b.setActive(false);
                    }, 1);
                    setTimeout(function () {
                        ball.b.setActive(true);
                        ball.launchBall();
                    }, 2500);
                    setTimeout(function () {
                        ww.closeLeft.b.setActive(true);
                        ww.closeLeft.setAlpha(1);
                        // ww.createLeftStop();
                    }, 3000);
                }
                if (labelBodyA == "stopperRight" && labelBodyB == "ballss") {
                    let scale = ww.scaleFactor;
                    let pos = ww.stopperRight.b.getPosition();
                    let x = pos.x;
                    let y = pos.y - (15 * dpr / scale);
                    let position = planck.Vec2(x, y);
                    if (dataBodyA.isScore) {
                        bufferScore += 500;
                        bodyA.setUserData({ label: labelBodyA, isScore: false });
                    }

                    setTimeout(function () {
                        ball.ball2Bridge(position);
                        // ball.stopper();
                        ball.b.setActive(false);
                    }, 1);
                    setTimeout(function () {
                        ball.b.setActive(true);
                        ball.launchBall();
                    }, 2500);
                    setTimeout(function () {
                        ww.closeRight.b.setActive(true);
                        ww.closeRight.setAlpha(1);
                        // ww.createRigthStop();
                    }, 3000);
                }
                if (labelBodyA == "ballss" && labelBodyB == "triggerClose") {
                    console.log("boom");
                    setTimeout(function () {
                        ww.closeBegin.b.setActive(true);
                        ww.closeBegin.setAlpha(1);
                        // ww.createBeginStop();
                    }, 1);
                } else if (labelBodyA == "triggerClose" && labelBodyB == "ballss") {
                    console.log("boom");
                    setTimeout(function () {
                        ww.closeBegin.b.setActive(true);
                        // ww.createBeginStop();
                    }, 1);
                }

                // Ball contact with bridge entrance and exit bridge
                if (labelBodyA == "entranceBridge" && labelBodyB == "ballss") {
                    setTimeout(function () {
                        ww.exitBridge.b.setActive(true);
                        let scale = ww.scaleFactor;
                        let pos = ww.entrance2Bridge.b.getPosition();
                        let x = pos.x - (30 * dpr / scale);
                        let y = pos.y - (30 * dpr / scale);
                        let position = planck.Vec2(x, y);
                        ball.ball2Bridge(position);
                        ball.b.setMassData({
                            mass: 0.5,
                            center: planck.Vec2(),
                            I: 1  //make body cant rotate
                        });
                        ball.b.applyLinearImpulse(planck.Vec2(0, -6.5), planck.Vec2(0, -6.5), true);
                        ball.setDepth(3);
                        // ww.bridge.setDepth(0);
                        // ww.exitBridge.setDepth(0);
                        ww.bridge.b.m_fixtureList.setSensor(false);
                        ww.wall3.b.m_fixtureList.setSensor(true);
                        ww.wall2.b.m_fixtureList.setSensor(true);
                    }, 1);
                }
                if (labelBodyA == "ballss" && labelBodyB == "exitBridge") {
                    setTimeout(function () {
                        ball.stopper();
                    }, 50);

                    setTimeout(function () {
                        ball.awake();
                        ball.b.setMassData({
                            mass: 0.5,
                            center: planck.Vec2(),
                            I: 0  //make body cant rotate
                        });
                        ww.exitBridge.b.setActive(false);
                        ball.setDepth(1);
                        // ww.bridge.setDepth(2);
                        // ww.exitBridge.setDepth(2);
                        ww.bridge.b.m_fixtureList.setSensor(true);
                        ww.wall3.b.m_fixtureList.setSensor(false);
                        ww.wall2.b.m_fixtureList.setSensor(false);
                    }, 500);
                }

                // Led top contact with ball
                if (labelBodyA == "topLedOne" && labelBodyB == "ballss") {
                    if (!topLedOne) {
                        topLedOne = true;
                        ww.topLedOne.setTexture("topLedOn");
                    } else {
                        topLedOne = false;
                        ww.topLedOne.setTexture("topLedOff");
                    }
                    ww.checkTopLed();
                }
                if (labelBodyA == "topLedTwo" && labelBodyB == "ballss") {
                    if (!topLedTwo) {
                        topLedTwo = true;
                        ww.topLedTwo.setTexture("topLedOn");
                    } else {
                        topLedTwo = false;
                        ww.topLedTwo.setTexture("topLedOff");
                    }
                    ww.checkTopLed();
                }
                if (labelBodyA == "topLedThree" && labelBodyB == "ballss") {
                    if (!topLedThree) {
                        topLedThree = true;
                        ww.topLedThree.setTexture("topLedOn");
                    } else {
                        topLedThree = false;
                        ww.topLedThree.setTexture("topLedOff");
                    }
                    ww.checkTopLed();
                }

                // Led left contact with ball
                if (labelBodyA == "leftLedOne" && labelBodyB == "ballss") {
                    if (!leftLedOne) {
                        leftLedOne = true;
                        ww.leftLedOne.setTexture("topLedOn");
                    } else {
                        leftLedOne = false;
                        ww.leftLedOne.setTexture("topLedOff");
                    }
                    ww.checkTopLed();
                }
                if (labelBodyA == "leftLedTwo" && labelBodyB == "ballss") {
                    if (!leftLedTwo) {
                        leftLedTwo = true;
                        ww.leftLedTwo.setTexture("topLedOn");
                    } else {
                        leftLedTwo = false;
                        ww.leftLedTwo.setTexture("topLedOff");
                    }
                    ww.checkTopLed();
                }
                if (labelBodyA == "leftLedThree" && labelBodyB == "ballss") {
                    if (!leftLedThree) {
                        leftLedThree = true;
                        ww.leftLedThree.setTexture("topLedOn");
                    } else {
                        leftLedThree = false;
                        ww.leftLedThree.setTexture("topLedOff");
                    }
                    ww.checkTopLed();
                }

                // Led Logo & Led center contact with ball
                if (labelBodyA == "logoLed" && labelBodyB == "ballss") {
                    if (!logoLed) {
                        logoLed = true;
                        ww.logoLed.setTexture("logo");
                    } else {
                        logoLed = false;
                        ww.logoLed.setTexture("logo2");
                    }
                    ww.checkTopLed();
                }
                if (labelBodyA == "centerLed" && labelBodyB == "ballss") {
                    if (!centerLed) {
                        centerLed = true;
                        ww.centerLed.setTexture("topLedOn");
                    } else {
                        centerLed = false;
                        ww.centerLed.setTexture("topLedOff");
                    }
                    ww.checkTopLed();
                }

                //Enter Bonus (contact ball with enterBonus)
                if (labelBodyA == "enterBonus" && labelBodyB == "ballss") {
                    let getpos = ww.enterBonus2.b.getPosition();
                    let x = getpos.x;
                    let y = getpos.y;
                    let pos = planck.Vec2(x, y);

                    setTimeout(function () {
                        ball.ball2Bridge(pos);
                        // ball.stopper();
                    }, 1);

                    ww.bonus.setAlpha(1);
                    ww.enterBonus2.setAlpha(1);
                    ww.fieldBonus.setAlpha(0);
                    ww.fieldBonus.b.setActive(true);

                    setTimeout(function () {
                        ww.fieldBonus.b.setActive(false);
                        ww.fieldBonus.b.m_fixtureList.setRestitution(1);
                        ww.enterBonus2.setAlpha(0);
                        ww.fieldBonus.setAlpha(1);
                        ww.bonus.setAlpha(0);
                    }, 5000);
                }

                //Arrow Led Bridge
                if (labelBodyA == "arrowLedBridge1" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        ww.arrowLedBridge1.setTexture("arrowLedBridge2On");
                        bodyA.setUserData({ label: labelBodyA, isScore: false });
                    }
                }
                if (labelBodyA == "arrowLedBridge2" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        ww.arrowLedBridge2.setTexture("arrowLedBridge2On");
                        bodyA.setUserData({ label: labelBodyA, isScore: false });
                    }
                }
                if (labelBodyA == "arrowLedBridge3" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        ww.arrowLedBridge3.setTexture("arrowLedBridge3On");
                        bodyA.setUserData({ label: labelBodyA, isScore: false });
                    }
                }
                if (labelBodyA == "arrowLedBridge4" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        ww.arrowLedBridge4.setTexture("arrowLedBridge4On");
                        bodyA.setUserData({ label: labelBodyA, isScore: false });
                    }
                }
                if (labelBodyA == "arrowLedBridge5" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        ww.arrowLedBridge5.setTexture("arrowLedBridge5On");
                        bodyA.setUserData({ label: labelBodyA, isScore: false });
                        ww.checkTopLed();
                    }
                }

                // Puck contact with puckHandler2
                if (labelBodyA == "puck1" && labelBodyB == "puckHandler2") {
                    if (dataBodyA.isScore) {
                        ww.puckLed1.setTexture("puckLedOn");
                        bodyA.setUserData({ label: labelBodyA, isScore: false });
                    }
                }
                if (labelBodyA == "puck2" && labelBodyB == "puckHandler2") {
                    if (dataBodyA.isScore) {
                        ww.puckLed2.setTexture("puckLedOn");
                        bodyA.setUserData({ label: labelBodyA, isScore: false });
                    }
                }
                if (labelBodyA == "puck3" && labelBodyB == "puckHandler2") {
                    if (dataBodyA.isScore) {
                        ww.puckLed3.setTexture("puckLedOn");
                        setTimeout(function () {
                            bodyA.setUserData({ label: labelBodyA, isScore: false });
                            console.log(bodyA);
                        }, 1);
                    }
                }
            }
        });

        ww.world.on("end-contact", function (contact) {
            let bodyA = contact.m_fixtureA;
            let bodyB = contact.m_fixtureB;
            let dataBodyA = bodyA.m_userData;
            let dataBodyB = bodyB.m_userData;
            if (dataBodyA != null && dataBodyB != null) {
                let labelBodyA = bodyA.m_userData.label;
                let labelBodyB = bodyB.m_userData.label;

                // balls contact with bumper for getting score
                if (labelBodyA == "bumper100" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({ label: labelBodyA, isScore: true });
                    }
                }
                if (labelBodyA == "bumper200" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({ label: labelBodyA, isScore: true });
                    }
                }
                if (labelBodyA == "bumper500" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({ label: labelBodyA, isScore: true });
                    }
                }

                // Ball contact with stopper and close the field
                if (labelBodyA == "stopperLeft" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({ label: labelBodyA, isScore: true });
                    }
                }
                if (labelBodyA == "stopperRight" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({ label: labelBodyA, isScore: true });
                    }
                }

                // Puck contact with puckHandler2
                if (labelBodyA == "puck1" && labelBodyB == "puckHandler2") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({ label: labelBodyA, isScore: true });
                        ww.checkTopLed();
                    }
                }
                if (labelBodyA == "puck2" && labelBodyB == "puckHandler2") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({ label: labelBodyA, isScore: true });
                        ww.checkTopLed();
                    }
                }
                if (labelBodyA == "puck3" && labelBodyB == "puckHandler2") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({ label: labelBodyA, isScore: true });
                        ww.checkTopLed();
                    }
                }
            }
        });
    }

    createBridge() {
        this.entranceBridge = new ChainShape(this, this.halfWidth + (122 * dpr), this.halfHeight - (57 * dpr), "entranceBridge", this.shapes.entranceBridge.fixtures[0].vertices, false, false, true, 0.7, "entranceBridge", null, 0, 2);
        this.bridge = new ChainShape(this, this.halfWidth - (18 * dpr), this.halfHeight - (80 * dpr), "bridge", this.shapes.bridge.fixtures[0].vertices, false, false, true, 0.5, "bridge", null, 0, 2);
        this.entrance2Bridge = new ChainShape(this, this.halfWidth + (92 * dpr), this.halfHeight - (163 * dpr), "entranceBridge", this.shapes.entranceBridge.fixtures[0].vertices, false, false, true, 0.75, "entrance2Bridge", null, 0, 2);
        this.entrance2Bridge.b.setAngle(1.6);
        this.exitBridge = new Circle(this, this.halfWidth - (70 * dpr), this.halfHeight + (40 * dpr), "exitBridge", (8 * dpr), false, false, true, "exitBridge", null, 2);
        this.exitBridge.b.setActive(false);
        // this.ball.setDepth(1);
        // .m_fixtureList.setSensor(true);
    }

    createBall() {
        // create ball
        this.ball = new Circle(this, this.halfWidth + (138 * dpr), this.halfHeight, "ball", 7 * dpr, true, true, false, "ballss", BALL_GROUP, 1);
        this.ball1 = new Circle(this, this.halfWidth + (145 * dpr), this.halfHeight + (278 * dpr), "ball", 7 * dpr, false, false, false, "ballss1", null, 1);
        this.ball2 = new Circle(this, this.halfWidth + (145 * dpr), this.halfHeight + (260 * dpr), "ball", 7 * dpr, false, false, false, "ballss2", null, 1);
    }

    checkTopLed() {
        let ledOne = this.topLedOne;
        let ledTwo = this.topLedTwo;
        let ledThree = this.topLedThree;
        let leftLed1 = this.leftLedOne;
        let leftLed2 = this.leftLedTwo;
        let leftLed3 = this.leftLedThree;
        let logoLed1 = this.logoLed;
        let centerLed1 = this.centerLed;
        if (topLedOne && topLedTwo && topLedThree) {
            topLedOne = false;
            topLedTwo = false;
            topLedThree = false;
            setTimeout(function () {
                ledOne.setTexture("topLedOff");
                bufferScore += 5000;
            }, 100);
            setTimeout(function () {
                ledTwo.setTexture("topLedOff");
            }, 300);
            setTimeout(function () {
                ledThree.setTexture("topLedOff");
            }, 600);
        }

        if (leftLedOne && leftLedTwo && leftLedThree) {
            leftLedOne = false;
            leftLedTwo = false;
            leftLedThree = false;
            setTimeout(function () {
                leftLed1.setTexture("topLedOff");
                bufferScore += 1000;
            }, 100);
            setTimeout(function () {
                leftLed2.setTexture("topLedOff");
            }, 300);
            setTimeout(function () {
                leftLed3.setTexture("topLedOff");
            }, 600);
        }

        // if (logoLed) {
        //     logoLed = false;
        //     setTimeout(function () {
        //         logoLed1.setTexture("logo2");
        //     }, 100);
        // }
        // if (centerLed) {
        //     centerLed = false;
        //     setTimeout(function () {
        //         logoLed1.setTexture("topLedOff");
        //     }, 100);
        // }
    }

    update() {
        let spring = this.spring;
        let lengthSpring = -(this.triggerSpring.m_s1);
        let result = (((lengthSpring * 100) / 100) / 10) - 0.09;
        // console.log(`result : ${result}`);
        if (btnSpaceHold) {
            if (spring.scaleY > 0) {
                spring.scaleY = result;
                // console.log(`down : ${spring.scaleY}`);
            }
        } else {
            if (result > 0) {
                spring.scaleY = result;
            }
        }

        if (bufferScore > 0 && bufferScore < 1000) {
            currentScore += 100;
            bufferScore -= 100;
        } else if (bufferScore > 1000) {
            currentScore += 1000;
            bufferScore -= 1000;
        }

        // console.log(currentScore);
        let scoreFormated = String(currentScore).replace(/(.)(?=(\d{3})+$)/g, '$1,')
        this.textScore.setText(scoreFormated);
        // advance the simulation by 1/20 seconds
        this.world.step(1 / 16, 3, 3);
        // this.world.step(1 / 16, 10, 8);
        // console.log(this.game.loop.delta);
        // console.log(this.game.loop.actualFps);

        // crearForces  method should be added at the end on each step
        this.world.clearForces();

        //for testing purpose
        if (joint != null) {
            var pointer = this.input.activePointer;
            joint.setTarget(planck.Vec2(pointer.x / this.scaleFactor, pointer.y / this.scaleFactor));
        }
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
    constructor(scene, x, y, key, radius, isDynamic, isFixed, isSensor, label, groupIndex, depth) {
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
        this.depth = depth;
        this.scene.add.existing(this);

        this.radius = radius;

        this.x = x;
        this.y = y;

        // Body
        this.b = scene.world.createBody({
            userData: { label: label },
            bullet: true,
        });
        if (this.isDynamic) {
            this.b.setDynamic();
        }
        // console.log(scene.world);
        // const init = img => {
        this.b.createFixture(planck.Circle(radius / 30), {
            friction: 0.5,
            restitution: 0,
            density: 7,
            isSensor: isSensor,
            userData: { label: label, isScore: true },
            filterGroupIndex: groupIndex,
        });
        // console.log(this.b);

        this.b.setPosition(
            planck.Vec2(this.x / 30, this.y / 30)
        );

        this.b.setMassData({
            mass: 0.5,
            center: planck.Vec2(),
            I: isFixed ? 0 : 1  //make body cant rotate
        });
    }

    ball2Bridge(pos) {
        this.b.setPosition(pos);
    }

    stopper() {
        let ball = this.b;
        // do not change world immediately
        setTimeout(function () {
            ball.setAwake(false);
        }, 1);
        console.log(ball.isSleepingAllowed());
    }

    awake() {
        let ball = this.b;
        // do not change world immediately
        setTimeout(function () {
            ball.setAwake(true);
        }, 1);
        console.log(ball.isSleepingAllowed());
    }

    launchBall() {
        let ball = this.b;
        // do not change world immediately
        setTimeout(function () {
            ball.setAwake(true);
            // ball.setTransform(planck.Vec2(0, 100), 0);
            // ball.setFixedRotation(true);
            // ball.applyForce(planck.Vec2(0, -6.5), planck.Vec2(0, -6.5));
            ball.applyLinearImpulse(planck.Vec2(0, -6.5), planck.Vec2(0, -6.5), true);
        }, 1);

        // setTimeout(function () {
        //     ball.setFixedRotation(false);
        // }, 2000);
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
    constructor(scene, x, y, key, radius, isDynamic, isFixed, label, groupIndex, depth) {
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
        this.depth = depth;
        this.scene.add.existing(this);

        this.radius = radius;

        this.x = x;
        this.y = y;

        // Body
        this.b = scene.world.createBody({
            userData: { label: label },
            bullet: true
        });
        if (this.isDynamic) {
            this.b.setDynamic();
        }
        // console.log(scene.world);
        // const init = img => {
        this.b.createFixture(planck.Circle(radius / 30), {
            friction: 0.5,
            restitution: 1.5,
            density: 1,
            userData: {
                label: label,
                isScore: true
            },
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
    constructor(scene, x, y, key, width, height, scale, isDynamic, isFixed, isSensor, label, groupIndex, restitution, depth) {
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
            // this.setTexture(graphics);
        } else {
            // this.setTexture(graphics);
        }
        this.displayWidth = width * 2;
        this.displayHeight = height * 2;
        this.scale = scale;
        this.scene = scene;
        this.isDynamic = isDynamic;
        this.isFixed = isFixed;
        this.depth = depth;
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
            restitution: restitution,
            density: 1,
            isSensor: isSensor,
            userData: { label: label, isScore: true },
            filterGroupIndex: groupIndex,
        });

        this.b.setPosition(
            planck.Vec2(this.x / 30, this.y / 30)
        );

        this.b.setMassData({
            mass: 3,//3,
            center: planck.Vec2(),
            I: isFixed ? 0 : 1
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
    constructor(scene, x, y, x2, y2, isDynamic, label, groupIndex, depth) {
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
        this.depth = depth;
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
            userData: { label: label, isScore: true },
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
    constructor(scene, x, y, key, points, isDynamic, isFixed, scale, label, groupIndex, depth) {
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
        this.depth = depth;
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
            restitution: 0,
            density: 10,
            userData: { label: label, isScore: true },
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
    constructor(scene, x, y, key, points, isDynamic, isFixed, isSensor, scale, label, groupIndex, restitution, depth) {
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
        this.depth = depth;
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
            restitution: restitution,//0.5,
            density: 1,
            isSensor: isSensor,
            userData: { label: label, isScore: true },
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

class OtherBumper extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, key, points, isDynamic, isFixed, scale, label, groupIndex, restitution, depth) {
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
        this.depth = depth;
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
            userData: { label: label, isScore: true },
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