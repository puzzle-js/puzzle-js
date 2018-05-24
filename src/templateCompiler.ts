export class TemplateCompiler {
    //ikisini de (\$\{.*\}) dene
    static TEMPLATE_REGEX: RegExp = /(\${.*?}?})/;
    static EXPRESSION_REGEX: RegExp = /^\${(.*?)}$/;
    static TEMPLATE_CONTENT_REGEX: RegExp = /<template>(.*?)<\/template>/mis;
    static PAGE_CLASS_CONTENT_REGEX: RegExp = /<script>(.*?)<\/script>(.*)<template>/mis;

    /**
     * Checks if there is any string interpolation.
     * @param {string} template
     * @returns {boolean}
     */
    static isExpression(template: string) {
        return template.indexOf('${') > -1;
    }

    /**
     * Compiles given html string into function that acceps req as an argument.
     * @param {string} template
     * @returns {Function}
     */
    static compile(template: string): Function {
        if (!this.isExpression(template)) return () => template;
        let generatedFn = `let out = '';`;
        const partials = template.split(this.TEMPLATE_REGEX);
        for (let x = 0, len = partials.length; x < len; x++) {
            if (this.isExpression(partials[x])) {
                const expressionMathes = partials[x].match(this.EXPRESSION_REGEX);
                if (expressionMathes) {
                    const expression = expressionMathes[1];
                    if (expression.match(/if|for|else|switch|case|break|{|}/)) {
                        generatedFn += expression;
                    } else {
                        generatedFn += 'out+=\`${' + expression + '}\`;';
                    }
                }
            } else {
                generatedFn += `out+=\`${partials[x]}\`;`;
            }
        }
        return new Function('req', generatedFn + 'return out;');
    }
}
