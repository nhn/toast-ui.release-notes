# TOAST UI Tools: Release Notes
> Github release notes generator.

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
npm run note --tag={specific-tag}
# enterprise
npm run note --apiUrl={github.your-enterprise-url.com/api/v3}
```

### Add a config file

Add your config files to the root of your working directory. The config file must be in the form of `tui-note.config.js`.

| Option | Type | Description |
| --- | --- | --- |
| `token` | `string` | Github access token for tui-release-note. If you pass a token as an environment variable, it will be overwritten. |
| `tag` | `string` | Tag to create a release note. If you pass a tag as the command line argument, it will be overwritten. (default: the latest tag) |
| `apiUrl` | `string` | Github API url. If you use the enterprise github, set your enterprise github url. (default: https://api.github.com) |
| `groupBy` | `object` | Determine how to categorize commits by their types. 'key' is `group name` and 'value' is `array of types`. (default: [defaultConfig.groupBy](src/defaultConfig.js)) |
| `commitMessage.type` | `function` | Determine how to get a type from a commit message. (default: [defaultConfig.commitMessage.type](src/defaultConfig.js)) |
| `template.commit` | `function` | Note from a commit. (default: [defaultConfig.template.commit](src/defaultConfig.js)) |
| `downloads` | `function | object` | Links to download the files. (reference: [defaultConfig.downloads](src/defaultConfig.js)) |


## 📜 License
This software is licensed under the [MIT License](https://github.com/nhn/tui.release-notes/blob/master/LICENSE) © [NHN](https://github.com/nhn).
