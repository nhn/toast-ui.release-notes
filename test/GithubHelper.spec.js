'use strict';

const GithubHelper = require('../src/GithubHelper');

describe('GithubHelper', () => {
    const tagListHasMultipleTag = [{name: '4th'}, {name: '3rd'}, {name: '2nd'}, {name: '1st'}];
    const tagListHasSingleTag = [{name: '1st'}];

    const github = new GithubHelper(
            'nae-mom-daero-mandon-token',
            {
                userName: 'username',
                repoName: 'repoName'
            }
        );
    describe('getTagRange() ', () => {
        it('it should return latest two tags, when tag option is not set', () => {
            const result = github.getTagRange(tagListHasMultipleTag);
            expect(result.compare.name).toBe('4th');
            expect(result.base.name).toBe('3rd');
        });

        it('should not return prior tag, when tag is first release', () => {
            const result = github.getTagRange(tagListHasSingleTag);
            expect(result.compare.name).toBe('1st');
            expect(result.base).toBeNull();
        });

        it('should return target tag and prior tag, when tag option is set', () => {
            const result = github.getTagRange(tagListHasMultipleTag, '3rd');
            expect(result.compare.name).toBe('3rd');
            expect(result.base.name).toBe('2nd');
        });

        it('should return prior tag, when tag option is set, and is first release', () => {
            const result = github.getTagRange(tagListHasMultipleTag, '1st');
            expect(result.compare.name).toBe('1st');
            expect(result.base).toBeNull();
        });

        it('should not return tags, when cannot find tag option', () => {
            expect(() => {
                github.getTagRange(tagListHasMultipleTag, 'v0.0.0');
            })
                .toThrow(new Error('Could not find v0.0.0 in GitHub tag list'));
        });
    });

    describe('getTagsWithTagName()', () => {
        it('should find tag by tag name, on single tag', () => {
            const tagRange = github.getTagsWithTagName(tagListHasSingleTag, '1st');
            expect(tagRange.compare.name).toBe('1st');
            expect(tagRange.base).toBeNull();
        });

        it('should find tag by tag name', () => {
            const tagRange1 = github.getTagsWithTagName(tagListHasMultipleTag, '1st');
            expect(tagRange1.compare.name).toBe('1st');
            expect(tagRange1.base).toBeNull();

            const tagRange2 = github.getTagsWithTagName(tagListHasMultipleTag, '2nd');
            expect(tagRange2.compare.name).toBe('2nd');
            expect(tagRange2.base.name).toBe('1st');
        });

        it('should throw error on invalid inputs', () => {
            expect(() => {github.getTagsWithTagName([], '1.0.0');}).toThrow();
            expect(() => {github.getTagsWithTagName([], '');}).toThrow();
            expect(() => {github.getTagsWithTagName('', '1.0.0');}).toThrow();
        });
    });

    describe('getLatestTwoTags()', () => {
        it('should get lastest tag on single tag', () => {
            const tagRange = github.getLatestTwoTags(tagListHasSingleTag);
            expect(tagRange.compare.name).toBe('1st');
            expect(tagRange.base).toBeNull();
        });

        it('should get latest tag on multiple tag', () => {
            const tagRange = github.getLatestTwoTags(tagListHasMultipleTag);
            expect(tagRange.compare.name).toBe('4th');
            expect(tagRange.base.name).toBe('3rd');
        });
    });
});
