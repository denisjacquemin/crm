# Mongo Data Structure best practices

Inspired by https://www.mongodb.com/developer/products/mongodb/mongodb-schema-design-best-practices/

Document limit 16 MB

## Rule 1

Favor embedding unless there is a compelling reason not to

## Rule 2

Needing to access an object on its own is a compelling reason not to embed it.

## Rule 3 

Avoid joins/lookups if possible, but don't be afraid if they can provide a better schema design.

## Rule 4

Arrays should not grow without bound. If there are more than a couple of hundred documents on the "many" side, don't embed them; if there are more than a few thousand documents on the "many" side, don't use an array of ObjectID references. High-cardinality arrays are a compelling reason not to embed.

## Rule 5

As always, with MongoDB, how you model your data depends – entirely – on your particular application's data access patterns. You want to structure your data to match the ways that your application queries and updates it.


