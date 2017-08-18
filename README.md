# tui-release-notes

Gather commits on tag

## Installation
```json
// package.json
devDependencies: {
    "tui-release-notes": "git+https://github.com/nhnent/tui.release-notes.git"
}
```

## Usage
Register `TUI_GITHUB_TOKEN` as a environment variables

**Mac OS**
```sh
# ~/.bash_profile
export TUI_GITHUB_TOKEN=github-personal-access-toke
```

Execute `tuie` on your `project root`
```json
// package.json
scripts: {
    "tuie": "tuie"
}
```
```bash
# latest tag
npm run tuie
# specific tag
npm run tuie --tag={specific-tag}
# enterprise
npm run tuie --apiUrl={github.your-enterprise-url.com/api/v3}
```

## License
This software is licensed under the [MIT License](https://github.com/nhnent/tui.release-notes/blob/master/LICENSE).
