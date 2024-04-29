// If you imported Alpine into a bundle, you have to make sure you are registering any extension code IN BETWEEN when you import the Alpine global object, and when you initialize Alpine by calling Alpine.start().
import Alpine from 'alpinejs'
import mask from '@alpinejs/mask'
import focus from '@alpinejs/focus'
import intersect from '@alpinejs/intersect'
import dayjs, { locale } from 'dayjs' // import Day.js
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import PinchZoom from 'pinch-zoom-js';

dayjs.extend(utc);
dayjs.extend(timezone);

import 'dayjs/locale/es' // load Spanish locale
import 'dayjs/locale/pt-br' // load Portuguese locale
import 'dayjs/locale/fr' // load French locale
import 'dayjs/locale/de' // load German locale
import 'dayjs/locale/it' // load Italian locale
import 'dayjs/locale/ru' // load Russian locale
import 'dayjs/locale/zh-cn' // load Chinese (Simplified) locale
import 'dayjs/locale/nl' // load Dutch locale
import flatpickr from "flatpickr"; 
import Choices from 'choices.js';
window.Choices = Choices;

Alpine.plugin(focus)
Alpine.plugin(mask)
Alpine.plugin(intersect)

window.Alpine = Alpine
// make  the Alpine dispatch function available on window object
window.dispatch = function(name, detail = {}) {
    window.dispatchEvent(new CustomEvent(name, { detail }))
}

window.PinchZoom = PinchZoom;

dayjs.locale('es') // set Spanish locale
dayjs.locale('pt-br') // set Portuguese locale
dayjs.locale('fr') // set French locale
dayjs.locale('de') // set German locale
dayjs.locale('it') // set Italian locale
dayjs.locale('ru') // set Russian locale
dayjs.locale('zh-cn') // set Chinese (Simplified) locale
dayjs.locale('nl') // set Dutch locale
window.dayjs = dayjs // make Day.js available globally
window.flatpickr = flatpickr // make Flatpickr available globally
window.flatpickr.localize(flatpickr.l10ns.es) // set Spanish locale
window.flatpickr.localize(flatpickr.l10ns.pt) // set Portuguese locale
window.flatpickr.localize(flatpickr.l10ns.fr) // set French locale
window.flatpickr.localize(flatpickr.l10ns.de) // set German locale
window.flatpickr.localize(flatpickr.l10ns.it) // set Italian locale
window.flatpickr.localize(flatpickr.l10ns.ru) // set Russian locale
window.flatpickr.localize(flatpickr.l10ns.zh) // set Chinese (Simplified) locale
window.flatpickr.localize(flatpickr.l10ns.nl) // set Dutch locale



Alpine.start()