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
parentPort.postMessage('Original message: ' + JSON.parse(workerData.job.worker.workerData).message)
```

## API

### `Scheduler.getInstance()`

Use this method to interact with the scheduler.
It will make sure to return the same instance of the scheduler every time (singleton).

### `schedule`(task: Task)

Schedule a new Task object. This will add it to Bree scheduler and start it as well.

If a given task has already been scheduled, the old task will be unscheduled before the new task is scheduled.

### `unschedule`(taskId: string)

Remove a scheduled task (and all clones) by given id.

### `hasJobScheduled`(jobId: string): bool

Will return true if there are jobs with the given id.

### `start` / `stop`

Start/stop task scheduler.
