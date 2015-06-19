export function createError(number, name, message) {
    return new Error(number + ': [' + name + '] ' + message);
}

