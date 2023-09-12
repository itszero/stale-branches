import * as core from '@actions/core'
import {compareBranches} from './functions/compare-branches'
import {deleteBranch} from './functions/delete-branch'
import {getBranches} from './functions/get-branches'
import {getRateLimit} from './functions/get-rate-limit'
import {getRecentCommitAge} from './functions/get-commit-age'
import {logBranchGroupColor} from './functions/logging/log-branch-group-color'
import {logLastCommitColor} from './functions/logging/log-last-commit-color'
import {logRateLimitBreak} from './functions/logging/log-rate-limit-break'
import {logTotalAssessed} from './functions/logging/log-total-assessed'
import {logTotalDeleted} from './functions/logging/log-total-deleted'
import {validateInputs} from './functions/get-context'
import {filterBranches} from './functions/utils/filter-branches'

export async function run(): Promise<void> {
  //Declare output arrays
  const outputDeletes: string[] = []
  const outputStales: string[] = []

  try {
    //Validate & Return input values
    const validInputs = await validateInputs()
    if (validInputs.daysBeforeStale == null) {
      throw new Error('Invalid inputs')
    }
    //Collect Branches, Issue Budget, Existing Issues, & initialize lastCommitLogin
    const unfilteredBranches = await getBranches()
    const branches = await filterBranches(unfilteredBranches, validInputs.branchesFilterRegex)
    const outputTotal = branches.length

    // Assess Branches
    for (const branchToCheck of branches) {
      // Break if Rate Limit usage exceeds 95%
      const rateLimit = await getRateLimit()
      if (rateLimit.used > 95) {
        core.info(logRateLimitBreak(rateLimit))
        core.setFailed('Exiting to avoid rate limit violation.')
        break
      }

      //Get age of last commit, generate issue title, and filter existing issues to current branch
      const commitAge = await getRecentCommitAge(branchToCheck.commmitSha)

      // Start output group for current branch assessment
      core.startGroup(logBranchGroupColor(branchToCheck.branchName, commitAge, validInputs.daysBeforeStale, validInputs.daysBeforeDelete))

      //Compare current branch to default branch
      const branchComparison = await compareBranches(branchToCheck.branchName, validInputs.compareBranches)

      //Log last commit age
      core.info(logLastCommitColor(commitAge, validInputs.daysBeforeStale, validInputs.daysBeforeDelete))

      //Create new issue if branch is stale & existing issue is not found & issue budget is >0
      if (commitAge > validInputs.daysBeforeStale) {
        if (!outputStales.includes(branchToCheck.branchName)) {
          outputStales.push(branchToCheck.branchName)
        }
      }

      //Delete expired branches
      if (commitAge > validInputs.daysBeforeDelete && branchComparison.save === false) {
        await deleteBranch(branchToCheck.branchName)
        outputDeletes.push(branchToCheck.branchName)
      }

      // Close output group for current branch assessment
      core.endGroup()
    }

    core.setOutput('stale-branches', JSON.stringify(outputStales))
    core.setOutput('deleted-branches', JSON.stringify(outputDeletes))
    core.info(logTotalAssessed(outputStales.length, outputTotal))
    core.info(logTotalDeleted(outputDeletes.length, outputStales.length))
  } catch (error) {
    if (error instanceof Error) core.setFailed(`Action failed. Error: ${error.message}`)
  }
}
