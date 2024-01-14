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