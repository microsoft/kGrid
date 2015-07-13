export class TextTransformer {
    public context;
    private static _cached = [];

    constructor(context?) {
        this.context = context || {};
    }

    public transform(text, cache = true) {
        var funcStr = 'new Function(',
            funcArgNames = ['"$expr"'],
            funcArgs = [null],
            funcBody,
            func,
            cacheKey;

        for (var name in this.context) {
            funcArgNames.push('"' + name + '"');
            funcArgs.push(this.context[name]);
        }

        cacheKey = JSON.stringify({
            text: text,
            args: funcArgNames,
        });

        if (TextTransformer._cached[cacheKey]) {
            func = TextTransformer._cached[cacheKey];
        } else {
            funcBody = this._compile(text);
            funcStr += funcArgNames.join(', ') + ', ' + funcBody + ');';
            func = eval(funcStr);

            if (cache) {
                TextTransformer._cached[cacheKey] = func;
            }
        }

        return func.apply(null, funcArgs);
    }

    private _escape(text) {
        return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/(\r\n|\n|\r)/gm,'\\n');
    }

    private _compile(text) {
        var re = /\${([^}]+)}|\$([a-zA-Z0-9]+)/g,
            functionBody = '',
            lastPosistion = 0;

        text.replace(re, (...args) => {
            var expr = args[1] || args[2],
                startPosition = args[3];

            if (startPosition > lastPosistion) {
                functionBody += '+"' + this._escape(text.substring(lastPosistion, startPosition)) + '"';
            }

            lastPosistion = startPosition + args[0].length;
            functionBody += '+' + expr;
        });

        if (text.length > lastPosistion) {
            return '"{return \\"\\"' + this._escape(functionBody) + '+\\"' + this._escape(this._escape(text.substring(lastPosistion, text.length))) + '\\";}"';
        } else {
            return '"{return \\"\\"' + this._escape(functionBody) + ';}"';
        }
    }
}

