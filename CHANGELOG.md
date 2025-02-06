# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) with some additions:
- For all changes include one of [PATCH | MINOR | MAJOR] with the scope of the change being made.

## [Unreleased]

### Added
- [MINOR] Added module-rolldown to build modules (including react components) with rolldown
- [MINOR] Added react-app-vite to build apps with vite

### Changed

### Removed

## [0.13.2] - 2024-08-29

### Changed
- [MINOR] Updated dependencies


## [0.13.1] - 2023-08-22

### Added
- [MINOR] Added support for async configModifiers

### Changed
- [MINOR] Updated dependencies

## [0.13.0] - 2022-11-15

### Changed
- [MINOR] Allow specifying port for build-react-app --start
- [MAJOR] revert to being a non-ESM module

## [0.12.0] - 2022-11-15

### Added
- [MINOR] Added bundle build time analysis to react building

### Changed
- [MAJOR] Updated package to be an [ESM module](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)

## [0.11.0] - 2022-10-11

### NOTE(krishan711): v0.10.0 skipped due to npm error

### Changed
- [MAJOR] Updated kiba-publish to bump workspace versions correctly
- [MAJOR] Ignore public files for linting
- [MINOR] Added next-type param to kiba-publish for publishing preminor and premajor versions

## [0.9.0] - 2022-06-21

### Added
- [MAJOR] Added react-app-ssr

### Changed
- [MINOR] Added reading browserslist from package.json if provided

## [0.8.3] - 2022-04-05

### Added
- [MINOR] Added build-react-app-static for building statically rendered apps (for testing only atm!)

## [0.8.2] - 2021-12-26

### Changed
- [MINOR] Switch isomorphic-css-loader for MiniCssExtractPlugin

## [0.8.1] - 2021-11-21

### Changed
- [MINOR] Stop showing full screen error overlay for react-apps
- [MINOR] Split vendor chunks for react-apps
- [MINOR] Switch css-loader for isomorphic-css-loader

## [0.8.0] - 2021-10-11

### Changed
- [MINOR] Updated to webpack-dev-server 4
- [MINOR] Updated to use react-refresh instead of hot-loader

## [0.7.1] - 2021-07-14

### Added
- [MINOR] Added `InjectSeoPlugin`

### Changed
- [MINOR] Add all `KRT_` envvars to `CreateRuntimeConfigPlugin` for react-apps by default

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
