import express from "express";
import {IParsableRequestProperties} from "./types";

enum PropertyType {
    STRING = 'string',
    NUMBER = 'number',
    OBJECT = 'object'
}

enum PropertyLocation {
    QUERY = 'query',
    HEADER = 'header',
    COOKIE = 'cookie',
    BODY = 'body',
    PARAM = 'param'
}

const resolvers = {
    [PropertyLocation.QUERY]: (key: string, req: express.Request) => req.query[key],
    [PropertyLocation.HEADER]: (key: string, req: express.Request) => req.get(key),
    [PropertyLocation.COOKIE]: (key: string, req: express.Request) => req.cookies[key],
    [PropertyLocation.BODY]: (key: string, req: express.Request) => req.body[key],
    [PropertyLocation.PARAM]: (key: string, req: express.Request) => req.params[key],
};

const converters = {
    [PropertyType.STRING]: (value: any) => value.toString(),
    [PropertyType.OBJECT]: (value: any) => value,
    [PropertyType.NUMBER]: (value: any) => +value,
};

class FragmentPropBuilder {
    parseFragmentProperties(req: express.Request, fragmentPropertyConfiguration?: IParsableRequestProperties) {
        const props = {
            originalurl: req.headers['originalurl'],
            originalpath: req.headers['originalpath']
        };

        if (!fragmentPropertyConfiguration) return props;

        Object.keys(fragmentPropertyConfiguration).forEach(key => {
            const propertySettings = fragmentPropertyConfiguration[key];
            const value = resolvers[propertySettings.from](propertySettings.name || key, req);

            if (value) {
                props[key] = typeof propertySettings.type === 'string' ? converters[propertySettings.type](value) : value;
            }
        });

        return props;
    }
}

export {
    PropertyType,
    PropertyLocation,
    FragmentPropBuilder
};
