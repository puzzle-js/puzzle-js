# Changelog

## [2.4.7] - 30-05-2018
### Changed
- Refactored promises

## [0.6.8] - 09-05-2018
### Changed
- Placeholder routes now have more priority because of /* paths.

## [0.6.7] - 07-05-2018
### Added
- unCaught exception logging

## [0.6.6] - 04-05-2018
### Changed
- logger.[level] is now accepting multiple parameters.

## [0.6.5] - 03-05-2018
### Changed
- Fixed stream request query string

## [0.6.4] - 24-04-2018
### Added
- Mapping attributes to gateway fragment request

## [0.6.3] - 03-04-2018
### Added
- Dependencies have a new property preview which will be used for preview mode only.

## [0.6.1] - 30-03-2018
### Added
- Dependencies can be provided by storefront configuration.

## [0.5.7] - 29-03-2018
### Removed
- Regex is not supported for content url and page url

### Changed
- Static paths are now coming before fragment routes in responsibility chain

## [0.5.6] - 29-03-2018
### Added
- Added regex support for content url and page url

## [0.5.5] - 28-03-2018
### Added
- Added SIGTERM protection for healthcheck status code

## [0.5.4] - 27-03-2018
### Changed
- Removed margin from body on preview mode.

## [0.5.3] - 21-03-2018
### Changed
- Edited mobile meta tag for disabling zoom

## [0.5.2] - 16-03-2018
### Added
- Route cache for api endpoints

## [0.5.1] - 16-03-2018
### Added
- Cache control header for [fragment contents](./docs/guide.md#fragments) and [api endpoints](./docs/guide.md#api)

## [0.4.6] - 15-03-2018
### Changed
- Fixed style tag on template compiler

## [0.4.5] - 14-03-2018
### Changed
- Fixed replace error caused by dollar sign for head scripts

## [0.4.4] - 14-03-2018
### Changed
- Fixed replace error caused by dollar sign

## [0.4.3] - 14-03-2018
### Added
- Documented project

## [0.4.2] - 14-03-2018
### Added
- Reflected request headers to gateway from storefront

## [0.4.1] - 13-03-2018
### Changed
- Removed middlewares from gateway info endpoint

## [0.4.0] - 13-03-2018
### Added
- Optional middlewares for fragments and apis

### Changed
- Added `content-type: text/html` to placeholder responses

## [0.0.1] - 23-02-2018
### Added
- Export tygateway project from `require('ty-puzzlejs').Gateway`
- Gateway config parsing
- Streaming fragment chunks
- Dependency Manager
