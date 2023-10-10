# Screen architecture 

(The first screen (left) is a list of the latest invoices)

- The left side contains contains the 'config' of the document

The config contains the document template, the paramaters values and also the configuration of the template.

- The right side contains a preview of the document

The preview is updated in real time with any update done in the config

# Auto Save Implementation

Any update on the selectedDocument (AlpineJS variable) is catched by a $watch('selectedDocument' .
It save the object (selectedDocument) in LocalStorage, if, for any reason (ie: browser closed, connection lost), the save to server is not triggered. The next time the page will be loaded, it will takes the object (selectedDocument) form LocalStorage as the last valid version. This handled in x-init by documents = updateDocumentsWithLS(documents);


If localstorage is not available, use a hidden field

At regulat interval, check if an not yet saved config is present in localstorage, if yes, save it to mongodb and typesense

On first load, check if an unsaved config is in the localstorage, if yes save it to mongo

localstorage acts as a cache and offline feature


# Auto Complete

Le premier champ "Client Name" fait office de full text search. Donc un client peut etre trouvé sur base de son nom, mais egalement les autres champs