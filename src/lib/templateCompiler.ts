export class TemplateCompiler {
    static TEMPLATE_REGEX: RegExp = /(\${.*?}?})/;
    static EXPRESSION_REGEX: RegExp = /^\${(.*?)}$/;

    static isExpression(template: string) {
        return template.indexOf('${') > -1;
    }

    static compile(template: string) {
        if (!this.isExpression(template)) return () => template;
        let generatedFn = `let out = '';`;
        const partials = template.split(this.TEMPLATE_REGEX);
        for (let x = 0, len = partials.length; x < len; x++) {
            if (this.isExpression(partials[x])) {
                const expressionMatches = partials[x].match(this.EXPRESSION_REGEX);
                if (expressionMatches) {
                    const expression = expressionMatches[1];
                    if (expression.match(/if|for|else|switch|case|break|{|}/)) {
                        generatedFn += expression
                    } else {
                        generatedFn += 'out+=\`${' + expression + '}\`;';
                    }
                }
            } else {
                generatedFn += `out+=\`${partials[x]}\`;`;
            }
        }
        return new Function('req', generatedFn + 'return out;');
    };
}