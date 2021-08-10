import {getLogger} from "log4js";
import {Task} from "./task";
import Bree from "bree";
import path from "path";

export class Scheduler {
    private static instance: Scheduler;

    protected workerDirectory: string = '';

    private bree = new Bree({ root: false });

    public static getInstance(): Scheduler {
        if (!Scheduler.instance) {
            Scheduler.instance = new Scheduler();
        }
        return Scheduler.instance;
    }

    public setWorkerDirectory(workerDirectory: string): this {
        this.workerDirectory = workerDirectory;
        return this;
    }

    public start(): void {
        this.bree.start();
    }

    public async stop() {
        await this.bree.stop();
    }

    public async unschedule(taskId: string) {
        for (const job of this.getAllJobs(taskId)) {
            await this.bree.remove(job.name);
        }
    }

    public async schedule(task: Task) {
        getLogger().debug('Scheduling task', task)

        if (this.hasJobScheduled(task.id)) {
            // remove old task before rescheduling it
            await this.unschedule(task.id);
        }

        const times = task.executionTime.split(';');
        for (const i in times) {
            const executionTime = times[i];
            const jobId = task.id + '_' + i;
            const job: any = {
                name: jobId,
                path: path.join(this.workerDirectory, task.workerFile),
                worker: { workerData: task.data ?? null }
            };
            if (task.executionTimeMode === "cron") {
                job.cron = executionTime;
            } else if (task.executionTimeMode === "interval") {
                job.interval = executionTime;
            }
            this.bree.add(job);
            this.bree.start(jobId);
        }
    }

    /**
     * @param id
     * @return JobOptions[]
     */
    protected getAllJobs(id: string): any[] {
        return Object.values(this.bree.config.jobs!).filter((j: any) => j.name.startsWith(id + '_'));
    }

    /**
     * @param id
     * @return boolean
     */
    public hasJobScheduled(id: string): boolean {
        return this.getAllJobs(id).length > 0;
    }
}
