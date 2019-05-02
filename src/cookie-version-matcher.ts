import {ICookieMap} from "./types";

type MATCHER_FN = (cookies: ICookieMap) => string;

class CookieVersionMatcher {
    private readonly matcher: MATCHER_FN;

    constructor(matcher: MATCHER_FN | string) {
        this.matcher = this.parseMatcher(matcher);
    }

    match(cookies: ICookieMap){
        return this.matcher(cookies) || null;
    }

    toJSON() {
        return this.matcher.toString();
    }

    private parseMatcher(matcher: MATCHER_FN | string): MATCHER_FN {
        if (typeof matcher === 'string') {
            return eval(matcher);
        }

        return matcher;
    }
}

export {
    MATCHER_FN,
    CookieVersionMatcher
};