'use strict';

const path = require('path');
const github = require('./github');
const pkg = require(path.join(process.cwd(), 'package.json'));

const {env} = process;
const {TUI_GITHUB_TOKEN} = env;

/**
 * Entry function
 * Get target tags
 * Collect commits
 * Make release note
 * Post Github release 
 */
function release() {
    /* test ready */
    if (!testRepositoryUrl() || !testGitHubAccessToken()) {
        return;
    }

    /* Set Repository Info */
    const repo = getRepositoryInfo();
    github.setProject(env.TUI_GITHUB_TOKEN, repo.username, repo.reponame);

    github.getTags() /* Get target tags */
        .then(tags => getCommitLogs(tags))
        .then(commits => filterCommits(commits))
        .then(commits => makeReleaseNote(commits))
        .then(releaseNote => github.postGithubRelease(releaseNote))
        .catch(ex => {
            if (ex.message) {
                console.log(ex.message);
            }
        });
}

const gitRepoRegex = /\/([\w-]+)\/([\w-]+)\.git\/?$/;
/**
 * test repository url on package.json is valid
 * @returns {boolean} - url validity
 */
function testRepositoryUrl() {
    const pass = gitRepoRegex.test(getRepositoryUrl());
    if (!pass) {
        console.log('Wrong repository url on package.json');
    }

    return pass;
}

/**
 * test user has github access token
 * @returns {boolean} - whether has token or not
 */
function testGitHubAccessToken() {
    const pass = env.TUI_GITHUB_TOKEN;
    if (!pass) {
        console.log('Missing TUI_GITHUB_TOKEN environment variable');
    }

    return pass;
}

/**
 * If tags has BASE option, get commits between BASE and COMPARE
 * if not, get commits until COMPARE tag
 * @param {Range} tags - target tags to compare
 * @returns {Promise} - get commits from target tag
 */
function getCommitLogs(tags) {
    if (tags.base) {
        return github.getCommitLogsBetweenTags(tags.base.name, tags.compare.name);
    }

    return getCommitLogsUntilTag(tags.compare.name);
}

/**
 * Get commits until tag
 * @param {string} tag - tag name
 * @returns {Promise} - get commits until tag
 */
function getCommitLogsUntilTag(tag) {
    return new Promise((resolve, reject) => {
        github.getCommitByTag(tag)
            .then(data => github.getCommitBySHA(data.sha))
            .then(commit => github.getCommits({until: commit.author.date}))
            .then(commits => {
                resolve(commits);
            })
            .catch(ex => {
                if (ex.message) {
                    reject(ex.message);
                }
            });
    });
}

/**
 * Change to CommitObject 
 * @param {Array} commits - commits
 * @returns {Array} - filtered commits
 */
function filterCommits(commits) {
    const commitObjects = [];
    commits.forEach(commit => {
        const firstLine = `* ${commit.sha.substr(0, 7)} ${commit.commit.message} (${commit.commit.author.name})`;
        shipFittedObject(commitObjects, firstLine);
    });

    return commitObjects;
}

/**
 * Filter commit matches commit message conventions
 * @param {Object} commitObjects - array has matched commit object
 * @param {string} line - commit's first line
 * @returns {Array} - array has matched commit object
 */
function shipFittedObject(commitObjects, line) {
    const captureGroup = getCaptureGroupByRegex(line);
    let shipped = false;
    if (captureGroup) {
        const commit = makeCommitObject(captureGroup);
        commitObjects.push(commit);
        shipped = true;
    }
    if (shipped) {
        console.log('\x1b[32m%s\x1b[0m', `shipped: ${line}`);
    } else {
        console.log('\x1b[31m%s\x1b[0m', `omitted: ${line}`);
    }

    return commitObjects;
}

const commitLogRegex = /\* ([a-z0-9]{7}) (\w*):? (.*) (\(.*\))/;

/**
 * Get results of regular expresion check
 * test follows commit convention
 * @param {string} line - commit's first line
 * @returns {Array|null}
 *  - if matches, return array having capture group
 *  - if not, return null
 */
function getCaptureGroupByRegex(line) {
    return line.match(commitLogRegex);
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
    return str[0].toUpperCase() + str.substr(1).toLowerCase();
}

/**
 * Make release note from commit objects
 * @param {Array} commits - commits
 * @returns {string} - generated release note
 */
function makeReleaseNote(commits) {
    const titles = [
        'Features', 'Bug Fixes', 'Enhancement', 'Build Related', 'Documentation'
    ];
    let releaseNote = '';

    const groups = commits.reduce(groupCommitByType, {});
    for (const type in groups) {
        if (groups.hasOwnProperty(type)) {
            releaseNote += renderTemplate(titles[type], groups[type]);
        }
    }

    console.log('\n================================================================');
    console.log(releaseNote);
    console.log('================================================================\n');
    return releaseNote;
}

const typeRegexs = [
    /feat/i, /fix/i, /refactor|perf/i, /build/i, /doc/i
];
/**
 * 
 * @param {Object} groups - property: commit type, value: commits group by type
 * @param {*} commit - commit
 * @returns {Object} - groups
 */
function groupCommitByType(groups, commit) {
    typeRegexs.some((typeRegex, typeIndex) => {
        const matched = typeRegex.test(commit.type);
        if (matched) {
            addCommitOnGroup(groups, typeIndex, commit);
        }

        return matched;
    });

    return groups;
}

/**
 * Add Commit on Group
 * @param {Object} groups - objects has type as a property name, commits as a property's value
 * @param {string} type - commit type
 * @param {string} commit - commit
 */
function addCommitOnGroup(groups, type, commit) {
    if (!groups[type]) {
        groups[type] = [];
    }

    groups[type].push(commit);
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

/**
 * Get Repository username, repository name
 * @returns {Object} - username and repository name
 */
function getRepositoryInfo() {
    const [, username, reponame] = getRepositoryUrl().match(gitRepoRegex);

    return {
        username,
        reponame
    };
}

/**
 * Get repository url from package.json
 * @returns {string} - repository url
 */
function getRepositoryUrl() {
    const pkgRepository = pkg.repository || '';
    const repositoryUrl = (typeof pkgRepository === 'string') ? pkgRepository : pkgRepository.url;

    return repositoryUrl;
}

module.exports = {
    release,
    /* test */
    shipFittedObject,
    getCaptureGroupByRegex,
    makeCommitObject,
    makeReleaseNote,
    renderTemplate,
    getRepositoryInfo
};
