'use strict';

const Github = require('github-api');
const GithubHelper = require('./GithubHelper');
const argv = require('minimist')(process.argv.slice(2));
const path = require('path');
const pkg = require(path.join(process.cwd(), 'package.json'));
const {TUI_GITHUB_TOKEN, apiUrl} = process.env; // eslint-disable-line no-process-env

const GIT_REPO_REGEXP = /\/([\w-]+)\/([\w-.]+)\.git\/?$/; // .../user-name/repository-name.git
/**
 * @example
 * * sha1sha fixed: some issue (fixes: #122) (author-name)
 * * f8a4dd2 feat: some feature (resolves: #111) (author-name)
 * * ddd1ddf refactor some structure (refs: #201) (author-name)
 * * cvm24kg fix some bug (fixes: #77) (author-name)
 * * dk2h35d doc: update readme (author-name)
 */
const COMMIT_LOG_REGEXP = /\* ([a-z0-9]{7}) (\w*):? (.*) \((.*)\)/;
const TYPE_REGEXPS = [
    /feat/i, /fix/i, /refactor|perf/i, /build/i, /doc/i
];
const TITLES = [
    'Features', 'Bug Fixes', 'Enhancement', 'Build Related', 'Documentation'
];

let githubHelper;

/**
 * Entry function
 * Get target tags
 * Collect commits
 * Make release note
 * Post Github release
 */
function release() {
    /* check could use github-api */
    if (!isValidRepositoryUrl(pkg) || !hasGitHubAccessToken()) {
        throw new Error();
    }

    /* set connection infomation */
    githubHelper = new GithubHelper(getRepo());

    /* get commits and make release note */
    githubHelper.getTags()
        .then(tags => githubHelper.getTagRange(tags, argv.tag))
        .then(getCommitLogs)
        .then(filterCommits)
        .then(makeReleaseNote)
        .then(releaseNote => githubHelper.publishReleaseNote(releaseNote))
        .catch(error => console.error(error.message));
}

/**
 * Get Repository configured with access token, base url
 * @returns {Repository} - repository
 * @see https://github.com/github-tools/github/blob/22b889cd48cd281812b020d85f8ea502af69ddfd/lib/Repository.js
 */
function getRepo() {
    const repoInfo = getRepositoryInfo(pkg);
    const baseUrl = apiUrl || 'https://api.github.com';
    const gh = new Github({
        token: TUI_GITHUB_TOKEN
    }, baseUrl);

    return gh.getRepo(repoInfo.userName, repoInfo.repoName);
}

/**
 * Get repository url from package.json
 * @param {JSON} pkgJson - json object defined in package.json
 * @returns {string} - repository url
 */
function getRepositoryUrl(pkgJson) {
    const pkgRepository = pkgJson.repository;
    let repositoryUrl = '';
    if (typeof pkgRepository === 'string' && pkgRepository.length > 0) {
        repositoryUrl = pkgRepository;
    } else if (pkgRepository instanceof Object) {
        repositoryUrl = pkgRepository.url;
    } else {
        throw new Error('repository in package.json is invalid.');
    }

    return repositoryUrl;
}

/**
 * Get Repository username, repository name
 * @param {JSON} pkgJson - json object defined in package.json
 * @returns {Object} - username and repository name
 */
function getRepositoryInfo(pkgJson) {
    const [, userName, repoName] = getRepositoryUrl(pkgJson).match(GIT_REPO_REGEXP);

    return {
        userName,
        repoName
    };
}

/**
 * test repository url on package.json is valid
 * @param {JSON} pkgJson - json object defined in package.json
 * @returns {boolean} - url validity
 */
function isValidRepositoryUrl(pkgJson) {
    const pass = GIT_REPO_REGEXP.test(getRepositoryUrl(pkgJson));
    if (!pass) {
        console.error('Invalid repository url on package.json');
    }

    return pass;
}

/**
 * test user has github access token
 * @returns {boolean} - whether has token or not
 */
function hasGitHubAccessToken() {
    const pass = (typeof TUI_GITHUB_TOKEN === 'string') && TUI_GITHUB_TOKEN.length > 0;
    if (!pass) {
        console.error('Missing TUI_GITHUB_TOKEN environment variable');
    }

    return pass;
}

/**
 * If tagRange has BASE option, get commits between BASE and COMPARE
 * if not, get commits until COMPARE tag
 * @param {Object} tagRange - target tags to compare
 * @returns {Promise} - get commits from target tag
 */
function getCommitLogs(tagRange) {
    if (tagRange.base) {
        return githubHelper.getCommitLogsBetweenTags(tagRange.base.name, tagRange.compare.name);
    }

    return getCommitLogsUntilTag(tagRange.compare.name);
}

/**
 * Get commits until tag
 * @param {string} tag - tag name
 */
function getCommitLogsUntilTag(tag) {
    /*
     * need register date of tagging commit
     * to get date,
     *  1) get commit by ref(tag), get commit sha
     *  2) get commit by sha, get registered date
     *  3) get commit list by `until` option
     */
    githubHelper.getCommitByTag(tag)
        .then(data => githubHelper.getCommitBySHA(data.sha))
        .then(commit => githubHelper.getCommits({until: commit.author.date}))
        .then(commits => commits);
}

/**
 * Change to CommitObject
 * @param {Array} commits - commits
 * @returns {Array} - filtered commits
 */
function filterCommits(commits) {
    const commitObjects = [];
    commits.forEach(commitObj => {
        const firstLine
            = `* ${commitObj.sha.substr(0, 7)} ${commitObj.commit.message} (${commitObj.commit.author.name})`;
        const commitObject = matchCommitMessage(firstLine);
        if (commitObject) {
            commitObjects.push(commitObject);
        }
    });

    return commitObjects;
}

/**
 * Filter commit matches commit message conventions
 * @param {string} commitMessage - commit's first line
 * @returns {Array} - filtered commit objects
 */
function matchCommitMessage(commitMessage) {
    const captureGroup = commitMessage.match(COMMIT_LOG_REGEXP);
    let commit;
    if (captureGroup) {
        commit = makeCommitObject(captureGroup);
        console.log('\x1b[32m%s\x1b[0m', `shipped: ${commitMessage}`);
    } else {
        console.log('\x1b[31m%s\x1b[0m', `omitted: ${commitMessage}`);
    }

    return commit;
}

/**
 * Make commit object from Capture group
 * @param {Array} captureGroup - capture group of regex
 * @returns {Object} commit object
 */
function makeCommitObject(captureGroup) {
    const [, sha1, type, title, author] = captureGroup;
    const capitalizedType = capitalizeString(type);

    return {
        sha1,
        type: capitalizedType,
        title,
        author
    };
}

/**
 * Capitalize string
 * @param {string} str - string
 * @returns {string} - capitalized string
 */
function capitalizeString(str) {
    return `${str[0].toUpperCase()}${str.substr(1).toLowerCase()}`;
}

/**
 * Make release note from commit objects
 * @param {Array} commits - commits
 * @returns {string} - generated release note
 */
function makeReleaseNote(commits) {
    let releaseNote = '';

    const groups = getGroupsByCommitType(commits);
    for (const type in groups) {
        if (groups.hasOwnProperty(type)) {
            releaseNote += renderTemplate(TITLES[type], groups[type]);
        }
    }

    console.log('\n================================================================');
    console.log(releaseNote);
    console.log('================================================================\n');
    return releaseNote;
}

/**
 * check commit type by regular expression of available types
 * @param {string} type - commit type
 * @returns {number}
 *  - index: when commit type is matched by some type's
 *  - -1: matches nothing
 */
function findMatchedTypeIndex(type) {
    const length = TYPE_REGEXPS.length; // eslint-disable-line prefer-destructuring
    for (let i = 0; i < length; i += 1) {
        if (TYPE_REGEXPS[i].test(type)) {
            return i;
        }
    }

    return -1;
}

/**
 * Specify commit by type, add on array, group[type]
 * @param {Array} commits - commits
 * @returns {Object} groups - property: commit type, value: all commits having exact type
 */
function getGroupsByCommitType(commits) {
    const groups = {};
    commits.forEach(commit => {
        const typeIndex = findMatchedTypeIndex(commit.type);
        if (typeIndex > -1) {
            addCommitOnGroup(groups, typeIndex, commit);
        }
    });

    return groups;
}

/**
 * Add Commit on Group
 * @param {Object} groups - objects has type as a property name, commits as a property's value
 * @param {number} typeIndex - commit type
 * @param {string} commit - commit
 */
function addCommitOnGroup(groups, typeIndex, commit) {
    if (!groups[typeIndex]) {
        groups[typeIndex] = [];
    }

    groups[typeIndex].push(commit);
}

/**
 * Render template
 * @param {string} title - commit's type
 * @param {string} commits - commit groups has same type
 * @returns {string} - release note on type rendered by template
 */
function renderTemplate(title, commits) {
    let releaseNote = `\n## ${title}\n\n`;
    commits.forEach(commit => {
        releaseNote += `* ${commit.sha1} ${commit.type}: ${commit.title}\n`;
    });

    return releaseNote;
}

module.exports = {
    release,
    /* test */
    getRepo,
    getRepositoryUrl,
    getRepositoryInfo,
    isValidRepositoryUrl,
    hasGitHubAccessToken,
    getCommitLogs,
    getCommitLogsUntilTag,
    filterCommits,
    matchCommitMessage,

    makeCommitObject,
    capitalizeString,
    makeReleaseNote,
    findMatchedTypeIndex,
    getGroupsByCommitType,
    addCommitOnGroup,
    renderTemplate
};
