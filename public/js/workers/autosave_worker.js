onmessage = async function(event) {
    const value = event.data.value;
    const url = '/' + event.data.targetedObject + '/' + value.slug;
    const csrfToken = event.data.csrfToken; // Get the CSRF token from the event data


    const options = {
        method: 'PATCH',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken // Use the CSRF token

        },
        credentials: 'same-origin',
        body: JSON.stringify({ value: value })
    };

    try {
        const response = await fetch(url, options);

        let result;

        switch (response.status) {
            case 401:
                console.log('Autosave worker Unauthorized')
                result = { unauthorized: true };
                break;
            case 400:
                console.log('Autosave worker 400')
                result = { error: true, ...await response.json() };                break;
            case 404:
                console.log('Autosave worker 404')
                result = { notfound: true };
                break;
            default:
                if (response.ok) {
                    result = await response.json();
                } else {
                    console.log('Autosave worker response not ok')
                    throw new Error('Network response was not ok');
                }
        }
        result.targetedObject = event.data.targetedObject;
        result.slug = value.slug;

        postMessage(result);
    } catch (error) {
        console.error('Error in worker:', error);
    }
};