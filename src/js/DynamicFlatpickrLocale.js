// DynamicFlatpickrLocale.js

export async function loadAndInitializeFlatpickr(locale) {
    return new Promise((resolve, reject) => {
        // Create a script tag
        const script = document.createElement('script');
        
        // Set the source of the script to the locale file
        script.src = `https://npmcdn.com/flatpickr/dist/l10n/${locale}.js`;
        
        // Handle successful loading
        script.onload = () => {
            console.log(`Locale ${locale} loaded successfully.`);
            // Assuming the locale data is attached to the global flatpickr object
            // You might need to adjust this part depending on how the script exposes the locale data
            if (flatpickr && flatpickr.l10ns && flatpickr.l10ns[locale]) {
                flatpickr.localize(flatpickr.l10ns[locale]);
                resolve(flatpickr.l10ns[locale]);
            } else {
                console.error(`Locale data for ${locale} not found.`);
                reject(`Locale data for ${locale} not found.`);
            }
        };
        
        // Handle errors during script loading
        script.onerror = () => {
            console.error(`Failed to load Flatpickr locale: ${locale}`);
            reject(`Failed to load Flatpickr locale: ${locale}`);
        };
        
        // Append the script tag to the document's head
        document.head.appendChild(script);
    });
}