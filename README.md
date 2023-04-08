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

# Legal
## Belgium

En Belgique, une facture doit contenir les éléments suivants:

- La mention "Facture" doit être clairement indiquée sur le document.
- Le nom, l'adresse et le numéro de TVA de l'entreprise qui émet la facture doivent être indiqués.
- Le nom et l'adresse du client doivent également figurer sur la facture.
- La date d'émission de la facture doit être indiquée.
- Un numéro de facture unique doit être attribué à chaque facture émise.
- Une description détaillée des biens ou services fournis doit être incluse, avec leur quantité et leur prix unitaire.
- Le montant total hors TVA, le taux de TVA appliqué et le montant de la TVA à payer doivent être mentionnés.
- Le montant total TTC (toutes taxes comprises) doit être clairement indiqué.
- Les conditions de paiement doivent être précisées (délai de paiement, pénalités de retard, etc.).
- Si le client est assujetti à la TVA, son numéro de TVA doit être mentionné.
- Il est important de noter que les règles relatives à la facturation peuvent varier en fonction du type de transaction (vente de biens, prestation de services, etc.) et du statut de l'entreprise émettrice de la facture (assujettie ou non à la TVA).

## UBL
UBL (Universal Business Language) est un format électronique standard pour les échanges de données commerciales. Une facture UBL contient les champs suivants:

- Les informations sur l'émetteur de la facture, y compris le nom, l'adresse et le numéro d'identification fiscale.
- Les informations sur le destinataire de la facture, y compris le nom, l'adresse et le numéro d'identification fiscale.
- Un identifiant unique pour la facture.
- La date d'émission de la facture.
- La date d'échéance pour le paiement de la facture.
- La devise utilisée pour la transaction.
- Les détails des biens ou services fournis, y compris la description, la quantité, le prix unitaire, le montant total et le taux de taxe appliqué.
- Le montant total hors taxes, le montant total des taxes et le montant total toutes taxes comprises.
- Les termes de paiement, y compris le délai de paiement et les pénalités pour retard de paiement.
- Les instructions de livraison et les détails du transporteur.
- Les informations de contact pour l'émetteur et le destinataire de la facture.
- Les numéros de référence pertinents pour la transaction, tels que les numéros de commande ou les numéros de compte.
- Les informations sur les remises ou les frais de transport éventuels.
Il convient de noter que les factures UBL peuvent varier en fonction des exigences spécifiques de chaque entreprise, mais elles doivent normalement inclure les éléments mentionnés ci-dessus pour être considérées comme conformes aux normes UBL.



