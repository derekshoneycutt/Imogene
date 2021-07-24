# Imogene

This is a basic Javascript library for doing things. It is more-or-less structured together, but really just a compilation of useful bits. This is a diverse library built around DOM manipulations and an automatic client for compatible RESTful interfaces (e.g. the backend included in this project).

Suggested use of importing this library may be like this:
```javascript
import { Imogene as $, ImogeneExports as $_, ImogeneTemplate as $t } from 'Imogene';
```

The `$` syntax is remarkable for only kind of following a jQuery type syntax. For example, the following is possible:
```javascript
const checkbox = $("#mycheckbox");
$_.setProperties(checkbox, {
	checked: true
});
```
The `$t` syntax, meanwhile is not largely preferred except to quickly write prototyping code. It is nonetheless included and used. An example:
```javascript
let myval = $_.value("Hello");
const newElement = $(['div', myval]);
const alsoElement = $t`<div>${myval}</div>`;
/* ... later */
myval.set("Goodbye"); /* Updates both elements */
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