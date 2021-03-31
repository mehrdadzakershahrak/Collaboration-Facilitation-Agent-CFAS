USE `EXP`;

LOCK TABLES `player_templates` WRITE;
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (43,5,40,25,5,60,'A','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (44,5,5,20,15,5,'B','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (45,5,40,50,80,0,'C','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (46,5,15,5,0,35,'D','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (47,5,40,40,5,0,'Shelter','1', '40-42', '38-40', '5-7', '0-1');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (48,5,50,50,5,5,'Distribution Center','1', '48-50', '48-50', '5-7', '3-5');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (49,5,5,5,90,0,'Hospital','1', '5-10', '3-5', '88-90', '0-2');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (50,5,5,5,0,95,'Bridge','1', '3-5', '5-7', '0-2', '93-95');

UNLOCK TABLES;
