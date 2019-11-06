'use strict';

function getShortSHA(sha) {
  return sha.substr(0, 7);
}

module.exports = {
  apiUrl: 'https://api.github.com',
  groupBy: {
    Features: ['feat'],
    'Bug Fixes': ['fix'],
    Enhancement: ['refactor', 'perf'],
    Documentation: ['docs']
  },
  commitMessage: {
    /**
     * Determine how to get a type from a commit.
     * @param {string} commitMessage a message of commit
     * @return {string} type
     */
    type: commitMessage => commitMessage.split(':')[0].toLowerCase()
  },
  template: {
    /**
     * Note from a commit.
     * @param {commitObject} - a commit object
     *   @param {string} group - group of the commit
     *   @param {string} sha - sha-1 hash value
     *   @param {string} message - full message of the commit
     *   @param {string} author - author's name
     * @return {string} note
     */
    commit: commitObject => {
      const { sha, message } = commitObject;
      const [msg] = message.split('\n');
      const capitalizedMsg = `${msg[0].toUpperCase()}${msg.substr(1).toLowerCase()}`;

      return `* ${getShortSHA(sha)} ${capitalizedMsg.split('\n')[0]}`;
    }
  }
  /**
   * Set downloads as a function
   * @param {object} pkg - package.json
   * @param {config} config - configuration
   * @return {object} - key: text to show / value: url to download
   * @example
   * downloads: (pkg, config) => {
   *   const { name } = pkg;
   *   const tag = config.tag.slice(1);
   *   const extensions = ['css', 'js', 'min.css', 'min.js'];
   *   const result = {};
   *
   *   extensions.forEach(ext => {
   *     const filename = `${name}.${ext}`;
   *     result[filename] = `https://uicdn.toast.com/${name}/${tag}/${filename}`;
   *   });
   *
   *   return result;
   * }
   */

  /**
   * Set downloads as an object
   * key: text to show / value: url to download
   * @example
   * downloads: {
   *   'toastui-select-box.js': 'https://uicdn.toast.com/select-box/1.0.0/toastui-select-box.js',
   *   'toastui-select-box.css': 'https://uicdn.toast.com/select-box/1.0.0/toastui-select-box.css'
   * }
   */
};
