
/** Class that handles an interval being run */
export default class IntervalFunction {
    /** Construct a new interval function */
    constructor() {
        this.interval = null;
    }

    /**
     * Start the interval
     * @param {Function} runner function that should be run in the interval
     * @param {number} time time between intervals
     * @param {any} startdetails starting details to pass to the interval frames
     */
    start(runner, time, startdetails) {
        this.passState = startdetails;
        this.interval = setInterval(runner, time);
    }

    /**
     * Try running a particular frame of the interval
     * @param {Function} runner function that should run in the frame
     * @param {...any} params parameters to pass to the runner
     * @returns {boolean} Whether the interval continues
     */
    tryFrame(runner, ...params) {
        const ret = runner(this.passState, ...params);
        if (this.interval) {
            if (ret && ret.continue === true)
                this.passState = ret.details;
            else if (ret !== true || (ret && ret.continue === false)) {
                clearInterval(this.interval);
                this.interval = null;
                return false;
            }
        }
        return true;
    }

    /**
     * Run an interval as a promise
     * @param {Function} runner function that should run in the frame
     * @param {number} time interval timeframe between frames
     * @param {Function} evalparams function to determine the parameters to pass to the runner
     * @param {any} startdetails Beginning state to pass to the frames
     * @returns {Promise<void>} Promise that resolves when the interval stops running
     */
    runAsPromise(runner, time, evalparams, startdetails) {
        return new Promise(resolve =>
            this.start(() =>
                this.tryFrame(runner, ...evalparams(this.passState)) || resolve(),
            time || 10, startdetails)
        );
    }
}
