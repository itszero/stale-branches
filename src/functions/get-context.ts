import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {CompareBranchesEnum} from '../enums/input-compare-branches'
import {Inputs} from '../types/inputs'

const repoToken = core.getInput('repo-token')
core.setSecret(repoToken)
export const github = getOctokit(repoToken)
export const {owner: owner, repo: repo} = context.repo

/**
 * Validates the Action's inputs and assigns them to the Inputs type
 *
 * @returns {Inputs} Valid inputs @see {@link Inputs}
 */
export async function validateInputs(): Promise<Inputs> {
  const result = {} as unknown as Inputs
  try {
    //Validate days-before-stale & days-before-delete
    const inputDaysBeforeStale = Number(core.getInput('days-before-stale'))
    const inputDaysBeforeDelete = Number(core.getInput('days-before-delete'))

    if (inputDaysBeforeStale >= inputDaysBeforeDelete) {
      throw new Error('days-before-stale cannot be greater than or equal to days-before-delete')
    }

    if (inputDaysBeforeStale.toString() === 'NaN') {
      throw new Error('days-before-stale must be a number')
    }

    if (inputDaysBeforeDelete.toString() === 'NaN') {
      throw new Error('days-before-delete must be a number')
    }

    if (inputDaysBeforeStale < 0) {
      throw new Error('days-before-stale must be greater than zero')
    }

    //Validate compare-branches
    const inputCompareBranches = core.getInput('compare-branches')
    if (!(inputCompareBranches in CompareBranchesEnum)) {
      throw new Error(`compare-branches input of '${inputCompareBranches}' is not valid.`)
    }

    //Validate branches-filter-regex
    const branchesFilterRegex = String(core.getInput('branches-filter-regex'))
    if (branchesFilterRegex.length > 50) {
      throw new Error('branches-filter-regex must be 50 characters or less')
    }

    //Assign inputs
    result.daysBeforeStale = inputDaysBeforeStale
    result.daysBeforeDelete = inputDaysBeforeDelete
    result.compareBranches = inputCompareBranches
    result.branchesFilterRegex = branchesFilterRegex
  } catch (err: unknown) {
    if (err instanceof Error) {
      core.setFailed(`Failed to validate inputs. Error: ${err.message}`)
    } else {
      core.setFailed(`Failed to validate inputs.`)
    }
  }
  return result
}
