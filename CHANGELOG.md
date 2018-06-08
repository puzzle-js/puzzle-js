# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

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

