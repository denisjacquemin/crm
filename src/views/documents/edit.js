// write un runAutosave that will contains all the logic to save the config to the server
window.runAutoSave = function() {

        // setup event listener that will save the document to localstorage
        document.addEventListener('input', function(e) {
            var documents = JSON.parse(localStorage.getItem('documents')) || {};
            // get the config object from localstorage or create it if i doesn't exist yet

            // set the value of the input field to the config object
            // example: config['invoice']['number'] will match input name="invoice.number"
            // target value should be the value of the input field under current document slug
            var documentSlug = document.getElementById('slug').value;
            put(documents, documentSlug + '.' + e.target.name, e.target.value);
            // set last updated date time for the config

            const now = new Date();
            const utcNow = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                now.getUTCHours(),
                now.getUTCMinutes(),
                now.getUTCSeconds(),
                now.getUTCMilliseconds(),
            ));

            put(documents, documentSlug + '.' + 'lastConfigUpdateAt', utcNow.toISOString());

            localStorage.documents = JSON.stringify(documents);

        });


        // setup worker if not already done
        let w;
        if (typeof(w) == "undefined") {
            w = setupWorker();
        }

        // handle worker messages
        w.onmessage = function(event) {
            // handle messages from worker when postMessage({ unauthorized: true }); is called
            if (event.data.hasOwnProperty('unauthorized')) {
                history.replaceState(null, '', window.location.href);
                location.reload();
            }

            const data = event.data;

            if (data.hasOwnProperty('updated_at') && data.hasOwnProperty('slug')) {
                // update lastUpdated in local storage config object
                var documents = JSON.parse(localStorage.getItem('documents')) || {};
                documents[data.slug].updated_at = data.updated_at;

                localStorage.setItem('documents', JSON.stringify(documents));
            }
        };

        var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        // at regular intervals, save config to server
        setInterval(function() {
            // get config from local storage
            var documents = JSON.parse(localStorage.getItem('documents'));

            // for each keys in documents
            for (var slug in documents) {

                if (documents[slug] && documents[slug].hasOwnProperty('lastConfigUpdateAt')) {

                    if (Date.parse(documents[slug].lastConfigUpdateAt) > Date.parse(documents[slug].updated_at) || !documents[slug].updated_at) {
                        console.log('sending to worker');
                        w.postMessage({ document: documents[slug], slug, csrfToken: csrfToken });
                    } else {
                        // if handled slug is not the current slug, removes document from documents in local storage
                        if (slug != document.getElementById('slug').value) {
                            delete documents[slug];
                            localStorage.setItem('documents', JSON.stringify(documents));
                        }
                    }

                }
            }
        }, 10000);
    }
    // setup worker and return it
function setupWorker() {
    let w;
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            w = new Worker("/public/js/workers/documents/autosave_worker.js");
        }
    } else {
        console.log('Worker not supported');
    }

    return w;
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