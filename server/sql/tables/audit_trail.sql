/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE TABLE IF NOT EXISTS `audit_trail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action_type` enum('auth_signin','auth_signup','auth_signout','auth_password_change','profile_update','account_suspension','account_deletion','product_view','cart_add','cart_remove','cart_update','wishlist_add','wishlist_remove','order_create','order_update','order_cancel','admin_product_create','admin_product_update','admin_product_delete','admin_category_create','admin_category_update','admin_category_delete','admin_stock_update','admin_settings_update','admin_account_create','admin_account_update','admin_account_suspend','order_invoice_print','profile_preferences_update','order_invoice_report_print') COLLATE utf8mb4_general_ci NOT NULL,
  `resource_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `resource_id` int DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_general_ci,
  `session_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `details` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_resource` (`resource_type`,`resource_id`),
  CONSTRAINT `audit_trail_accounts_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `audit_trail_chk_1` CHECK (json_valid(`old_values`)),
  CONSTRAINT `audit_trail_chk_2` CHECK (json_valid(`new_values`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `audit_trail` (`id`, `user_id`, `action_type`, `resource_type`, `resource_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `session_id`, `details`, `created_at`) VALUES
	(359, NULL, 'auth_signout', 'session', NULL, '{"user_id":"55","first_name":"Brian Lawrence","last_name":"Pasco","email":"qblcpasco@tip.edu.ph","name":"Brian Lawrence Pasco","role":"admin"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'User signed out: qblcpasco@tip.edu.ph', '2025-10-10 14:05:29'),
	(360, NULL, 'auth_signout', 'session', NULL, '{"user_id":"55","first_name":"Brian Lawrence","last_name":"Pasco","email":"qblcpasco@tip.edu.ph","name":"Brian Lawrence Pasco","role":"admin"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'User signed out: qblcpasco@tip.edu.ph', '2025-10-10 15:40:32'),
	(361, NULL, 'cart_add', 'cart', 11, NULL, '{"quantity":1,"product_name":"Bella Madre Gold Necklace"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'Added 1 Bella Madre Gold Necklace to cart', '2025-10-10 16:06:18'),
	(362, NULL, 'wishlist_add', 'wishlist', 36, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'Added GLAMIRA Black Stud Earring to wishlist', '2025-10-11 10:34:11'),
	(363, NULL, 'wishlist_remove', 'wishlist', 36, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'Removed AMYO Tiny Stud Earring from wishlist', '2025-10-11 10:34:12'),
	(364, NULL, 'wishlist_add', 'wishlist', 22, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'Added Nyx Ear Silver Stud to wishlist', '2025-10-11 10:49:52'),
	(365, NULL, 'wishlist_remove', 'wishlist', 22, NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'Removed Hammered Silver Stud from wishlist', '2025-10-11 10:49:53'),
	(366, NULL, 'cart_add', 'cart', 36, NULL, '{"quantity":1,"product_name":"AMYO Tiny Stud Earring"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'Added 1 AMYO Tiny Stud Earring to cart', '2025-10-11 16:03:48'),
	(367, NULL, 'auth_signout', 'session', NULL, '{"user_id":"55","first_name":"Brian Lawrence","last_name":"Pasco","email":"qblcpasco@tip.edu.ph","name":"Brian Lawrence Pasco","role":"admin"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'User signed out: qblcpasco@tip.edu.ph', '2025-10-11 16:15:50'),
	(368, NULL, 'auth_signout', 'session', NULL, '{"user_id":"56","first_name":"Brian","last_name":"Pasco","email":"brianpasco1206@gmail.com","name":"Brian Pasco","role":"customer"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'User signed out: brianpasco1206@gmail.com', '2025-10-12 06:06:28'),
	(369, NULL, 'auth_signout', 'session', NULL, '{"user_id":"55","first_name":"Brian Lawrence","last_name":"Pasco","email":"qblcpasco@tip.edu.ph","name":"Brian Lawrence Pasco","role":"admin"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'User signed out: qblcpasco@tip.edu.ph', '2025-10-12 08:18:33'),
	(370, NULL, 'profile_update', 'user_profile', NULL, '{}', '{"full_name":"Brian Pasco","phone_number":"w","province":"w","city":"w","barangay":"w","postal_code":"1","street_address":"w","is_default_billing":true,"is_default_shipping":true}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'User profile updated', '2025-10-12 08:19:15'),
	(371, NULL, 'order_create', 'order', 45, NULL, '{"order_number":"ORD-1760257157634-35","items_count":1,"product_names":"Crystal Pendant Leather Necklace"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'Order created for: Crystal Pendant Leather Necklace', '2025-10-12 08:19:19'),
	(372, NULL, 'order_create', 'order', 46, NULL, '{"order_number":"ORD-1760257211244-901","items_count":1,"product_names":"Crystal Pendant Leather Necklace"}', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'Order created for: Crystal Pendant Leather Necklace', '2025-10-12 08:20:12'),
	(373, NULL, 'auth_signout', 'session', NULL, '{"user_id":"57","first_name":"Brian Lawrence","last_name":"Pasco","email":"qblcpasco@tip.edu.ph","name":"Brian Lawrence Pasco","role":"admin"}', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0', NULL, 'User signed out: qblcpasco@tip.edu.ph', '2025-10-12 09:29:10');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
