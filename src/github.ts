import * as core from '@actions/core'
import * as github from '@actions/github'

type WorkflowStatus =
  | 'queued'
  | 'completed'
  | 'in_progress'
  | 'action_required'
  | 'cancelled'
  | 'failure'
  | 'neutral'
  | 'success'
  | 'skipped'
  | 'stale'
  | 'timed_out'
  | 'requested'
  | 'waiting'
  | undefined

const getGithubWorkflows = async () => {
  const client = github.getOctokit(
    core.getInput('access_token', { required: true })
  )

  return Promise.all(
    ['queued', 'in_progress']
      .map((status) => <WorkflowStatus>status)
      .map((status) =>
        client.request(
          `GET /repos/{owner}/{repo}/actions/runs`, // See details: https://docs.github.com/en/rest/reference/actions#list-workflow-runs-for-a-repository
          { ...github.context.repo, status }
        )
      )
  )
}

const filterGithubWorkflows = async () => {
  const { payload, sha } = github.context
  let currentSHA = sha
  if (payload.pull_request) {
    currentSHA = payload.pull_request.head.sha
  } else if (payload.workflow_run) {
    currentSHA = payload.workflow_run.head_sha
  }

  const workflows = await getGithubWorkflows()
  const workflowsInput = core.getMultilineInput('workflows', {
    required: false,
  })
  core.info(JSON.stringify(workflowsInput))

  return workflows
    .flatMap((response) => response.data.workflow_runs)
    .filter(
      (run) =>
        run.id !== Number(process.env.GITHUB_RUN_ID) &&
        run.status !== 'completed' &&
        run.head_sha === currentSHA // only keep workflows running from the same SHA/branch
    )
    .filter((run) => {
      if (!run.name) {
        throw Error(`Workflow name not found for run ${JSON.stringify(run)}`)
      }
      if (workflowsInput.length > 0) {
        return workflowsInput.includes(run.name)
      }
      return workflowsInput.length === 0
    })
}

type GithubWorkflow = { name: string; status: string }

const logGithubWorkflows = (retries: number, workflows: GithubWorkflow[]) => {
  core.info(
    `Retry #${retries} - ${workflows.length} ${
      workflows.length > 1 ? 'workflows' : 'workflow'
    } in progress found. Please, wait until completion or consider cancelling these workflows manually:`
  )
  workflows.map((workflow: GithubWorkflow) => {
    core.info(`* ${workflow.name}: ${workflow.status}`)
  })
  core.info('')
}

export { filterGithubWorkflows, logGithubWorkflows, GithubWorkflow }
