onmessage = function(event) {

    console.log('in Worker onmessage');

    const config = event.data.config;
    const csrfToken = event.data.csrfToken;

    fetch('/documents', {
            method: 'PUT',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify({ config: config })
        })
        .then(response => {
            if (response.ok) {
                console.log('response.ok', JSON.stringify(response.json))
                return response.json();
            } else {
                throw new Error('Network response was not ok');
            }
        })
        .then(data => {
            console.log('then', data)
                // Send the updated config object back to the main thread
            postMessage(data);
        })
        .catch(error => {
            console.error('Error updating config:', error);
        });
};