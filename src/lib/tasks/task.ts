export interface Task {
    id: string;
    executionTime: string;
    executionTimeMode: "cron"|"interval";
    workerFile: string;
    data: string;

    //enabled: boolean;
    //code: string;
    //guildId: string;
    //condition: string;
    //message: string;
    //channelId: string;
    //removeAfterExecution: boolean;
}
