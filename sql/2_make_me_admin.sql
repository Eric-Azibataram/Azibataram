-- Makes this login email an admin. If you log in with a different email, change it below.
insert into admins(user_id)
select id from auth.users where lower(email) = 'ericazibataram24@gmail.com'
on conflict do nothing;

-- Shows your accounts so you can check the email. The admins count below should be 1.
select email, created_at from auth.users order by created_at;
select count(*) as admins_count from admins;
