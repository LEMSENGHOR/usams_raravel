-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: university_attendance
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `academic_years`
--

DROP TABLE IF EXISTS `academic_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_years` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `academic_years_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_years`
--

LOCK TABLES `academic_years` WRITE;
/*!40000 ALTER TABLE `academic_years` DISABLE KEYS */;
INSERT INTO `academic_years` VALUES (1,'2026-2027','2026-11-12','2027-08-12',1,'2026-11-11 18:17:28','2026-11-11 18:20:27');
/*!40000 ALTER TABLE `academic_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_audit_logs`
--

DROP TABLE IF EXISTS `attendance_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `attendance_record_id` bigint unsigned NOT NULL,
  `attendance_session_id` bigint unsigned NOT NULL,
  `actor_id` bigint unsigned NOT NULL,
  `old_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `attendance_audit_logs_attendance_record_id_foreign` (`attendance_record_id`),
  KEY `attendance_audit_logs_actor_id_foreign` (`actor_id`),
  KEY `attendance_audit_logs_attendance_session_id_created_at_index` (`attendance_session_id`,`created_at`),
  CONSTRAINT `attendance_audit_logs_actor_id_foreign` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `attendance_audit_logs_attendance_record_id_foreign` FOREIGN KEY (`attendance_record_id`) REFERENCES `attendance_records` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `attendance_audit_logs_attendance_session_id_foreign` FOREIGN KEY (`attendance_session_id`) REFERENCES `attendance_sessions` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_audit_logs`
--

LOCK TABLES `attendance_audit_logs` WRITE;
/*!40000 ALTER TABLE `attendance_audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_records`
--

DROP TABLE IF EXISTS `attendance_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `attendance_session_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `status` enum('PENDING','PRESENT','ABSENT','LATE','EXCUSED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `marked_by` bigint unsigned DEFAULT NULL,
  `marked_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendance_records_attendance_session_id_student_id_unique` (`attendance_session_id`,`student_id`),
  KEY `attendance_records_marked_by_foreign` (`marked_by`),
  KEY `attendance_records_student_id_status_index` (`student_id`,`status`),
  CONSTRAINT `attendance_records_attendance_session_id_foreign` FOREIGN KEY (`attendance_session_id`) REFERENCES `attendance_sessions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `attendance_records_marked_by_foreign` FOREIGN KEY (`marked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `attendance_records_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_records`
--

LOCK TABLES `attendance_records` WRITE;
/*!40000 ALTER TABLE `attendance_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_sessions`
--

DROP TABLE IF EXISTS `attendance_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `class_subject_id` bigint unsigned NOT NULL,
  `timetable_id` bigint unsigned DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `session_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` enum('SCHEDULED','OPEN','CLOSED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SCHEDULED',
  `opened_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `attendance_sessions_timetable_id_foreign` (`timetable_id`),
  KEY `attendance_sessions_created_by_foreign` (`created_by`),
  KEY `attendance_sessions_class_subject_id_session_date_index` (`class_subject_id`,`session_date`),
  KEY `attendance_sessions_status_index` (`status`),
  CONSTRAINT `attendance_sessions_class_subject_id_foreign` FOREIGN KEY (`class_subject_id`) REFERENCES `class_subjects` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `attendance_sessions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `attendance_sessions_timetable_id_foreign` FOREIGN KEY (`timetable_id`) REFERENCES `timetables` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_sessions`
--

LOCK TABLES `attendance_sessions` WRITE;
/*!40000 ALTER TABLE `attendance_sessions` DISABLE KEYS */;
INSERT INTO `attendance_sessions` VALUES (1,1,NULL,1,'2026-11-16','07:45:00','10:15:00','CLOSED','2026-11-13 21:01:40','2026-11-14 20:20:27','2026-11-13 20:22:43','2026-11-14 20:20:27');
/*!40000 ALTER TABLE `attendance_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('laravel-cache-5c785c036466adea360111aa28563bfd556b5fba','i:2;',1794816466),('laravel-cache-5c785c036466adea360111aa28563bfd556b5fba:timer','i:1794816466;',1794816466);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `class_subjects`
--

DROP TABLE IF EXISTS `class_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_subjects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `class_id` bigint unsigned NOT NULL,
  `subject_id` bigint unsigned NOT NULL,
  `lecturer_id` bigint unsigned NOT NULL,
  `semester_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_subjects_class_id_subject_id_semester_id_unique` (`class_id`,`subject_id`,`semester_id`),
  KEY `class_subjects_subject_id_foreign` (`subject_id`),
  KEY `class_subjects_lecturer_id_foreign` (`lecturer_id`),
  KEY `class_subjects_semester_id_foreign` (`semester_id`),
  CONSTRAINT `class_subjects_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `class_subjects_lecturer_id_foreign` FOREIGN KEY (`lecturer_id`) REFERENCES `lecturers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `class_subjects_semester_id_foreign` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `class_subjects_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_subjects`
--

LOCK TABLES `class_subjects` WRITE;
/*!40000 ALTER TABLE `class_subjects` DISABLE KEYS */;
INSERT INTO `class_subjects` VALUES (1,2,4,10,1,'2026-11-13 00:48:21','2026-11-13 00:48:21'),(2,2,2,6,1,'2026-11-13 01:52:02','2026-11-13 01:52:02'),(3,2,5,19,1,'2026-11-13 21:50:35','2026-11-13 21:50:35'),(4,2,1,21,1,'2026-11-13 21:50:56','2026-11-13 21:50:56'),(5,2,3,21,1,'2026-11-13 21:51:16','2026-11-13 21:51:16');
/*!40000 ALTER TABLE `class_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `major_id` bigint unsigned NOT NULL,
  `academic_year_id` bigint unsigned NOT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_level` tinyint unsigned DEFAULT NULL,
  `group_name` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `classes_major_id_academic_year_id_code_unique` (`major_id`,`academic_year_id`,`code`),
  KEY `classes_academic_year_id_foreign` (`academic_year_id`),
  CONSTRAINT `classes_academic_year_id_foreign` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `classes_major_id_foreign` FOREIGN KEY (`major_id`) REFERENCES `majors` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (1,1,1,'E4','CSDE0',4,'E','ACTIVE','2026-11-11 18:25:28','2026-11-15 22:44:00'),(2,1,1,'E3','CSDE3',4,'E','ACTIVE','2026-11-13 00:01:00','2026-11-15 22:43:51'),(3,1,1,'E2','CSDE2',4,'E','ACTIVE','2026-11-13 00:15:04','2026-11-15 22:43:36'),(4,1,1,'E1','CSDE1',4,'E','ACTIVE','2026-11-15 22:42:36','2026-11-15 22:42:36'),(5,1,1,'E5','SCDE5',4,'E','ACTIVE','2026-11-15 22:44:29','2026-11-15 22:44:29'),(6,1,1,'E6','CSDE6',4,'E','ACTIVE','2026-11-15 22:44:54','2026-11-15 22:44:54'),(7,1,1,'E7','SCDE7',4,'E','ACTIVE','2026-11-15 22:45:19','2026-11-15 22:45:19'),(8,1,1,'E8','CSDE8',4,'E','ACTIVE','2026-11-15 22:45:42','2026-11-15 22:45:42');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `faculty_id` bigint unsigned NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_code_unique` (`code`),
  KEY `departments_faculty_id_foreign` (`faculty_id`),
  CONSTRAINT `departments_faculty_id_foreign` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,1,'CS023','CS','2026-11-11 00:03:59','2026-11-11 00:03:59'),(2,2,'DT0023','Data','2026-11-13 22:12:48','2026-11-13 22:12:48');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollments`
--

DROP TABLE IF EXISTS `enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `class_id` bigint unsigned NOT NULL,
  `academic_year_id` bigint unsigned NOT NULL,
  `status` enum('ACTIVE','DROPPED','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enrollments_student_id_class_id_academic_year_id_unique` (`student_id`,`class_id`,`academic_year_id`),
  KEY `enrollments_class_id_foreign` (`class_id`),
  KEY `enrollments_academic_year_id_foreign` (`academic_year_id`),
  CONSTRAINT `enrollments_academic_year_id_foreign` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `enrollments_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `enrollments_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollments`
--

LOCK TABLES `enrollments` WRITE;
/*!40000 ALTER TABLE `enrollments` DISABLE KEYS */;
INSERT INTO `enrollments` VALUES (1,1,1,1,'ACTIVE','2026-11-12 21:43:11','2026-11-12 21:43:11'),(2,2,1,1,'ACTIVE','2026-11-12 23:16:25','2026-11-12 23:16:25'),(3,1,2,1,'ACTIVE','2026-11-13 21:49:29','2026-11-13 21:49:29');
/*!40000 ALTER TABLE `enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faculties`
--

DROP TABLE IF EXISTS `faculties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculties` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `faculties_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculties`
--

LOCK TABLES `faculties` WRITE;
/*!40000 ALTER TABLE `faculties` DISABLE KEYS */;
INSERT INTO `faculties` VALUES (1,'CS0026','Computer Science','2026-11-11 00:02:02','2026-11-11 00:02:02'),(2,'DTS0006','Science','2026-11-13 22:11:58','2026-11-13 22:11:58');
/*!40000 ALTER TABLE `faculties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
INSERT INTO `failed_jobs` VALUES (1,'1803a1ea-b759-46b0-b391-a09a92c733f4','database','default','{\"uuid\":\"1803a1ea-b759-46b0-b391-a09a92c733f4\",\"displayName\":\"App\\\\Events\\\\AttendanceUpdated\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:28:\\\"App\\\\Events\\\\AttendanceUpdated\\\":3:{s:9:\\\"sessionId\\\";i:1;s:6:\\\"action\\\";s:14:\\\"session_closed\\\";s:4:\\\"data\\\";a:3:{s:6:\\\"status\\\";s:6:\\\"CLOSED\\\";s:11:\\\"auto_absent\\\";i:0;s:7:\\\"summary\\\";a:6:{s:7:\\\"pending\\\";i:0;s:7:\\\"present\\\";i:0;s:6:\\\"absent\\\";i:0;s:4:\\\"late\\\";i:0;s:7:\\\"excused\\\";i:0;s:5:\\\"total\\\";i:0;}}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1794712829,\"delay\":null}','Illuminate\\Broadcasting\\BroadcastException: Pusher error: cURL error 7: Failed to connect to localhost port 8080 after 2243 ms: Couldn\'t connect to server (see https://curl.se/libcurl/c/libcurl-errors.html) for http://localhost:8080/apps/664138/events?auth_key=ohgeyctnpcazaw1c7t1x&auth_timestamp=1794712831&auth_version=1.0&body_md5=34e779b43bfa5c3c813c062fe43dcd20&auth_signature=b67862a6d5a694535426c689e324bab24d236a745478e5d5a45ad1e5398786a0. in D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Broadcasting\\Broadcasters\\PusherBroadcaster.php:171\nStack trace:\n#0 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Broadcasting\\BroadcastEvent.php(100): Illuminate\\Broadcasting\\Broadcasters\\PusherBroadcaster->broadcast(Object(Illuminate\\Support\\Collection), \'attendance.upda...\', Array)\n#1 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Illuminate\\Broadcasting\\BroadcastEvent->handle(Object(Illuminate\\Broadcasting\\BroadcastManager))\n#2 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#3 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#4 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#5 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(799): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#6 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(129): Illuminate\\Container\\Container->call(Array)\n#7 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Bus\\Dispatcher->Illuminate\\Bus\\{closure}(Object(Illuminate\\Broadcasting\\BroadcastEvent))\n#8 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Broadcasting\\BroadcastEvent))\n#9 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Bus\\Dispatcher.php(133): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#10 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(136): Illuminate\\Bus\\Dispatcher->dispatchNow(Object(Illuminate\\Broadcasting\\BroadcastEvent), false)\n#11 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(180): Illuminate\\Queue\\CallQueuedHandler->Illuminate\\Queue\\{closure}(Object(Illuminate\\Broadcasting\\BroadcastEvent))\n#12 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Pipeline\\Pipeline.php(137): Illuminate\\Pipeline\\Pipeline->Illuminate\\Pipeline\\{closure}(Object(Illuminate\\Broadcasting\\BroadcastEvent))\n#13 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(129): Illuminate\\Pipeline\\Pipeline->then(Object(Closure))\n#14 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\CallQueuedHandler.php(70): Illuminate\\Queue\\CallQueuedHandler->dispatchThroughMiddleware(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Illuminate\\Broadcasting\\BroadcastEvent))\n#15 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Jobs\\Job.php(102): Illuminate\\Queue\\CallQueuedHandler->call(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Array)\n#16 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(518): Illuminate\\Queue\\Jobs\\Job->fire()\n#17 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(468): Illuminate\\Queue\\Worker->process(\'database\', Object(Illuminate\\Queue\\Jobs\\DatabaseJob), Object(Illuminate\\Queue\\WorkerOptions))\n#18 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Worker.php(391): Illuminate\\Queue\\Worker->runJob(Object(Illuminate\\Queue\\Jobs\\DatabaseJob), \'database\', Object(Illuminate\\Queue\\WorkerOptions))\n#19 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(149): Illuminate\\Queue\\Worker->runNextJob(\'database\', \'default\', Object(Illuminate\\Queue\\WorkerOptions))\n#20 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Queue\\Console\\WorkCommand.php(132): Illuminate\\Queue\\Console\\WorkCommand->runWorker(\'database\', \'default\')\n#21 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(36): Illuminate\\Queue\\Console\\WorkCommand->handle()\n#22 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Util.php(43): Illuminate\\Container\\BoundMethod::Illuminate\\Container\\{closure}()\n#23 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(96): Illuminate\\Container\\Util::unwrapIfClosure(Object(Closure))\n#24 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\BoundMethod.php(35): Illuminate\\Container\\BoundMethod::callBoundMethod(Object(Illuminate\\Foundation\\Application), Array, Object(Closure))\n#25 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Container\\Container.php(799): Illuminate\\Container\\BoundMethod::call(Object(Illuminate\\Foundation\\Application), Array, Array, NULL)\n#26 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(211): Illuminate\\Container\\Container->call(Array)\n#27 D:\\SetUp\\University-Attendent\\vendor\\symfony\\console\\Command\\Command.php(341): Illuminate\\Console\\Command->execute(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#28 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Console\\Command.php(180): Symfony\\Component\\Console\\Command\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Illuminate\\Console\\OutputStyle))\n#29 D:\\SetUp\\University-Attendent\\vendor\\symfony\\console\\Application.php(1125): Illuminate\\Console\\Command->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#30 D:\\SetUp\\University-Attendent\\vendor\\symfony\\console\\Application.php(357): Symfony\\Component\\Console\\Application->doRunCommand(Object(Illuminate\\Queue\\Console\\WorkCommand), Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#31 D:\\SetUp\\University-Attendent\\vendor\\symfony\\console\\Application.php(196): Symfony\\Component\\Console\\Application->doRun(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#32 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Console\\Kernel.php(198): Symfony\\Component\\Console\\Application->run(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#33 D:\\SetUp\\University-Attendent\\vendor\\laravel\\framework\\src\\Illuminate\\Foundation\\Application.php(1235): Illuminate\\Foundation\\Console\\Kernel->handle(Object(Symfony\\Component\\Console\\Input\\ArgvInput), Object(Symfony\\Component\\Console\\Output\\ConsoleOutput))\n#34 D:\\SetUp\\University-Attendent\\artisan(16): Illuminate\\Foundation\\Application->handleCommand(Object(Symfony\\Component\\Console\\Input\\ArgvInput))\n#35 {main}','2026-11-14 20:20:34');
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lecturers`
--

DROP TABLE IF EXISTS `lecturers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lecturers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `department_id` bigint unsigned NOT NULL,
  `lecturer_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lecturers_user_id_unique` (`user_id`),
  UNIQUE KEY `lecturers_lecturer_code_unique` (`lecturer_code`),
  KEY `lecturers_department_id_foreign` (`department_id`),
  CONSTRAINT `lecturers_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `lecturers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lecturers`
--

LOCK TABLES `lecturers` WRITE;
/*!40000 ALTER TABLE `lecturers` DISABLE KEYS */;
INSERT INTO `lecturers` VALUES (1,1,1,'LEC-001','Moa Sovann','MSc.','2026-11-11 07:11:07','2026-11-11 07:11:07'),(2,3,1,'LEC-002','Sok Dara','MSc.','2026-11-11 08:00:55','2026-11-11 01:06:21'),(3,4,1,'LEC-003','Chan Bopha',NULL,'2026-11-11 08:00:55','2026-11-11 08:00:55'),(4,5,1,'LEC-004','Keo Visal',NULL,'2026-11-11 08:00:55','2026-11-11 08:00:55'),(5,6,1,'LEC-005','Ly Sreymom',NULL,'2026-11-11 08:00:55','2026-11-11 08:00:55'),(6,7,1,'LEC-006','Heng Rithy',NULL,'2026-11-11 08:00:55','2026-11-11 08:00:55'),(9,8,1,'LEC-007','Chea Bunna',NULL,'2026-11-11 08:03:37','2026-11-11 08:03:37'),(10,9,1,'LEC-008','Meas Sopheak',NULL,'2026-11-11 08:03:37','2026-11-11 08:03:37'),(11,10,1,'LEC-009','Nhem Rady',NULL,'2026-11-11 08:03:37','2026-11-11 08:03:37'),(12,11,1,'LEC-010','Ouk Chanthou',NULL,'2026-11-11 08:03:37','2026-11-11 08:03:37'),(13,12,1,'LEC-011','Phan Vanna',NULL,'2026-11-11 08:03:37','2026-11-11 08:03:37'),(16,13,1,'LEC-012','Ros Samnang',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51'),(17,14,1,'LEC-013','Seng Kanha',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51'),(18,15,1,'LEC-014','Tep Vibol',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51'),(19,16,1,'LEC-015','Ung Sophea',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51'),(20,17,1,'LEC-016','Vong Piseth',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51'),(21,18,1,'LEC-017','Yim Leakhena',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51'),(22,19,1,'LEC-018','Chhay Narith',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51'),(23,20,1,'LEC-019','Doung Sreypov',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51'),(24,21,1,'LEC-020','Eam Kosal',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51'),(25,22,1,'LEC-021','Hok Thida',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51');
/*!40000 ALTER TABLE `lecturers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `majors`
--

DROP TABLE IF EXISTS `majors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `majors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `department_id` bigint unsigned NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `majors_code_unique` (`code`),
  KEY `majors_department_id_foreign` (`department_id`),
  CONSTRAINT `majors_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `majors`
--

LOCK TABLES `majors` WRITE;
/*!40000 ALTER TABLE `majors` DISABLE KEYS */;
INSERT INTO `majors` VALUES (1,1,'CSD022','Information Technology','2026-11-11 18:22:53','2026-11-11 18:22:53'),(2,2,'DAS00373','DATA Analists','2026-11-13 22:13:42','2026-11-13 22:13:42');
/*!40000 ALTER TABLE `majors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_10_27_000001_add_role_status_to_users_table',1),(5,'2026_10_27_000002_create_faculties_table',1),(6,'2026_10_27_000003_create_departments_table',1),(7,'2026_10_27_000004_create_majors_table',1),(8,'2026_10_27_000005_create_academic_years_table',1),(9,'2026_10_27_000006_create_semesters_table',1),(10,'2026_10_27_000007_create_students_table',1),(11,'2026_10_27_000008_create_lecturers_table',1),(12,'2026_10_27_000009_create_classes_table',1),(13,'2026_10_27_000010_create_subjects_table',1),(14,'2026_10_27_000011_create_class_subjects_table',1),(15,'2026_10_27_000012_create_enrollments_table',1),(16,'2026_10_27_000013_create_timetables_table',1),(17,'2026_10_27_000014_create_attendance_sessions_table',1),(18,'2026_10_27_000015_create_attendance_records_table',1),(19,'2026_10_27_000016_create_attendance_audit_logs_table',1),(20,'2026_10_28_064429_create_personal_access_tokens_table',1),(21,'2026_10_29_065832_add_avatar_to_users_table',2),(22,'2026_11_13_043036_add_admission_date_to_students_table',3),(23,'2026_11_13_063601_add_year_level_group_name_and_status_to_classes_table',4),(24,'2026_11_13_074405_add_status_to_subjects_table',5);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User',1,'api','31d7d368b242dbc5c037b0276c5c4e480b45a98bec755f1ec795c8f763f63bb2','[\"*\"]',NULL,NULL,'2026-10-28 21:25:06','2026-10-28 21:25:06'),(2,'App\\Models\\User',1,'api','5fdd37bcf8c3c8595888a7a42c1269fbcddfaf988d80de55809f2da0d316a80c','[\"*\"]',NULL,NULL,'2026-10-28 21:25:08','2026-10-28 21:25:08'),(3,'App\\Models\\User',1,'api','0f24d918a489eded32ba821c3652c3ab4184041d90767e8f4a2a4fe583fc8bef','[\"*\"]',NULL,NULL,'2026-10-28 21:25:09','2026-10-28 21:25:09'),(4,'App\\Models\\User',1,'api','c5fe902d154b7deaf37a59bf1b1bae1a2b16bf5981a34eb70e855d14e2b13b47','[\"*\"]',NULL,NULL,'2026-10-28 21:25:24','2026-10-28 21:25:24'),(5,'App\\Models\\User',1,'api','643884462bcad134cd2920064c077db713c4332fb3f0cafefe16b3a672506d1b','[\"*\"]',NULL,NULL,'2026-10-28 21:25:25','2026-10-28 21:25:25'),(6,'App\\Models\\User',1,'api','6c73c34489d1710f2e00b69a6b5263bc3d1b92b73befa04831436b985ffb5d3a','[\"*\"]',NULL,NULL,'2026-10-28 21:26:16','2026-10-28 21:26:16'),(7,'App\\Models\\User',1,'api','61d07db66d2d0bf13ed9fe745b2cba8d13de9712be8d0a8c03b5f26a4baf1aa1','[\"*\"]',NULL,NULL,'2026-10-28 21:26:52','2026-10-28 21:26:52'),(8,'App\\Models\\User',1,'api','759f58a6879c71c952ad4daf092c06b29d2d54d1007b662d23fd14c46b5f01bb','[\"*\"]',NULL,NULL,'2026-10-28 21:26:54','2026-10-28 21:26:54'),(9,'App\\Models\\User',1,'api','2affb1c1240350a45a99213f700d1f4d006bc9f91c0609a005930e171387026a','[\"*\"]',NULL,NULL,'2026-10-28 21:35:37','2026-10-28 21:35:37'),(10,'App\\Models\\User',1,'api','3999299c14c449d0b6a59aa973b85413989fbd1de8b43ab7a0ee0a4646a299d9','[\"*\"]',NULL,NULL,'2026-10-28 21:35:38','2026-10-28 21:35:38'),(11,'App\\Models\\User',1,'api','bc9a41749415763d77f4aca176900f5dde03af3cc84db88c914e778647601bc3','[\"*\"]',NULL,NULL,'2026-10-28 21:35:40','2026-10-28 21:35:40'),(12,'App\\Models\\User',1,'api','9259ebce54bde4656c5731fdac3ae5648e362b92f209f054cb0a4698672c654d','[\"*\"]',NULL,NULL,'2026-10-28 21:35:49','2026-10-28 21:35:49'),(13,'App\\Models\\User',1,'api','ec69844dc92e013c398595b9f899c6db18328aa1a2658eb452a7a2caea3531a4','[\"*\"]',NULL,NULL,'2026-10-28 21:35:51','2026-10-28 21:35:51'),(14,'App\\Models\\User',1,'api','0b8138d40188399d8f00481b1b0e600f65bc5ab127c58c9da465dd25f9f30d28','[\"*\"]',NULL,NULL,'2026-10-28 21:36:37','2026-10-28 21:36:37'),(15,'App\\Models\\User',1,'api','9346f11707f2f704f9bc548345ddd565d686e186a3fca9d7656e3291f6ebe23c','[\"*\"]',NULL,NULL,'2026-10-28 21:36:38','2026-10-28 21:36:38'),(17,'App\\Models\\User',1,'api','5b9b75e6b80e9a9c81a92e77c99474e717c3cd5394a8e76757c491b8ccf5a97e','[\"*\"]','2026-10-28 22:33:57',NULL,'2026-10-28 21:51:17','2026-10-28 22:33:57'),(18,'App\\Models\\User',1,'api','19207076d1ca3623fd39778b29c18717cd3f37560a3938f9e7731bd90d75b5d7','[\"*\"]',NULL,NULL,'2026-10-28 22:01:07','2026-10-28 22:01:07'),(19,'App\\Models\\User',1,'api','ba5a0b3b49c70852da060740ad30f0a2024e4a15ecfeeec4c84f1f5c78da9ac3','[\"*\"]',NULL,NULL,'2026-10-28 22:02:03','2026-10-28 22:02:03'),(20,'App\\Models\\User',1,'api','8af5e928295f8d78ce5bc380de57a9534485ef53d386a8634f89b1e73f46229e','[\"*\"]',NULL,NULL,'2026-10-28 22:02:54','2026-10-28 22:02:54'),(21,'App\\Models\\User',1,'api','40b023e168607f977cd83034eed5bc5ff06a2b1efe9e43e655c050a1c0fe8b8e','[\"*\"]','2026-10-29 22:35:14',NULL,'2026-10-28 22:07:36','2026-10-29 22:35:14'),(22,'App\\Models\\User',1,'api','7281250ac21004af17983533118d2bd4be98016894d98bea97c92d1687848337','[\"*\"]',NULL,NULL,'2026-10-28 23:48:58','2026-10-28 23:48:58'),(23,'App\\Models\\User',1,'api','ac67488b0d4ae7be4bd5ceb873c793d6f16adfc12b3993caa70ea3e11986a4fe','[\"*\"]',NULL,NULL,'2026-10-29 00:15:10','2026-10-29 00:15:10'),(24,'App\\Models\\User',1,'api','f0423ecc6049e1ec4acbb561215bac268c41aac9c9efaad255593044ee979796','[\"*\"]',NULL,NULL,'2026-10-29 00:15:11','2026-10-29 00:15:11'),(25,'App\\Models\\User',1,'api','c9f30ac2a036d0da1aec08e7f32e437c8454cd930962c5600821f32af95146cf','[\"*\"]',NULL,NULL,'2026-10-29 00:15:13','2026-10-29 00:15:13'),(26,'App\\Models\\User',1,'api','0e10a9a2de408479079dbe811d41ecea136200bd155cf1966795c9e0b6111a79','[\"*\"]','2026-11-14 20:29:33',NULL,'2026-10-29 22:36:45','2026-11-14 20:29:33'),(27,'App\\Models\\User',1,'api','0411249bf014c15e78031e97b03b9438c22d169c45b99a1ba7d8601473a3b9c3','[\"*\"]',NULL,NULL,'2026-11-01 01:39:34','2026-11-01 01:39:34'),(28,'App\\Models\\User',1,'api','ebe0aa81fe778e2c07f50e5ae1cf5571ef6d3c4c4bac4a78923f8967afdcdc7b','[\"*\"]','2026-11-11 00:41:33',NULL,'2026-11-10 23:58:43','2026-11-11 00:41:33'),(32,'App\\Models\\User',14,'USAMS Web','75d61b130f7dc61b079e1a141c0dbe0197b45e5326c4555fac8afa1940b95333','[\"*\"]',NULL,NULL,'2026-11-11 01:36:03','2026-11-11 01:36:03'),(34,'App\\Models\\User',2,'api','4f00677524583c67ac8157eeda48d10816dbb813c3c7e1054234349182626e7d','[\"*\"]','2026-11-12 22:31:46',NULL,'2026-11-11 01:36:37','2026-11-12 22:31:46'),(36,'App\\Models\\User',14,'api','be2eac62dacbbe3a246acc0410a59976238bad95b4cbced13a9a455572148f6f','[\"*\"]',NULL,NULL,'2026-11-13 20:07:52','2026-11-13 20:07:52'),(38,'App\\Models\\User',2,'api','fe924d99992c6cbf4f595ea03e75956a67d0438c482cc3fb26f574c9f2da606b','[\"*\"]','2026-11-13 23:22:28',NULL,'2026-11-13 20:13:20','2026-11-13 23:22:28'),(41,'App\\Models\\User',2,'api','89fb69e88be2082494c2c18f2e3ad59c545db2b666606c436ab68d2ab1346900','[\"*\"]','2026-11-14 20:17:03',NULL,'2026-11-14 20:15:15','2026-11-14 20:17:03'),(43,'App\\Models\\User',2,'api','9027978573fb79ac06e90c4444cffea5a70b9bab535efedbb96a1c919fdf4f91','[\"*\"]','2026-11-14 20:32:14',NULL,'2026-11-14 20:30:07','2026-11-14 20:32:14'),(45,'App\\Models\\User',2,'api','a8acb89d8253e5a997ab7f2fbb1c2f3b2f5bb2e3a2bc1a5aa7be3dd3571301ba','[\"*\"]','2026-11-17 22:32:18',NULL,'2026-11-16 01:06:58','2026-11-17 22:32:18');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `semesters`
--

DROP TABLE IF EXISTS `semesters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `semesters` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `academic_year_id` bigint unsigned NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `semesters_academic_year_id_name_unique` (`academic_year_id`,`name`),
  CONSTRAINT `semesters_academic_year_id_foreign` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `semesters`
--

LOCK TABLES `semesters` WRITE;
/*!40000 ALTER TABLE `semesters` DISABLE KEYS */;
INSERT INTO `semesters` VALUES (1,1,'Semester1','2026-11-12','2027-02-12','2026-11-11 18:19:31','2026-11-11 18:19:31'),(2,1,'Semester2','2027-02-16','2027-06-16','2026-11-15 22:53:02','2026-11-15 22:53:02');
/*!40000 ALTER TABLE `semesters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('SA19ELaXjP4FHCOMOrvIkQANgYzBHkzrZPmYQklL',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiRFI5SkN0U0dPSHQzVWl2bGlYUkFnRnVlclJKR0JFVURuSmgwdU45TSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzU6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9yZXBvcnRzIjtzOjU6InJvdXRlIjtzOjE5OiJ1c2Ftcy5hZG1pbi5yZXBvcnRzIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1794979937);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `major_id` bigint unsigned NOT NULL,
  `student_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gender` enum('MALE','FEMALE','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `admission_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `students_user_id_unique` (`user_id`),
  UNIQUE KEY `students_student_code_unique` (`student_code`),
  KEY `students_major_id_foreign` (`major_id`),
  CONSTRAINT `students_major_id_foreign` FOREIGN KEY (`major_id`) REFERENCES `majors` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `students_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=342 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,25,1,'00002','lem senghor',NULL,NULL,'2026-11-12 19:01:01','2026-11-15 22:55:47','2026-01-01'),(2,26,1,'00001','Sovan yurik',NULL,NULL,'2026-11-12 23:16:02','2026-11-15 22:55:38','2026-11-14'),(3,27,1,'00003','leang sodalin',NULL,NULL,'2026-11-16 00:04:23','2026-11-16 00:04:23','2026-11-16'),(4,28,1,'00004','Dara Sok',NULL,NULL,'2026-11-16 00:08:41','2026-11-16 00:08:41','2026-11-16'),(5,29,2,'00005','Sopheak Sok',NULL,NULL,'2026-11-16 00:08:41','2026-11-16 00:08:41','2026-11-16'),(6,30,1,'00006','Vannak Sok',NULL,NULL,'2026-11-16 00:08:42','2026-11-16 00:08:42','2026-11-16'),(7,31,2,'00007','Ratha Sok',NULL,NULL,'2026-11-16 00:08:42','2026-11-16 00:08:42','2026-11-16'),(8,32,1,'00008','Sreypov Sok',NULL,NULL,'2026-11-16 00:08:42','2026-11-16 00:08:42','2026-11-16'),(9,33,2,'00009','Pisey Sok',NULL,NULL,'2026-11-16 00:08:42','2026-11-16 00:08:42','2026-11-16'),(10,34,1,'00010','Chenda Sok',NULL,NULL,'2026-11-16 00:08:42','2026-11-16 00:08:42','2026-11-16'),(11,35,2,'00011','Dara Chan',NULL,NULL,'2026-11-16 00:08:43','2026-11-16 00:08:43','2026-11-16'),(12,36,1,'00012','Sopheak Chan',NULL,NULL,'2026-11-16 00:08:43','2026-11-16 00:08:43','2026-11-16'),(13,37,2,'00013','Vannak Chan',NULL,NULL,'2026-11-16 00:08:43','2026-11-16 00:08:43','2026-11-16'),(14,38,1,'00014','Ratha Chan',NULL,NULL,'2026-11-16 00:08:43','2026-11-16 00:08:43','2026-11-16'),(15,39,2,'00015','Sreypov Chan',NULL,NULL,'2026-11-16 00:08:43','2026-11-16 00:08:43','2026-11-16'),(16,40,1,'00016','Pisey Chan',NULL,NULL,'2026-11-16 00:08:44','2026-11-16 00:08:44','2026-11-16'),(17,41,2,'00017','Chenda Chan',NULL,NULL,'2026-11-16 00:08:44','2026-11-16 00:08:44','2026-11-16'),(18,42,1,'00018','Dara Lim',NULL,NULL,'2026-11-16 00:08:44','2026-11-16 00:08:44','2026-11-16'),(19,43,2,'00019','Sopheak Lim',NULL,NULL,'2026-11-16 00:08:44','2026-11-16 00:08:44','2026-11-16'),(20,44,1,'00020','Vannak Lim',NULL,NULL,'2026-11-16 00:08:44','2026-11-16 00:08:44','2026-11-16'),(21,45,2,'00021','Ratha Lim',NULL,NULL,'2026-11-16 00:08:45','2026-11-16 00:08:45','2026-11-16'),(22,46,1,'00022','Sreypov Lim',NULL,NULL,'2026-11-16 00:08:45','2026-11-16 00:08:45','2026-11-16'),(23,47,2,'00023','Pisey Lim',NULL,NULL,'2026-11-16 00:08:45','2026-11-16 00:08:45','2026-11-16'),(24,48,1,'00024','Chenda Lim',NULL,NULL,'2026-11-16 00:08:45','2026-11-16 00:08:45','2026-11-16'),(25,49,2,'00025','Dara Chea',NULL,NULL,'2026-11-16 00:08:45','2026-11-16 00:08:45','2026-11-16'),(26,50,1,'00026','Sopheak Chea',NULL,NULL,'2026-11-16 00:08:45','2026-11-16 00:08:45','2026-11-16'),(27,51,2,'00027','Vannak Chea',NULL,NULL,'2026-11-16 00:08:46','2026-11-16 00:08:46','2026-11-16'),(28,52,1,'00028','Ratha Chea',NULL,NULL,'2026-11-16 00:08:46','2026-11-16 00:08:46','2026-11-16'),(29,53,2,'00029','Sreypov Chea',NULL,NULL,'2026-11-16 00:08:46','2026-11-16 00:08:46','2026-11-16'),(30,54,1,'00030','Pisey Chea',NULL,NULL,'2026-11-16 00:08:46','2026-11-16 00:08:46','2026-11-16'),(31,55,2,'00031','Chenda Chea',NULL,NULL,'2026-11-16 00:08:46','2026-11-16 00:08:46','2026-11-16'),(32,56,1,'00032','Dara Kim',NULL,NULL,'2026-11-16 00:08:47','2026-11-16 00:08:47','2026-11-16'),(33,57,2,'00033','Sopheak Kim',NULL,NULL,'2026-11-16 00:08:47','2026-11-16 00:08:47','2026-11-16'),(34,58,1,'00034','Vannak Kim',NULL,NULL,'2026-11-16 00:08:47','2026-11-16 00:08:47','2026-11-16'),(35,59,2,'00035','Ratha Kim',NULL,NULL,'2026-11-16 00:08:47','2026-11-16 00:08:47','2026-11-16'),(36,60,1,'00036','Sreypov Kim',NULL,NULL,'2026-11-16 00:08:47','2026-11-16 00:08:47','2026-11-16'),(37,61,2,'00037','Pisey Kim',NULL,NULL,'2026-11-16 00:08:48','2026-11-16 00:08:48','2026-11-16'),(38,62,1,'00038','Chenda Kim',NULL,NULL,'2026-11-16 00:08:48','2026-11-16 00:08:48','2026-11-16'),(39,63,2,'00039','Dara Heng',NULL,NULL,'2026-11-16 00:08:48','2026-11-16 00:08:48','2026-11-16'),(40,64,1,'00040','Sopheak Heng',NULL,NULL,'2026-11-16 00:08:48','2026-11-16 00:08:48','2026-11-16'),(41,65,2,'00041','Vannak Heng',NULL,NULL,'2026-11-16 00:08:48','2026-11-16 00:08:48','2026-11-16'),(42,66,1,'00042','Ratha Heng',NULL,NULL,'2026-11-16 00:08:49','2026-11-16 00:08:49','2026-11-16'),(43,67,2,'00043','Sreypov Heng',NULL,NULL,'2026-11-16 00:08:49','2026-11-16 00:08:49','2026-11-16'),(44,68,1,'00044','Pisey Heng',NULL,NULL,'2026-11-16 00:08:49','2026-11-16 00:08:49','2026-11-16'),(45,69,2,'00045','Chenda Heng',NULL,NULL,'2026-11-16 00:08:49','2026-11-16 00:08:49','2026-11-16'),(46,70,1,'00046','Dara Phan',NULL,NULL,'2026-11-16 00:08:49','2026-11-16 00:08:49','2026-11-16'),(47,71,2,'00047','Sopheak Phan',NULL,NULL,'2026-11-16 00:08:50','2026-11-16 00:08:50','2026-11-16'),(48,72,1,'00048','Vannak Phan',NULL,NULL,'2026-11-16 00:08:50','2026-11-16 00:08:50','2026-11-16'),(49,73,2,'00049','Ratha Phan',NULL,NULL,'2026-11-16 00:08:50','2026-11-16 00:08:50','2026-11-16'),(50,74,1,'00050','Sreypov Phan',NULL,NULL,'2026-11-16 00:08:50','2026-11-16 00:08:50','2026-11-16'),(51,75,1,'00051','Dara Sok',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(52,76,2,'00052','Sopheak Sok',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(53,77,1,'00053','Vannak Sok',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(54,78,2,'00054','Ratha Sok',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(55,79,1,'00055','Pisey Sok',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(56,80,2,'00056','Chenda Sok',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(57,81,1,'00057','Makara Sok',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(58,82,2,'00058','Bopha Sok',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(59,83,1,'00059','Sothea Sok',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(60,84,2,'00060','Rithy Sok',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(61,85,1,'00061','Dara Chan',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(62,86,2,'00062','Sopheak Chan',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(63,87,1,'00063','Vannak Chan',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(64,88,2,'00064','Ratha Chan',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(65,89,1,'00065','Pisey Chan',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(66,90,2,'00066','Chenda Chan',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(67,91,1,'00067','Makara Chan',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(68,92,2,'00068','Bopha Chan',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(69,93,1,'00069','Sothea Chan',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(70,94,2,'00070','Rithy Chan',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(71,95,1,'00071','Dara Lim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(72,96,2,'00072','Sopheak Lim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(73,97,1,'00073','Vannak Lim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(74,98,2,'00074','Ratha Lim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(75,99,1,'00075','Pisey Lim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(76,100,2,'00076','Chenda Lim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(77,101,1,'00077','Makara Lim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(78,102,2,'00078','Bopha Lim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(79,103,1,'00079','Sothea Lim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(80,104,2,'00080','Rithy Lim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(81,105,1,'00081','Dara Chea',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(82,106,2,'00082','Sopheak Chea',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(83,107,1,'00083','Vannak Chea',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(84,108,2,'00084','Ratha Chea',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(85,109,1,'00085','Pisey Chea',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(86,110,2,'00086','Chenda Chea',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(87,111,1,'00087','Makara Chea',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(88,112,2,'00088','Bopha Chea',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(89,113,1,'00089','Sothea Chea',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(90,114,2,'00090','Rithy Chea',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(91,115,1,'00091','Dara Kim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(92,116,2,'00092','Sopheak Kim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(93,117,1,'00093','Vannak Kim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(94,118,2,'00094','Ratha Kim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(95,119,1,'00095','Pisey Kim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(96,120,2,'00096','Chenda Kim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(97,121,1,'00097','Makara Kim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(98,122,2,'00098','Bopha Kim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(99,123,1,'00099','Sothea Kim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(100,124,2,'00100','Rithy Kim',NULL,NULL,'2026-11-16 07:33:01','2026-11-16 07:33:01','2026-11-16'),(114,138,1,'00102','Lina Sok',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(115,139,2,'00103','Linda Sok',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(116,140,1,'00104','Pisey Sok',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(117,141,2,'00105','Sreynich Sok',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(118,142,1,'00106','Malen Sok',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(119,143,2,'00107','Boromey Sok',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(120,144,1,'00108','Monyneath Sok',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(121,145,2,'00109','Thida Sok',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(122,146,1,'00110','Yurik Sok',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(123,147,2,'00111','Lyka Sok',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(124,148,1,'00112','Lina Chan',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(125,149,2,'00113','Linda Chan',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(126,150,1,'00114','Pisey Chan',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(127,151,2,'00115','Sreynich Chan',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(128,152,1,'00116','Malen Chan',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(129,153,2,'00117','Boromey Chan',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(130,154,1,'00118','Monyneath Chan',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(131,155,2,'00119','Thida Chan',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(132,156,1,'00120','Yurik Chan',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(133,157,2,'00121','Lyka Chan',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(134,158,1,'00122','Lina Lim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(135,159,2,'00123','Linda Lim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(136,160,1,'00124','Pisey Lim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(137,161,2,'00125','Sreynich Lim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(138,162,1,'00126','Malen Lim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(139,163,2,'00127','Boromey Lim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(140,164,1,'00128','Monyneath Lim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(141,165,2,'00129','Thida Lim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(142,166,1,'00130','Yurik Lim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(143,167,2,'00131','Lyka Lim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(144,168,1,'00132','Lina Chea',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(145,169,2,'00133','Linda Chea',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(146,170,1,'00134','Pisey Chea',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(147,171,2,'00135','Sreynich Chea',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(148,172,1,'00136','Malen Chea',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(149,173,2,'00137','Boromey Chea',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(150,174,1,'00138','Monyneath Chea',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(151,175,2,'00139','Thida Chea',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(152,176,1,'00140','Yurik Chea',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(153,177,2,'00141','Lyka Chea',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(154,178,1,'00142','Lina Kim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(155,179,2,'00143','Linda Kim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(156,180,1,'00144','Pisey Kim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(157,181,2,'00145','Sreynich Kim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(158,182,1,'00146','Malen Kim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(159,183,2,'00147','Boromey Kim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(160,184,1,'00148','Monyneath Kim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(161,185,2,'00149','Thida Kim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(162,186,1,'00150','Yurik Kim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(163,187,2,'00151','Lyka Kim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(164,188,1,'00152','Lina Heng',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(165,189,2,'00153','Linda Heng',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(166,190,1,'00154','Pisey Heng',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(167,191,2,'00155','Sreynich Heng',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(168,192,1,'00156','Malen Heng',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(169,193,2,'00157','Boromey Heng',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(170,194,1,'00158','Monyneath Heng',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(171,195,2,'00159','Thida Heng',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(172,196,1,'00160','Yurik Heng',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(173,197,2,'00161','Lyka Heng',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(174,198,1,'00162','Lina Leang',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(175,199,2,'00163','Linda Leang',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(176,200,1,'00164','Pisey Leang',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(177,201,2,'00165','Sreynich Leang',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(178,202,1,'00166','Malen Leang',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(179,203,2,'00167','Boromey Leang',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(180,204,1,'00168','Monyneath Leang',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(181,205,2,'00169','Thida Leang',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(182,206,1,'00170','Yurik Leang',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(183,207,2,'00171','Lyka Leang',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(184,208,1,'00172','Lina Kong',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(185,209,2,'00173','Linda Kong',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(186,210,1,'00174','Pisey Kong',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(187,211,2,'00175','Sreynich Kong',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(188,212,1,'00176','Malen Kong',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(189,213,2,'00177','Boromey Kong',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(190,214,1,'00178','Monyneath Kong',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(191,215,2,'00179','Thida Kong',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(192,216,1,'00180','Yurik Kong',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(193,217,2,'00181','Lyka Kong',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(194,218,1,'00182','Lina Yim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(195,219,2,'00183','Linda Yim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(196,220,1,'00184','Pisey Yim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(197,221,2,'00185','Sreynich Yim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(198,222,1,'00186','Malen Yim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(199,223,2,'00187','Boromey Yim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(200,224,1,'00188','Monyneath Yim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(201,225,2,'00189','Thida Yim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(202,226,1,'00190','Yurik Yim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(203,227,2,'00191','Lyka Yim',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(204,228,1,'00192','Lina senghor',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(205,229,2,'00193','Linda senghor',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(206,230,1,'00194','Pisey senghor',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(207,231,2,'00195','Sreynich senghor',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(208,232,1,'00196','Malen senghor',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(209,233,2,'00197','Boromey senghor',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(210,234,1,'00198','Monyneath senghor',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(211,235,2,'00199','Thida senghor',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(212,236,1,'00200','Yurik senghor',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(213,237,2,'00201','Lyka senghor',NULL,NULL,'2026-11-16 08:39:48','2026-11-16 08:39:48','2026-11-16'),(242,265,1,'00202','Sreynich Sok',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(243,266,2,'00203','Lina Chan',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(244,267,1,'00204','Pisey Lim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(245,268,2,'00205','Linda Chea',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(246,269,1,'00206','Malen Kim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(247,270,2,'00207','Boromey Heng',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(248,271,1,'00208','Monyneath Kong',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(249,272,2,'00209','Thida Yim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(250,273,1,'00210','Yurik Ly',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(251,274,2,'00211','Lyka Touch',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(252,275,1,'00212','Sreyleak Sok',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(253,276,2,'00213','Sreypov Chan',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(254,277,1,'00214','Chansopheak Lim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(255,278,2,'00215','Pichmony Chea',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(256,279,1,'00216','Kunthea Kim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(257,280,2,'00217','Sopheary Heng',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(258,281,1,'00218','Monyka Kong',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(259,282,2,'00219','Sreyneth Yim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(260,283,1,'00220','Malis Ly',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(261,284,2,'00221','Chariya Touch',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(262,285,1,'00222','Davy Sok',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(263,286,2,'00223','Sokunthea Chan',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(264,287,1,'00224','Sreysros Lim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(265,288,2,'00225','Rachana Chea',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(266,289,1,'00226','Pichsophea Kim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(267,290,2,'00227','Neary Heng',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(268,291,1,'00228','Sreynita Kong',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(269,292,2,'00229','Chansreymom Yim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(270,293,1,'00230','Maly Ly',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(271,294,2,'00231','Sreypich song',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(272,295,1,'00232','Sreynich Sok',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(273,296,2,'00233','Lina Chan',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(274,297,1,'00234','Pisey Lim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(275,298,2,'00235','Linda Chea',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(276,299,1,'00236','Malen Kim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(277,300,2,'00237','Boromey Heng',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(278,301,1,'00238','Monyneath Kong',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(279,302,2,'00239','Thida Yim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(280,303,1,'00240','Yurik Ly',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(281,304,2,'00241','Lyka Touch',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(282,305,1,'00242','Sreyleak Sok',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(283,306,2,'00243','Sreypov Chan',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(284,307,1,'00244','Chansopheak Lim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(285,308,2,'00245','Pichmony Chea',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(286,309,1,'00246','Kunthea Kim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(287,310,2,'00247','Sopheary Heng',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(288,311,1,'00248','Monyka Kong',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(289,312,2,'00249','Sreyneth Yim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(290,313,1,'00250','Malis Ly',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(291,314,2,'00251','Chariya Touch',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(292,315,1,'00252','Davy Sok',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(293,316,2,'00253','Sokunthea Chan',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(294,317,1,'00254','Sreysros Lim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(295,318,2,'00255','Rachana Chea',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(296,319,1,'00256','Pichsophea Kim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(297,320,2,'00257','Neary Heng',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(298,321,1,'00258','Sreynita Kong',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(299,322,2,'00259','Chansreymom Yim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(300,323,1,'00260','Maly Ly',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(301,324,2,'00261','Sreypich song',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(302,325,1,'00262','Sreynich Sok',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(303,326,2,'00263','Lina Chan',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(304,327,1,'00264','Pisey Lim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(305,328,2,'00265','Linda Chea',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(306,329,1,'00266','Malen Kim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(307,330,2,'00267','Boromey Heng',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(308,331,1,'00268','Monyneath Kong',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(309,332,2,'00269','Thida Yim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(310,333,1,'00270','Yurik Ly',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(311,334,2,'00271','Lyka Touch',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(312,335,1,'00272','Sreyleak Sok',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(313,336,2,'00273','Sreypov Chan',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(314,337,1,'00274','Chansopheak Lim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(315,338,2,'00275','Pichmony Chea',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(316,339,1,'00276','Kunthea Kim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(317,340,2,'00277','Sopheary Heng',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(318,341,1,'00278','Monyka Kong',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(319,342,2,'00279','Sreyneth Yim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(320,343,1,'00280','Malis Ly',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(321,344,2,'00281','Chariya Touch',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(322,345,1,'00282','Davy Sok',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(323,346,2,'00283','Sokunthea Chan',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(324,347,1,'00284','Sreysros Lim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(325,348,2,'00285','Rachana Chea',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(326,349,1,'00286','Pichsophea Kim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(327,350,2,'00287','Neary Heng',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(328,351,1,'00288','Sreynita Kong',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(329,352,2,'00289','Chansreymom Yim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(330,353,1,'00290','Maly Ly',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(331,354,2,'00291','Sreypich song',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(332,355,1,'00292','Sreynich Sok',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(333,356,2,'00293','Lina Chan',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(334,357,1,'00294','Pisey Lim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(335,358,2,'00295','Linda Chea',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(336,359,1,'00296','Malen Kim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(337,360,2,'00297','Boromey Heng',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(338,361,1,'00298','Monyneath Kong',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(339,362,2,'00299','Thida Yim',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(340,363,1,'00300','Yurik Ly',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17'),(341,364,2,'00301','Lyka Touch',NULL,NULL,'2026-11-17 08:00:32','2026-11-17 08:00:32','2026-11-17');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `department_id` bigint unsigned NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credits` tinyint unsigned NOT NULL DEFAULT '3',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subjects_code_unique` (`code`),
  KEY `subjects_department_id_foreign` (`department_id`),
  CONSTRAINT `subjects_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (1,1,'SE001','Software Engineering',10,'ACTIVE','2026-11-11 18:26:44','2026-11-11 18:26:44'),(2,1,'MB002','Mobile Application',10,'ACTIVE','2026-11-13 00:23:12','2026-11-15 22:35:00'),(3,1,'WS003','Windown Server',10,'ACTIVE','2026-11-13 00:23:59','2026-11-13 00:23:59'),(4,1,'MIS004','Management Information System',10,'ACTIVE','2026-11-13 00:24:58','2026-11-13 00:24:58'),(5,1,'OOAD005','Object Oriendted Analists and Design',10,'ACTIVE','2026-11-13 00:25:44','2026-11-13 00:25:44');
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timetables`
--

DROP TABLE IF EXISTS `timetables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timetables` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `class_subject_id` bigint unsigned NOT NULL,
  `day_of_week` tinyint unsigned NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `room` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `timetables_class_subject_id_day_of_week_index` (`class_subject_id`,`day_of_week`),
  CONSTRAINT `timetables_class_subject_id_foreign` FOREIGN KEY (`class_subject_id`) REFERENCES `class_subjects` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timetables`
--

LOCK TABLES `timetables` WRITE;
/*!40000 ALTER TABLE `timetables` DISABLE KEYS */;
INSERT INTO `timetables` VALUES (3,3,1,'07:45:00','09:00:00','Room A101','2026-11-13 01:45:54','2026-11-15 22:22:37'),(4,2,1,'14:00:00','15:30:00','Room A101','2026-11-13 01:47:22','2026-11-15 22:26:48'),(5,1,1,'09:15:00','10:45:00','Room A101','2026-11-13 01:48:12','2026-11-15 22:25:42'),(6,4,1,'17:30:00','19:00:00','001','2026-11-15 22:28:29','2026-11-15 22:28:44'),(7,5,1,'19:15:00','20:30:00','001','2026-11-15 22:30:31','2026-11-15 22:30:31'),(8,3,2,'07:45:00','09:00:00','002','2026-11-15 22:32:55','2026-11-15 22:32:55'),(9,2,3,'07:45:00','09:00:00','003','2026-11-15 22:34:17','2026-11-15 22:36:36'),(10,4,4,'07:45:00','09:00:00','004','2026-11-15 22:36:09','2026-11-15 22:36:21'),(11,5,5,'07:45:00','09:00:00',NULL,'2026-11-15 22:37:17','2026-11-15 22:37:17'),(12,1,6,'07:45:00','09:00:00',NULL,'2026-11-15 22:39:23','2026-11-15 22:39:23');
/*!40000 ALTER TABLE `timetables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `role` enum('SUPER_ADMIN','ADMIN','LECTURER','STUDENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STUDENT',
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_index` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=393 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Moa Sovann','moa.sovann@usams.edu.kh',NULL,'$2y$12$XBxr7.z3QGV82on.IBoEQ.MaCvWL71IVeLnxCRG09/EDLzYMq99Jy',NULL,'2026-10-28 21:23:53','2026-11-11 01:05:53','SUPER_ADMIN','ACTIVE',NULL),(2,'Super Admin','adminsenghor@gmail.com',NULL,'$2y$12$eWZqBfg6DzPuIon/Utt7bO/oNry7uJcizFiKvj6U2k2hIuWz.DtaW',NULL,'2026-11-11 00:55:51','2026-11-11 00:55:51','SUPER_ADMIN','ACTIVE',NULL),(3,'Sok Dara','dara.sok@usams.edu.kh',NULL,'$2y$12$K.I0w7r6J9z8X5v4B3n2M.eQ1w2E3r4T5y6U7i8O9p0A1s2D3f4G5',NULL,'2026-11-11 08:00:55','2026-11-11 08:00:55','LECTURER','ACTIVE',NULL),(4,'Chan Bopha','bopha.chan@usams.edu.kh',NULL,'$2y$12$K.I0w7r6J9z8X5v4B3n2M.eQ1w2E3r4T5y6U7i8O9p0A1s2D3f4G5',NULL,'2026-11-11 08:00:55','2026-11-11 08:00:55','LECTURER','ACTIVE',NULL),(5,'Keo Visal','visal.keo@usams.edu.kh',NULL,'$2y$12$K.I0w7r6J9z8X5v4B3n2M.eQ1w2E3r4T5y6U7i8O9p0A1s2D3f4G5',NULL,'2026-11-11 08:00:55','2026-11-11 08:00:55','LECTURER','ACTIVE',NULL),(6,'Ly Sreymom','sreymom.ly@usams.edu.kh',NULL,'$2y$12$K.I0w7r6J9z8X5v4B3n2M.eQ1w2E3r4T5y6U7i8O9p0A1s2D3f4G5',NULL,'2026-11-11 08:00:55','2026-11-11 08:00:55','LECTURER','ACTIVE',NULL),(7,'Heng Rithy','rithy.heng@usams.edu.kh',NULL,'$2y$12$K.I0w7r6J9z8X5v4B3n2M.eQ1w2E3r4T5y6U7i8O9p0A1s2D3f4G5',NULL,'2026-11-11 08:00:55','2026-11-11 20:36:27','LECTURER','INACTIVE',NULL),(8,'Chea Bunna','bunna.chea@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:03:37','2026-11-11 08:03:37','LECTURER','ACTIVE',NULL),(9,'Meas Sopheak','sopheak.meas@usams.edu.kh',NULL,'$2y$12$jfRIoQ2YPPXTkAQnJSPxU.9GzgK9LrzNO2kxs6azWIDvRxrl8FyMa',NULL,'2026-11-11 08:03:37','2026-11-14 20:19:10','LECTURER','ACTIVE',NULL),(10,'Nhem Rady','rady.nhem@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:03:37','2026-11-11 08:03:37','LECTURER','ACTIVE',NULL),(11,'Ouk Chanthou','chanthou.ouk@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:03:37','2026-11-11 08:03:37','LECTURER','ACTIVE',NULL),(12,'Phan Vanna','vanna.phan@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:03:37','2026-11-11 08:03:37','LECTURER','ACTIVE',NULL),(13,'Ros Samnang','samnang.ros@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51','LECTURER','ACTIVE',NULL),(14,'Seng Kanha','kanha.seng@usams.edu.kh',NULL,'$2y$12$RXkDrapx0ERC5LX9yZXIpOsJEgXp0oN20.ZfLmlloMXZ6o0BUm0QS',NULL,'2026-11-11 08:04:51','2026-11-11 01:27:47','LECTURER','ACTIVE',NULL),(15,'Tep Vibol','vibol.tep@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51','LECTURER','ACTIVE',NULL),(16,'Ung Sophea','sophea.ung@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51','LECTURER','ACTIVE',NULL),(17,'Vong Piseth','piseth.vong@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51','LECTURER','ACTIVE',NULL),(18,'Yim Leakhena','leakhena.yim@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51','LECTURER','ACTIVE',NULL),(19,'Chhay Narith','narith.chhay@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51','LECTURER','ACTIVE',NULL),(20,'Doung Sreypov','sreypov.doung@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51','LECTURER','ACTIVE',NULL),(21,'Eam Kosal','kosal.eam@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51','LECTURER','ACTIVE',NULL),(22,'Hok Thida','thida.hok@usams.edu.kh',NULL,'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',NULL,'2026-11-11 08:04:51','2026-11-11 08:04:51','LECTURER','ACTIVE',NULL),(23,'leang pisey','leangpisey@usame.edu.kh',NULL,'$2y$12$yloCxfWzTtuP92sSEGahOOkTQx4FoiR82WlTud6Ct8xpuWO.6I/tu',NULL,'2026-11-11 22:53:00','2026-11-11 22:53:00','STUDENT','ACTIVE',NULL),(24,'Test Lecturer','lecturer@usams.edu.kh',NULL,'$2y$12$AKQSBiwJI6X7FXY7HiTgJe5EPLDNk2/h9qo178P/ZgpxGrDqTdLPa',NULL,'2026-11-11 23:49:52','2026-11-11 23:49:52','STUDENT','ACTIVE',NULL),(25,'lem senghor','lemsenghor@usams.edu.kh',NULL,'$2y$12$M7C3vtdi2l9elTfmguX6meQ/5IGFS0.B7QZxN14Ew7gV48Rl9KAJu',NULL,'2026-11-12 19:01:01','2026-11-12 19:01:01','STUDENT','ACTIVE',NULL),(26,'Sovan yurik','sovanyurik@usams.edu.kd',NULL,'$2y$12$jWW6g1BqX0OswYndc2AMKu0g1Jly38b6/xHXc3nBMR6YR.MNocztC',NULL,'2026-11-12 23:16:02','2026-11-12 23:16:02','STUDENT','ACTIVE',NULL),(27,'leang sodalin','leangsodalin@usams.edu.kh',NULL,'$2y$12$aBT0/zhA/RUfDi3T70.7Y.zLO2KypDX5vz4eG.8Nq0pYDE.7XnDZO',NULL,'2026-11-16 00:04:23','2026-11-16 00:04:23','STUDENT','ACTIVE',NULL),(28,'Dara Sok','student00004@usams.edu.kh',NULL,'$2y$12$hbCbEFD31AA/MqtotYH6E.K0x1yU5h1EgvhcrR9bjxFaqnnaxvy4i',NULL,'2026-11-16 00:08:41','2026-11-16 00:08:41','STUDENT','ACTIVE',NULL),(29,'Sopheak Sok','student00005@usams.edu.kh',NULL,'$2y$12$7ciwKTfnljkJphQ8dSE1JuqSXr44fo41PVEPTPg2FNrFh6R9FQuGS',NULL,'2026-11-16 00:08:41','2026-11-16 00:08:41','STUDENT','ACTIVE',NULL),(30,'Vannak Sok','student00006@usams.edu.kh',NULL,'$2y$12$76iBVHOSmVvEnfEoFCUtNeK.lVWQELT2P7CnEun8c7EcCkbaFwd.O',NULL,'2026-11-16 00:08:42','2026-11-16 00:08:42','STUDENT','ACTIVE',NULL),(31,'Ratha Sok','student00007@usams.edu.kh',NULL,'$2y$12$6GcvmoWvI3S3zJW6ZIp9lOM/llY0O82jz7gQZtWu3OWwytdl0AO3K',NULL,'2026-11-16 00:08:42','2026-11-16 00:08:42','STUDENT','ACTIVE',NULL),(32,'Sreypov Sok','student00008@usams.edu.kh',NULL,'$2y$12$jaGbTL77qPkzy7276hhoLu5zWkvusIIjHerf4FYff73CIiR1g.pvS',NULL,'2026-11-16 00:08:42','2026-11-16 00:08:42','STUDENT','ACTIVE',NULL),(33,'Pisey Sok','student00009@usams.edu.kh',NULL,'$2y$12$v36LSIDuxfhCk364l.KXBetZwz1nFx8zrIhV5su8yXbTOAKIM/SKW',NULL,'2026-11-16 00:08:42','2026-11-16 00:08:42','STUDENT','ACTIVE',NULL),(34,'Chenda Sok','student00010@usams.edu.kh',NULL,'$2y$12$JBDyV3mVjrb4aeJzaGkHMOOUcqHW8wsT5YoQ7XbCpB6nh8fa7kM2y',NULL,'2026-11-16 00:08:42','2026-11-16 00:08:42','STUDENT','ACTIVE',NULL),(35,'Dara Chan','student00011@usams.edu.kh',NULL,'$2y$12$Mawd6oddqHx5ZcA.5dcbfuGKniyfUr/LG8MTod.Fjomqy1tcDcXXC',NULL,'2026-11-16 00:08:43','2026-11-16 00:08:43','STUDENT','ACTIVE',NULL),(36,'Sopheak Chan','student00012@usams.edu.kh',NULL,'$2y$12$N1WgPv//Uu87nmvJ4Cpz0Og92iJyJ3WdbDG8QujbWpFp6/W7pSovm',NULL,'2026-11-16 00:08:43','2026-11-16 00:08:43','STUDENT','ACTIVE',NULL),(37,'Vannak Chan','student00013@usams.edu.kh',NULL,'$2y$12$uf9HY4TxYqIMKZIW.8jOYOprjj3JrLb9isd3wUTxtvxXExt7WoAAG',NULL,'2026-11-16 00:08:43','2026-11-16 00:08:43','STUDENT','ACTIVE',NULL),(38,'Ratha Chan','student00014@usams.edu.kh',NULL,'$2y$12$XeReMemoCethVzdKUTqUZuKm/SH6ZFdU4gK/KLO3tr6TaY5eCAqTK',NULL,'2026-11-16 00:08:43','2026-11-16 00:08:43','STUDENT','ACTIVE',NULL),(39,'Sreypov Chan','student00015@usams.edu.kh',NULL,'$2y$12$hfaddxoWQixOw/Vk2W7uaeTnRNoTUUJg88g7lf.GDcWsavF6gxi3.',NULL,'2026-11-16 00:08:43','2026-11-16 00:08:43','STUDENT','ACTIVE',NULL),(40,'Pisey Chan','student00016@usams.edu.kh',NULL,'$2y$12$C06eAXb3oLmhAS5JNbrb9ORCzawxohAETZ51OAM1f3IFKAMDqw35K',NULL,'2026-11-16 00:08:44','2026-11-16 00:08:44','STUDENT','ACTIVE',NULL),(41,'Chenda Chan','student00017@usams.edu.kh',NULL,'$2y$12$ZTNn9lSpvlNwVNBXsW2I5.lMAkVagjb2lrDtOh2jz7K9f8O32bJzK',NULL,'2026-11-16 00:08:44','2026-11-16 00:08:44','STUDENT','ACTIVE',NULL),(42,'Dara Lim','student00018@usams.edu.kh',NULL,'$2y$12$76drwviVN9shVqEYktod7uZmgyYb/BL4WH9FgEiowp8TrWiYFJwoi',NULL,'2026-11-16 00:08:44','2026-11-16 00:08:44','STUDENT','ACTIVE',NULL),(43,'Sopheak Lim','student00019@usams.edu.kh',NULL,'$2y$12$plDardfq0it6qX7GSVa0fOrf8aHK3gxmF2vWPk40wu7/eRy/wDVlC',NULL,'2026-11-16 00:08:44','2026-11-16 00:08:44','STUDENT','ACTIVE',NULL),(44,'Vannak Lim','student00020@usams.edu.kh',NULL,'$2y$12$z8H.Dmtuc41oVpnQLHKbceswhmDU5vCfqrzw69pkNYIg3Y9LYwu0O',NULL,'2026-11-16 00:08:44','2026-11-16 00:08:44','STUDENT','ACTIVE',NULL),(45,'Ratha Lim','student00021@usams.edu.kh',NULL,'$2y$12$cyNUXozEehSufqukoq5vyO0sl2hXvRwgQnYmojm10fYq/BO2baYkW',NULL,'2026-11-16 00:08:45','2026-11-16 00:08:45','STUDENT','ACTIVE',NULL),(46,'Sreypov Lim','student00022@usams.edu.kh',NULL,'$2y$12$WPBIiNdcss9B/0Xhm4XECOw6j2V2HEeP88srehRGlbRMCq5NdLUXu',NULL,'2026-11-16 00:08:45','2026-11-16 00:08:45','STUDENT','ACTIVE',NULL),(47,'Pisey Lim','student00023@usams.edu.kh',NULL,'$2y$12$BpQHjWG2Km2WniXI/lei4eHrF0vVoBaYJJWmGYZbhpKyOdd.ceiw6',NULL,'2026-11-16 00:08:45','2026-11-16 00:08:45','STUDENT','ACTIVE',NULL),(48,'Chenda Lim','student00024@usams.edu.kh',NULL,'$2y$12$WffGExcxXC71HySSXJgfZuaE02uecxIfxsuyvUGtKrf9dyOI/84qW',NULL,'2026-11-16 00:08:45','2026-11-16 00:08:45','STUDENT','ACTIVE',NULL),(49,'Dara Chea','student00025@usams.edu.kh',NULL,'$2y$12$S.x9mpkZ5BXecaaaIMAG5.CByhINBC8gkDryN9dpK.WMuj5MXzD7.',NULL,'2026-11-16 00:08:45','2026-11-16 00:08:45','STUDENT','ACTIVE',NULL),(50,'Sopheak Chea','student00026@usams.edu.kh',NULL,'$2y$12$KWuu/DwJPbweSA87aNaLEu6dsov4FBsOrsPwPwCsFc6OdZ6..aaZ.',NULL,'2026-11-16 00:08:45','2026-11-16 00:08:45','STUDENT','ACTIVE',NULL),(51,'Vannak Chea','student00027@usams.edu.kh',NULL,'$2y$12$UKVFctlAcb6lt/u2djwBheKjuXRyI84y7OJ6DM1pEbHeivbRBHisi',NULL,'2026-11-16 00:08:46','2026-11-16 00:08:46','STUDENT','ACTIVE',NULL),(52,'Ratha Chea','student00028@usams.edu.kh',NULL,'$2y$12$NkCi7SulH/bJXZ0h8NDlIuo0iD3kHVFD8XZm2/1QGbIZdZbK.XmQS',NULL,'2026-11-16 00:08:46','2026-11-16 00:08:46','STUDENT','ACTIVE',NULL),(53,'Sreypov Chea','student00029@usams.edu.kh',NULL,'$2y$12$S6apLY0iyWilEFsgePdeUeunk5BsjgpLYZKgsPLcfi8w0MFd0ZNxu',NULL,'2026-11-16 00:08:46','2026-11-16 00:08:46','STUDENT','ACTIVE',NULL),(54,'Pisey Chea','student00030@usams.edu.kh',NULL,'$2y$12$j6A/WCMP0fe3MIyDmAHApem1oo90f7jBpn/OmzoOaLlIlgmM.gqcm',NULL,'2026-11-16 00:08:46','2026-11-16 00:08:46','STUDENT','ACTIVE',NULL),(55,'Chenda Chea','student00031@usams.edu.kh',NULL,'$2y$12$aG89W78TmfbGpl7WnMDiZukgXQnXQewPn5eip9F4WwkJMqT2ebYbe',NULL,'2026-11-16 00:08:46','2026-11-16 00:08:46','STUDENT','ACTIVE',NULL),(56,'Dara Kim','student00032@usams.edu.kh',NULL,'$2y$12$rOhMm2BtorE9vidhyRRT0OQKa3vSTpFvKFsyv2jS4HmpDloT2vhHa',NULL,'2026-11-16 00:08:47','2026-11-16 00:08:47','STUDENT','ACTIVE',NULL),(57,'Sopheak Kim','student00033@usams.edu.kh',NULL,'$2y$12$Lj5WuEaOPKFgn60pqpi5.Okm07Z2oHNd1ErlG8p8u8FR4jNR9uFtW',NULL,'2026-11-16 00:08:47','2026-11-16 00:08:47','STUDENT','ACTIVE',NULL),(58,'Vannak Kim','student00034@usams.edu.kh',NULL,'$2y$12$4IlT7fhW.jtQDLJwKDXT6Or8Sfow7xQVd9Zru8yufJ.U2I0V44/Dm',NULL,'2026-11-16 00:08:47','2026-11-16 00:08:47','STUDENT','ACTIVE',NULL),(59,'Ratha Kim','student00035@usams.edu.kh',NULL,'$2y$12$VQIltagD8IlQWSrHxZHjge7Ke5oQyO85EkA6Dzm0Sqjcmbg9scnDy',NULL,'2026-11-16 00:08:47','2026-11-16 00:08:47','STUDENT','ACTIVE',NULL),(60,'Sreypov Kim','student00036@usams.edu.kh',NULL,'$2y$12$2KtJwdA1gPiJHdg8NL2nPOA8HJ2K4wpCxQt5eGkTRDBxHZv22OcO6',NULL,'2026-11-16 00:08:47','2026-11-16 00:08:47','STUDENT','ACTIVE',NULL),(61,'Pisey Kim','student00037@usams.edu.kh',NULL,'$2y$12$EsMeTXYG0Ytq.VSfUK71ieZdKmtDg6qfBSAbt2bOw5UpDo5o1Arjy',NULL,'2026-11-16 00:08:48','2026-11-16 00:08:48','STUDENT','ACTIVE',NULL),(62,'Chenda Kim','student00038@usams.edu.kh',NULL,'$2y$12$Pu1a0pVw0AKZnFODxatPFOSlIQfgmt4o18V0o//kPKfQn6PKQw3au',NULL,'2026-11-16 00:08:48','2026-11-16 00:08:48','STUDENT','ACTIVE',NULL),(63,'Dara Heng','student00039@usams.edu.kh',NULL,'$2y$12$B3jgLSUEnVvXRIUMMpHxXexEO0Cu1VhqK4/s/oA8bZRbmTWvwaks6',NULL,'2026-11-16 00:08:48','2026-11-16 00:08:48','STUDENT','ACTIVE',NULL),(64,'Sopheak Heng','student00040@usams.edu.kh',NULL,'$2y$12$E1UYCKhG3OA1ayKKwWVNcOgj1.HnGndAL9QTfmXeLBMACVbjnkvgG',NULL,'2026-11-16 00:08:48','2026-11-16 00:08:48','STUDENT','ACTIVE',NULL),(65,'Vannak Heng','student00041@usams.edu.kh',NULL,'$2y$12$vv95TIAQJIwwoOcYWpTLy.iY9PN5SsKtfUQApXLFz.5mI/JF1USDy',NULL,'2026-11-16 00:08:48','2026-11-16 00:08:48','STUDENT','ACTIVE',NULL),(66,'Ratha Heng','student00042@usams.edu.kh',NULL,'$2y$12$sHRetumFJrAtdxaj5uCj.e1WDl2lSC4WfaHsgg4gpDhyadZg3BDEC',NULL,'2026-11-16 00:08:49','2026-11-16 00:08:49','STUDENT','ACTIVE',NULL),(67,'Sreypov Heng','student00043@usams.edu.kh',NULL,'$2y$12$H5dY/n0pMyJUezR8/obRk.yK6yePygaLKK5fSeTAyUFhJSWJHNvD6',NULL,'2026-11-16 00:08:49','2026-11-16 00:08:49','STUDENT','ACTIVE',NULL),(68,'Pisey Heng','student00044@usams.edu.kh',NULL,'$2y$12$HvI6..ar8Fl9SlnowNjzhuS5Sk2spR2D6JN6vksHTXeRu6E/uujzS',NULL,'2026-11-16 00:08:49','2026-11-16 00:08:49','STUDENT','ACTIVE',NULL),(69,'Chenda Heng','student00045@usams.edu.kh',NULL,'$2y$12$xbPF9liatluib/8z3HSIM.oAUMMSf5JpB/QUwZ0wbeq2eOcv6nDmu',NULL,'2026-11-16 00:08:49','2026-11-16 00:08:49','STUDENT','ACTIVE',NULL),(70,'Dara Phan','student00046@usams.edu.kh',NULL,'$2y$12$MZNl4X4CoPJoj9YRjOv2EuqR0P11WyDnujH./abzfiAD7iaaaJ7Om',NULL,'2026-11-16 00:08:49','2026-11-16 00:08:49','STUDENT','ACTIVE',NULL),(71,'Sopheak Phan','student00047@usams.edu.kh',NULL,'$2y$12$yx7QwgmTmMpZCinIq.p6fOUiECj5LV1I3GqM5wpEtU9c7imzOUIku',NULL,'2026-11-16 00:08:50','2026-11-16 00:08:50','STUDENT','ACTIVE',NULL),(72,'Vannak Phan','student00048@usams.edu.kh',NULL,'$2y$12$eN470JEAI4wkOAScurnX8eqIJqsYObZQ1DskaoX1OSBsxLLhA9Fcy',NULL,'2026-11-16 00:08:50','2026-11-16 00:08:50','STUDENT','ACTIVE',NULL),(73,'Ratha Phan','student00049@usams.edu.kh',NULL,'$2y$12$muBsun5bf7SnqT7enZV3MuIvWVQysZ3UBYQ7NFs1O3E/oO6.46ArO',NULL,'2026-11-16 00:08:50','2026-11-16 00:08:50','STUDENT','ACTIVE',NULL),(74,'Sreypov Phan','student00050@usams.edu.kh',NULL,'$2y$12$zjNRARGHg1Y3Y/67WYs1yO.x/z90q.kv5SuIPN/ND9cXLJ31CWr/.',NULL,'2026-11-16 00:08:50','2026-11-16 00:08:50','STUDENT','ACTIVE',NULL),(75,'Dara Sok','student00051@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(76,'Sopheak Sok','student00052@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(77,'Vannak Sok','student00053@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(78,'Ratha Sok','student00054@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(79,'Pisey Sok','student00055@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(80,'Chenda Sok','student00056@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(81,'Makara Sok','student00057@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(82,'Bopha Sok','student00058@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(83,'Sothea Sok','student00059@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(84,'Rithy Sok','student00060@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(85,'Dara Chan','student00061@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(86,'Sopheak Chan','student00062@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(87,'Vannak Chan','student00063@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(88,'Ratha Chan','student00064@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(89,'Pisey Chan','student00065@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(90,'Chenda Chan','student00066@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(91,'Makara Chan','student00067@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(92,'Bopha Chan','student00068@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(93,'Sothea Chan','student00069@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(94,'Rithy Chan','student00070@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(95,'Dara Lim','student00071@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(96,'Sopheak Lim','student00072@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(97,'Vannak Lim','student00073@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(98,'Ratha Lim','student00074@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(99,'Pisey Lim','student00075@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(100,'Chenda Lim','student00076@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(101,'Makara Lim','student00077@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(102,'Bopha Lim','student00078@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(103,'Sothea Lim','student00079@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(104,'Rithy Lim','student00080@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(105,'Dara Chea','student00081@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(106,'Sopheak Chea','student00082@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(107,'Vannak Chea','student00083@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(108,'Ratha Chea','student00084@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(109,'Pisey Chea','student00085@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(110,'Chenda Chea','student00086@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(111,'Makara Chea','student00087@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(112,'Bopha Chea','student00088@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(113,'Sothea Chea','student00089@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(114,'Rithy Chea','student00090@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(115,'Dara Kim','student00091@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(116,'Sopheak Kim','student00092@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(117,'Vannak Kim','student00093@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(118,'Ratha Kim','student00094@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(119,'Pisey Kim','student00095@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(120,'Chenda Kim','student00096@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(121,'Makara Kim','student00097@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(122,'Bopha Kim','student00098@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(123,'Sothea Kim','student00099@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(124,'Rithy Kim','student00100@usams.edu.kh',NULL,'PASTE_BCRYPT_HASH_HERE',NULL,'2026-11-16 07:31:05','2026-11-16 07:31:05','STUDENT','ACTIVE',NULL),(138,'Lina Sok','student00102@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(139,'Linda Sok','student00103@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(140,'Pisey Sok','student00104@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(141,'Sreynich Sok','student00105@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(142,'Malen Sok','student00106@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(143,'Boromey Sok','student00107@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(144,'Monyneath Sok','student00108@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(145,'Thida Sok','student00109@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(146,'Yurik Sok','student00110@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(147,'Lyka Sok','student00111@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(148,'Lina Chan','student00112@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(149,'Linda Chan','student00113@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(150,'Pisey Chan','student00114@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(151,'Sreynich Chan','student00115@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(152,'Malen Chan','student00116@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(153,'Boromey Chan','student00117@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(154,'Monyneath Chan','student00118@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(155,'Thida Chan','student00119@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(156,'Yurik Chan','student00120@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(157,'Lyka Chan','student00121@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(158,'Lina Lim','student00122@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(159,'Linda Lim','student00123@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(160,'Pisey Lim','student00124@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(161,'Sreynich Lim','student00125@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(162,'Malen Lim','student00126@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(163,'Boromey Lim','student00127@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(164,'Monyneath Lim','student00128@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(165,'Thida Lim','student00129@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(166,'Yurik Lim','student00130@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(167,'Lyka Lim','student00131@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(168,'Lina Chea','student00132@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(169,'Linda Chea','student00133@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(170,'Pisey Chea','student00134@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(171,'Sreynich Chea','student00135@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(172,'Malen Chea','student00136@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(173,'Boromey Chea','student00137@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(174,'Monyneath Chea','student00138@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(175,'Thida Chea','student00139@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(176,'Yurik Chea','student00140@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(177,'Lyka Chea','student00141@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(178,'Lina Kim','student00142@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(179,'Linda Kim','student00143@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(180,'Pisey Kim','student00144@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(181,'Sreynich Kim','student00145@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(182,'Malen Kim','student00146@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(183,'Boromey Kim','student00147@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(184,'Monyneath Kim','student00148@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(185,'Thida Kim','student00149@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(186,'Yurik Kim','student00150@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(187,'Lyka Kim','student00151@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(188,'Lina Heng','student00152@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(189,'Linda Heng','student00153@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(190,'Pisey Heng','student00154@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(191,'Sreynich Heng','student00155@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(192,'Malen Heng','student00156@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(193,'Boromey Heng','student00157@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(194,'Monyneath Heng','student00158@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(195,'Thida Heng','student00159@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(196,'Yurik Heng','student00160@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(197,'Lyka Heng','student00161@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(198,'Lina Leang','student00162@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(199,'Linda Leang','student00163@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(200,'Pisey Leang','student00164@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(201,'Sreynich Leang','student00165@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(202,'Malen Leang','student00166@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(203,'Boromey Leang','student00167@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(204,'Monyneath Leang','student00168@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(205,'Thida Leang','student00169@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(206,'Yurik Leang','student00170@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(207,'Lyka Leang','student00171@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(208,'Lina Kong','student00172@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(209,'Linda Kong','student00173@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(210,'Pisey Kong','student00174@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(211,'Sreynich Kong','student00175@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(212,'Malen Kong','student00176@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(213,'Boromey Kong','student00177@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(214,'Monyneath Kong','student00178@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(215,'Thida Kong','student00179@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(216,'Yurik Kong','student00180@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(217,'Lyka Kong','student00181@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(218,'Lina Yim','student00182@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(219,'Linda Yim','student00183@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(220,'Pisey Yim','student00184@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(221,'Sreynich Yim','student00185@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(222,'Malen Yim','student00186@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(223,'Boromey Yim','student00187@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(224,'Monyneath Yim','student00188@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(225,'Thida Yim','student00189@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(226,'Yurik Yim','student00190@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(227,'Lyka Yim','student00191@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(228,'Lina senghor','student00192@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(229,'Linda senghor','student00193@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(230,'Pisey senghor','student00194@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(231,'Sreynich senghor','student00195@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(232,'Malen senghor','student00196@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(233,'Boromey senghor','student00197@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(234,'Monyneath senghor','student00198@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(235,'Thida senghor','student00199@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(236,'Yurik senghor','student00200@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(237,'Lyka senghor','student00201@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-16 08:39:30','2026-11-16 08:39:30','STUDENT','ACTIVE',NULL),(265,'Sreynich Sok','student00202@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(266,'Lina Chan','student00203@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(267,'Pisey Lim','student00204@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(268,'Linda Chea','student00205@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(269,'Malen Kim','student00206@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(270,'Boromey Heng','student00207@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(271,'Monyneath Kong','student00208@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(272,'Thida Yim','student00209@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(273,'Yurik Ly','student00210@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(274,'Lyka Touch','student00211@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(275,'Sreyleak Sok','student00212@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(276,'Sreypov Chan','student00213@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(277,'Chansopheak Lim','student00214@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(278,'Pichmony Chea','student00215@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(279,'Kunthea Kim','student00216@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(280,'Sopheary Heng','student00217@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(281,'Monyka Kong','student00218@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(282,'Sreyneth Yim','student00219@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(283,'Malis Ly','student00220@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(284,'Chariya Touch','student00221@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(285,'Davy Sok','student00222@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(286,'Sokunthea Chan','student00223@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(287,'Sreysros Lim','student00224@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(288,'Rachana Chea','student00225@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(289,'Pichsophea Kim','student00226@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(290,'Neary Heng','student00227@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(291,'Sreynita Kong','student00228@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(292,'Chansreymom Yim','student00229@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(293,'Maly Ly','student00230@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(294,'Sreypich song','student00231@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(295,'Sreynich Sok','student00232@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(296,'Lina Chan','student00233@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(297,'Pisey Lim','student00234@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(298,'Linda Chea','student00235@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(299,'Malen Kim','student00236@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(300,'Boromey Heng','student00237@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(301,'Monyneath Kong','student00238@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(302,'Thida Yim','student00239@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(303,'Yurik Ly','student00240@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(304,'Lyka Touch','student00241@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(305,'Sreyleak Sok','student00242@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(306,'Sreypov Chan','student00243@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(307,'Chansopheak Lim','student00244@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(308,'Pichmony Chea','student00245@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(309,'Kunthea Kim','student00246@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(310,'Sopheary Heng','student00247@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(311,'Monyka Kong','student00248@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(312,'Sreyneth Yim','student00249@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(313,'Malis Ly','student00250@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(314,'Chariya Touch','student00251@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(315,'Davy Sok','student00252@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(316,'Sokunthea Chan','student00253@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(317,'Sreysros Lim','student00254@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(318,'Rachana Chea','student00255@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(319,'Pichsophea Kim','student00256@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(320,'Neary Heng','student00257@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(321,'Sreynita Kong','student00258@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(322,'Chansreymom Yim','student00259@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(323,'Maly Ly','student00260@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(324,'Sreypich song','student00261@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(325,'Sreynich Sok','student00262@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(326,'Lina Chan','student00263@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(327,'Pisey Lim','student00264@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(328,'Linda Chea','student00265@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(329,'Malen Kim','student00266@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(330,'Boromey Heng','student00267@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(331,'Monyneath Kong','student00268@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(332,'Thida Yim','student00269@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(333,'Yurik Ly','student00270@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(334,'Lyka Touch','student00271@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(335,'Sreyleak Sok','student00272@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(336,'Sreypov Chan','student00273@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(337,'Chansopheak Lim','student00274@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(338,'Pichmony Chea','student00275@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(339,'Kunthea Kim','student00276@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(340,'Sopheary Heng','student00277@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(341,'Monyka Kong','student00278@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(342,'Sreyneth Yim','student00279@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(343,'Malis Ly','student00280@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(344,'Chariya Touch','student00281@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(345,'Davy Sok','student00282@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(346,'Sokunthea Chan','student00283@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(347,'Sreysros Lim','student00284@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(348,'Rachana Chea','student00285@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(349,'Pichsophea Kim','student00286@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(350,'Neary Heng','student00287@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(351,'Sreynita Kong','student00288@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(352,'Chansreymom Yim','student00289@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(353,'Maly Ly','student00290@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(354,'Sreypich song','student00291@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(355,'Sreynich Sok','student00292@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(356,'Lina Chan','student00293@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(357,'Pisey Lim','student00294@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(358,'Linda Chea','student00295@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(359,'Malen Kim','student00296@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(360,'Boromey Heng','student00297@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(361,'Monyneath Kong','student00298@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(362,'Thida Yim','student00299@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(363,'Yurik Ly','student00300@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL),(364,'Lyka Touch','student00301@usams.edu.kh',NULL,'PASTE_YOUR_BCRYPT_HASH_HERE',NULL,'2026-11-17 07:59:15','2026-11-17 07:59:15','STUDENT','ACTIVE',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'university_attendance'
--

--
-- Dumping routines for database 'university_attendance'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-18 12:46:55
