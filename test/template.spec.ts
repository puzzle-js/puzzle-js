import "mocha";
import {expect} from "chai";
import {Template} from "../src/lib/template";

describe('Template', () => {
    it('should create a new Template instance', function () {
        const template = new Template('<template><div></div></template>');

        expect(template).to.be.instanceOf(Template);
    });

    it('should throw exception if template not found in html', function () {
        const test = () => {
            new Template('<div></div>');
        };

        expect(test).to.throw();
    });

    it('should prepare page class if script exists', function () {
        const template = new Template(`<script>module.exports = { onCreate(){this.testProp = 'test';} }</script><template><div></div></template>`);
        expect(template.pageClass.testProp).to.eq('test');
    });

    it('should prepare dependencies', function () {
        const template = new Template('<template><div><fragment from="Browsing" name="product"></fragment></div></template>');

        const dependencyList = template.getDependencies();
        expect(dependencyList).to.deep.include({
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            },
            fragments: {
                product: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'product',
                        primary: false,
                        shouldWait: false
                    }
                }
            }
        })
    });

    it('should compile page and return a function without any fragments', async function () {
        const template = new Template('<template><div><span>Puzzle</span></div></template>');
        const handler = await template.compile({});

        handler({}, {
            write(str: string) {
                throw new Error('Wrong express method, it should be end for single fragments')
            },
            end(str: string) {
                expect(str).to.eq('<div><span>Puzzle</span></div>');
            }
        });
    });

    it('should compile page with script without fragments', async function () {
        const template = new Template('<script>module.exports = {onCreate(){this.title = "Puzzle"}}</script><template><div><span>${this.title}</span></div></template>');
        const handler = await template.compile({});

        handler({}, {
            write(str: string) {
                throw new Error('Wrong express method, it should be end for single fragments')
            },
            end(str: string) {
                expect(str).to.eq('<div><span>Puzzle</span></div>');
            }
        });
    });

    it('should parse fragment attribute primary', function () {
        const template = new Template('<template><div><fragment from="Browsing" name="product" primary></fragment></div></template>');

        const dependencyList = template.getDependencies();
        expect(dependencyList).to.deep.include({
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            },
            fragments: {
                product: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'product',
                        primary: true,
                        shouldWait: true
                    }
                }
            }
        })
    });

    it('should throw error when multiple primary fragments', function () {
        const template = new Template(`
            <template>
                <div>
                <fragment from="Browsing" name="product" primary></fragment>
                <fragment from="Browsing" name="wrong" primary></fragment>
                </div>
            </template>
        `);

        const test = () => {
            const dependencyList = template.getDependencies();
        };

        expect(test).to.throw('Multiple primary')
    });

    it('should parse fragment attribute primary when fragment partials exists', function () {
        const template = new Template(`
            <template>
                <fragment from="Browsing" name="product" partial="notification"></fragment>
                <div>
                <fragment from="Browsing" name="product" primary></fragment>
                </div>
            </template>
        `);

        const dependencyList = template.getDependencies();
        expect(dependencyList).to.deep.include({
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            },
            fragments: {
                product: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'product',
                        primary: true,
                        shouldWait: true
                    }
                }
            }
        })
    });

    it('should parse fragment attribute shouldWait', function () {
        const template = new Template(`
            <template>
                <div>
                <fragment from="Browsing" name="product" shouldWait></fragment>
                </div>
            </template>
        `);

        const dependencyList = template.getDependencies();
        expect(dependencyList).to.deep.include({
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            },
            fragments: {
                product: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'product',
                        primary: false,
                        shouldWait: true
                    }
                }
            }
        })
    });

    it('should parse fragment attribute shouldWait when fragment partials exists', function () {
        const template = new Template(`
            <template>
                <fragment from="Browsing" name="product" partial="a"></fragment>
                <div>
                <fragment from="Browsing" name="product" shouldWait></fragment>
                </div>
                <fragment from="Browsing" name="product" partial="b"></fragment>
            </template>
        `);

        const dependencyList = template.getDependencies();
        expect(dependencyList).to.deep.include({
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            },
            fragments: {
                product: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'product',
                        primary: false,
                        shouldWait: true
                    }
                }
            }
        })
    });

    it('should parse fragment attribute shouldWait if parent node is head', function () {
        const template = new Template(`
            <template>
                <html>
                    <head>
                        <fragment from="Browsing" name="product" partial="meta"></fragment>
                    </head>
                    <body>
                        <div>
                            <fragment from="Browsing" name="product"></fragment>
                        </div>
                    </body>   
                </html>             
            </template>
        `);

        const dependencyList = template.getDependencies();
        expect(dependencyList).to.deep.include({
            gateways: {
                Browsing: {
                    gateway: null,
                    ready: false
                }
            },
            fragments: {
                product: {
                    gateway: 'Browsing',
                    instance: {
                        name: 'product',
                        primary: false,
                        shouldWait: true
                    }
                }
            }
        })
    });

});
