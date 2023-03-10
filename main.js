import {
    initializeApp
} from "firebase/app";
import {
    getAnalytics
} from "firebase/analytics";
import {
    getDatabase,
    ref,
    child,
    get
} from "firebase/database";
import {
    getFirestore,
    query,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    where,
    orderBy,
    limit,
    updateDoc
} from "firebase/firestore";

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
var currentTicket, userId, username;
let dpr = 2;//window.devicePixelRatio;
let scaleSprite;
let currentScore, highScore, bufferScore;
let fieldBumper, fieldBumper2;
let engine, world, render, pinball, stopperGroup;
let leftPaddle, leftUpStopper, leftDownStopper, isLeftPaddleUp;
let rightPaddle, rightUpStopper, rightDownStopper, isRightPaddleUp;
let isFalling = false;
let topLedOne = false,
    topLedTwo = false,
    topLedThree = false;
let leftLedOne = false,
    leftLedTwo = false,
    leftLedThree = false;
let puckOne = false,
    puckTwo = false,
    puckThree = false;
let t1 = false,
    t2 = false,
    t3 = false,
    t4 = false,
    t5 = false,
    t6 = false,
    t7 = false;
let logoLed = false;
let centerLed = false;
let joint = null;
let isBonus = false;
let lastScoreWidth = 0;
const delta = 1000 / 60;
const subSteps = 3;
const subDelta = delta / subSteps;
var matterTimeStep = 16.666;
var btnSpaceHold = false;
var isFirst = true;

//static variable
var OBSTACLE = 0xFFFF;

// The boxes don't collide with triangles (except if both are small).
var OBSTACLE_GROUP = -1;
var BALL_GROUP = -2;

// CONFIGURASI FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBdFMZoNwEWNqCOfUezoSB-TewpOBUfX98",
    authDomain: "mgoalindo---app.firebaseapp.com",
    databaseURL: "https://mgoalindo---app-default-rtdb.firebaseio.com",
    projectId: "mgoalindo---app",
    storageBucket: "mgoalindo---app.appspot.com",
    messagingSenderId: "909481590933",
    appId: "1:909481590933:web:a0626d75765bd850a5db9c",
    measurementId: "G-RLCM7JVYFY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

// Initialize Firestore Database and get document
const db = getFirestore(app);
const col = "pinball-m88-leaderboard";
const col2 = "kupon-pinball";
const colRef = collection(db, col);
const colRef2 = collection(db, col2);

async function playWithTicket() {
    try {
        // let status = await axios.get('/game/fortunewheel/start')
        //     .then(function (response) {
        //         if (response.data.status == 1) {
        //             return true
        //         } else {
        //             return false
        //         }
        //     })
        //     .catch(function (error) {
        //         console.log(error);
        //         return false
        //     })
        return true //status
    } catch (error) {
        console.error(error);
        throw error;
    }
}

window.onload = function () {
    let gameConfig = {
        type: Phaser.CANVAS,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "canvas",
            width: 305.5 * dpr,
            height: 624 * dpr,
        },
        dom: {
            createContainer: true
        },
        backgroundColor: 0x2A3141, //0xD30000,
        scene: [LobbyGame, InputData, PlayGame, Leaderboard, Loading]
    };
    var game = new Phaser.Game(gameConfig);
    window.focus();
}

class InputData extends Phaser.Scene {
    constructor() {
        super("InputData");
    }

    init() {
        window.mobileCheck = function () {
            let check = false;
            (function (a) {
                if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
            })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        };
        // init canvas size
        this.gameWidth = this.sys.game.scale.width
        this.gameHeight = this.sys.game.scale.height
        this.halfWidth = this.gameWidth / 2;
        this.halfHeight = this.gameHeight / 2;
    }

    preload() {
        this.load.path = "./src/assets/img/";
        this.load.image("bgDialog", "fieldvoucher1.png");
        this.load.image("okButton", "okButton.png");
        this.load.plugin('rexinputtextplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexinputtextplugin.min.js', true);
        this.load.path = "./src/assets/audio/";
        this.load.audio("clickedBtn", "click.mp3");
    }

    async create() {
        let click1 = true;
        let clicked = this.sound.add("clickedBtn");
        this.add.graphics().setDepth(0).fillStyle(0x000000, 0.8).fillRect(0, 0, this.gameWidth, this.gameHeight);
        var dialogBg = this.add.sprite(this.halfWidth, this.halfHeight, "bgDialog");
        dialogBg.setScale(0.35 * dpr);
        this.inputText = this.add.rexInputText(this.halfWidth, this.halfHeight + (35 * dpr), 200 * dpr, 35 * dpr, {
            // Style properties
            align: "center",
            fontSize: `${14 * dpr}px`,
            color: '#ffffff',
            fontStyle: 'bold',
            border: 0,
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            outline: 'none',
            direction: 'ltr',
            placeholder: 'MASUKKAN USERNAME'
        });

        this.inputText2 = this.add.rexInputText(this.halfWidth, this.halfHeight + (88 * dpr), 200 * dpr, 35 * dpr, {
            // Style properties
            align: "center",
            fontSize: `${14 * dpr}px`,
            fontStyle: 'bold',
            color: '#ffffff',
            border: 0,
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            outline: 'none',
            direction: 'ltr',
            type: 'number',
            placeholder: 'MASUKKAN NO. HP'
        });

        let inputText = this.inputText;
        this.inputText.on('textchange', function (inputs, e) {
            inputText.setText(inputs.text.toString().toUpperCase());
        }, this);

        let inputText2 = this.inputText2;
        this.inputText2.on('textchange', function (inputs, e) {
            inputText2.setText(inputs.text.toString().toUpperCase());
        }, this);

        let world = this;
        this.btnOk = this.add.sprite(this.halfWidth, this.halfHeight + (140 * dpr), "okButton");
        this.btnOk.setScale(0.2 * dpr);
        this.btnOk.setInteractive();
        this.btnOk.on("pointerover", function () {
        });
        this.btnOk.on("pointerout", function () {
        });
        this.btnOk.on("pointerdown", async function () {
            if (click1) {
                click1 = false;
                clicked.play();
                let txt = inputText.text
                let txt2 = inputText2.text
                // GET KODE DATA
                if (txt != "" && txt != undefined && txt != null) {
                    if (txt2 != "" && txt2 != undefined && txt2 != null) {
                        username = txt;
                        userId = txt2;

                        //GET USER DOC
                        let docRef = doc(db, col, String(userId));
                        let q = query(colRef, where("name", "==", String(username)));
                        let data = await getDocs(q);
                        if (data.size == 0 ) {
                            let q = query(colRef, where("notelp", "==", String(userId)));
                            let data = await getDocs(q);
                            if (data.size == 0 ) {
                                await setDoc(docRef, {
                                    name: username,
                                    notelp: userId,
                                    score: 0,
                                    date: tglIndonesia(),
                                    timestamp: Math.floor(Date.now() / 1000),
                                }).then(()=>{
                                    click1 = true;
                                    world.scene.resume("LobbyGame");
                                    world.scene.stop("InputData");
                                });
                            } else {
                                click1 = true;
                                alert(`Nomor ${userId} sudah terdaftar`);
                            }
                        } else {
                            click1 = true;
                            alert(`Nama ${username} sudah terdaftar`);
                        }
                    } else {
                        click1 = true;
                        alert("Email tidak boleh kosong!");
                    }
                } else {
                    click1 = true;
                    alert("Nama tidak boleh kosong!");
                }
            }
        });
    }
}

class LobbyGame extends Phaser.Scene {
    constructor() {
        super("LobbyGame");
    }

    // scaling sprite atau lainnya dengan mempertahankan ratio pixel
    scaleWithRatioPixel(offset) {
        return ((1 * dpr) / 4) - offset;
    }

    init() {
        scaleSprite = this.scaleWithRatioPixel(0);

        window.mobileCheck = function () {
            let check = false;
            (function (a) {
                if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
            })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        };
        // init canvas size
        this.gameWidth = this.sys.game.scale.width
        this.gameHeight = this.sys.game.scale.height
        this.halfWidth = this.gameWidth / 2;
        this.halfHeight = this.gameHeight / 2;
    }

    preload() {
        /*
         *Load ASSET
         */
        this.load.path = "./src/assets/img/";
        this.load.image("btnStart", "btnStart.png");
        this.load.image("bgIntro", "bg_intro1.jpg");
        this.load.image("bgStart", "bg_start.png");

        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(this.halfWidth - (320 / 2), this.halfHeight, 320, 50);

        var textLoading = this.make.text({
            x: this.halfWidth,
            y: this.halfHeight - (25 * dpr),
            text: "Loading...",
            style: {
                fontFamily: "Arial Black",
                fontSize: 12 * dpr,
                fill: "#FFFFFF"
            }
        });

        var percentText = this.make.text({
            x: this.halfWidth,
            y: this.halfHeight + (6.5 * dpr),
            text: "0%",
            style: {
                fontFamily: "Arial Black",
                fontSize: 12 * dpr,
                fill: "#FFFFFF"
            }
        });

        var detailText = this.make.text({
            x: this.halfWidth,
            y: this.halfHeight + (30 * dpr),
            text: "",
            style: {
                fontFamily: "Arial",
                fontSize: 8 * dpr,
                fill: "#FFFFFF"
            }
        });

        textLoading.setOrigin(0.5, 0.5);
        percentText.setOrigin(0.5, 0.5);
        detailText.setOrigin(0.5, 0.5);

        this.load.on("progress", function (value) {
            progressBar.clear();
            percentText.setText(parseInt(value * 100) + "%");
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect((this.halfWidth - (300 / 2)), this.halfHeight + 10, 300 * value, 30);
        });
        this.load.on('fileprogress', function (file) {
            detailText.setText('Loading asset: ' + file.key);
        });
        let ww = this;
        this.load.on("complete", function () {
            detailText.setText('Loading user data...');
            progressBar.destroy();
            progressBox.destroy();
            textLoading.destroy();
            percentText.destroy();
            ww.createPlay();
        });
    }

    async createPlay() {
        this.bgIntro = this.add.sprite(this.gameWidth / 2, this.gameHeight / 2, "bgIntro");
        this.btnStart = this.add.sprite(this.gameWidth / 2, this.gameHeight / 1.5, "btnStart")
            .setScale(this.scaleWithRatioPixel(0.1));
        this.btnStart.setInteractive() // impartant for make sprite or image event
        let btnStart = this.btnStart;
        let btnStartOver = this.scaleWithRatioPixel(0);
        let btnStartOut = this.scaleWithRatioPixel(0.1);
        let ww = this;
        this.bgIntro.setDisplaySize(this.gameWidth, this.gameHeight);

        let clickedAgain = true;
        this.btnStart.on("pointerover", function () {
            if (clickedAgain) {
                btnStart.setScale(btnStartOver);
            }
        });
        this.btnStart.on("pointerout", function () {
            if (clickedAgain) {
                btnStart.setScale(btnStartOut);
            }
        });
        this.btnStart.on("pointerdown", function () {
            if (clickedAgain) {
                clickedAgain = false;
                playWithTicket()
                    .then(val => {
                        if (val) {
                            clickedAgain = true;
                            ww.scene.launch("PlayGame");
                            ww.scene.stop("LobbyGame");
                        } else {
                            clickedAgain = true;
                            alert("Ticket Kamu Habis");
                            // console.log("Tiket Habis");
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        clickedAgain = true;
                    });
            }
        });
        this.scene.pause("LobbyGame");
        this.scene.launch("InputData");
    }
}

class PlayGame extends Phaser.Scene {
    constructor() {
        super("PlayGame");
    }

    // scaling sprite atau lainnya dengan mempertahankan ratio pixel
    scaleWithRatioPixel(offset) {
        return ((1 * dpr) / 4) - offset;
    }

    init() {
        //init scale window
        scaleSprite = this.scaleWithRatioPixel(0);

        window.mobileCheck = function () {
            let check = false;
            (function (a) {
                if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
            })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        };
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

        if (!window.mobileCheck()) {

        }
    }

    preload() {
        if (isFirst) {
            var progressBar = this.add.graphics();
            var progressBox = this.add.graphics();
            progressBox.fillStyle(0x222222, 0.8);
            progressBox.fillRect(this.halfWidth - (320 / 2), this.halfHeight, 320, 50);

            var textLoading = this.make.text({
                x: this.halfWidth,
                y: this.halfHeight - (25 * dpr),
                text: "Loading...",
                style: {
                    fontFamily: "Arial Black",
                    fontSize: 12 * dpr,
                    fill: "#FFFFFF"
                }
            });

            var percentText = this.make.text({
                x: this.halfWidth,
                y: this.halfHeight + (6.5 * dpr),
                text: "0%",
                style: {
                    fontFamily: "Arial Black",
                    fontSize: 12 * dpr,
                    fill: "#FFFFFF"
                }
            });

            var detailText = this.make.text({
                x: this.halfWidth,
                y: this.halfHeight + (30 * dpr),
                text: "",
                style: {
                    fontFamily: "Arial",
                    fontSize: 8 * dpr,
                    fill: "#FFFFFF"
                }
            });

            textLoading.setOrigin(0.5, 0.5);
            percentText.setOrigin(0.5, 0.5);
            detailText.setOrigin(0.5, 0.5);

            this.load.on("progress", function (value) {
                progressBar.clear();
                percentText.setText(parseInt(value * 100) + "%");
                progressBar.clear();
                progressBar.fillStyle(0xffffff, 1);
                progressBar.fillRect((this.halfWidth - (300 / 2)), this.halfHeight + 10, 300 * value, 30);
            });
            this.load.on('fileprogress', function (file) {
                detailText.setText('Loading asset: ' + file.key);
            });
            this.load.on("complete", function () {
                progressBar.destroy();
                progressBox.destroy();
                textLoading.destroy();
                percentText.destroy();
            });
            // this.load.plugin('rexmovetoplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexmovetoplugin.min.js', true);

            /*
             *Load ASSET
             */
            this.load.path = "./src/assets/img/";
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
            this.load.image("leftAhit", "left_a_hit.png");
            this.load.image("rightAhit", "right_a_hit.png");
            this.load.image("leftB", "left_b.png");
            this.load.image("rightB", "right_b.png");
            this.load.image("leftBhit", "left_b_hit.png");
            this.load.image("rightBhit", "right_b_hit.png");
            this.load.image("leftC", "left_c.png");
            this.load.image("rightC", "right_c.png");
            this.load.image("leftD", "left_d.png");
            this.load.image("rightD", "right_d.png");
            this.load.image("toggleLeft", "toggle_left.png");
            this.load.image("toggleRight", "toggle_right.png");
            this.load.image("bumper100", "bumper_100.png");
            this.load.image("bumper200", "bumper_200.png");
            this.load.image("bumper500", "bumper_500.png");
            this.load.image("bumper100hit", "bumper_100_hit.png");
            this.load.image("bumper200hit", "bumper_200_hit.png");
            this.load.image("bumper500hit", "bumper_500_hit.png");
            this.load.image("bumper5k", "bumper_5k.png");
            this.load.image("bumper10k", "bumper_10k.png");
            this.load.image("bumper20k", "bumper_20k.png");
            this.load.image("bumper5khit", "bumper_5k_hit.png");
            this.load.image("bumper10khit", "bumper_10k_hit.png");
            this.load.image("bumper20khit", "bumper_20k_hit.png");
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
            this.load.image("triangleOn", "triangle_on.png");
            this.load.image("triangleOff", "triangle_off.png");
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
            this.load.path = "./src/assets/font/";
            this.load.bitmapFont(
                'kanitBlack',
                'Kanit-Black.png',
                'Kanit-Black.xml'
            );
        }
    }

    async create() {
        console.log(`DPR: ${dpr}`);
        console.log(this.scaleWithRatioPixel(0));
        console.log(window.devicePixelRatio);
        // Init World
        this.gravity = 3; // 3 is normal
        // this.world = planck.World(planck.Vec2(0, this.gravity));
        this.world = planck.World({
            gravity: planck.Vec2(0, this.gravity),
            allowSleep: true
        });
        currentScore = 0;
        bufferScore = 0;

        this.events.on("resume", (scene, data) => {
            if (data.reset) {
                this.load.removeAllListeners();
                this.input.removeAllListeners();
                this.world.off("begin-contact");
                this.world.off("end-contact");
                this.scene.restart();
                location.reload();
                console.log("RESTART");
            }
        })

        this.shapes = this.cache.json.get('shapes');

        this.add.image(this.halfWidth - (3 * dpr), this.halfHeight + (11 * dpr), 'bgPinball', null, {
            isStatic: true,
            isSensor: true,
        })
            .setScale(0.25 * dpr).setDepth(0);

        this.leaderboard = this.add.text((5 * dpr), (5 * dpr), 'LEADERBOARD', {
            fill: '#F7D013',
            align: "center",
            fontFamily: "Arial Black",
            fontSize: 12 * dpr,
        }).setDepth(2);
        this.leaderboard.setInteractive();
        this.leaderboard.on('pointerdown', () => {
            let scoreReformated = String(currentScore).replace(',', '');
            let score = parseInt(scoreReformated);
            this.scene.launch("Leaderboard", {
                isGameOver: false,
                userId: userId,
                name: username,
                score: score,
            });
            this.scene.pause("PlayGame");
        });

        this.textScore = this.make.text({
            x: this.halfWidth + (100 * dpr),
            y: 20 * dpr,
            text: "0",
            padding: {
                left: 5,
                right: 5,
                top: 5,
                bottom: 5
            },
            style: {
                align: "center",
                fontFamily: "Arial Black",
                fontSize: 12 * dpr,
                fill: "#FFFFFF"
            }
        }).setDepth(2).setOrigin(0.5, 0.5);
        this.scoreBox = this.add.graphics().setDepth(1.5);
        this.scoreBox.fillStyle(0xFF0000, 0.8);

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
        this.add.bitmapText(this.halfWidth - (90 * dpr), this.halfHeight + (150 * dpr), "kanitBlack", "100", 20 + (20 * scaleSprite)).setAngle(90);
        this.add.bitmapText(this.halfWidth + (95 * dpr), this.halfHeight + (150 * dpr), "kanitBlack", "100", 20 + (20 * scaleSprite)).setAngle(90);
        this.add.bitmapText(this.halfWidth - (120 * dpr), this.halfHeight + (250 * dpr), "kanitBlack", "500", 20 + (20 * scaleSprite)).setAngle(90);
        this.add.bitmapText(this.halfWidth + (125 * dpr), this.halfHeight + (250 * dpr), "kanitBlack", "500", 20 + (20 * scaleSprite)).setAngle(90);
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
        this.bumperLeftA = new OtherBumper(this, this.halfWidth - (20 * dpr), this.halfHeight + (105 * dpr), "leftA", this.shapes.leftA.fixtures[0].vertices, false, true, 0.5, "leftA", OBSTACLE_GROUP, 0.5, 1);
        this.bumperRightA = new OtherBumper(this, this.halfWidth + (15 * dpr), this.halfHeight + (105 * dpr), "rightA", this.shapes.rightA.fixtures[0].vertices, false, true, 0.5, "rightA", OBSTACLE_GROUP, 0.5, 1);
        this.bumperLeftB = new OtherBumper(this, this.halfWidth - (70 * dpr), this.halfHeight + (172 * dpr), "leftB", this.shapes.leftB.fixtures[0].vertices, false, true, 0.5, "leftB", OBSTACLE_GROUP, 0.7, 1);
        this.bumperRightB = new OtherBumper(this, this.halfWidth + (60 * dpr), this.halfHeight + (172 * dpr), "rightB", this.shapes.rightB.fixtures[0].vertices, false, true, 0.5, "rightB", OBSTACLE_GROUP, 0.7, 1);
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

        this.paddleWall1 = new ChainShape(this, this.halfWidth - (91 * dpr), this.halfHeight + (186 * dpr), "leftC", this.shapes.left_c.fixtures[0].vertices, false, true, false, 0.45, "leftC", OBSTACLE_GROUP, 0.3, 1);
        this.paddleWall1 = new ChainShape(this, this.halfWidth + (80 * dpr), this.halfHeight + (186 * dpr), "rightC", this.shapes.right_c.fixtures[0].vertices, false, true, false, 0.45, "rightC", OBSTACLE_GROUP, 0.3, 1);
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
        this.puckHandler = new Rectangle(this, this.halfWidth + (98 * dpr), this.halfHeight - (149 * dpr), "", (35 * dpr), (5 * dpr), 0.55, false, true, true, "puckHandler", null, 0, 0);
        this.puckHandler2 = new Rectangle(this, this.halfWidth + (98 * dpr), this.halfHeight - (149 * dpr), "", (35 * dpr), (5 * dpr), 0.55, false, true, true, "puckHandler2", 2, 0, 0);

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

        // Triangle Way LED
        this.tri1 = new Rectangle(this, this.halfWidth - (85 * dpr), this.halfHeight - (224 * dpr), "triangleOff", (15 * dpr), (15 * dpr), 0.55, false, false, true, "t1", null, 0, 0);
        this.tri1.b.setAngle(0.80);
        this.tri2 = new Rectangle(this, this.halfWidth - (102 * dpr), this.halfHeight - (209 * dpr), "triangleOff", (15 * dpr), (15 * dpr), 0.55, false, false, true, "t2", null, 0, 0);
        this.tri2.b.setAngle(0.70);
        this.tri3 = new Rectangle(this, this.halfWidth - (118 * dpr), this.halfHeight - (190 * dpr), "triangleOff", (15 * dpr), (15 * dpr), 0.55, false, false, true, "t3", null, 0, 0);
        this.tri3.b.setAngle(0.60);
        this.tri4 = new Rectangle(this, this.halfWidth - (128 * dpr), this.halfHeight - (168 * dpr), "triangleOff", (15 * dpr), (15 * dpr), 0.55, false, false, true, "t4", null, 0, 0);
        this.tri4.b.setAngle(0.45);
        this.tri5 = new Rectangle(this, this.halfWidth - (130 * dpr), this.halfHeight - (145 * dpr), "triangleOff", (15 * dpr), (15 * dpr), 0.55, false, false, true, "t5", null, 0, 0);
        this.tri5.b.setAngle(0);
        this.tri6 = new Rectangle(this, this.halfWidth - (128 * dpr), this.halfHeight - (125 * dpr), "triangleOff", (15 * dpr), (15 * dpr), 0.55, false, false, true, "t6", null, 0, 0);
        this.tri6.b.setAngle(-0.30);
        this.tri7 = new Rectangle(this, this.halfWidth - (122 * dpr), this.halfHeight - (105 * dpr), "triangleOff", (15 * dpr), (15 * dpr), 0.55, false, false, true, "t7", null, 0, 0);
        this.tri7.b.setAngle(-0.45);

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
        this.circleTriggerCloseLeft = new Circle(this, this.halfWidth - (127 * dpr), this.halfHeight + (230 * dpr), "", (12 * dpr), false, false, true, "triggerCloseLeft");
        this.circleTriggerCloseRight = new Circle(this, this.halfWidth + (117 * dpr), this.halfHeight + (230 * dpr), "", (12 * dpr), false, false, true, "triggerCloseRight");
        this.circleTriggerCloseLeft.b.setActive(false);
        this.circleTriggerCloseRight.b.setActive(false);
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
            // console.log("LEFT BTN DOWN");
        }, this);
        this.leftBtn.on("up", function () {
            leftPaddle.setMotorSpeed(20);
            // console.log("LEFT BTN UP");
        }, this);

        let rightPaddle = this.jointRightPaddle;
        this.rightBtn = this.input.keyboard.addKey("RIGHT");
        this.rightBtn.on("down", function () {
            rightPaddle.setMotorSpeed(20);
            // console.log("RIGHT BTN DOWN");
        }, this);

        this.rightBtn.on("up", function () {
            rightPaddle.setMotorSpeed(-20);
            // console.log("RIGHT BTN UP");
        }, this);

        // make controller virtual
        let style = {
            fontFamily: "Arial Black",
            fontSize: 8 * dpr,
            fill: "#FFFFFF"
        }
        this.game.input.addPointer();
        this.game.input.addPointer();
        let leftJoy = this.add.rectangle(0, 0, this.halfWidth, this.gameHeight, 0xfffffff, 0)
            .setDepth(2)
            .setInteractive()
            .setOrigin(0, 0)
            .on('pointerdown', function (e) {
                leftPaddle.setMotorSpeed(-20);
            })
            .on('pointerup', function (e) {
                leftPaddle.setMotorSpeed(20);
            });

        let rightJoy = this.add.rectangle(this.halfWidth, 0, this.halfWidth, this.gameHeight, 0xfffffff, 0)
            .setDepth(2)
            .setInteractive()
            .setOrigin(0, 0)
            .on('pointerdown', function (e) {
                rightPaddle.setMotorSpeed(20);
            })
            .on('pointerup', function (e) {
                rightPaddle.setMotorSpeed(-20);
            });

        this.pullJoy = this.add.rectangle(0, 0, this.gameWidth, this.gameHeight, 0xfffffff, 0)
            .setDepth(2)
            .setInteractive()
            .setOrigin(0, 0)
            .on('pointerdown', function (e) {
                btnSpaceHold = true;
                triggerPer.setMaxMotorForce(-5);
            })
            .on('pointerup', function (e) {
                btnSpaceHold = false;
                triggerPer.setMaxMotorForce(-200);
            });
        // Testing with mouse clik for ball
        // let world = this;
        // let ball = this.ball;
        // let bodyA = this.ball.b;
        // let bodyB = this.ball.b;
        // let target = this.ball.b.getWorldCenter();
        // this.input.on('pointerdown', function (pointer) {

        //     let dummyBody = world.world.createBody();
        //     // ball.ball2Bridge(planck.Vec2(pointer.x / world.scaleFactor, pointer.y / world.scaleFactor));
        //     joint = world.world.createJoint(planck.MouseJoint({
        //         maxForce: 1000,
        //     }, dummyBody, bodyA, planck.Vec2.clone(planck.Vec2(pointer.x / world.scaleFactor, pointer.y / world.scaleFactor))));
        //     // joint = world.world.createJoint(planck.PulleyJoint({
        //     //     localAnchorB: planck.Vec2(pointer.x / world.scaleFactor, pointer.y / world.scaleFactor),
        //     // }));

        //     console.log(dummyBody.getPosition());
        //     // console.log(`${pointer.x}, ${pointer.y}`);
        // }, this);

        // this.input.on('pointerup', function (pointer) {
        //     world.world.destroyJoint(joint);
        // }, this);
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
                    ww.gameOver();
                    setTimeout(function () {
                        let x = (ww.halfWidth / ww.scaleFactor) + (138 * dpr / ww.scaleFactor);
                        let y = ww.halfHeight / ww.scaleFactor;
                        ball.ball2Bridge(planck.Vec2(x, y));
                        ww.closeBegin.b.setActive(false);
                        ww.closeBegin.setAlpha(0);
                        ww.pullJoy.setInteractive();
                    }, 1);
                }
                // if (labelBodyA == "wall4" && labelBodyB == "ballss") {
                //     // console.log(labelBodyA);
                // }

                // if (labelBodyA == "trigger" && labelBodyB == "ballss") {
                //     ball.b.setPosition(ball.b.getPosition());
                //     console.log("hap2");
                // }

                // balls contact with bumper for getting score
                if (labelBodyA == "bumper100" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        if (!isBonus) {
                            bufferScore += 100
                            ww.bumper100.setTexture("bumper100hit");
                            bodyA.setUserData({
                                label: labelBodyA,
                                isScore: false
                            });
                        } else {
                            bufferScore += 5000
                            ww.bumper100.setTexture("bumper5khit");
                            bodyA.setUserData({
                                label: labelBodyA,
                                isScore: false
                            });
                        }
                    }
                }
                if (labelBodyA == "bumper200" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        if (!isBonus) {
                            bufferScore += 200
                            ww.bumper200.setTexture("bumper200hit");
                            bodyA.setUserData({
                                label: labelBodyA,
                                isScore: false
                            });
                        } else {
                            bufferScore += 10000
                            ww.bumper200.setTexture("bumper10khit");
                            bodyA.setUserData({
                                label: labelBodyA,
                                isScore: false
                            });
                        }
                    }
                }
                if (labelBodyA == "bumper500" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        if (!isBonus) {
                            bufferScore += 500;
                            ww.bumper500.setTexture("bumper500hit");
                            bodyA.setUserData({
                                label: labelBodyA,
                                isScore: false
                            });
                        } else {
                            bufferScore += 20000
                            ww.bumper500.setTexture("bumper20khit");
                            bodyA.setUserData({
                                label: labelBodyA,
                                isScore: false
                            });
                        }
                    }
                }


                if (labelBodyA == "leftA" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        bufferScore += 100;
                        ww.bumperLeftA.setTexture("leftAhit");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "rightA" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        bufferScore += 100;
                        ww.bumperRightA.setTexture("rightAhit");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "leftB" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        bufferScore += 100;
                        ww.bumperLeftB.setTexture("leftBhit");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "rightB" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        bufferScore += 100;
                        ww.bumperRightB.setTexture("rightBhit");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }

                // Triangle Ways LED
                if (labelBodyA == "t1" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        t1 = true;
                        ww.tri1.setTexture("triangleOn");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "t2" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        t2 = true;
                        ww.tri2.setTexture("triangleOn");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "t3" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        t3 = true;
                        ww.tri3.setTexture("triangleOn");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "t4" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        t4 = true;
                        ww.tri4.setTexture("triangleOn");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "t5" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        t5 = true;
                        ww.tri5.setTexture("triangleOn");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "t6" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        t6 = true;
                        ww.tri6.setTexture("triangleOn");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "t7" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        t7 = true;
                        ww.tri7.setTexture("triangleOn");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
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
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }

                    setTimeout(function () {
                        ball.ball2Bridge(position);
                        // ball.stopper();
                        ball.b.setActive(false);
                        ww.circleTriggerCloseLeft.b.setActive(true);
                    }, 1);
                    setTimeout(function () {
                        ball.b.setActive(true);
                        ball.launchBall();
                    }, 2500);
                }
                if (labelBodyA == "stopperRight" && labelBodyB == "ballss") {
                    let scale = ww.scaleFactor;
                    let pos = ww.stopperRight.b.getPosition();
                    let x = pos.x;
                    let y = pos.y - (15 * dpr / scale);
                    let position = planck.Vec2(x, y);
                    if (dataBodyA.isScore) {
                        bufferScore += 500;
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }

                    setTimeout(function () {
                        ball.ball2Bridge(position);
                        // ball.stopper();
                        ball.b.setActive(false);
                        ww.circleTriggerCloseRight.b.setActive(true);
                    }, 1);
                    setTimeout(function () {
                        ball.b.setActive(true);
                        ball.launchBall();
                    }, 2500);
                }
                if (labelBodyA == "ballss" && labelBodyB == "triggerClose") {
                    setTimeout(function () {
                        ww.closeBegin.b.setActive(true);
                        ww.closeBegin.setAlpha(1);
                        ww.pullJoy.disableInteractive();
                        // ww.createBeginStop();
                    }, 1);
                } else if (labelBodyA == "triggerClose" && labelBodyB == "ballss") {
                    setTimeout(function () {
                        ww.closeBegin.b.setActive(true);
                        ww.closeBegin.setAlpha(1);
                        ww.pullJoy.disableInteractive();
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
                            I: 1 //make body cant rotate
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
                            I: 0 //make body cant rotate
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
                    isBonus = true;
                    ww.bumper100.setTexture("bumper5k");
                    ww.bumper200.setTexture("bumper10k");
                    ww.bumper500.setTexture("bumper20k");

                    setTimeout(function () {
                        ww.fieldBonus.b.setActive(false);
                        ww.fieldBonus.b.m_fixtureList.setRestitution(1);
                        ww.enterBonus2.setAlpha(0);
                        ww.fieldBonus.setAlpha(1);
                        ww.bonus.setAlpha(0);
                        ww.bumper100.setTexture("bumper100");
                        ww.bumper200.setTexture("bumper200");
                        ww.bumper500.setTexture("bumper500");
                        isBonus = false;
                    }, 5000);
                }

                //Arrow Led Bridge
                if (labelBodyA == "arrowLedBridge1" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        ww.arrowLedBridge1.setTexture("arrowLedBridge2On");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "arrowLedBridge2" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        ww.arrowLedBridge2.setTexture("arrowLedBridge2On");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "arrowLedBridge3" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        ww.arrowLedBridge3.setTexture("arrowLedBridge3On");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "arrowLedBridge4" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        ww.arrowLedBridge4.setTexture("arrowLedBridge4On");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "arrowLedBridge5" && labelBodyB == "ballss") {
                    if (dataBodyA.isScore) {
                        ww.arrowLedBridge5.setTexture("arrowLedBridge5On");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                        ww.checkTopLed();
                    }
                }

                // Puck contact with puckHandler2
                if (labelBodyA == "puck1" && labelBodyB == "puckHandler2") {
                    if (dataBodyA.isScore) {
                        puckOne = true;
                        ww.puckLed1.setTexture("puckLedOn");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "puck2" && labelBodyB == "puckHandler2") {
                    if (dataBodyA.isScore) {
                        puckTwo = true;
                        ww.puckLed2.setTexture("puckLedOn");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
                    }
                }
                if (labelBodyA == "puck3" && labelBodyB == "puckHandler2") {
                    if (dataBodyA.isScore) {
                        puckThree = true;
                        ww.puckLed3.setTexture("puckLedOn");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: false
                        });
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
                        if (!isBonus) {
                            ww.bumper100.setTexture("bumper100");
                        } else {
                            ww.bumper100.setTexture("bumper5k");
                        }
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }
                if (labelBodyA == "bumper200" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        if (!isBonus) {
                            ww.bumper200.setTexture("bumper200");
                        } else {
                            ww.bumper200.setTexture("bumper10k");
                        }
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }
                if (labelBodyA == "bumper500" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        if (!isBonus) {
                            ww.bumper500.setTexture("bumper500");
                        } else {
                            ww.bumper500.setTexture("bumper20k");
                        }
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }

                if (labelBodyA == "leftA" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        ww.bumperLeftA.setTexture("leftA");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }
                if (labelBodyA == "rightA" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        ww.bumperRightA.setTexture("rightA");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }
                if (labelBodyA == "leftB" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        ww.bumperLeftB.setTexture("leftB");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }
                if (labelBodyA == "rightB" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        ww.bumperRightB.setTexture("rightB");
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }

                // Ball contact with stopper and close the field
                if (labelBodyA == "stopperLeft" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }
                if (labelBodyA == "stopperRight" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }

                // Ball contact with stopper and close the field Trigger
                if (labelBodyA == "triggerCloseLeft" && labelBodyB == "ballss") {
                    setTimeout(function () {
                        ww.closeLeft.b.setActive(true);
                        ww.closeLeft.setAlpha(1);
                        // ww.createLeftStop();
                    }, 1);
                }
                if (labelBodyA == "triggerCloseRight" && labelBodyB == "ballss") {
                    setTimeout(function () {
                        ww.closeRight.b.setActive(true);
                        ww.closeRight.setAlpha(1);
                        // ww.createRigthStop();
                    }, 1);
                }


                // Triangle Ways LED
                if (labelBodyA == "t1" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                        ww.checkTopLed();
                    }
                }
                if (labelBodyA == "t2" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }
                if (labelBodyA == "t3" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }
                if (labelBodyA == "t4" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }
                if (labelBodyA == "t5" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }
                if (labelBodyA == "t6" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                    }
                }
                if (labelBodyA == "t7" && labelBodyB == "ballss") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                        ww.checkTopLed();
                    }
                }

                // Puck contact with puckHandler2
                if (labelBodyA == "puck1" && labelBodyB == "puckHandler2") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                        ww.checkTopLed();
                    }
                }
                if (labelBodyA == "puck2" && labelBodyB == "puckHandler2") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
                        ww.checkTopLed();
                    }
                }
                if (labelBodyA == "puck3" && labelBodyB == "puckHandler2") {
                    if (!dataBodyA.isScore) {
                        bodyA.setUserData({
                            label: labelBodyA,
                            isScore: true
                        });
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
        this.add.rectangle(this.halfWidth + (145 * dpr), this.halfHeight + (278 * dpr), (30 * dpr), (75 * dpr), 0x1C1A1A);
        this.ball = new Circle(this, this.halfWidth + (138 * dpr), this.halfHeight + (25 * dpr), "ball", 7 * dpr, true, true, false, "ballss", BALL_GROUP, 1);
        // this.ball1 = new Circle(this, this.halfWidth + (145 * dpr), this.halfHeight + (278 * dpr), "ball", 7 * dpr, false, false, false, "ballss1", null, 1);
        // this.ball2 = new Circle(this, this.halfWidth + (145 * dpr), this.halfHeight + (260 * dpr), "ball", 7 * dpr, false, false, false, "ballss2", null, 1);
    }

    checkTopLed() {
        let ww = this;
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

        if (puckOne && puckTwo && puckThree) {
            puckOne = false;
            puckTwo = false;
            puckThree = false;
            setTimeout(function () {
                ww.puckLed1.setTexture("puckLedOff");
                bufferScore += 5000;
            }, 100);
            setTimeout(function () {
                ww.puckLed2.setTexture("puckLedOff");
            }, 300);
            setTimeout(function () {
                ww.puckLed3.setTexture("puckLedOff");
            }, 600);
        }

        if (t1 && t2 && t3 && t4 && t5 && t6 && t7) {
            t1 = false;
            t2 = false;
            t3 = false;
            t4 = false;
            t5 = false;
            t6 = false;
            t7 = false;

            setTimeout(function () {
                ww.tri1.setTexture("triangleOff");
                bufferScore += 1000;
            }, 100);
            setTimeout(function () {
                ww.tri2.setTexture("triangleOff");
            }, 300);
            setTimeout(function () {
                ww.tri3.setTexture("triangleOff");
            }, 600);
            setTimeout(function () {
                ww.tri4.setTexture("triangleOff");
            }, 900);
            setTimeout(function () {
                ww.tri5.setTexture("triangleOff");
            }, 1200);
            setTimeout(function () {
                ww.tri6.setTexture("triangleOff");
            }, 1500);
            setTimeout(function () {
                ww.tri7.setTexture("triangleOff");
            }, 1800);
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

    gameOver() {
        let scoreReformated = String(currentScore).replace(',', '');
        let score = parseInt(scoreReformated);
        this.scene.pause("PlayGame");
        this.scene.start("Leaderboard", {
            isGameOver: true,
            userId: userId,
            name: username,
            score: score,
        });
    }

    update(timestamp, dt) {
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
        } else if (bufferScore >= 1000 && bufferScore < 10000) {
            currentScore += 1000;
            bufferScore -= 1000;
        } else if (bufferScore >= 10000 && bufferScore < 100000) {
            currentScore += 10000;
            bufferScore -= 10000;
        } else if (bufferScore >= 100000) {
            currentScore += 100000;
            bufferScore -= 100000;
        }

        // console.log(currentScore);
        let scoreFormated = String(currentScore).replace(/(.)(?=(\d{3})+$)/g, '$1,')
        if (this.textScore.text != scoreFormated) {
            this.textScore.setText(scoreFormated);
        }

        if (this.textScore.width != lastScoreWidth) {
            this.scoreBox.fillRoundedRect(this.textScore.x - (this.textScore.width / 2), this.textScore.y - (this.textScore.height / 2), this.textScore.width, this.textScore.height, (7 * dpr));
            lastScoreWidth = this.textScore.width;
        }
        // advance the simulation by 1/20 seconds
        // if (dt < 10) {
        //     this.world.step(1 / 30, 3, 3);
        // } else {
        //     this.world.step(1 / 16, 3, 3);
        // }
        this.world.step((1 / 12) * (85 / 100), 3, 3);
        // this.world.step(1 / dt);
        // console.log(dt);
        // this.world.step(1 / 16, 10, 8);
        // console.log(this.game.loop.delta);
        // console.log(this.game.loop.actualFps);

        // crearForces  method should be added at the end on each step
        this.world.clearForces();

        //for testing purpose
        // if (joint != null) {
        //     var pointer = this.input.activePointer;
        //     joint.setTarget(planck.Vec2(pointer.x / this.scaleFactor, pointer.y / this.scaleFactor));
        // }
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

class Leaderboard extends Phaser.Scene {
    constructor() {
        super("Leaderboard");
    }

    init(data) {
        // init canvas size
        this.gameWidth = this.sys.game.scale.width
        this.gameHeight = this.sys.game.scale.height
        this.halfWidth = this.gameWidth / 2;
        this.halfHeight = this.gameHeight / 2;
        this.isGameOver = data.isGameOver;
        this.userId = data.userId;
        this.username = data.name;
        this.userScore = data.score;
    }

    preload() {
        /*
         *Load ASSET
         */
        this.load.path = "./src/assets/img/";
        this.load.image("btnStart", "btnStart.png");
        this.load.image("bgIntro", "bg_intro.jpg");
        this.load.image("bgStart", "bg_start.png");
        this.load.image("icGamepause", "ic_gamepause.png");
        this.load.image("icGameover", "ic_gameover.png");
        this.load.image("icResume", "ic_resume.png");
        this.load.image("icTryagain", "ic_tryagain.png");
        this.load.image("icOther", "ic_other_game.png");
        this.load.image("fieldLeaderboard", "field_leaderboard.png");
    }

    async create() {
        this.add.graphics().setDepth(1).fillStyle(0x000000, 0.8).fillRect(0, 0, this.gameWidth, this.gameHeight);
        this.fieldLeaderboard = this.add.image(this.halfWidth, this.halfHeight, "fieldLeaderboard")
            .setDepth(2)
            .setScale(0.25 * dpr)
            .setOrigin(0.5, 0.5);

        let statusGame = this.isGameOver ? "icGameover" : "icGamepause";
        this.add.image(this.halfWidth, this.halfHeight - (180 * dpr), statusGame)
            .setDepth(2)
            .setScale(0.25 * dpr)
            .setOrigin(0.5, 0.5);
        let status = this.isGameOver ? "icTryagain" : "icResume";

        let clickedAgain = false;
        this.resume = this.add.sprite(this.halfWidth, this.fieldLeaderboard.y + (this.fieldLeaderboard.displayHeight / 1.7), status)
            .setDepth(2)
            .setScale(0.25 * dpr)
            .setOrigin(0.5, 0.5)
            .setInteractive()
            .on('pointerdown', () => {
                if (clickedAgain) {
                    clickedAgain = false;
                    if (this.isGameOver) {
                        clickedAgain = true;
                        isFirst = false;
                        this.scene.resume("PlayGame", {
                            reset: true
                        });
                        this.scene.stop("Leaderboard");
                    } else {
                        this.scene.resume("PlayGame", {
                            reset: false
                        });
                        this.scene.stop("Leaderboard");
                    }
                }
            });
        // this.other = this.add.sprite(this.halfWidth, this.resume.y + (this.resume.displayHeight / 0.8), "icOther")
        //     .setDepth(2)
        //     .setScale(0.25 * dpr)
        //     .setOrigin(0.5, 0.5)
        //     .setInteractive()
        //     .on('pointerdown', () => {
        //         if (clickedAgain) {
        //             this.scene.stop("Leaderboard");
        //             this.game.destroy(true, false);
        //         }
        //     });

        //GET USER DOC
        let docRef = doc(db, col, String(this.userId));
        const queryUser = await getDoc(docRef);

        //ADD & UPDATE SCORE USER IN LEADERBOARD 
        if (queryUser.exists()) {
            await setDoc(docRef, {
                name: this.username,
                notelp: this.userId,
                score: this.userScore > queryUser.data().score ? this.userScore : queryUser.data().score,
                date: tglIndonesia(),
                timestamp: Math.floor(Date.now() / 1000),
            });
        } else {
            await updateDoc(docRef, {
                score: this.userScore,
                date: tglIndonesia(),
                timestamp: Math.floor(Date.now() / 1000),
            });
        }

        // GET LEADERBOARD DATA (Highest Score)
        const q = query(colRef, orderBy("score", "desc"), orderBy("timestamp", "asc"), limit(10));
        const querySnapshot = await getDocs(q);
        var rowWidth = 0;
        var rank = 1;
        var userInHighest = false;
        querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            // console.log(doc.id, " => ", doc.data());
            let name = doc.data().name.length > 8 ? doc.data().name.substring(0, 11) : doc.data().name;
            let score = String(doc.data().score).replace(/(.)(?=(\d{3})+$)/g, '$1,');
            if (this.userId == doc.id) {
                userInHighest = true;
                this.add.graphics()
                    .fillStyle(0xF7D013, 0.4)
                    .fillRect(this.halfWidth - (85 * dpr), (this.halfHeight - (95 * dpr)) + (rowWidth * dpr), (175 * dpr), (10 * dpr))
                    .setDepth(2);
            }
            this.rank = this.make.text({
                x: this.halfWidth - (70 * dpr),
                y: (this.halfHeight - (90 * dpr)) + (rowWidth * dpr),
                text: "0",
                padding: {
                    left: 5,
                    right: 5,
                    top: 5,
                    bottom: 5
                },
                style: {
                    align: "center",
                    fontFamily: "Arial Black",
                    fontSize: 8 * dpr,
                    fill: "#000000"
                }
            }).setDepth(2).setOrigin(0.5, 0.5).setText(rank);

            this.name = this.make.text({
                x: this.halfWidth - (40 * dpr),
                y: (this.halfHeight - (90 * dpr)) + (rowWidth * dpr),
                text: "0",
                padding: {
                    left: 5,
                    right: 5,
                    top: 5,
                    bottom: 5
                },
                style: {
                    align: "center",
                    fontFamily: "Arial Black",
                    fontSize: 8 * dpr,
                    fill: "#000000"
                }
            }).setDepth(2).setOrigin(0, 0.5).setText(name);

            this.score = this.make.text({
                x: this.halfWidth + (35 * dpr),
                y: (this.halfHeight - (90 * dpr)) + (rowWidth * dpr),
                text: "0",
                padding: {
                    left: 5,
                    right: 5,
                    top: 5,
                    bottom: 5
                },
                style: {
                    align: "center",
                    fontFamily: "Arial Black",
                    fontSize: 8 * dpr,
                    fill: "#000000"
                }
            }).setDepth(2).setOrigin(0, 0.5).setText(score);
            rowWidth += (8 * dpr);
            rank++;
            clickedAgain = true;
        });

        if (!userInHighest) {
            //GET USER QUERY AFTER UPDATE (Not in Highest)
            const queryUser2 = await getDoc(docRef);
            if (queryUser2.exists()) {
                let name = queryUser2.data().name.length > 8 ? queryUser2.data().name.substring(0, 11) : queryUser2.data().name;
                let score = String(queryUser2.data().score).replace(/(.)(?=(\d{3})+$)/g, '$1,');
                this.add.graphics()
                    .fillStyle(0x000000, 1)
                    .fillRect(this.halfWidth - (85 * dpr), (this.halfHeight - (95 * dpr)) + (rowWidth * dpr), (175 * dpr), (2 * dpr))
                    .setDepth(2);
                this.add.graphics()
                    .fillStyle(0xF7D013, 0.4)
                    .fillRect(this.halfWidth - (85 * dpr), (this.halfHeight - (95 * dpr)) + ((rowWidth * dpr) + (5 * dpr)), (175 * dpr), (10 * dpr))
                    .setDepth(2);
                this.rank = this.make.text({
                    x: this.halfWidth - (70 * dpr),
                    y: (this.halfHeight - (90 * dpr)) + ((rowWidth * dpr) + (5 * dpr)),
                    text: "--",
                    padding: {
                        left: 5,
                        right: 5,
                        top: 5,
                        bottom: 5
                    },
                    style: {
                        align: "center",
                        fontFamily: "Arial Black",
                        fontSize: 8 * dpr,
                        fill: "#000000"
                    }
                }).setDepth(2).setOrigin(0.5, 0.5);

                this.name = this.make.text({
                    x: this.halfWidth - (40 * dpr),
                    y: (this.halfHeight - (90 * dpr)) + ((rowWidth * dpr) + (5 * dpr)),
                    text: "0",
                    padding: {
                        left: 5,
                        right: 5,
                        top: 5,
                        bottom: 5
                    },
                    style: {
                        align: "center",
                        fontFamily: "Arial Black",
                        fontSize: 8 * dpr,
                        fill: "#000000"
                    }
                }).setDepth(2).setOrigin(0, 0.5).setText(name);

                this.score = this.make.text({
                    x: this.halfWidth + (35 * dpr),
                    y: (this.halfHeight - (90 * dpr)) + ((rowWidth * dpr) + (5 * dpr)),
                    text: "0",
                    padding: {
                        left: 5,
                        right: 5,
                        top: 5,
                        bottom: 5
                    },
                    style: {
                        align: "center",
                        fontFamily: "Arial Black",
                        fontSize: 8 * dpr,
                        fill: "#000000"
                    }
                }).setDepth(2).setOrigin(0, 0.5).setText(score);
            }

        }
    }

    // update() {
    //     if (this.currentTicket != undefined && this.currentTicket != null && currentTicket != undefined && currentTicket != null) {
    //         this.currentTicket.setText(`Your Current Ticket: ${currentTicket}`);
    //     }
    // }
}

class Loading extends Phaser.Scene {
    constructor() {
        super("Loading");
    }

    init() {
        // init canvas size
        this.gameWidth = this.sys.game.scale.width
        this.gameHeight = this.sys.game.scale.height
        this.halfWidth = this.gameWidth / 2;
        this.halfHeight = this.gameHeight / 2;
    }

    preload() {
        /*
         *Load ASSET
         */
        this.load.path = "./src/assets/img/";
        this.load.spritesheet("loading", "loading_spritesheet.png", {
            frameWidth: this.halfWidth,
            frameHeight: 64 * dpr,
            endFrame: 4
        });
    }

    create() {
        this.add.graphics().setDepth(1).fillStyle(0x000000, 0.8).fillRect(0, 0, this.gameWidth, this.gameHeight);
        var config = {
            key: 'loadingAnimation',
            frames: this.anims.generateFrameNumbers('loading', {
                start: 0,
                end: 4,
                first: 4
            }),
            frameRate: 10,
            repeat: -1
        };
        this.anims.create(config);

        this.add.sprite(this.halfWidth, this.halfHeight, 'loading').play('loadingAnimation');
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
        // this.scale = scaleSprite;
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
            userData: {
                label: label
            },
            bullet: true,
        });
        if (this.isDynamic) {
            this.b.setDynamic();
        }
        // console.log(scene.world);
        // const init = img => {
        this.b.createFixture(planck.Circle(radius / 30), {
            friction: 0.25,
            restitution: 0,
            density: 7,
            isSensor: isSensor,
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
            I: isFixed ? 0 : 1 //make body cant rotate
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
        // console.log(ball.isSleepingAllowed());
    }

    awake() {
        let ball = this.b;
        // do not change world immediately
        setTimeout(function () {
            ball.setAwake(true);
        }, 1);
        // console.log(ball.isSleepingAllowed());
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
        // this.scale = scaleSprite;
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
            userData: {
                label: label
            },
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
        this.scale = scaleSprite;
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
            userData: {
                label: label,
                isScore: true
            },
            filterGroupIndex: groupIndex,
        });

        this.b.setPosition(
            planck.Vec2(this.x / 30, this.y / 30)
        );

        this.b.setMassData({
            mass: 3, //3,
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
            userData: {
                label: label,
                isScore: true
            },
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
            arrTemp.push({
                x: e[0] / 2 * dpr * scale,
                y: e[1] / 2 * dpr * scale
            });
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
        this.scale = scaleSprite;
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
            userData: {
                label: label,
                isScore: true
            },
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
            arrTemp.push({
                x: e.x / 2 * dpr * scale,
                y: e.y / 2 * dpr * scale
            });
            return arrTemp;
        });

        const poly = new Polygon(arrTemp);
        const bbox = poly.aabb();

        let PX2M = 0.01;
        const width = bbox.w;
        const height = bbox.h;
        // this.setDisplayOrigin(bbox.x, bbox.y);
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
        this.displayWidth = width;
        this.displayHeight = height;
        // console.log(`Nama width:${key}`);
        // console.log(`polygon width:${width}`);
        this.scale = scaleSprite;
        // console.log(`scale width:${this.displayWidth}`);
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
            restitution: restitution, //0.5,
            density: 1,
            isSensor: isSensor,
            userData: {
                label: label,
                isScore: true
            },
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
            arrTemp.push({
                x: e.x / 2 * dpr * scale,
                y: e.y / 2 * dpr * scale
            });
            return arrTemp;
        });

        const poly = new Polygon(arrTemp);
        const bbox = poly.aabb();

        const width = bbox.w;
        const height = bbox.h;
        // this.setDisplayOrigin(bbox.x, bbox.y);
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
        // this.scale = scaleSprite;

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
            userData: {
                label: label,
                isScore: true
            },
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

function tglIndonesia() {
    var date = new Date();
    var tahun = date.getFullYear();
    var bulan = date.getMonth();
    var tanggal = date.getDate();
    var hari = date.getDay();
    var jam = date.getHours();
    var menit = date.getMinutes();
    var detik = date.getSeconds();
    switch (hari) {
        case 0:
            hari = "Minggu";
            break;
        case 1:
            hari = "Senin";
            break;
        case 2:
            hari = "Selasa";
            break;
        case 3:
            hari = "Rabu";
            break;
        case 4:
            hari = "Kamis";
            break;
        case 5:
            hari = "Jum'at";
            break;
        case 6:
            hari = "Sabtu";
            break;
    }
    switch (bulan) {
        case 0:
            bulan = "Januari";
            break;
        case 1:
            bulan = "Februari";
            break;
        case 2:
            bulan = "Maret";
            break;
        case 3:
            bulan = "April";
            break;
        case 4:
            bulan = "Mei";
            break;
        case 5:
            bulan = "Juni";
            break;
        case 6:
            bulan = "Juli";
            break;
        case 7:
            bulan = "Agustus";
            break;
        case 8:
            bulan = "September";
            break;
        case 9:
            bulan = "Oktober";
            break;
        case 10:
            bulan = "November";
            break;
        case 11:
            bulan = "Desember";
            break;
    }
    var tampilTanggal = hari + ", " + tanggal + " " + bulan + " " + tahun;
    var tampilWaktu = jam + ":" + menit + ":" + detik;
    return tampilTanggal + " " + tampilWaktu
}