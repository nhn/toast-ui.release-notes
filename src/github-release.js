'use strict';

const pkg = require('../package.json');
const Github = require('github-api');
const {execSync} = require('child_process');
const {argv, env} = process;

const release = function() {
    if (argv.length < 3) {
        console.log('Usage:\t npm run release <<since>> <<until>>');

        return;
    }

    const [, , since] = argv;
    const until = argv[3] ? argv[3] : 'HEAD';
    const CMD_GIT_LOG = `git log ${since}..${until} --pretty=format:'* %h %s (%an)'`;

    const commitLog = execSync(CMD_GIT_LOG, {encoding: 'utf8'});
    const commitObjects = commitLog.split('\n').reduce(makeCommitObjects, []);
    postGithubRelease(makeReleaseNote(commitObjects));
};

function makeCommitObjects(commitObjects, line) {
    const captureGroups = getCaptureGroupsByRegex(line);

    if (captureGroups) {
        commitObjects.push(makeCommitObject(captureGroups));
    }

    return commitObjects;
}

function getCaptureGroupsByRegex(line) {
    const commitLogRegex = /\* ([a-z0-9]{7}) (\w*):? (.*) (\(.*\))/;

    return line.match(commitLogRegex);
}

function makeCommitObject(captureGroups) {
    const [, sha1, type, title, author] = captureGroups;
    const capitaledType = type[0].toUpperCase() + type.substr(1).toLowerCase();

    return {
        sha1,
        type: capitaledType,
        title,
        author
    };
}

function makeReleaseNote(commitObjects) {
    const typeRegexs = [
        /feat/i, /refactor|perf/i, /build/i, /doc/i, /fix/i
    ];
    const titles = [
        'Features', 'Enhancement', 'Build Related', 'Documentation', 'Bug Fixes'
    ];

    let releaseNote = '';
    typeRegexs.forEach((typeRegex, typeIndex) => {
        commitObjects
            .filter(commit => typeRegex.test(commit.type))
            .forEach((commit, commitIndex) => {
                releaseNote += renderTemplate(commit, commitIndex, titles[typeIndex]);
            });
    });

    return releaseNote;
}

function renderTemplate(commit, commitIndex, title) {
    let releaseNote = '';

    if (commitIndex === 0) {
        releaseNote += `\n## ${title}\n\n`;
    }
    releaseNote += `* ${commit.sha1} ${commit.type}: ${commit.title} ${commit.author}\n`;

    return releaseNote;
}

function postGithubRelease(releaseNote) {
    const repoInfo = getRepositoryInfo();

    if (!hasAccessToken() || !repoInfo) {
        return;
    }

    const enterpriseUrl = 'https://github.nhnent.com/api/v3';
    const gh = new Github({
        token: env.TUI_GITHUB_TOKEN
    }, enterpriseUrl);

    const repo = gh.getRepo(repoInfo.username, repoInfo.reponame);
    repo.createRelease({
        tag_name: `v${pkg.version}`, // eslint-disable-line camelcase
        name: `v${pkg.version}`,
        body: releaseNote,
        draft: true
    }).then(() => {
        console.log('Posted release notes to GitHub');
    }).catch(ex => {
        console.error('Could not post release notes to GitHub');
        if (ex.message) {
            console.error(ex.message);
        }
    });
}

function hasAccessToken() {
    const accessToken = env.TUI_GITHUB_TOKEN;
    if (!accessToken) {
        console.log('Missing TUI_GITHUB_TOKEN environment variable');
    }

    return accessToken;
}

function getRepositoryInfo() {
    const {repository} = pkg;
    const {length} = repository.split('/');

    if (length < 2) {
        console.log('Wrong repository url on package.json');
        return null;
    }

    const username = repository[length - 2];
    let reponame = repository[length - 1];
    reponame = reponame.substr(0, reponame.indexOf('.git'));

    return {
        username,
        reponame
    };
}

release();
