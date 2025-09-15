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

-- Dumping structure for table seraphim_luxe.product_subcategories
CREATE TABLE IF NOT EXISTS `product_subcategories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_subcategory` (`category_id`,`name`),
  CONSTRAINT `product_subcategories_product_categories_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.product_subcategories: ~9 rows (approximately)
INSERT INTO `product_subcategories` (`id`, `category_id`, `name`, `description`, `is_active`, `sort_order`, `created_at`, `modified_at`) VALUES
	(1, 1, 'Bracelets', NULL, 1, 1, '2025-09-03 14:29:17', '2025-09-03 14:29:17'),
	(2, 1, 'Earrings', NULL, 1, 2, '2025-09-03 14:29:17', '2025-09-03 14:29:17'),
	(3, 1, 'Necklaces', NULL, 1, 3, '2025-09-03 14:29:17', '2025-09-10 19:50:50'),
	(4, 2, 'Bracelets', NULL, 1, 1, '2025-09-03 14:29:17', '2025-09-03 14:29:17'),
	(5, 2, 'Earrings', NULL, 1, 2, '2025-09-03 14:29:17', '2025-09-03 14:29:17'),
	(6, 2, 'Necklaces', NULL, 1, 3, '2025-09-03 14:29:17', '2025-09-03 14:29:17'),
	(7, 3, 'Bracelets', NULL, 1, 1, '2025-09-03 14:29:17', '2025-09-03 14:29:17'),
	(8, 3, 'Earrings', NULL, 1, 2, '2025-09-03 14:29:17', '2025-09-03 14:29:17'),
	(9, 3, 'Necklaces', NULL, 1, 3, '2025-09-03 14:29:17', '2025-09-03 14:29:17');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
