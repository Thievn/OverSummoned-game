-- One owned card: Poppy Rose, for the den owner's account only. Her set and gear are owned too, so the
-- catalog functions, row security and the guard triggers keep her off every other account.
-- Her art is loaded separately into os_owner_card.art (not kept in the repo).
do $s$
declare me uuid;
begin
  select id into me from auth.users where lower(email) = 'thievnsden@gmail.com';
  if me is null then raise exception 'Owner account not found. Nothing was added.'; end if;

  insert into public.os_hero_def(id, name, title, rarity, era, found, items, base, fx, short, owner_uid)
  values ('poppy_rose', 'Poppy Rose', 'Bubblegum Goth', 'unhinged', 'Modern day', false,
          array['poppy_choker','poppy_dress','poppy_platforms'],
          '{"atk":14,"def":10,"hp":120,"spd":16,"crit":10,"luck":6}'::jsonb, '{"first_double":1}'::jsonb, 'Poppy', me)
  on conflict (id) do update set name = excluded.name, title = excluded.title, rarity = excluded.rarity, era = excluded.era,
    items = excluded.items, base = excluded.base, fx = excluded.fx, short = excluded.short, owner_uid = excluded.owner_uid, found = false;

  insert into public.os_set(id, hero_id, name, bonus_name, bonus_text, stats, fx, owner_uid)
  values ('poppy_rose', 'poppy_rose', 'Sweetheart Requiem', 'Love Bites',
          'Her hits have a 20% chance to crack the enemy''s guard, lowering their Defense by 20 for 6 sec. +6 Crit Chance, +4 Speed.',
          '{"crit":6,"spd":4}'::jsonb, '{"shred":20}'::jsonb, me)
  on conflict (id) do update set hero_id = excluded.hero_id, name = excluded.name, bonus_name = excluded.bonus_name, bonus_text = excluded.bonus_text,
    stats = excluded.stats, fx = excluded.fx, owner_uid = excluded.owner_uid;

  insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed,
                                       stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon, owner_uid)
  values
   ('poppy_choker', 'Satin Bow Choker', 'epic', 'neck', 'poppy_rose', false, 60, 'pickup', true, null, 'Amulet', 0, 0, null, null, null,
    '{"crit":3,"luck":3,"hp":20}'::jsonb, '["Increases your chance to dodge an attack by 2%."]'::jsonb, '{"dodge":2}'::jsonb, null, 'poppy_rose', 1, null, null,
    'Black lace, a pink bow, and a look that says try it.', 'own/poppy_choker', me),
   ('poppy_dress', 'Bubblegum Requiem Dress', 'epic', 'chest', 'poppy_rose', false, 60, 'pickup', true, null, 'Cloth', 140, 0, null, null, null,
    '{"def":6,"hp":40,"spd":3}'::jsonb, '[]'::jsonb, '{}'::jsonb, null, 'poppy_rose', 1, null, null,
    'Hot-pink lace on black. It has survived three mosh pits and a wedding.', 'own/poppy_dress', me),
   ('poppy_platforms', 'Heartbuckle Platforms', 'epic', 'feet', 'poppy_rose', false, 60, 'pickup', true, null, 'Cloth', 90, 0, null, null, null,
    '{"spd":6,"def":3}'::jsonb, '[]'::jsonb, '{}'::jsonb, null, 'poppy_rose', 1, null, null,
    'Four inches of sole and two pink hearts. She still outruns everyone.', 'own/poppy_platforms', me),
   ('poppy_parasol', 'Heartlock Parasol', 'legendary', 'main', 'poppy_rose', false, 70, 'pickup', true, 'One-Hand', 'Polearm', 0, 0, 72, 108, 1.7,
    '{"atk":12,"crit":4,"spd":4}'::jsonb, '["Hits have a 5% chance to crack the enemy''s guard, lowering their Defense by 20 for 6 sec."]'::jsonb, '{"shred":5}'::jsonb, null, null, 1, null, null,
    'Lace on top, a steel point underneath. Rain is the least of your worries.', 'own/poppy_parasol', me),
   ('poppy_mirror', 'Heart Compact', 'rare', 'trinket', 'poppy_rose', false, 50, 'pickup', true, null, 'Trinket', 0, 0, null, null, null,
    '{"luck":6,"hp":20}'::jsonb, '["Potions heal 10% more."]'::jsonb, '{"potion_plus":10}'::jsonb, null, null, 1, null, null,
    'For checking her lipstick, and for checking who is behind her.', 'own/poppy_mirror', me)
  on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = false,
    ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block,
    dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx,
    set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = null, flavor = excluded.flavor, icon = excluded.icon, owner_uid = excluded.owner_uid;

  insert into public.os_owner_card(hero_id, owner_uid, card)
  values ('poppy_rose', me, jsonb_build_object(
    'perk', 'Her first strike in every fight hits twice.',
    'perkKey', 'first_double',
    'skill', 'Delve',
    'back', 'Heartbreaker',
    'backText', 'She opens every fight with two quick strikes before anyone else has moved.',
    'foot', 'First strike hits twice',
    'eraBg', 'era_modern',
    'bio', 'She was halfway through a candy-shop window display, arguing with a mannequin about bows, when the Circle took her. She kept the bows.'))
  on conflict (hero_id) do update set owner_uid = excluded.owner_uid, card = excluded.card, updated_at = now();
end $s$;
