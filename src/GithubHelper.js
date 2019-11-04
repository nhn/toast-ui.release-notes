'use strict';

const Github = require('github-api');
const { isValidRepositoryUrl, hasGithubToken, getRepositoryInfo } = require('./utils');

class GithubHelper {
  /**
   * Set authentication repository config
   * @param {Object} repo - personal access token
   */
  constructor(pkg, config) {
    if (!isValidRepositoryUrl(pkg) || !hasGithubToken(config.token)) {
      throw new Error();
    }

    this.repo = this.getRepo(pkg, config);
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
  getRepo(pkg, { token, apiUrl }) {
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
  request(api) {
    return api().then(response => {
      if (response.status !== 200) {
        throw new Error(this.pretty(response));
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
  consoleError(error, description) {
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
   * @private
   */
  getTags() {
    return this.request(this.repo.listTags.bind(this.repo))
      .then(response => response.data)
      ['catch'](err => this.consoleError(err, 'Could not get tags from github'));
  }

  /**
   * Get tag names to compare
   * @param {Array} tags - tags, latest tag comes first
   * @param {string} argvTag - tag passed as a argument at bash
   * @returns {Range} - tags to compare
   */
  getTagRange(tags) {
    const { tag } = this.config;
    const range = tag ? this.getTagsWithTagName(tags, tag) : this.getLatestTwoTags(tags);

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
  getTagsWithTagName(tags, findingTag) {
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
  getLatestTwoTags(tags) {
    const [compare] = tags;
    const base = tags[1] || null;

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
   * @param {string} since - tag name registered former
   * @param {string} until - tag name registered latter
   * @returns {Promise} - get commit logs between tags
   */
  getCommitLogsBetweenTags(since, until) {
    return this.request(this.repo.compareBranches.bind(this.repo, since, until))
      .then(response => response.data.commits)
      ['catch'](this.consoleError);
  }

  /**
   * Get commit by tag name
   * @param {string} tag - tag name
   * @returns {Promise} - get commit on tagging
   * @private
   */
  getCommitByTag(tag) {
    return this.request(this.repo.getSingleCommit.bind(this.repo, tag))
      .then(response => response.data)
      ['catch'](err =>
        this.consoleError(
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
    return this.request(this.repo.getCommit.bind(this.repo, sha))
      .then(response => response.data)
      ['catch'](err => this.consoleError(err, `Could not get commit by ${sha.substr(0, 7)}`));
  }

  /**
   * Get commit list
   * @param {Object} options - list commit options
   * @returns {Promise} get commit logs
   */
  getCommits(options) {
    return this.request(this.repo.listCommits.bind(this.repo, options))
      .then(response => response.data)
      ['catch'](err => this.consoleError(err, 'Could not get commits'));
  }

  /**
   * Post release note
   * @param {string} releaseNote - generated release note
   */
  publishReleaseNote(releaseNote) {
    const options = {
      tagName: this.releasingTag,
      name: this.releasingTag,
      body: releaseNote
    };

    return this.request(this.repo.createRelease.bind(this.repo, options))
      .then(() => {
        console.log('Posted release notes to GitHub');
      })
      ['catch'](err => this.consoleError(err, 'Could not post release notes to GitHub'));
  }

  /**
   * Print http request and response data on console
   * @param {JSON} response - http response
   * @private
   */
  pretty(response) {
    console.log('****************************************************************');
    console.log(`* method: ${response.config.method}`);
    console.log(`* url: ${response.config.url}`);
    console.log(`* status: ${response.status} ${response.statusText}`);
    console.log('* ------------------------------------------------------------- *');
    console.log('* data: ');
    console.log(response.data);
    console.log('****************************************************************');
  }
}

module.exports = GithubHelper;
