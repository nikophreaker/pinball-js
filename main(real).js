let test;
let test2;
let btnSpaceHold = false;
let nubruk = false;
let pegasScaleY = 0.4;
let dpr;
const BUMPER_BOUNCE = 1.5;
const PATHS = {
    DOME: '0 0 0 250 19 250 20 231.9 25.7 196.1 36.9 161.7 53.3 129.5 74.6 100.2 100.2 74.6 129.5 53.3 161.7 36.9 196.1 25.7 231.9 20 268.1 20 303.9 25.7 338.3 36.9 370.5 53.3 399.8 74.6 425.4 100.2 446.7 129.5 463.1 161.7 474.3 196.1 480 231.9 480 250 500 250 500 0 0 0',
    DROP_LEFT: '0 0 20 0 70 100 20 150 0 150 0 0',
    DROP_RIGHT: '50 0 68 0 68 150 50 150 0 100 50 0',
    APRON_LEFT: '0 0 180 120 0 120 0 0',
    APRON_RIGHT: '180 0 180 120 0 120 180 0'
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
                // gravity: { //global gravity
                //     y: 0.5
                // },
                plugins: {
                    attractors: true,
                },
                debug: true
            },
        },
        scene: [PlayGame]
    };
    game = new Phaser.Game(gameConfig);
    window.focus();
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
        this.load.image("trigger", "trigger_top.png");
        this.load.image("ball", "ball.png");
        this.load.image("pegas", "pegas.png");
        this.load.image("dome", "dome.png");
        this.load.image("wall1", "wall1.png");
        this.load.image("leftA", "left_a.png");
        this.load.image("rightA", "right_a.png");
        this.load.image("leftB", "left_B.png");
        this.load.image("rightB", "right_B.png");
        this.load.image("leftC", "left_C.png");
        this.load.image("rightC", "right_C.png");
        this.load.image("toggleLeft", "toggle_left.png");
        this.load.image("toggleRight", "toggle_right.png");
        this.load.json("shapes", "shapes.json");
    }

    // scaling sprite atau lainnya dengan mempertahankan ratio pixel
    scaleWithRatioPixel(offset) {
        return ((1 * window.devicePixelRatio) / 4) - offset;
    }

    create() {
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

        this.btnStart.on("pointerdown", this.enterGame, this)
    }

    // outer edges of pinball table
    boundary(x, y, width, height) {
        return this.matter.bodies.rectangle(x, y, width, height, {
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
    bumper(x, y) {
        let bumper = this.matter.bodies.circle(x, y, 25, {
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
    reset(x, width) {
        return this.matter.bodies.rectangle(x, 781, width, 2, {
            label: 'reset',
            isStatic: true,
            render: {
                fillStyle: '#fff'
            }
        });
    }

    enterGame() {
        // this.matter.world.disableGravity();
        var shapes = this.cache.json.get('shapes');
        this.matter.world.setBounds(0, 0);
        this.bgIntro.visible = false;
        this.btnStart.visible = false;
        test2 = this.matter.add.sprite(this.gameWidth / 1, this.gameHeight, "btnStart")
            .setScale(this.scaleWithRatioPixel(0.1)).setIgnoreGravity(true);

        // Dome
        this.dome = this.matter.add.sprite(this.gameWidth / 2, this.gameHeight / 15, "dome", null, {
                shape: shapes.dome,
                friction: 0,
                isStatic: true
            })
            .setScale(this.scaleWithRatioPixel(-0.02));

        // wall
        var boxA = this.add.rectangle(this.gameWidth, this.gameHeight / 1.2, 12.5 * dpr, this.gameHeight + 500, COLOR.OUTER);
        this.matter.add.gameObject(boxA, {
            isStatic: true,
            friction: 0,
        });
        this.boxB = this.add.rectangle(this.gameWidth - boxA.width, this.gameHeight, 12.5 * dpr, 100 * dpr, COLOR.OUTER);
        this.matter.add.gameObject(this.boxB, {
            isStatic: true,
            friction: 0,
        });

        this.boxTest = this.add.rectangle(this.gameWidth / 2, this.gameHeight / 2, 100, 250, COLOR.OUTER);

        this.matter.add.gameObject(this.boxTest, {
            isStatic: true,
            friction: 0,
            render: {
                lineColor: 0xfab005,
            }
        });
        this.boxTest.setOrigin(0, 0);
        // var boxC = this.add.rectangle(this.gameWidth - boxA.width - boxB.width, this.gameHeight / 1.2, 25, 900, COLOR.OUTER);
        // this.matter.add.gameObject(boxC, {
        //     isStatic: true
        // });

        // wall
        this.wall1 = this.matter.add.sprite(this.gameWidth - boxA.width - this.boxB.width - (9 * dpr), this.gameHeight / 1.9, "wall1", null, {
                shape: shapes.wall1,
                friction: 0,
                isStatic: true
            })
            .setScale(this.scaleWithRatioPixel(0));

        //obstacle
        this.leftA = this.matter.add.sprite(this.gameWidth / 2.2, this.gameHeight / 1.35, "leftA", null, {
                shape: shapes.left_a,
                friction: 0,
                isStatic: true
            })
            .setScale(this.scaleWithRatioPixel(0.1));

        this.leftB = this.matter.add.sprite(this.gameWidth / 3.25, this.gameHeight / 1.27, "leftB", null, {
                shape: shapes.left_b,
                friction: 0,
                isStatic: true
            })
            .setScale(this.scaleWithRatioPixel(0.1));

        this.leftC = this.matter.add.sprite(this.gameWidth / 4.5, this.gameHeight / 1.2, "leftC", null, {
                shape: shapes.left_c,
                friction: 0,
                isStatic: true
            })
            .setScale(this.scaleWithRatioPixel(0.1));

        this.rightA = this.matter.add.sprite(this.gameWidth / 1.8, this.gameHeight / 1.35, "rightA", null, {
                shape: shapes.right_a,
                friction: 0,
                isStatic: true
            })
            .setScale(this.scaleWithRatioPixel(0.1));

        this.rightB = this.matter.add.sprite(this.gameWidth / 1.45, this.gameHeight / 1.27, "rightB", null, {
                shape: shapes.right_b,
                friction: 0,
                isStatic: true
            })
            .setScale(this.scaleWithRatioPixel(0.1));

        this.rightC = this.matter.add.sprite(this.gameWidth / 1.3, this.gameHeight / 1.2, "rightC", null, {
                shape: shapes.right_c,
                friction: 0,
                isStatic: true
            })
            .setScale(this.scaleWithRatioPixel(0.1));

        this.toggleLeft = this.matter.add.sprite(this.gameWidth / 3, this.gameHeight / 1.13, "toggleLeft", null, {
                shape: shapes.toggle_left,
                label: 'paddleLeftComp',
                friction: 0,
                isStatic: true
            })
            .setScale(this.scaleWithRatioPixel(0.1));

        this.toggleRight = this.matter.add.sprite(this.gameWidth / 1.6, this.gameHeight / 1.11, "toggleRight", null, {
                shape: shapes.toggle_right,
                label: 'paddleRightComp',
                friction: 0,
                isStatic: true
            })
            .setScale(this.scaleWithRatioPixel(0.1));

        // ball
        console.log(this.matter.world);
        this.ball = this.matter.add.sprite(this.gameWidth - boxA.width, this.gameHeight / 3, "ball", null, {
            label: "balls",
            shape: {
                type: "circle"
            },
            isStatic: false,
            restitution: 0.8,
            // render: {
            //     visible: true,
            //     lineColor: 0xdee2e6,
            //     fillColor: 0xdee2e6,
            //     fillOpacity: 1,
            //     opacity: 1,
            //     // fillStyle: 0xdee2e6 //COLOR.PINBALL
            // }
        });
        this.ball.scale = 0.4;
        this.matter.body.scale(this.ball.body, 0.4, 0.4);
        // this.ball = this.add.circle(this.gameWidth - boxA.width, this.gameHeight / 3, 5, COLOR.PINBALL);
        // this.matter.add.gameObject(this.ball, {
        //     isStatic: false
        // });


        // this.matter.add.imageStack('ball', null, 0, 500, 50, 2, 0, 0, {
        //     mass: 5,
        //     ignorePointer: false
        // });

        // var sun = this.matter.add.image(400, 200, 'trigger', null, {
        //     shape: {
        //         type: 'circle',
        //         radius: 64
        //     },
        //     plugin: {
        //         attractors: [
        //             function (bodyA, bodyB) {
        //                 console.log("BODAYA");
        //                 return {
        //                     x: (bodyA.position.x - bodyB.position.x) * 0.000001,
        //                     y: (bodyA.position.y - bodyB.position.y) * 0.000001
        //                 };
        //             },
        //         ]
        //     }
        // });
        // this group lets paddle pieces overlap each other
        let paddleGroup = this.matter.body.nextGroup(true);

        // Left paddle mechanism
        let paddleLeft = {};
        paddleLeft.paddle = this.matter.add.trapezoid(170, 660, 20, 80, 0.33, {
            label: 'paddleLeft',
            angle: 1.57,
            chamfer: {},
            render: {
                fillStyle: 0xe64980,
                lineColor: 0xdee2e6,
            }
        });

        paddleLeft.brick = this.matter.add.rectangle(172, 672, 40, 80, {
            angle: 1.62,
            chamfer: {},
            render: {
                visible: true
            }
        });

        paddleLeft.comp = this.matter.body.create({
            label: 'paddleLeftComp',
            parts: [paddleLeft.paddle, paddleLeft.brick]
        });
        paddleLeft.hinge = this.matter.add.circle(142, 660, 5, {
            isStatic: true,
            render: {
                visible: true
            }
        });

        Object.values(paddleLeft).forEach((piece) => {
            piece.collisionFilter.group = paddleGroup
        });

        paddleLeft.con = this.matter.constraint.create({
            bodyA: paddleLeft.comp,
            pointA: {
                x: -29.5,
                y: -8.5
            },
            bodyB: paddleLeft.hinge,
            length: 0,
            stiffness: 0,
        });
        this.matter.world.add(this.matter.world,
            [paddleLeft.comp, paddleLeft.hinge, paddleLeft.con]);
        this.matter.body.rotate(paddleLeft.comp, 0.57, {
            x: 142,
            y: 660
        });


        let attracteeLabel = 'paddleLeftComp' //(side === 'left') ? 'paddleLeftComp' : 'paddleRightComp';
        // this.ball = this.matter.add.sprite(this.gameWidth - boxA.width, this.gameHeight / 3, "ball", null, {
        //         shape: shapes.ball,
        //         restitution: 0.8,
        //         friction: 0,
        //         mass: 2,
        //         inverseMass: 1,
        //         isStatic: false,
        //         plugin: {
        //             attractors: [
        //                 // stopper is always a, other body is b
        //                 function (a, b) {
        //                     if (b.label == attracteeLabel) {
        //                         return {
        //                             x: (a.position.x - b.position.x) * 2.002,
        //                             y: (a.position.y - b.position.y) * 2.002,
        //                         };
        //                     }
        //                     // if (b.label === attracteeLabel) {
        //                     //     let isPaddleUp = (side === 'left') ? isLeftPaddleUp : isRightPaddleUp;
        //                     //     let isPullingUp = (position === 'up' && isPaddleUp);
        //                     //     let isPullingDown = (position === 'down' && !isPaddleUp);
        //                     //     if (isPullingUp || isPullingDown) {
        //                     //         return {
        //                     //             x: (a.position.x - b.position.x) * PADDLE_PULL,
        //                     //             y: (a.position.y - b.position.y) * PADDLE_PULL,
        //                     //         };
        //                     //     }
        //                     // }
        //                 }
        //             ]
        //         }
        //     })
        //     .setScale(this.scaleWithRatioPixel(0.1));
        // this.matter.add.mouseSpring();

        //pegas (buat trigger di awal)
        // this.pegasTrigger = this.add.rectangle(this.gameWidth / 2, this.gameHeight / 1.25, 30 * dpr, 40 * dpr, 0xfab005);
        // this.matter.add.gameObject(this.pegasTrigger, {
        //     collisionFilter: {
        //         group: stopperGroup
        //     },
        //     isStatic: false,
        //     friction: 0,
        // });
        // this.pegasTrigger
        //     .setScale(this.scaleWithRatioPixel(0.1)).setIgnoreGravity(true);
        // this.pegasTrigger = this.matter.add.sprite(this.boxB.body.position.x, this.gameHeight / 1.25, "trigger", null, {
        //         // shape: shapes.trigger_top,
        //         friction: 0,
        //         isStatic: false,
        //     })
        //     .setScale(this.scaleWithRatioPixel(-0.12))
        //     .setIgnoreGravity(true);
        let pegasGroup = this.matter.body.nextGroup(true);
        this.pegasTrigger = {};
        let pegasimg = this.matter.add.image(this.boxB.body.position.x, this.gameHeight / 1.25, "trigger", null)
            .setScale(this.scaleWithRatioPixel(-0.12))
            .setIgnoreGravity(true);

        // this group lets paddle pieces overlap each other
        this.pegasTrigger.top = this.matter.bodies.rectangle(this.boxB.body.position.x, this.gameHeight / 1.25, 30, 25, {
            chamfer: {},
            plugin: {
                attractors: [
                    function (bodyA, bodyB) {
                        if (bodyB.label === "balls") {
                            console.log("DUARRR");
                            return {
                                x: (bodyA.position.x - bodyB.position.x) * 0.002,
                                y: (bodyA.position.y - bodyB.position.y) * 0.002
                            };
                        }
                    },
                ]
            },
        });
        // this.pegasTrigger.badan = this.matter.bodies.rectangle(this.boxB.body.position.x, this.pegasTrigger.top.position.y, 40, 90, {
        //     chamfer: {},
        // });
        // pegas.badan = this.matter.add.sprite(this.boxB.body.position.x, pegas.top.position.y, "pegas", null, {
        //         // shape: shapes.pegas,
        //         friction: 0,
        //         isStatic: false
        //     })
        //     .setScale(this.scaleWithRatioPixel(-0.3)).setIgnoreGravity(true);
        this.pegasTrigger.comp = this.matter.body.create({
            label: 'pegasComp',
            parts: [this.pegasTrigger.top], //, this.pegasTrigger.badan],
        });
        Object.values(this.pegasTrigger).forEach((piece) => {
            piece.collisionFilter.group = pegasGroup
        });
        pegasimg.setExistingBody(this.pegasTrigger.comp);

        //stop pegas waktu full charge
        // this.matter.overlap(this.pegasTrigger.comp, this.boxB.body, function () {
        //     console.log("nabrak coy");
        // });
        //make constraint from trigger and bottomFrame
        this.matter.add.mouseSpring();
        this.constraint = this.matter.constraint.create({
            bodyA: this.pegasTrigger.comp, //this.pegasTrigger.body,
            pointB: {
                x: 0,
                y: -100
            },
            bodyB: this.boxB.body,
            length: 30 * dpr,
            stiffness: 0.001,
            render: {
                lineColor: 0xfab005,
                lineThickness: 3,
            }
        });
        this.matter.world.add(this.constraint);
        // this.constraint = this.matter.add.constraint(this.pegasTrigger.body, this.boxB, 35 * dpr, 1, {
        //     render: {
        //         lineColor: 0xdee2e6,
        //         lineOpacity: 1,
        //         lineThickness: 5,
        //     }
        // });


        // let test2 = this.physics.add.sprite((window.innerWidth * window.devicePixelRatio) / 5, (window.innerHeight * window.devicePixelRatio) / 1.5, "btnStart")
        //     .setScale(0.4);
        // test.setImmovable();
        this.matter.world.add(this.matter.world, [
            // table boundaries (top, bottom, left, right)
            this.boundary(250, -30, 500, 100),
            this.boundary(250, 830, 500, 100),
            this.boundary(-30, 400, 100, 800),
            this.boundary(530, 400, 100, 800),

            // dome
            this.path(239, 86, PATHS.DOME),

            // pegs (left, mid, right)
            this.wall(140, 140, 20, 40, COLOR.INNER),
            this.wall(225, 140, 20, 40, COLOR.INNER),
            this.wall(310, 140, 20, 40, COLOR.INNER),

            // top bumpers (left, mid, right)
            this.bumper(105, 250),
            this.bumper(225, 250),
            this.bumper(345, 250),

            // bottom bumpers (left, right)
            this.bumper(165, 340),
            this.bumper(285, 340),

            // shooter lane wall
            this.wall(440, 520, 20, 560, COLOR.OUTER),

            // drops (left, right)
            this.path(25, 360, PATHS.DROP_LEFT),
            this.path(425, 360, PATHS.DROP_RIGHT),

            // slingshots (left, right)
            this.wall(120, 510, 20, 120, COLOR.INNER),
            this.wall(330, 510, 20, 120, COLOR.INNER),

            // out lane walls (left, right)
            this.wall(60, 529, 20, 160, COLOR.INNER),
            this.wall(390, 529, 20, 160, COLOR.INNER),

            // flipper walls (left, right);
            this.wall(93, 624, 20, 98, COLOR.INNER, -0.96),
            this.wall(357, 624, 20, 98, COLOR.INNER, 0.96),

            // aprons (left, right)
            this.path(79, 740, PATHS.APRON_LEFT),
            this.path(371, 740, PATHS.APRON_RIGHT),

            // reset zones (center, right)
            this.reset(225, 50),
            this.reset(465, 30)
        ]);
        // this.matter.body.scale(test.body, 2, 2);
        test2.body.immovable = true;
        this.ball.stiffness = 1;
        // test.setOrigin(0.5, 1);
        // console.log(`centerOfMassX: ${test.body.centerOfMass.x}`);
        // console.log(`centerOfMassY: ${test.body.centerOfMass.y}`);
        // test.body.position.x = test.body.centerOfMass.x;
        // test.body.position.y = test.body.centerOfMass.y;
        // this.pegasTrigger.body.customPivot = true;
        // this.pegasTrigger.body.pivotY = 0.5;
        // this.pegasTrigger.body.setSize
        // this.pegasTrigger.yOffset = 100;
        // this.pegasTrigger.xOffset = 0;
        // test.anchor.setTo(0.5, 0.5);
        // test.body.offset.y = 0;
        // this.ball.world.setGravity(180);
        // test2.setImmovable();
        // this.ball.setCollisionGroup(1);
        // this.ball.setCollidesWith(0);
        // test.setCollisionGroup(0);
        // test.setCollidesWith(1);
        // this.ball.setBounce(1);
        // this.ball.setGravityY(180);
        this.btnSpace = this.input.keyboard.addKey("SPACE");
        this.btnSpace.on("down", this.spaceHold, this);
        this.btnSpace.on("up", this.spaceHold2, this);
        this.leftBtn = this.input.keyboard.addKey("LEFT");
        this.leftBtn.on("down", this.leftHold, this);
        this.leftBtn.on("up", this.leftHold2, this);
        this.rightBtn = this.input.keyboard.addKey("RIGHT");
        this.rightBtn.on("down", this.rightHold, this);
        this.rightBtn.on("up", this.rightHold2, this);
        // this.physics.world.setFPS(120);
        // this.ball.setCollideWorldBounds(true);
        // this.physics.add.overlap(test, test2, function () {
        //     nubruk = true;
        // })
        // btnSpace.onDown.apply(this.spaceHold, this);
    }

    update() {
        // var btnSpace = this.input.keyboard.addKey("SPACE");
        if (this.pegasTrigger != null && test2 != null) {
            // this.boxTest.rotation += 90;
            // console.log(`${Math.atan2(test.x, test.y) * 180 / Math.PI}`);
            // this.physics.add.collider(this.ball, test);
            // this.physics.add.collider(test, test2);

            // var dist = Phaser.Math.Distance.BetweenPoints(this.pegasTrigger, test2);
            // console.log(dist);
            // test.moveTo = this.plugins.get('rexmovetoplugin').add(test, {
            //     speed: 1000 - (dist * 2)
            // })
            // this.pegasTrigger.setVelocityY(0);
            if (btnSpaceHold) {
                if (pegasScaleY < 0.15) {

                } else {
                    // pegasScaleY -= 0.005;
                    // test.scaleY = pegasScaleY;
                }
                if (!nubruk) {
                    // console.log("TIDAK NUBRUK");
                    this.constraint.length -= 1;
                    // test.setVelocityY(150);
                } else {
                    // pegasScaleY -= 0.005
                    // this.pegasTrigger.scaleY = pegasScaleY;
                    console.log("NUBRUK");
                }
                // console.log("SPACE HOLD");
            } else {
                // console.log("SPACE UNHOLD");
                nubruk = false;
                this.constraint.stiffness = 0.02;
                this.constraint.length = 350;
                pegasScaleY = 0.4
                // this.pegasTrigger.scaleY = 0.4;
                // if (this.pegasTrigger.moveTo != null) {
                //     this.pegasTrigger.moveTo.moveTo((window.innerWidth * window.devicePixelRatio) / 5, (window.innerHeight * window.devicePixelRatio) / 1.2);
                // }
            }


            // btnSpace.on("down", function () {
            //     test.setVelocityY(2000);
            // })
            // btnSpace.on("up", function () {
            //     test.setVelocityY(-2000);
            // })
        }
    }

    spaceHold() {
        btnSpaceHold = true;
    }

    spaceHold2() {
        btnSpaceHold = false;
    }

    leftHold() {
        this.matter.body.rotate(this.toggleLeft.body, -0.57);
    }

    leftHold2() {
        this.matter.body.rotate(this.toggleLeft.body, +0.57);
    }

    rightHold() {
        this.matter.body.rotate(this.toggleRight.body, 0.57);
    }

    rightHold2() {
        this.matter.body.rotate(this.toggleRight.body, -0.57);
    }


}