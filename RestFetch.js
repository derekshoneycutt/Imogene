
/**
 * @typedef {Object} RestLink
 * @property {string} rel
 * @property {string} method
 * @property {string} href
 * @property {any} [postData]
 */

/**
 * @typedef {Object} RestObject
 * @property {RestLink[]} links
 */

/**
 * @callback RestFetchObjectRefresh
 * @param {any} [body]
 * @returns {Promise<RestFetchObject>}
 */

/**
 * @typedef {Object} RestFetchObject
 * @property {string[]} linkNames
 * @property {RestFetchObjectRefresh} [refresh]
 * @property {RestFetchObjectRefresh} [getFull]
 */

/**
 * @callback RestFetchErrorCallback
 * @param {Number} Id Identifier of error type
 * @param {any} Err Error object
 */

/**
 * @callback RestFetchAlterHrefCallback
 * @param {string} Href value to modify before calling
 * @returns {string} Modified Href value
 */

/**
 * @callback RestLinkFetchMethod
 * @param {any} [body] The body, if any, to send
 * @param {any} [details] Details to add to the fetch data
 * @param {Boolean} [simple] Whether the body data should be sent simply w/o translate to JSON string
 * @param {RestFetchErrorCallback} [overrcallback] Optional overriding error callback
 * @param {RestFetchAlterHrefCallback} [alterhref] Optional method to alter the href being sent
 * @returns {RestFetchObject} a parsed RestFetchObject from a server fetch
 */

/**
 * @typedef {Object} RestLinkTranslated
 * @property {string} name
 * @property {string} method
 * @property {string} href
 * @property {RestLinkFetchMethod} func
 * @property {any} [postData]
 */

/**
 * Make a query to a REST server, returning the result as a processed JS object
 * @param {string} baseUrl Base URL entry to use for queries
 * @param {string} startUrl The first URL to enter into
 * @param {string} [method] Method to use in first fetching (default: GET)
 * @param {any} [body] The body, if any, to send in first fetch
 * @param {any} [details] Details to add to the first fetch data
 * @param {Boolean} [simple] Whether the first body data should be sent simply w/o translate to JSON string
 * @param {RestFetchErrorCallback} [errcallback] Function to call when an error is encountered
 * @returns {RestFetchObject} The first entry point to the RESTful application
 */
export default function RestFetch(baseUrl, startUrl, method, body, details, simple, errcallback) {
    /**
     * Get the Owned Properties of an object
     * @param {any} o Object to get properties of
     * @returns {string[]} Names of properties that object owns
     */
    const getOwnProperties = o => Object.keys(o).filter(v => o.hasOwnProperty(v));

    /**
     * Perform a fetch on the server
     * @param {string} url URL to fetch
     * @param {string} [method] Method to use in fetching (default: GET)
     * @param {any} [body] The body, if any, to send
     * @param {any} [details] Details to add to the fetch data
     * @param {Boolean} [simple] Whether the body data should be sent simply w/o translate to JSON string
     * @param {RestFetchErrorCallback} [overrcallback] Optional overriding error callback
     * @returns {RestFetchObject} a parsed RestFetchObject from a server fetch
     */
    async function doFetch(url, method, body, details, simple, overrcallback) {
        const useerrcallback = overrcallback ?
                                overrcallback :
                                (errcallback ? errcallback : () => {});


        let fetchData = {
            method: method || 'GET',
            headers: {
                Accept: 'application/json'
            },
            credentials: 'include'
        };
        if (details) Object.assign(fetchData, details);
        if (body && !simple) {
            fetchData.headers['Content-Type'] = 'application/json';
            fetchData.body = JSON.stringify(body);
        }
        else if (body && simple) {
            fetchData.body = body;
        }
        else if (method === 'POST') {
            fetchData.headers['Content-Type'] = 'application/json';
            fetchData.body = null;
        }

        let resp;
        try {
            resp = await fetch(baseUrl + url, fetchData);
        }
        catch (error) {
            useerrcallback(1, error);
            return null;
        }

        if (!resp.ok) {
            useerrcallback(11, resp);
            return null;
        }

        let data;
        try {
            data = await resp.json();
        }
        catch (jsonerror) {
            useerrcallback(21, jsonerror);
            return null;
        }

        return transformResponse(data);
    }

    /**
     * Translate a REST link object
     * @param {RestLink} link REST link object
     * @param {string} method HTTP method to translate the link for
     * @returns {RestLinkTranslated} A temporarily constructed rest link with func
     */
    function translateLink(link, method) {
        let rel = link.rel;
        if (rel.toLowerCase() === 'self')
            rel = '';
        const name = method.toLowerCase() + rel;

        return {
            name: name,
            method: method,
            href: link.href,
            func: ({ body, details, simple, overrcallback, alterhref } = {}) =>
                doFetch(alterhref ? alterhref(link.href) : link.href,
                        method, body, details, simple, overrcallback),
            postData: link.postData
        };
    }

    /**
     * Transform a resposne from the server into a RestFetchObject
     * @param {RestObject} data REST object to translate into the RestFetchObject
     * @returns {RestFetchObject} Transformed object
     */
    function transformResponse(data) {
        if (typeof data === 'string' || data instanceof String || !data.links)
            return data;

        /** @type {RestFetchObject} */
        let ret = {
            linkNames: []
        };

        getOwnProperties(data).forEach(prop => {
            if (prop !== 'links') {
                const dat = data[prop];
                if (dat instanceof Array)
                    ret[prop] = dat.map(v => transformResponse(v));
                else
                    ret[prop] = transformResponse(dat);
            }
        });

        data.links.forEach(link => {
            link.method.split('|').forEach(method => {
                const addLink = translateLink(link, method);
                if (addLink.method !== 'OUT') {
                    ret.linkNames.push(addLink.name);
                    ret[`${addLink.name}`] = addLink.func;
                    ret[`${addLink.name}PostData`] = addLink.postData;
                    ret[`${addLink.name}Href`] = addLink.href;
                }
                else
                    ret[`${addLink.name}`] = addLink.href;

                if (link.rel === 'self' && method === 'GET') {
                    ret.refresh = addLink.func;
                    ret.getFull = addLink.func;
                }
            });
        });

        return ret;
    }

    // Do a fetch for the start URL and return the Promise for that query
    return doFetch(startUrl, method, body, details, simple);
}
