create unique index if not exists cultural_calendar_unique_recurring_event
on public.cultural_calendar (month, day, title);

insert into public.cultural_calendar (month, day, title, title_chinese, region, kind, brief_context, recurs_yearly)
values
  (1, 1, 'Western New Year in Chinese-speaking societies', '元旦', 'shared', 'holiday', 'January 1 is observed as Western New Year and provides a bridge between global and Chinese-language celebrations.', true),
  (2, 28, '228 Peace Memorial Day', '二二八和平纪念日', 'taiwan', 'anniversary', 'February 28 commemorates the 228 Incident and is a major historical remembrance date in Taiwan.', true),
  (4, 4, 'Tomb Sweeping Day', '清明节', 'shared', 'festival', 'Qingming is associated with honoring ancestors, grave sweeping, and spring seasonal traditions.', true),
  (10, 10, 'Double Tenth Day', '双十节', 'taiwan', 'holiday', 'October 10 marks the Wuchang Uprising anniversary and Taiwan''s National Day.', true),
  (12, 13, 'Nanjing Massacre Memorial Day', '南京大屠杀死难者国家公祭日', 'china', 'anniversary', 'December 13 is a national memorial day in China commemorating the Nanjing Massacre victims.', true),
  (12, 25, 'Constitution Day Legacy', '行宪纪念日', 'taiwan', 'anniversary', 'December 25 remains significant in Taiwan as the date the ROC Constitution took effect.', true)
on conflict (month, day, title) do update
set
  title_chinese = excluded.title_chinese,
  region = excluded.region,
  kind = excluded.kind,
  brief_context = excluded.brief_context,
  recurs_yearly = excluded.recurs_yearly;
