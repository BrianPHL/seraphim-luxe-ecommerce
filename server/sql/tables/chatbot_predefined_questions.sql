/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `seraphim_luxe` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `seraphim_luxe`;

CREATE TABLE IF NOT EXISTS `chatbot_predefined_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `scope` enum('customer','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `priority_level` enum('1','2','3') COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `modified_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `chatbot_predefined_questions` (`id`, `question`, `scope`, `priority_level`, `created_at`, `modified_at`) VALUES
	(1, 'What are the available categories?', 'customer', '1', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(2, 'Do you have any active promotions?', 'customer', '1', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(3, 'What items are in my cart?', 'customer', '1', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(4, 'How do I track my order?', 'customer', '1', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(5, 'Can you show me featured products?', 'customer', '2', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(6, 'What are your payment methods?', 'customer', '2', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(7, 'What is your return policy?', 'customer', '2', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(8, 'What items are on my wishlist?', 'customer', '2', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(9, 'How can I contact support?', 'customer', '2', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(10, 'What is your shipping policy?', 'customer', '3', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(11, 'Show me my order history', 'customer', '3', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(12, 'Show me recent orders', 'admin', '1', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(13, 'Which products have low stock?', 'admin', '1', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(14, 'What are the top-selling products?', 'admin', '1', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(15, 'Show me pending orders', 'admin', '1', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(16, 'What is our total revenue?', 'admin', '2', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(17, 'Show me all active promotions', 'admin', '2', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(18, 'What are the recent admin activities?', 'admin', '2', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(19, 'What products need restocking?', 'admin', '2', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(20, 'Show me category performance', 'admin', '2', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(21, 'Show me all orders', 'admin', '3', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(22, 'What is the user activity?', 'admin', '3', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(23, 'Show me all products', 'admin', '3', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(24, 'What are today\'s metrics?', 'admin', '3', '2025-10-28 04:27:37', '2025-10-28 04:27:37'),
	(25, 'Show me processing orders', 'admin', '3', '2025-10-28 04:27:37', '2025-10-28 04:27:37');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
