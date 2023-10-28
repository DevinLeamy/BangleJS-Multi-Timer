var STORAGE_FILE = "timer.json";
var PAUSE_IMG = atob("GBiBAf////////////////wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP////////////////w==");
var PLAY_IMG = atob("GBjBAP//AAAAAAAAAAAIAAAOAAAPgAAP4AAP+AAP/AAP/wAP/8AP//AP//gP//gP//AP/8AP/wAP/AAP+AAP4AAPgAAOAAAIAAAAAAAAAAA=");
var RESET_IMG = atob("GBiBAf////////////AAD+AAB+f/5+f/5+f/5+cA5+cA5+cA5+cA5+cA5+cA5+cA5+cA5+f/5+f/5+f/5+AAB/AAD////////////w==");
var BLUE_COLOR = "#0ff";
var YELLOW_COLOR = "#ff0";
var BLACK_COLOR = "#000";
var ICON_SCALE = g.getWidth() / 178;
var ICON_SIZE_IN_PIXELS = 24;
var UPDATE_DELAY_MS = 100;
function convertTimeToText(time) {
    var hours = Math.floor(time / 3600000);
    var minutes = Math.floor(time / 60000) % 60;
    var seconds = Math.floor(time / 1000) % 60;
    var tenthsOfASecond = Math.floor(time / 100) % 10;
    if (hours == 0) {
        return ("0" + minutes).substr(-2) + ":" + ("0" + seconds).substr(-2) + "." + tenthsOfASecond;
    }
    else {
        return "0" + hours + ":" + ("0" + minutes).substr(-2) + ":" + ("0" + seconds).substr(-2);
    }
}
var Button = /** @class */ (function () {
    function Button(x, y, width, height, color, callback, image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.callback = callback;
        this.image = image;
    }
    Button.prototype.setImage = function (image) {
        this.image = image;
    };
    Button.prototype.center = function () {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    };
    Button.prototype.draw = function () {
        g.setColor(this.color);
        g.fillRect(this.x, this.y, this.x + this.width, this.y + this.height);
        if (this.image != undefined) {
            var center = this.center();
            var imageSize = ICON_SCALE * ICON_SIZE_IN_PIXELS;
            var iconX = center.x - imageSize / 2.0;
            var iconY = center.y - imageSize / 2.0;
            g.drawImage(this.image, iconX, iconY, { scale: ICON_SCALE });
        }
        g.drawRect(this.x, this.y, this.x + this.width, this.y + this.height);
    };
    Button.prototype.isOnButton = function (x, y) {
        return this.x <= x && x <= this.x + this.width && this.y <= y && y <= this.y + this.height;
    };
    // Returns true if clicked.
    Button.prototype.onClick = function (x, y) {
        if (this.isOnButton(x, y)) {
            this.callback();
            return true;
        }
        return false;
    };
    return Button;
}());
var TimerApp = /** @class */ (function () {
    function TimerApp() {
        this.width = g.getWidth();
        this.height = g.getWidth();
        this.timers = [];
        this.displayedTimerIndex = 0;
        this.timeTextY = this.height * (2.0 / 5.0);
        this.loadStateOrDefault();
        this.initializeButtons();
        this.initializeScreen();
        this.initApp();
    }
    TimerApp.prototype.run = function () {
        this.draw();
        var self = this;
        this.updateInterval = setInterval(function () {
            self.draw();
        }, UPDATE_DELAY_MS);
    };
    TimerApp.prototype.initApp = function () {
        var self = this;
        var originalTheme = g.theme;
        Bangle.setUI({
            mode: "custom",
            btn: function () { return load(); },
            touch: function (button, point) {
                var x = point.x;
                var y = point.y;
                // adjust for outside the dimension of the screen
                // http://forum.espruino.com/conversations/371867/#comment16406025
                if (y > self.height)
                    y = self.height;
                if (y < 0)
                    y = 0;
                if (x > self.width)
                    x = self.width;
                if (x < 0)
                    x = 0;
                // not running, and reset
                var timer = self.displayedTimer();
                self.largeButton.onClick(x, y);
                // if (!running && tCurrent == tTotal && bigPlayPauseBtn.check(x, y)) return;
                // // paused and hit play
                // if (!running && tCurrent != tTotal && smallPlayPauseBtn.check(x, y)) return;
                // // paused and press reset
                // if (!running && tCurrent != tTotal && resetBtn.check(x, y)) return;
                // // must be running
                // if (running && bigPlayPauseBtn.check(x, y)) return;
            },
            remove: function () {
                self.pauseTimer();
                // Bangle.removeListener("lcdPower", onLCDPower)
                g.setTheme(originalTheme);
            }
        });
    };
    TimerApp.prototype.initializeScreen = function () {
        Bangle.loadWidgets();
        Bangle.drawWidgets();
        g.setColor(BLACK_COLOR);
        g.fillRect(0, 0, this.width, this.height);
    };
    TimerApp.prototype.initializeButtons = function () {
        function largeButtonClick() {
            console.log("BIG BUTTON");
        }
        function leftButtonClick() {
            console.log("LEFT BUTTON");
        }
        function rightButtonClick() {
            console.log("RIGHT BUTTON");
        }
        this.largeButton = new Button(0.0, (3.0 / 4.0) * this.height, this.width, this.height / 4.0, BLUE_COLOR, largeButtonClick, PLAY_IMG);
        this.leftButton = new Button(0.0, (3.0 / 4.0) * this.height, this.width / 2.0, this.height / 4.0, BLUE_COLOR, leftButtonClick, PLAY_IMG);
        this.rightButton = new Button(this.width / 2.0, (3.0 / 4.0) * this.height, this.width / 2.0, this.height / 4.0, BLUE_COLOR, rightButtonClick, PAUSE_IMG);
    };
    TimerApp.prototype.resumeTimer = function () {
        var self = this;
        this.updateInterval = setInterval(function () {
            self.draw();
        }, UPDATE_DELAY_MS);
    };
    TimerApp.prototype.displayedTimer = function () {
        return this.timers[this.displayedTimerIndex];
    };
    TimerApp.prototype.save = function () {
        require("Storage").writeJSON(STORAGE_FILE, {
            displayedTimerIndex: this.displayedTimerIndex,
            timers: this.timers
        });
    };
    TimerApp.prototype.loadStateOrDefault = function () {
        this.timers = [
            {
                startTime: 0.0,
                currentTime: 3000.0,
                totalTime: 5000.0,
                running: true
            },
        ];
    };
    TimerApp.prototype.drawButtons = function () {
        console.log("DRAW BUTTONS", JSON.stringify(this.timers));
        var timer = this.displayedTimer();
        if (timer.running) {
            this.largeButton.draw();
        }
        else {
            this.leftButton.draw();
            this.rightButton.draw();
        }
    };
    TimerApp.prototype.drawTime = function () {
        var timer = this.displayedTimer();
        var totalTime = Date.now();
        var timeText = convertTimeToText(totalTime);
        g.setFont("Vector", 38);
        g.setFontAlign(0, 0);
        g.clearRect(0, this.timeTextY - 21, this.width, this.timeTextY + 21);
        g.drawString(timeText, this.width / 2, this.timeTextY);
    };
    TimerApp.prototype.draw = function () {
        g.setColor(g.theme.fg);
        this.drawButtons();
        this.drawTime();
    };
    TimerApp.prototype.pauseTimer = function () {
        if (this.displayedTimer().running) {
            clearInterval(this.updateInterval);
            this.updateInterval = undefined;
        }
    };
    return TimerApp;
}());
var Timer = /** @class */ (function () {
    function Timer(state) {
        this.totalTime = state.totalTime;
        this.startTime = state.startTime;
        this.currentTime = state.currentTime;
        this.running = state.running;
    }
    Timer.prototype.state = function () {
        return {
            totalTime: this.totalTime,
            startTime: this.startTime,
            currentTime: this.currentTime,
            running: this.running
        };
    };
    return Timer;
}());
var app = new TimerApp();
app.run();
