-- Seed the two verified connectors. Both are free, keyless, public APIs.
-- See docs/SOURCES.md for the access review behind each entry.

insert into sources (
  id, name, homepage, access_method, enabled,
  request_delay_ms, max_requests_per_run, max_pages_per_run, retry_limit,
  collect_every_minutes, respect_robots, config,
  attribution_required, attribution_text, notes
) values
(
  'arbeitnow', 'Arbeitnow', 'https://www.arbeitnow.com', 'official_api', true,
  1500, 12, 10, 3, 360, false,
  '{"endpoint":"https://www.arbeitnow.com/api/job-board-api","variants":[{"key":"de","endpoint":"https://www.arbeitnow.com/api/job-board-api","country":"Germany"},{"key":"uk","endpoint":"https://www.arbeitnow.co.uk/api/job-board-api","country":"United Kingdom"}]}'::jsonb,
  true, 'Job data from Arbeitnow (arbeitnow.com)',
  'Documented free public job board API, no key required. Aggregates ATS feeds (Greenhouse, SmartRecruiters, Join, Teamtailor, Recruitee, Comeet). No salary field.'
),
(
  'greenhouse', 'Greenhouse Job Boards', 'https://boards.greenhouse.io', 'official_api', true,
  1000, 60, 60, 3, 720, false,
  '{"boards":[]}'::jsonb,
  false, null,
  'Official public Job Board API: GET boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true. One request returns a full board, and each board counts as one page, so max_pages_per_run must be >= the number of boards.'
)
on conflict (id) do nothing;
