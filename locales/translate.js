require("dotenv").config();

const fs = require('fs');
const axios = require('axios');

// const languages = ['ru', 'fr', 'nl', 'es'];
const languages = ['fr'];
const filePath = './locales/en/translation.json';

(async function() {
    if (fs.existsSync(filePath)) {
        const jsonData = JSON.parse(fs.readFileSync(filePath));

        for (const lang of languages) {
            const targetFilePath = `./locales/${lang}/translation.json`;
            const targetJsonData = JSON.parse(fs.readFileSync(targetFilePath));
            const targetJsonString = JSON.stringify(JSON.parse(fs.readFileSync(targetFilePath)));

            // Recursive function to iterate through nested objects
            async function iterateValues(jsonData, targetJsonData) {
                for (const key of Object.keys(jsonData)) {
                    // Check if the value is an object
                    if (typeof jsonData[key] === 'object') {
                        if (key === "do_not_translate") {
                            if (targetJsonString.indexOf(key) > -1) {
                                jsonData[key] = targetJsonData[key];
                                continue;
                            }
                            Object.assign(targetJsonData, jsonData);
                            continue;
                        }
                        // Recursively call the function for nested objects
                        await iterateValues(jsonData[key], targetJsonData[key] || {});
                    } else {
                        // console.log(`key: ${key} in? ${targetJsonString.indexOf(key)}`);
                        if (targetJsonString.indexOf(key) > -1) {
                            jsonData[key] = targetJsonData[key];
                            continue;
                        }

                        const translation = await translate(jsonData[key], lang)
                        console.log('trabslating :' +
                            jsonData[key] + ' to ' + lang + ' = ' + translation);

                        jsonData[key] = translation;
                    }
                }
            }
            await iterateValues(jsonData, targetJsonData);
            // Write the fileContent string to a new file
            fs.writeFileSync(`./locales/${lang}/translation.json`, JSON.stringify(jsonData, null, 4));
        }
    } else {
        console.log(`file: ${filePath} does not exist`);
    };
})();

function keyExist(jsonData, key) {
    return Object.values(jsonData).some(value => {
        if (typeof value === 'object') {
            return key in value;
        }
        return false;
    });
}

async function translate(text, to) {
    // Replace with your Azure Translator Text API key
    const apiKey = process.env.AZURE_TRANSLATOR_API_KEY;
    const endpoint = `https://api.cognitive.microsofttranslator.com/translate`;
    // general, legal, medical, technical, financial, government, academia, news, conversation, webpages, patents
    // const category = 'webpages';

    try {
        const response = await axios({
            method: 'post',
            url: endpoint,
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Ocp-Apim-Subscription-Region': 'westeurope',
                'Content-type': 'application/json',
            },
            params: {
                'api-version': '3.0',
                'to': to
                    // 'category': category
            },
            data: [{
                'text': text
            }]
        });
        return response.data[0].translations[0].text;
    } catch (error) {
        console.error(error);
        throw error;
    }
}