'use strict';

const { isValidRepositoryUrl, hasGithubToken, getRepositoryInfo } = require('../src/utils');

describe('utils.isValidRepositoryUrl()', () => {
  it('should determine whether the url is valid or not.', () => {
    spyOn(console, 'error');

    expect(
      isValidRepositoryUrl({
        repository: 'https://github.com/user-name/repository-name.git'
      })
    ).toBe(true);

    expect(
      isValidRepositoryUrl({
        repository: {
          type: 'git',
          url: 'https://github.com/user-name/repository-name.git'
        }
      })
    ).toBe(true);

    expect(() => {
      return isValidRepositoryUrl({
        repository: 'https://github.com/user-name/repository-name'
      });
    }).toThrow(new Error('Invalid repository url on package.json'));

    expect(() => {
      return isValidRepositoryUrl({
        repository: ''
      });
    }).toThrow(new Error('Invalid repository url on package.json'));

    expect(() => {
      return isValidRepositoryUrl({
        repository: {
          url: 'https://github.com/user-name/repository-name'
        }
      });
    }).toThrow(new Error('Invalid repository url on package.json'));
  });
});

describe('utils.hasGithubToken()', () => {
  it('should determine a token is valid or not.', () => {
    expect(hasGithubToken('test_token')).toBe(true);
    expect(() => hasGithubToken(123123)).toThrow(new Error('Missing Github access token'));
  });
});

describe('utils.getRepositoryInfo()', () => {
  it('should get userName and repoName.', () => {
    let repo = getRepositoryInfo({
      repository: 'https://github.com/user-name/repository-name.git'
    });
    expect(repo.userName).toBe('user-name');
    expect(repo.repoName).toBe('repository-name');

    repo = getRepositoryInfo({
      repository: {
        type: 'git',
        url: 'https://github.com/user-name2/repository-name2.git'
      }
    });
    expect(repo.userName).toBe('user-name2');
    expect(repo.repoName).toBe('repository-name2');

    expect(() => {
      getRepositoryInfo({
        repository: 'https://github.com/user-name2/repository-name2'
      });
    }).toThrow();
  });
});
