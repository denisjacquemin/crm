// If you imported Alpine into a bundle, you have to make sure you are registering any extension code IN BETWEEN when you import the Alpine global object, and when you initialize Alpine by calling Alpine.start().
import focus from '@alpinejs/focus';
import intersect from '@alpinejs/intersect';
import mask from '@alpinejs/mask';
import Alpine from 'alpinejs';
import dayjs from 'dayjs'; // import Day.js
import 'dayjs/locale/de';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import 'dayjs/locale/it';
import 'dayjs/locale/nl';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/ru';
import 'dayjs/locale/zh-cn';
import localizedFormat from 'dayjs/plugin/localizedFormat'; // Import the localizedFormat plugin for formatting
import utc from 'dayjs/plugin/utc';
import { validateEmail } from './utils/validation';
window.validateEmail = validateEmail;

import flatpickr from 'flatpickr';
window.flatpickr = flatpickr;

import { formatBytes } from '../lib/formatBytes';

window.formatBytes = formatBytes; // Expose the function globally

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.locale('en');

// { "id": 1, "name": "English", "code_dnt": "en" },
// { "id": 2, "name": "Español / Spanish", "code_dnt": "es" },
// { "id": 3, "name": "Français / French", "code_dnt": "fr" },
// { "id": 4, "name": "Nederlands / Dutch", "code_dnt": "nl" },
// { "id": 5, "name": "German / Deutsch", "code_dnt": "de" },
// { "id": 6, "name": "Italian / Italiana", "code_dnt": "it" }

import { German } from 'flatpickr/dist/l10n/de.js';
import { English } from 'flatpickr/dist/l10n/default.js';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { French } from 'flatpickr/dist/l10n/fr.js';
import { Italian } from 'flatpickr/dist/l10n/it.js';
import { Dutch } from 'flatpickr/dist/l10n/nl.js';

// Object to map language codes to their respective Flatpickr locales
window.locales = {
  en: English,
  es: Spanish,
  fr: French,
  nl: Dutch,
  de: German,
  it: Italian,
};

window.dateFormatFlatpickrConfig = {
  en: 'm/d/Y', // English (United States) - MM/DD/YYYY
  es: 'j/n/Y', // Spanish - DD/MM/YYYY
  fr: 'j/n/Y', // French - DD/MM/YYYY
  nl: 'j-n-Y', // Dutch - DD-MM-YYYY
  de: 'j.m.Y', // German - DD.MM.YYYY
  it: 'j/n/Y', // Italian - DD/MM/YYYY
};

window.dateFormatDaysJSConfig = {
  en: 'M/D/YYYY', // English (United States) - MM/DD/YYYY
  es: 'D/M/YYYY', // Spanish - DD/MM/YYYY
  fr: 'D/M/YYYY', // French - DD/MM/YYYY
  nl: 'D-M-YYYY', // Dutch - DD-MM-YYYY
  de: 'D.M.YYYY', // German - DD.MM.YYYY
  it: 'D/M/YYYY', // Italian - DD/MM/YYYY
};

import Choices from 'choices.js';
window.Choices = Choices;

Alpine.plugin(focus);
Alpine.plugin(mask);
Alpine.plugin(intersect);

window.Alpine = Alpine;
// make  the Alpine dispatch function available on window object
window.dispatch = function (name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

window.dayjs = dayjs; // make Day.js available globally
dayjs.locale('en'); // set English as default locale

Alpine.start();
