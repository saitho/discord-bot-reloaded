CREATE TABLE IF NOT EXISTS scheduler_tasks (
    `id` VARCHAR(255) NOT NULL UNIQUE,
    `execution_time` VARCHAR(255),
    `execution_time_mode` VARCHAR(255),
    `worker_file` VARCHAR(255) NOT NULL,
    `data` TEXT NOT NULL,
    `enabled` TINYINT(1) DEFAULT 0
)
