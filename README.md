# Imogene

This is a basic Javascript library for doing things. It is more-or-less structured together, but really just a compilation of useful bits. This is a diverse library built around DOM manipulations, with the addition of a binding interface and a few useful random utilities I find myself commonly using around the DOM.

##### Table of Contents
- [Suggested Use](#suggested-use)
- [Primary Access Interface](#primary-access-interface)
- [Binding Data](#binding-data)
- [License](#license)



## Suggested Use

Suggested use of importing this library may be like this:
```javascript
import { Imogene as $, ImogeneExports as $_ } from 'Imogene';
```

Note: at this point, you can get by with everything just using the so called `$_` syntax here. The `$` function might even be more difficult to read without any real advantages. IDK. It's been fun.

## Primary Access Interface

The `$` syntax is remarkable for only kind of following a jQuery type syntax, although it specifically diverges and has no intent in maintaining jquery-ness. The `$_` syntax is an object containing a handful of shortcuts. For example, the following is possible:
```javascript
const checkbox = $("#mycheckbox");
$_.setProperties(checkbox, {
	checked: true
});

// there is even some nesting; e.g:
const myNestedCheckbox = $("#mycontainer", "#mycheckbox"); 
const myNestedCheckboxSame = $_.findChildren('#mycontainer', '#mycheckbox');
// myNestedCheckbox = elements w/ id "mycheckbox" in a container w/ id "mycontainer"
// also, this is all basically the same, too:
const myContainer = $("#mycontainer");
const anotherNestedCheckbox = $(myContainer, '#mycheckbox');
const anotherNestedCheckboxSame = myContainer.find('#mycheckbox');
const alsoMyContainer $_.find('#mycontainer);
const thatSameNestedCheckbox = alsoMyContainer.find('#mycheckbox');
const stillSameNestedCheckbox = $_.findChildren(alsoMyContainer, '#mycheckbox');

// Run something on startup, once DOM is appropriately loaded into the browser?
$(() => {
    // Do it here!
});
$_.runOnLoad(() => {
    // Or in here!
});

// Can also make new elements by passing in array only, as if parameters to make method! For example:
const myNewCheckbox = $(['label', /*{ label properties could go here... },*/
	['input', {
		type: 'checkbox',
		classList: { hidden: false, 'my-special-checkbox': true },
		on: { click: e => alert('Oh, you clicked my checkbox!') }
	}], 'Clickable checkbox!!']);
// also do it with $_.make :
const antherNewCheckbox = $_.make('label', /*{ label properties could go here... },*/
	['input', {
		type: 'checkbox',
		classList: { hidden: false, 'my-special-checkbox': true },
		on: { click: e => alert('Oh, you clicked my checkbox!') }
	}], 'Clickable checkbox!!');

// The $_ object is as follows:
$_ = {
    getOwnProperties: (obj) => string[], // Get the name of properties of an object into a 
    camelize: (string) => string, // Turn a string into camel case
    flattenSlots: (slot) => Node[], // flattens slots to their actual DOM represented elements
    runOnLoad: (function) => Promise, // runs a function once the DOM is fully loaded, returning a promise that completes upon finishing said function

    event: () => EventHandler, // Construct a new EventHandler that can listen to and run events
    value: (initial, [(in) => out]) => NotifyingValue, // Creates a NotifyingValue for binding in DOM 
    valueArray: (size, default) => NotifyingValue[], // Create an array of NotifyingValues for binding in DOM
    bind: (any, HTMLElement, [insert: (x: HTMLElement) => void], [exist: Array]) => DomBinding, // create a new dom binding (this can be useful but easier to just create a value and add it as a child with methods below, tbh)
	
    parentElements: (Node|Node[]) => Node[], // Get direct parent elements of nodes
    empty: (Node|Node[]) => void, // empty out elements
    appendChildren: (Node|Node[], ...children) => void, // append children to an element
    emptyAndReplace: (Node|Node[], ...chidren) => void, // like empty then appendChildren
	
    addEvents: (Node|Node[], {}) => Node|Node[], // Add event listeners to an element
    removeEvents: (Node|Node[], {}) => Node|Node[], // Remove event listeners from an element
    setClassList: (Node|Node[], {}) => Node|Node[], // Set the class list to t
    addClass: (Node|Node[], string) => Node|Node[], // add CSS classes to the nodes
    setStyle: (Node|Node[], {}) => [], // Set CSS Styles to nodes
    setProperties: (Node|Node[], {}) => any, // Set HTML Attributes on nodes

    make: (elementName, [{properties}], ...children) => Node[], // Make new DOM elementsstring array
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

The `$` syntax used to find and modify DOM elements returns an array of elements that is extended with additional functionality. The `$_.enhance` method will also enhance an existing array of nodes with this same functionality upon request, and any query from the `$_.find` etc. is also enhanced with these same extensions. Some code elaboration:
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
	after: (...nodes) => Node, // Insert additional nodes just after the last element in the array,
	find: (...query) => Node[] // Find children nodes that match given queries
};

//e.g.
$('#mylabel').emptyAndReplace('Something different');
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
```

There is a `DomBinding` class, but it is not advised to use this directly. Instead, use the exported methods through the `$` or `$_` interfaces (i.e. `Imogene` or `ImogeneExports` respectively). The `$_` includes a `bind` method which creates the `DomBinding` class, but you should spend some time studying the code and understanding it before using. Simply appending a `NotifyingValue` with `make`, `setProperties`, `appendChildren`, `emptyAndReplace`, `insertBefore`, and `insertAfter` all create this binding in more obvious manners.


# LICENSE

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software, either in source code form or as a compiled binary, for any purpose, commercial or non-commercial, and by any means.

In jurisdictions that recognize copyright laws, the author or authors of this software dedicate any and all copyright interest in the software to the public domain. We make this dedication for the benefit of the public at large and to the detriment of our heirs and successors. We intend this dedication to be an overt act of relinquishment in perpetuity of all present and future rights to this software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to http://unlicense.org/
