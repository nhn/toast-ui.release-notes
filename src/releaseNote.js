'use strict';

const GithubHelper = require('./GithubHelper');
const argv = require('minimist')(process.argv.slice(2));
const path = require('path');

const pkg = require(path.resolve(process.cwd(), 'package.json'));
const config = getConfig();
const githubHelper = new GithubHelper(pkg, config);

/**
 * Get configuration
 * @return {object} configuration
 * @private
 */
function getConfig() {
  // eslint-disable-next-line global-require
  const defaultConfig = require('./defaultConfig');
  let customConfig;
  try {
    // eslint-disable-next-line global-require
    customConfig = require(path.resolve(process.cwd(), 'tui-note.config.js'));
  } catch (e) {
    customConfig = {};
  }
  const combinedConfig = Object.assign(defaultConfig, customConfig);
  combinedConfig.tag = argv.tag || combinedConfig.tag;
  // eslint-disable-next-line no-process-env
  combinedConfig.token = process.env.TUI_GITHUB_TOKEN || combinedConfig.token;
  // eslint-disable-next-line no-process-env
  combinedConfig.apiUrl = process.env.apiUrl || combinedConfig.apiUrl;

  return combinedConfig;
}

/**
 * Entry function
 * Get target tags
 * Collect commits
 * Make release note
 * Post Github release
 */
function release() {
  /* get commits and make release note */
  githubHelper
    .getTags()
    .then(tags => githubHelper.getTagRange(tags))
    .then(_getCommitLogs)
    .then(_getCommitsWithExistingGroup)
    .then(_makeReleaseNote)
    .then(releaseNote => githubHelper.publishReleaseNote(releaseNote))
    ['catch'](error => console.error(error.message));
}

/**
 * If tagRange has BASE option, get commits between BASE and COMPARE
 * if not, get commits until COMPARE tag
 * @param {Object} tagRange - target tags to compare
 * @returns {Promise} - get commits from target tag
 * @private
 */
function _getCommitLogs(tagRange) {
  if (tagRange.base) {
    return githubHelper.getCommitLogsBetweenTags(tagRange.base.name, tagRange.compare.name);
  }

  return _loadCommitLogsUntilTag(tagRange.compare.name);
}

/**
 * Get commits until tag
 * @param {string} tag - tag name
 * @private
 */
function _loadCommitLogsUntilTag(tag) {
  /*
   * need register date of tagging commit
   * to get date,
   *  1) get commit by ref(tag), get commit sha
   *  2) get commit by sha, get registered date
   *  3) get commit list by `until` option
   */
  githubHelper
    .getCommitByTag(tag)
    .then(data => githubHelper.getCommitBySHA(data.sha))
    .then(commit => githubHelper.getCommits({ until: commit.author.date }))
    .then(commits => commits);
}

/**
 * Filter commits by their types.
 * @param {Array} commits - commits
 * @returns {Array} - filtered commits
 * @private
 */
function _getCommitsWithExistingGroup(commits = []) {
  const filteredCommits = [];

  commits.forEach(commitObj => {
    const { sha } = commitObj;
    const { message, author } = commitObj.commit;
    const group = _getGroupByCommitType(message);

    if (group) {
      filteredCommits.push({ group, sha, message, author });
      console.log('\x1b[32m%s\x1b[0m', `shipped: ${message}`);
    } else {
      console.log('\x1b[31m%s\x1b[0m', `omitted: ${message}`);
    }
  });

  return filteredCommits;
}

/**
 * Specify a commit by type
 * @param {string} message - commit message
 * @returns {string} group
 * @private
 */
function _getGroupByCommitType(message) {
  const type = config.commitMessage.type(message);
  const { groupBy } = config;

  for (const group in groupBy) {
    if (groupBy.hasOwnProperty(group)) {
      if (groupBy[group].indexOf(type) > -1) {
        return group;
      }
    }
  }

  return '';
}

/**
 * Make release note from commit objects
 * @param {Array} commits - commits
 * @returns {string} - generated release note
 * @private
 */
function _makeReleaseNote(commits) {
  let releaseNote = '';
  const { groupBy } = config;

  for (const group in groupBy) {
    if (groupBy.hasOwnProperty(group)) {
      const commitsInGroup = commits.filter(commit => commit.group === group);
      if (commitsInGroup.length > 0) {
        releaseNote += _makeGroupReleaseNote(group, _renderCommits(commitsInGroup));
      }
    }
  }

  if (config.downloads) {
    const { downloads } = config;
    const links = downloads instanceof Function ? downloads(pkg, config) : downloads;
    releaseNote += _makeGroupReleaseNote('Downloads', _renderDownloads(links));
  }

  console.log('\n================================================================');
  console.log(releaseNote);
  console.log('================================================================\n');

  return releaseNote;
}

/**
 * Make release note for one group (one section)
 * @param {string} heading - section's title
 * @param {string} note - section's contents
 * @returns {string} - generated release note for one group
 * @private
 */
function _makeGroupReleaseNote(heading, note) {
  return `\n## ${heading}\n\n${note}`;
}

/**
 * Render commit sections
 * @param {array<object>} commits - commits which have the same type
 * @returns {string} - release note's contents
 * @private
 */
function _renderCommits(commits) {
  let releaseNote = '';
  commits.forEach(commit => {
    releaseNote += `${config.template.commit(commit)}\n`;
  });

  return releaseNote;
}

/**
 * Render download section
 * @param {object} links - key: text to show / value: url to download
 * @returns {string} - release note's contents
 * @private
 */
function _renderDownloads(links) {
  let releaseNote = '';
  for (const title in links) {
    if (links.hasOwnProperty(title)) {
      releaseNote += `* [${title}](${links[title]})\n`;
    }
  }

  return releaseNote;
}

module.exports = {
  release,
  _getCommitsWithExistingGroup,
  _getGroupByCommitType,
  _makeReleaseNote,
  _renderCommits,
  _renderDownloads
};
