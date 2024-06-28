// onmessage = function(event) {

//     const document = event.data.document;
//     const slug = event.data.slug;
//     const csrfToken = event.data.csrfToken;

//     fetch('/document/' + slug, {
//             method: 'PATCH',
//             credentials: 'same-origin',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-Requested-With': 'XMLHttpRequest',
//                 'CSRF-Token': csrfToken
//             },
//             body: JSON.stringify({ document: document })
//         })
//         .then(response => {
//             if (response.status === 401) {
//                 return { unauthorized: true };
//             } else if (response.status === 404) {
//                 return { notfound: true, slug: slug };
//             } else if (esponse.status === 400) {
//                 return { error: true, slug: slug };
//             } else if (response.ok) {
//                 return response.json();
//             } else {
//                 throw new Error('Network response was not ok');
//             }
//         })
//         .then(data => {
//             postMessage(data);
//         })
//         .catch(error => {
//             console.error('Error updating document:', error);
//             postMessage({ error: error.message });
//         });
// };