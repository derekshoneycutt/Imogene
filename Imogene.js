﻿
/**
 * Get the owned properties of an object
 * @param {any} o Object to get the properties of
 * @returns {string[]} Owned properties of the object
 */
 const getOwnProperties = (o) => Object.keys(o).filter(v => o.hasOwnProperty(v));

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
 * Run a function once the page has loaded and is ready for processing
 * @param {Function} fn function to run
 * @returns {Promise} Promise that resolves when the function has run
 */
function runOnLoad(fn) {
    return new Promise(
        document.readyState === 'complete' ?
            r => r(fn()) :
            r => {
                const cb = e => {
                    r(fn(e));
                    document.removeEventListener('DOMContentLoaded', cb);
                    window.removeEventListener('load', cb);
                };
                window.addEventListener('load', cb);
                document.addEventListener('DOMContentLoaded', cb);
            });
}

/**
 * @callback imogeneListener
 * @param {...any} [args] arguments passed to the event
 * */

/** Object to handle events */
export class EventsHandler {
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


/**
 * Translate value callback for NotifyingValue class
 * @callback NVTranslate
 * @param {any} value Value to translate
 * @returns {any}
 * */

/** Value that notifies when it changes */
export class NotifyingValue {
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
     * @param {NVTranslate} [translator] Translator to translate the value on updates
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
        return this.#translator(this.#value);
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

/** Used for handling a binding with a NotifyingValue (or just mapping to any element) in DOM */
export class DomBinding {
    /** @type {HTMLElement} */
    #container = null;
    /** @type {DomBinding} */
    #current = null;
    /** @type {NotifyingValue} */
    #value = null;
    /** @type {(x: HTMLElement) => void} */
    #insert = null;

    /**
     * Construct a new binding
     * @param {any} value value to bind to
     * @param {HTMLElement} container container to bind the value to
     * @param {(x: HTMLElement) => void} insert method used to insert DOM elements
     * @param {Array} [exist] Any existing elements to replace, if applicable
     * @param {boolean} [doCreate] Whether to immediately create the binding element or not (default true)
     */
    constructor(value, container, insert, exist = null, doCreate = true) {
        this.#container = container;
        this.#current = exist;
        this.#value = value;
        this.#insert = insert;

        if (doCreate)
            this.#create();
    }

    /** Hide any currently shown elements */
    #hideAll() {
        hideOne = c => {
            if (c instanceof HTMLElement)
                c.remove();
            else if (c instanceof DomBinding)
                c.#hideAll();
        };
        if (this.current && this.current instanceof Array)
            this.current.forEach(hideOne);
        else if (this.current)
            hideOne(this.current);
        this.current = null;
        if (this.#value instanceof NotifyingValue)
            this.#value.removeListener(this.#replace);
    }

    /**
     * Perform a replaceWith on the current node, whatever it is
     * @param {...any} replaceWith
     */
    #doReplaceWith(...replaceWith) {
        if (this.#current instanceof HTMLElement)
            this.#current.replaceWith(...replaceWith);
        else if (this.#current instanceof Node) {
            replaceWith.forEach(replacement =>
                this.#current.parentElement.insertBefore(replacement, this.#current));
            this.#current.parentElement.removeChild(this.#current);
        }
        else if (this.#current instanceof DomBinding) {
            this.#current.#reduceCurrent();
            this.#current = this.#current.#current;
            this.#doReplaceWith(...replaceWith);
        }
        else if (this.#current instanceof Array) {
            this.#reduceCurrent();
            this.#doReplaceWith(...replaceWith);
        }
        else
            replaceWith.forEach(replacement => this.#insert(replacement));
    }

    /** Reduce the current rendered DOM down to a single element */
    #reduceCurrent() {
        if (this.#current && this.#current instanceof Array) {
            this.#current = this.#current.reduce((p, v) => {
                if (p) {
                    if (v instanceof HTMLElement)
                        v.remove();
                    else if (v instanceof Node)
                        v.parentElement.removeChild(v);
                    else if (v instanceof DomBinding)
                        v.#hideAll();
                    return p;
                }
                if (v instanceof Node || v instanceof DomBinding)
                    return v;
                return null;
            }, null);
        }
        if (!this.#current) return;

        let tempSpan = document.createTextNode('');
        this.#doReplaceWith(tempSpan);
        this.#current = tempSpan;
    }

    /**
     * Get the replacement for a new value
     * @param {any} replaceWith New values to replace DOM with
     * @returns {{ doms: [], props: {}, binds: DomBinding[], curr: [] }} Description of replacement for binding
     */
    #getReplacement(replaceWith) {
        let newarr = [];
        if (replaceWith instanceof Array || replaceWith instanceof HTMLCollection ||
            replaceWith instanceof NodeList)
            newarr = [...replaceWith];
        else
            newarr = [replaceWith];

        let dowith = preprocChildren(...newarr).reduce((p, v) => {
            if (v.toappend instanceof Node) {
                p.doms.push(v.toappend);
                p.curr.push(v.toappend);
            }
            else if (v.toappend instanceof NotifyingValue) {
                let textdom = document.createTextNode('');
                let bind = new DomBinding(v.toappend, this.#container, this.#insert, textdom, false);
                p.doms.push(textdom);
                p.binds.push(bind);
                p.curr.push(bind);
            }
            else if (v.toappend instanceof Object)
                Object.assign(p.props, v.toappend);
            return p;
        }, { doms: [], props: {}, binds: [], curr: [] });

        return dowith;
    }

    /**
     * Replace the current rendered DOM with a new value
     * @param {any} replaceWith the new value to replace the DOM with
     * @returns {[]} The newly rendered DOM
     */
    #replace(replaceWith) {
        this.#reduceCurrent();

        let dowith = this.#getReplacement(replaceWith);

        if (getOwnProperties(dowith.props).length > 0)
            setProperties(this.#container, dowith.props);

        if (dowith.doms.length > 0)
            this.#doReplaceWith(...dowith.doms);
        this.#current = dowith.curr;

        dowith.binds.forEach(bind => bind.#create());

        return this.#current;
    }

    /** Create the DOM node and show it */
    #create() {
        if (this.#value instanceof NotifyingValue) {
            this.#value.addListener(v => window.requestAnimationFrame(() => this.#replace(v)));
            this.#value.forceTrigger();
        }
        else
            this.#replace(this.#value);
    }
}


/**
 * Get the parent elements (may only be one if pass in a single node)
 * @param {Node | Node[] | NodeList | HTMLCollection} fromElement element to get parent of
 * @returns {Node[]} Array of parent elements
 */
function parentElements(fromElement) {
    if (fromElement instanceof Node)
        return [fromElement.parentElement];
    else if (fromElement instanceof Array || fromElement instanceof HTMLCollection ||
            fromElement instanceof NodeList)
        return [...fromElement].reduce((ret, el) => {
            ret.push(...parentElements(el));
            return ret;
        }, []);
    else
        return fromElement;
};

/**
 * Empty out an element(s)
 * @param {Node|Node[]|NodeList|HTMLCollection} el element to empty out
 */
function empty(el) {
    if (el instanceof Node) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }
    else if (el instanceof Array || el instanceof NodeList || el instanceof HTMLCollection)
        [...el].forEach(e => empty(e));
};

/**
 * Preprocess children elements to be appended to an element
 * @param {...any} children The child elements meant to be appended
 * @returns {{ child: any, toappend: any }[]} Preprocessed object describing what to append
 */
function preprocChildren(...children) {
    return children.reduce((p, child) => {
        if (!child) return p;
        let toappend = null;
        if (typeof child === 'string')
            toappend = document.createTextNode(child);
        else if (child instanceof Array) {
            if (child.___imogeneExtended___)
                toappend = child;
            else
                toappend = makeNode(...child);
        }
        else if (child instanceof NodeList || child instanceof HTMLCollection)
            toappend = [...child];
        else if (child instanceof Node ||
                 child instanceof NotifyingValue ||
                 child instanceof Object)
            toappend = child;
        else
            toappend = document.createTextNode(child);

        p.push({
            child: child,
            toappend: toappend
        });
        return p;
    }, []);
}

/**
 * Append children to a node (if array, appends to the first Node)
 * @param {Node|Node[]|NodeList|HTMLCollection} el element to append to
 * @param {...any} children Children to append to the element
 */
function appendChildren(el, ...children) {
    if (el instanceof Node) {
        preprocChildren(...children).forEach(child => {
            if (child.toappend) {
                if (child.toappend instanceof Node)
                    el.appendChild(child.toappend);
                else if (child.toappend instanceof NotifyingValue)
                    new DomBinding(child.toappend, el, x => el.appendChild(x));
                else if (child.toappend instanceof Array)
                    child.toappend.forEach(subchild => el.appendChild(subchild));
                else if (child.toappend instanceof Object)
                    setProperties(el, child.toappend);
            }
        });
    }
    else if (el instanceof Array || el instanceof NodeList || el instanceof HTMLCollection) {
        const nodes = [...el].filter(e => e instanceof Node);
        if (nodes.length > 0)
            appendChildren(nodes[0], ...children);
    }
};

/**
 * Empty the contents of an element and replace it with new children
 * @param {Node|Node[]|NodeList|HTMLCollection} el element to empty and replace
 * @param {...any} newvals New children to fill with
 */
function emptyAndReplace(el, ...newvals) {
    empty(el);
    appendChildren(el, ...newvals);
};

/**
 * Add event(s) to the element(s)
 * @param {Node|Node[]|NodeList|HTMLCollection} el element(s) to add events to
 * @param {{}} events Events dictionary to add to the element(s)
 * @returns {Node|Node[]|NodeList|HTMLCollection} The element(s) modified
 */
function addEvents(el, events) {
    if (el instanceof Node) {
        getOwnProperties(events).forEach(event => el.addEventListener(event, events[event]));
    }
    else if (el instanceof Array || el instanceof NodeList || el instanceof HTMLCollection) {
        [...el].forEach(elm => addEvents(elm, events));
    }
    return el;
};

/**
 * Add event(s) to the element(s)
 * @param {Node|Node[]|NodeList|HTMLCollection} el element(s) to add events to
 * @param {{}} events Events dictionary to add to the element(s)
 * @returns {Node|Node[]|NodeList|HTMLCollection} The element(s) modified
 */
function removeEvents(el, events) {
    if (el instanceof Node) {
        getOwnProperties(events).forEach(event => el.removeEventListener(event, events[event]));
    }
    else if (el instanceof Array || el instanceof NodeList || el instanceof HTMLCollection) {
        [...el].forEach(elm => removeEvents(elm, events));
    }
    return el;
};

/**
 * Set a set of CSS class lists to element(s)
 * @param {Node|Node[]|NodeList|HTMLCollection} el element to set the class list for
 * @param {{}} classList Dictionary of classes to set or unset
 * @returns {Node|Node[]|NodeList|HTMLCollection} Modified node(s)
 */
function setClassList(el, classList) {
    if (el instanceof Array || el instanceof NodeList || el instanceof HTMLCollection) {
        [...el].forEach(elm => setClassList(elm, classList));
    }
    else {
        getOwnProperties(classList).forEach(key => {
            const doset = b => {
                if (b) el.classList.add(key);
                else el.classList.remove(key);
            };
            let setvalue = classList[key];
            if (setvalue instanceof NotifyingValue) {
                setvalue.addListener(v => window.requestAnimationFrame(() => doset(!!v)));
                setvalue.forceTrigger();
            }
            else {
                doset(!!setvalue);
            }
        });
    }
    return el;
};

/** Class defining binding to the class list of an element */
export class DomClassBinding {
    /** @type {NotifyingValue} */
    #value = null;
    /** @type {HTMLElement} */
    #element = null;
    /** @type {string[]} */
    #currentList = [];

    /**
     * Create a new binding specific to a class list
     * @param {NotifyingValue} value Value to bind to the DOM
     * @param {HTMLElement} element The DOM element to bind to the class of
     * @param {boolean} doset Whether to set the class list to the value immediately
     */
    constructor(value, element, doset) {
        this.#value = value;
        this.#element = element;

        this.#value.addListener(v => window.requestAnimationFrame(() => this.#replace(v)));
        if (doset)
            this.#value.forceTrigger();
    }

    /**
     * Replace the class list with a new class list
     * @param {string} newValue The new classes to have in the class list
     */
    #replace(newValue) {
        var newClasses = newValue.split(' ');
        this.#currentList.filter(c => !newClasses.includes(c))
            .forEach(c => this.#element.classList.remove(c));
        newClasses.filter(c => !this.#currentList.includes(c))
            .forEach(c => this.#element.classList.add(c));
        this.#currentList = newClasses;
    }
}

/**
 * Add CSS class(es) to node(s)
 * @param {Node|Node[]|NodeList|HTMLCollection} el element to add classes to
 * @param {string} className class names to add
 * @returns {Node|Node[]|NodeList|HTMLCollection} Modified node(s)
 */
function addClass(el, className) {
    if (el instanceof Array || el instanceof NodeList || el instanceof HTMLCollection) {
        [...el].forEach(elm => addClass(elm, className));
    }
    else {
        if (className instanceof NotifyingValue)
            new DomClassBinding(className, el, true);
        else
            className.split(' ')
                .filter(c => c && c !== '')
                .forEach(c => el.classList.add(c));
    }
    return el;
};

/**
 * Remove CSS class(es) from node(s)
 * @param {Node|Node[]|NodeList|HTMLCollection} el element to add classes to
 * @param {string} className class names to add
 * @returns {Node|Node[]|NodeList|HTMLCollection} Modified node(s)
 */
function removeClass(el, className) {
    if (el instanceof Array || el instanceof NodeList || el instanceof HTMLCollection)
        [...el].forEach(elm => removeClass(elm, className));
    else
        className.split(' ')
            .filter(c => c && c !== '')
            .forEach(c => el.classList.remove(c));
    return el;
}

/**
 * Set CSS style values
 * @param {Node|Node[]|NodeList|HTMLCollection} el element(s) to modify style on
 * @param {{}} styleObj Dictionary of CSS styles to modify
 * @returns {{}|{}[]} Previous style values that were changed
 */
function setStyle(el, styleObj) {
    let ret = {};
    if (el instanceof Array || el instanceof NodeList || el instanceof HTMLCollection)
        ret = [...el].map(elm => setStyle(elm, styleObj));
    else
        ret = getOwnProperties(styleObj)
            .reduce((ret, style) => {
                ret[style] = el.style.getPropertyValue(style);
                const currStyle = styleObj[style];
                if (currStyle instanceof NotifyingValue) {
                    currStyle.addListener(v => window.requestAnimationFrame(() => el.style.setProperty(style, v)));
                    currStyle.forceTrigger();
                }
                else
                    el.style.setProperty(style, styleObj[style]);
                return ret;
            }, {});
    return ret;
};

/**
 * Set a property on a node
 * @param {HTMLElement} el element to modify
 * @param {string} prop name of the property to modify
 * @param {NotifyingValue|string} value value of the property to set
 */
function setProperty(el, prop, value) {
    if (typeof value === 'undefined')
        el.removeAttribute(prop);
    else if (value instanceof NotifyingValue) {
        value.addListener(v => window.requestAnimationFrame(() => setProperty(el, prop, v)));
        value.forceTrigger();
    }
    else if (prop === 'on')
        addEvents(el, value);
    else if (prop === 'class')
        addClass(el, value);
    else if (prop === 'classList')
        setClassList(el, value);
    else if (prop === 'style') {
        if (typeof value === 'string')
            el.setAttribute(prop, value);
        else
            setStyle(el, value);
    }
    else if (prop === 'innerHTML')
        el.innerHTML = value;
    else
        el.setAttribute(prop, value);
};

/**
 * Set properties on a set of elements
 * @param {HTMLElement|HTMLElement[]|HTMLCollection} el element(s) to modify
 * @param {{}} props Dictionary of properties to modify
 * @returns {HTMLElment|HTMLElement[]|HTMLCollection} element(s) that have been modified
 */
function setProperties(el, props) {
    if (el instanceof Array || el instanceof NodeList || el instanceof HTMLCollection)
        [...el].forEach(elm => setProperties(elm, props));
    else
        getOwnProperties(props)
            .forEach(key => {
                let value = props[key];
                setProperty(el, key, value);
            });
    return el;
};

/** Object used to specify in makeNode that  */
const fragmentUnifier = { __DOMFRAGMENT__: true };

/**
 * Unify elements into a single ImogeneArray
 * @param  {...(Node|Array)} children The children elements to unify
 */
function unifyFragments(...children) {
    return enhanceElements(preprocChildren(children)
        .reduce((p, c) => {
            if (c.toappend) {
                if (c.toappend instanceof Node)
                    p.push(c.toappend);
                else if (c.toappend instanceof Array)
                    p.push(...c.toappend);
            }
        }, []));
}

/**
 * Make a new DOM node
 * @param {string} name The name of the type of element to create
 * @param {...any} children The children to add to the new element
 * @returns {ImogeneArray} A newly created element
 */
function makeNode(name, ...children) {
    if (name === fragmentUnifier)
        return unifyFragments(...children);
    else {
        let newNode = name instanceof Node ? name : document.createElement(name);
        appendChildren(newNode, ...children);
        return enhanceElements([newNode]);
    }
};

/**
 * Get or Set a property on an array of elements or a single element
 * @param {Node|NodeList|HTMLCollection|Node[]} array Array of (or single) Nodes to act on
 * @param {string} prop Name of property to act on
 * @param {...any} val Value, with first being one to set to property, or none to get the current property w/o setting
 */
function property(array, prop, ...val) {
    if (array instanceof Node)
        return property([array], prop, ...val);
    else if (array instanceof NodeList || array instanceof HTMLCollection)
        return property([...array], prop, ...val);
    if (array.length < 1) return;
    let ret = array[0][prop];
    if (val.length >= 1) {
        const value = val[0];
        array.forEach(el => {
            if (typeof value === 'undefined')
                el[prop] = undefined;
            else if (value instanceof NotifyingValue) {
                value.addListener(v => window.requestAnimationFrame(() => property(el, prop, v)));
                value.forceTrigger();
            }
            else if (prop === 'on')
                addEvents(el, value);
            else if (prop === 'class')
                addClass(el, value);
            else if (prop === 'classList')
                setClassList(el, value);
            else if (prop === 'style') {
                if (typeof value === 'string')
                    el.setAttribute(prop, value);
                else
                    setStyle(el, value);
            }
            else
                el[prop] = value;
        });
    }
    return ret;
};

/**
 * Remove nodes from the UI
 * @param {Node | Node[] | NodeList | HTMLCollection} nodeArray Node(s) to remove from the UI
 */
function removeNode(nodeArray) {
    if (nodeArray instanceof Array || nodeArray instanceof NodeList ||
            nodeArray instanceof HTMLCollection)
        [...nodeArray].forEach(item => removeNode(item));
    else if (nodeArray instanceof Node)
        nodeArray.remove();
    return nodeArray;
};

/**
 * Insert nodes before another in a DOM tree
 * @param {Node | Node[] | NodeList | HTMLCollection} node Node or array of Nodes to insert new nodes before
 * @param {...(string | Node)} nodes New nodes to insert before existing nodes
 */
function insertBefore(node, ...nodes) {
    if (node instanceof Array || node instanceof NodeList || node instanceof HTMLCollection) {
        if (node.length > 0)
            insertBefore(node[0], ...nodes);
    }
    else {
        preprocChildren(...nodes).forEach(child => {
            if (child.toappend) {
                if (child.toappend instanceof Node)
                    node.before(child.toappend);
                else if (child.toappend instanceof NotifyingValue)
                    new DomBinding(child.toappend, node, x => node.before(x));
                else if (child.toappend instanceof Object)
                    setProperties(node, child.toappend);
            }
        });
    }
    return node;
};

/**
 * Insert nodes after another in a DOM tree
 * @param {Node | Node[] | NodeList | HTMLCollection} node Node or array of Nodes to insert new nodes after
 * @param {...(string | Node)} nodes New nodes to insert after existing nodes
 */
function insertAfter(node, ...nodes) {
    if (node instanceof Array || node instanceof NodeList || node instanceof HTMLCollection) {
        if (node.length > 0)
            insertAfter(node[node.length - 1], ...nodes);
    }
    else {
        preprocChildren(...nodes).reverse().forEach(child => {
            if (child.toappend) {
                if (child.toappend instanceof Node)
                    node.after(child.toappend);
                else if (child.toappend instanceof NotifyingValue)
                    new DomBinding(child.toappend, node, x => node.after(x));
                else if (child.toappend instanceof Object)
                    setProperties(node, child.toappend);
            }
        });
    }
    return node;
};

/**
 * Find the matching children of a parent element
 * @param {Node} parentEl parent element
 * @param {string[]} query Any queries to run
 */
function findChildrenSingleParent(parentEl, ...query) {
    return query
        .map(q =>
            [...parentEl.querySelectorAll(q)])
        .reduce((p, c) => {
            p.push(...c);
            return p;
        }, []);
}

/**
 * Find the matching children of a parent element or elements
 * @param {Node | Node[] | NodeList | HTMLCollection} parentEl parent element
 * @param {string[]} query Any queries to run
 */
function findChildren(parentEl, ...query) {
    if (parentEl instanceof Node)
        return enhanceElements(findChildrenSingleParent(parentEl, ...query))
    else if  (parentEl instanceof Array ||
            parentEl instanceof NodeList ||
            parentEl instanceof HTMLCollection)
        return enhanceElements(
            [...parentEl].map(currParent => findChildrenSingleParent(currParent, ...query))
                .reduce((p, c) => {
                    p.push(...c);
                    return p;
                }, []));
}

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
 * @property {(...query: string[]) => ImogeneArray} find
 * @property {HTMLElement[]} array
 *
 * @typedef {Array<HTMLElement> & ImogeneArrayBase} ImogeneArray
 */

/**
 * Enhance an element or array of elements with useful functions
 * @param {ImogeneArray} array array to enhance
 * @returns {ImogeneArray} enhanced array
 */
function enhanceElements(array) {
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
            removeClass: (className) => removeClass(array, className),
            setStyle: (styles) => setStyle(array, styles),
            setProperties: (props) => setProperties(array, props),

            prop: (name, ...val) => property(array, name, ...val),

            remove: () => removeNode(array),
            before: (...nodes) => insertBefore(array, ...nodes),
            after: (...nodes) => insertAfter(array, ...nodes),

            find: (...query) => findChildren(array, ...query),

            array: array,
            ___imogeneExtended___: true
        };
        Object.assign(array, extendWith);
    }
    else if (array instanceof NodeList || array instanceof HTMLCollection)
        return enhanceElements([...array]);
    else if (array instanceof Node)
        return enhanceElements([array]);
    return array;
};

/** Make an empty Imogene Element Array
 * @returns {ImogeneArray}
 */
const makeEmpty = () => enhanceElements([]);

/** Find all elements that match a given set of queries
 * @param {string[]} query Queries to run search for (see querySelectorAll)
 * @returns {ImogeneArray}
 */
function findElements(...query) {
    return enhanceElements(query.map(q => [...document.querySelectorAll(q)])
        .reduce((p, v) => {
            p.push(...v);
            return p;
        }, []));
}

 /**
  * Create a new events handler object
  * @returns {EventsHandler} a new events handler object
  */
 const event = () => new EventsHandler();

 /**
  * Create a new notifying value object
  * @param {any} v Initial value
  * @param {Function} [t] translation function
  * @returns {NotifyingValue} a new notifying value object containing the value
  */
const value = (v, t) => new NotifyingValue(v, t);

  /**
   * Create a new array of notifying values
   * @param {number} n Length of array to create
   * @param {Function} g Getter for initial values
   * @returns {NotifyingValue[]} Newly created array
   */
function valueArray(n, g = (i) => i) {
    let ret = [];
    for (let i = 0; i < n; ++i) {
        ret.push(value(g(i)));
    }
    return ret;
};

/**
 * Construct a new binding
 * @param {any} value value to bind to
 * @param {HTMLElement} container container to bind the value to
 * @param {(x: HTMLElement) => void} [insert] method used to insert DOM elements
 * @param {Array} [exist] Any existing elements to replace, if applicable
 */
const bind =
    (value, container, insert = (x => container.appendChild(x)), exist = null) =>
        new DomBinding(value, container, insert, exist);

/** Collection of exports for Imogene functionality */
export const Imogene = {
    getOwnProperties: getOwnProperties,
    camelize: camelize,
    runOnLoad: runOnLoad,

    event: event,
    value: value,
    valueArray: valueArray,
    bind: bind,

    parentElements: parentElements,
    empty: empty,
    appendChildren: appendChildren,
    emptyAndReplace: emptyAndReplace,

    addEvents: addEvents,
    removeEvents: removeEvents,
    setClassList: setClassList,
    addClass: addClass,
    removeClass: removeClass,
    setStyle: setStyle,
    setProperties: setProperties,

    make: makeNode,
    makeEmpty: makeEmpty,
    enhance: enhanceElements,
    fragBase: fragmentUnifier,
    unify: unifyFragments,

    prop: property,

    removeNode: removeNode,
    insertBefore: insertBefore,
    insertAfter: insertAfter,

    findChildren: findChildren,
    find: findElements
};

