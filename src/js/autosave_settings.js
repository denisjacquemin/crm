// let workerSettings = null;

// window.startAutoSaveSettings = function() {
//     console.log('####### Starting AutoSave Settings #######');

//     workerSettings = setupWorker("/public/js/workers/autosave_worker.js");

//     workerSettings.onmessage = function(event) {
//         // handle messages from worker when postMessage({ unauthorized: true }); is called
//         if (event.data.hasOwnProperty('unauthorized')) {
//             history.replaceState(null, '', window.location.href);
//             location.reload();
//         } else {
//             removeDocumentFromLocalStorage(event.data.slug);

//             console.log('##### Do something with the data in workerSettings onmessage #####');
//         }
//     };

//     var csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
//     // at regular intervals, save config to server
//     setInterval(function() {
//         // get config from local storage
//         saveConfigToServer('accountEmail', '/user/resetemail', csrfToken);
//     }, 1000);
// }

// window.stopAutoSaveSettings = function(elem) {
//     console.log('####### Stoping AutoSave Settings #######');
// }



// window.stopAutoSaveSettings = function(elem) {
//     console.log('####### Stoping AutoSave Settings #######');
// }


