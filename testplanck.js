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

    preload() {
        dpr = window.devicePixelRatio;
        this.gameWidth = this.sys.game.scale.width
        this.gameHeight = this.sys.game.scale.height
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
        this.load.image("bgPinball", "bg_pinball.png");
        this.load.image("fieldBumper", "field_bumper.png");
        this.load.json("shapes", "shapes.json");
    }

    // scaling sprite atau lainnya dengan mempertahankan ratio pixel
    scaleWithRatioPixel(offset) {
        return ((1 * window.devicePixelRatio) / 4) - offset;
    }

    init() {
        this.width = 640;
        this.height = 480;
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
        this.scaleFactor = 30;
        this.bodies = [];
        this.gravity = 0; // 3 is normal
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
        this.createPinball();
        // this.btnStart.on("pointerdown", this.createPinball, this);
    }

    createPinball() {
        let PX2M = 0.01;
        let x = this.gameWidth / 2;
        let y = this.gameHeight / 2;
        // test ball using planck-js
        // Init World
        var ww = this.world = planck.World(planck.Vec2(0, 3));
        // this.balls = this.world.createBody({
        //     position: planck.Vec2(x, y),
        //     type: 'dynamic',
        //     bullet: true,
        // });
        // this.balls.createFixture(planck.Circle(0.2), 1.0);
        // const positionMeter = this.balls.getPosition();
        // const positionPixel = {
        //     x: (1 / PX2M) * positionMeter.x,
        //     y: (1 / PX2M) * positionMeter.y,
        // };

        // const canvas = {
        //     width: positionPixel.x,
        //     height: positionPixel.y,
        // };

        var shapes = this.cache.json.get('shapes');

        const {
            points: skullPoints
        } = getPoints(shapes, "toggle_left");

        new Edge(this, 0, this.gameHeight - 40, this.gameWidth, this.gameHeight - 40);
        let leftWall = new Edge(this, (this.gameWidth / 2) - 100, 0, (this.gameWidth / 2) - 100, this.gameHeight);
        let rightWall = new Edge(this, (this.gameWidth / 2) + 100, 0, (this.gameWidth / 2) + 100, this.gameHeight);
        let circle = new Circle(this, x, y, 50, true, false);
        let circle2 = new Circle(this, x / 2, y / 2, 25, true, false);
        let flipper = new Poly(this, x, y / 2, "toggleLeft", skullPoints, true, false);
        // let flipper = new Flipper(this, x - 50, y + 100, leftWall.b, rightWall.b, canvas);

        // keyboard paddle events
        this.btnSpace = this.input.keyboard.addKey("SPACE");
        this.btnSpace.on("down", function () {
            console.log("SPACE BTN DOWN");
        }, this);
        this.btnSpace.on("up", function () {
            console.log("SPACE BTN UP");
        }, this);

        this.leftBtn = this.input.keyboard.addKey("LEFT");
        this.leftBtn.on("down", function () {
            flipper.rotateLeft();
            console.log("LEFT BTN DOWN");
        }, this);
        this.leftBtn.on("up", function () {
            flipper.resetLeft();
            console.log("LEFT BTN UP");
        }, this);

        this.rightBtn = this.input.keyboard.addKey("RIGHT");
        this.rightBtn.on("down", function () {
            isRightPaddleUp = true;
        }, this);
        this.rightBtn.on("up", function () {
            isRightPaddleUp = false;
        }, this);
        var testPhaser = this;
        // planck.testbed(function (testbed) {
        //     var pl = planck,
        //         Vec2 = pl.Vec2;
        //     var world = new pl.World(Vec2(0, -10));

        //     // var ground = world.createBody();

        //     // var groundFD = {
        //     //     filterCategoryBits: 2,
        //     //     filterMaskBits: 0xFFFF,
        //     //     filterGroupIndex: 0,
        //     // };
        //     // ground.createFixture(pl.Edge(Vec2(-40.0, 0.0), Vec2(40.0, 0.0)), groundFD);

        //     // var rotator = world.createDynamicBody(Vec2(-10.0, 20.0));
        //     // rotator.createFixture(pl.Circle(2.5), 5.0);

        //     // var w = 100.0;
        //     // rotator.setAngularVelocity(w);
        //     // rotator.setLinearVelocity(Vec2(-8.0 * w, 0.0));

        //     // var joint = world.createJoint(pl.RevoluteJoint({
        //     //     // motorSpeed: 1.0 * Math.PI,
        //     //     // maxMotorTorque: 10000.0,
        //     //     // enableMotor: true,
        //     //     // lowerAngle: -0.25 * Math.PI,
        //     //     // upperAngle: 0.5 * Math.PI,
        //     //     // enableLimit: false,
        //     //     // collideConnected: true,
        //     //     enableMotor: true,
        //     //     motorSpeed: 0.0,
        //     //     maxMotorTorque: 10,
        //     //     enableLimit: false,
        //     //     // lowerAngle: -0.5 * Math.PI, // -90 degrees
        //     //     // upperAngle: 0.25 * Math.PI, // 45 degrees
        //     //     lowerAngle: -20 * (Math.PI / 180.0),
        //     //     upperAngle: 5 * (Math.PI / 180.0),
        //     // }, ground, rotator, Vec2(-10.0, 12.0)));

        //     var ball = world.createDynamicBody(Vec2(15.0, 30.0));
        //     ball.createFixture(pl.Circle(1.0), {
        //         density: 1.0,
        //         // filterMaskBits: 1,
        //     });
        //     ball.setMassData({
        //         mass: 0,
        //         center: planck.Vec2(),
        //         I: 1
        //     });
        //     // var platform = world.createBody({
        //     //     position: Vec2(20.0, 10.0),
        //     //     type: 'dynamic',
        //     //     bullet: true,
        //     // });
        //     // platform.createFixture(pl.Box(10.0, 0.2, Vec2(-10.0, 0.0), 0.0), 2.0);

        //     // world.createJoint(pl.RevoluteJoint({
        //     //     lowerAngle: -0.25 * Math.PI,
        //     //     upperAngle: 0.0 * Math.PI,
        //     //     enableLimit: true,
        //     // }, ground, platform, Vec2(20.0, 10.0)));

        //     // // Tests mass computation of a small object far from the origin
        //     // var triangle = world.createDynamicBody();

        //     // triangle.createFixture(pl.Polygon([
        //     //     Vec2(17.63, 36.31),
        //     //     Vec2(17.52, 36.69),
        //     //     Vec2(17.19, 36.36)
        //     // ]), 1); // assertion hits inside here

        //     // testbed.keydown = function (code, char) {
        //     //     switch (char) {
        //     //         case 'Z':
        //     //             joint.enableLimit(!joint.isLimitEnabled());
        //     //             break;

        //     //         case 'X':
        //     //             joint.enableMotor(!joint.isMotorEnabled());
        //     //             break;
        //     //     }
        //     // };

        //     // testbed.step = function (settings) {
        //     //     // if (stepCount++ == 360) {
        //     //     //   ball.setTransform(Vec2(0.0, 0.5), 0.0);
        //     //     // }

        //     //     testbed.status('Motor Torque', joint.getMotorTorque(testbed.hz));
        //     //     // testbed.status('Motor Force', joint.getMaxForce());
        //     // };

        //     // testbed.info('Z: Limits, X: Motor');



        //     let bd1 = world.createBody({
        //         type: "static"
        //     });
        //     bd1.createFixture(
        //         planck.Polygon(
        //             // [planck.Vec2(0, 200 / 30), planck.Vec2(280 / 30, 200 / 30), planck.Vec2(280 / 30, 400 / 30), planck.Vec2(0, 400 / 30)]
        //             // [planck.Vec2(0, 0), planck.Vec2(280 / 30, 0), planck.Vec2(280 / 30, 200 / 30), planck.Vec2(0, 200 / 30)]
        //             [planck.Vec2(-(140 / 30), -(100 / 30)), planck.Vec2(140 / 30, -(100 / 30)), planck.Vec2(140 / 30, 100 / 30), planck.Vec2(-(140 / 30), 100 / 30)]
        //         ), {
        //             userData: "shape1",
        //             friction: 0.1,
        //             restitution: 0.5,
        //             density: 1
        //         }
        //     );
        //     bd1.setPosition(
        //         planck.Vec2((x / 30), (y / 30)));
        //     bd1.setMassData({
        //         mass: 1,
        //         center: planck.Vec2(),
        //         I: 1
        //     });
        //     console.log(bd1.m_sweep.c);

        //     let circleCoordinate = world.createBody({
        //         type: "static"
        //     });
        //     circleCoordinate.createFixture(planck.Circle(planck.Vec2((x / 30), (y / 30) + 45)), 14);

        //     let bd2 = world.createBody({
        //         type: "dynamic"
        //     });
        //     bd2.createFixture(
        //         planck.Polygon(
        //             [planck.Vec2(0, 0), planck.Vec2(280 / 30, 0), planck.Vec2(0, 200 / 30)]
        //             // [planck.Vec2(0, 50 / 30), planck.Vec2(280 / 30, 50 / 30), planck.Vec2(350 / 30, 50 / 30), planck.Vec2(350 / 30, 100 / 30), planck.Vec2(550 / 30, 50 / 30), planck.Vec2(0, 100 / 30)]
        //         ), {
        //             userData: "shape1",
        //             friction: 0.1,
        //             restitution: 0.5,
        //             density: 1
        //         }
        //     );
        //     bd2.setPosition(
        //         planck.Vec2(bd1.getPosition().x + 1, bd1.getPosition().y));
        //     bd2.setMassData({
        //         mass: 1,
        //         center: planck.Vec2(),
        //         I: 1
        //     });
        //     bd2.setAngle(25);

        //     let bd3 = world.createBody({
        //         type: "dynamic"
        //     });
        //     bd3.createFixture(
        //         planck.Polygon(
        //             // [planck.Vec2(280 / 30, 200 / 30), planck.Vec2(0, 200 / 30), planck.Vec2(280 / 30, 400 / 30)]
        //             [planck.Vec2(280 / 30, 0), planck.Vec2(0, 0), planck.Vec2(280 / 30, 200 / 30)]
        //         ), {
        //             userData: "shape2",
        //             friction: 0.1,
        //             restitution: 0.5,
        //             density: 1
        //         }
        //     );
        //     bd3.setPosition(
        //         planck.Vec2(bd1.getPosition().x - 10, bd1.getPosition().y));
        //     bd3.setMassData({
        //         mass: 1,
        //         center: planck.Vec2(),
        //         I: 1
        //     });

        //     let rj = planck.RevoluteJoint({
        //         enableMotor: true,
        //         motorSpeed: 0.0,
        //         maxMotorTorque: 20000,
        //         enableLimit: true,
        //         lowerAngle: 0 * Math.PI, // -90 degrees
        //         upperAngle: 0.25 * Math.PI, // 45 degrees
        //         // lowerAngle: -20 * (Math.PI / 180.0),
        //         // upperAngle: 25 * (Math.PI / 180.0),
        //     }, bd1, bd2, bd1.m_sweep.c);

        //     let rj2 = planck.RevoluteJoint({
        //         enableMotor: true,
        //         motorSpeed: 0.0,
        //         maxMotorTorque: 20000,
        //         enableLimit: true,
        //         lowerAngle: -0.25 * Math.PI, // -90 degrees
        //         upperAngle: 0 * Math.PI, // 45 degrees
        //         // lowerAngle: -25 * (Math.PI / 180.0),
        //         // upperAngle: 20 * (Math.PI / 180.0),
        //     }, bd1, bd3, bd1.m_sweep.c);

        //     world.createJoint(rj);
        //     world.createJoint(rj2);

        //     testPhaser.leftBtn = testPhaser.input.keyboard.addKey("LEFT");
        //     testPhaser.leftBtn.on("down", function () {
        //         rj2.setMotorSpeed(-20);
        //         console.log("LEFT BTN DOWN2");
        //     }, testPhaser);
        //     testPhaser.leftBtn.on("up", function () {
        //         rj2.setMotorSpeed(20);
        //         console.log("LEFT BTN UP2");
        //     }, testPhaser);

        //     testPhaser.rightBtn = testPhaser.input.keyboard.addKey("RIGHT");
        //     testPhaser.rightBtn.on("down", function () {
        //         rj.setMotorSpeed(20);
        //     }, testPhaser);
        //     testPhaser.rightBtn.on("up", function () {
        //         rj.setMotorSpeed(-20);
        //     }, testPhaser);



        //     return world;
        // });
        // planck.testbed(function (testbed) {
        //     // Create a world
        //     var world = ww;

        //     // let bd1 = world.createBody({
        //     //     type: "static"
        //     // });
        //     // bd1.createFixture(
        //     //     planck.Polygon(
        //     //         [planck.Vec2(100 / 30, 200 / 30), planck.Vec2(180 / 30, 300 / 30), planck.Vec2(100 / 30, 300 / 30), planck.Vec2(100 / 30, 250 / 30)]
        //     //     ), {
        //     //         userData: "shape1",
        //     //         friction: 0.1,
        //     //         restitution: 0.5,
        //     //         density: 1
        //     //     }
        //     // );
        //     // bd1.setPosition(
        //     //     planck.Vec2((x / 30) - 35, y / 30));
        //     // bd1.setMassData({
        //     //     mass: 1,
        //     //     center: planck.Vec2(),
        //     //     I: 1
        //     // });

        //     // let bd2 = world.createBody({
        //     //     type: "static"
        //     // });
        //     // bd2.createFixture(
        //     //     planck.Polygon(
        //     //         [planck.Vec2(100 / 30, 200 / 30), planck.Vec2(180 / 30, 200 / 30), planck.Vec2(180 / 30, 300 / 30), planck.Vec2(100 / 30, 300 / 30), planck.Vec2(100 / 30, 250 / 30)]
        //     //     ), {
        //     //         userData: "shape1",
        //     //         friction: 0.1,
        //     //         restitution: 0.5,
        //     //         density: 1
        //     //     }
        //     // );
        //     // // bd2.setPosition(
        //     // //     planck.Vec2(bd1.getPosition().x - 1.5, bd1.getPosition().y - 1.5));
        //     // bd2.setMassData({
        //     //     mass: 1,
        //     //     center: planck.Vec2(),
        //     //     I: 1
        //     // });

        //     // let rj = planck.RevoluteJoint({
        //     //     enableMotor: true,
        //     //     motorSpeed: 0.0,
        //     //     maxMotorTorque: 10,
        //     //     enableLimit: true,
        //     //     // lowerAngle: -0.5 * Math.PI, // -90 degrees
        //     //     // upperAngle: 0.25 * Math.PI, // 45 degrees
        //     //     lowerAngle: -20 * (Math.PI / 180.0),
        //     //     upperAngle: 5 * (Math.PI / 180.0),
        //     // }, bd1, bd2, bd1.getWorldCenter());

        //     // world.createJoint(rj);

        //     // Make sure you return the world
        //     return world;
        // });
        // planck.testbed(function () {
        //     var world = ww;
        //     return world;
        // });
    }

    update() {
        this.world.step(1 / 16);
        this.world.clearForces();
    }

}

class Circle extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, radius, isDynamic, isFixed) {
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

        this.setTexture(rnd);
        this.scene = scene;
        this.isDynamic = isDynamic;
        this.isFixed = isFixed;
        this.scene.add.existing(this);

        this.radius = radius;

        this.x = x;
        this.y = y;

        // Body
        this.b = scene.world.createBody();
        if (this.isDynamic) {
            this.b.setDynamic();
        }

        this.b.createFixture(planck.Circle(radius / 30), {
            friction: 0.1,
            restitution: 0.5,
            density: 1
        });
        this.b.setPosition(
            planck.Vec2(this.x / 30, 0)
        );
        this.b.setMassData({
            mass: 1,
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
    constructor(scene, x, y, x2, y2, isDynamic) {
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
                density: 1
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
let PX2M = 0.01;
let THICKNESS = 10;
class Flipper extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, wallLeft, wallRight, canvas) {
        super(scene, x, y);
        // this.p = p;
        this.w = x / 6 - THICKNESS;
        this.h = THICKNESS;

        this.xLeft = x / 2 - this.w / 2 - THICKNESS;
        this.yLeft = y - this.h / 2;
        // this.xRight = canvas.width / 2 + this.w / 2 + THICKNESS;
        // this.yRight = canvas.height - this.h / 2;

        const rnd =
            Math.random()
            .toString(36)
            .substring(2, 15) +
            Math.random()
            .toString(36)
            .substring(2, 15);

        // const graphics = scene.add.graphics();
        // graphics.fillStyle(0x333333, 1);
        // graphics.fillRect(PX2M * this.xLeft, PX2M * this.yLeft, 400, 200);

        // graphics.generateTexture(rnd, 400, 200);
        // graphics.destroy();

        // this.setTexture("toggleLeft");
        this.scene = scene;
        this.scene.add.existing(this);

        this.x = x;
        this.y = y;

        //make invisible talang
        this.talangLeft = scene.world.createBody({
            type: 'static'
        });
        this.talangLeft.createFixture(
            planck.Box(
                PX2M * 100,
                PX2M * 200,
                planck.Vec2(PX2M * (this.xLeft - 200), PX2M * (this.yLeft - 100)),
            ), {
                density: 1.0,
                userData: 'talang-left',
            },
        );
        this.talangLeft.setPosition(
            planck.Vec2(this.x / 30, this.y / 30)
        );
        this.talangLeft.setMassData({
            mass: 1,
            center: planck.Vec2(),
            I: 0
        });

        // rectangular body for left-flipper
        this.bodyLeft = scene.world.createDynamicBody();
        this.bodyLeft.createFixture(
            planck.Box(
                PX2M * 200,
                PX2M * 100,
                planck.Vec2(PX2M * this.xLeft, PX2M * this.yLeft),
            ), {
                density: 1.0,
                userData: 'flipper-left',
            },
        );
        this.bodyLeft.setPosition(
            planck.Vec2(this.x / 30, this.y / 30)
        );
        this.bodyLeft.setMassData({
            mass: 1,
            center: planck.Vec2(),
            I: 0
        });
        // // rectangular body for right-flipper
        // this.bodyRight = world.world.createDynamicBody();
        // this.bodyRight.createFixture(
        //     planck.Box(
        //         PX2M * (this.w / 2),
        //         PX2M * (this.h / 2),
        //         planck.Vec2(PX2M * this.xRight, PX2M * this.yRight),
        //     ), {
        //         density: 1.0,
        //         userData: 'flipper-right',
        //     },
        // );

        // hinge joint at end of left-flipper
        const optionsLeft = {
            enableMotor: true,
            motorSpeed: 0.0,
            maxMotorTorque: 10,
            enableLimit: true,
            // lowerAngle: -0.5 * Math.PI, // -90 degrees
            // upperAngle: 0.25 * Math.PI, // 45 degrees
            lowerAngle: -20 * (Math.PI / 180.0),
            upperAngle: 5 * (Math.PI / 180.0),
        };
        this.centerRotationLeft = planck.Vec2(
            // PX2M * (this.xLeft - this.w / 2),
            // PX2M * this.yLeft,
            PX2M * 50,
            PX2M * 50
        );

        this.jointLeft = planck.RevoluteJoint(optionsLeft, this.talangLeft, this.bodyLeft,
            this.talangLeft.getWorldCenter());
        scene.world.createJoint(this.jointLeft);

        // // hinge joint at end of right-flipper
        // const optionsRight = {
        //     enableMotor: true,
        //     motorSpeed: 0.0,
        //     maxMotorTorque: 10,
        //     enableLimit: true,
        //     lowerAngle: -5 * (Math.PI / 180.0),
        //     upperAngle: 20 * (Math.PI / 180.0),
        // };
        // this.centerRotationRight = planck.Vec2(
        //     PX2M * (this.xRight + this.w / 2),
        //     PX2M * this.yRight,
        // );
        // this.jointRight = planck.RevoluteJoint(optionsRight, wallRight, this.bodyRight,
        //     this.centerRotationRight);
        // world.world.createJoint(this.jointRight);

    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        // let p = this.bodyLeft.getPosition();
        // this.x = p.x * 30;
        // this.y = p.y * 30;
        // this.rotation = this.bodyLeft.getAngle();
    }

    draw() {
        // rectangles at positions & angles of bodies (convert meters to pixels)
        // this.p.push();
        // this.p.fill('#00f');
        // this.p.translate(
        //     (1 / PX2M) * this.centerRotationLeft.x,
        //     (1 / PX2M) * this.centerRotationLeft.y,
        // );
        // this.p.rotate(this.bodyLeft.getAngle());
        // this.p.rect(this.w / 2, 0, this.w, this.h);
        // this.p.pop();

        // this.p.push();
        // this.p.fill('#00f');
        // this.p.translate(
        //     (1 / PX2M) * this.centerRotationRight.x,
        //     (1 / PX2M) * this.centerRotationRight.y,
        // );
        // this.p.rotate(this.bodyRight.getAngle());
        // this.p.rect(-this.w / 2, 0, this.w, this.h);
        // this.p.pop();
    }

    rotateLeft() {
        // sets motor speed in radians/second
        this.jointLeft.setMotorSpeed(-20.0);
    }

    resetLeft() {
        // reset angle on arrow keys release
        this.jointLeft.setMotorSpeed(20.0);
    }

    rotateRight() {
        this.jointRight.setMotorSpeed(20.0);
    }

    resetRight() {
        this.jointRight.setMotorSpeed(-20.0);
    }
}

class Poly extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, key, points, isDynamic, isFixed) {
        super(scene, x, y, key);

        const rnd =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
        console.log(points);
        const poly = new Polygon(points);
        const bbox = poly.aabb();

        const width = bbox.w;
        const height = bbox.h;
        const assetsDPR = window.devicePixelRatio;
        // this.setScale(assetsDPR / 10, assetsDPR / 10);

        const graphics = scene.add.graphics();
        graphics.fillStyle(0x333333, 1);
        graphics.beginPath();
        graphics.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i += 1) {
            graphics.lineTo(points[i][0], points[i][1]);
        }
        graphics.lineTo(points[0][0], points[0][1]);
        graphics.closePath();
        graphics.fill();
        graphics.generateTexture(rnd, width, height);
        graphics.destroy();

        // this.setTexture(rnd);
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
        points.forEach((p) => {
            vertices.push(
                new planck.Vec2(
                    (p[0] - width / 2) / scene.scaleFactor,
                    (p[1] - height / 2) / scene.scaleFactor
                )
            );
        });

        this.b.createFixture(planck.Polygon(vertices, points.length));
        this.b.setPosition(
            planck.Vec2(x / scene.scaleFactor, y / scene.scaleFactor)
        );
        this.b.setMassData({
            mass: 1,
            center: planck.Vec2(),
            I: this.isFixed ? 0 : 1
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        let p = this.b.getPosition();
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