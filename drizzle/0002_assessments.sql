CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`date` text NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assessments_client_idx` ON `assessments` (`client_id`,`date`);