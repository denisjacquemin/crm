let workerSettings = null;

window.startAutoSaveSettings = function() {
    console.log('####### Starting AutoSave Settings #######');

    workerSettings = setupWorker("/public/js/workers/autosave_worker.js");

    workerSettings.onmessage = function(event) {
        // handle messages from worker when postMessage({ unauthorized: true }); is called
        if (event.data.hasOwnProperty('unauthorized')) {
            history.replaceState(null, '', window.location.href);
            location.reload();
        } else {
            removeDocumentFromLocalStorage(event.data.slug);

            console.log('##### Do something with the data in workerSettings onmessage #####');
        }
    };

    var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    // at regular intervals, save config to server
    setInterval(function() {
        // get config from local storage
        saveConfigToServer('accountEmail', '/user/resetemail', csrfToken);
    }, 1000);
}

window.stopAutoSaveSettings = function(elem) {
    console.log('####### Stoping AutoSave Settings #######');
}

function saveConfigToServer(key, url, csrfToken) {
    var LSObj = getByKeyFromLocalStorage(key);
    console.log('settings from LS:', LSObj);
    if (LSObj.hasOwnProperty('updated_at')) {
        console.log('current time:', new Date());
        console.log('updated_at:', LSObj.updated_at);
        console.log(' result:', (LSObj.updated_at < new Date()));
        if (new Date(LSObj.updated_at) < new Date()) {
            console.log('sending to worker', LSObj.value);
            workerSettings.postMessage({ value: LSObj.value, csrfToken: csrfToken, url: url });
        }
    } // else remove it from localstorage
    else {
        localStorage.removeItem(key);
    }
}

window.stopAutoSaveSettings = function(elem) {
    console.log('####### Stoping AutoSave Settings #######');
}


