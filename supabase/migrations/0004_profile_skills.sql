-- CV Trail — adds a structured skills field to profile, in the same style
-- as the existing `links` jsonb column, for the LaTeX resume's Additional
-- Information section. Expected shape (all keys optional):
-- {
--   "Programming": ["Python", "SQL", "R"],
--   "Statistical Methods": ["A/B Testing", "Regression"],
--   "Data & Visualization": ["Looker", "Tableau"],
--   "Tools": ["Figma", "Salesforce"]
-- }

alter table profile
  add column if not exists skills jsonb not null default '{}'::jsonb;
