import {
    empty, parentElements,
    appendChildren, emptyAndReplace,
    addEvents, removeEvents,
    setClassList, addClass,
    setStyle, setProperties,
    makeNode
} from './DomMods';
import { shortQuery } from './shortQuery';
import NotifyingValue from './NotifyingValue';
import EventsHandler from './EventsHandler';
import { getOwnProperties } from './Base';
import RestFetch from './RestFetch';

/**
 * Flatten a slot element to its assigned nodes
 * @param {HTMLElement} e some element
 * @returns {HTMLElement[]} things
 */
const flattenSlots = e =>
    e.tagName === 'SLOT' ?
        [].concat(...[...e.assignedNodes()].map(flattenSlots)) :
        [e];

/**
 * Turns a string into camelCase
 * @param {string} str string to camelize
 * @returns {string} camelized string
 */
function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
        if (+match === 0) return "";
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
    }).replace(/-/g, '');
}

/**
 * Create a new notifying value object
 * @param {any} v Initial value
 * @param {Function} [t] translation function
 * @returns {NotifyingValue} a new notifying value object containing the value
 */
export const value = (v, t) => new NotifyingValue(v, t);

/**
 * Create a new array of notifying values
 * @param {number} n Length of array to create
 * @param {Function} g Getter for initial values
 * @returns {NotifyingValue[]} Newly created array
 */
export const valueArray = (n, g = (i) => i) => {
    let ret = [];
    for (let i = 0; i < n; ++i) {
        ret.push(value(g(i)));
    }
    return ret;
};

/**
 * Create a new events handler object
 * @returns {EventsHandler} a new events handler object
 */
export const event = () => new EventsHandler();

/** Collection of exports for Imogene functionality */
export const ImogeneExports = {
    shortQuery: shortQuery,

    value: value,
    valueArray: valueArray,
    event: event,

    empty: empty,
    appendChildren: appendChildren,
    emptyAndReplace: emptyAndReplace,
    parentElements: parentElements,

    addEvents: addEvents,
    removeEvents: removeEvents,
    setClassList: setClassList,
    addClass: addClass,
    setStyle: setStyle,
    setProperties: setProperties,

    flattenSlots: flattenSlots,

    make: makeNode,

    getOwnProperties: getOwnProperties,

    camelize: camelize,

    RestFetch: RestFetch
};

/** Imogene advanced query entry */
export const Imogene = shortQuery;
