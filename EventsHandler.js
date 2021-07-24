
/**
 * @callback imogeneListener
 * @param {...any} [args] arguments passed to the event
 * */

/** Object to handle events */
export default class EventsHandler {
    /** Construct a new events handler */
    constructor() {
        /**
         * Listeners that are to be called when the event is dispatched
         * @type {imogeneListener[]}
         * */
        this._listeners = [];
    }

    /**
     * Add an event listener
     * @param {imogeneListener} listener Event listener to add
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     * Remove an event listener
     * @param {imogeneListener} listener Event listener to remove
     */
    removeListener(listener) {
        const index = this._listeners.findIndex(l => l === listener);
        if (index >= 0)
            this._listeners.splice(index, 1);
    }

    /** Clear out all events */
    clear() {
        this._listeners = [];
    }

    /**
     * Dispatch the event
     * @param {...any} args arguments to pass to the event listeners
     */
    async dispatch(...args) {
        const retValues = this._listeners.map(l => l(...args));
        await Promise.all(retValues.filter(v => v instanceof Promise));
    }
}
