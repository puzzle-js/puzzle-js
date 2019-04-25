import {expect} from "chai";
import {TemplateCompiler} from "../src/templateCompiler";

describe('Template Compiler', () => {

    it('should process expression correctly without req', () => {
        const ReferenceClass: any = function (this: any) {
            this.valX = 100;
            this.valY = "200px";
        };

        const exampleReferenceClass = new ReferenceClass();


        const exampleExpressionObject = {
            "name": "nameVal",
            "width": "${this.valX}",
            "height": "${this.valY}"
        };

        const expectedResult = {
            "name": "nameVal",
            "width": 100,
            "height": "200px"
        };
        const result = TemplateCompiler.processExpression(exampleExpressionObject, exampleReferenceClass);
        expect(result).to.deep.eq(expectedResult);

    });

    it('should process expression correctly with req', () => {
        const ReferenceClass: any = function (this: any) {
            this.valX = 100;
            this.valY = "200px";
        };

        const exampleReferenceClass = new ReferenceClass();

        const exampleReq = {
            "query": {name: "xd"},
            "callback": () => {
            }
        };

        const exampleExpressionObject = {
            "name": "nameVal",
            "width": "${this.valX}",
            "height": "${this.valY}",
            "callback": "${req.callback}",
            "queryName": "${req.query.name}"
        };

        const expectedResult = {
            "name": "nameVal",
            "width": 100,
            "height": "200px",
            "callback": exampleReq.callback,
            "queryName": "xd"
        };

        const result = TemplateCompiler.processExpression(exampleExpressionObject, exampleReferenceClass, exampleReq);
        expect(result).to.deep.eq(expectedResult);
    });

});
