-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.5 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table seraphim_luxe.oauth_accounts
CREATE TABLE IF NOT EXISTS `oauth_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `oauth_account_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `provider_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `access_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `refresh_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `scope` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `id_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `access_token_expires_at` timestamp NULL DEFAULT NULL,
  `refresh_token_expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `oauth_accounts_unique` (`provider_id`,`oauth_account_id`),
  KEY `oauth_accounts_provider_id_index` (`provider_id`),
  KEY `oauth_accounts_accounts_id_fkey` (`user_id`),
  CONSTRAINT `oauth_accounts_accounts_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.oauth_accounts: ~1 rows (approximately)
INSERT INTO `oauth_accounts` (`id`, `user_id`, `oauth_account_id`, `provider_id`, `access_token`, `refresh_token`, `scope`, `id_token`, `password`, `access_token_expires_at`, `refresh_token_expires_at`, `created_at`, `updated_at`) VALUES
	(129, 125, '113861719059680368230', 'google', 'ya29.a0AS3H6NwyTrsb-XsnmagpaX5HWeIi-I7DN9mY5aC0ljMqUwjPhUBx1ybOjxAfzVuAvxSYoxQfIgLrPAdJRGQNU3-s_pI9FKVjFskepB1GZuBWblJlE-RXgzrfTRFsERqQKsD-gcobw8tYAiY1QLy4hL6zq6iGiztfnb1Y-sVxxz8ZtfNLiS5oJI2FYLlHlvuedz-kfe-DmAaCgYKAdMSARESFQHGX2MiQVsWDFwEJK9oHyahotELTA0209', NULL, 'https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/userinfo.profile,openid', 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjljNjI1MTU4Nzk1MDg0NGE2NTZiZTM1NjNkOGM1YmQ2Zjg5NGM0MDciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMDg0ODE1MjU2NTQxLXV2dWxtamlrZ20yb2trNTI2cm1wam11MzI0bnMxa2c3LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTA4NDgxNTI1NjU0MS11dnVsbWppa2dtMm9razUyNnJtcGptdTMyNG5zMWtnNy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExMzg2MTcxOTA1OTY4MDM2ODIzMCIsImVtYWlsIjoiYnJpYW5wYXNjbzEyMDZAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJOLTBwQkpkVmd5bEo1ZGlVbTRKV2J3IiwibmFtZSI6IkJyaWFuIFBhc2NvIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0kzLTNTYWZFLTh5dUtGcnFKU2p5NXYzUmIwMU0tWDBEUXFYTUlsTFptZ1lsRzY1WmNxPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IkJyaWFuIiwiZmFtaWx5X25hbWUiOiJQYXNjbyIsImlhdCI6MTc1NzM1MDI5MSwiZXhwIjoxNzU3MzUzODkxfQ.wDH3oGSuamfXQY4kiAq_9Hcui7pB4n4Mq3MK6ftRvIEfdTO4WIuIwu4JZ7r4t2rLCCERjK__mNlo8XyfsZ0X52g1aMxHh0Oaf76aqRZpAxZlMnVATmu4rs2aQCegjtZxXy8c6ABFm6gyNwkP5y3nzjVxXf7DC6SL6s3gP6Nq6zwX2k7rmhN3WSYFcj1W-JFa1rqh-IEAG3epTu9toD-VUNTQzyXdWIJ2z_6rP4DDNjyYN0ZW4su-0cA84LOQuTcEcEfia27t4f3E-tEK7inccTKectpeECHIXgQOvSrGEASvOvYBK1YR-X2KR_GUINCeiAwZQGeGDRx6qqqZQRC9bQ', NULL, '2025-09-08 09:51:31', NULL, '2025-09-08 08:51:32', '2025-09-08 08:51:32');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
