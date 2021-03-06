export interface Task {
    id: string;
    executionTime: string;
    executionTimeMode: "cron"|"interval";
    workerFile: string;
    data: string;
    enabled: boolean;
    executeImmediately?: boolean;
    /**
     * @var string[] user defined labels for identifying tasks
     */
    labels?: string[];
    guildId?: string|null;
    targetChannelId?: string|null;
}

export function createTaskFromDatabaseRow(data: any): Task {
    return {
        id: data.id,
        executionTime: data.execution_time,
        executionTimeMode: data.execution_time_mode,
        workerFile: data.worker_file,
        labels: data.labels ? JSON.parse(data.labels) : [],
        guildId: data.guild_id,
        targetChannelId: data.target_channel_id,
        data: data.data,
        enabled: data.enabled === 1,
    };
}
