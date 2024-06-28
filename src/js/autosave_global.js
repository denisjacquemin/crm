window.getByKeyFromLocalStorage = function(key) {
    return JSON.parse(localStorage.getItem(key)) || {};
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
    console.log('Message from worker:', event.data);
    // handle messages from worker when postMessage({ unauthorized: true }); is called
    if (event.data.hasOwnProperty('unauthorized')) {
        history.replaceState(null, '', window.location.href);
        location.reload();
    }

    if (event.data.hasOwnProperty('notification')) {
        dispatch('notify', { content: event.data.notification.message, subcontent: event.data.notification.submessage, type: event.data.notification.type ? event.data.notification.type : 'info' });
    }

    // delete from localstorage only if event.data.updatedAt is > then the one in localstorage autosave_updated_at
    let key = 'autosave#' + event.data.targetedObject + '#' + event.data.slug;
    let LSObj = getByKeyFromLocalStorage(key);
    // console.log('Last update in LS:', LSObj.autosave_updated_at);
    // console.log('server side update:', event.data.autosave_updated_at);
    // console.log('dates:', new Date(LSObj.autosave_updated_at) <= new Date(event.data.autosave_updated_at));
    // console.log('notfound:', event.data.hasOwnProperty('notfound'));
    if (event.data.hasOwnProperty('error') || event.data.hasOwnProperty('notfound') || (new Date(LSObj.autosave_updated_at) <= new Date(event.data.autosave_updated_at))) {
        console.log('deleting from localstorage:', key);
        localStorage.removeItem(key);
    }

};

var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

setInterval(function() {
    // get config from local storage
    // console.log('infinite loop in autosave_global.js');

    // get all keys from locastorgae that start by 'autosave#'
    var keys = Object.keys(localStorage).filter(function(key) {
        return key.startsWith('autosave#');
    });
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        // console.log('saving key:', key)
        let slug = key.split('#')[2]; // get the slug from the key
        let targetedObject = key.split('#')[1]; // get the targeted object (document or buyer or... )
        saveToServer(key, targetedObject, csrfToken);
    }

}, 2000);




function saveToServer(key, targetedObject, csrfToken) {
    var LSObj = getByKeyFromLocalStorage(key);
    if (LSObj.hasOwnProperty('autosave_updated_at')) {
        if (new Date(LSObj.autosave_updated_at) < new Date()) {
            workerSettings.postMessage({ value: LSObj, csrfToken: csrfToken, targetedObject: targetedObject });
        }
    } // else remove it from localstorage
    else {
        localStorage.removeItem(key);
    }
}