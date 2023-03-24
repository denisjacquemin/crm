onmessage = function(event) {

    const document = event.data.document;
    const slug = event.data.slug;
    const csrfToken = event.data.csrfToken;

    fetch('/document/' + slug, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify({ document: document })
        })
        .then(response => {
            // if response status is 401 return unauthorized to main thread
            if (response.status === 401) {
                postMessage({ unauthorized: true });
            } else if (response.ok) {
                return response.json();
            } else {
                throw new Error('Network response was not ok');
            }
        })
        .then(data => {
            postMessage(data);
        })
        .catch(error => {
            console.error('Error updating document:', error);
        });
};