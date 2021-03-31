CREATE DATABASE  IF NOT EXISTS `EXP` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `EXP`;
-- MySQL dump 10.13  Distrib 5.7.31, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: EXP
-- ------------------------------------------------------
-- Server version	5.7.31-0ubuntu0.18.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `key_tokens`
--

DROP TABLE IF EXISTS `key_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `key_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_key` varchar(45) NOT NULL,
  `lobby_code` varchar(45) NOT NULL,
  `player_code` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_UNIQUE` (`user_key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `key_tokens`
--

LOCK TABLES `key_tokens` WRITE;
/*!40000 ALTER TABLE `key_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `key_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lobby`
--

LOCK TABLES `lobby` WRITE;
DROP TABLE IF EXISTS `lobby`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lobby` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` VARCHAR(100) NOT NULL,
  `gametime` int(25),
  `template_id` int(11) NOT NULL,
  `n_trades` int(11) NOT NULL DEFAULT '25',
  `start_time` int(11) DEFAULT '0',
  `max_duration` int(11) DEFAULT '500'
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lobby`
--
/*!40000 ALTER TABLE `lobby` DISABLE KEYS */;
/*!40000 ALTER TABLE `lobby` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_templates`
--

DROP TABLE IF EXISTS `player_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `player_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) NOT NULL,
  `food` int(11) NOT NULL,
  `water` int(11) NOT NULL,
  `medicine` int(11) NOT NULL,
  `supply` int(11) NOT NULL,
  `name` varchar(45) NOT NULL,
  `dest_need` varchar(45) NOT NULL,
  `food_range` varchar(100),
  `water_range` varchar(100),
  `medicine_range` varchar(100),
  `supply_range` varchar(100),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_templates`
--

LOCK TABLES `player_templates` WRITE;
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (8,1,20,25,40,10,'A','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (9,1,30,40,15,15,'B','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (10,1,20,15,20,40,'C','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (12,1,25,15,25,35,'D','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (13,1,40,40,5,0,'Shelter','1', '40-42', '38-40', '5-7', '0-1');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (14,1,50,50,5,5,'Distribution Center','1', '48-50', '48-50', '5-7', '3-5');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (15,1,5,5,90,0,'Hospital','1', '5-10', '3-5', '88-90', '0-2');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (16,1,5,5,0,95,'Bridge','1', '3-5', '5-7', '0-2', '93-95');


INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (18,2,15,30,40,10,'A','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (19,2,30,25,15,0,'B','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (21,2,25,15,15,55,'C','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (22,2,30,30,30,35,'D','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (23,2,40,40,5,0,'Shelter','1', '40-50', '30-40', '0-15', '0-10');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (24,2,50,50,5,5,'Distribution Center','1', '40-50', '40-50', '5-15', '0-10');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (25,2,5,5,90,0,'Hospital','1', '5-10', '0-10', '80-90', '0-10');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (26,2,5,5,0,95,'Bridge','1', '0-5', '5-10', '0-5', '85-95');


INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (27,3,25,25,25,20,'A','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (28,3,20,25,20,20,'B','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (29,3,25,20,30,30,'C','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (30,3,30,30,25,30,'D','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (31,3,40,40,5,0,'Shelter','1', '35-45', '35-45', '5-10', '0-10');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (32,3,50,50,5,5,'Distribution Center','1', '40-50', '40-50', '5-15', '0-10');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (33,3,5,5,90,0,'Hospital','1', '5-10', '5-15', '85-95', '0-10');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (34,3,5,5,0,95,'Bridge','1', '5-15', '5-15', '0-10', '85-95');

INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (35,4,20,30,30,30,'A','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (36,4,20,25,25,15,'B','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`) VALUES (37,4,25,20,20,30,'C','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need` ) VALUES (38,4,30,20,20,20,'D','0');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (39,4,35,40,5,0,'Shelter','1', '25-35', '40-50', '0-10', '0-10');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (40,4,40,50,5,5,'Distribution Center','1', '40-50', '50-60', '0-10', '0-10');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (41,4,20,5,90,0,'Hospital','1', '5-10', '5-15', '80-90', '0-10');
INSERT INTO `player_templates` (`id`,`template_id`,`food`,`water`,`medicine`,`supply`,`name`,`dest_need`, `food_range`,`water_range`,`medicine_range`,`supply_range`) VALUES (42,4,5,5,0,95,'Bridge','1', '5-15', '5-15', '0-10', '85-95');
UNLOCK TABLES;
--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `players` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `active` int(11) DEFAULT '0',
  `food` int(11) DEFAULT '0',
  `water` int(11) DEFAULT '0',
  `medicine` int(11) DEFAULT '0',
  `supply` int(11) DEFAULT '0',
  `lobby` int(11) DEFAULT '0',
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `players`
--

LOCK TABLES `players` WRITE;
/*!40000 ALTER TABLE `players` DISABLE KEYS */;
/*!40000 ALTER TABLE `players` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trade`
--

DROP TABLE IF EXISTS `trade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `trade` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` VARCHAR(100) NOT NULL,
  `time` int(11) NOT NULL,
  `src_player` int(11) NOT NULL,
  `src_player_uid` VARCHAR(128) NOT NULL,
  `dst_player` int(11),
  `dst_player_uid` VARCHAR(128),
  `offered_resource` varchar(45) NOT NULL,
  `offered_amount` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `goals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` VARCHAR(100) NOT NULL,
  `time` int(11) NOT NULL,
  `src_player` int(11) NOT NULL,
  `src_player_uid` VARCHAR(128) NOT NULL,
  `goal` varchar(512) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `trade`
--

LOCK TABLES `trade` WRITE;
/*!40000 ALTER TABLE `trade` DISABLE KEYS */;
/*!40000 ALTER TABLE `trade` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-10-06 13:15:05
