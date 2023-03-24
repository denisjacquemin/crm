# Starting server

    npm start

listening on 3000

*from package.json: "start": "nodemon -e hbs --exec \"postcss ./public/css/main.css -o ./public/css/styles.css\" & nodemon ./index.js"*

* **nodemon -e hbs** : monitor files with extension of hbs
* **--exec \"postcss ./public/css/main.css -o ./public/css/styles.css\"** : execute command postcss
* **postcss ./public/css/main.css -o ./public/css/styles.css** : apply postcss.config.js stuff to main.css and output to styles.css
* **& nodemon ./index.js** : and restart index.js

# Notifications

`
req.flash('error', {
    message: req.i18n.t('signup.all_fields_required')
});

return res.render('users/signup1', {
    notifications: req.flash()
})
`
`
req.flash('error', {
    message: req.i18n.t('documents.document_not_found')
});


res.redirect('/documents');
`



