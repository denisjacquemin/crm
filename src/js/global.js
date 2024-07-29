// Select all input/button elements with type attribute equals to submit
const submitButtons = document.querySelectorAll("input[type='submit'], button[type='submit']");
// Loop through all submit buttons
submitButtons.forEach(button => {
    // Add a click event listener to each button
    button.addEventListener("click", () => {
        // Add the opacity-50 and pointer-events-none classes to the button, disabling it
        button.classList.add("opacity-50", "pointer-events-none");
        // change the text of the button to loading
        // assign button.innerText with button data-disbaled-text attribute
        button.innerText = button.dataset.disabledText;
        // disabling the button
        button.disabled = true;
        // submiting form
        button.form.submit();
    });
});

window.formatDate = function(date, format = 'M/D/YYYY') {
    if (typeof date === 'number') {
        // Convert Unix timestamp (in seconds) to milliseconds and create a Date object
        date = new Date(date * 1000);
    }
    // Use dayjs to format the date, now handling both original and Unix timestamp inputs
    return dayjs(date).format(format);
}

window.fetchUrl = function(url, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
    }

    return fetch(url, options)
        .then(async response => {
            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                data = JSON.parse(await response.text());
            } else if (contentType && contentType.includes("text/html")) {
                data = await response.text();
            }
            
            if (data && data.notification) {
                dispatch('notify', { content: data.notification.message, subcontent: data.notification.submessage, type: data.notification.type ? data.notification.type : 'info' });
            }

            if (response.status === 401) {
                history.replaceState(null, '', window.location.href);
                location.reload();
            } else if (response.status !== 200) {
                throw new Error('Looks like there was a problem. Status Code: ' + response.status);
            } else {
                return data;
            }
        })
        .catch(error => {
            console.error('Error fetching URL', error);
            throw error;
        });
};



window.formatAddress = function(address1, address2, zip, city, country) {
    var formattedAddress1 = address1 || '';
    var formattedAddress2 = address2 ? ' ' + address2 : '';
    var formattedZip = zip ? ' ' + zip : '';
    var formattedCity = city ? ' ' + city : '';
    var formattedCountry = country ? ' ' + country : '';
    return `${formattedAddress1}${formattedAddress2}${formattedZip}${formattedCity}${formattedCountry}`;
}

window.deepMergeObjects = function(target, ...sources) {
    if (!sources.length) {
        return target;
    }
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, {
                        [key]: {}
                    });
                }
                deepMergeObjects(target[key], source[key]);
            } else {
                Object.assign(target, {
                    [key]: source[key]
                });
            }
        }
    }
    return deepMergeObjects(target, ...sources);
}

function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}