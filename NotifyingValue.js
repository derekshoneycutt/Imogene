import EventsHandler, { imogeneListener } from './EventsHandler';

/**
 * Translate value callback for NotifyingValue class
 * @callback NVTranslate
 * @param {any} value Value to translate
 * @returns {any}
 * */

/** Value that notifies when it changes */
export default class NotifyingValue {
    /** The value @type {any} */
    #value = null;
    /** The translator to translate the value
     * @type {NVTranslate} */
    #translator = x => x;
    /** Events handler to notify when value changes */
    #events = new EventsHandler();

    /**
     * Construct a new notifying value
     * @param {any} value Value to house in the object
     * @param {NVTranslate} [translator] Translator to translate the 
     */
    constructor(value, translator = x => x) {
        this.#value = value;
        this.#translator = translator;
    }

    /**
     * Get the current value
     * @returns {any} The current value
     */
    get() {
        return this.#value;
    }

    /**
     * Set the value, notifying events if different
     * @param {any} value Value to set
     * @param {boolean} force If true, forces the change, even if not different
     * @returns {Promise<void>} Promise that resolves when all notifying events have completed
     */
    set(value, force) {
        if (this.#value !== value || force) {
            this.#value = value;

            return this.forceTrigger();
        }
    }

    /**
     * Force a notification of change of the value, without making any change
     * @returns {Promise<void>} Promise that resolves when last notification has ended
     */
    forceTrigger() {
        return this.#events.dispatch(this.#translator(this.#value));
    }

    /**
     * Add a listener for when the value changes
     * @param {imogeneListener} listener listener to add to the event handler
     */
    addListener(listener) {
        this.#events.addListener(listener);
    }

    /**
     * Remove a listener for when the value changes
     * @param {imogeneListener} listener listener to remove from the event handler
     */
    removeListener(listener) {
        this.#events.removeListener(listener);
    }

    /** Clear out all notifying event listeners */
    clearEvents() {
        this.#events.clear();
    }
}
