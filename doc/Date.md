# Documentation pour la gestion des dates et des fuseaux horaires

## Stockage des dates en UTC

Dans MongoDB, toutes les dates sont stockées en UTC par défaut. Cela permet de normaliser les dates et d'éviter les problèmes liés aux fuseaux horaires.

## Conversion des dates UTC en dates locales

Lorsque vous récupérez une date de la base de données, vous obtiendrez une date UTC. Pour afficher cette date à l'utilisateur, vous devez la convertir en date locale. Pour ce faire, vous pouvez utiliser la bibliothèque `dayjs` et sa méthode `utc(...).local()`. 

Voici un exemple de code :

```javascript
let dateFromDB = this.selectedDocument.config.invoice_due_date.value; // Récupérez la date de la base de données
let localDate = dayjs.utc(dateFromDB).local().toDate();
```

Dans cet exemple, `dateFromDB` est la date récupérée de la base de données et `localDate` est la date locale correspondante.

## Conversion des dates locales en dates UTC

Lorsque vous recevez une date de l'utilisateur (par exemple, une date sélectionnée dans un sélecteur de date), cette date sera une date locale. Avant de stocker cette date dans la base de données, vous devez la convertir en date UTC. Pour ce faire, vous pouvez utiliser la bibliothèque `dayjs` et sa méthode `utc()`. 

Voici un exemple de code :

```javascript
let selectedDate = dayjs(selectedDates[0]).startOf('day'); // Récupérez la date de l'utilisateur
let utcDate = selectedDate.utc().toISOString();
```

Dans cet exemple, `selectedDate` est la date récupérée de l'utilisateur et `utcDate` est la date UTC correspondante.

## Affichage des dates

Pour afficher une date à l'utilisateur, vous pouvez utiliser la bibliothèque `flatpickr`. Cette bibliothèque vous permet de créer un sélecteur de date facile à utiliser. Vous pouvez configurer `flatpickr` pour utiliser le format de date que vous préférez. Dans l'exemple ci-dessous, le format de date est 'd/m/Y'.

```javascript
flatpickr(this.$refs.dueDate, {
    defaultDate: localDate,
    dateFormat: 'd/m/Y',
});
```

Dans cet exemple, `this.$refs.dueDate` est l'élément HTML sur lequel vous voulez créer le sélecteur de date, et `localDate` est la date locale à afficher par défaut dans le sélecteur.