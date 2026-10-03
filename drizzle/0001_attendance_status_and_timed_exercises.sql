ALTER TABLE `attendance` ADD `status` text DEFAULT 'present' NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance` ADD `reason` text;--> statement-breakpoint
ALTER TABLE `workout_logs` ADD `duration_sec` integer;--> statement-breakpoint
ALTER TABLE `workout_plan` ADD `metric` text DEFAULT 'weight' NOT NULL;--> statement-breakpoint
ALTER TABLE `workout_plan` ADD `target_sec` integer;