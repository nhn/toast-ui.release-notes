'use strict';

const tnote = require('../src/github-release');

describe('tui-release-note', () => {
    const pkgJson = {
        "repository": "https://github.com/user-name/repository-name.git"
    };
    const repoUrl = "https://github.com/user-name/repository-name.git";
   
    describe('has github access token', () => {
        it('should test it has Github Access token', () => {
            const token = process.env.TUI_GITHUB_TOKEN;
            const hasToken = !!token;
            expect(tnote.hasGitHubAccessToken()).toBe(hasToken);
        })
    });

    describe('isValidRepositoryUrl()', () => {
        it('should return true when url matches regular expression', () => {
            expect(tnote.isValidRepositoryUrl(pkgJson)).toBe(true);
        });

        it('should return false when url is not matches with regular expression', () => {
            const invalidPkgJson = {
                "repository": "https://github.com/user-name/repository-name"
            };
            expect(tnote.isValidRepositoryUrl(invalidPkgJson)).toBe(false);
        });
    });

    describe('getRepositoryUrl()', () => {
        it('should get repository url, if type of repository is string', () => {
            expect(tnote.getRepositoryUrl(pkgJson)).toBe(repoUrl);
        });
        it('should get repository url, if type of repository is object', () => {
            const pkgJsonWithLongInfo = {
                "repository": {
                    "svn": "git",
                    "url": repoUrl
                }
            }
            expect(tnote.getRepositoryUrl(pkgJsonWithLongInfo)).toBe(repoUrl);
        });
        it('should throw error, if repository property is invalid', () => {
            expect(() => {tnote.getRepositoryUrl('');}).toThrow('repository in package.json is invalid.');
            expect(() => {tnote.getRepositoryUrl({});}).toThrow('repository in package.json is invalid.');
        });
    });

    describe('getRepositoryInfo()', () => {
        it('should return username and repository name from github repository url', () => {
            const repo = tnote.getRepositoryInfo(pkgJson);
            expect(repo.userName).toBe('user-name');
            expect(repo.repoName).toBe('repository-name');
        });
    });

    describe('filterCommits()', () => {
        const validCommitObject = {
            sha: 'sssssssssdjfdjlkfdfdjlsdfjl',
            commit: {
                message: 'fix: some issue (fixes: #11)',
                author: {
                    name: 'author-name'
                }
            }
        };
        const invalidCommitObject = {
            sha: 'ddkdjklfjkldjlfjld',
            commit: {
                message: 'fhihi',
                author: {
                    name: 'authorddd'
                }
            }
        };
        it('should add commit object, when commit message matches with regexp', () => {
            const commitObjects = tnote.filterCommits([validCommitObject]);
            const commitObject = commitObjects[0];
            
            expect(commitObjects.length).toBe(1);
            expect(commitObject.sha1).toBe('sssssss');
            expect(commitObject.type).toBe('Fix');
            expect(commitObject.title).toBe('some issue (fixes: #11)');
            expect(commitObject.author).toBe('author-name');
        });

        it('should not add commit object, when commit message does not match with regexp', () => {
            const commitObjects = tnote.filterCommits([invalidCommitObject]);
            expect(commitObjects.length).toBe(0);
        });
    });

    describe('commit object creation', () => {
        const commitLog = '* 91dccdf Feat: title (resolves #22, #23) (#26) (authorrr)\n'
                        + '* 3bebcfd Refactor: title (#8) (future worker)\n'
                        + '* e639358 Fix: bug (fixes #21) (#25) (fixxer)\n';

        it('should make commit object by capture group', () => {
            const captureGroup = [
                '', '91dccdf', 'Feat', 'title (resolves #22, #23) (#26)', '(authorrr)'
            ];
            const commitObject = tnote.makeCommitObject(captureGroup);

            expect(commitObject.sha1).toBe('91dccdf');
            expect(commitObject.type).toBe('Feat');
            expect(commitObject.title).toBe('title (resolves #22, #23) (#26)');
            expect(commitObject.author).toBe('(authorrr)');
        });

        it('should make commit object array by commit log', () => {
            const commitObjects = [];
            commitLog.split('\n').forEach(
                commit => {
                    const commitObject = tnote.matchCommitMessage(commit);
                    if (commitObject) {
                        commitObjects.push(commitObject);
                    }
                }
            );

            expect(commitObjects.length).toBe(3);
            expect(commitObjects[0].type).toBe('Feat');
            expect(commitObjects[1].type).toBe('Refactor');
            expect(commitObjects[2].type).toBe('Fix');
        });
    });

    describe('findMatchedTypeIndex()', () => {
        expect(tnote.findMatchedTypeIndex('Feat')).toBe(0);
        expect(tnote.findMatchedTypeIndex('fixes')).toBe(1);
        expect(tnote.findMatchedTypeIndex('refactor')).toBe(2);
        expect(tnote.findMatchedTypeIndex('performance')).toBe(2);
        expect(tnote.findMatchedTypeIndex('build')).toBe(3);
        expect(tnote.findMatchedTypeIndex('docs')).toBe(4);
    });

    describe('getGroupsByCommitType()', () => {
        const fix1 = {type: 'fix'};
        const fix2 = {type: 'fixed'};
        const feat1 = {type: 'feat'};
        const feat2 = {type: 'feated'};

        const groups = tnote.getGroupsByCommitType([fix1, fix2, feat1, feat2]);
        expect(groups[0][0]).toBe(feat1);
        expect(groups[0][1]).toBe(feat2);
        expect(groups[1][0]).toBe(fix1);
        expect(groups[1][1]).toBe(fix2);
    });

    describe('release note rendering', () => {
        const commitObject1 = {
            sha1: '91dccdf',
            type: 'Feat',
            title: 'title',
            author: '(author)'
        };
        const commitObject2 = {
            sha1: '3bebcfd',
            type: 'Refactor',
            title: 'title (#8)',
            author: '(future worker)'
        };

        it('should render templete by commit object and title', () => {
            const featured = tnote.renderTemplate('Features', [commitObject1]);

            expect(featured).toBe('\n## Features\n\n* 91dccdf Feat: title\n');
        });

        it('should make release note by commit object array', () => {
            const releaseNote = tnote.makeReleaseNote([commitObject1, commitObject2]);
            const expected = '\n## Features\n\n* 91dccdf Feat: title\n'
                            + '\n## Enhancement\n\n* 3bebcfd Refactor: title (#8)\n';
            expect(releaseNote).toBe(expected);
        });
    });
});
