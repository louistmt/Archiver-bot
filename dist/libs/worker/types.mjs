/**
 * Indicates the state of the job.
 */
export var JobState;
(function (JobState) {
    /**
     * The job can progress
     */
    JobState[JobState["OKAY"] = 0] = "OKAY";
    /**
     * The worker was shutdown and the current task
     * should exit
     */
    JobState[JobState["WORKER_SHUTDOWN"] = 1] = "WORKER_SHUTDOWN";
    /**
     * The job was canceled and should be discarded.
     */
    JobState[JobState["CANCELED"] = 2] = "CANCELED";
    /**
     * There was an error while handling the job but
     * can be recovered.
     */
    JobState[JobState["ERROR"] = 3] = "ERROR";
    /**
     * There was a fatal error while handling the job.
     * Recovery is no longer possible.
     */
    JobState[JobState["FATAL_ERROR"] = 4] = "FATAL_ERROR";
    /**
     * Give the job to the next task.
     */
    JobState[JobState["SKIP_TASK"] = 5] = "SKIP_TASK";
    /**
     * Give the job to the same task that handled it before.
     */
    JobState[JobState["REPEAT_TASK"] = 6] = "REPEAT_TASK";
})(JobState || (JobState = {}));
