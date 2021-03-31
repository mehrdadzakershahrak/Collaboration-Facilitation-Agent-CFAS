USE `EXP`;

LOCK TABLES `player_templates` WRITE;

INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (51,6,30,35,10,30,'A','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (52,6,15,10,70,5,'B','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (53,6,45,50,20,0,'C','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (54,6,10,5,0,65,'D','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (55,6,35,35,10,0,'Shelter','1', '35', '35', '10', '0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (56,6,50,50,10,5,'Distribution Center','1', '50', '50', '10', '5');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (57,6,10,10,80,0,'Hospital','1', '10', '10', '80', '0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (58,6,5,5,0,95,'Bridge','1', '5', '5', '0', '95');
UNLOCK TABLES;
