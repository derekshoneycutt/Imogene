# Imogene

This is a basic Javascript library for doing things. It is more-or-less structured together, but really just a compilation of useful bits. This is a diverse library built around DOM manipulations, with the addition of a binding interface and a few useful random utilities I find myself commonly using around the DOM.

I used to have a whole jquery-copied interface, but I found this annoying and just harder to read, so now I prefer interaction through a single object interface (see below). This also helps maintain a sub-1000 lines, including extensive comments. Run through a minifier, the code is tiny. I like it.

##### Table of Contents
- [Suggested Use](#suggested-use)
- [Primary Access Interface](#primary-access-interface)
- [Binding Data](#binding-data)
- [License](#license)



## Suggested Use

Suggested use of importing this library may be like this:
```javascript
import { Imogene as $_ } from 'Imogene';
```

Note: I like the `$_` syntax and will use it below, but you can really just import `Imogene` and use it like that if you like.

## Primary Access Interface

The `$_` syntax is an object containing a handful of shortcuts. For example, the following is possible:
```javascript
const checkbox = $_.find("#mycheckbox");
$_.setProperties(checkbox, {
	checked: true
});

// there is even some nesting; e.g:
const myNestedCheckbox = $_.findChildren('#mycontainer', '#mycheckbox');
// myNestedCheckbox = elements w/ id "mycheckbox" in a container w/ id "mycontainer"
// also, this is all basically the same, too:
const myContainer $_.find('#mycontainer');
const thatSameNestedCheckbox = myContainer.find('#mycheckbox');
const stillTheSameNestedCheckbox = $_.findChildren(myContainer, '#mycheckbox');

// Run something on startup, once DOM is appropriately loaded into the browser?
$_.runOnLoad(() => {
    // Or in here!
});

// Can also make new elements, as if parameters to make method! For example:
const antherNewCheckbox = $_.make('label', /*{ label properties could go here... },*/
	['input', {
		type: 'checkbox',
		classList: { hidden: false, 'my-special-checkbox': true },
		on: { click: e => alert('Oh, you clicked my checkbox!') }
	}], 'Clickable checkbox!!');

// The Imogene or $_ object is as follows:
_ = {
    getOwnProperties: (obj) => string[], // Get the name of properties of an object into a 
    camelize: (string) => string, // Turn a string into camel case
    flattenSlots: (slot) => Node[], // flattens slots to their actual DOM represented elements
    runOnLoad: (function) => Promise, // runs a function once the DOM is fully loaded, returning a promise that completes upon finishing said function

    event: () => EventHandler, // Construct a new EventHandler that can listen to and run events
    value: (initial, [(in) => out]) => NotifyingValue, // Creates a NotifyingValue for binding in DOM 
    valueArray: (size, default) => NotifyingValue[], // Create an array of NotifyingValues for binding in DOM
    bind: (bindValue: any, container: HTMLElement[, insert: (newvalue: HTMLElement) => void][, exist: Array]) => DomBinding, // create a new dom binding from a value to a container, optionally including a custom insert function and pointer to existing array of elements representing the binding, if any
	
    parentElements: (Node|Node[]) => Node[], // Get direct parent elements of nodes
    empty: (Node|Node[]) => void, // empty out elements
    appendChildren: (Node|Node[], ...children) => void, // append children to an element
    emptyAndReplace: (Node|Node[], ...chidren) => void, // like empty then appendChildren
	
    addEvents: (Node|Node[], {}) => Node|Node[], // Add event listeners to an element
    removeEvents: (Node|Node[], {}) => Node|Node[], // Remove event listeners from an element
    setClassList: (Node|Node[], {}) => Node|Node[], // Set the class list to t
    addClass: (Node|Node[], string) => Node|Node[], // add CSS classes to the nodes
    removeClass: (Node|Node[], string) => Node|Node[], // remove CSS classes from the nodes
    setStyle: (Node|Node[], {}) => [], // Set CSS Styles to nodes
    setProperties: (Node|Node[], {}) => any, // Set HTML Attributes on nodes

    make: (elementName, [{properties}], ...children) => Node[], // Make new DOM elements from array
    makeEmpty: () => Node[], // make an empty array of nodes (sometimes useful)
    enhance: (Node[]) => Node[], // enhance an array of nodes with additional functionality (see below)

    prop: (Node|Node[], string, [...values]) => values[], // Gets/Sets a property across on node(s)

    removeNode: (Node|Node[]) => Node|Node[], // remove node(s) from the DOM tree
    insertBefore: (Node|Node[], ...children) => Node|Node[], // Insert children directly before an existing node(s)
    insertAfter: (Node|Node[], ...children) => Node|Node[], // Insert children directly after an existing node(s)

    findChildren: (Node|Node[], ...query) => Node[], // Find children of node(s) matching a query/queries
    find: (...query) => Node[], // find all nodes that match a given query/queries
};
```

The functions used to find and modify DOM elements often return an array of elements that is extended with additional functionality. Basically, any function returning Node[] explicitly will have that array enhanced. The `$_.enhance` method will also enhance an existing array of nodes with this same functionality upon request. Some code elaboration:
```javascript
const checkbox = $_.find('#mycheckbox');

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
	removeClass: className => checkbox, // remove a space-separated list of CSS classes from the elements
	setStyle: ({}) => [], // Set CSS styles; property names of passed object is CSS property
	setProperties: ({}) => any, // Set HTML attributes as properties
	prop: (name, ...val) => any, // Get or set a single JS property of the first element in the array
	remove: () => void, // remove the elements from the DOM tree
	before: (...nodes) => Node, // Insert additional nodes just before the first element in the array
	after: (...nodes) => Node, // Insert additional nodes just after the last element in the array,
	find: (...query) => Node[] // Find children nodes that match given queries
};

//e.g.
$_.find('#mylabel').emptyAndReplace('Something different');
checkbox.addEvents({ click: e => alert('clicked!') });
checkbox.setClassList({ hidden: false, 'my-special-class': true });
checkbox.setStyle({ 'border-bottom': '1px solid #000' });
```

## Binding Data

There is some basic binding capability using NotifyingValue (backed by EventsHandler) and an internal binding class to update the DOM. An example:
```javascript
let myval = $_.value("Hello");
const newElement = $_.make('div', myval);
/* ... later */
myval.set("Goodbye"); /* Updates text in the element */
```

`EventsHandler` Is a simple class that handles events. A new instance may be created with `$_.event()`. For example:
```javascript
const myEvent = $_.event();

const myEventHandler = (value) => alert(`Hey, you did ${value}!`);
myEvent.addListener(myEventHandler);
myEvent.dispatch('something cool!'); // shows alert, 'Hey, you did something cool!'
myEvent.removeListener(myEventHandler);
myEvent.clear();

```

`NotifyingValue` is built upon the eventshandler to store a value and notifying when its time is complete. This is kind of like the built in Proxy class, but just simpler. Example:
```javascript
const myGoodValue = $_.value(true, v => v ? 'A GOOD thing' : 'A BAD thing');
const newElement = $_.make('div', myGoodValue);

myGoodValue.get(); // true
myGoodValue.set(false); // updates newElement's text to 'A BAD thing'
const myEventHandler = value => alert(`Showing: ${value}`);
myGoodValue.addListener(myEventHandler);
myGoodValue.forceTrigger(); // shows alert: 'Showing A BAD thing'
myGoodValue.removeListener(myEventHandler);
myGoodValue.clearEvents(); // Breaks DOM binding!

// another simple example:
const doHideDiv = $_.value(false);
const divTitle = $_.value('a tooltip text for my div!');
const myExisting = $_.find('#my-div');
myExisting.setProperties({
	classList: { hidden: doHideDiv },
	title: divTitle
}); // note: could just use setClassList directly, too, but since doing both...
// ...
divTitle.set('a different tooltip text!');
// ...
doHideDiv.set(true); // if 'hidden' class makes 
```

There is a `DomBinding` class, but it is not advised to use this directly. Instead, use the exported methods through the `$_` extended DOM methods. The `$_` includes a `bind` method which creates the `DomBinding` class, but you should spend some time studying the code and understanding it before using. Simply appending a `NotifyingValue` with `make`, `setProperties`, `appendChildren`, `emptyAndReplace`, `insertBefore`, and `insertAfter` all create this binding in more obvious manners.

