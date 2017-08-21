# tui-release-notes

Gather commits on tag

## Installation
```json
// package.json
devDependencies: {
    "tui-release-notes": "git+https://github.com/nhnent/tui.release-notes.git"
}
```

## Before Use
1. Check `package.json` has `repository` property
```json
// package.json
"repository": {
  "type": "git",
  "url": "https://github.com/username/repository-name.git"
}
// or for short expression
"repository": "https://github.com/username/repository-name.git"
```

2. Register `TUI_GITHUB_TOKEN` as a environment variables

3. Execute `tuie` on your `project root`
```json
// package.json
scripts: {
    "tuie": "tuie"
}
```

## Usage
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
