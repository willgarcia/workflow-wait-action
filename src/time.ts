import * as core from '@actions/core'
import { oneSecond, ActionStatus } from './config'
import { filterGithubWorkflows, GithubWorkflow } from './github'

const wait = async (ms: number): Promise<string> => {
  const promise = (resolve: (message: string) => void) =>
    setTimeout(() => resolve(`waited ${ms}ms`), ms)
  return new Promise(promise)
}

const delay = (interval: number) => wait(interval * oneSecond)

const poll = async (
  options: {
    timeout: number
    interval: number
  },
  log: (retries: number, workflows: GithubWorkflow[]) => void
): Promise<string> => {
  let now = new Date().getTime()
  const end = now + options.timeout * oneSecond

  let retries = 1
  while (now <= end) {
    const workflows = await filterGithubWorkflows()
    if (workflows.length === 0) {
      return ActionStatus.WORKFLOWS_AWAITED_OK
    }
    log(retries, workflows as GithubWorkflow[])

    await delay(options.interval)
    now = new Date().getTime()
    retries++
  }

  core.error(
    `😿 Timeout exceeded (${options.timeout} seconds). Consider increasing the value of "timeout"`
  )
  return ActionStatus.TIMEOUT_EXCEEDED
}

export { poll, delay }
