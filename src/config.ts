import * as core from '@actions/core'

const oneSecond = 1000

enum ActionStatus {
  WORKFLOWS_AWAITED_OK = 'workflows_awaited_ok',
  TIMEOUT_EXCEEDED = 'action_timeout_exceeded',
}

const config = () => {
  const config = {
    timeout: parseInt(core.getInput('timeout')),
    interval: parseInt(core.getInput('interval')),
    initial_delay: parseInt(core.getInput('initial_delay')),
  }

  const info = [
    `Action configuration:`,
    `${config.initial_delay}s initial delay,`,
    `${config.interval}s interval,`,
    `${config.timeout}s timeout`,
  ]
  core.info(info.join(' '))
  core.info('')

  return config
}

export { oneSecond, ActionStatus, config }
