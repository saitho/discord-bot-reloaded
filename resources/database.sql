CREATE TABLE IF NOT EXISTS scheduler_tasks (
    `id` VARCHAR(255) NOT NULL UNIQUE,
    `enabled` TINYINT(1) DEFAULT 0,
    `execution_time` VARCHAR(255),
    `execution_time_mode` VARCHAR(255),
    `worker_file` VARCHAR(255) NOT NULL,
    `data` TEXT NOT NULL,
    `labels` VARCHAR(255) NULL,
    `guild_id` VARCHAR(255) NULL,
    `target_channel_id` VARCHAR(255) NULL
)
