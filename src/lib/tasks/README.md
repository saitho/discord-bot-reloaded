# lib/tasks

The task scheduler utility is powered by [Bree](https://github.com/breejs/bree) and
allows executing arbitrary tasks regularly.

Each task execution will trigger a worker class that will to the actual work.
In the example below, the worker at `./workers/test.js` will be run every 2 and 10 seconds.

Note that you can define multiple execution times separated by `;`.
This is true for both interval and cron notations.

Internally this will create multiple entries for Bree (e.g. `mytask_0`, `mytask_1`).
However interacting with methods from the Scheduler class will ensure all related entries
are created or removed.

## Usage

```typescript
// Initialize scheduler
Scheduler.getInstance()
    .setWorkerDirectory(path.resolve(__dirname, 'workers'))
    .start();

// Task will run every 2 seconds and every 10 seconds
await Scheduler.getInstance().schedule({
    id: "mytask",
    enabled: true,
    executionTime: "every 10 seconds;every 2 seconds",
    executionTimeMode: "interval", // or "cron"
    workerFile: 'test.js', // worker file at ./workers/test.js
    data: JSON.stringify({ message: 'Hello World!' })
});
```

./workers/test.js
```typescript
const {parentPort, workerData} = require("worker_threads");

// this will post "Original message: Hello World!" to the parent process
const jobWorkerData = workerData.job.worker.workerData;
parentPort.postMessage('Original message: ' + JSON.parse(jobWorkerData.data).message)

// if the job was scheduled for a specific guild or target server,
// the information will be available in `jobWorkerData.guild_id` and `jobWorkerData.target_channel_id`
```

## API

### `Scheduler.getInstance()`

Use this method to interact with the scheduler.
It will make sure to return the same instance of the scheduler every time (singleton).

### `scheduleTask`(task: Task)

Schedule a new Task object. This will add it to Bree scheduler and start it as well.

If a given task has already been scheduled, the old task will be unscheduled before the new task is scheduled.

### `unscheduleTask`(taskId: string)

Remove a scheduled task (and all clones) by given id.

### `pauseTask`(taskId: string)

Remove a task from schedule. Task will be disabled in database.

### `unpauseTask`(taskId: string)

Re-enables a task in database and schedule it. If the task is not in database, an error will be thrown.

### `hasJobScheduled`(jobId: string): bool

Will return true if there are jobs with the given id.

### `start` / `stop`

Start/stop task scheduler.

## Task worker messaging

### Disable tasks

Workers can disable their task by sending a `ACTION_DISABLE_TASK` message to the parent.
Disabling a task will remove them from schedule and mark them as disabled in database.

```typescript
const {parentPort} = require("worker_threads");
const {ACTION_DISABLE_TASK} = require("./lib/tasks/scheduler");
parentPort.postMessage(ACTION_DISABLE_TASK);
```

### Task schedule termination / One-Time tasks

Workers can remove their task from the schedule and the database by sending a `ACTION_REMOVE_TASK` message to the parent:

```typescript
const {parentPort} = require("worker_threads");
const {ACTION_REMOVE_TASK} = require("./lib/tasks/scheduler");
parentPort.postMessage(ACTION_REMOVE_TASK);
```

This can be used to terminate a scheduled task after it finished, effectively resulting in a task that is only executed once.
