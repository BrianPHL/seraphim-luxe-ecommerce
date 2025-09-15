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

-- Dumping structure for table seraphim_luxe.platform_settings
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table seraphim_luxe.platform_settings: ~9 rows (approximately)
INSERT INTO `platform_settings` (`id`, `setting_key`, `setting_value`, `created_at`, `updated_at`) VALUES
	(1, 'payment_cash_on_delivery_enabled', 'true', '2025-09-13 14:01:54', '2025-09-14 12:25:38'),
	(2, 'payment_bank_transfer_enabled', 'true', '2025-09-13 14:01:54', '2025-09-14 12:25:38'),
	(3, 'payment_paypal_enabled', 'true', '2025-09-13 14:01:54', '2025-09-14 12:25:38'),
	(4, 'payment_credit_card_enabled', 'true', '2025-09-13 14:01:54', '2025-09-14 12:25:38'),
	(5, 'currency_PHP_enabled', 'true', '2025-09-13 14:33:40', '2025-09-14 12:25:38'),
	(6, 'currency_USD_enabled', 'true', '2025-09-13 14:33:40', '2025-09-14 12:25:38'),
	(7, 'currency_EUR_enabled', 'true', '2025-09-13 14:33:40', '2025-09-14 12:25:38'),
	(8, 'currency_JPY_enabled', 'true', '2025-09-13 14:33:40', '2025-09-14 12:25:38'),
	(9, 'currency_CAD_enabled', 'true', '2025-09-13 14:33:40', '2025-09-14 12:25:38');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
