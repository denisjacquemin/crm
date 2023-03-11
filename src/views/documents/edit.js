if (window.location.href.match(/documents\/edit/)) {
    // onload set the invoiceid as the last segment of the url path if it doesn't exists yet
    let w;

    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('setting up worker');
            w = new Worker("/public/js/workers/documents/autosave_worker.js");
        }

        w.onmessage = function(event) {
            const data = event.data;

            if (data.hasOwnProperty('updated_at')) {
                // update lastUpdated in local storage config object
                const config = JSON.parse(localStorage.getItem('config'));
                config.updated_at = data.updated_at;
                localStorage.setItem('config', JSON.stringify(config));
                console.log('data.updated_at', data.updated_at);
            }
        };
    } else {
        console.log('Worker not supported');
    }

    window.onblur = function() {
        console.log('in window.onblur');
    }

    window.onload = function() {

        var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        // get JSON Object from hidden field named config	
        var config = JSON.parse(document.getElementById('config').value);

        // save config to local storage
        localStorage.config = JSON.stringify(config);

        // function updateInputValues(obj, parentKey = '') {
        //     for (const key in obj) {
        //         if (typeof obj[key] === 'object') {
        //             updateInputValues(obj[key], `${parentKey}${key}.`);
        //         } else {
        //             const input = document.querySelector(`input[name="${parentKey}${key}"]`);
        //             if (input) {
        //                 input.value = obj[key];
        //             }
        //         }
        //     }
        // }

        // updateInputValues(config);

        // use event delagetion to listen to all input changes
        document.addEventListener('input', function(e) {
            // get the config object from localstorage or create it if i doesn't exist yet
            var config = JSON.parse(localStorage.getItem('config')) || {};

            // set the value of the input field to the config object
            // example: config['invoice']['number'] will match input name="invoice.number"
            put(config, e.target.name, e.target.value);
            // set last updated date time for the config

            const now = new Date();
            const utcNow = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                now.getUTCHours(),
                now.getUTCMinutes(),
                now.getUTCSeconds()
            ));

            put(config, 'lastConfigUpdateAt', utcNow.toISOString());

            localStorage.config = JSON.stringify(config);

        });

        // at regular intervals, save config to server
        setInterval(function() {
            // get config from local storage
            var config = JSON.parse(localStorage.getItem('config'));


            if (config && config.hasOwnProperty('lastConfigUpdateAt')) {
                // check if config was updated after the last time it was sent to the server
                if (Date.parse(config.lastConfigUpdateAt) > Date.parse(config.updated_at)) {
                    w.postMessage({ config: config, csrfToken: csrfToken });
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