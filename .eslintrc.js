module.exports = {
  env: {
    amd: true,
    node: true,
    jasmine: true
  },
  globals: {
    tui: true
  },
  extends: ['tui/es6', 'plugin:prettier/recommended'],
  rules: {
    'no-console': 'off'
  }
};
