import EventsHandler, { imogeneListener } from './EventsHandler';

/**
 * Translate value callback for NotifyingValue class
 * @callback NVTranslate
 * @param {any} value Value to translate
 * @returns {any}
 * */

/** Value that notifies when it changes */
export default class NotifyingValue {
    /**
     * Construct a new notifying value
     * @param {any} value Value to house in the object
     * @param {NVTranslate} [translator] Translator to translate the 
     */
    constructor(value, translator = x => x) {
        /** The value @type {any} */
        this._value = value;
        /** The translator to translate the value
         * @type {NVTranslate} */
        this._translator = translator;

        /** Events handler to notify when value changes */
        this._events = new EventsHandler();
    }

    /**
     * Get the current value
     * @returns {any} The current value
     */
    get() {
        return this._value;
    }

    /**
     * Set the value, notifying events if different
     * @param {any} value Value to set
     * @param {boolean} force If true, forces the change, even if not different
     * @returns {Promise<void>} Promise that resolves when all notifying events have completed
     */
    set(value, force) {
        if (this._value !== value || force) {
            this._value = value;

            return this.forceTrigger();
        }
    }

    /**
     * Force a notification of change of the value, without making any change
     * @returns {Promise<void>} Promise that resolves when last notification has ended
     */
    forceTrigger() {
        return this._events.dispatch(this._translator(this._value));
    }

    /**
     * Add a listener for when the value changes
     * @param {imogeneListener} listener listener to add to the event handler
     */
    addListener(listener) {
        this._events.addListener(listener);
    }

    /**
     * Remove a listener for when the value changes
     * @param {imogeneListener} listener listener to remove from the event handler
     */
    removeListener(listener) {
        this._events.removeListener(listener);
    }

    /** Clear out all notifying event listeners */
    clearEvents() {
        this._events.clear();
    }
}
