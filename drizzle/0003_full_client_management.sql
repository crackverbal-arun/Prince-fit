CREATE TABLE `food_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`date` text NOT NULL,
	`meal` text NOT NULL,
	`food_id` text,
	`name` text NOT NULL,
	`grams` real,
	`servings` real,
	`nutrients` text NOT NULL,
	`logged_by` text DEFAULT 'client' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `food_logs_client_idx` ON `food_logs` (`client_id`,`date`);--> statement-breakpoint
CREATE TABLE `foods` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`serving_label` text NOT NULL,
	`serving_g` real NOT NULL,
	`per100` text NOT NULL,
	`built_in` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`session_id` text,
	`kind` text NOT NULL,
	`channel` text NOT NULL,
	`status` text NOT NULL,
	`body` text NOT NULL,
	`error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `notifications_session_idx` ON `notifications` (`session_id`);--> statement-breakpoint
CREATE TABLE `progress_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`date` text NOT NULL,
	`pose` text DEFAULT 'front' NOT NULL,
	`photo` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `progress_photos_client_idx` ON `progress_photos` (`client_id`,`date`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`duration_min` integer DEFAULT 60 NOT NULL,
	`title` text,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`notes` text,
	`series_id` text,
	`reminder_sent_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_date_idx` ON `sessions` (`date`,`start_time`);--> statement-breakpoint
CREATE INDEX `sessions_client_idx` ON `sessions` (`client_id`,`date`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `water_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`date` text NOT NULL,
	`ml` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `water_logs_client_idx` ON `water_logs` (`client_id`,`date`);--> statement-breakpoint
ALTER TABLE `assessments` ADD `fields` text;--> statement-breakpoint
ALTER TABLE `body_stats` ADD `hips_cm` real;--> statement-breakpoint
ALTER TABLE `body_stats` ADD `thigh_cm` real;--> statement-breakpoint
ALTER TABLE `body_stats` ADD `calf_cm` real;--> statement-breakpoint
ALTER TABLE `body_stats` ADD `neck_cm` real;--> statement-breakpoint
ALTER TABLE `body_stats` ADD `body_fat` real;--> statement-breakpoint
ALTER TABLE `body_stats` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `users` ADD `targets` text;--> statement-breakpoint
ALTER TABLE `users` ADD `assessment_template` text;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `kind` text;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `sets_detail` text;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `distance_km` real;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `calories` integer;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `avg_hr` integer;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `logged_by` text;--> statement-breakpoint
ALTER TABLE `workout_plan` ADD `target_km` real;