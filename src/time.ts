import * as core from "@actions/core";
import { oneSecond, ActionStatus } from "./config";
import { filterGithubWorkflows } from "./github";

const wait = async (ms: number): Promise<string> => {
  const promise = (resolve: (message: string) => void) =>
    setTimeout(() => resolve(`waited ${ms}ms`), ms);
  return new Promise(promise);
};

const delay = (interval: number) => wait(interval * oneSecond);

const poll = async (options: {
  timeout: number;
  interval: number;
}): Promise<string> => {
  let now = new Date().getTime();
  const end = now + options.timeout * oneSecond;

  let retries = 1;
  while (now <= end) {
    const workflows = await filterGithubWorkflows();

    if (workflows.length === 0) {
      return ActionStatus.WORKFLOWS_AWAITED_OK;
    }
    core.info(
      `Retry #${retries} - ${workflows.length} ${
        workflows.length > 1 ? "workflows" : "workflow"
      } in progress found. Please, wait until completion or consider cancelling these workflows manually:`
    );
    workflows.map((workflow) => {
      core.info(`* ${workflow.name}: ${workflow.status}`);
    });
    core.info("");

    await delay(options.interval);
    now = new Date().getTime();
    retries++;
  }

  core.error(
    `😿 Timeout exceeded (${options.timeout} seconds). Consider increasing the value of "timeout"`
  );
  return ActionStatus.TIMEOUT_EXCEEDED;
};

export { poll, delay };
