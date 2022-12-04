# Screen architecture 

- The left side contains contains the 'config' of the document

The config contains the document template, the paramaters values and also the configuration of the template.

- The right side contains a preview of the document

The preview is updated in real time with any update done in the config

# Auto Save Implementation

Any update on the document is save in a json object saved in localstorage
If localstorage is not available, use a hidden field

At regulat interval, check if an not yet saved config is present in localstorage, if yes, save it to mongodb

Each time a new config is saved in localstorage, update the preview accordingly

On first load, check if an unsaved config is in the localstorage, if yes save it to mongo

localstorage acts as a cache and offline feature

# config object structure

{
    fields: {
        client: {
            name: "Best Company"
    }
}