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

    expect(
      isValidRepositoryUrl({
        repository: 'https://github.com/user-name/repository-name'
      })
    ).toBe(false);

    expect(
      isValidRepositoryUrl({
        repository: ''
      })
    ).toBe(false);

    expect(
      isValidRepositoryUrl({
        repository: {
          url: 'https://github.com/user-name/repository-name'
        }
      })
    ).toBe(false);
  });
});

describe('utils.hasGithubToken()', () => {
  it('should determine a token is valid or not.', () => {
    expect(hasGithubToken('test_token')).toBe(true);
    expect(hasGithubToken(123123)).toBe(false);
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
