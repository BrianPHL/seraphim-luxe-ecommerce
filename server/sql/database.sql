-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.5 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for seraphim_luxe
CREATE DATABASE IF NOT EXISTS `seraphim_luxe` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `seraphim_luxe`;

-- Dumping structure for table seraphim_luxe.accounts
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` enum('customer','vendor','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'customer',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `contact_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email_verified` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.accounts: ~0 rows (approximately)

-- Dumping structure for table seraphim_luxe.carts
CREATE TABLE IF NOT EXISTS `carts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `modified_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `carts_accounts_id_fkey` (`account_id`),
  KEY `carts_products_id_fkey` (`product_id`),
  CONSTRAINT `carts_accounts_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `carts_products_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.carts: ~0 rows (approximately)

-- Dumping structure for table seraphim_luxe.installments
CREATE TABLE IF NOT EXISTS `installments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reservation_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','completed','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `admin_id` int DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `installments_reservations_id_fkey` (`reservation_id`),
  KEY `installments_accounts_id_fkey` (`admin_id`),
  CONSTRAINT `installments_accounts_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `installments_reservations_id_fkey` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.installments: ~0 rows (approximately)

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
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.oauth_accounts: ~0 rows (approximately)

-- Dumping structure for table seraphim_luxe.oauth_sessions
CREATE TABLE IF NOT EXISTS `oauth_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `oauth_sessions_token_unique` (`token`) USING BTREE,
  KEY `oauth_sessions_user_id_fk` (`user_id`) USING BTREE,
  KEY `oauth_sessions_expires_at_index` (`expires_at`),
  CONSTRAINT `oauth_sessions_accounts_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=294 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.oauth_sessions: ~0 rows (approximately)

-- Dumping structure for table seraphim_luxe.oauth_verifications
CREATE TABLE IF NOT EXISTS `oauth_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `identifier` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `oauth_verifications_id_index` (`id`),
  KEY `oauth_verifications_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=382 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.oauth_verifications: ~0 rows (approximately)

-- Dumping structure for table seraphim_luxe.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `account_id` int NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('pending','processing','shipped','delivered','cancelled','returned','refunded') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL,
  `shipping_address` text COLLATE utf8mb4_general_ci,
  `billing_address` text COLLATE utf8mb4_general_ci,
  `payment_method` enum('cash_on_delivery','gcash','bank_transfer','credit_card') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'cash_on_delivery',
  `payment_status` enum('pending','paid','failed','refunded') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `shipping_method` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `shipping_cost` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_general_ci,
  `admin_notes` text COLLATE utf8mb4_general_ci,
  `tracking_number` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `modified_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `orders_accounts_id_fkey` (`account_id`),
  CONSTRAINT `orders_accounts_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.orders: ~0 rows (approximately)

-- Dumping structure for table seraphim_luxe.order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_items_orders_id_fkey` (`order_id`),
  KEY `order_items_products_id_fkey` (`product_id`),
  CONSTRAINT `order_items_orders_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_products_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.order_items: ~0 rows (approximately)

-- Dumping structure for table seraphim_luxe.order_refunds
CREATE TABLE IF NOT EXISTS `order_refunds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `refund_amount` decimal(10,2) NOT NULL,
  `reason` enum('customer_request','defective_product','wrong_item','damaged_shipping','other') COLLATE utf8mb4_general_ci NOT NULL,
  `reason_description` text COLLATE utf8mb4_general_ci,
  `refund_method` enum('cash','gcash','bank_transfer','credit_card','store_credit') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('pending','processing','completed','failed') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_general_ci,
  `processed_by` int DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_refunds_orders_id_fkey` (`order_id`),
  CONSTRAINT `order_refunds_orders_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.order_refunds: ~0 rows (approximately)

-- Dumping structure for table seraphim_luxe.order_status_history
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `old_status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `changed_by` int DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_status_history_orders_id_fkey` (`order_id`),
  CONSTRAINT `order_status_history_orders_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.order_status_history: ~0 rows (approximately)

-- Dumping structure for table seraphim_luxe.order_tracking
CREATE TABLE IF NOT EXISTS `order_tracking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `tracking_number` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `carrier` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `tracked_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_tracking_orders_id_fkey` (`order_id`),
  CONSTRAINT `order_tracking_orders_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.order_tracking: ~0 rows (approximately)

-- Dumping structure for table seraphim_luxe.products
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `subcategory` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `variants` json DEFAULT NULL,
  `stock_status` enum('in_stock','low_stock','out_of_stock') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'out_of_stock',
  `stock_quantity` int NOT NULL DEFAULT '0',
  `stock_threshold` int NOT NULL DEFAULT '5',
  `reserved_quantity` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `modified_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.products: ~47 rows (approximately)
INSERT INTO `products` (`id`, `label`, `price`, `category`, `subcategory`, `description`, `image_url`, `variants`, `stock_status`, `stock_quantity`, `stock_threshold`, `reserved_quantity`, `created_at`, `modified_at`) VALUES
	(1, 'Maxi Pearl Gold Bracelet', 4500.00, 'Female', 'Bracelets', 'Elegant maxi pearl bracelet in gold finish', 'maxi_pearl_gold_01.webp', '[{"price": 4500, "stock": 10, "images": ["maxi_pearl_gold_01.webp", "maxi_pearl_gold_02.webp", "maxi_pearl_gold_03.webp"], "material": "Gold"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(2, 'Rigid Gold Bracelet', 3800.00, 'Female', 'Bracelets', 'Classic rigid gold bracelet with modern design', 'rigid_gold_01.webp', '[{"price": 3800, "stock": 10, "images": ["rigid_gold_01.webp", "rigid_gold_02.webp", "rigid_gold_03.webp"], "material": "Gold"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(3, 'Rigid Interlocking Gold Bracelet', 4200.00, 'Female', 'Bracelets', 'Sophisticated interlocking design gold bracelet', 'rigid_interlocking_gold_01.webp', '[{"price": 4200, "stock": 10, "images": ["rigid_interlocking_gold_01.webp", "rigid_interlocking_gold_02.webp", "rigid_interlocking_gold_03.webp"], "material": "Gold"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(4, 'Rigid with Relief Gold Bracelet', 4800.00, 'Female', 'Bracelets', 'Textured relief design gold bracelet', 'rigid_with_relief_gold_01.webp', '[{"price": 4800, "stock": 10, "images": ["rigid_with_relief_gold_01.webp", "rigid_with_relief_gold_02.webp", "rigid_with_relief_gold_03.webp", "rigid_with_relief_gold_04.webp"], "material": "Gold"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(5, 'Shiny Intertwined Gold Bracelet', 4000.00, 'Female', 'Bracelets', 'Elegant intertwined design with shiny gold finish', 'shiny_intertwined_gold_01.webp', '[{"price": 4000, "stock": 10, "images": ["shiny_intertwined_gold_01.webp", "shiny_intertwined_gold_02.webp"], "material": "Gold"}]', 'in_stock', 9, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:32:52'),
	(6, 'Beaded Drop Earrings', 2800.00, 'Female', 'Earrings', 'Elegant beaded drop earrings for special occasions', 'beaded_drop_mixed_metal_01.webp', '[{"price": 2800, "stock": 10, "images": ["beaded_drop_mixed_metal_01.webp", "beaded_drop_mixed_metal_02.webp"], "material": "Mixed Metal"}]', 'in_stock', 9, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:32:52'),
	(7, 'Combined Flower Earrings', 3200.00, 'Female', 'Earrings', 'Beautiful flower-inspired earrings with intricate details', 'combined_flower_mixed_metal_01.webp', '[{"price": 3200, "stock": 10, "images": ["combined_flower_mixed_metal_01.webp", "combined_flower_mixed_metal_02.webp", "combined_flower_mixed_metal_03.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(8, 'Flower Pendant Earrings', 2900.00, 'Female', 'Earrings', 'Delicate flower pendant earrings with graceful movement', 'flower_pendant_mixed_metal_01.webp', '[{"price": 2900, "stock": 10, "images": ["flower_pendant_mixed_metal_01.webp", "flower_pendant_mixed_metal_02.webp", "flower_pendant_mixed_metal_03.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(9, 'Linked Hoop Earrings with Crystals', 3800.00, 'Female', 'Earrings', 'Stunning linked hoop earrings adorned with crystals', 'linked_hoop_earrings_mixed_metal_with_crystals_01.webp', '[{"price": 3800, "stock": 10, "images": ["linked_hoop_earrings_mixed_metal_with_crystals_01.webp", "linked_hoop_earrings_mixed_metal_with_crystals_01.webp", "linked_hoop_earrings_mixed_metal_with_crystals_01.webp"], "material": "Mixed Metal with Crystals"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(10, 'Long Beaded Earrings', 3500.00, 'Female', 'Earrings', 'Dramatic long beaded earrings for evening wear', 'long_beaded_mixed_metal_01.webp', '[{"price": 3500, "stock": 10, "images": ["long_beaded_mixed_metal_01.webp", "long_beaded_mixed_metal_02.webp", "long_beaded_mixed_metal_03.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(11, 'Bella Madre Gold Necklace', 7500.00, 'Female', 'Necklaces', 'Luxurious Bella Madre collection gold necklace', 'bella_madre_gold_01.webp', '[{"price": 7500, "stock": 10, "images": ["bella_madre_gold_01.webp", "bella_madre_gold_02.webp"], "material": "Gold"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(12, 'Crystal Pendant Leather Necklace', 4200.00, 'Female', 'Necklaces', 'Modern crystal pendant on premium leather cord', 'pendant_leather_with_crystal_01.webp', '[{"price": 4200, "stock": 10, "images": ["pendant_leather_with_crystal_01.webp", "pendant_leather_with_crystal_02.webp", "pendant_leather_with_crystal_03.webp"], "material": "Leather w/ Crystal"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(13, 'Drop Necklace with Sphere Silver', 5800.00, 'Female', 'Necklaces', 'Elegant silver drop necklace with sphere pendant', 'drop_necklace_with_sphere_silver_01.webp', '[{"price": 5800, "stock": 10, "images": ["drop_necklace_with_sphere_silver_01.webp", "drop_necklace_with_sphere_silver_01.webp", "drop_necklace_with_sphere_silver_01.webp", "drop_necklace_with_sphere_silver_01.webp"], "material": "Silver"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(14, 'Flower Pendant Gold Necklace', 6200.00, 'Female', 'Necklaces', 'Exquisite flower pendant necklace in gold', 'flower_pendant_gold_01.webp', '[{"price": 6200, "stock": 10, "images": ["flower_pendant_gold_01.webp", "flower_pendant_gold_02.webp", "flower_pendant_gold_03.webp", "flower_pendant_gold_04.webp"], "material": "Gold"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(15, 'Loved Circle Gold Necklace', 5500.00, 'Female', 'Necklaces', 'Romantic circle pendant gold necklace', 'loved_circle_gold_01.webp', '[{"price": 5500, "stock": 10, "images": ["loved_circle_gold_01.webp", "loved_circle_gold_02.webp"], "material": "Gold"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(16, 'Bancroft Scroll Silver Bracelet', 5200.00, 'Male', 'Bracelets', 'Elegant scroll design silver bracelet for men', 'bancroft_scroll_silver_bracelet_01.webp', '[{"price": 5200, "stock": 10, "images": ["bancroft_scroll_silver_bracelet_01.webp", "bancroft_scroll_silver_bracelet_02.webp"], "material": "Silver"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(17, 'Braided Bangle Bracelet', 4800.00, 'Male', 'Bracelets', 'Classic braided bangle bracelet with modern appeal', 'braided_bangle_mixed_metal_bracelet_01.webp', '[{"price": 4800, "stock": 10, "images": ["braided_bangle_mixed_metal_bracelet_01.webp", "braided_bangle_mixed_metal_bracelet_02.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(18, 'Minimal Cuban Bracelet', 3500.00, 'Male', 'Bracelets', 'Sleek minimal cuban link bracelet', 'minimal_cuban_steel_bracelet_01.webp', '[{"price": 3500, "stock": 25, "images": ["minimal_cuban_steel_bracelet_01.webp", "minimal_cuban_steel_bracelet_02.webp"], "material": "Steel"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(19, 'Tiffany Lock Bangle', 7500.00, 'Male', 'Bracelets', 'Luxury lock design bangle bracelet', 'tiffany_lock_bangle_steel_01.webp', '[{"price": 7500, "stock": 10, "images": ["tiffany_lock_bangle_steel_01.webp", "tiffany_lock_bangle_steel_02.webp"], "material": "Steel"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(20, 'Vesper Chain Bracelet Gold', 6200.00, 'Male', 'Bracelets', 'Premium vesper chain bracelet in gold finish', 'vesper_chain_bracelet_gold_01.webp', '[{"price": 6200, "stock": 10, "images": ["vesper_chain_bracelet_gold_01.webp", "vesper_chain_bracelet_gold_01.webp"], "material": "Gold"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(21, 'Celestial Cross Earrings', 2800.00, 'Male', 'Earrings', 'Bold celestial cross design earrings', 'celestial_cross_earrings_mixed_metal_01.webp', '[{"price": 2800, "stock": 10, "images": ["celestial_cross_earrings_mixed_metal_01.webp", "celestial_cross_earrings_mixed_metal_02.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(22, 'Hammered Silver Stud', 2200.00, 'Male', 'Earrings', 'Textured hammered silver stud earrings', 'hammered_silver_stud_01.webp', '[{"price": 2200, "stock": 10, "images": ["hammered_silver_stud_01.webp", "hammered_silver_stud_02.webp"], "material": "Silver"}]', 'in_stock', 6, 5, 0, '2025-08-27 20:17:17', '2025-09-02 04:27:04'),
	(23, 'Nyx Ear Silver Stud', 2500.00, 'Male', 'Earrings', 'Sleek Nyx collection silver stud earrings', 'nyx_ear_silver_stud_01.webp', '[{"price": 2500, "stock": 10, "images": ["nyx_ear_silver_stud_01.webp", "nyx_ear_silver_stud_01.webp"], "material": "Silver"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(24, 'Square Stud Earrings', 2400.00, 'Male', 'Earrings', 'Modern square design stud earrings', 'square_stud_earrings_mixed_metal_01.webp', '[{"price": 2400, "stock": 10, "images": ["square_stud_earrings_mixed_metal_01.webp", "square_stud_earrings_mixed_metal_02.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(25, 'Tiffany Titan Earrings', 4500.00, 'Male', 'Earrings', 'Premium Tiffany Titan collection earrings', 'tiffany_titan_earrings_titanium_01.webp', '[{"price": 4500, "stock": 10, "images": ["tiffany_titan_earrings_titanium_01.webp", "tiffany_titan_earrings_titanium_02.webp"], "material": "Titanium"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(26, 'Classic Mens Minimal Box Cuban Chain', 6000.00, 'Male', 'Necklaces', 'Premium minimal box cuban chain for men', 'classic_mens_minimal_box_cuban_chain_silver_01.webp', '[{"price": 6000, "stock": 10, "images": ["classic_mens_minimal_box_cuban_chain_silver_01.webp", "classic_mens_minimal_box_cuban_chain_silver_02.webp", "classic_mens_minimal_box_cuban_chain_silver_03.webp"], "material": "Silver"}, {"price": 9000, "stock": 10, "images": ["classic_mens_minimal_box_cuban_chain_gold_01.webp", "classic_mens_minimal_box_cuban_chain_gold_02.webp", "classic_mens_minimal_box_cuban_chain_gold_03.webp"], "material": "Gold"}]', 'in_stock', 9, 5, 0, '2025-08-27 20:17:17', '2025-08-28 04:33:35'),
	(27, 'Minimal Pendant Necklace', 4200.00, 'Male', 'Necklaces', 'Sleek minimal pendant necklace for everyday wear', 'minimal_pendant_necklace_mixed_metal_01.webp', '[{"price": 4200, "stock": 25, "images": ["minimal_pendant_necklace_mixed_metal_01.webp", "minimal_pendant_necklace_mixed_metal_02.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(28, 'Monieyta Rectangular Spiral Bar Pendant', 5800.00, 'Male', 'Necklaces', 'Unique rectangular spiral bar pendant design', 'monieyta_rectangular_spiral_bar_pendant_steel_01.webp', '[{"price": 5800, "stock": 15, "images": ["monieyta_rectangular_spiral_bar_pendant_steel_01.webp", "monieyta_rectangular_spiral_bar_pendant_steel_02.webp"], "material": "Steel"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(29, 'N917 Curb Necklace', 5200.00, 'Male', 'Necklaces', 'Classic N917 curb chain necklace', 'n917_curb_necklace_mixed_metal_01.webp', '[{"price": 5200, "stock": 18, "images": ["n917_curb_necklace_mixed_metal_01.webp", "n917_curb_necklace_mixed_metal_02.webp", "n917_curb_necklace_mixed_metal_03.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(30, 'Sleek Apex Titanium Steel Bar Pendant', 6500.00, 'Male', 'Necklaces', 'Modern titanium steel bar pendant with sleek design', 'sleek_apex_titanium_steel_bar_pendant_01.webp', '[{"price": 6500, "stock": 12, "images": ["sleek_apex_titanium_steel_bar_pendant_01.webp", "sleek_apex_titanium_steel_bar_pendant_02.webp"], "material": "Titanium Steel"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(31, 'David Yurman Box Chain Bracelet', 8500.00, 'Unisex', 'Bracelets', 'Luxury David Yurman box chain bracelet for all genders', 'david_yurman_box_chain_bracelet_silver_01.webp', '[{"price": 8500, "stock": 6, "images": ["david_yurman_box_chain_bracelet_silver_01.webp", "david_yurman_box_chain_bracelet_silver_02.webp"], "material": "Silver"}, {"price": 8800, "stock": 6, "images": ["david_yurman_box_chain_bracelet_black_01.webp", "david_yurman_box_chain_bracelet_black_02.webp"], "material": "Black"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(32, 'Gucci Interlocking G Silver Bracelet', 9200.00, 'Unisex', 'Bracelets', 'Iconic Gucci interlocking G silver bracelet', 'gucci_interlocking_g_silver_bracelet_silver_01.webp', '[{"price": 9200, "stock": 10, "images": ["gucci_interlocking_g_silver_bracelet_silver_01.webp", "gucci_interlocking_g_silver_bracelet_silver_02.webp", "gucci_interlocking_g_silver_bracelet_silver_03.webp"], "material": "Silver"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(33, 'Montblanc Meisterstück Collection Steel 3 Rings Bracelet', 7800.00, 'Unisex', 'Bracelets', 'Premium Montblanc Meisterstück steel and leather bracelet', 'montblanc_meisterstuck_collection_steel_3_rings_bracelet_white_leather_01.webp', '[{"price": 7800, "stock": 8, "images": ["montblanc_meisterstuck_collection_steel_3_rings_bracelet_white_leather_01.webp"], "material": "Steel with White Leather"}, {"price": 7900, "stock": 8, "images": ["montblanc_meisterstuck_collection_steel_3_rings_bracelet_red_leather_02.webp"], "material": "Steel with Red Leather"}, {"price": 7850, "stock": 8, "images": ["montblanc_meisterstuck_collection_steel_3_rings_bracelet_brown_leather_03.webp"], "material": "Steel with Brown Leather"}, {"price": 7950, "stock": 8, "images": ["montblanc_meisterstuck_collection_steel_3_rings_bracelet_light_blue_leather_04.webp"], "material": "Steel with Light Blue Leather"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(34, 'Tateossian Pop Rigato Double Wrap Leather Bracelet', 4500.00, 'Unisex', 'Bracelets', 'Contemporary double wrap leather bracelet by Tateossian', 'tateossian_pop_rigato_double_wrap_leather_bracelet_leather_01.webp', '[{"price": 4400, "stock": 5, "images": ["tateossian_pop_rigato_double_wrap_leather_bracelet_black_leather_02.webp"], "material": "Black Leather"}, {"price": 4450, "stock": 5, "images": ["tateossian_pop_rigato_double_wrap_leather_bracelet_brown_leather_03.webp"], "material": "Brown Leather"}, {"price": 4500, "stock": 5, "images": ["tateossian_pop_rigato_double_wrap_leather_bracelet_blue_leather_04.webp", "tateossian_pop_rigato_double_wrap_leather_bracelet_blue_leather_05.webp"], "material": "Blue Leather"}]', 'in_stock', 8, 5, 0, '2025-08-27 20:17:17', '2025-08-28 04:30:36'),
	(35, 'Tom Wood Curb M Bracelet', 5200.00, 'Unisex', 'Bracelets', 'Scandinavian design Tom Wood curb bracelet', 'tom_wood_curb_m_bracelet_silver_01.webp', '[{"price": 5200, "stock": 9, "images": ["tom_wood_curb_m_bracelet_silver_01.webp", "tom_wood_curb_m_bracelet_silver_02.webp"], "material": "Silver"}, {"price": 5800, "stock": 9, "images": ["tom_wood_curb_m_bracelet_gold_03.webp", "tom_wood_curb_m_bracelet_gold_04.webp"], "material": "Gold"}]', 'in_stock', 9, 5, 0, '2025-08-27 20:17:17', '2025-08-28 04:29:07'),
	(36, 'AMYO Tiny Stud Earring', 1800.00, 'Unisex', 'Earrings', 'Minimalist tiny stud earrings by AMYO', 'amyo_tiny_stud_earring_04.webp', '[{"price": 1800, "stock": 10, "images": ["amyo_tiny_stud_earring_gold_01.webp"], "material": "Gold"}, {"price": 1600, "stock": 10, "images": ["amyo_tiny_stud_earring_copper_02.webp"], "material": "Copper"}, {"price": 1700, "stock": 10, "images": ["amyo_tiny_stud_earring_silver_03.webp"], "material": "Silver"}]', 'in_stock', 0, 5, 0, '2025-08-27 20:17:17', '2025-08-28 04:46:15'),
	(37, 'GLAMIRA Black Stud Earring', 2200.00, 'Unisex', 'Earrings', 'Elegant stud earrings by GLAMIRA in multiple finishes', 'glamira_black_stud_earring_01.webp', '[{"price": 2200, "stock": 8, "images": ["glamira_black_stud_earring_silver_02.webp"], "material": "Silver"}, {"price": 2400, "stock": 9, "images": ["glamira_black_stud_earring_gold_03.webp"], "material": "Gold"}, {"price": 2350, "stock": 8, "images": ["glamira_black_stud_earring_rosegold_04.webp"], "material": "Rose Gold"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(38, 'JAXXON Silver Cross Stud Earring', 2800.00, 'Unisex', 'Earrings', 'Bold silver cross stud earrings by JAXXON', 'jaxxon_silver_cross_stud_earring_silver_01.webp', '[{"price": 2800, "stock": 10, "images": ["jaxxon_silver_cross_stud_earring_silver_01.webp", "jaxxon_silver_cross_stud_earring_silver_02.webp", "jaxxon_silver_cross_stud_earring_silver_03.webp", "jaxxon_silver_cross_stud_earring_silver_04.webp"], "material": "Silver"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(39, 'MEJURI Gold Huggie Hoop Earrings', 3200.00, 'Unisex', 'Earrings', 'Classic gold huggie hoop earrings by MEJURI', 'mejuri_gold_huggie_hoop_earrings_gold_01.webp', '[{"price": 3200, "stock": 10, "images": ["mejuri_gold_huggie_hoop_earrings_gold_01.webp", "mejuri_gold_huggie_hoop_earrings_gold_02.webp", "mejuri_gold_huggie_hoop_earrings_gold_03.webp", "mejuri_gold_huggie_hoop_earrings_gold_04.webp"], "material": "Gold"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(40, 'REGALROSE Small Plain Silver Hoop Earring', 2400.00, 'Unisex', 'Earrings', 'Simple and elegant small silver hoop earrings', 'regalrose_small_plain_silver_hoop_earring_silver_01.webp', '[{"price": 2400, "stock": 10, "images": ["regalrose_small_plain_silver_hoop_earring_silver_01.webp", "regalrose_small_plain_silver_hoop_earring_silver_02.webp", "regalrose_small_plain_silver_hoop_earring_silver_03.webp"], "material": "Silver"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(41, 'Caitlyn Minimalist Interlocking Circles Necklace', 4800.00, 'Unisex', 'Necklaces', 'Modern minimalist interlocking circles necklace', 'caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_01.webp', '[{"price": 4800, "stock": 8, "images": ["caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_01.webp", "caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_02.webp", "caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_03.webp", "caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_04.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(42, 'GIVA Anushka Sharma Silver Deer Heart Necklace', 3200.00, 'Unisex', 'Necklaces', 'Elegant deer heart necklace by GIVA featuring Anushka Sharma collection', 'giva_anushka_sharma_silver_deer_heart_necklace_silver_01.webp', '[{"price": 3200, "stock": 10, "images": ["giva_anushka_sharma_silver_deer_heart_necklace_silver_01.webp", "giva_anushka_sharma_silver_deer_heart_necklace_silver_02.webp", "giva_anushka_sharma_silver_deer_heart_necklace_silver_03.webp", "giva_anushka_sharma_silver_deer_heart_necklace_silver_04.webp"], "material": "Silver"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(43, 'GLAMIRA Minimalist Necklace', 2800.00, 'Unisex', 'Necklaces', 'Sleek minimalist necklace design by GLAMIRA', 'glamira_minimalist_necklaces_gold_01.webp', '[{"price": 2800, "stock": 10, "images": ["glamira_minimalist_necklaces_gold_01.webp", "glamira_minimalist_necklaces_gold_02.webp", "glamira_minimalist_necklaces_gold_03.webp"], "material": "Gold"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(44, 'Minimalist Lab Roman Numerals Diamond Band Necklace', 5500.00, 'Unisex', 'Necklaces', 'Sophisticated roman numerals diamond band necklace', 'minimalist_lab_roman_numerals_diamond_band_necklace_gold_01.webp', '[{"price": 5500, "stock": 8, "images": ["minimalist_lab_roman_numerals_diamond_band_necklace_gold_01.webp", "minimalist_lab_roman_numerals_diamond_band_necklace_gold_04.webp"], "material": "Gold with Diamonds"}, {"price": 5400, "stock": 4, "images": ["minimalist_lab_roman_numerals_diamond_band_necklace_rosegold_02.webp"], "material": "Rose Gold with Diamonds"}, {"price": 5200, "stock": 3, "images": ["minimalist_lab_roman_numerals_diamond_band_necklace_silver_03"], "material": "Silver with Diamonds"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(45, 'Tiffany T Smile Necklace', 8500.00, 'Unisex', 'Necklaces', 'Iconic Tiffany T Smile collection necklace', 'tiffany_t_smile_necklace_gold_01.webp', '[{"price": 8500, "stock": 10, "images": ["tiffany_t_smile_necklace_gold_01.webp", "tiffany_t_smile_necklace_gold_02.webp", "tiffany_t_smile_necklace_gold_03.webp", "tiffany_t_smile_necklace_gold_04.webp"], "material": "Gold"}]', 'in_stock', 10, 5, 0, '2025-08-27 20:17:17', '2025-08-27 20:20:19'),
	(49, 'Teest', 0.00, 'Male', 'Bracelets', 'Test', 'products/7b4b9579c6ea5b8c5d444003b33ec9f5_lcsrxu', NULL, 'out_of_stock', 5, 5, 0, '2025-09-02 14:49:11', '2025-09-02 14:49:11'),
	(50, 'W', 3.00, 'Male', 'Earrings', 'Test', 'products/vfqqhg3ujw6t4mwpqwyd', NULL, 'out_of_stock', 5, 5, 0, '2025-09-02 14:50:32', '2025-09-02 14:50:32');

-- Dumping structure for table seraphim_luxe.reservations
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `status` enum('pending','pending_approval','rejected','cancelled','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `preferred_date` date NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `modified_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `reservations_accounts_id_fkey` (`account_id`),
  CONSTRAINT `reservations_accounts_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.reservations: ~0 rows (approximately)

-- Dumping structure for table seraphim_luxe.reservation_products
CREATE TABLE IF NOT EXISTS `reservation_products` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`,`product_id`) USING BTREE,
  KEY `reservations_products_product_id_fkey` (`product_id`),
  CONSTRAINT `reservations_products_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `reservations_products_reservation_id_fkey` FOREIGN KEY (`id`) REFERENCES `reservations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.reservation_products: ~0 rows (approximately)

-- Dumping structure for table seraphim_luxe.stocks_history
CREATE TABLE IF NOT EXISTS `stocks_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `stock_history_type` enum('initial','restock','adjustment','reservation','return','order') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `quantity_change` int NOT NULL,
  `previous_quantity` int NOT NULL,
  `new_quantity` int NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `admin_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `stocks_history_accounts_id_fkey` (`admin_id`),
  KEY `stocks_history_products_id_fkey` (`product_id`),
  CONSTRAINT `stocks_history_accounts_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stocks_history_products_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.stocks_history: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
