'use strict';

process.env.TUI_GITHUB_TOKEN = 'test-token'; // eslint-disable-line no-process-env
const tuiNote = require('../src/releaseNote');

describe('_getCommitsWithExistingGroup()', () => {
  const validCommitObject = {
    sha: 'qwertyuiopasdfghjklzxcvbnm',
    commit: {
      message: 'fix: some issue (fix: #11)',
      author: {
        name: 'author-name'
      }
    }
  };
  const invalidCommitObject = {
    sha: 'mnbvcxzlkjhgfdsapoiuytrewq',
    commit: {
      message: 'invalid',
      author: {
        name: 'other-author-name'
      }
    }
  };
  it('should add commit object, when commit message matches with regexp', () => {
    const commitObjects = tuiNote._getCommitsWithExistingGroup([validCommitObject]);
    const [commitObject] = commitObjects;

    expect(commitObjects.length).toBe(1);
    expect(commitObject.sha).toBe('qwertyuiopasdfghjklzxcvbnm');
    expect(commitObject.group).toBe('Bug Fixes');
    expect(commitObject.message).toBe('fix: some issue (fix: #11)');
    expect(commitObject.author.name).toBe('author-name');
  });

  it('should not add commit object, when commit message does not match with regexp', () => {
    const commitObjects = tuiNote._getCommitsWithExistingGroup([invalidCommitObject]);
    expect(commitObjects.length).toBe(0);
  });
});

describe('_getGroupsByCommitType()', () => {
  it('should group by its type.', () => {
    expect(tuiNote._getGroupByCommitType('fix: some issue (fix: #11)')).toBe('Bug Fixes');
    expect(tuiNote._getGroupByCommitType('feat: some features (ref: #12)')).toBe('Features');
    expect(tuiNote._getGroupByCommitType('refactor: refactoring')).toBe('Enhancement');
    expect(tuiNote._getGroupByCommitType('perf: improve performance')).toBe('Enhancement');
    expect(tuiNote._getGroupByCommitType('docs: add tutorials')).toBe('Documentation');
    expect(tuiNote._getGroupByCommitType('chore: apply code review')).toBe('');
  });
});

describe('should make a release note', () => {
  const commitObject1 = {
    sha: '91dccdfasdfasdf',
    group: 'Features',
    message: 'feat: a new feature (ref #31)',
    author: 'author1'
  };
  const commitObject2 = {
    sha: '3bebcfdasdfasdf',
    group: 'Enhancement',
    message: 'perf: improve the performance',
    author: 'author2'
  };
  const links = {
    js: 'tui-release-note.js',
    css: 'tui-release-note.css'
  };

  it('by commits.', () => {
    const notes = tuiNote._renderCommits([commitObject1, commitObject2]);
    expect(notes).toBe(
      '* 91dccdf Feat: a new feature (ref #31)\n* 3bebcfd Perf: improve the performance\n'
    );
  });

  it('by downloads.', () => {
    const notes = tuiNote._renderDownloads(links);
    expect(notes).toBe('* [js](tui-release-note.js)\n* [css](tui-release-note.css)\n');
  });

  it('with grouping commits.', () => {
    const releaseNote = tuiNote._makeReleaseNote([commitObject1, commitObject2]);
    const expected =
      '\n## Features\n\n* 91dccdf Feat: a new feature (ref #31)\n' +
      '\n## Enhancement\n\n* 3bebcfd Perf: improve the performance\n';
    expect(releaseNote).toBe(expected);
  });
});
