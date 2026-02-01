-- Add goal_deadline_year column to user_settings table
-- This column stores the target year for achieving the annual dividend goal
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS goal_deadline_year INTEGER;
