import { EventEmitter } from "./EventEmitter"

export class Sizes extends EventEmitter {
  constructor({ canvas }) {
    super()
    this.canvas = canvas
    this.pixelRatio = 0
    this.init()
    window.addEventListener("resize", () => {
      this.init()
      this.emit("resize")
    })
  }
  init() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.pixelRatio = this.pixelRatio || Math.min(window.devicePixelRatio, 2)
  }
  destroy() {
    this.off("resize")
  }
}
