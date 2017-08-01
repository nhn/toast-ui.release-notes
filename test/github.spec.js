'use strict';

const github = require('../src/github');

describe('github', () => {
    describe('getTagRange()', () => {
        it('it should return latest two tags, when tag option is not set', () => {
            const tags = [{name: 'v2.0.0'}, {name: 'v1.0.2'}, {name: 'v1.0.1'}, {name: 'v1.0.0'}];
            const result = github.getTagRange(tags);
            expect(result.compare.name).toBe('v2.0.0');
            expect(result.base.name).toBe('v1.0.2');
        });

        it('it should not return prior tag, when tag is first release', () => {
            const tags = [{name: 'v1.0.0'}];
            const result1 = github.getTagRange(tags);
            expect(result1.compare.name).toBe('v1.0.0');
            expect(result1.base).toBeUndefined();
        });
    });
});
