// If you imported Alpine into a bundle, you have to make sure you are registering any extension code IN BETWEEN when you import the Alpine global object, and when you initialize Alpine by calling Alpine.start().
import Alpine from 'alpinejs'
import mask from '@alpinejs/mask'
Alpine.plugin(mask)

window.Alpine = Alpine

Alpine.start()

