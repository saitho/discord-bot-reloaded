import {getLogger} from "log4js";
import {createTaskFromDatabaseRow, Task} from "./task";
import Bree from "bree";
import path from "path";
import db from "../database/database";

export const ACTION_DISABLE_TASK = 'disable_task';
export const ACTION_REMOVE_TASK = 'remove_task';

export class Scheduler {
    private static instance: Scheduler;

    protected workerDirectory: string = '';

    private bree = new Bree({ root: false, workerMessageHandler: async (response) => {
        const originalName = response.name.replace(/(.*)_\d+/, `$1`);
        if (response.message === ACTION_DISABLE_TASK) {
            await this.pauseTask(originalName)
        } else if (response.message === ACTION_REMOVE_TASK) {
            await this.unscheduleTask(originalName);
        }
    } });

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

    public async unpauseTask(taskId: string, persist = true) {
        // Look for task in database
        const row = db.prepare('SELECT * FROM scheduler_tasks WHERE id = ?').get(taskId);
        if (row === undefined) {
            getLogger().error('Unable to locate task with ID ' + taskId + ' in database.');
            return null;
        }
        const task = createTaskFromDatabaseRow(row);
        await this.scheduleTask(task, false);
        if (persist) {
            const stmt = db.prepare("UPDATE scheduler_tasks SET enabled = 1 WHERE id = ?");
            stmt.run([taskId]);
        }
    }

    public async pauseTask(taskId: string, persist = true) {
        await this.unscheduleTask(taskId, false);
        if (persist) {
            const stmt = db.prepare("UPDATE scheduler_tasks SET enabled = 0 WHERE id = ?");
            stmt.run([taskId]);
        }
    }

    public async unscheduleTask(taskId: string, persist = true) {
        for (const job of this.getAllJobs(taskId)) {
            await this.bree.remove(job.name);
        }
        if (persist) {
            const stmt = db.prepare("DELETE FROM scheduler_tasks WHERE id = ?");
            stmt.run([taskId]);
        }
    }

    public async scheduleTask(task: Task, persist = true): Promise<boolean> {
        getLogger().debug('Scheduling task', task)

        if (this.hasJobScheduled(task.id)) {
            // remove old task before rescheduling it
            await this.unscheduleTask(task.id, persist);
        }

        if (persist) {
            // Ensure task was removed before creating a new one in case of rescheduling
            db.prepare('DELETE FROM scheduler_tasks WHERE id = ?').run(task.id);

            const insert = db.prepare("INSERT INTO scheduler_tasks (id, execution_time, execution_time_mode, worker_file, data, enabled, labels, guild_id, target_channel_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            insert.run(
                task.id,
                task.executionTime,
                task.executionTimeMode,
                task.workerFile,
                task.data,
                Number(task.enabled),
                JSON.stringify(task.labels),
                task.guildId,
                task.targetChannelId
            );
        }

        if (!task.enabled) {
            return true;
        }

        const times = task.executionTime.split(';');
        for (const i in times) {
            const executionTime = times[i];
            const jobId = task.id + '_' + i;
            const job: any = {
                name: jobId,
                path: path.join(this.workerDirectory, task.workerFile),
                worker: { workerData: {
                    data: task.data ?? null,
                    guild_id: task.guildId,
                    target_channel_id: task.targetChannelId,
                }}
            };
            if (task.executionTimeMode === "cron") {
                job.cron = executionTime;
            } else if (task.executionTimeMode === "interval") {
                job.interval = executionTime;
            }
            this.bree.add(job);
            this.bree.start(jobId);
        }
        if (task.executeImmediately) {
            this.bree.run(task.id + '_' + 0);
        }
        return true;
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

    /**
     * @param id
     * @return boolean
     */
    public hasJobPersisted(id: string): boolean {
        const row = db.prepare('SELECT * FROM scheduler_tasks WHERE id = ?').get(id);
        return row !== undefined;
    }

    /**
     * @param id
     * @return Task|null
     */
    public getPersistedTask(id: string): Task|null {
        const row = db.prepare('SELECT * FROM scheduler_tasks WHERE id = ?').get(id);
        if (row === undefined) {
            return null;
        }
        return createTaskFromDatabaseRow(row);
    }

    /**
     * @param guildId
     * @param targetChannelId
     * @param groups
     * @return Task|null
     */
    public findPersistedTaskByChannel(guildId: string, targetChannelId: string, groups: string[] = []): Task|null {
        const row = db.prepare('SELECT * FROM scheduler_tasks WHERE guild_id = ? AND target_channel_id = ?').get(guildId, targetChannelId)
        if (!row) {
            return null;
        }
        const task = createTaskFromDatabaseRow(row);

        if (groups.length && (!task.labels || groups.every(val => task.labels!.includes(val)))) {
            return null;
        }
        return task;
    }
}
