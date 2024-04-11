onmessage = async function(event) {

    const csrfToken = event.data.csrfToken;
    const value = event.data.value;
    const url = '/' + event.data.targetedObject + '/' + value.slug;

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify({ value: value })
        });

        let result;

        switch (response.status) {
            case 401:
                console.log('Autosave worker Unauthorized')
                result = { unauthorized: true };
                break;
            case 400:
                console.log('Autosave worker 400')
                result = await response.json();
                break;
            case 404:
                console.log('Autosave worker 404')
                result = { notfound: true };
                break;
            default:
                console.log('Autosave worker default')
                if (response.ok) {
                    console.log('Autosave worker response ok')
                    result = await response.json();
                } else {
                    console.log('Autosave worker response not ok')
                    throw new Error('Network response was not ok');
                }
        }
        result.targetedObject = event.data.targetedObject;
        result.slug = value.slug;
        console.log('Autosave worker after switch', result);

        postMessage(result);
    } catch (error) {
        console.error('Error in worker:', error);
    }
};