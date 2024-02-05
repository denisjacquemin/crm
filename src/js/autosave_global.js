window.getAutoSaveByKeyFromLocalStorage = function(key) {
    return JSON.parse(localStorage.getItem('autosave#' + key)) || {};
}

window.setByKeyToLocalStorage = function(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

window.setupWorker = function (pathToWorker) {
    try {
        if (typeof(Worker) !== "undefined") {
            if (typeof(w) == "undefined") {
                w = new Worker(pathToWorker);
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

workerSettings = setupWorker("/public/js/workers/autosave_worker.js");

workerSettings.onmessage = function(event) {
    console.log('in workerSettings:', event.data);
    // handle messages from worker when postMessage({ unauthorized: true }); is called
    if (event.data.hasOwnProperty('unauthorized')) {
        history.replaceState(null, '', window.location.href);
        location.reload();
    } else if (event.data.hasOwnProperty('message')) {
        dispatch('notify', { content: event.data.message, type: event.data.type })
    }
};

var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

setInterval(function() {
    // get config from local storage
    console.log('infinite loop in autosave_global.js');

    // get all keys from locastorgae that start by 'autosave#'
    var keys = Object.keys(localStorage).filter(function(key) {
        return key.startsWith('autosave#');
    });
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        // console.log('saving key:', key)
        if (key.startsWith('autosave#document#')) {
            let slug = key.split('#')[2];
            saveToServer(key, '/document/' + slug, csrfToken);
        }
    }

}, 5000);


function saveToServer(key, url, csrfToken) {
    var LSObj = getAutoSaveByKeyFromLocalStorage(key);
    console.log('settings from LS:', LSObj);
    if (LSObj.hasOwnProperty('autosave_updated_at')) {
        // console.log('current time:', new Date());
        // console.log('autosave_updated_at:', LSObj.autosave_updated_at);
        // console.log(' result:', (LSObj.autosave_updated_at < new Date()));
        if (new Date(LSObj.autosave_updated_at) < new Date()) {
            console.log('sending to worker', LSObj.value);
            workerSettings.postMessage({ value: LSObj.value, csrfToken: csrfToken, url: url });
        }
    } // else remove it from localstorage
    else {
        localStorage.removeItem(key);
    }
}