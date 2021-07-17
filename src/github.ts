import * as core from "@actions/core";
import * as github from "@actions/github";

const getGithubWorkflows = async () => {
  const client = github.getOctokit(
    core.getInput("access_token", { required: true })
  );

  return client.request(
    `GET /repos/{owner}/{repo}/actions/runs`, // See details: https://docs.github.com/en/rest/reference/actions#list-workflow-runs-for-a-repository
    github.context.repo
  );
};

const filterGithubWorkflows = async () => {
  const { payload, sha } = github.context;
  let currentSHA = sha;
  if (payload.pull_request) {
    currentSHA = payload.pull_request.head.sha;
  } else if (payload.workflow_run) {
    currentSHA = payload.workflow_run.head_sha;
  }

  return (await getGithubWorkflows()).data.workflow_runs.filter(
    (run) =>
      run.id !== Number(process.env.GITHUB_RUN_ID) &&
      run.status !== "completed" &&
      run.head_sha === currentSHA // only keep workflows running from the same SHA/branch
  );
};

export { filterGithubWorkflows };
