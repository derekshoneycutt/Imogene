# Imogene

This is a basic Javascript library for doing things. It is more-or-less structured together, but really just a compilation of useful bits. This is a diverse library built around DOM manipulations and an automatic client for compatible RESTful interfaces (e.g. the backend included in this project).

Suggested use of importing this library may be like this:
```javascript
import { Imogene as $, ImogeneExports as $_ } from 'Imogene';
```

The `$` syntax is remarkable for only kind of following a jQuery type syntax. The `$_` syntax is an object containing a handful of shortcuts. For example, the following is possible:
```javascript
const checkbox = $("#mycheckbox");
$_.setProperties(checkbox, {
	checked: true
});

// Can also make new elements by passing in array only, as if parameters to make method! For example:
const myNewCheckbox = $(['label', /*{ label properties could go here... },*/
	['input', {
		type: 'checkbox',
		classList: { hidden: false, 'my-special-checkbox': true },
		on: { click: e => alert('Oh, you clicked my checkbox!') }
	}], 'Clickable checkbox!!']);

// The $_ object is as follows:
$_ = {
	shortQuery: (...query) => any, // The same as the Imogene or $ method

    value: (initial, [(in) => out]) => NotifyingValue, // Creates a NotifyingValue for binding in DOM 
    valueArray: (size, default) => NotifyingValue[], // Create an array of NotifyingValues for binding in DOM
    event: () => EventHandler, // Construct a new EventHandler that can listen to and run events

    flattenSlots: (slot) => Node[], // flattens slots to their actual DOM represented elements
    make: (elementName, [{properties}], ...children) => Node[], // Make new DOM elements
    getOwnProperties: (obj) => string[], // Get the name of properties of an object into a string array
    camelize: (string) => string, // Turn a string into camel case

    RestFetch: (baseUrl, startUrl[, method[, body[, details]]]) => Promise, // Perform a fetch to the home entry of a RESTful web service (see below)

	// These are very similar to the extensions from the $ syntax described below; see below for more
    empty: (Node|Node[]) => void, // empty out elements
    appendChildren: (Node|Node[], ...children) => void, // append children to an element
    emptyAndReplace: (Node|Node[], ...chidren) => void, // like empty then appendChildren
    parentElements: (Node|Node[]) => Node[], // Get direct parent elements of nodes
    addEvents: (Node|Node[], {}) => Node|Node[], // Add event listeners to an element
    removeEvents: (Node|Node[], {}) => Node|Node[], // Remove event listeners from an element
    setClassList: (Node|Node[], {}) => Node|Node[], // Set the class list to t
    addClass: (Node|Node[], string) => Node|Node[], // add CSS classes to the nodes
    setStyle: (Node|Node[], {}) => [], // Set CSS Styles to nodes
    setProperties: (Node|Node[], {}) => any // Set HTML Attributes on nodes
};
```

The `$` syntax used to find and modify DOM elements returns an array of elements that is extended with additional functionality. Some code elaboration:
```javascript
const checkbox = $('#mycheckbox');

//checkbox is now an array, as returned from document.querySelectorAll, with the additional extended methods:
const checkbox_extended = {
	empty: () => void, //empties the elements of all inner content
	parentElements: () => Node[], //gets array of direct parent elements
	appendChildren: (...children) => void, // append children to the elements
	emptyAndReplace: (...children) => void, // like doing empty() then appendChildren(...children)
	addEvents: ({}) => checkbox, // listen to events; property names of passed object is names of events
	removeEvents: ({}) => checkbox, // reverse of addEvents
	setClassList: ({}) => checkbox, // sets class list; property names of passed object is names of classes, values should be true/false
	addClass: className => checkbox, // add a space-separated list of CSS classes to the elements
	setStyle: ({}) => [], // Set CSS styles; property names of passed object is CSS property
	setProperties: ({}) => any, // Set HTML attributes as properties
	prop: (name, ...val) => any, // Get or set a single JS property of the first element in the array
	remove: () => void, // remove the elements from the DOM tree
	before: (...nodes) => Node, // Insert additional nodes just before the first element in the array
	after: (...nodes) => Node, // Insert additional nodes just after the last element in the array
};

//e.g.
$('#mylabel').emptyAndReplace('Something different');
checkbox.addEvents({ click: e => alert('clicked!') });
checkbox.setClassList({ hidden: false, 'my-special-class': true });
checkbox.setStyle({ 'border-bottom': '1px solid #000' });
```


There is some basic binding capability using NotifyingValue (backed by EventsHandler) and an internal binding class to update the DOM. An example:
```javascript
let myval = $_.value("Hello");
const newElement = $(['div', myval]);
/* ... later */
myval.set("Goodbye"); /* Updates text in the element */
```

The `RestFetch` interface is a wrapper over Javascript's `fetch` that automatically constructs a chain of functions that perform `fetch` based upon hyperlink data. This enables a complete interface to a compatible RESTful API. A compatible API must return JSON that essentially follows this pattern:
```json
{
	...,
	"links": [
		{
			"rel": "This becomes the function name in the JS object",
			"method": "HTTP methods supported, separated by a |",
			"href": "address to query",
			"[postData]": "Any string or object representing a template to send back in POST requests"
		},
		...
	]
}
```
Every link will be translated into a function on the returned object of `RestFetch`, based upon method and rel string. For example, using `RestFetch` may look like this:
```javascript
let data = await $_.RestFetch('/api/', 'portfolio', err_callback);
let settings = await data.getSettings(); 
let postData = Object.assign({}, settings.postAddressPostData);
postData.address = '123 New Address Lane';
await settings.postAddress(postData);
```