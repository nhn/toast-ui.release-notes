'use strict';

const GIT_REPO_REGEXP = /\/([\w-]+)\/([\w-.]+)\.git\/?$/; // .../user-name/repository-name.git

/**
 * Get repository url from package.json
 * @param {object} pkg - json object defined in package.json
 * @returns {string} - repository url
 */
function getRepositoryUrl(pkg) {
  const { repository } = pkg;
  let repositoryUrl = '';
  if (typeof repository === 'string' && repository.length > 0) {
    repositoryUrl = repository;
  } else if (repository instanceof Object) {
    repositoryUrl = repository.url;
  }

  if (!GIT_REPO_REGEXP.test(repositoryUrl)) {
    throw new Error('Invalid repository url on package.json');
  }

  return repositoryUrl;
}

/**
 * test repository url on package.json is valid
 * @param {object} pkg - json object defined in package.json
 * @returns {boolean} - url validity
 */
function isValidRepositoryUrl(pkg) {
  return !!getRepositoryUrl(pkg);
}

/**
 * test user has github access token
 * @param {string} - github token
 * @returns {boolean} - whether has token or not
 */
function hasGithubToken(token) {
  const isValidToken = typeof token === 'string' && token.length > 0;
  if (!isValidToken) {
    throw new Error('Missing Github access token');
  }

  return isValidToken;
}

/**
 * Get Repository username, repository name
 * @param {object} pkg - json object defined in package.json
 * @returns {Object} - username and repository name
 */
function getRepositoryInfo(pkg) {
  const result = getRepositoryUrl(pkg).match(GIT_REPO_REGEXP);
  if (!result) {
    throw new Error();
  }

  const [, userName, repoName] = result;

  return {
    userName,
    repoName
  };
}

module.exports = {
  isValidRepositoryUrl,
  hasGithubToken,
  getRepositoryInfo
};
