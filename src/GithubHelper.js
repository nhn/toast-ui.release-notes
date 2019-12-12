'use strict';

const Github = require('github-api');
const { isValidRepositoryUrl, hasGithubToken, getRepositoryInfo } = require('./utils');

const SUCCESS_STATUS = [200, 201];

class GithubHelper {
  /**
   * Set authentication repository config
   * @param {Object} repo - personal access token
   */
  constructor(pkg, config) {
    isValidRepositoryUrl(pkg);
    hasGithubToken(config.token);

    this.repo = this._getRepo(pkg, config);
    this.config = config;
  }

  /**
   * Get Repository configured with access token, base url
   * @param {object} pkg - json object defined in package.json
   * @param {object} config - configuration
   * @returns {Repository} - repository
   * @see https://github.com/github-tools/github/blob/22b889cd48cd281812b020d85f8ea502af69ddfd/lib/Repository.js
   * @private
   */
  _getRepo(pkg, { token, apiUrl }) {
    const repoInfo = getRepositoryInfo(pkg);
    const gh = new Github({ token }, apiUrl);

    return gh.getRepo(repoInfo.userName, repoInfo.repoName);
  }

  /**
   * make and return promise, using github api
   * @param {Function} api - api function
   * @returns {Promise} - response data, or error
   * @private
   */
  _request(api) {
    return api().then(response => {
      if (SUCCESS_STATUS.indexOf(response.status) < 0) {
        throw new Error(this._pretty(response));
      }

      return response;
    });
  }

  /**
   * console log on error
   * @param {Exception} error - error while Promise
   * @param {string} [description] - additional description on error
   * @private
   */
  _consoleError(error, description) {
    if (error && error.message) {
      console.error(error.message);
    }

    if (description) {
      console.error(description);
    }
  }

  /**
   * Get all tags in github
   * then set COMPARE and BASE tag by argments
   * BASE tag omits when COMPARE tag is initial tag
   * @returns {Promise} - compare tag and base tag
   */
  getTags() {
    return this._request(this.repo.listTags.bind(this.repo))
      .then(response => response.data)
      ['catch'](err => this._consoleError(err, 'Could not get tags from github'));
  }

  /**
   * Get tag names to compare
   * @param {Array} tags - tags, latest tag comes first
   * @param {string} argvTag - tag passed as a argument at bash
   * @returns {Range} - tags to compare
   */
  getTagRange(tags) {
    const { tag } = this.config;
    const range = tag ? this._getTagsWithTagName(tags, tag) : this._getLatestTwoTags(tags);

    this.releasingTag = range.compare.name;
    console.log(`\n>>>> tag: ${this.releasingTag}`);

    return range;
  }

  /**
   * User set target tag by `--tag={tag}` option at bash
   * Find target tag from tag list,
   * @param {Array} tags - tags, latest tag comes first
   * @param {string} findingTag - tag name want to find, come from bash
   * @returns {Range} - tags to compare
   * @private
   */
  _getTagsWithTagName(tags, findingTag) {
    let compare = null;
    let base = null;

    const { length } = tags;
    const index = tags.findIndex(tag => tag.name === findingTag);
    compare = tags[index];
    if (index < length - 1) {
      base = tags[index + 1];
    }

    if (!compare) {
      throw new Error(`Could not find ${findingTag} in GitHub tag list`);
    }

    return {
      compare,
      base
    };
  }

  /**
   * Get latest two tags
   * @param {Array} tags - tags in Github
   * @returns {Range} - tags to compare
   * @private
   */
  _getLatestTwoTags(tags) {
    const [compare, base = null] = tags;

    if (!compare) {
      throw new Error('Could not find latest tag. No tags in GitHub');
    }

    return {
      compare,
      base
    };
  }

  /**
   * Get commit logs between tags
   * @param {string} start - tag name registered former
   * @param {string} end - tag name registered latter
   * @returns {Promise} - get commit logs between tags
   */
  getCommitLogsBetweenTags(start, end) {
    return this._request(this.repo.compareBranches.bind(this.repo, start, end))
      .then(response => response.data.commits)
      ['catch'](this._consoleError);
  }

  /**
   * Get commit by tag name
   * @param {string} tag - tag name
   * @returns {Promise} - get commit on tagging
   */
  getCommitByTag(tag) {
    return this._request(this.repo.getSingleCommit.bind(this.repo, tag))
      .then(response => response.data)
      ['catch'](err =>
        this._consoleError(
          err,
          `Could not get commit of ${tag}. Please check tag is registered on GitHub.`
        )
      );
  }

  /**
   * Get commit by sha
   * @param {string} sha - sha code
   * @returns {Promise} - get commit by sha
   */
  getCommitBySHA(sha) {
    return this._request(this.repo.getCommit.bind(this.repo, sha))
      .then(response => response.data)
      ['catch'](err => this._consoleError(err, `Could not get commit by ${sha.substr(0, 7)}`));
  }

  /**
   * Get commit list
   * @param {Object} options - list commit options
   * @returns {Promise} get commit logs
   */
  getCommits(options) {
    return this._request(this.repo.listCommits.bind(this.repo, options))
      .then(response => response.data)
      ['catch'](err => this._consoleError(err, 'Could not get commits'));
  }

  /**
   * Post release note
   * @param {string} releaseNote - generated release note
   */
  publishReleaseNote(releaseNote) {
    const options = {
      tag_name: this.releasingTag, // eslint-disable-line camelcase
      name: this.releasingTag,
      body: releaseNote
    };

    return this._request(this.repo.createRelease.bind(this.repo, options))
      .then(() => {
        console.log('Posted release notes to GitHub');
      })
      ['catch'](err => this._consoleError(err, 'Could not post release notes to GitHub'));
  }

  /**
   * Print http request and response data on console
   * @param {JSON} response - http response
   * @private
   */
  _pretty(response) {
    console.log(
      `****************************************************************
* method: ${response.config.method}
* url: ${response.config.url}
* status: ${response.status} ${response.statusText}
* ------------------------------------------------------------- *
* data: ${response.data}
****************************************************************`
    );
  }
}

module.exports = GithubHelper;
