# [1.0.0-alpha.27](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.26...v1.0.0-alpha.27) (2021-07-10)


### Bug Fixes

* Fixed an issue where ruby couldn't escape pipe with a backslash ([ac111a2](https://github.com/vivliostyle/vfm/commit/ac111a201deedfdebb176ee2eff3ecf7eb3735f3))

# [1.0.0-alpha.26](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.25...v1.0.0-alpha.26) (2021-07-04)


### Features

* Added VFM settings to Frontmatter ([ff4efc7](https://github.com/vivliostyle/vfm/commit/ff4efc76ccf2984765f714d22ad0c6293be05482))

# [1.0.0-alpha.25](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.24...v1.0.0-alpha.25) (2021-07-03)


### Bug Fixes

* Fixed an issue that caused an error if Object was null for `vfm` ([38906f0](https://github.com/vivliostyle/vfm/commit/38906f04ee73b6f27d5ba06f05705899859c7c7c))
* Fixed an issue that caused an error if YAML object was null ([43233a3](https://github.com/vivliostyle/vfm/commit/43233a3d1501f315259cfe9c09e63bf58ee3aace))
* Fixed to be empty string instead of null when only key is specified in Frontmatter YAML ([1a64e33](https://github.com/vivliostyle/vfm/commit/1a64e33ab558348890547bc16dc5f445c8e336eb))

# [1.0.0-alpha.24](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.23...v1.0.0-alpha.24) (2021-06-28)


### Bug Fixes

* Fixed an issue where the optional `style` specification was ignored ([88bdb6c](https://github.com/vivliostyle/vfm/commit/88bdb6c0bcdad72e29517253da0970b0b6690bc2))


### Features

* Expose readMetadata API ([6ff37c5](https://github.com/vivliostyle/vfm/commit/6ff37c5c3fc37ff5c651f0b2f86b5d379883229e))

# [1.0.0-alpha.23](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.22...v1.0.0-alpha.23) (2021-06-27)


### Bug Fixes

* Don't convert dates and times that aren't quoted ([4adef06](https://github.com/vivliostyle/vfm/commit/4adef06bdbc6414878699d8f88804b90f12d5a06))


### Features

* Implemented document processing as VFM in case of major metadeta design changes ([fb57dae](https://github.com/vivliostyle/vfm/commit/fb57daed7acdae7115a9cc4d9dd3b9aa340bfbb4))
* Improved metadata definition with frontmatter ([449fa46](https://github.com/vivliostyle/vfm/commit/449fa46c27a97112599fcf9e6083d0dba38a754c))

# [1.0.0-alpha.22](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.21...v1.0.0-alpha.22) (2021-05-15)


### Bug Fixes

* Fixed an issue where inline footnotes were copied to title tag and section id when heading was defined ([59f8db0](https://github.com/vivliostyle/vfm/commit/59f8db0c0ab050026acbfeae4c0b486c2a740850))


### Features

* Convert footnotes HTML like Pandoc ([146abea](https://github.com/vivliostyle/vfm/commit/146abea96aa7d477e1508797f39b0acdc040c50e))
* footnotes ([d439d82](https://github.com/vivliostyle/vfm/commit/d439d82d2cbcdafda840f384399eebb3addfc230))

# [1.0.0-alpha.21](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.20...v1.0.0-alpha.21) (2021-05-02)


### Bug Fixes

* Error of `tsc` ([6e3b85a](https://github.com/vivliostyle/vfm/commit/6e3b85a6cb4c75c6ab1b98b00d50815836b0c986))
* Math syntax attributes should have been specified in the wrapping `<span>` instead of the `<body>`. ([13dbc79](https://github.com/vivliostyle/vfm/commit/13dbc799bc6526f3aad4c208c3a7dd726bfa6431))


### Features

* If math syntax is enabled and `<math>` is detected, `<script>` is output. ([6a707ef](https://github.com/vivliostyle/vfm/commit/6a707ef71ff36237d7138872f397a7b0e75d0657))
* Math syntax enabled default ([408a623](https://github.com/vivliostyle/vfm/commit/408a62357b3c752810c9ebc855f7df3f00f79db8))

# [1.0.0-alpha.20](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.19...v1.0.0-alpha.20) (2021-04-30)


### Features

* `hidden` specification of the heading is output as an attribute ([a933f6b](https://github.com/vivliostyle/vfm/commit/a933f6b00ce00bebb66c278afb105461d8c3d5d7))
* Added section leveling ([021b72f](https://github.com/vivliostyle/vfm/commit/021b72ffc2650499682904715da80932ffb977fc))
* Copy the section attributes from the heading, however the `id` will be moved ([a355dd5](https://github.com/vivliostyle/vfm/commit/a355dd5b30439bd0454334b5b1f441a8156e0a40))
* Disable section with blockquote heading ([f493797](https://github.com/vivliostyle/vfm/commit/f493797a658c3c861c47a7f472e3e8d5cdaa6aeb))

# [1.0.0-alpha.19](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.18...v1.0.0-alpha.19) (2021-04-26)


### Bug Fixes

* change `data-math-typeset` attribute to string boolean ([ee733b7](https://github.com/vivliostyle/vfm/commit/ee733b71de7a734af51358462e3a183d6be3f935))
* change the value of `data-math-typeset` from `boolean` to `string` ([ab3442b](https://github.com/vivliostyle/vfm/commit/ab3442bc000e1ee93c5b913d1852ea47a1d984d8))
* incorrect specification of characters immediately before/after the start and end in math syntax ([e0948ec](https://github.com/vivliostyle/vfm/commit/e0948ec608992b51f2240d79af57ff4f984df61b))


### Features

* add html tag for math syntax ([bcffbda](https://github.com/vivliostyle/vfm/commit/bcffbda34d1f3d947f94db8eef0583070afe7db4))
* escape `$` with an even number of `\` and one-letter expression in math syntax (inline) ([26e4cb8](https://github.com/vivliostyle/vfm/commit/26e4cb8526e7f6d6e45496f1707885b8cba19c83))
* implemented math syntax with MathJax ([1f62c24](https://github.com/vivliostyle/vfm/commit/1f62c2491500a886d8a8de3b912d3f43e8723901))
* implemented MathJax multi-line specification, pre/post-conditions for start and end symbols, and escape ([2611e92](https://github.com/vivliostyle/vfm/commit/2611e9208d105da4a60eabf2b437d17908860981))
* one-letter expression in math syntax (display) ([13f195a](https://github.com/vivliostyle/vfm/commit/13f195a6c2eed133c47ca61b8a70e1bed95024ff))
* set `aria-hidden: true` to `<figcaption>` so that screen readers don't even read `<img>`'s `alt` and `<figcaption>` ([91bb30c](https://github.com/vivliostyle/vfm/commit/91bb30c094e9da3eeb07e4b1171b63c005fdc192))

# [1.0.0-alpha.18](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.17...v1.0.0-alpha.18) (2021-04-09)

### Bug Fixes

- fixed a crash when specifying the HTML pre tag ([3fbbb82](https://github.com/vivliostyle/vfm/commit/3fbbb82144f4881a0085f60b27a66da0bed060ee))
- Fixed type overload inconsistencies by casting ([59b887e](https://github.com/vivliostyle/vfm/commit/59b887e8a99a4d9cc1a2c9cc814f667a08c3f9a8))

### Features

- frontmatter and metadata ([d12188b](https://github.com/vivliostyle/vfm/commit/d12188b9ec9617f33e1ce9b3544fed3777fb4696))

# [1.0.0-alpha.17](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.16...v1.0.0-alpha.17) (2021-02-22)

# [1.0.0-alpha.16](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.15...v1.0.0-alpha.16) (2021-01-22)

### Bug Fixes

- Apply option name changes to README ([e6c4431](https://github.com/vivliostyle/vfm/commit/e6c44311906c063913ab330f57e96eff38336f30))
- CLI option shorthand mistake [#56](https://github.com/vivliostyle/vfm/issues/56) ([ed52f94](https://github.com/vivliostyle/vfm/commit/ed52f9418f9ad3e9c8b047164f8ddb6285f3ea4e))
- Fixed by PR review ([417e944](https://github.com/vivliostyle/vfm/commit/417e944b2bf95560f88432377634047849fbfde1))

### Features

- Added --auto-line-breaks option to CLI ([24fe380](https://github.com/vivliostyle/vfm/commit/24fe3809990a9b03f9baafdea830d2beaa87b71e))
- Change automatic line breaks to optional ([bebc736](https://github.com/vivliostyle/vfm/commit/bebc73601673428fcc357e52603c06f73de3d26a))
- Changed to keep the default value per property by expanding the option ([3a691f6](https://github.com/vivliostyle/vfm/commit/3a691f6fd2eb4fd3e6cc0625573a11da66cd2a8d))
- Renamed line breaks option ([494185a](https://github.com/vivliostyle/vfm/commit/494185a606e13d26710d9dac1d153eb184686d7b))

# [1.0.0-alpha.15](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.14...v1.0.0-alpha.15) (2021-01-14)

### Bug Fixes

- replace() throws Error if empty ReplaceRules array is given ([b0cfb6a](https://github.com/vivliostyle/vfm/commit/b0cfb6ab869f39e7109f81c7e681c10ac5986bd2))

# [1.0.0-alpha.14](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.13...v1.0.0-alpha.14) (2021-01-11)

# [1.0.0-alpha.13](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.12...v1.0.0-alpha.13) (2021-01-11)

# [1.0.0-alpha.12](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.11...v1.0.0-alpha.12) (2021-01-11)

# [1.0.0-alpha.11](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.10...v1.0.0-alpha.11) (2020-12-16)

### Bug Fixes

- handle multiline input ([f1afb20](https://github.com/vivliostyle/vfm/commit/f1afb206d18d15f5f9c6d49b14a69fbc0eaa08c0))

### Features

- Add code block tests ([687227b](https://github.com/vivliostyle/vfm/commit/687227b7a3d43df5c07ae2008db381e9c0aed33f))
- Add math block tests ([b03bb73](https://github.com/vivliostyle/vfm/commit/b03bb7304f7dfba95e4fe0b94f963fe0c6856452))
- Add parser definition tests ([a27d0ab](https://github.com/vivliostyle/vfm/commit/a27d0ab83eb47245ac69e6d15fa91c7099c128c2))
- Add test codes ([34aa884](https://github.com/vivliostyle/vfm/commit/34aa8841fcbf53dc87c16177c6486b8dc60a11a1))

# [1.0.0-alpha.10](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.9...v1.0.0-alpha.10) (2020-07-02)

### Bug Fixes

- unwanted code attribution ([098eeb1](https://github.com/vivliostyle/vfm/commit/098eeb10296614ea43828636dbe1194192c4e65d))

### Features

- custom attributes ([dd74d39](https://github.com/vivliostyle/vfm/commit/dd74d39ad8c73cc1091f364d7acca9370af79c0d))
- footnotes and toc beacon ([4151325](https://github.com/vivliostyle/vfm/commit/4151325c7bce1f4cb84aafbd7af81c724eb17dd9))

# [1.0.0-alpha.9](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) (2020-07-02)

### Features

- code highlighting ([10058f3](https://github.com/vivliostyle/vfm/commit/10058f34086aa141c6b8b1852e0bd894ddec1fbd))
- properly handle math ([45f2687](https://github.com/vivliostyle/vfm/commit/45f2687bd233e2ee977976fcb4c2513d79975267))

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.5](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2020-06-24)

### Bug Fixes

- export parser ([c78c800](https://github.com/vivliostyle/vfm/commit/c78c800d2f8e4721271d5ddb900ef5b2b6396034))

### Features

- aggregate frontmatter ([e970720](https://github.com/vivliostyle/vfm/commit/e970720737e1eb65cd3d756f0a13d442457fbcff))

# [1.0.0-alpha.4](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2020-06-24)

### Bug Fixes

- add plugins ([d62b838](https://github.com/vivliostyle/vfm/commit/d62b8386e213bd8f81294fa4d6f963a236853357))

### Features

- auto-generate id for headings ([c2b3433](https://github.com/vivliostyle/vfm/commit/c2b34336552f8c715a0bf1d3322be73f6701a592))

# [1.0.0-alpha.3](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) (2020-06-15)

### Features

- add vfm cli ([5733e64](https://github.com/vivliostyle/vfm/commit/5733e64b10ab796c77b2912e3f3b0f458bcf8e84))

# [1.0.0-alpha.2](https://github.com/vivliostyle/vfm/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2020-06-14)

### Bug Fixes

- strict checks on nested fence symbols ([cd4fa32](https://github.com/vivliostyle/vfm/commit/cd4fa32f9d814bc8401f759a5c88011edf8f3423))

### Features

- add role syntax ([54625ae](https://github.com/vivliostyle/vfm/commit/54625ae196a6a8fff7e6434959cc9218a73456be))
- always insert hard line breaks ([a0a8bf2](https://github.com/vivliostyle/vfm/commit/a0a8bf21eccbce3c92d50e1ff9d2072acf01d4a6))
- fencedBlock ([3761ef7](https://github.com/vivliostyle/vfm/commit/3761ef7cf23d799f17376d46a07e11ede2a9826d))
