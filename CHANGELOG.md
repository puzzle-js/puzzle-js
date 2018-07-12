# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

# [3.1.1] - 12-07-2018
### Added
- Gateway redirections are working for preview modes

# [3.1.0] - 12-07-2018
### Added
- Supported BROTLI for assets

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

