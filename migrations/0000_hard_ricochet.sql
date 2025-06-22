CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"details" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "audit_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "audit_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "audit_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_id" text NOT NULL,
	"title" text NOT NULL,
	"type_id" integer NOT NULL,
	"status_id" integer NOT NULL,
	"scope" text NOT NULL,
	"lead_auditor" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "audits_audit_id_unique" UNIQUE("audit_id")
);
--> statement-breakpoint
CREATE TABLE "capa_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "capa_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "capa_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "capa_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "capas" (
	"id" serial PRIMARY KEY NOT NULL,
	"capa_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type_id" integer NOT NULL,
	"status_id" integer NOT NULL,
	"root_cause" text,
	"corrective_action" text,
	"preventive_action" text,
	"initiated_by" integer NOT NULL,
	"assigned_to" integer,
	"due_date" timestamp,
	"closed_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "capas_capa_id_unique" UNIQUE("capa_id")
);
--> statement-breakpoint
CREATE TABLE "document_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" text NOT NULL,
	"comments" text,
	"signature_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "document_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	CONSTRAINT "document_types_name_unique" UNIQUE("name"),
	CONSTRAINT "document_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"document_id" text NOT NULL,
	"type_id" integer NOT NULL,
	"status_id" integer NOT NULL,
	"revision" text NOT NULL,
	"file_path" text,
	"created_by" integer NOT NULL,
	"approved_by" integer,
	"effective_date" timestamp,
	"expiration_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "documents_document_id_unique" UNIQUE("document_id")
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_id" integer NOT NULL,
	"finding_id" text NOT NULL,
	"description" text NOT NULL,
	"severity" text NOT NULL,
	"assigned_to" integer,
	"due_date" timestamp,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"risk_id" text NOT NULL,
	"title" text NOT NULL,
	"category_id" integer NOT NULL,
	"description" text NOT NULL,
	"initial_risk" json NOT NULL,
	"mitigation_plan" text,
	"residual_risk" json,
	"status" text NOT NULL,
	"owner_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "risk_assessments_risk_id_unique" UNIQUE("risk_id")
);
--> statement-breakpoint
CREATE TABLE "risk_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "risk_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "supplier_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "supplier_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "supplier_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "supplier_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"name" text NOT NULL,
	"category_id" integer NOT NULL,
	"status_id" integer NOT NULL,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"address" text,
	"qualification_date" timestamp,
	"requalification_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_supplier_id_unique" UNIQUE("supplier_id")
);
--> statement-breakpoint
CREATE TABLE "training_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type_id" integer NOT NULL,
	"version" text NOT NULL,
	"frequency" text,
	"duration_minutes" integer,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "training_modules_module_id_unique" UNIQUE("module_id")
);
--> statement-breakpoint
CREATE TABLE "training_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"status_id" integer NOT NULL,
	"assigned_date" timestamp NOT NULL,
	"completed_date" timestamp,
	"expiry_date" timestamp,
	"score" integer,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "training_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "training_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "training_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"department" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);