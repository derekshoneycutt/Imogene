import { runOnLoad } from './Base';
import {
    empty, parentElements,
    appendChildren, emptyAndReplace,
    addEvents, removeEvents,
    setClassList, addClass,
    setStyle, setProperties,
    makeNode, property,
    removeNode, insertBefore,
    insertAfter
} from './DomMods';

/**
 * @typedef {Object} ImogeneArrayBase
 * @property {() => void} empty
 * @property {() => Node[]} parentElements
 * @property {(...children) => void} appendChildren
 * @property {(...newVals) => void} emptyAndReplace
 * @property {(events) => ImogeneArray} addEvents
 * @property {(events) => ImogeneArray} removeEvents
 * @property {(classList) => ImogeneArray} setClassList
 * @property {(className) => ImogeneArray} addClass
 * @property {(styles) => Array} setStyle
 * @property {(props) => any} setProperties
 * @property {(name: string, ...val) => any} prop
 * @property {() => void} remove
 * @property {(...nodes: (string|Node)[]) => Node} before
 * @property {(...nodes: (string|Node)[]) => Node} after
 * @property {HTMLElement[]} array
 * 
 * @typedef {Array<HTMLElement> & ImogeneArrayBase} ImogeneArray
 */

/**
 * Enhance an array of elements with useful functions
 * @param {ImogeneArray} array array to enhance
 * @returns {ImogeneArray} enhanced array
 */
const enhanceReturnArray = (array) => {
    if (array instanceof Array) {
        let extendWith = {
            empty: () => empty(array),
            parentElements: () => parentElements(array),
            appendChildren: (...children) => appendChildren(array, ...children),
            emptyAndReplace: (...newVals) => emptyAndReplace(array, ...newVals),

            addEvents: (events) => addEvents(array, events),
            removeEvents: (events) => removeEvents(array, events),
            setClassList: (classList) => setClassList(array, classList),
            addClass: (className) => addClass(array, className),
            setStyle: (styles) => setStyle(array, styles),
            setProperties: (props) => setProperties(array, props),

            prop: (name, ...val) => property(array, name, ...val),

            remove: () => removeNode(array),
            before: (...nodes) => insertBefore(array, ...nodes),
            after: (...nodes) => insertAfter(array, ...nodes),

            array: array,

            ___imogeneExtended___: true
        };
        Object.assign(array, extendWith);
    }
    return array;
};

/**
 * Run an advanced query on a specified object
 * @param {any} start Item to query upon
 * @param {...any} query Query parameters
 * @returns {ImogeneArray} Query results
 */
const queryOn = (start, ...query) => {
    if (start instanceof Node) {
        return enhanceReturnArray(query.map(q => {
            if (q instanceof Array) {
                return appendChildren(start, ...q);
            }
            else if (typeof q === 'string') {
                return [...start.querySelectorAll(q)];
            }
            else if (q instanceof Node)
                start.appendChild(q);
            else
                setProperties(start, q);
            return q;
        }).reduce((p, v) => {
            p.push(...v);
            return p;
        }, []));
    }
    else if (start instanceof Array || start instanceof NodeList || start instanceof HTMLCollection) {
        return enhanceReturnArray([...start].map(v => queryOn(v, ...query)).reduce((p, v) => {
            p.push(...v);
            return p;
        }, []));
    }
    else if (typeof start === 'string') {
        return queryOn([...document.querySelectorAll(start)], ...query);
    }
    return start;
};

/**
 * Perfrom an advanced query, which could be one of many operations
 * @param {any} first The first parameter, by which the operation will be decided
 * @param {...any} etc Additional parameters for the query
 * @returns {ImogeneArray} The results of the query
 */
export const shortQuery = (first, ...etc) => {
    if (typeof first === 'undefined' && etc.length < 1)
        return enhanceReturnArray([]);

    if (typeof first === 'function') {
        return runOnLoad(first);
    }
    else if (first instanceof Array) {
        if (etc.length < 1) {
            if (first.___imogeneExtended___ ||
                !first.reduce((p, v) => p || !(v instanceof Node), false))
                return enhanceReturnArray([...first]);
            return makeNode(...first);
        }
        else {
            return queryOn(first, ...etc);
        }
    }
    else if (typeof first === 'string') {
        if (etc.length < 1) {
            return enhanceReturnArray([...document.querySelectorAll(first)]);
        }
        else {
            return queryOn(first, ...etc);
        }
    }
    else if (first instanceof NodeList || first instanceof HTMLCollection) {

        return queryOn([...first], ...etc);
    }
    else if (first instanceof Node) {
        return queryOn(first, ...etc);
    }
    else if (first instanceof Object) {
        return Object.assign(first, ...etc);
    }
    return first;
};
