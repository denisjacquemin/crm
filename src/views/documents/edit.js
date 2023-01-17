if (window.location.href.match(/documents\/new/)) {
    // onload set the invoiceid as the last segment of the url path if it doesn't exists yet

    window.onload = function() {

        // if url pathname ends with /edit/ then set the invoiceid as the last segment of the url path
        if (window.location.pathname.endsWith('/new')) {
            let currentUrl = window.location.href;
            let documentId = document.getElementById("documentId").value;
            let newUrl = currentUrl.replace("/documents/new", "/documents/edit/" + documentId)
            window.history.replaceState({}, '', newUrl);
        }

        // get JSON Object from hidden field named config	
        var config = JSON.parse(document.getElementById('config').value);

        // save config to local storage
        localStorage.setItem('config', JSON.stringify(config));

        // loop through the config object and set values to input fiedls based on the path matching input's names
        // only works for input fields with names that match the path
        // example: config['invoice']['number'] will match input name="invoice.number"
        for (var key in config) {
            var path = key.split('.');
            var value = config;
            for (var i = 0; i < path.length; i++) {
                value = value[path[i]];
            }
            document.getElementsByName(key)[0].value = value;
        }

        // use event delagetion to listen to all input changes
        document.addEventListener('input', function(e) {
            console.log('In input event listener');
            // get the config object from localstorage or create it if i doesn't exist yet
            var config = JSON.parse(localStorage.getItem('config')) || {};

            // set the value of the input field to the config object
            // example: config['invoice']['number'] will match input name="invoice.number"
            put(config, e.target.name, e.target.value);
            // set last updated date time for the config
            lastUpdated = new Date();
            put(config, 'lastUpdated', lastUpdated);

            localStorage.setItem('config', JSON.stringify(config));

        });

        // at regular intervals, save config to server
        setInterval(function() {

            // get config from local storage
            var config = JSON.parse(localStorage.getItem('config'));

            if (config && config.hasOwnProperty('lastUpdated')) {
                // check if config was updated after the last time it was sent to the server
                if (new Date() - new Date(config.lastUpdated) > 5000) {
                    // save values to server
                    fetch('/documents/1', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(config)
                    });
                }
            }
        }, 5000);
    }
}
/*!
 * See https://gomakethings.com/adding-items-to-an-object-at-a-specific-path-with-vanilla-js/
 * Add items to an object at a specific path
 * (c) 2021 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param  {Object}       obj  The object
 * @param  {String|Array} path The path to assign the value to
 * @param  {*}            val  The value to assign
 * 
 * Examples:
 * var lunch = {};
 * put(lunch, 'sandwich.toppings[]', 'mayo');
 * put(lunch, 'sandwich.toppings[]', 'tomato');
 * put(lunch, 'sides.chips', 'Cape Cod');
 * put(lunch, 'sides.cookie', true);
 * put(lunch, 'sides.drink', 'soda');
 */
function put(obj, path, val) {

    /**
     * If the path is a string, convert it to an array
     * @param  {String|Array} path The path
     * @return {Array}             The path array
     */
    function stringToPath(path) {

        // If the path isn't a string, return it
        if (typeof path !== 'string') return path;

        // Create new array
        let output = [];

        // Split to an array with dot notation
        path.split('.').forEach(function(item) {

            // Split to an array with bracket notation
            item.split(/\[([^}]+)\]/g).forEach(function(key) {

                // Push to the new array
                if (key.length > 0) {
                    output.push(key);
                }

            });

        });

        return output;

    }

    // Convert the path to an array if not already
    path = stringToPath(path);

    // Cache the path length and current spot in the object
    let length = path.length;
    let current = obj;

    // Loop through the path
    path.forEach(function(key, index) {

        // Check if the assigned key should be an array
        let isArray = key.slice(-2) === '[]';

        // If so, get the true key name by removing the trailing []
        key = isArray ? key.slice(0, -2) : key;

        // If the key should be an array and isn't, create an array
        if (isArray && !Array.isArray(current[key])) {
            current[key] = [];
        }

        // If this is the last item in the loop, assign the value
        if (index === length - 1) {

            // If it's an array, push the value
            // Otherwise, assign it
            if (isArray) {
                current[key].push(val);
            } else {
                current[key] = val;
            }
        }

        // Otherwise, update the current place in the object
        else {

            // If the key doesn't exist, create it
            if (!current[key]) {
                current[key] = {};
            }

            // Update the current place in the object
            current = current[key];

        }

    });

}