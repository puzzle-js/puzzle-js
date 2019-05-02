import * as sinon from "sinon";
import * as faker from "faker";
import {CookieVersionMatcher} from "../src/cookie-version-matcher";
import {expect} from "chai";

const sandbox = sinon.createSandbox();

describe('[cookie-version-matcher.ts]', () => {
    beforeEach(() => {

    });

    afterEach(() => {
        sandbox.verifyAndRestore();
    });

    it('should create new CookieVersionMatcher', () => {
        const matcherFn = sandbox.spy();
        const matcher = new CookieVersionMatcher(matcherFn);

        expect(matcher).to.be.instanceOf(CookieVersionMatcher);
    });

    it('should return stringifier of matcher fn', () => {
        // Arrange
        const matcherFn = (req: any) => req.cookies['version'];
        const matcher = new CookieVersionMatcher(matcherFn);
        const spy = sandbox.spy(matcher, 'toJSON');

        // Act
        const matcherStringified = JSON.stringify(matcher);

        // Assert
        expect(spy.calledOnce).to.eq(true);
        expect(matcherStringified).to.eq(`"(req) => req.cookies['version']"`);
    });

    it('should parse stringified matcher function to real fn', () => {
        // Arrange
        const matcherFn = "(req) => req.cookies['version']";
        const matcher = new CookieVersionMatcher(matcherFn);

        // Act
        const matcherStringified = JSON.stringify(matcher);

        // Assert
        expect(matcherStringified).to.eq(`"${matcherFn}"`);
    });

    it('should return matcher version', () => {
        // Arrange
        const matchKey = faker.random.word();
        const cookieVersion = faker.random.word();
        const cookies = {
            [matchKey]: cookieVersion
        };
        const matcherSpy = sandbox.stub().withArgs(cookies).returns(cookieVersion);
        const matcher = new CookieVersionMatcher(matcherSpy);

        // Act
        const version = matcher.match(cookies);

        // Assert
        expect(matcherSpy.calledOnce).to.eq(true);
        expect(version).to.eq(cookieVersion);
    });

    it('should return null if matcher fn returns null', () => {
        // Arrange
        const matchKey = faker.random.word();
        const cookieVersion = faker.random.word();
        const cookies = {
            [matchKey]: cookieVersion
        };
        const matcherSpy = sandbox.stub().withArgs(cookies).returns(null);
        const matcher = new CookieVersionMatcher(matcherSpy);

        // Act
        const version = matcher.match(cookies);

        // Assert
        expect(matcherSpy.calledOnce).to.eq(true);
        expect(version).to.eq(null);
    });
});