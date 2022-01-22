import * as assert from 'assert'
import * as core from '@actions/core'
import {github, owner, repo} from './get-context'

export async function getRecentCommitDate(sha: string): Promise<string> {
  //core.info('Retrieving branch information...')

  let commitUrl: string
  let commitDate: string
  try {
    const branchResponse = await github.rest.repos.getCommit({
      owner,
      repo,
      ref: sha,
      per_page: 1,
      page: 1
    })
    core.info(branchResponse.data.commit.author?.date || '')
    commitUrl = branchResponse.data.html_url || ''
    commitDate = branchResponse.data.commit.author?.date || ''

    assert.ok(commitDate, 'Date cannot be empty')
    //assert.ok(protectEnabled, 'protected cannot be empty')
  } catch (err) {
    if (err instanceof Error)
      core.setFailed(`Failed to retrieve commit for ${repo} with ${err.message}`)
    commitDate = ''
    commitUrl = ''
  }

  // Print the previous release info
  core.info(`Commit Date: '${commitDate}'`)
  core.info(`Commit URL: '${commitUrl}'`)

  return commitDate
}
