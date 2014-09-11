-- MySQL dump 10.13  Distrib 5.1.51, for pc-linux-gnu (i686)
--
-- Host: 127.0.0.1    Database: world
-- ------------------------------------------------------
-- Server version	5.1.51-debug-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES latin1 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
-- begin;
--
-- Table structure for table `City`
--

DROP TABLE IF EXISTS `City`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `City` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Name` char(35) NOT NULL DEFAULT '',
  `CountryCode` char(3) NOT NULL DEFAULT '',
  `District` char(20) NOT NULL DEFAULT '',
  `Population` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  KEY `CountryCode` (`CountryCode`),
  CONSTRAINT `city_ibfk_1` FOREIGN KEY (`CountryCode`) REFERENCES `Country` (`Code`)
) ENGINE=InnoDB AUTO_INCREMENT=4080 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `City`
--
-- ORDER BY:  `ID`

INSERT INTO `City` VALUES (1,'Kabul','AFG','Kabol',1780000);
INSERT INTO `City` VALUES (2,'Qandahar','AFG','Qandahar',237500);
INSERT INTO `City` VALUES (3,'Herat','AFG','Herat',186800);
INSERT INTO `City` VALUES (4,'Mazar-e-Sharif','AFG','Balkh',127800);
INSERT INTO `City` VALUES (5,'Amsterdam','NLD','Noord-Holland',731200);
INSERT INTO `City` VALUES (6,'Rotterdam','NLD','Zuid-Holland',593321);
INSERT INTO `City` VALUES (7,'Haag','NLD','Zuid-Holland',440900);
INSERT INTO `City` VALUES (8,'Utrecht','NLD','Utrecht',234323);
INSERT INTO `City` VALUES (9,'Eindhoven','NLD','Noord-Brabant',201843);
INSERT INTO `City` VALUES (10,'Tilburg','NLD','Noord-Brabant',193238);
INSERT INTO `City` VALUES (11,'Groningen','NLD','Groningen',172701);
INSERT INTO `City` VALUES (12,'Breda','NLD','Noord-Brabant',160398);
INSERT INTO `City` VALUES (13,'Apeldoorn','NLD','Gelderland',153491);
INSERT INTO `City` VALUES (14,'Nijmegen','NLD','Gelderland',152463);
INSERT INTO `City` VALUES (15,'Enschede','NLD','Overijssel',149544);
INSERT INTO `City` VALUES (16,'Haarlem','NLD','Noord-Holland',148772);
INSERT INTO `City` VALUES (17,'Almere','NLD','Flevoland',142465);


CREATE TABLE "Dates" (
  `Date`        DATE          NULL,
  "DateTime"    DATETIME('%Y/%m/%d %H:%M:%f') NULL,
  "Time"        TIME          NULL,
  "Timestamp4"  TIMESTAMP(4)  NULL,
  "Timestamp6"  TIMESTAMP(6)  NULL,
  "Timestamp8"  TIMESTAMP(8)  NULL,
  "Timestamp10" TIMESTAMP(10) NULL,
  "Timestamp12" TIMESTAMP(12) NULL,
  "Timestamp14" TIMESTAMP(14) NULL,
  "Timestamp"   TIMESTAMP     NULL,
  "Year"        YEAR          NULL
);

INSERT INTO `Dates` VALUES (
	143856643067, 
	143856643067,
	143856643067,
	143856643067,
	143856643067,
	143856643067,
	143856643067,
	143856643067,
	143856643067,
	143856643067,
	143856643067
);
INSERT INTO `Dates` VALUES (
	'Wed Jul 24 1974 02:10:43.067', -- invalid format
	'1974-24-07T02:10:43.067',      -- ISO-8601
	'Wed Jul 24 1974 02:10:43',     -- rfc2822
	'Wed Jul 24 1974 02:10:43',
	'Wed Jul 24 1974 02:10:43',
	'Wed Jul 24 1974 02:10:43',
	'Wed Jul 24 1974 02:10:43',
	'Wed Jul 24 1974 02:10:43',
	'Wed Jul 24 1974 02:10:43',
	'Wed Jul 24 1974 02:10:43',
	'Wed Jul 24 1974 02:10:43'
);
INSERT INTO `Dates` VALUES (
	'1974-07-24 02:10:43.067',  -- ISO-8601
	'1974-07-24 02:10:43.067',
	'1974-07-24 02:10:43.067',
	'1974-07-24 02:10:43.067',
	'1974-07-24 02:10:43.067',
	'1974-07-24 02:10:43.067',
	'1974-07-24 02:10:43.067',
	'1974-07-24 02:10:43.067',
	'1974-07-24 02:10:43.067',
	'1974-07-24 02:10:43.067',
	'1974-07-24 02:10:43.067'
);
INSERT INTO `Dates` VALUES (
	'NOW', 
	'NOW',
	'NOW',
	'NOW',
	'NOW',
	'NOW',
	'NOW',
	'NOW',
	'NOW',
	'NOW',
	'NOW'
);

INSERT INTO `Dates` VALUES (
	NULL, 
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL
);

-- commit;
