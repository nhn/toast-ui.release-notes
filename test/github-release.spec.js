'use strict';

const tnote = require('../src/github-release');

describe('tui-release-note', () => {
    describe('commit object creation', () => {
        const commitLog = '* 91dccdf Feat: title (resolves #22, #23) (#26) (authorrr)\n'
                        + '* 3bebcfd Refactor: title (#8) (future worker)\n'
                        + '* e639358 Fix: bug (fixes #21) (#25) (fixxer)\n';

        const [firstLine] = commitLog.split('\n');

        it('should capture 5 group on formated log', () => {
            const captureGroup = tnote.getCaptureGroupByRegex(firstLine);

            expect(captureGroup.length).toBe(5);
            expect(captureGroup[0]).toBe(firstLine);
            expect(captureGroup[1]).toBe('91dccdf');
            expect(captureGroup[2]).toBe('Feat');
            expect(captureGroup[3]).toBe('title (resolves #22, #23) (#26)');
            expect(captureGroup[4]).toBe('(authorrr)');
        });

        it('should not capture group on non conforming log', () => {
            const nonConformingLog = '* 3bebcfd Feat/Relese note generator (#8762) (Victor Hom)';
            const captureGroup = tnote.getCaptureGroupByRegex(nonConformingLog);

            expect(captureGroup).toBeNull();
        });

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
            const commitObjects = commitLog.split('\n').reduce(tnote.shipFittedObject, []);

            expect(commitObjects.length).toBe(3);
            expect(commitObjects[0].type).toBe('Feat');
            expect(commitObjects[1].type).toBe('Refactor');
            expect(commitObjects[2].type).toBe('Fix');
        });
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
