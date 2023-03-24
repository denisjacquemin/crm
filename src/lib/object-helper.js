function addMissingProperties(defaultObj, targetObj) {
    for (const property in defaultObj) {
        if (!(property in targetObj)) {
            targetObj[property] = defaultObj[property];
        }
    }
    return targetObj;
}

module.exports = {
    addMissingProperties
};