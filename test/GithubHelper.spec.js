'use strict';

const GithubHelper = require('../src/GithubHelper');
const config = require('../src/defaultConfig');
config.token = 'test-token';

describe('GithubHelper', () => {
  const tagListHasMultipleTag = [
    { name: '4th' },
    { name: '3rd' },
    { name: '2nd' },
    { name: '1st' }
  ];
  const tagListHasSingleTag = [{ name: '1st' }];
  const pkg = {
    repository: 'https://github.com/user-name/repository-name.git'
  };
  const github = new GithubHelper(pkg, config);

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
      config.tag = '3rd';

      const result = github.getTagRange(tagListHasMultipleTag);
      expect(result.compare.name).toBe('3rd');
      expect(result.base.name).toBe('2nd');

      delete config.tag;
    });

    it('should return prior tag, when tag option is set, and is first release', () => {
      config.tag = '1st';

      const result = github.getTagRange(tagListHasMultipleTag);
      expect(result.compare.name).toBe('1st');
      expect(result.base).toBeNull();

      delete config.tag;
    });

    it('should not return tags, when cannot find tag option', () => {
      config.tag = 'v0.0.0';

      expect(() => {
        github.getTagRange(tagListHasMultipleTag);
      }).toThrow(new Error('Could not find v0.0.0 in GitHub tag list'));

      delete config.tag;
    });
  });

  describe('_getTagsWithTagName()', () => {
    it('should find tag by tag name, on single tag', () => {
      const tagRange = github._getTagsWithTagName(tagListHasSingleTag, '1st');
      expect(tagRange.compare.name).toBe('1st');
      expect(tagRange.base).toBeNull();
    });

    it('should find tag by tag name', () => {
      const tagRange1 = github._getTagsWithTagName(tagListHasMultipleTag, '1st');
      expect(tagRange1.compare.name).toBe('1st');
      expect(tagRange1.base).toBeNull();

      const tagRange2 = github._getTagsWithTagName(tagListHasMultipleTag, '2nd');
      expect(tagRange2.compare.name).toBe('2nd');
      expect(tagRange2.base.name).toBe('1st');
    });

    it('should throw error on invalid inputs', () => {
      expect(() => {
        github._getTagsWithTagName([], '1.0.0');
      }).toThrow();
      expect(() => {
        github._getTagsWithTagName([], '');
      }).toThrow();
      expect(() => {
        github._getTagsWithTagName('', '1.0.0');
      }).toThrow();
    });
  });

  describe('_getLatestTwoTags()', () => {
    it('should get lastest tag on single tag', () => {
      const tagRange = github._getLatestTwoTags(tagListHasSingleTag);
      expect(tagRange.compare.name).toBe('1st');
      expect(tagRange.base).toBeNull();
    });

    it('should get latest tag on multiple tag', () => {
      const tagRange = github._getLatestTwoTags(tagListHasMultipleTag);
      expect(tagRange.compare.name).toBe('4th');
      expect(tagRange.base.name).toBe('3rd');
    });
  });
});
