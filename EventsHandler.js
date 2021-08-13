
/**
 * @callback imogeneListener
 * @param {...any} [args] arguments passed to the event
 * */

/** Object to handle events */
export default class EventsHandler {
    /**
     * Listeners that are to be called when the event is dispatched
     * @type {imogeneListener[]}
     * */
    #listeners = [];

    /** Construct a new events handler */
    constructor() {
    }

    /**
     * Add an event listener
     * @param {imogeneListener} listener Event listener to add
     */
    addListener(listener) {
        this.#listeners.push(listener);
    }

    /**
     * Remove an event listener
     * @param {imogeneListener} listener Event listener to remove
     */
    removeListener(listener) {
        const index = this.#listeners.findIndex(l => l === listener);
        if (index >= 0)
            this.#listeners.splice(index, 1);
    }

    /** Clear out all events */
    clear() {
        this.#listeners = [];
    }

    /**
     * Dispatch the event
     * @param {...any} args arguments to pass to the event listeners
     */
    async dispatch(...args) {
        const retValues = this.#listeners.map(l => l(...args));
        await Promise.all(retValues.filter(v => v instanceof Promise));
    }
}
