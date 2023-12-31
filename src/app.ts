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

function zeroPadded(n: number): string {
    return ("0" + n).substr(-2)
}

function convertTimeToText(time: number): string {
    let hours = Math.floor(time / 3600000)
    let minutes = Math.floor(time / 60000) % 60
    let seconds = Math.floor(time / 1000) % 60
    let tenthsOfASecond = Math.floor(time / 100) % 10

    if (hours == 0) {
        return ("0" + minutes).substr(-2) + ":" + ("0" + seconds).substr(-2) + "." + tenthsOfASecond
    } else {
        return `${zeroPadded(hours)}:${zeroPadded(minutes)}:${zeroPadded(seconds)}`
    }
}

interface TimerState {
    elapsedTime: number
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
    displayTextY: number
    largeButton!: Button
    leftButton!: Button
    rightButton!: Button
    topLeftButton!: Button
    topRightButton!: Button
    updateInterval: undefined | any
    lastTickTimeMS: number

    constructor() {
        this.width = g.getWidth()
        this.height = g.getWidth()
        this.timers = []
        this.displayedTimerIndex = 0
        this.displayTextY = 20
        this.timeTextY = this.height / 2.0
        this.lastTickTimeMS = Date.now()
        this.loadStateOrDefault()
        this.initializeButtons()
        this.initializeScreen()
        this.initApp()
    }

    run() {
        this.startTimer()
    }

    initApp() {
        const self = this
        const originalTheme = g.theme

        Bangle.setUI({
            mode: "custom",
            btn: () => load(),
            touch: (button, point) => {
                let x = Math.min(self.width, Math.max(0, point.x))
                let y = Math.min(self.height, Math.max(0, point.y))

                if (self.displayedTimerIsRunning()) {
                    self.largeButton.onClick(x, y)
                } else if (!self.displayedTimerIsRunning() && !self.displayedTimerHasStarted()) {
                    self.largeButton.onClick(x, y)
                } else {
                    self.leftButton.onClick(x, y)
                    self.rightButton.onClick(x, y)
                }

                // Make the navigation buttons easier to click.
                let xx = Math.min(self.width, Math.max(0, point.x - self.width / 4.0))
                let yy = Math.min(self.height, Math.max(0, point.y - self.height / 4.0))

                self.topLeftButton.onClick(xx, yy)

                xx = Math.min(self.width, Math.max(0, point.x + self.width / 4.0))
                yy = Math.min(self.height, Math.max(0, point.y - self.height / 4.0))

                self.topRightButton.onClick(xx, yy)
            },
            remove: () => {
                self.pauseTimer()
                g.setTheme(originalTheme)
            },
        })
    }

    initializeScreen() {
        g.setTheme({ bg: "#000", fg: "#fff", dark: true }).clear()
        g.setColor(BLACK_COLOR)
        g.fillRect(0, 0, this.width, this.height)
        // These buttons don't update so they only need to be drawn once.
        this.topLeftButton.draw()
        this.topRightButton.draw()
    }

    initializeButtons() {
        const self = this
        function startOrPauseTimer() {
            if (self.displayedTimerIsRunning()) {
                self.pauseDisplayedTimer()
            } else {
                self.playDisplayedTimer()
            }
        }

        function resetTimer() {
            self.resetDisplayedTimer()
        }

        function resumeTimer() {
            self.resumeDisplayedTimer()
        }

        this.largeButton = new Button(
            0.0,
            (3.0 / 4.0) * this.height,
            this.width,
            this.height / 4.0,
            BLUE_COLOR,
            startOrPauseTimer,
            PLAY_IMG
        )

        this.leftButton = new Button(
            0.0,
            (3.0 / 4.0) * this.height,
            this.width / 2.0,
            this.height / 4.0,
            YELLOW_COLOR,
            resetTimer,
            PLAY_IMG
        )

        this.rightButton = new Button(
            this.width / 2.0,
            (3.0 / 4.0) * this.height,
            this.width / 2.0,
            this.height / 4.0,
            BLUE_COLOR,
            resumeTimer,
            PAUSE_IMG
        )

        const navigatorButtonSize = this.width / 5.0
        this.topLeftButton = new Button(
            0.0,
            0.0,
            navigatorButtonSize,
            navigatorButtonSize,
            BLACK_COLOR,
            function () {
                self.gotoPreviousTimer()
            },
            RESET_IMG
        )
        this.topRightButton = new Button(
            this.width - navigatorButtonSize,
            0.0,
            navigatorButtonSize,
            navigatorButtonSize,
            BLACK_COLOR,
            function () {
                self.gotoNextTimer()
            },
            RESET_IMG
        )
    }

    startTimer() {
        const self = this
        this.updateInterval = setInterval(function () {
            const now = Date.now()
            const dt = now - self.lastTickTimeMS
            self.lastTickTimeMS = now
            self.update(dt)
        }, UPDATE_DELAY_MS)
    }

    displayedTimer(): TimerState {
        return this.timers[this.displayedTimerIndex]
    }

    update(dt: number) {
        this.updateTimers(dt)
        this.updateButtons()
        this.draw()
        this.save()
    }

    updateTimers(dt: number) {
        for (let timer of this.timers) {
            if (timer.running) {
                timer.elapsedTime += dt
            }
        }
    }

    updateButtons() {
        if (this.displayedTimerIsRunning()) {
            this.largeButton.setImage(PAUSE_IMG)
            this.leftButton.setImage(RESET_IMG)
            this.rightButton.setImage(PLAY_IMG)
        } else {
            this.largeButton.setImage(PLAY_IMG)
            this.leftButton.setImage(RESET_IMG)
            this.rightButton.setImage(PLAY_IMG)
        }
    }

    pauseDisplayedTimer() {
        Bangle.buzz()
        this.displayedTimer().running = false
    }

    resetDisplayedTimer() {
        Bangle.buzz()
        this.displayedTimer().elapsedTime = 0.0
        this.displayedTimer().running = false
    }

    resumeDisplayedTimer() {
        Bangle.buzz()
        this.displayedTimer().running = true
    }

    playDisplayedTimer() {
        Bangle.buzz()
        this.displayedTimer().running = true
    }

    displayedTimerIsRunning(): boolean {
        return this.displayedTimer().running
    }

    displayedTimerHasStarted(): boolean {
        return this.displayedTimer().elapsedTime > 0.0
    }

    save() {
        require("Storage").writeJSON(STORAGE_FILE, {
            displayedTimerIndex: this.displayedTimerIndex,
            timers: this.timers,
        })
    }

    timerCount() {
        return this.timers.length
    }

    loadStateOrDefault() {
        let state = require("Storage").readJSON(STORAGE_FILE, 1)
        if (state == undefined) {
            state = {
                displayedTimerIndex: 0,
                timers: [
                    {
                        elapsedTime: 0.0,
                        running: false,
                    },
                    {
                        elapsedTime: 0.0,
                        running: false,
                    },
                    {
                        elapsedTime: 0.0,
                        running: false,
                    },
                    {
                        elapsedTime: 0.0,
                        running: false,
                    },
                ],
            }
        }
        this.displayedTimerIndex = state.displayedTimerIndex
        this.timers = state.timers
    }

    drawButtons() {
        if (this.displayedTimerIsRunning() || !this.displayedTimerHasStarted()) {
            this.largeButton.draw()
        } else {
            this.leftButton.draw()
            this.rightButton.draw()
        }
    }

    drawTime() {
        const timer = this.displayedTimer()
        const timeText = convertTimeToText(timer.elapsedTime)

        g.setFont("Vector", 38)
        g.setFontAlign(0, 0)
        g.clearRect(0, this.timeTextY - 21, this.width, this.timeTextY + 21)
        g.drawString(timeText, this.width / 2, this.timeTextY)

        const displayText = this.displayText()

        g.setFont("Vector", 14)
        g.clearRect(
            this.width * 0.25,
            this.displayTextY - 21,
            this.width * 0.75,
            this.displayTextY + 21
        )
        g.drawString(displayText, this.width / 2, this.displayTextY)
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

    gotoNextTimer() {
        this.displayedTimerIndex = (this.displayedTimerIndex + 1) % this.timerCount()
    }

    gotoPreviousTimer() {
        this.displayedTimerIndex =
            (this.displayedTimerIndex - 1 + this.timerCount()) % this.timerCount()
    }

    displayText(): string {
        let text = ""
        for (let i = 0; i < this.timerCount(); ++i) {
            text += i == this.displayedTimerIndex ? "0" : "="
        }

        return text
    }
}

const app = new TimerApp()
app.run()
