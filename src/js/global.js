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
        .then(response => {
            if (response.status === 401) {
                history.replaceState(null, '', window.location.href);
                console.log('Reloading page');
                location.reload();
            } else if (response.status !== 200) {
                console.error('Looks like there was a problem. Status Code: ' + response.status + ' ', response);
                return;
            } else {
                return response.text();
            }
        })
        .catch(error => {
            console.error('Error fetching URL', error);
        });
};

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