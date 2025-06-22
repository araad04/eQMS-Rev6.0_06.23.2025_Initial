-- Create management_review_input_categories table
CREATE TABLE IF NOT EXISTS "management_review_input_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE,
  "description" text,
  "required" boolean DEFAULT true,
  "display_order" integer NOT NULL
);

-- Create management_review_action_item_changes table
CREATE TABLE IF NOT EXISTS "management_review_action_item_changes" (
  "id" serial PRIMARY KEY NOT NULL,
  "action_item_id" integer NOT NULL,
  "field_name" text NOT NULL,
  "old_value" text,
  "new_value" text NOT NULL,
  "changed_by" integer NOT NULL,
  "changed_at" timestamp DEFAULT now() NOT NULL
);

-- Create management_review_statuses table
CREATE TABLE IF NOT EXISTS "management_review_statuses" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE,
  "description" text
);

-- Create management_review_participants table if needed
CREATE TABLE IF NOT EXISTS "management_review_participants" (
  "id" serial PRIMARY KEY NOT NULL,
  "review_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "role" text NOT NULL,
  "attended" boolean DEFAULT false,
  "comments" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "management_review_action_item_changes"
ADD CONSTRAINT "management_review_action_item_changes_action_item_id_fkey"
FOREIGN KEY ("action_item_id") REFERENCES "management_review_action_items" ("id")
ON DELETE CASCADE;

ALTER TABLE "management_review_participants"
ADD CONSTRAINT "management_review_participants_review_id_fkey"
FOREIGN KEY ("review_id") REFERENCES "management_reviews" ("id")
ON DELETE CASCADE;

ALTER TABLE "management_review_participants"
ADD CONSTRAINT "management_review_participants_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users" ("id")
ON DELETE CASCADE;

-- Insert default management review statuses
INSERT INTO "management_review_statuses" ("name", "description")
VALUES 
  ('Scheduled', 'The management review meeting is scheduled but not started'),
  ('In Progress', 'The management review meeting is currently ongoing'),
  ('Completed', 'The management review meeting has been completed, action items may be pending'),
  ('Verified', 'All action items from the review have been verified')
ON CONFLICT (name) DO NOTHING;

-- Insert default management review input categories
INSERT INTO "management_review_input_categories" ("name", "description", "required", "display_order")
VALUES 
  ('Previous Management Review Actions', 'Status of actions from previous management reviews', true, 1),
  ('Process Performance', 'Assessment of how well processes are functioning', true, 2),
  ('Product Conformity', 'Information about how well products conform to requirements', true, 3),
  ('Audit Results', 'Results of internal and external audits', true, 4),
  ('Customer Feedback', 'Information received from customers about their experience', true, 5),
  ('CAPA Status', 'Status of corrective and preventive actions', true, 6),
  ('Changes Affecting QMS', 'Information about changes that may impact the quality management system', true, 7),
  ('Process Monitoring', 'Results from ongoing process monitoring activities', true, 8),
  ('Resource Needs', 'Assessment of resource requirements and availability', true, 9),
  ('Improvement Opportunities', 'Identified opportunities for QMS improvement', true, 10),
  ('Regulatory Updates', 'Information about updates to applicable regulations', true, 11),
  ('New or Revised Regulatory Requirements', 'Information about new or revised regulatory requirements', true, 12),
  ('Quality Objectives', 'Assessment of progress toward quality objectives', true, 13),
  ('Quality Policy', 'Review of the suitability of the quality policy', true, 14),
  ('Risk Management', 'Assessment of risk management activities and effectiveness', true, 15)
ON CONFLICT (name) DO NOTHING;