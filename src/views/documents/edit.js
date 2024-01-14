function getDocumentsFromLocalStorage() {
    return JSON.parse(localStorage.getItem('documents')) || {};
}

function setDocumentsToLocalStorage(documents) {
    localStorage.setItem('documents', JSON.stringify(documents));
}

function removeDocumentFromLocalStorage(slug) {
    let documents = getDocumentsFromLocalStorage();
    delete documents[slug];
    setDocumentsToLocalStorage(documents);
}

function updateDocumentInLocalStorage(slug, updatedAt) {
    let documents = getDocumentsFromLocalStorage();
    if (documents[slug]) {
        documents[slug].selectedDocument_updated_at = updatedAt;
        setDocumentsToLocalStorage(documents);
    }
}

window.runAutoSave = function(elem) {
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
        } else {
            removeDocumentFromLocalStorage(event.data.slug);
        }
    };



    var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    // at regular intervals, save config to server
    setInterval(function() {
        // get config from local storage
        var documents = getDocumentsFromLocalStorage();

        for (var slug in documents) {
            // console.log('document:', slug);
            if (documents[slug].hasOwnProperty('selectedDocument_updated_at')) {
                // console.log('selectedDocument_updated_at:', documents[slug].selectedDocument_updated_at);
                // console.log('updated_at:', documents[slug].updatedAt);
                // console.log(' result:', (documents[slug].selectedDocument_updated_at > documents[slug].updatedAt));
                if (documents[slug].selectedDocument_updated_at > documents[slug].updatedAt) {
                    //  console.log('sending to worker');
                     w.postMessage({ document: documents[slug], slug, csrfToken: csrfToken });
                 } else {
                    // if the documents[slug] is not the current document, remove it from local storage
                    if (document.getElementsByName('currentSlug').value && slug != document.getElementsByName('currentSlug').value) {
                        delete documents[slug];
                        localStorage.setItem('documents', JSON.stringify(documents));
                    }
                }

            }
        }
    }, 1000);
}

let w;

function setupWorker() {
    try {
        if (typeof(Worker) !== "undefined") {
            if (typeof(w) == "undefined") {
                w = new Worker("/public/js/workers/documents/autosave_worker.js");
            }
            return w;
        } else {
            console.log('Worker not supported');
            return null;
        }
    } catch (e) {
        console.log('Error setting up worker:', e);
        return null;
    }
}

window.loadPreview = async function(slug) {
    let data = "";
    if (slug !== undefined) {
        try {
            const response = await fetch('/document/preview/' + slug + '?nl=true');
            data = await response.text();
        } catch (error) {
            console.error(error);
        }
    }
    return data;
}


window.updateNewUrl = function(slug) {
    history.pushState(null, null, `/document/edit/${slug}${window.location.search}`);
}

window.updateDocumentsWithLS = function(documents) {
    var documentsLS = getDocumentsFromLocalStorage();
    for (var slug in documentsLS) {
        // find the document in documents object that match the slug
        var document = documents.find(d => d.slug == slug);
        // if found, update the document with the one from localstorage
        if (document) {
            document.config = documentsLS[slug].config;
        }
    }

    return documents;
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