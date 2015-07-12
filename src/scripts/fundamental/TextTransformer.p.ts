export class TextTransformer {
    public context;

    constructor(context?) {
        this.context = context || {};
    }

    public transform(text) {
        var re = /\${([^}]+)}|\$([a-zA-Z0-9]+)/g,
            funcStr = 'new Function(',
            funcArgNames = ['"$expr"'],
            funcArgs = [null],
            func;

        for (var name in this.context) {
            funcArgNames.push('"' + name + '"');
            funcArgs.push(this.context[name]);
        }

        funcStr += funcArgNames.join(', ') + ', "{ return eval(arguments[0]); }");';
        func = eval(funcStr);

        return text.replace(re, (...args) => {
            var expr = args[1] || args[2];

            funcArgs.shift();
            funcArgs.unshift(expr);
            return func.apply(null, funcArgs);
        });
    }
}

