import { makeNode } from './DomMods';
import NotifyingValue from './NotifyingValue';
import DOMPurify from 'dompurify';

/**
 * @typedef {Object} Binding
 * @property {any} value Value
 * @property {number} index Index of the binding
 * @property {boolean} discovered Whether the binding has been rediscovered
 */

/**
 * Get the XML string and related bindings from a template
 * @param {string[]} strings Strings to process
 * @param {...any} values Values to process into the string
 * @returns {[string, Binding[]]} value
 */
function templateGetHtmlAndBindings(strings, ...values) {
    let bindings = [];
    let bindOn = 0;

    let stringArr = strings.reduce((p, v, i) => {
        p.push(v);
        const value = values[i];
        if (value) {
            if (typeof value === 'string')
                p.push(value.trim());
            else if (value instanceof NotifyingValue || value instanceof Node ||
                value instanceof Array || value instanceof HTMLCollection ||
                value instanceof NodeList || value instanceof Object) {
                let binding = {
                    value: value,
                    index: bindOn,
                    discovered: false
                };
                bindings.push(binding);
                p.push(`{%%{_BINDING_${bindOn}_}%%}`);
                ++bindOn;
            }
            else
                p.push(`${value}`.trim());
        }
        return p;
    }, []);

    return [stringArr.join(''), bindings];
}

/**
 * Add a property to a props object from an attribute
 * @param {Binding[]} bindings Bindings
 * @param {{}} props properties object
 * @param {Attr} attr attribute
 * @returns {{}} properties object
 */
function addPropertyFromAttribute(bindings, props, attr) {
    let ret = [props];
    const name = attr.name;
    let value = attr.value.trim();
    const m = value.match(/^\{%%\{_BINDING_([0-9]*)_\}%%\}$/);
    if (m) {
        const index = parseInt(m[1]);
        if (index >= 0 && index < bindings.length) {
            var binding = bindings[index];
            binding.discovered = true;
            value = binding.value;
        }
        else {
            value = undefined;
        }
    }

    if (name.substr(0, 2) === 'on') {
        let events = props.on || (props.on = {});
        if (name === 'on')
            Object.assign(events, value);
        else
            props.on[name.substr(2)] = value;
    }
    else if (name === 'events') {
        let events = props.on || (props.on = {});
        Object.assign(events, value);
    }
    else if (name === 'class-list') {
        let classlist = props.classList || (props.classList = {});
        if (value instanceof NotifyingValue)
            ret.push({ classList: value });
        else
            Object.assign(classlist, value);
    }
    else if (name === 'props') {
        if (value instanceof NotifyingValue)
            ret.push(value);
        else
            Object.assign(props, value);
    }
    else {
        props[name] = value;
    }

    return ret;
}

/**
 * Translate XML Text Nodes into the appropriate equivalent for the template (includes finding bindings)
 * @param {string} nodeText text to parse
 * @param {Binding[]} bindings bindings to match, if found
 * @returns {(Node|string)[]} array of parts making the text node
 */
function getTextParts(nodeText, bindings) {
    if (nodeText.trim() === '')
        return [];

    let m = nodeText.match(/^([.\s\S]*)\{%%\{_BINDING_([0-9]*)_\}%%\}([.\s\S]*)$/);
    if (m) {
        let ret = [...getTextParts(m[1].trim(), bindings)];
        const index = parseInt(m[2]);
        if (index >= 0 && index < bindings.length) {
            var binding = bindings[index];
            binding.discovered = true;
            ret.push(binding.value);
        }
        ret.push(...getTextParts(m[3].trim(), bindings));
        return ret;
    }

    return [nodeText];
}

/**
 * Translate the XML element passed into 
 * @param {Element} element element to translate
 * @param {Binding[]} bindings bindings to work with
 * @returns {any} Item used to render the DOM
 */
function getTemplateFromXml(element, bindings) {
    const tag = element.tagName;
    let ret = [tag];

    let props = [...element.attributes]
        .reduce((props, attr) =>
            props.concat(addPropertyFromAttribute(bindings, props[0], attr).slice(1)),
            [{}]);

    let children =
        [...element.childNodes]
            .reduce((ret, elm) => {
                let append = [];
                if (elm instanceof Text)
                    append = getTextParts(elm.nodeValue.trim(), bindings);
                else
                    append = [getTemplateFromXml(elm, bindings)];
                ret.push(...append);
                return ret;
            }, []);
        
    ret.push(...props, ...children);

    return ret;
}

/**
 * Generator for creating a template that works with other DOM components
 * @param {string[]} strings HTML strings to build around
 * @param {...any} values Values to bind into the HTML
 * @returns {HTMLElement} Newly created DOM
 */
export function ImogeneTemplate(strings, ...values) {
    let [html, bindings] = templateGetHtmlAndBindings(strings, ...values);

    let domparse = new DOMParser();
    let doc = domparse.parseFromString(html, 'application/xml');
    let xmlElem = doc.documentElement;

    if (!xmlElem) return;

    var retArray = getTemplateFromXml(xmlElem, bindings);
    return makeNode(...retArray);
}
