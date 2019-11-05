# TOAST UI Tools: Release Notes
> Github release notes generator.

![image](https://user-images.githubusercontent.com/8615506/68182173-845baf80-ffdc-11e9-8c5d-52a3f4d26138.png)

## 🚩 Table of Contents
* [Features](#-features)
* [Install](#-install)
* [Usage](#-usage)
  * [Add a config file](#add-a-config-file)
* [Pull Request Steps](#-pull-request-steps)
* [Contributing](#-contributing)
* [TOAST UI Family](#-toast-ui-family)
* [License](#-license)

## 🎨 Features

* Create a release note from a tag.
* Group commits by their types.
* Add links to download.

## 💾 Install

```javascript
// package.json
devDependencies: {
  "tui-release-notes": "git+https://github.com/nhn/tui.release-notes.git"
}
```

## 🔨 Usage

1. Check `package.json` has `repository` property. Repository url should end with `.git`.

```javascript
"repository": {
  "type": "git",
  "url": "https://github.com/username/repository-name.git"
}

// or for short expression
"repository": "https://github.com/username/repository-name.git"
```

2. Register `TUI_GITHUB_TOKEN` as an environment variable or `token` property in `tui-note.config.js`.

```javascript
// tui-note.config.js
module.exports = {
  token: 'your-github-token-for-tui-release-notes'
}
```

3. Add the command as a script to the project's `package.json` file.

```javascript
scripts: {
  "note": "tui-note"
}
```

4. Execute the command on your `project root`.

```bash
# latest tag
npm run note
# specific tag
npm run note -- --tag={specific-tag}
# enterprise
npm run note -- --apiUrl={github.your-enterprise-url.com/api/v3}
```

### Add a config file

Add your config files to the root of your working directory. The config file must be in the form of `tui-note.config.js`.

| Option | Type | Description |
| --- | --- | --- |
| `token` | `string` | Github access token for tui-release-note. If you pass a token as an environment variable, it will be overwritten. |
| `tag` | `string` | Tag to create a release note. If you pass a tag as the command line argument, it will be overwritten. (default: the latest tag) |
| `apiUrl` | `string` | Github API url. If you use the enterprise github, set your enterprise github url. (default: https://api.github.com) |
| `groupBy` | `object` | Determine how to categorize commits by their types. 'key' is `group name` and 'value' is `array of types`. (default: [defaultConfig.groupBy](https://github.com/nhn/tui.release-notes/blob/master/src/defaultConfig.js#L9)) |
| `commitMessage.type` | `function` | Determine how to get a type from a commit message. (default: [defaultConfig.commitMessage.type](https://github.com/nhn/tui.release-notes/blob/master/src/defaultConfig.js#L21)) |
| `template.commit` | `function` | Note from a commit. (default: [defaultConfig.template.commit](https://github.com/nhn/tui.release-notes/blob/master/src/defaultConfig.js#L33)) |
| `downloads` | `function \| object` | Links to download the files. (reference: [defaultConfig.downloads](https://github.com/nhn/tui.release-notes/blob/master/src/defaultConfig.js#L47)) |


## 🔧 Pull Request Steps

TOAST UI products are open source, so you can create a pull request(PR) after you fix issues.
Run npm scripts and develop yourself with the following process.

### Setup

Fork `master` branch into your personal repository.
Clone it to local computer. Install node modules.
Before starting development, you should check to haveany errors.

``` sh
$ git clone https://github.com/{your-personal-repo}/tui.release-notes.git
$ cd tui.release-notes
$ npm install
$ npm run test
```

### Develop

Let's start development!
Don't miss adding test cases and then make green rights.

#### Run karma test

``` sh
$ npm run test
```

### Pull Request

Before PR, check to test lastly and then check any errors.
If it has no error, commit and then push it!

For more information on PR's step, please see links of Contributing section.


## 💬 Contributing
* [Code of Conduct](https://github.com/nhn/tui.release-notes/blob/master/CODE_OF_CONDUCT.md)
* [Contributing guideline](https://github.com/nhn/tui.release-notes/blob/master/CONTRIBUTING.md)
* [Issue guideline](https://github.com/nhn/tui.release-notes/blob/master/docs/ISSUE_TEMPLATE.md)
* [Commit convention](https://github.com/nhn/tui.release-notes/blob/master/docs/COMMIT_MESSAGE_CONVENTION.md)


## 🍞 TOAST UI Family

* [TOAST UI Editor](https://github.com/nhn/tui.editor)
* [TOAST UI Calendar](https://github.com/nhn/tui.calendar)
* [TOAST UI Chart](https://github.com/nhn/tui.chart)
* [TOAST UI Image-Editor](https://github.com/nhn/tui.image-editor)
* [TOAST UI Grid](https://github.com/nhn/tui.grid)
* [TOAST UI Components](https://github.com/nhn)


## 📜 License
This software is licensed under the [MIT License](https://github.com/nhn/tui.release-notes/blob/master/LICENSE) © [NHN](https://github.com/nhn).
