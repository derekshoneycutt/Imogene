
/**
 * Get the owned properties of an object
 * @param {any} o Object to get the properties of
 * @returns {string[]} Owned properties of the object
 */
export const getOwnProperties = (o) => Object.keys(o).filter(v => o.hasOwnProperty(v));

/**
 * Create a new text element to insert into HTML document
 * @param {string} txt Text to create a text node for
 * @returns {HTMLSpanElement} New <span> including the text
 */
export const createTextNode = (txt) => {
    /*let span = document.createElement('span');
    span.classList.add('imogene-text-node');
    span.appendChild(document.createTextNode(txt));
    return span;*/
    return document.createTextNode(txt);
};

/**
 * Run a function once the page has loaded and is ready for processing
 * @param {Function} fn function to run
 * @returns {Promise} Promise that resolves when the function has run
 */
export const runOnLoad = (fn) =>
    new Promise(
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
