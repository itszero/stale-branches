import * as assert from 'assert'
import * as core from '@actions/core'
import {github, owner, repo} from './get-context'

export async function getIssue(branch: string): Promise<number> {
  let issueId: number

  try {
    const issueResponse = await github.rest.issues.listForRepo({
      owner,
      repo,
      title: `[STALE] Branch: ${branch}`
    })
    issueId = issueResponse.data[0].id || 0
    assert.ok(issueId, 'Date cannot be empty')
  } catch (err) {
    if (err instanceof Error)
      core.setFailed(`Failed to locate issue for ${branch} with ${err.message}`)
    issueId = 0
  }

  return issueId
}
