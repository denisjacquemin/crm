# Starting server

    npm start

listening on 3000

*from package.json: "start": "nodemon -e hbs --exec \"postcss ./public/css/main.css -o ./public/css/styles.css\" & nodemon ./index.js"*

* **nodemon -e hbs** : monitor files with extension of hbs
* **--exec \"postcss ./public/css/main.css -o ./public/css/styles.css\"** : execute command postcss
* **postcss ./public/css/main.css -o ./public/css/styles.css** : apply postcss.config.js stuff to main.css and output to styles.css
* **& nodemon ./index.js** : and restart index.js



