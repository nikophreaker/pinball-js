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

window.onload = function () {
    let gameConfig = {
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "canvas",
            width: 305.5 * window.devicePixelRatio,
            height: 624 * window.devicePixelRatio,
        },
        backgroundColor: 0xD30000,
        physics: {
            default: 'matter', //arcade
            matter: {
                gravity: { //global gravity
                    y: GRAVITY
                },
                plugins: {
                    attractors: true,
                },
                positionIterations: 6,
                velocityIterations: 4,
                constraintIterations: 2,
                enableSleeping: false,
                timing: {
                    timestamp: 0,
                    timeScale: 1
                },
                debug: false
            },
        },
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

    create() {
        // let DOME2 = '0 0 0 250 19 250 20 231.9 25.7 196.1 36.9 161.7 ' +
        //     '53.3 129.5 74.6 100.2 100.2 74.6 129.5 53.3 161.7 36.9 196.1 25.7 ' +
        //     '231.9 20 268.1 20 303.9 25.7 338.3 36.9 370.5 53.3 399.8 74.6 ' +
        //     '425.4 100.2 446.7 129.5 463.1 161.7 474.3 196.1 480 231.9 480 250 ' +
        //     '500 250 500 0 0 0'; //54 titik (27 per dome)
        // this.matter.world.add(this.path(this.gameWidth / 1.8, this.gameHeight / 2, DOME2));
        console.log(`DPR: ${window.devicePixelRatio}`);
        console.log(this.scaleWithRatioPixel(0));
        this.bgIntro = this.add.sprite(this.gameWidth / 2, this.gameHeight / 2, "bgIntro");
        this.btnStart = this.add.sprite(this.gameWidth / 2, this.gameHeight / 1.5, "btnStart")
            .setScale(this.scaleWithRatioPixel(0.1));
        this.btnStart.setInteractive() // impartant for make sprite or image event
        let btnStart = this.btnStart;
        let btnStartOver = this.scaleWithRatioPixel(0);
        let btnStartOut = this.scaleWithRatioPixel(0.1);
        this.bgIntro.setDisplaySize(this.gameWidth, this.gameHeight);
        this.btnStart.on("pointerover", function () {
            btnStart.setScale(btnStartOver);
        });
        this.btnStart.on("pointerout", function () {
            btnStart.setScale(btnStartOut);
        });
        // this.logo = this.add.sprite((window.innerWidth * window.devicePixelRatio) / 2, (window.innerHeight * window.devicePixelRatio) / 4, "logo")
        //     .setScale(0.3);
        this.enterGame(); // testing
        this.btnStart.on("pointerdown", this.enterGame, this);
    }

    // outer edges of pinball table
    boundary(x, y, width, height, label) {
        return this.matter.bodies.rectangle(x, y, width, height, {
            label: label,
            isStatic: true,
            render: {
                fillStyle: COLOR.OUTER
            }
        });
    }

    // wall segments
    wall(x, y, width, height, color, angle = 0) {
        return this.matter.bodies.rectangle(x, y, width, height, {
            angle: angle,
            isStatic: true,
            chamfer: {
                radius: 10
            },
            render: {
                fillStyle: color
            }
        });
    }

    // bodies created from SVG paths
    path(x, y, path) {
        let vertices = this.matter.vertices.fromPath(path);
        return this.matter.bodies.fromVertices(x, y, vertices, {
            isStatic: true,
            render: {
                fillStyle: COLOR.OUTER,

                // add stroke and line width to fill in slight gaps between fragments
                strokeStyle: COLOR.OUTER,
                lineWidth: 1
            }
        });
    }

    // round bodies that repel pinball
    bumper(x, y, radius) {
        let bumper = this.matter.bodies.circle(x, y, radius, {
            label: 'bumper',
            isStatic: true,
            render: {
                fillStyle: COLOR.BUMPER
            }
        });

        // for some reason, restitution is reset unless it's set after body creation
        bumper.restitution = BUMPER_BOUNCE;

        return bumper;
    }

    // contact with these bodies causes pinball to be relaunched
    reset(x, y, width) {
        return this.matter.bodies.rectangle(x, y, width, 2, {
            label: 'reset',
            isStatic: true,
            render: {
                fillStyle: '#fff'
            }
        });
    }

    // invisible bodies to constrict paddles
    stopper(x, y, side, position) {
        // determine which paddle composite to interact with
        let attracteeLabel = (side === 'left') ? 'paddleLeftComp' : 'paddleRightComp';

        return this.matter.bodies.circle(x, y, 40, {
            isStatic: true,
            render: {
                visible: true,
            },
            collisionFilter: {
                group: stopperGroup
            },
            plugin: {
                attractors: [
                    // stopper is always a, other body is b
                    function (a, b) {
                        if (b.label === attracteeLabel) {
                            let isPaddleUp = (side === 'left') ? isLeftPaddleUp : isRightPaddleUp;
                            let isPullingUp = (position === 'up' && isPaddleUp);
                            let isPullingDown = (position === 'down' && !isPaddleUp);
                            if (isPullingUp || isPullingDown) {
                                return {
                                    x: (a.position.x - b.position.x) * PADDLE_PULL,
                                    y: (a.position.y - b.position.y) * PADDLE_PULL,
                                };
                            }
                        }
                    }
                ]
            }
        });
    }

    enterGame() {
        //Set Background
        this.bgIntro.visible = false;
        this.btnStart.visible = false;
        this.bgStart = this.matter.add.image(0, 0, 'bgStart', null, {
            isStatic: true,
            isSensor: true,
        });
        this.bgStart.setPosition(this.gameWidth / 2, this.gameHeight / 2);
        this.bgStart.displayWidth = this.gameWidth;
        this.bgStart.displayHeight = this.gameHeight;

        this.matter.add.image((this.gameWidth / 2) - (3 * dpr), (this.gameHeight / 2) + (11 * dpr), 'bgPinball', null, {
                isStatic: true,
                isSensor: true,
            })
            .setScale(0.25 * dpr);

        fieldBumper = this.matter.add.image((this.gameWidth / 2) + (3 * dpr), (this.gameHeight / 2) - (66 * dpr), 'fieldBumper', null, {
                isStatic: true,
                isSensor: true,
            })
            .setScale(0.25 * dpr);
        fieldBumper2 = this.matter.add.image((this.gameWidth / 2) + (3 * dpr), (this.gameHeight / 2) - (66 * dpr), 'fieldBumper', null, {
                isStatic: true,
                isSensor: true,
            })
            .setScale(0.25 * dpr);
        fieldBumper.alpha = 0.65;
        fieldBumper2.alpha = 1;

        // let bgGame = this.add.rectangle(this.gameWidth / 2, this.gameHeight / 2, this.gameWidth, this.gameHeight, {
        //     render: {
        //         fillColor: 0xffffff
        //     }
        // });

        //Call function
        this.init();
        this.createStaticBodies();
        this.createPaddles();
        this.createPinball();
        this.createEvents();
    }

    init() {
        // this.matter.world.disableGravity();
        var shapes = this.cache.json.get('shapes');
        this.matter.world.setBounds(0, 0);
        this.matter.enableCollisionEventsPlugin();
        // this.matter.world.setGravity(0, GRAVITY);

        // used for collision filtering on various bodies
        stopperGroup = this.matter.body.nextGroup(true);

        // starting values
        currentScore = 0;
        highScore = 0;
        isLeftPaddleUp = false;
        isRightPaddleUp = false;
    }

    createStaticBodies() {
        // let domeWidth = this.gameWidth - (20 * dpr);
        // let domeHeight = this.gameHeight / 4;
        // let domeTemp = `0 0 0 ${domeHeight} `;
        // for (let index = 1; index <= 2; index++) {
        //     let point = `${index * 10} ${domeHeight - ((5 * index) * dpr)} 0 0 ${index * 10} ${domeHeight - ((5 * index) * dpr)}`;
        //     domeTemp = domeTemp + ' ' + point;
        // }
        // let domeTest = `${domeTemp} ${domeWidth} ${domeHeight} ${domeWidth} 0 0 0`;
        // console.log(domeTest);
        // let domeTest = "0 250 19 250 20 231.9 25.7 196.1 36.9 161.7 53.3 129.5 74.6 100.2 100.2 74.6 129.5 53.3 161.7 36.9 196.1 25.7 231.9 20 268.1 20" +
        // " 303.9 25.7 338.3 36.9 370.5 53.3 399.8 74.6 425.4 100.2 446.7 129.5 463.1 161.7 474.3 196.1 480 231.9 480 250 500 250 500 0 0 0";
        // let domeTest = "0 220 0 220 5 211.9 8 208.9 15.7 196.1 36.9 161.7 53.3 129.5 74.6 100.2 100.2 74.6 129.5 53.3 161.7 36.9 196.1 25.7 240 20" +
        //     " 339.1 20 374.9 25.7 409.3 36.9 441.5 53.3 470.8 74.6 496.4 100.2 517.7 129.5 534.1 161.7 555.3 196.1 569 208.9 566 211.9 571 220 571 220" +
        //     " 570 0 0 0";
        // let domePath = this.path((this.gameWidth / 2), (this.gameHeight / 2) - (272 * dpr), domeTest);
        var shapes = this.cache.json.get('shapes');
        let domePath = this.matter.add.sprite((this.gameWidth / 2) + (5 * dpr), (this.gameHeight / 2) - (265 * dpr), "dome", null, {
                shape: shapes.dome,
                friction: 0,
                isStatic: true,
            })
            .setScale(0.24 * dpr, 0.225 * dpr);
        let wallPath = this.matter.add.sprite((this.gameWidth / 2) + (115 * dpr), (this.gameHeight / 2) + (8 * dpr), "wall1", null, {
                shape: shapes.wall1,
                friction: 0,
                isStatic: true,
            })
            .setScale(0.24 * dpr, 0.25 * dpr);
        this.boundaryBottom = this.boundary(this.gameWidth / 2, this.gameHeight, this.gameWidth, 20 * dpr, "bottom");
        let wall2 = '0 0 100 426 90 442 85 458 74.2 475 74 475 60 495 50 525 42 545 38 565 28 595 28 600 28 990 0 990'
        this.matter.add.image((this.gameWidth / 2) - (118 * dpr), (this.gameHeight / 2) + (70 * dpr), 'wall2', null, {
                isStatic: true,
                isSensor: true,
            })
            .setScale(0.25 * dpr);
        this.matter.add.sprite((this.gameWidth / 2) - (75 * dpr), (this.gameHeight / 2) - (120 * dpr), 'wall3', null, {
                shape: shapes.wall3,
                isStatic: true,
                isSensor: true,
            })
            .setScale(0.25 * dpr);
        this.matter.add.image((this.gameWidth / 2) - (78 * dpr), (this.gameHeight / 2) + (275 * dpr), 'appronsLeft', null, {
                isStatic: true,
                isSensor: true,
            })
            .setScale(0.25 * dpr);
        this.matter.add.image((this.gameWidth / 2) + (75 * dpr), (this.gameHeight / 2) + (275 * dpr), 'appronsRight', null, {
                isStatic: true,
                isSensor: true,
            })
            .setScale(0.25 * dpr);
        this.matter.world.add([

            // left wall
            this.path((this.gameWidth / 2) - (125 * dpr), (this.gameHeight / 2) + (14.5 * dpr), wall2),

            // table boundaries (top, bottom, left, right)
            this.boundary(this.gameWidth / 2, 0, this.gameWidth, 20 * dpr, "top"),
            this.boundaryBottom,
            this.boundary(0, this.gameHeight / 2, 20 * dpr, this.gameHeight, "left"),
            this.boundary(this.gameWidth, this.gameHeight / 2, 20 * dpr, this.gameHeight, "right"),

            // dome
            // this.path((this.gameWidth / 2) + (85 * dpr), (this.gameHeight / 2) - (245 * dpr), PATHS.DOME),
            // domePath,

            // pegs (left, mid, right)
            this.wall((this.gameWidth / 2) - (15 * dpr), 155 * dpr, 8 * dpr, 30 * dpr, COLOR.INNER),
            // this.wall(225, 140, 20, 40, COLOR.INNER),
            this.wall((this.gameWidth / 2) + (15 * dpr), 155 * dpr, 8 * dpr, 30 * dpr, COLOR.INNER),

            // pegs in bottom(left, right)
            this.wall((this.gameWidth / 2) - (10 * dpr), (this.gameHeight / 2) + (123 * dpr), 8 * dpr, 30 * dpr, COLOR.INNER),
            this.wall((this.gameWidth / 2) + (20 * dpr), (this.gameHeight / 2) + (123 * dpr), 8 * dpr, 30 * dpr, COLOR.INNER),

            // top bumpers (left, mid, right)
            this.bumper((this.gameWidth / 2) - (25 * dpr), 275 * dpr, 17.5 * dpr),
            this.bumper((this.gameWidth / 2) - (20 * dpr), 213 * dpr, 18.5 * dpr),
            this.bumper((this.gameWidth / 2) + (40 * dpr), 245 * dpr, 22.5 * dpr),

            // bottom bumpers (left, right)
            // this.bumper(165, 340),
            // this.bumper(285, 340),

            // shooter lane wall
            this.wall(this.gameWidth - (26 * dpr), this.gameHeight - ((360 * dpr) / 2), 9 * dpr, 360 * dpr, COLOR.OUTER),

            // drops (left, right)
            this.path((this.gameWidth / 2) - (75 * dpr), (this.gameHeight / 2) + (165 * dpr), PATHS.DROP_LEFT),
            this.path((this.gameWidth / 2) + (70 * dpr), (this.gameHeight / 2) + (165 * dpr), PATHS.DROP_RIGHT),

            // slingshots (left, right)
            // this.wall(120, 510, 20, 120, COLOR.INNER),
            // this.wall(330, 510, 20, 120, COLOR.INNER),

            // out lane walls (left, right)
            this.wall((this.gameWidth / 2) - (105 * dpr), (this.gameHeight / 2) + (170 * dpr), 10 * dpr, 80 * dpr, COLOR.INNER),
            this.wall((this.gameWidth / 2) + (100 * dpr), (this.gameHeight / 2) + (170 * dpr), 10 * dpr, 80 * dpr, COLOR.INNER),

            // flipper walls (left, right);
            this.wall((this.gameWidth / 2) - (85 * dpr), (this.gameHeight / 2) + (220 * dpr), 12 * dpr, 49 * dpr, COLOR.INNER, -0.96),
            this.wall((this.gameWidth / 2) + (80 * dpr), (this.gameHeight / 2) + (220 * dpr), 12 * dpr, 49 * dpr, COLOR.INNER, 0.96),

            // aprons (left, right)
            this.path((this.gameWidth / 2) - (90 * dpr), (this.gameHeight / 2) + (285 * dpr), PATHS.APRON_LEFT),
            this.path((this.gameWidth / 2) + (85 * dpr), (this.gameHeight / 2) + (285 * dpr), PATHS.APRON_RIGHT),

            // reset zones (center, right)
            // this.reset(225, 50),
            // this.reset(465, 30)
        ]);

        let leftA = this.matter.add.image((this.gameWidth / 2) - (10 * dpr), (this.gameHeight / 2) + (123 * dpr), 'leftA', null, {
                isStatic: true,
                isSensor: true
            })
            .setScale(0.23 * dpr);

        let rightA = this.matter.add.image((this.gameWidth / 2) + (20 * dpr), (this.gameHeight / 2) + (123 * dpr), 'rightA', null, {
                isStatic: true,
                isSensor: true
            })
            .setScale(0.23 * dpr);

        let leftB = this.matter.add.image((this.gameWidth / 2) - (70 * dpr), (this.gameHeight / 2) + (165 * dpr), 'leftB', null, {
                isStatic: true,
                isSensor: true
            })
            .setScale(0.23 * dpr);

        let rightB = this.matter.add.image((this.gameWidth / 2) + (65 * dpr), (this.gameHeight / 2) + (165 * dpr), 'rightB', null, {
                isStatic: true,
                isSensor: true
            })
            .setScale(0.23 * dpr);

        let leftC = this.matter.add.image((this.gameWidth / 2) - (80 * dpr), (this.gameHeight / 2) + (190 * dpr), 'leftC', null, {
                isStatic: true,
                isSensor: true
            })
            .setScale(0.25 * dpr);

        let rightC = this.matter.add.image((this.gameWidth / 2) + (78 * dpr), (this.gameHeight / 2) + (187 * dpr), 'rightC', null, {
                isStatic: true,
                isSensor: true
            })
            .setScale(0.25 * dpr);

        let leftD = this.matter.add.image((this.gameWidth / 2) - (15 * dpr), 155 * dpr, 'leftD', null, {
                isStatic: true,
                isSensor: true
            })
            .setScale(0.25 * dpr);

        let rightD = this.matter.add.image((this.gameWidth / 2) + (15 * dpr), 155 * dpr, 'rightD', null, {
                isStatic: true,
                isSensor: true
            })
            .setScale(0.25 * dpr);

        let bumper100 = this.matter.add.image((this.gameWidth / 2) - (24 * dpr), 276 * dpr, 'bumper100', null, {
                isStatic: true,
                isSensor: true
            })
            .setScale(0.2 * dpr);

        let bumper200 = this.matter.add.image((this.gameWidth / 2) - (20 * dpr), 213 * dpr, 'bumper200', null, {
                isStatic: true,
                isSensor: true
            })
            .setScale(0.25 * dpr);

        let bumper500 = this.matter.add.image((this.gameWidth / 2) + (42 * dpr), 245 * dpr, 'bumper500', null, {
                isStatic: true,
                isSensor: true
            })
            .setScale(0.3 * dpr);
    }

    createPaddles() {
        // these bodies keep paddle swings contained, but allow the ball to pass through
        leftUpStopper = this.stopper(((this.gameWidth / 2) - (40 * dpr)) - (10 * dpr), ((this.gameHeight / 2) + (235 * dpr)) - (34.5 * dpr), 'left', 'up');
        leftDownStopper = this.stopper(((this.gameWidth / 2) - (40 * dpr)) - (10 * dpr), ((this.gameHeight / 2) + (235 * dpr)) + (35.5 * dpr), 'left', 'down');
        rightUpStopper = this.stopper(((this.gameWidth / 2) + (40 * dpr)) + (4 * dpr), (this.gameHeight / 2) + (231 * dpr) - (34.5 * dpr), 'right', 'up');
        rightDownStopper = this.stopper(((this.gameWidth / 2) + (40 * dpr)) + (5 * dpr), (this.gameHeight / 2) + (231 * dpr) + (39.5 * dpr), 'right', 'down');
        this.matter.world.add([leftUpStopper, leftDownStopper, rightUpStopper, rightDownStopper]);

        // this group lets paddle pieces overlap each other
        let paddleGroup = this.matter.body.nextGroup(true);

        // Left paddle mechanism
        let paddleLeft = {};
        paddleLeft.paddle = this.matter.bodies.trapezoid((this.gameWidth / 2) - (40 * dpr), (this.gameHeight / 2) + (240 * dpr), 12.5 * dpr, 60 * dpr, 0.33, {
            label: 'paddleLeft',
            angle: 1.57, //1.27,
            chamfer: {},
            render: {
                fillStyle: COLOR.PADDLE
            }
        });
        paddleLeft.brick = this.matter.bodies.rectangle(((this.gameWidth / 2) - (40 * dpr)) + (3 * dpr), ((this.gameHeight / 2) + (240 * dpr)) + 10, 20 * dpr, 60 * dpr, {
            angle: 1.62, //1.32,
            chamfer: {},
            render: {
                fillColor: 0x495057,
                lineColor: 0x495057,
                visible: true
            },
        });
        paddleLeft.comp = this.matter.body.create({
            label: 'paddleLeftComp',
            parts: [paddleLeft.paddle, paddleLeft.brick]
        });
        paddleLeft.hinge = this.matter.bodies.circle(((this.gameWidth / 2) - (40 * dpr)) - (15 * dpr), (this.gameHeight / 2) + (240 * dpr), 2.5 * dpr, {
            isStatic: true,
            render: {
                visible: false
            }
        });

        let paddleLeftsprite = this.matter.add.image(0, 0, 'toggleLeft', null);
        paddleLeftsprite.setScale(0.225 * dpr);
        paddleLeftsprite.setExistingBody(paddleLeft.comp, false)
            .setPosition(paddleLeft.comp.position.x, paddleLeft.comp.position.y)
            .setDisplayOrigin(120, 50);

        Object.values(paddleLeft).forEach((piece) => {
            piece.collisionFilter.group = paddleGroup
        });
        paddleLeft.con = this.matter.constraint.create({
            bodyA: paddleLeft.comp,
            pointA: {
                x: -35,
                y: -4.5
            },
            bodyB: paddleLeft.hinge,
            length: 0,
            stiffness: 0
        });
        this.matter.world.add([paddleLeft.comp, paddleLeft.hinge, paddleLeft.con]);
        this.matter.body.rotate(paddleLeft.comp, 0.57);

        // right paddle mechanism
        let paddleRight = {};
        paddleRight.paddle = this.matter.bodies.trapezoid((this.gameWidth / 2) + (40 * dpr), (this.gameHeight / 2) + (240 * dpr), 12.5 * dpr, 60 * dpr, 0.33, {
            label: 'paddleRight',
            angle: -1.57,
            chamfer: {},
            render: {
                fillStyle: COLOR.PADDLE
            }
        });
        paddleRight.brick = this.matter.bodies.rectangle(((this.gameWidth / 2) + (40 * dpr)) - (1 * dpr), ((this.gameHeight / 2) + (240 * dpr)) + 10, 20 * dpr, 60 * dpr, {
            angle: -1.62,
            chamfer: {},
            render: {
                visible: true
            }
        });
        paddleRight.comp = this.matter.body.create({
            label: 'paddleRightComp',
            parts: [paddleRight.paddle, paddleRight.brick]
        });
        paddleRight.hinge = this.matter.bodies.circle(((this.gameWidth / 2) + (40 * dpr)) + (11.5 * dpr), (this.gameHeight / 2) + (238 * dpr), 2.5 * dpr, {
            isStatic: true,
            render: {
                visible: false
            }
        });

        let paddleRightsprite = this.matter.add.sprite(0, 0, 'toggleRight', null);
        paddleRightsprite.setScale(0.225 * dpr);
        paddleRightsprite.setExistingBody(paddleRight.comp, false)
            .setPosition(paddleRight.comp.position.x, paddleRight.comp.position.y)
            .setDisplayOrigin(135, 50);

        Object.values(paddleRight).forEach((piece) => {
            piece.collisionFilter.group = paddleGroup
        });
        paddleRight.con = this.matter.constraint.create({
            bodyA: paddleRight.comp,
            pointA: {
                x: 35,
                y: -4.5
            },
            bodyB: paddleRight.hinge,
            length: 0,
            stiffness: 0
        });
        this.matter.world.add([paddleRight.comp, paddleRight.hinge, paddleRight.con]);
        this.matter.body.rotate(paddleRight.comp, -0.57);
    }

    createPinball() {
        // x/y are set to when pinball is launched
        // pinball = this.matter.bodies.circle(0, 0, 14, {
        //     label: 'pinball',
        //     collisionFilter: {
        //         group: stopperGroup
        //     },
        //     render: {
        //         fillStyle: COLOR.PINBALL
        //     }
        // });
        // this.matter.world.add(pinball);

        pinball = this.matter.add.sprite(this.gameWidth / 3, this.gameHeight / 2, "ball", null, {
            label: "pinball",
            shape: {
                type: "circle"
            },
            isStatic: false,
            friction: 0,
            frictionAir: 0.0002,
            mass: 4,
            inverseMass: 2,
            // restitution: 0.002,
            collisionFilter: {
                group: stopperGroup
            },
            // render: {
            //     visible: true,
            //     lineColor: 0xdee2e6,
            //     fillColor: 0xdee2e6,
            //     fillOpacity: 1,
            //     opacity: 1,
            //     // fillStyle: 0xdee2e6 //COLOR.PINBALL
            // }
        });
        pinball.scale = 0.25 * dpr;
        this.matter.body.scale(pinball.body, 0.25 * dpr, 0.25 * dpr);
        var tetst = this;
        pinball.setOnCollide(function (event) {
            let pairs = event.bodyA.label;
            // console.log(pairs);
            switch (pairs) {
                case 'bottom':
                    isFalling = true;
                    break;
                case 'bumper':
                    tetst.pingBumper(event.bodyA);
                    break;
            }
        });
        this.launchPinball();
        // this.matter.add.mouseSpring();
    }

    createEvents() {
        // events for when the pinball hits stuff
        // this.matter.Events.on(engine, 'collisionStart', function (event) {
        //     let pairs = event.pairs;
        //     pairs.forEach(function (pair) {
        //         if (pair.bodyB.label === 'pinball') {
        //             switch (pair.bodyA.label) {
        //                 case 'reset':
        //                     launchPinball();
        //                     break;
        //                 case 'bumper':
        //                     pingBumper(pair.bodyA);
        //                     break;
        //             }
        //         }
        //     });
        // });

        // regulate pinball
        let scene = this;
        this.matter.world.on('beforeUpdate', function (event) {
            // bumpers can quickly multiply velocity, so keep that in check
            scene.matter.body.setVelocity(pinball.body, {
                x: Math.max(Math.min(pinball.body.velocity.x, MAX_VELOCITY), -MAX_VELOCITY),
                y: Math.max(Math.min(pinball.body.velocity.y, MAX_VELOCITY), -MAX_VELOCITY),
            });

            // cheap way to keep ball from going back down the shooter lane
            if (pinball.body.position.x > 450 && pinball.body.velocity.y > 0) {
                scene.matter.body.setVelocity(pinball.body, {
                    x: 0,
                    y: -10
                });
            }
        });

        // mouse drag (god mode for grabbing pinball)
        // this.matter.composite.add("afterAdd");
        // this.matter.world.add(this.matter.MouseConstraint.create(engine, {
        //     mouse: this.matter.Mouse.create(render.canvas),
        //     constraint: {
        //         stiffness: 0.2,
        //         render: {
        //             visible: false
        //         }
        //     }
        // }));

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
            isLeftPaddleUp = true;
        }, this);
        this.leftBtn.on("up", function () {
            isLeftPaddleUp = false;
        }, this);

        this.rightBtn = this.input.keyboard.addKey("RIGHT");
        this.rightBtn.on("down", function () {
            isRightPaddleUp = true;
        }, this);
        this.rightBtn.on("up", function () {
            isRightPaddleUp = false;
        }, this);

        // click/tap paddle events
        // $('.left-trigger')
        //     .on('mousedown touchstart', function (e) {
        //         isLeftPaddleUp = true;
        //     })
        //     .on('mouseup touchend', function (e) {
        //         isLeftPaddleUp = false;
        //     });
        // $('.right-trigger')
        //     .on('mousedown touchstart', function (e) {
        //         isRightPaddleUp = true;
        //     })
        //     .on('mouseup touchend', function (e) {
        //         isRightPaddleUp = false;
        //     });
    }

    // matter.js has a built in random range function, but it is deterministic
    rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    updateScore(newCurrentScore) {
        currentScore = newCurrentScore;
        // $currentScore.text(currentScore);
        console.log(`currentScore: ${currentScore}`);

        highScore = Math.max(currentScore, highScore);
        // $highScore.text(highScore);
        console.log(`highScore: ${highScore}`);
    }

    pingBumper(bumper) {
        this.updateScore(currentScore + 10);

        // flash color
        bumper.render.fillStyle = COLOR.BUMPER_LIT;
        setTimeout(function () {
            bumper.render.fillStyle = COLOR.BUMPER;
        }, 100);
    }

    launchPinball() {
        // updateScore(0);
        this.matter.body.setPosition(pinball.body, {
            x: this.gameWidth / 1.2,
            y: this.gameHeight / 1.2
        });
        this.matter.body.setVelocity(pinball.body, {
            x: 0,
            y: -25 + this.rand(-2, 2)
        });
        this.matter.body.setAngularVelocity(pinball.body, 0);
    }

    update() {
        if (isFalling) {
            isFalling = false;
            this.launchPinball();
        }
    }


}