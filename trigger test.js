let game;
window.onload = function () {
    let gameConfig = {
        type: Phaser.AUTO,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: 600,
            height: 600
        },
        scene: playGame,
        physics: {
            default: "matter",
            matter: {
                gravity: {
                    y: 1
                },
                debug: true,
                debugBodyColor: 0xff00ff,
                debugWireframes: false
            }
        }
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
}
class playGame extends Phaser.Scene {
    constructor() {
        super("PlayGame");
    }
    create() {

        // matter settings
        this.matter.world.update30Hz();
        this.matter.world.setBounds(10, 10, game.config.width - 20, game.config.height - 20);

        // random cannon properties
        let angle = Phaser.Math.Between(45, 135);
        let width = Phaser.Math.Between(20, 50);
        let length = Phaser.Math.Between(120, 250);
        let tickness = Phaser.Math.Between(10, 20);
        let position = new Phaser.Math.Vector2(game.config.width / 2, 550);

        // bottom body
        let bottomWidth = width + tickness * 2;
        let bottomBody = this.matter.add.rectangle(position.x, position.y, bottomWidth, tickness, this.setProperties(true, angle));

        // some trigonometry useful to find the origins of cannon side bodies
        let bottomCathetus = (width + tickness) / 2;
        let sideCathetus = (length + tickness) / 2;
        let hypotenuse = Math.sqrt(Math.pow(bottomCathetus, 2) + Math.pow(sideCathetus, 2));
        let bottomAngle = Phaser.Math.RadToDeg(Math.asin(sideCathetus / hypotenuse));

        // side body 1
        let firstSideOrigin = this.moveBy(position, hypotenuse, 90 - bottomAngle - angle)
        this.matter.add.rectangle(firstSideOrigin.x, firstSideOrigin.y, tickness, length, this.setProperties(true, angle));

        // side body 2
        let secondSideOrigin = this.moveBy(position, hypotenuse, bottomAngle - 90 - angle)
        this.matter.add.rectangle(secondSideOrigin.x, secondSideOrigin.y, tickness, length, this.setProperties(true, angle));

        // trigger
        let triggerOrigin = this.moveBy(position, (length - (width * 3 - tickness) / 2), -angle)
        let trigger = this.matter.add.rectangle(triggerOrigin.x, triggerOrigin.y, width, width, this.setProperties(false, angle));

        // cannon ball
        let ballOrigin = this.moveBy(position, (width + length - (width * 3 - tickness) / 2), -angle)
        this.matter.add.circle(ballOrigin.x, ballOrigin.y, width / 2, this.setProperties(false, angle));

        // constraint
        let constraintLength = length + (tickness - width * 3) / 2;
        this.constraint = this.matter.add.constraint(bottomBody, trigger, constraintLength, 1);
        this.constraintFireLength = constraintLength + width;
        this.constrainMinLength = width / 2 + tickness / 2;

        // listeners and flags
        this.input.on("pointerdown", this.charge, this);
        this.input.on("pointerup", this.fire, this);
        this.charging = false
    }

    // charge
    charge() {
        this.charging = true;
    }

    // fire: look how stiffness changes, then restart the game
    fire() {
        this.charging = false;
        this.constraint.stiffness = 0.02
        this.constraint.length = this.constraintFireLength;
        this.time.addEvent({
            delay: 3000,
            callbackScope: this,
            callback: function () {
                this.scene.start("PlayGame");
            },
        });
    }

    // we reduce constraint length if charging
    update() {
        if (this.charging && this.constraint.length > this.constrainMinLength) {
            this.constraint.length -= 1;
        }
    }

    // utility method to create an object with body properties
    setProperties(isStatic, angle) {
        let radians = Phaser.Math.DegToRad(90 - angle);
        return {
            isStatic: isStatic,
            angle: radians,
            friction: 0
        }
    }

    // utility method to move a point by "distance" pixels in "degrees" direction
    moveBy(point, distance, degrees) {
        let radians = Phaser.Math.DegToRad(degrees);
        return new Phaser.Math.Vector2(point.x + distance * Math.cos(radians), point.y + distance * Math.sin(radians));
    }
};