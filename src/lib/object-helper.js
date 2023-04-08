function mergeObjects(defaultObj, targetObj) {
    const mergedObj = {...targetObj };

    for (const property in defaultObj) {
        if (!(property in targetObj)) {
            mergedObj[property] = defaultObj[property];
        } else if (isObject(defaultObj[property]) && isObject(targetObj[property])) {
            mergedObj[property] = mergeObjects(defaultObj[property], targetObj[property]);
        }
    }

    return mergedObj;
}

function isObject(obj) {
    return typeof obj === "object" && obj !== null;
}

module.exports = {
    mergeObjects
};