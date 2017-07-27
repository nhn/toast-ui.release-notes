'use strict';

const fs = require('fs');
const http = require('http');
const pkg = require('../package.json');
const Github = require('github-api');
const {execSync} = require('child_process');
const {argv} = process;

const release = function() {
    if (argv.length < 3) {
        console.log('Usage:\t npm run release <<since>> <<until>>');

        return;
    }

    const [, , since] = argv;
    const until = argv[3] ? argv[3] : 'HEAD';
    const CMD_GIT_LOG = `git log ${since}..${until} --pretty=format:'* %h %s (%an)'`;

    const commits = execSync(CMD_GIT_LOG, {encoding: 'utf8'});
    const releaseNote = sortByType(commits);
    // writeReleaseNoteToFile(releaseNote);
    postGithubRelease(releaseNote);
};

const commitLogRegex = /\* ([a-z0-9]{7}) (\w*):? (.*) (\(.*\))/;
function sortByType(commits) {
    const lines = commits.split('\n');
    const commitArray = [];
    lines.forEach(line => {
        const matches = line.match(commitLogRegex);
        const [, sha1, type, title, author] = matches;
        const capitaledType = type[0].toUpperCase() + type.substr(1).toLowerCase();
        const commit = {
            sha1,
            type: capitaledType,
            title,
            author
        };
        commitArray.push(commit);
    });

    let releaseNote = '';
    commitArray
        .filter(commit => /feat/i.test(commit.type) || /new/i.test(commit.type))
        .forEach((commit, index) => {
            if (index === 0) {
                releaseNote += '\n## Features\n\n';
            }
            releaseNote += renderTemplate(commit);
        });
    commitArray
        .filter(commit => /update|refactor|perf/i.test(commit.type))
        .forEach((commit, index) => {
            if (index === 0) {
                releaseNote += '\n## Enhancement\n\n';
            }
            releaseNote += renderTemplate(commit);
        });
    commitArray
        .filter(commit => /build/i.test(commit.type))
        .forEach((commit, index) => {
            if (index === 0) {
                releaseNote += '\n## Build Related\n\n';
            }
            releaseNote += renderTemplate(commit);
        });
    commitArray
        .filter(commit => /doc/i.test(commit.type))
        .forEach((commit, index) => {
            if (index === 0) {
                releaseNote += '\n## Documentation\n\n';
            }
            releaseNote += renderTemplate(commit);
        });
    commitArray
        .filter(commit => /fix/i.test(commit.type))
        .forEach((commit, index) => {
            if (index === 0) {
                releaseNote += '\n## Bug Fixes\n\n';
            }
            releaseNote += renderTemplate(commit);
        });

    return releaseNote;
}

function renderTemplate(commit) {
    return `* ${commit.sha1} ${commit.type}: ${commit.title} ${commit.author}\n`;
}

function writeReleaseNoteToFile(releaseNote) {
    const date = new Date();
    const yyyy = date.getFullYear();
    let MM = date.getMonth() + 1;
    MM = MM < 10 ? '0' + MM : MM;
    const dd = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    const yyyyMMdd = String(yyyy) + MM + dd;
    fs.writeFileSync(`release-v${pkg.version}-${yyyyMMdd}`, releaseNote);
}

function postGithubRelease(releaseNote) {

    if (!process.env.TUI_GITHUB_TOKEN) {
        console.log('Missing TUI_GITHUB_TOKEN environment variable');
        return;
    }

    const repository = pkg.repository.split('/');
    const length = repository.length;
    if (length < 2) {
        console.log('Wrong repository url on package.json');
        return;
    }
    const enterpriseUrl = 'https://github.nhnent.com/api/v3';
    const gh = new Github({
        token: process.env.TUI_GITHUB_TOKEN
    });
    const reponame = repository[length - 1].substr(0, repository[length - 1].indexOf('.git'));
    const repo = gh.getRepo('youjunghong', 'toast_basecamp'); //repository[length - 2], reponame);

    repo.createRelease({
        tag_name: 'REL', // `v${pkg.version}`,
        name: '1.2.5', // `v${pkg.version}`,
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

release();
