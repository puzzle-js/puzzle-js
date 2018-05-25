import {expect} from "chai";
import {benchmark, callableOnce} from "../src/decorators";

export default () => {
    describe('Decorators', function () {
        describe('callableOnce', function () {
            it('should throw error when called more than one time', function () {

                class Test {
                    @callableOnce
                    fn(){
                        return true;
                    }
                }
                const testClass = new Test();

                testClass.fn();

                const secondCall = () => {
                    testClass.fn();
                };

                expect(secondCall).to.throw(`You can't call method fn of Test more than one once`);
            });
        });


        describe('benchmark', function () {
            it('should wrap method when debug mode enabled to log benchmarks', function (done) {
                class Test {
                    @benchmark(true, (log) => {
                        expect(log).ownProperty('cpu');
                        done();
                    })
                    fn(){
                        return true;
                    }
                }

                const testClass = new Test();

                testClass.fn();
            });
        });
    });
}
