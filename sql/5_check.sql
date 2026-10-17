-- Expected: functions_found = 15, admins = 1, policies = 3
select
 (select count(*) from pg_proc where proname in ('is_admin','admin_stats','admin_vendors','admin_set_verification','admin_flag','admin_suspend','admin_audit','admin_publish_policy','accept_policies','request_verification','admin_resolve_flag','admin_flags','admin_set_plan','track','log_admin')) as functions_found,
 (select count(*) from admins) as admins,
 (select count(*) from policies) as policies;
