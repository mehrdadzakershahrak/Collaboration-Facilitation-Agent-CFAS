use EXP;
ALTER TABLE player_templates ADD route_orders VARCHAR(100) NOT NULL;

UPDATE player_templates SET route_orders = '[0, 0, 0, 0]' where template_id = 1;
UPDATE player_templates SET route_orders = '[1, 2, 3, 4]' where template_id = 2;
UPDATE player_templates SET route_orders = '[1, 2, 3, 4]' where template_id = 3;
UPDATE player_templates SET route_orders = '[5, 6, 7, 8]' where template_id = 4;
UPDATE player_templates SET route_orders = '[0, 0, 0, 0]' where template_id = 5;
UPDATE player_templates SET route_orders = '[0, 0, 0, 0]' where template_id = 6;