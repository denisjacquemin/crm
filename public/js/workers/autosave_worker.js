onmessage = function(event) {

    const csrfToken = event.data.csrfToken;
    const value = event.data.value;
    const url = event.data.url;

    fetch(url, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify({ value: value })
        })
        .then(response => {
            if (response.status === 401) {
                return { unauthorized: true };
            } else if (response.status === 400) {
                return response.json();
            } else if (response.status === 404) {
                return { notfound: true, slug: slug };
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
            console.error('Error in worker:', error);
            postMessage({ error: error.message });
        });
};