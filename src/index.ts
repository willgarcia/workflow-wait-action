import * as core from '@actions/core'
import { config } from './config'
import { logGithubWorkflows } from './github'
import { delay, poll } from './time'

async function main() {
  const { initial_delay, timeout, interval } = config()
  await delay(initial_delay)
  await poll({ timeout, interval }, logGithubWorkflows)
}

main()
  .then(() => core.info('👌 Previous Github workflows completed. Resuming...'))
  .catch((e) => core.setFailed(e.message))
