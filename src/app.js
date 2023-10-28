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
function zeroPadded(n) {
    return ("0" + n).substr(-2);
}
function convertTimeToText(time) {
    var hours = Math.floor(time / 3600000);
    var minutes = Math.floor(time / 60000) % 60;
    var seconds = Math.floor(time / 1000) % 60;
    var tenthsOfASecond = Math.floor(time / 100) % 10;
    if (hours == 0) {
        return ("0" + minutes).substr(-2) + ":" + ("0" + seconds).substr(-2) + "." + tenthsOfASecond;
    }
    else {
        return zeroPadded(hours) + ":" + zeroPadded(minutes) + ":" + zeroPadded(seconds);
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
        this.displayTextY = 20;
        this.timeTextY = this.height * (2.0 / 5.0);
        this.lastTickTimeMS = Date.now();
        this.loadStateOrDefault();
        this.initializeButtons();
        this.initializeScreen();
        this.initApp();
    }
    TimerApp.prototype.run = function () {
        this.startTimer();
    };
    TimerApp.prototype.initApp = function () {
        var self = this;
        var originalTheme = g.theme;
        Bangle.setUI({
            mode: "custom",
            btn: function () { return load(); },
            touch: function (button, point) {
                var x = Math.min(self.width, Math.max(0, point.x));
                var y = Math.min(self.height, Math.max(0, point.y));
                if (self.displayedTimerIsRunning()) {
                    self.largeButton.onClick(x, y);
                }
                else if (!self.displayedTimerIsRunning() && !self.displayedTimerHasStarted()) {
                    self.largeButton.onClick(x, y);
                }
                else {
                    self.leftButton.onClick(x, y);
                    self.rightButton.onClick(x, y);
                }
                self.topLeftButton.onClick(x, y);
                self.topRightButton.onClick(x, y);
            },
            remove: function () {
                self.pauseTimer();
                g.setTheme(originalTheme);
            }
        });
    };
    TimerApp.prototype.initializeScreen = function () {
        g.setTheme({ bg: "#000", fg: "#fff", dark: true }).clear();
        g.setColor(BLACK_COLOR);
        g.fillRect(0, 0, this.width, this.height);
        Bangle.loadWidgets();
        Bangle.drawWidgets();
        // These buttons don't update so they only need to be drawn once.
        this.topLeftButton.draw();
        this.topRightButton.draw();
    };
    TimerApp.prototype.initializeButtons = function () {
        var self = this;
        function startOrPauseTimer() {
            if (self.displayedTimerIsRunning()) {
                self.pauseDisplayedTimer();
            }
            else {
                self.playDisplayedTimer();
            }
        }
        function resetTimer() {
            self.resetDisplayedTimer();
        }
        function resumeTimer() {
            self.resumeDisplayedTimer();
        }
        this.largeButton = new Button(0.0, (3.0 / 4.0) * this.height, this.width, this.height / 4.0, BLUE_COLOR, startOrPauseTimer, PLAY_IMG);
        this.leftButton = new Button(0.0, (3.0 / 4.0) * this.height, this.width / 2.0, this.height / 4.0, YELLOW_COLOR, resetTimer, PLAY_IMG);
        this.rightButton = new Button(this.width / 2.0, (3.0 / 4.0) * this.height, this.width / 2.0, this.height / 4.0, BLUE_COLOR, resumeTimer, PAUSE_IMG);
        var navigatorButtonSize = this.width / 8.0;
        this.topLeftButton = new Button(0.0, 0.0, navigatorButtonSize, navigatorButtonSize, BLUE_COLOR, function () {
            self.gotoPreviousTimer();
        }, RESET_IMG);
        this.topRightButton = new Button(this.width - navigatorButtonSize, 0.0, navigatorButtonSize, navigatorButtonSize, BLUE_COLOR, function () {
            self.gotoNextTimer();
        }, RESET_IMG);
    };
    TimerApp.prototype.startTimer = function () {
        var self = this;
        this.updateInterval = setInterval(function () {
            var now = Date.now();
            var dt = now - self.lastTickTimeMS;
            self.lastTickTimeMS = now;
            self.update(dt);
        }, UPDATE_DELAY_MS);
    };
    TimerApp.prototype.displayedTimer = function () {
        return this.timers[this.displayedTimerIndex];
    };
    TimerApp.prototype.update = function (dt) {
        this.updateTimers(dt);
        this.updateButtons();
        this.draw();
        this.save();
    };
    TimerApp.prototype.updateTimers = function (dt) {
        for (var _i = 0, _a = this.timers; _i < _a.length; _i++) {
            var timer = _a[_i];
            if (timer.running) {
                timer.elapsedTime += dt;
            }
        }
    };
    TimerApp.prototype.updateButtons = function () {
        if (this.displayedTimerIsRunning()) {
            this.largeButton.setImage(PAUSE_IMG);
            this.leftButton.setImage(RESET_IMG);
            this.rightButton.setImage(PLAY_IMG);
        }
        else {
            this.largeButton.setImage(PLAY_IMG);
            this.leftButton.setImage(RESET_IMG);
            this.rightButton.setImage(PLAY_IMG);
        }
    };
    TimerApp.prototype.pauseDisplayedTimer = function () {
        this.displayedTimer().running = false;
    };
    TimerApp.prototype.resetDisplayedTimer = function () {
        this.displayedTimer().elapsedTime = 0.0;
        this.displayedTimer().running = false;
    };
    TimerApp.prototype.resumeDisplayedTimer = function () {
        this.displayedTimer().running = true;
    };
    TimerApp.prototype.playDisplayedTimer = function () {
        this.displayedTimer().running = true;
    };
    TimerApp.prototype.displayedTimerIsRunning = function () {
        return this.displayedTimer().running;
    };
    TimerApp.prototype.displayedTimerHasStarted = function () {
        return this.displayedTimer().elapsedTime > 0.0;
    };
    TimerApp.prototype.save = function () {
        require("Storage").writeJSON(STORAGE_FILE, {
            displayedTimerIndex: this.displayedTimerIndex,
            timers: this.timers
        });
    };
    TimerApp.prototype.timerCount = function () {
        return this.timers.length;
    };
    TimerApp.prototype.loadStateOrDefault = function () {
        var state = require("Storage").readJSON(STORAGE_FILE, 1);
        if (state == undefined) {
            state = {
                displayedTimerIndex: 0,
                timers: [
                    {
                        elapsedTime: 0.0,
                        running: false
                    },
                    {
                        elapsedTime: 0.0,
                        running: false
                    },
                    {
                        elapsedTime: 0.0,
                        running: false
                    },
                    {
                        elapsedTime: 0.0,
                        running: false
                    },
                ]
            };
        }
        this.displayedTimerIndex = state.displayedTimerIndex;
        this.timers = state.timers;
    };
    TimerApp.prototype.drawButtons = function () {
        console.log("DRAW BUTTONS", JSON.stringify(this.timers));
        if (this.displayedTimerIsRunning() || !this.displayedTimerHasStarted()) {
            this.largeButton.draw();
        }
        else {
            this.leftButton.draw();
            this.rightButton.draw();
        }
    };
    TimerApp.prototype.drawTime = function () {
        var timer = this.displayedTimer();
        var timeText = convertTimeToText(timer.elapsedTime);
        g.setFont("Vector", 38);
        g.setFontAlign(0, 0);
        g.clearRect(0, this.timeTextY - 21, this.width, this.timeTextY + 21);
        g.drawString(timeText, this.width / 2, this.timeTextY);
        var displayText = this.displayText();
        g.setFont("Vector", 14);
        g.clearRect(this.width * 0.25, this.displayTextY - 21, this.width * 0.75, this.displayTextY + 21);
        g.drawString(displayText, this.width / 2, this.displayTextY);
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
    TimerApp.prototype.gotoNextTimer = function () {
        this.displayedTimerIndex = (this.displayedTimerIndex + 1) % this.timerCount();
    };
    TimerApp.prototype.gotoPreviousTimer = function () {
        this.displayedTimerIndex =
            (this.displayedTimerIndex - 1 + this.timerCount()) % this.timerCount();
    };
    TimerApp.prototype.displayText = function () {
        var text = "";
        for (var i = 0; i < this.timerCount(); ++i) {
            text += i == this.displayedTimerIndex ? "0" : "=";
        }
        return text;
    };
    return TimerApp;
}());
var app = new TimerApp();
app.run();
