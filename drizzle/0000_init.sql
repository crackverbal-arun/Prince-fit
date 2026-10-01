CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`date` text NOT NULL,
	`marked_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_client_date` ON `attendance` (`client_id`,`date`);--> statement-breakpoint
CREATE TABLE `body_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real,
	`waist_cm` real,
	`chest_cm` real,
	`arm_cm` real,
	`photo` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `body_stats_client_idx` ON `body_stats` (`client_id`,`date`);--> statement-breakpoint
CREATE TABLE `meal_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`meal_plan_id` text NOT NULL,
	`date` text NOT NULL,
	`photo` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`meal_plan_id`) REFERENCES `meal_plan`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meal_logs_unique` ON `meal_logs` (`client_id`,`meal_plan_id`,`date`);--> statement-breakpoint
CREATE TABLE `meal_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`slot` text NOT NULL,
	`description` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `meal_plan_client_idx` ON `meal_plan` (`client_id`);--> statement-breakpoint
CREATE TABLE `packages` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`total_sessions` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`amount` integer NOT NULL,
	`paid` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `packages_client_idx` ON `packages` (`client_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`password_hash` text NOT NULL,
	`goal` text,
	`trainer_note` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE TABLE `workout_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`date` text NOT NULL,
	`exercise` text NOT NULL,
	`sets` integer NOT NULL,
	`reps` integer NOT NULL,
	`weight_kg` real DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_logs_unique` ON `workout_logs` (`client_id`,`date`,`exercise`);--> statement-breakpoint
CREATE TABLE `workout_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`day_of_week` integer NOT NULL,
	`exercise` text NOT NULL,
	`sets` integer NOT NULL,
	`reps` text NOT NULL,
	`target_kg` real,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_plan_client_idx` ON `workout_plan` (`client_id`,`day_of_week`);