'use strict';

const Github = require('github-api');
const argv = require('minimist')(process.argv.slice(2));

let token = '';
let username = '';
let reponame = '';
let target = '';

/**
 * Set authentication token and repository config
 * @param {string} tok - personal access token
 * @param {string} user - username
 * @param {string} repository - repository name
 */
function setProject(tok, user, repository) {
    token = tok;
    username = user;
    reponame = repository;
}

/**
 * Get Repository configured with access token, base url
 * @returns {Repository} - repository
 */
function getRepo() {
    /* todo: should remove it before push to public */
    const enterpriseUrl = argv.enterprise ? argv.enterprise : 'https://github.nhnent.com/api/v3';
    const gh = new Github({
        token
    }, enterpriseUrl);

    return gh.getRepo(username, reponame);
}

/**
 * console log on exception
 * @param {Exception} ex - exception while Promise
 * @param {string} description - additional description on error
 */
function logOnException(ex, description) {
    if (description) {
        console.log(description);
    }

    if (ex && ex.message) {
        console.log(ex.message);
    }
}

/**
 * Get commit by tag name
 * @param {string} tag - tag name 
 * @returns {Promise} - get commit on tagging
 */
function getCommitByTag(tag) {
    return new Promise((resolve, reject) => {
        getRepo()
            .getSingleCommit(tag)
            .then(response => {
                if (response.status === 200) {
                    resolve(response.data);
                } else {
                    reject(Error(pretty(response)));
                }
            }).catch(ex => { // eslint-disable-line dot-notation
                logOnException(
                    ex,
                    `Could not get commit of ${tag}. Please check tag is registered on GitHub.`
                );
            });
    });
}

/**
 * Get commit by sha
 * @param {string} sha - sha code
 * @returns {Promise} - get commit by sha
 */
function getCommitBySHA(sha) {
    return new Promise((resolve, reject) => {
        getRepo()
            .getCommit(sha)
            .then(response => {
                if (response.status === 200) {
                    resolve(response.data);
                } else {
                    reject(Error(pretty(response)));
                }
            })
            .catch(ex => { // eslint-disable-line dot-notation
                logOnException(
                    ex,
                    `Could not get commit by ${sha.substr(0, 7)}`
                );
            });
    });
}

/**
 * Get commit list
 * @param {Object} options - list commit options
 * @returns {Promise} get commit logs
 */
function getCommits(options) {
    return new Promise((resolve, reject) => {
        getRepo()
            .listCommits(options)
            .then(response => {
                if (response.status === 200) {
                    resolve(response.data);
                } else {
                    reject(Error(pretty(response)));
                }
            })
            .catch(ex => {
                logOnException(ex, 'Could not get commits');
            });
    });
}

/**
 * Get commit logs between tags
 * @param {string} since - tag name registered former
 * @param {string} until - tag name registered latter
 * @returns {Promise} - get commit logs between tags
 */
function getCommitLogsBetweenTags(since, until) {
    return new Promise((resolve, reject) => {
        getRepo()
            .compareBranches(since, until)
            .then(response => {
                if (response.status === 200) {
                    resolve(response.data.commits);
                } else {
                    reject(Error(pretty(response)));
                }
            }).catch(ex => {
                logOnException(ex);
            });
    });
}

/**
 * Get all tags in github
 * then set COMPARE and BASE tag by argments
 * BASE tag omits when COMPARE tag is initial tag
 * @returns {Promise} - compare tag and base tag
 */
function getTags() {
    return new Promise((resolve, reject) => {
        getRepo()
            .listTags()
            .then(response => {
                if (response.status === 200) {
                    const tags = getTagRange(response.data);

                    if (tags.compare) {
                        resolve(tags);
                    } else {
                        const tag = argv.tag ? argv.tag : 'latest tag';
                        reject(Error(`Could not find ${tag} from github`));
                    }
                } else {
                    reject(Error(pretty(response)));
                }
            })
            .catch(ex => {
                logOnException(ex, 'Could not get tags from github');
            });
    });
}

/**
 * Get tag names to compare
 * 
 * @param {Array} tags - tags, latest tag comes first
 * @returns {Range} - tags to compare
 * @returns {Range.compare} - tag having changes on code
 * @returns {Range.base} - base tag, if Range.compare is the first tag, there is no Range.base
 */
function getTagRange(tags) {
    let compare = '';
    let base = '';

    if (argv.tag) {
        tags.some((tag, index, array) => {
            const matched = (tag.name === argv.tag);
            if (matched) {
                compare = tag;
                /* get tag registered before this commit */
                if (index < (array.length - 1)) {
                    base = array[index + 1];
                } else {
                    base = '';
                }
            }

            return matched;
        });
    } else {
        [compare, base] = tags;
    }

    target = compare;
    console.log(`\n>>>> tag: ${target.name}`);

    return {
        compare,
        base
    };
}

/**
 * Post release note
 * @param {string} releaseNote - generated release note
 */
function postGithubRelease(releaseNote) {
    getRepo()
        .createRelease({
            'tag_name': target,
            name: target,
            body: releaseNote
        })
        .then(() => {
            console.log('Posted release notes to GitHub');
        })
        .catch(ex => {
            logOnException(ex, 'Could not post release notes to GitHub');
        });
}

/**
 * Print http request and response data on console
 * @param {JSON} response - http response
 */
function pretty(response) {
    console.log('****************************************************************');
    console.log(`* method: ${response.config.method}`);
    console.log(`* url: ${response.config.url}`);
    console.log(`* status: ${response.status} ${response.statusText}`);
    console.log('* ------------------------------------------------------------- *');
    console.log('* data: ');
    console.log(response.data);
    console.log('****************************************************************');
}

module.exports = {
    setProject,
    getRepo,
    getCommitByTag,
    getCommitBySHA,
    getCommits,
    getCommitLogsBetweenTags,
    getTags,
    postGithubRelease,
    /* test */
    getTagRange
};
