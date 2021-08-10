export interface Task {
    id: string;
    executionTime: string;
    executionTimeMode: "cron"|"interval";
    workerFile: string;
    data: string;
    enabled: boolean;
    /**
     * @var string[] user defined labels for identifying tasks
     */
    labels?: string[];

    //code: string;
    //guildId: string;
    //condition: string;
    //message: string;
    //channelId: string;
    //removeAfterExecution: boolean;
}

export function createTaskFromDatabaseRow(data: any): Task {
    return {
        id: data.id,
        executionTime: data.execution_time,
        executionTimeMode: data.execution_time_mode,
        workerFile: data.worker_file,
        data: data.data,
        enabled: data.enabled === 1,
    };
}
