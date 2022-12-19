# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

# [3.60.10] - 19-12-2022
### Changed
- Template dependencies recognition and structure refactor.
- Improvements on the fragment if attribute

# [3.52.0] - 22-11-2022
### Changed
- Removed ON_FRAGMENT_RENDER config due to unused and performance issues. After this changes, puzzle-lib will be imported end of the body and do not block the main thread. *Please be careful ON_FRAGMENT_RENDER is not used in gateway configs when update PuzzleJs to this version.*

# [3.51.3] - 22-11-2022
### Changed
- Added Intersection Observer options to manage Intersection Observer settings by any page.

# [3.50.1] - 13-09-2022
### Changed
- Added more info to the reject body of get asset method (asset manager).

# [3.49.1] - 20-10-2021
### Added
- Added a config for loading css assets of fragments asynchronously.
# [3.49.0] - 19-10-2021
### Added
- Added execute type property for dependencies to inject as async or sync and after that all css assets will be loaded async to eliminate rendering blocking.
# [3.48.0] - 08-09-2021
### Added
- Added load method property for js dependencies to inject js file to head on render start
# [3.47.2] - 31-08-2021
### Fixed
- Fix for css injection for client async fragments
# [3.47.0] - 31-08-2021
### Added
- Css assets of client async fragments will be downloaded asynchronously. Also, the styles of the client async fragment with the critical-css property will be in the source code.
# [3.46.0] - 23-11-2020
### Added
- main and partial placeholders seperated for client-async mode, now placeholder payload can be string or an object
# [3.45.0] - 23-11-2020
### Added
- Implemented on demand client async feature.Fragments can be loaded externally according to user action.
# [3.33.0] - 23-11-2020
### Fix
- Fix for redirectionEnabled attribute to allow ssr redirection.
# [3.32.14] - 18-11-2020
### Add
- Check for redirectionEnabled attribute to allow secondary fragments redirect.

# [3.32.10] - 5-11-2020
### Update
- Update puzzle/lib version

# [3.32.8] - 27-10-2020
### Fixed
- RequestConfiguration header host is deleted because it caused some unintentional behaviours.

# [3.32.7] - 01-8-2019
### Fixed
- CheerioStatic type is changed to any

# [3.32.1] - 12-7-2019
### Fixed
- Injecting same resources multiple times problem fixed

# [3.31.4] - 01-7-2019
### Changed
- Template class refactoring
- Resource injector class created

# [3.31.2] - 27-6-2019
### Fixed
- Import typo fixed and unused variable removed
- Ignored files removed

# [3.31.1] - 19-6-2019
### Fixed
- Versioning problem fixed when injecting assets and dependencies

# [3.31.0] - 13-6-2019
### Added
- ForceVersion support added for gatewayBff fragment render system

# [3.30.2] - 13-6-2019
### Fixed
- Fixed wrong module import

# [3.30.1] - 12-6-2019
### Added
- Added min different hash amount to recompile gateway configuration.
- Gateway fragment returns passive versions too.

# [3.29.1] - 27-5-2019
### Fixed
- Fixes precompile style versions

# [3.29.0] - 24-5-2019
### Added
- Multiple Http Cookies in Header

# [3.28.0] - 23-5-2019
### Added
- Conditional Page Rendering

# [3.27.6] - 22-5-2019
### Fixed
- Fixed version matcher bug for inline CSS assets

# [3.27.3] - 13-5-2019
### Fixed
- Configuration loop fixed and it improves boot up time drastically.

# [3.27.1] - 10-5-2019
### Fixed
- [Warden](https://github.com/puzzle-js/puzzle-warden) updated.

# [3.24.3] - 25-04-2019
### Fixed
- `originalpath` header fixed for fragments
- Flushing Gzip compressed chunks fixed

# [3.24.1] - 25-04-2019
### Added
- `originalurl` key added to fragment

# [3.23.0] - 13-04-2019
### Added
- Experimental support for [Warden](https://github.com/puzzle-js/puzzle-warden)

# [3.22.0] - 23-03-2019
### Added
- Passive fragment compilers. Test cookies are working for both preview and stream mode. Assets and dependencies are now connected to test cookie too
### Changed
- Upgraded packages to latest versions

# [3.20.0] - 23-03-2019
### Added
- Added support for post pattern

# [3.19.0] - 23-11-2018 (Performance upgrades)
### Changed
- `GLOBAL_REQUEST_TIMEOUT` is now miliseconds and using inter http timeout.
- `helmet` is now optional with env `USE_HELMET`.
- `morgan` is now optional with env `USE_MORGAN`.
- Errors are not going to stdout by default. Use config `ENABLE_CONSOLE_ERROR`.
### Removed
- Fragment versions are now removed.


# [3.18.1] - 01-11-2018
### Changed
- Fixed `fragmentModelScript` missing semicolon added for each script closing

# [3.15.0] - 15-10-2018
### Added
- `gateway` header added for target content requests which is gateway hostname, so that strangler pattern with reverse proxy can be applicable easily.

# [3.14.0] - 26-09-2018
### Added
- `corsMaxAge` added to configuration, if it is provided it will set [Access-Control-Max-Age](https://www.w3.org/TR/cors/#access-control-max-age-response-header) header with given value on options request.

# [3.13.0] - 26-09-2018
### Added
- Added support for https for http/1.

# [3.12.0] - 17-09-2018
### Added
- ipv4 support added. Nodejs Docs [Docs](https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback)


# [3.11.0] - 17-09-2018
### Changed
- 400 responses will be warning level
- 500 responses will be error level
- All exceptions will be printed on console when there is no `DISABLE_CONSOLE_ERROR` config.

# [3.10.0] - 013-08-2018
### Added
- dnscache wrapper with 2000 ms ttl.

# [3.9.7] - 06-08-2018
### Changed
- Failed fragment conntent requests are now logging fragment name and url

# [3.9.5] - 06-08-2018
### Fixed
- Fragment get requests should use query from `req.query` to include changes on `req.query` object.

# [3.9.3] - 06-08-2018
### Added
- `originalurl` key added to fragment

# [3.9.0] - 03-08-2018
### Added
- `originalurl` key added to headers for api requests

# [3.8.0] - 03-08-2018
### Added
- `<puzzle-script>` can be used to inline scripts without any parse error

# [3.7.0] - 26-07-2018
### Changed
- Css files are now concataned and injected into head
### Removed
- Removed cdn support from dynamic files

# [3.6.1] - 26-07-2018
### Added
- Fixed duplicate compiling when booting up.

# [3.6.0] - 26-07-2018
### Added
- Storage module for debugging application cache into PuzzleLib

# [3.5.0] - 25-07-2018
### Fixed
- Fragment loaded for static and waited fragments
### Added
- Analytics added into PuzzleLib

# [3.4.8] - 19-07-2018
### Changed
- Assets are being loaded in parallel

# [3.4.0] - 19-07-2018
### Added
- **Temporary** cdn support for dynamic files

# [3.3.4] - 17-07-2018
### Fixed
- correlation-id header reflection on logs
### Added
- x-agentname header reflection on logs

# [3.3.0] - 17-07-2018
### Changed
- Changed [Request](https://github.com/request/request) as default http client because node-fetch was not able to scale under stress test.

# [3.2.2] - 12-07-2018
### Added
- data for static fragments

# [3.1.1] - 12-07-2018
### Added
- Gateway redirections are working for preview modes

# [3.1.0] - 12-07-2018
### Added
- Supported BROTLI for assets

# [3.2.1] - 09-07-2018
### Fixed
- Fixed waited fragment page models

# [3.0.1] - 09-07-2018
### Changed
- Changed how assets are being loaded.
### Added
- PuzzleLib and event system

# [2.19.1] - 30-06-2018
### Fixed
- Fixed closing empty tags automatically. Added config for selfClosing tag names.

# [2.19.0] - 30-06-2018
### Added
- Added route cache for fragment renders. use `routeCache` property with seconds in render options. (**Output cache works before all other middlewares**).

# [2.18.3] - 30-06-2018
### Fixed
- Customized template compilation error

# [2.18.2] - 30-06-2018
### Fixed
- Changed dynamic style naming to /static/{templateName}.min.css?v={hash}

# [2.18.1] - 30-06-2018
### Fixed
- Fixed dynamic style not found problem when using multiple instances of PuzzleJs storefront.

# [2.18.0] - 28-06-2018
### Added
- Added query string for disabling compression for performance testing.

### Changed
- Added cache-control header to dynamic css assets.

# [2.17.0] - 21-06-2018
### Added
- Custom injectables(configurator) are can be used for any property type except `object`.

# [2.16.0] - 21-06-2018
### Added
- Exposed container outside.

# [2.14.0] - 19-06-2018
### Added
- Added h2, spdy, http1 support with fallbacks.

# [2.14.0] - 19-06-2018
### Added
- Added original url to header to requests for fragment contents

# [2.13.0] - 18-06-2018
### Added
- corsDomains added to gateway configuration.

# [2.12.0] - 13-06-2018
### Added
- Assets can be injected using link for independent assets.

# [2.11.0] - 13-06-2018
### Added
- Assets can be injected with async, defer tags. `executeType` property of asset.

# [2.10.1] - 13-06-2018
### Fixed
- Added support check for connection api (Thanks to Safari)

# [2.10.0] - 13-06-2018
### Added
- Added debug information for variables

# [2.9.2] - 08-06-2018
### Changed
- Changed Logger into injectable class

# [2.9.1] - 08-06-2018
### Fixed
- Fixed configurator type checking for array urls

# [2.9.0] - 08-06-2018
### Added
- Gateway Fragment url can be array.
- Storefront Page url can be array.

# [2.8.0] - 08-06-2018
### Added
- TemplateClass now has method for converting string to data attribute with base64 `this.toDataAttribute(str)`.

# [2.7.0] - 07-06-2018
### Fixed
- Fixed all potentatial regular expression replacement mistakes

### Added
- `$model` property in data for dynamic page variables.

# [2.6.1] - 06-06-2018
### Fixed
- Fixed json body parsing

# [2.6.0] - 06-06-2018
### Added
- Debug mode added.
- Added gulp to project dependencies, public folder is now being moved into dist
- Analytics module added.
- Info module added.
- Fragments module added.
- DEBUG_INFORMATION as env or debug query enables debug information

# [2.4.8] - 04-06-2018
### Added
- PATCH, PUT, DELETE methods added as enum to be able to use for endpoints.

