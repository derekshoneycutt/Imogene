import IntervalFunction from './IntervalFunction';

/** Class to handle advancing an animation state in an interval */
export default class AnimationState extends IntervalFunction {
    /** Construct a new animation state */
    constructor() {
        super();
        this.effect = 0;
        this.pending = false;
    }

    /**
     * Try running a frame of the animation
     * @param {Function} runner function that is meant to operate the animation
     * @param {Function} resolve function that is to be run if the animation is complete
     */
    tryFrame(runner, resolve) {
        this.effect += 1;
        if (!this.pending) {
            this.pending = true;

            window.requestAnimationFrame(() => {
                this.pending = false;
                const count = this.effect;
                this.effect = 0;
                super.tryFrame(runner, count) || resolve();
            });
        }
    }

    /**
     * Run the animation, returning a promise that resolves when it is complete
     * @param {Function} frame animation frame that should be run
     * @param {number} time interval by which to run the animation
     * @param {any} startdetails information to pass to the frames
     * @returns {Promise<void>} Promise that resolves when the animation is complete
     */
    runAsPromise(frame, time, startdetails) {
        return new Promise(resolve =>
            this.start(() =>
                this.tryFrame(frame, resolve),
                time | 10, startdetails
            )
        );
    }
}
