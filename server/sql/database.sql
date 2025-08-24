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

SET FOREIGN_KEY_CHECKS = 0;

-- Dumping database structure for seraphim_luxe
CREATE DATABASE IF NOT EXISTS `seraphim_luxe` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `seraphim_luxe`;

-- Dumping structure for table seraphim_luxe.accounts
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'customer',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `contact_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email_verified` tinyint NOT NULL DEFAULT '0',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

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
  CONSTRAINT `carts_accounts_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `carts_products_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

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

-- Data exporting was unselected.

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
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

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
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

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
) ENGINE=InnoDB AUTO_INCREMENT=207 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table seraphim_luxe.products
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `subcategory` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `stock_status` enum('in_stock','low_stock','out_of_stock') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'out_of_stock',
  `stock_quantity` int NOT NULL DEFAULT '0',
  `stock_threshold` int NOT NULL DEFAULT '5',
  `reserved_quantity` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `modified_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table seraphim_luxe.products: ~94 rows (approximately)
INSERT INTO `products` (`id`, `label`, `price`, `category`, `subcategory`, `description`, `image_url`, `stock_status`, `stock_quantity`, `stock_threshold`, `reserved_quantity`, `created_at`, `modified_at`) VALUES
	(1, 'Honda XL750 TRANSALP', 598000.00, 'Motorcycles', 'Big Bike', 'A versatile adventure motorcycle designed for both urban roads and rugged trails.', 'Motorcycles/Big_Bike/honda_xl750.webp', 'in_stock', 6, 5, 0, '2025-05-04 08:01:09', '2025-05-20 15:19:45'),
	(2, 'Honda NX500', 409000.00, 'Motorcycles', 'Big Bike', 'A compact and versatile adventure motorcycle designed for both city riding and off-road exploration.', 'Motorcycles/Big_Bike/honda_nx500.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(3, 'Honda X-ADV', 849000.00, 'Motorcycles', 'Big Bike', 'A unique adventure scooter that blends the practicality of a scooter with the rugged capabilities of an off-road motorcycle.', 'Motorcycles/Big_Bike/honda_x-adv.webp', 'in_stock', 6, 10, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(4, 'The All-New EM1 e', 155400.00, 'Motorcycles', 'Electrical', 'The All-New EM1 e: is engineered to provide smooth and efficient riding experience, setting a standard in eco-friendly transportation.', 'Motorcycles/Electrical/honda_em1-e.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(5, 'Wave RSX (DISC)', 64900.00, 'Motorcycles', 'Underbone', 'The Wave RSX turns your riding experience into something remarkable. With its newest sporty dynamic design bringing out impressive stickers, functional features providing convenience', 'Motorcycles/Underbone/honda_wave-disc.webp', 'out_of_stock', 7, 5, 0, '2025-05-04 16:01:09', '2025-07-26 09:52:08'),
	(6, 'The New Wave RSX (Drum)', 62900.00, 'Motorcycles', 'Underbone', 'The Wave RSX turns your riding experience into something remarkable. With its newest sporty dynamic design bringing out impressive stickers, functional features providing convenience', 'Motorcycles/Underbone/honda_wave-drum.webp', 'out_of_stock', 7, 5, 0, '2025-05-04 16:01:09', '2025-07-26 09:52:08'),
	(7, 'Winner X (Standard)', 123900.00, 'Motorcycles', 'Underbone', 'It boasts outstanding performance through its 150cc, DOHC, 6-Speed, Liquid-Cooled Engine along with worthwhile features', 'Motorcycles/Underbone/honda_winner-x.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(8, 'CB150X', 173900.00, 'Motorcycles', 'Sports', 'The CB150X is powered by a 149cc liquid-cooled, DOHC PGM-FI engine that is capable of producing power of 11.5kw @ 9,000rpm and 13.8Nm @ 7,000rpm of torque.', 'Motorcycles/Sports/honda_cb150x.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(9, 'The New CBR150R', 183900.00, 'Motorcycles', 'Sports', 'It features a new assist/slipper clutch, inverted front fork, and new LED headlight, tail light design, and front winker.', 'Motorcycles/Sports/honda_cbr150r.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(10, 'BeAT (Playful)', 71900.00, 'Motorcycles', 'Scooters', 'Equipped with newest features and technologies such as New Body Design, New Semi-Digital Meter Panel, New Cast Wheel with Tubeless Tires, New LED Headlight, New ACC Power Socket', 'Motorcycles/Scooters/honda_beat_playful.webp', 'out_of_stock', 7, 5, 0, '2025-05-04 16:01:09', '2025-07-26 09:52:08'),
	(11, 'BeAT (Premium', 73400.00, 'Motorcycles', 'Scooters', 'Equipped with newest features and technologies such as New Body Design, New Semi-Digital Meter Panel, New Cast Wheel with Tubeless Tires, New LED Headlight, New ACC Power Socket', 'Motorcycles/Scooters/honda_beat_premium.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(12, 'The New CLICK125', 81900.00, 'Motorcycles', 'Scooters', 'Unleash your ride with the all-new Honda CLICK125 a sleek, sporty scooter designed for urban freedom. Powered by a fuel-efficient 125cc ESP+ engine, it delivers smooth acceleration, sharp handling, and effortless style.', 'Motorcycles/Scooters/honda_click.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(13, 'Memphis Shades Road Warrior Fairing', 12652.28, 'Parts', 'Body', 'A stylish and functional fairing designed for Harley and Indian motorcycles.', 'Parts/Body/memphis-shades_road-warrior-fairing.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(14, 'Yoshimura Fender Eliminator Kit', 12880.07, 'Parts', 'Body', 'A sleek and functional upgrade designed to replace bulky stock fenders with a clean, minimalist look.', 'Parts/Body/yoshimura_fender-eliminator-kit.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(15, 'Acerbis Full Plastic Kit', 12652.84, 'Parts', 'Body', 'A high-quality replacement set designed for off-road motorcycles.', 'Parts/Body/acerbis_full-plastic-kit.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(16, 'Memphis Shades Road Warrior Trigger Lock Mount Kit', 8433.91, 'Parts', 'Body', 'A revolutionary tool-less mounting system designed for Harley and Indian motorcycles.', 'Parts/Body/memphis-shades_trigger-lock-mount-kit.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(17, 'Brembo Brake Reservoir Mounting Kit', 3472.00, 'Parts', 'Brakes', 'A convenient solution for securely attaching a brake fluid reservoir to a Brembo master cylinder.', 'Parts/Brakes/brembo_brake-reservoir-mounting-kit.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(18, 'Brembo 19RCS Brake Master Cylinder', 8680.00, 'Parts', 'Brakes', 'A high-performance braking component designed for dual-caliper, four-piston systems.', 'Parts/Brakes/brembo_19rcs.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(19, 'EBC Double-H Sintered Front Brake Pads', 1677.20, 'Parts', 'Brakes', 'High-performance brake pads designed for maximum stopping power and durability.', 'Parts/Brakes/ebc_double-h-sintered-front-brake-pads.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(20, 'Galfer Sportbike Front Brake Lines', 3124.80, 'Parts', 'Brakes', 'High-performance stainless steel braided brake lines designed to improve braking feel and consistency', 'Parts/Brakes/galfer_front-brake-lines.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(21, 'Galfer Front Wave Brake Rotor', 6863.92, 'Parts', 'Brakes', 'A high-performance brake rotor designed for street and track use.', 'Parts/Brakes/galfer_front-wave-brake-rotor.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(22, 'Yoshimura LED Front Turn Signals', 5429.20, 'Parts', 'Electrical', 'These bright, low profile LED Turn Signals feature an aluminum body and high quality construction.', 'Parts/Electrical/yoshimura_led-front-turn-signals.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(23, 'Rizoma Light Unit Turn Signal', 5879.00, 'Parts', 'Electrical', 'Rizoma\'s Light Unit Turn Signals pack the latest in SMD LED technology guaranteeing high light intensity in an incredibly small, yet stylish package.', 'Parts/Electrical/rizoma_light-unit-turn-signal.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(24, 'NOCO NLP9 POWERSPORT BATTERY LIFEPO4', 6280.00, 'Parts', 'Electrical', 'Introducing the all new Noco NLP9 12V Lithium Powersport battery, rated at 3Ah (38Wh) and 400-amps of starting power.', 'Parts/Electrical/noco_nlp9.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(25, 'Denali D7 Pro Multi-Beam Driving Light Pod', 19712.00, 'Parts', 'Electrical', 'Description', 'Parts/Electrical/denali_d7.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(26, 'Baja Designs LP6 Pro 6" LED Auxiliary Light Pod', 21571.20, 'Parts', 'Electrical', 'Light up the night with an LP6 Pro Auxiliary Light Pod From Baja Designs! The LP6 is a 6-inch powerhouse of a lamp featuring a total of 11,225 total lumens', 'Parts/Electrical/baja_lp6.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(27, 'Krator Chrome Twisted Motorcycle Mirrors Bolt Adapters', 1959.44, 'Parts', 'Mirror', 'Unique Twisted Rectangle Style Design Adjustable Mirror Angle (Up & Down, Left & Right) Color: Chrome', 'Parts/Mirror/krator-chrom-twisted-motorcycle-mirrors.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(28, 'Krator Chrome/Black Skeleton Hand Motorcycle Mirrors ', 2799.44, 'Parts', 'Mirror', 'Unique Skeleton Hand Design Material: Highest Quality Extremely Heavy Duty Aluminum Color: Chrome and Black', 'Parts/Mirror/krator_chrome-skeleton-hand-motorcycle-mirrors.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(29, 'Krator Chrome Motorcycle Golf Club Mirrors Free Adapters', 2799.44, 'Parts', 'Mirror', 'Extremely Heavy Duty Solid Billet Aluminum Material Free Adapters Quantity: 1 pair (left and right) Brand: Krator® | Color: Chrome', 'Parts/Mirror/krator_chrome-motorcycle-golf-club-mirrors.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(30, 'Krator Universal Black Motorcycle Mirrors', 1119.44, 'Parts', 'Mirror', 'High Quality Black Mirrors (Left & Right Sides) Adjustable Mirror Angle, Up and Down, Left and Right Quantity: 1 Pair (Left and Right)', 'Parts/Mirror/krator_black-motorcycle-mirrors.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(31, 'Krator Black Bar End Mirrors Round 3"', 838.32, 'Parts', 'Mirror', 'High Quality 6061 Billet Aluminum Light Weight Bar End Mirrors Unique Look and Great Visibility', 'Parts/Mirror/krator_black-bar-end.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(32, 'Vortex Rear Wheel Bearing Kit', 672.00, 'Parts', 'Tires', ' High-speed bearings manufactured to ABEC-3 precision levels Triple lip rubber seals keep the grease in and the water and dirt out leading to extended bearing life', 'Parts/Tires/vortex_rear-wheel-bearing-kit.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(33, 'Vortex Arlen Ness Split Spoked Forged Wheels', 12082.00, 'Parts', 'Tires', 'Arlen Ness Split Spoked Forged Wheels are CNC machined from forged 6061-T6 aluminum, creating a wheel that drops rotating weight and provides killer good looks!', 'Parts/Tires/vortex_arlen-ness-split-spoked-forged-wheels.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(34, 'V-Twin Mfg. 25mm ABS Wheel Bearings', 2351.44, 'Parts', 'Tires', ' Features: Replaces OEM 9252 / 9276A  | 25mm  | Fits Front or Rear | Internal ABS coder magnets', 'Parts/Tires/vortex_abs-wheel-bearings.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(35, 'METZELER ROADTEC SCOOTER TIRE', 2580.00, 'Parts', 'Tires', 'More grip in all conditions especially on wet and low-friction surfaces, in a wider range of temperatures thanks to the high silica compounds content', 'Parts/Tires/metzeler_roadtec.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(36, 'METZELER KAROO STREET TIRE', 3780.00, 'Parts', 'Tires', 'The Karoo Street Tires are meant for ADV bike riders who are looking to trade a little bit of their bike\'s, rarely used, off road grip for a bit more on road performance.', 'Parts/Tires/metzeler_karoo.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(37, 'Metzeler Karoo 4 Tire for Adventure Bikes and Maxi Enduro', 7990.00, 'Parts', 'Tires', 'KAROO™ 4 is the evolution of the heroic KAROO™ 3: a comprehensive tyre for Adventure Bikes and Maxi Enduro to overcome the boundaries of adventuring.', 'Parts/Tires/metzeler_karoo-4.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(38, 'Dainese Ignite Air Tex Motorcycle Jacket', 13990.00, 'Gear', 'Bodywear', 'A stylish and protective riding jacket designed for warm-weather conditions.', 'Gear/Bodywear/dainese_ignite.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(39, 'Taichi Rsj347 Overlap Mesh Parka', 9080.00, 'Gear', 'Bodywear', 'A versatile and breathable riding jacket designed for warm-weather comfort.', 'Gear/Bodywear/taichi_rsj347.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(40, 'Forma Adventure Tourer Dry Motorcycle Boots', 12990.00, 'Gear', 'Footwear', 'Made specifically for a smooth mix of street and mountain roads, the Forma Adv Tourer Dry Boots feature a multi-flex sole for comfortable walking when off the bike and exploring new sights.', 'Gear/Footwear/forma_adventure-tourer.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(41, 'O\'neal Rsx Offroad MX Boots', 8990.00, 'Gear', 'Footwear', 'The perfect comfortable motocross boots for all-around off-road riding.', 'Gear/Footwear/oneal_rsx.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(42, 'Komine GK-2493 Protect Vintage Motorcycle Mesh Gloves', 1990.00, 'Gear', 'Gloves', 'Mesh Gloves by VintageTaste. Discreetly equipped with Hard Type Knuckle Protector and Reflector for riding.', 'Gear/Gloves/komine_gk-2493.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(43, 'Komine GK-2603 Protect 3 Fingerless Motorcycle Mesh Gloves', 1990.00, 'Gear', 'Gloves', 'Three-finger Gloves useful for bicycles and delivery businesses.', 'Gear/Gloves/komine_gk-2603.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(44, 'LS2 FF353 Rapid II Motorcycle Full Face Helmet', 3490.00, 'Gear', 'Helmet', 'Helmet with an elegantly functional design, perfect for the way to work or long tours with friends.', 'Gear/Helmet/ls2_ff353.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(45, 'LS2 FF805C Carbon Thunder Gp Pro - Fim Helmet', 25990.00, 'Gear', 'Helmet', 'Ride like a PRO! The racing helmet was worn by our LS2 riders with FIM HOMOLOGATION. Racing spoiler for maximum aerodynamics. Lightweight and resistant with 100% carbon fiber shell.', 'Gear/Helmet/ls2_ff805c.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(46, 'Dainese Motorcycle Hips Protector', 2990.00, 'Gear', 'Protection', 'Motorcycle level 2 Pro-Armor hip protectors with EN 1621.1 L2 TYPE B certification.', 'Gear/Protection/dainese_hips-protector.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(47, 'EVS SX01 Knee Brace', 2960.00, 'Gear', 'Protection', 'The SX01 offers compression and support in a soft, form fitting, pull-on brace. bilateral polycentric hinges offer strength, stability, and limit hyperextension.', 'Gear/Protection/evs_sx01.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(48, 'Oxford Triple Brush Set', 350.00, 'Maintenance', 'Cleaning', 'A versatile cleaning kit designed to tackle dirt and grime on motorcycles and bicycles.', 'Maintenance/Cleaning/oxford_triple-brush-set.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(49, 'Oxford Chain Brush', 490.00, 'Maintenance', 'Cleaning', 'A multi-faced cleaning tool designed to make chain maintenance quick and efficient', 'Maintenance/Cleaning/oxford_chain-brush.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(50, 'Noco GC004 X-Connect 10 Foot Extension Cable', 1200.00, 'Maintenance', 'Electrical', 'A 10-foot extension cable that allows you to extend the reach of your battery charger and accessories.', 'Maintenance/Electrical/noco_gc004.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(51, 'Noco GENIUS2 Battery Charger 2AMP', 3180.00, 'Maintenance', 'Electrical', 'A battery charger designed for 6-volt and 12-volt lead-acid automotive, marine, and deep-cycle batteries, including flooded, gel, AGM, and maintenance-free, plus lithium-ion batteries.', 'Maintenance/Electrical/noco_genius2.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(52, 'Ipone Full Power Katana Motorcycle Engine Oil', 890.00, 'Maintenance', 'Engine_Care', 'Full Power Katana is specially designed to meet the requirements of sporty driving on the road. It guarantees optimum lubrication to exploit the full performance of the high-speed engine.', 'Maintenance/Engine_Care/ipone_full-power.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(53, 'Ipone Scoot 4 Motorcycle Engine Oil', 490.00, 'Maintenance', 'Engine_Care', 'SCOOT 4 ensures optimum lubrication for your 4-stroke scooter. Semi-synthetic, it guarantees good engine protection.', 'Maintenance/Engine_Care/ipone_scoot-4.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(54, 'Oxford OC204 Mint General Protectant (500ml)', 380.00, 'Maintenance', 'Fluids', 'A highly effective, general-purpose protectant with strong film-forming properties, which create a protective coating to prevent moisture ingress and damage on all types of components.', 'Maintenance/Fluids/oxford_oc204.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(55, 'Putoline Textile Proof & Protect (500ml)', 480.00, 'Maintenance', 'Fluids', 'Textile Proof & Protect impregnating spray can be used to make materials like textile dirt- and water resistant. Textile Proof & Protect is a clear colourless liquid. Read instructions before use.', 'Maintenance/Fluids/putoline_textile.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(56, 'Oxford Motorcycle Biker Toolkit', 890.00, 'Maintenance', 'Tools', 'Made from high-quality carbon steel and come in a compact storage case. The case can be kept under your rear seat, it folds down to 18cm x 10.5cm x 4cm.', 'Maintenance/Tools/oxford_biker-toolkit.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(57, 'Oxford Tire Patch Kit', 300.00, 'Maintenance', 'Tools', ' A straightforward patch kit for puncture repairs, featuring a stainless scuffer with comfortable grip and PP panel for storing chain rivet and master links.', 'Maintenance/Tools/oxford_tire-patch-kit.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(58, 'Oxford Motorcycle Throttle Assist', 390.00, 'Accessories', 'Customization', 'A simple yet effective tool designed to reduce wrist and hand fatigue during long rides.', 'Accessories/Customization/oxford_throttle-assist.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(59, 'Oxford Ox851 Cliqr Cable Tie Mount', 190.00, 'Accessories', 'Customization', 'A versatile phone mounting system designed for motorcycles and bicycles.', 'Accessories/Customization/oxford_cliqr-cable-tie-mount.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(60, 'Oxford Ox797 Clutch Lever Guard Left', 1200.00, 'Accessories', 'Customization', 'A lightweight and durable lever protector designed to reduce accidental lever engagement during close riding conditions.', 'Accessories/Customization/oxford_clutch-lever-guard-left.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(61, 'Polisport Honda Crf250r - Front Fender - \'10-\'13', 1360.00, 'Accessories', 'Customization', 'A durable and high-quality replacement designed to match OEM specifications.', 'Accessories/Customization/polisport_crf250fr-front-fender.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(62, 'Motorcycle Sticker - GPS warning (2 pack)', 560.00, 'Accessories', 'Customization', 'A reflective vinyl decal designed to add a humorous yet attention-grabbing warning to your bike.', 'Accessories/Customization/motoloot_sticker-gps-warning.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(63, 'Motorcycle Sticker - Ride The Biker (2 pack)', 560.00, 'Accessories', 'Customization', 'A high-quality reflective vinyl decal designed to add a bold and humorous touch to your motorcycle.', 'Accessories/Customization/motoloot_sticker-ride-the-biker.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(64, 'Innovv K3 Dash Cam', 18032.00, 'Accessories', 'Dashcam', 'A dual-camera system designed for motorcycles and powersports vehicles.', 'Accessories/Dashcam/inovv_k3.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(65, 'Innovv K7 Dash Cam', 21728.00, 'Accessories', 'Dashcam', 'A dual-channel 2K+2K motorcycle dashcam designed for high-definition recording and smooth video stabilization.', 'Accessories/Dashcam/inovv_k7.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(66, 'Innovv K6 Motorcycle Dash Cam', 18032.00, 'Accessories', 'Dashcam', 'A dual-channel dashcam system designed for motorcycle riders who want high-quality video recording on the road.', 'Accessories/Dashcam/inovv_k6.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(67, 'Innovv K5 Dash Cam', 25648.00, 'Accessories', 'Dashcam', 'A high-performance dual-channel motorcycle dashcam featuring 4K Ultra HD front recording and 1080P Full HD rear recording.', 'Accessories/Dashcam/inovv_k5.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(68, 'Garmin Dash Cam 67W', 14504.00, 'Accessories', 'Dashcam', 'A compact and feature-rich in-car camera designed for high-quality video recording.', 'Accessories/Dashcam/garmin_67w.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(69, 'Oxford Ox620 Retro Grips', 750.00, 'Accessories', 'Ergonomics', 'Designed for riders who appreciate a classic aesthetic while maintaining modern functionality.', 'Accessories/Ergonomics/oxford_ox620-retro-grips.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(70, 'Oxford Ox603 Sport Grips Medium Compound', 600.00, 'Accessories', 'Ergonomics', 'These grips provide enhanced feedback and a secure hold, making them ideal for riders who demand precision.', 'Accessories/Ergonomics/oxford_ox603-sport-grips.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(71, 'Airhawk Dual Sport Seat Pad', 3200.00, 'Accessories', 'Ergonomics', 'Designed for riders who need extra comfort on long journeys.', 'Accessories/Ergonomics/airhawk_dual-sport-seat-pad.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(72, 'Givi Tb2013 Backrest Yamaha Tmax 500 / 530 2008-2017', 2800.00, 'Accessories', 'Ergonomics', 'Provides added comfort for passengers while maintaining a sleek, integrated look.', 'Accessories/Ergonomics/givi_tb2013.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(73, 'Saddlemen Chopped Tour Pak Step-Up Ls Lattice Stitch Backrest Pad For Harley', 4500.00, 'Accessories', 'Ergonomics', 'Enhances both comfort and style while seamlessly integrating with Saddlemen Step-Up LS seats.', 'Accessories/Ergonomics/saddlemen_backprest-pad.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(74, 'Wild Ass Sport Air Gel Motorcycle Seat Pad', 3850.00, 'Accessories', 'Ergonomics', 'Features an air cushion system that helps reduce pressure points and improve overall seating comfort.', 'Accessories/Ergonomics/wild-ass_seat-pad.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(75, 'Sena 50r-02 Bluetooth Intercom W/ Harman Kardon Speaker', 27980.00, 'Accessories', 'Intercom', 'A sleek, rugged, and high-performance motorcycle communication system.', 'Accessories/Intercom/sena_50r-02.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(76, 'Parani M10 Motorcycle Bluetooth Intercom Headset', 3990.00, 'Accessories', 'Intercom', 'A budget-friendly communication device designed for riders who want seamless connectivity on the road.', 'Accessories/Intercom/parani_m10.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(77, 'Nolan N-Com Bluetooth Intercom W/ Mesh For X-Lite Series', 16990.00, 'Accessories', 'Intercom', 'A cutting-edge communication system designed for X-Lite series helmets.', 'Accessories/Intercom/nolan_n-com.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(78, 'Sena E30 Motorcycle Bluetooth 3.0 Mesh Intercom', 8990.00, 'Accessories', 'Intercom', 'An affordable yet powerful communication system designed for riders who want seamless connectivity on the road.', 'Accessories/Intercom/sena_e30.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(79, 'Sena 60s Motorcycle Bluetooth Mesh Intercom W/ Harman Speakers', 24990.00, 'Accessories', 'Intercom', 'A high-performance communication system designed for riders who demand seamless connectivity and premium audio.', 'Accessories/Intercom/sena_60s.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(80, 'Givi Motorcycle SRX(S) Extreme Special Fitment Kit/Bracket', 4490.00, 'Accessories', 'Storage', 'Engineered for stability and durability, it features robotic welding and laser-cut components to minimize vibration and enhance strength.', 'Accessories/Storage/givi_srx.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(81, 'Kappa K25n Motorcycle Top Case (26l)', 1800.00, 'Accessories', 'Storage', 'a compact and durable storage solution for riders who need secure and convenient luggage space.', 'Accessories/Storage/kappa_k25n.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(82, 'Oxford L1r Motorcycle Leg Bag', 1690.00, 'Accessories', 'Storage', 'A compact and practical storage solution for riders who need quick access to essentials while on the move.', 'Accessories/Storage/oxford_l1r.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(83, 'Givi E22/23n Motorcycle Pannier/Side Box Pair', 7990.00, 'Accessories', 'Storage', 'A versatile and durable storage solution for riders who need extra luggage capacity without compromising style.', 'Accessories/Storage/givi_e22_23n.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(84, 'Givi Matterhorn Motorcycle Monolock Topcase', 7490.00, 'Accessories', 'Storage', 'Available in 29L and 39L capacities, it features a proprietary aluminum shell that is UV-tested to prevent fading over time.', 'Accessories/Storage/givi_matterhorn.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 16:01:09', '2025-05-20 15:19:45'),
	(85, 'Kawasaki Z1000 R Edition', 710000.00, 'Motorcycles', 'Big_Bike', 'High-performance naked sportbike featuring aggressive styling, advanced suspension, and a powerful 1043cc engine.', 'Motorcycles/Big_Bike/kawasaki_z1000r.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 17:23:03', '2025-05-20 15:19:45'),
	(86, 'Kawasaki Barako III (Kick)', 96500.00, 'Motorcycles', 'Underbone', 'Durable and fuel-efficient business motorcycle with a 177cc engine, kick-start mechanism, and heavy-duty build for daily utility use.', 'Motorcycles/Underbone/kawasaki_barako.webp', 'out_of_stock', 0, 5, 0, '2025-05-04 17:23:03', '2025-07-26 09:55:09'),
	(87, 'Yamaha Aerox', 123000.00, 'Motorcycles', 'Scooter', 'Sporty maxi-scooter equipped with a powerful 155cc engine, aggressive styling, and advanced features for dynamic city riding.', 'Motorcycles/Scooter/yamaha_aerox.webp', 'out_of_stock', 6, 5, 0, '2025-05-04 17:23:03', '2025-05-20 15:19:45'),
	(91, 'Yamaha Sniper 155', 125900.00, 'Motorcycles', 'Underbone', 'High-performance underbone motorcycle with a 155cc engine, sporty design, and responsive handling for daily and spirited rides.', 'Motorcycles/Underbone/yamaha_sniper_155.webp', 'out_of_stock', 6, 5, 0, '2025-05-05 18:02:11', '2025-05-20 15:19:45'),
	(92, 'CFMoto 400 NK 2020', 219000.00, 'Motorcycles', 'Big Bike', 'Mid-range naked bike featuring a 400cc parallel-twin engine, sharp styling, and comfortable ergonomics ideal for both city and highway rides.', 'Motorcycles/Big_Bike/cfmoto_400_nk.webp', 'out_of_stock', 6, 5, 0, '2025-05-05 18:02:11', '2025-05-20 15:19:45'),
	(93, 'CFMoto 300 SR', 165000.00, 'Motorcycles', 'Sports', 'Lightweight sportbike with a 292cc engine, full fairing, and modern tech features designed for performance-oriented riders and daily commuting.', 'Motorcycles/Sports/cfmoto_300_sr.webp', 'out_of_stock', 6, 5, 0, '2025-05-05 18:02:11', '2025-05-20 15:19:45'),
	(94, '2022 KTM RC 390', 335000.00, 'Motorcycles', 'Sports', 'Track-focused lightweight sportbike with a 373cc engine, aggressive styling, and advanced electronics for high-performance riding.', 'Motorcycles/Sports/ktm_rc_390.webp', 'out_of_stock', 6, 5, 0, '2025-05-05 18:02:11', '2025-05-20 15:19:45'),
	(95, '2023 KTM 1290 Super Duke R EVO', 1250000.00, 'Motorcycles', 'Big_Bike', 'Top-tier hyper naked bike with a 1301cc V-twin engine, cutting-edge electronics, and aggressive design built for extreme performance and precision.', 'Motorcycles/Big_Bike/ktm_1290_super_duke_r_evo.webp', 'out_of_stock', 6, 5, 0, '2025-05-05 18:02:11', '2025-05-20 15:19:45'),
	(96, 'Ducati Panigale V4', 3229000.00, 'Motorcycles', 'Sports', 'Flagship supersport motorcycle with a 1103cc V4 engine, race-derived technology, and cutting-edge aerodynamics for ultimate track and street performance.', 'Motorcycles/Sports/ducati_panigale_v4.webp', 'out_of_stock', 6, 5, 0, '2025-05-05 18:02:11', '2025-05-20 15:19:45'),
	(97, 'Ducati XDiavel', 2050000.00, 'Motorcycles', 'Big_Bike', 'Premium power cruiser combining Italian performance with relaxed ergonomics, featuring a 1262cc Testastretta engine and advanced rider aids.', 'Motorcycles/Big_Bike/ducati_xdiavel.webp', 'out_of_stock', 6, 5, 0, '2025-05-05 18:02:11', '2025-05-20 15:19:45');

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

-- Data exporting was unselected.

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

-- Data exporting was unselected.

-- Dumping structure for table seraphim_luxe.stocks_history
CREATE TABLE IF NOT EXISTS `stocks_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `stock_history_type` enum('initial','restock','adjustment','reservation','return') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `quantity_change` int NOT NULL,
  `previous_quantity` int NOT NULL,
  `new_quantity` int NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `admin_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `stocks_history_accounts_id_fkey` (`admin_id`),
  KEY `stocks_history_products_id_fkey` (`product_id`),
  CONSTRAINT `stocks_history_accounts_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `accounts` (`id`),
  CONSTRAINT `stocks_history_products_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

SET FOREIGN_KEY_CHECKS = 1;
