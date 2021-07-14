# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) with some additions:
- For all changes include one of [PATCH | MINOR | MAJOR] with the scope of the change being made.

## [Unreleased]

### Added

### Changed
- [MINOR] Add all `KRT_` envvars to `CreateRuntimeConfigPlugin` for react-apps by default

### Removed

## [0.7.0] - 2021-07-06

### Added
- [MAJOR] Added `--config-modifier` param to specify all config (including `webpackConfigModifier`)
- [MAJOR] Added ability to remove unused imports (breaks existing eslint-ignores)
- [MINOR] Added support for npm 7

### Changed
- [MAJOR] Upgraded to webpack@5
- [MINOR] Updated PR title format to `[Feature | Fix | Task]: <desc>`
- [MINOR] Updated react app to use title from `package.name`
- [MINOR] Updated dev server to use `devServer` config settings if provided

### Removed
- [MAJOR] Removed `--webpack-config-modifier` in favour of `--config-modifier`

## [0.6.4] - 2021-01-07

### Added
- [MINOR] Created consistent format for type-check and lint outputs

### Changed
- [MINOR] Filter out node_modules for type checking
- [MINOR] Support opening the browser on any OS
- [PATCH] Added more linting rules for jsx
- [PATCH] Change linting to allow nested ternary declarations
- [PATCH] Ignore all build and dist folders for linting and type-checking

## [0.6.3] - 2020-12-30

### Added
- [MINOR] Added `lint` command
- [MINOR] Added `type-check` command

### Changed
- [MINOR] Update module and component to replace process.env correctly

## [0.6.2] - 2020-12-25

### Changed
- [MINOR] Updated `publish` to support publishing to next

## [0.6.1] - 2020-12-24

### Changed
- [MINOR] All node_modules passed through babel to get get the polyfilling correct

## [0.7.0] - 2020-12-23

Initial commit - extract from everypage
