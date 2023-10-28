const STORAGE_FILE = "timer.json"

const PAUSE_IMG = atob(
    "GBiBAf////////////////wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP/wYP////////////////w=="
)
const PLAY_IMG = atob(
    "GBjBAP//AAAAAAAAAAAIAAAOAAAPgAAP4AAP+AAP/AAP/wAP/8AP//AP//gP//gP//AP/8AP/wAP/AAP+AAP4AAPgAAOAAAIAAAAAAAAAAA="
)
const RESET_IMG = atob(
    "GBiBAf////////////AAD+AAB+f/5+f/5+f/5+cA5+cA5+cA5+cA5+cA5+cA5+cA5+cA5+f/5+f/5+f/5+AAB/AAD////////////w=="
)

const BLUE_COLOR = "#0ff"
const YELLOW_COLOR = "#ff0"
const BLACK_COLOR = "#000"

const ICON_SCALE = g.getWidth() / 178
const ICON_SIZE_IN_PIXELS = 24
const UPDATE_DELAY_MS = 100

function convertTimeToText(time: number): string {
    let hours = Math.floor(time / 3600000)
    let minutes = Math.floor(time / 60000) % 60
    let seconds = Math.floor(time / 1000) % 60
    let tenthsOfASecond = Math.floor(time / 100) % 10

    if (hours == 0) {
        return ("0" + minutes).substr(-2) + ":" + ("0" + seconds).substr(-2) + "." + tenthsOfASecond
    } else {
        return "0" + hours + ":" + ("0" + minutes).substr(-2) + ":" + ("0" + seconds).substr(-2)
    }
}

interface TimerState {
    totalTime: number
    startTime: number
    currentTime: number
    running: boolean
}

interface TimersState {
    displayedTimerIndex: number
    timers: TimerState[]
}

class Button {
    x: number
    y: number
    width: number
    height: number
    color: string
    callback: () => any
    image: string

    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        color: string,
        callback: () => any,
        image: string
    ) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.color = color
        this.callback = callback
        this.image = image
    }

    setImage(image: string) {
        this.image = image
    }

    center(): { x: number; y: number } {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
        }
    }

    draw() {
        g.setColor(this.color)
        g.fillRect(this.x, this.y, this.x + this.width, this.y + this.height)
        if (this.image != undefined) {
            const center = this.center()
            const imageSize = ICON_SCALE * ICON_SIZE_IN_PIXELS
            const iconX = center.x - imageSize / 2.0
            const iconY = center.y - imageSize / 2.0
            g.drawImage(this.image, iconX, iconY, { scale: ICON_SCALE })
        }
        g.drawRect(this.x, this.y, this.x + this.width, this.y + this.height)
    }

    isOnButton(x: number, y: number): boolean {
        return this.x <= x && x <= this.x + this.width && this.y <= y && y <= this.y + this.height
    }

    // Returns true if clicked.
    onClick(x: number, y: number): boolean {
        if (this.isOnButton(x, y)) {
            this.callback()
            return true
        }
        return false
    }
}

class TimerApp {
    width: number
    height: number
    timers: TimerState[]
    displayedTimerIndex: number
    timeTextY: number
    largeButton!: Button
    leftButton!: Button
    rightButton!: Button
    updateInterval: undefined | any

    constructor() {
        this.width = g.getWidth()
        this.height = g.getWidth()
        this.timers = []
        this.displayedTimerIndex = 0
        this.timeTextY = this.height * (2.0 / 5.0)
        this.loadStateOrDefault()
        this.initializeButtons()
        this.initializeScreen()
        this.initApp()
    }

    run() {
        this.draw()
        const self = this
        this.updateInterval = setInterval(function () {
            self.draw()
        }, UPDATE_DELAY_MS)
    }

    initApp() {
        const self = this
        const originalTheme = g.theme

        Bangle.setUI({
            mode: "custom",
            btn: () => load(),
            touch: (button, point) => {
                let x = point.x
                let y = point.y

                // adjust for outside the dimension of the screen
                // http://forum.espruino.com/conversations/371867/#comment16406025
                if (y > self.height) y = self.height
                if (y < 0) y = 0
                if (x > self.width) x = self.width
                if (x < 0) x = 0

                // not running, and reset
                const timer = self.displayedTimer()
                self.largeButton.onClick(x, y)
                // if (!running && tCurrent == tTotal && bigPlayPauseBtn.check(x, y)) return;

                // // paused and hit play
                // if (!running && tCurrent != tTotal && smallPlayPauseBtn.check(x, y)) return;

                // // paused and press reset
                // if (!running && tCurrent != tTotal && resetBtn.check(x, y)) return;

                // // must be running
                // if (running && bigPlayPauseBtn.check(x, y)) return;
            },
            remove: () => {
                self.pauseTimer()
                // Bangle.removeListener("lcdPower", onLCDPower)
                g.setTheme(originalTheme)
            },
        })
    }

    initializeScreen() {
        Bangle.loadWidgets()
        Bangle.drawWidgets()
        g.setColor(BLACK_COLOR)
        g.fillRect(0, 0, this.width, this.height)
    }

    initializeButtons() {
        function largeButtonClick() {
            console.log("BIG BUTTON")
        }
        function leftButtonClick() {
            console.log("LEFT BUTTON")
        }
        function rightButtonClick() {
            console.log("RIGHT BUTTON")
        }

        this.largeButton = new Button(
            0.0,
            (3.0 / 4.0) * this.height,
            this.width,
            this.height / 4.0,
            BLUE_COLOR,
            largeButtonClick,
            PLAY_IMG
        )

        this.leftButton = new Button(
            0.0,
            (3.0 / 4.0) * this.height,
            this.width / 2.0,
            this.height / 4.0,
            BLUE_COLOR,
            leftButtonClick,
            PLAY_IMG
        )

        this.rightButton = new Button(
            this.width / 2.0,
            (3.0 / 4.0) * this.height,
            this.width / 2.0,
            this.height / 4.0,
            BLUE_COLOR,
            rightButtonClick,
            PAUSE_IMG
        )
    }

    resumeTimer() {
        const self = this
        this.updateInterval = setInterval(function () {
            self.draw()
        }, UPDATE_DELAY_MS)
    }

    displayedTimer(): TimerState {
        return this.timers[this.displayedTimerIndex]
    }

    save() {
        require("Storage").writeJSON(STORAGE_FILE, {
            displayedTimerIndex: this.displayedTimerIndex,
            timers: this.timers,
        })
    }

    loadStateOrDefault() {
        this.timers = [
            {
                startTime: 0.0,
                currentTime: 3000.0,
                totalTime: 5000.0,
                running: true,
            },
        ]
    }

    drawButtons() {
        console.log("DRAW BUTTONS", JSON.stringify(this.timers))
        const timer = this.displayedTimer()
        if (timer.running) {
            this.largeButton.draw()
        } else {
            this.leftButton.draw()
            this.rightButton.draw()
        }
    }

    drawTime() {
        const timer = this.displayedTimer()
        const totalTime = Date.now()
        const timeText = convertTimeToText(totalTime)

        g.setFont("Vector", 38)
        g.setFontAlign(0, 0)
        g.clearRect(0, this.timeTextY - 21, this.width, this.timeTextY + 21)
        g.drawString(timeText, this.width / 2, this.timeTextY)
    }

    draw() {
        g.setColor(g.theme.fg)
        this.drawButtons()
        this.drawTime()
    }

    pauseTimer() {
        if (this.displayedTimer().running) {
            clearInterval(this.updateInterval)
            this.updateInterval = undefined
        }
    }
}

class Timer {
    totalTime: number
    startTime: number
    currentTime: number
    running: boolean

    constructor(state: TimerState) {
        this.totalTime = state.totalTime
        this.startTime = state.startTime
        this.currentTime = state.currentTime
        this.running = state.running
    }

    state(): TimerState {
        return {
            totalTime: this.totalTime,
            startTime: this.startTime,
            currentTime: this.currentTime,
            running: this.running,
        }
    }
}

const app = new TimerApp()
app.run()
