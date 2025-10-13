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

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` enum('customer','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'customer',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `phone_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `currency` enum('CAD','PHP','JPY','USD','EUR') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'PHP',
  `preferred_shipping_address` enum('home','billing','shipping') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `preferred_payment_method` enum('cash_on_delivery','bank_transfer','paypal','credit_card') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `default_billing_address` int DEFAULT NULL,
  `default_shipping_address` int DEFAULT NULL,
  `is_suspended` tinyint NOT NULL DEFAULT '0',
  `email_verified` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `accounts_account_addresses_default_billing_address_fkey` (`default_billing_address`),
  KEY `accounts_account_addresses_default_shipping_address_fkey` (`default_shipping_address`),
  CONSTRAINT `accounts_account_addresses_default_billing_address_fkey` FOREIGN KEY (`default_billing_address`) REFERENCES `account_addresses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `accounts_account_addresses_default_shipping_address_fkey` FOREIGN KEY (`default_shipping_address`) REFERENCES `account_addresses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `account_addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `full_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `phone_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `province` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `barangay` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `postal_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `street_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `modified_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `account_addresses_accounts_id_fkey` (`account_id`),
  CONSTRAINT `account_addresses_accounts_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `audit_trail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action_type` enum('auth_signin','auth_signup','auth_signout','auth_password_change','profile_update','account_suspension','account_deletion','product_view','cart_add','cart_remove','cart_update','wishlist_add','wishlist_remove','order_create','order_update','order_cancel','admin_product_create','admin_product_update','admin_product_delete','admin_category_create','admin_category_update','admin_category_delete','admin_stock_update','admin_settings_update','admin_account_create','admin_account_update','admin_account_suspend','order_invoice_print','profile_preferences_update','order_invoice_report_print','customer_account_remove','admin_account_remove','admin_promotion_create','admin_promotion_update','admin_promotion_delete','admin_promotion_toggle','admin_cms_page_update') COLLATE utf8mb4_general_ci NOT NULL,
  `resource_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `resource_id` int DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_general_ci,
  `session_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `details` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_resource` (`resource_type`,`resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


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
  CONSTRAINT `carts_products_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `chatbot_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `session_id` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `message_type` enum('chatbot','user') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'user',
  `user_type` enum('customer','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'customer',
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `context_blob` longtext COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `modified_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chatbot_sessions_index_keys` (`user_id`,`session_id`,`user_type`,`created_at`),
  CONSTRAINT `chatbot_sessions_accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `cms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `page_slug` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_slug` (`page_slug`),
  KEY `idx_page_slug` (`page_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `cms` (`id`, `page_slug`, `title`, `content`, `created_at`, `updated_at`, `last_updated_by`) VALUES
	(1, 'about', 'About Us Content', 'Driven by Passion, Fueled by Expressions\n\nAt Seraphim Luxe, we believe that every accessory should be meaningful, versatile, and timeless. Whether you\'re expressing your daily style, making a statement, or seeking the perfect complement to your personality, our mission is to provide you with top-quality unisex jewelry and accessories to enhance your personal expression.\n\nWho We Ares\n\nFounded with a passion for inclusive fashion and a commitment to excellence, Seraphim Luxe has grown into a trusted name in the accessories industry. We cater to style enthusiasts of all preferences, offering a wide selection of unisex jewelry and premium accessories to ensure that your personal style shines at its best.', '2025-09-07 14:08:07', '2025-09-30 13:02:39', NULL),
	(2, 'contact', 'Contact Information', 'Contact Seraphim Luxes\n\nWe\'d love to hear from you! Get in touch with our team.\n\nEmail: info@seraphimluxe.com\nPhone: +1 (555) 123-4567\nAddress: 123 Fashion Avenue, Style District, City 10001\n\nBusiness Hours:s\nMonday-Friday: 9AM-6PM\nSaturday: 10AM-4PM\nSunday: Closed', '2025-09-07 14:08:07', '2025-09-17 03:36:26', NULL),
	(3, 'faqs', 'Frequently Asked Questions', 'Frequently Asked Questions\n\nFind answers to common questions about our products, services, and policies.\n\nOrders & Shippings\n\nQ: How long does shipping take?\nA: Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business days.\n\nQ: Do you ship internationally?\nA: Yes, we ship to most countries worldwide. International shipping times vary by location.\n\nReturns & Exchangess\n\nQ: What is your return policy?\nA: We accept returns within 30 days of purchase with original receipt and tags attached.\n\nQ: How do I exchange an item?\nA: Please contact our customer service team to initiate an exchange.', '2025-09-07 14:08:07', '2025-09-16 18:03:28', NULL),
	(4, 'privacy', 'Privacy Policy', 'Privacy Policy\n\nEffective Date: January 1, 2023\n\nIntroductions\n\nAt Seraphim Luxe, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.\n\nInformation We Collects\n\nWe collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This may include your name, email address, shipping address, payment information, and any other details you choose to provide.', '2025-09-07 14:08:07', '2025-09-16 18:03:37', NULL),
	(7, 'home', 'Home', 'FEATURED_TITLE: Featured Products\n\nFEATURED_DESC: Discover our handpicked selection of standout pieces, carefully chosen for their exceptional quality and style.\n\nBESTSELLERS_TITLE: Best Sellers\n\nBESTSELLERS_DESC: Shop our most popular items loved by customers worldwide for their quality and timeless appeal.\n\nNEWARRIVALS_TITLE: New Arrivals\n\nNEWARRIVALS_DESC: Be the first to discover our latest additions – fresh styles and trending pieces just added to our collection.\n\nTRUST_TITLE: Why Style Enthusiasts Trust Seraphim Luxe\n\nTRUST_DESC: At Seraphim Luxe, we go the extra mile to ensure you get the best unisex accessories and jewelry at unbeatable quality. Whether you\'re expressing your daily style or seeking the perfect statement piece, we\'ve got what you need to make every look elegant and authentic.\n\nTRUST_CARD1_ICON: fa-solid fa-truck\nTRUST_CARD1_TITLE: Fast Delivery\nTRUST_CARD1_DESC: Get your accessories delivered quickly and securely anywhere in the Philippines.\n\nTRUST_CARD2_ICON: fa-solid fa-star\nTRUST_CARD2_TITLE: Quality Guaranteed\nTRUST_CARD2_DESC: Every piece is carefully selected and quality-tested for durability and style.\n\nTRUST_CARD3_ICON: fa-solid fa-headset\nTRUST_CARD3_TITLE: Expert Support\nTRUST_CARD3_DESC: Our team is ready to help you find the perfect pieces for your unique style.', '2025-09-15 16:40:50', '2025-09-30 13:45:30', NULL);

CREATE TABLE IF NOT EXISTS `cms_banners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('hero','header','carousel') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `page` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'https://res.cloudinary.com/dfvy7i4uc/image/upload/placeholder_vcj6hz.webp',
  `created_at` datetime NOT NULL DEFAULT (now()),
  `modified_at` datetime NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `cms_banners` (`id`, `type`, `page`, `image_url`, `created_at`, `modified_at`) VALUES
	(1, 'carousel', 'home', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/Home-Page-01_yhluwj.jpg', '2025-10-07 12:13:34', '2025-10-09 20:16:56'),
	(2, 'carousel', 'home', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/Home-Page-02_bms6yi.jpg', '2025-10-07 12:13:34', '2025-10-09 20:16:44'),
	(3, 'carousel', 'home', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/Home-Page-03_wbhqwk.jpg', '2025-10-07 12:13:34', '2025-10-09 20:16:29'),
	(4, 'hero', 'sign-in', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/sign-in_ettdlu.webp', '2025-10-07 12:16:12', '2025-10-08 23:34:01'),
	(5, 'hero', 'sign-up', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/sign-up_pjyxoj.webp', '2025-10-07 12:16:12', '2025-10-07 12:16:40'),
	(6, 'header', 'about-us', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/about-us_ztw9dq.webp', '2025-10-07 12:16:12', '2025-10-07 12:18:56'),
	(7, 'header', 'cart', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/Cart_Banner_nks23u.webp', '2025-10-07 12:19:32', '2025-10-09 23:52:41'),
	(8, 'header', 'checkout', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/Checkout_Banner_gngfx2.webp', '2025-10-07 12:19:32', '2025-10-09 23:51:59'),
	(9, 'header', 'collections', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/collections_p9bd1e.webp', '2025-10-07 12:19:32', '2025-10-09 23:53:18'),
	(10, 'header', 'contact-us', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/Contact_Us_Banner_v7xuqk.webp', '2025-10-07 12:19:32', '2025-10-09 23:51:48'),
	(11, 'header', 'faqs', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/FAQs_Banner_y0geup.webp', '2025-10-07 12:19:32', '2025-10-09 23:52:31'),
	(12, 'header', 'orders', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/Orders_Banner_iydcrz.png', '2025-10-07 12:19:32', '2025-10-10 00:53:31'),
	(13, 'header', 'privacy-policy', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/Privacy_Policy_Banner_rp3vo1.webp', '2025-10-07 12:19:32', '2025-10-09 23:52:18'),
	(14, 'header', 'wishlist', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/Wishlist_Banner_bzvszs.webp', '2025-10-07 12:19:32', '2025-10-09 23:51:37'),
	(15, 'header', 'profile', 'https://res.cloudinary.com/dfvy7i4uc/image/upload/Profile_Banner_jda3yb.webp', '2025-10-09 23:54:30', '2025-10-09 23:57:19');

CREATE TABLE IF NOT EXISTS `cms_promotions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `discount` decimal(5,2) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT (1),
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `modified_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `type` enum('cart','wishlist','orders','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notifications_account_id_index` (`account_id`) USING BTREE,
  KEY `notifications_inbox_created_at_index` (`created_at`) USING BTREE,
  KEY `notifications_inbox_account_index` (`account_id`) USING BTREE,
  KEY `notifications_inbox_read_status_index` (`is_read`) USING BTREE,
  KEY `notifications_inbox_read_index` (`is_read`) USING BTREE,
  CONSTRAINT `notifications_accounts_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `account_id` int NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('pending','processing','shipped','delivered','cancelled','returned','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL,
  `shipping_address_id` int NOT NULL,
  `billing_address_id` int NOT NULL,
  `payment_method` enum('cash_on_delivery','paypal','bank_transfer','credit_card') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'cash_on_delivery',
  `payment_status` enum('pending','paid','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `shipping_method` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `shipping_cost` decimal(10,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `admin_notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `tracking_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `modified_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `orders_accounts_id_fkey` (`account_id`),
  KEY `orders_account_addresses_shipping_address_fkey` (`shipping_address_id`) USING BTREE,
  KEY `orders_account_addresses_billing_address_fkey` (`billing_address_id`) USING BTREE,
  CONSTRAINT `orders_accounts_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_items_orders_id_fkey` (`order_id`),
  KEY `order_items_products_id_fkey` (`product_id`),
  CONSTRAINT `order_items_orders_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_products_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `order_refunds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `refund_amount` decimal(10,2) NOT NULL,
  `reason` enum('customer_request','defective_product','wrong_item','damaged_shipping','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `reason_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `refund_method` enum('cash','paypal','bank_transfer','credit_card') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('pending','processing','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `processed_by` int DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_refunds_orders_id_fkey` (`order_id`),
  CONSTRAINT `order_refunds_orders_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `old_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `new_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `changed_by` int DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_status_history_orders_id_fkey` (`order_id`),
  CONSTRAINT `order_status_history_orders_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `order_tracking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `tracking_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `carrier` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `tracked_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_tracking_orders_id_fkey` (`order_id`),
  CONSTRAINT `order_tracking_orders_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `platform_settings` (`id`, `setting_key`, `setting_value`, `created_at`, `updated_at`) VALUES
	(1, 'payment_cash_on_delivery_enabled', 'true', '2025-09-13 14:01:54', '2025-09-14 12:25:38'),
	(2, 'payment_bank_transfer_enabled', 'true', '2025-09-13 14:01:54', '2025-09-14 12:25:38'),
	(3, 'payment_paypal_enabled', 'true', '2025-09-13 14:01:54', '2025-09-18 12:09:49'),
	(4, 'payment_credit_card_enabled', 'true', '2025-09-13 14:01:54', '2025-09-14 12:25:38'),
	(5, 'currency_PHP_enabled', 'true', '2025-09-13 14:33:40', '2025-09-14 12:25:38'),
	(6, 'currency_USD_enabled', 'true', '2025-09-13 14:33:40', '2025-09-14 12:25:38'),
	(7, 'currency_EUR_enabled', 'true', '2025-09-13 14:33:40', '2025-09-14 12:25:38'),
	(8, 'currency_JPY_enabled', 'true', '2025-09-13 14:33:40', '2025-09-14 12:25:38'),
	(9, 'currency_CAD_enabled', 'true', '2025-09-13 14:33:40', '2025-09-14 12:25:38');

CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category_id` int NOT NULL DEFAULT '0',
  `subcategory_id` int NOT NULL DEFAULT '0',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `variants` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `stock_status` enum('in_stock','low_stock','out_of_stock') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'out_of_stock',
  `stock_quantity` int NOT NULL DEFAULT '0',
  `stock_threshold` int NOT NULL DEFAULT '5',
  `reserved_quantity` int NOT NULL DEFAULT '0',
  `views_count` int DEFAULT '0',
  `orders_count` int DEFAULT '0',
  `total_revenue` decimal(10,2) DEFAULT '0.00',
  `is_featured` tinyint NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `modified_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `products_product_categories_id_fkey` (`category_id`),
  KEY `products_product_subcategories_id_fkey` (`subcategory_id`),
  KEY `idx_products_views_count` (`views_count`),
  KEY `idx_products_orders_count` (`orders_count`),
  KEY `idx_products_created_at` (`created_at`),
  CONSTRAINT `products_product_categories_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `products_product_subcategories_id_fkey` FOREIGN KEY (`subcategory_id`) REFERENCES `product_subcategories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `products_chk_1` CHECK (json_valid(`variants`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `products` (`id`, `label`, `price`, `category_id`, `subcategory_id`, `description`, `image_url`, `variants`, `stock_status`, `stock_quantity`, `stock_threshold`, `reserved_quantity`, `views_count`, `orders_count`, `total_revenue`, `is_featured`, `created_at`, `modified_at`) VALUES
	(1, 'Maxi Pearl Gold Bracelet', 4500.00, 2, 4, 'Elegant maxi pearl bracelet in gold finish', 'products/maxi_pearl_gold_01', '[{"price": 4500, "stock": 10, "images": ["maxi_pearl_gold_01.webp", "maxi_pearl_gold_02.webp", "maxi_pearl_gold_03.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(2, 'Rigid Gold Bracelet', 3800.00, 2, 4, 'Classic rigid gold bracelet with modern design', 'products/rigid_gold_01', '[{"price": 3800, "stock": 10, "images": ["rigid_gold_01.webp", "rigid_gold_02.webp", "rigid_gold_03.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(3, 'Rigid Interlocking Gold Bracelet', 4200.00, 2, 4, 'Sophisticated interlocking design gold bracelet', 'products/rigid_interlocking_gold_01', '[{"price": 4200, "stock": 10, "images": ["rigid_interlocking_gold_01.webp", "rigid_interlocking_gold_02.webp", "rigid_interlocking_gold_03.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(4, 'Rigid with Relief Gold Bracelet', 4800.00, 2, 4, 'Textured relief design gold bracelet', 'products/rigid_with_relief_gold_01', '[{"price": 4800, "stock": 10, "images": ["rigid_with_relief_gold_01.webp", "rigid_with_relief_gold_02.webp", "rigid_with_relief_gold_03.webp", "rigid_with_relief_gold_04.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(5, 'Shiny Intertwined Gold Bracelet', 4000.00, 2, 4, 'Elegant intertwined design with shiny gold finish', 'products/shiny_intertwined_gold_01', '[{"price": 4000, "stock": 10, "images": ["shiny_intertwined_gold_01.webp", "shiny_intertwined_gold_02.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(6, 'Beaded Drop Earrings', 2800.00, 2, 5, 'Elegant beaded drop earrings for special occasions', 'products/beaded_drop_mixed_metal_01', '[{"price": 2800, "stock": 10, "images": ["beaded_drop_mixed_metal_01.webp", "beaded_drop_mixed_metal_02.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 1, '2025-08-27 20:17:17', '2025-10-09 12:20:24'),
	(7, 'Combined Flower Earrings', 3200.00, 2, 5, 'Beautiful flower-inspired earrings with intricate details', 'products/combined_flower_mixed_metal_01', '[{"price": 3200, "stock": 10, "images": ["combined_flower_mixed_metal_01.webp", "combined_flower_mixed_metal_02.webp", "combined_flower_mixed_metal_03.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(8, 'Flower Pendant Earrings', 2900.00, 2, 5, 'Delicate flower pendant earrings with graceful movement', 'products/flower_pendant_mixed_metal_01', '[{"price": 2900, "stock": 10, "images": ["flower_pendant_mixed_metal_01.webp", "flower_pendant_mixed_metal_02.webp", "flower_pendant_mixed_metal_03.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(9, 'Linked Hoop Earrings with Crystals', 3800.00, 2, 5, 'Stunning linked hoop earrings adorned with crystals', 'products/linked_hoop_earrings_mixed_metal_with_crystals_01', '[{"price": 3800, "stock": 10, "images": ["linked_hoop_earrings_mixed_metal_with_crystals_01.webp", "linked_hoop_earrings_mixed_metal_with_crystals_01.webp", "linked_hoop_earrings_mixed_metal_with_crystals_01.webp"], "material": "Mixed Metal with Crystals"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(10, 'Long Beaded Earrings', 3500.00, 2, 5, 'Dramatic long beaded earrings for evening wear', 'products/long_beaded_mixed_metal_01', '[{"price": 3500, "stock": 10, "images": ["long_beaded_mixed_metal_01.webp", "long_beaded_mixed_metal_02.webp", "long_beaded_mixed_metal_03.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(11, 'Bella Madre Gold Necklace', 7500.00, 2, 6, 'Luxurious Bella Madre collection gold necklace', 'products/bella_madre_gold_01', '[{"price": 7500, "stock": 10, "images": ["bella_madre_gold_01.webp", "bella_madre_gold_02.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 1, '2025-08-27 20:17:17', '2025-10-13 17:21:55'),
	(12, 'Crystal Pendant Leather Necklace', 4200.00, 2, 6, 'Modern crystal pendant on premium leather cord', 'products/pendant_leather_with_crystal_01', '[{"price": 4200, "stock": 10, "images": ["pendant_leather_with_crystal_01.webp", "pendant_leather_with_crystal_02.webp", "pendant_leather_with_crystal_03.webp"], "material": "Leather w/ Crystal"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(13, 'Drop Necklace with Sphere Silver', 5800.00, 2, 6, 'Elegant silver drop necklace with sphere pendant', 'products/drop_necklace_with_sphere_silver_01', '[{"price": 5800, "stock": 10, "images": ["drop_necklace_with_sphere_silver_01.webp", "drop_necklace_with_sphere_silver_01.webp", "drop_necklace_with_sphere_silver_01.webp", "drop_necklace_with_sphere_silver_01.webp"], "material": "Silver"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(14, 'Flower Pendant Gold Necklace', 6200.00, 2, 6, 'Exquisite flower pendant necklace in gold', 'products/flower_pendant_gold_01', '[{"price": 6200, "stock": 10, "images": ["flower_pendant_gold_01.webp", "flower_pendant_gold_02.webp", "flower_pendant_gold_03.webp", "flower_pendant_gold_04.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(15, 'Loved Circle Gold Necklace', 5500.00, 2, 6, 'Romantic circle pendant gold necklace', 'products/loved_circle_gold_01', '[{"price": 5500, "stock": 10, "images": ["loved_circle_gold_01.webp", "loved_circle_gold_02.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(16, 'Bancroft Scroll Silver Bracelet', 5200.00, 1, 1, 'Elegant scroll design silver bracelet for men', 'products/bancroft_scroll_silver_bracelet_01', '[{"price": 5200, "stock": 10, "images": ["bancroft_scroll_silver_bracelet_01.webp", "bancroft_scroll_silver_bracelet_02.webp"], "material": "Silver"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 1, '2025-08-27 20:17:17', '2025-09-18 11:55:40'),
	(17, 'Braided Bangle Bracelet', 4800.00, 1, 1, 'Classic braided bangle bracelet with modern appeal', 'products/braided_bangle_mixed_metal_bracelet_01', '[{"price": 4800, "stock": 10, "images": ["braided_bangle_mixed_metal_bracelet_01.webp", "braided_bangle_mixed_metal_bracelet_02.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 1, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(18, 'Minimal Cuban Bracelet', 3500.00, 1, 1, 'Sleek minimal cuban link bracelet', 'products/minimal_cuban_steel_bracelet_01', '[{"price": 3500, "stock": 25, "images": ["minimal_cuban_steel_bracelet_01.webp", "minimal_cuban_steel_bracelet_02.webp"], "material": "Steel"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(19, 'Tiffany Lock Bangle', 7500.00, 1, 1, 'Luxury lock design bangle bracelet', 'products/tiffany_lock_bangle_steel_01', '[{"price": 7500, "stock": 10, "images": ["tiffany_lock_bangle_steel_01.webp", "tiffany_lock_bangle_steel_02.webp"], "material": "Steel"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(20, 'Vesper Chain Bracelet Gold', 6200.00, 1, 1, 'Premium vesper chain bracelet in gold finish', 'products/vesper_chain_bracelet_gold_01', '[{"price": 6200, "stock": 10, "images": ["vesper_chain_bracelet_gold_01.webp", "vesper_chain_bracelet_gold_01.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(21, 'Celestial Cross Earrings', 2800.00, 1, 2, 'Bold celestial cross design earrings', 'products/celestial_cross_earrings_mixed_metal_01', '[{"price": 2800, "stock": 10, "images": ["celestial_cross_earrings_mixed_metal_01.webp", "celestial_cross_earrings_mixed_metal_02.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(22, 'Hammered Silver Stud', 2200.00, 1, 2, 'Textured hammered silver stud earrings', 'products/hammered_silver_stud_01', '[{"price": 2200, "stock": 10, "images": ["hammered_silver_stud_01.webp", "hammered_silver_stud_02.webp"], "material": "Silver"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-10-09 12:20:24'),
	(23, 'Nyx Ear Silver Stud', 2500.00, 1, 2, 'Sleek Nyx collection silver stud earrings', 'products/nyx_ear_silver_stud_01', '[{"price": 2500, "stock": 10, "images": ["nyx_ear_silver_stud_01.webp", "nyx_ear_silver_stud_01.webp"], "material": "Silver"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-10-09 12:20:24'),
	(24, 'Square Stud Earrings', 2400.00, 1, 2, 'Modern square design stud earrings', 'products/square_stud_earrings_mixed_metal_01', '[{"price": 2400, "stock": 10, "images": ["square_stud_earrings_mixed_metal_01.webp", "square_stud_earrings_mixed_metal_02.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-10-09 12:20:24'),
	(25, 'Tiffany Titan Earrings', 4500.00, 1, 2, 'Premium Tiffany Titan collection earrings', 'products/tiffany_titan_earrings_titanium_01', '[{"price": 4500, "stock": 10, "images": ["tiffany_titan_earrings_titanium_01.webp", "tiffany_titan_earrings_titanium_02.webp"], "material": "Titanium"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(26, 'Classic Mens Minimal Box Cuban Chain', 6000.00, 1, 3, 'Premium minimal box cuban chain for men', 'products/classic_mens_minimal_box_cuban_chain_silver_01', '[{"price": 6000, "stock": 10, "images": ["classic_mens_minimal_box_cuban_chain_silver_01.webp", "classic_mens_minimal_box_cuban_chain_silver_02.webp", "classic_mens_minimal_box_cuban_chain_silver_03.webp"], "material": "Silver"}, {"price": 9000, "stock": 10, "images": ["classic_mens_minimal_box_cuban_chain_gold_01.webp", "classic_mens_minimal_box_cuban_chain_gold_02.webp", "classic_mens_minimal_box_cuban_chain_gold_03.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(27, 'Minimal Pendant Necklace', 4200.00, 1, 3, 'Sleek minimal pendant necklace for everyday wear', 'products/minimal_pendant_necklace_mixed_metal_01', '[{"price": 4200, "stock": 25, "images": ["minimal_pendant_necklace_mixed_metal_01.webp", "minimal_pendant_necklace_mixed_metal_02.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(28, 'Monieyta Rectangular Spiral Bar Pendant', 5800.00, 1, 3, 'Unique rectangular spiral bar pendant design', 'products/monieyta_rectangular_spiral_bar_pendant_steel_01', '[{"price": 5800, "stock": 15, "images": ["monieyta_rectangular_spiral_bar_pendant_steel_01.webp", "monieyta_rectangular_spiral_bar_pendant_steel_02.webp"], "material": "Steel"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(29, 'N917 Curb Necklace', 5200.00, 1, 3, 'Classic N917 curb chain necklace', 'products/n917_curb_necklace_mixed_metal_01', '[{"price": 5200, "stock": 18, "images": ["n917_curb_necklace_mixed_metal_01.webp", "n917_curb_necklace_mixed_metal_02.webp", "n917_curb_necklace_mixed_metal_03.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(30, 'Sleek Apex Titanium Steel Bar Pendant', 6500.00, 1, 3, 'Modern titanium steel bar pendant with sleek design', 'products/sleek_apex_titanium_steel_bar_pendant_01', '[{"price": 6500, "stock": 12, "images": ["sleek_apex_titanium_steel_bar_pendant_01.webp", "sleek_apex_titanium_steel_bar_pendant_02.webp"], "material": "Titanium Steel"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(31, 'David Yurman Box Chain Bracelet', 8500.00, 3, 7, 'Luxury David Yurman box chain bracelet for all genders', 'products/david_yurman_box_chain_bracelet_silver_01', '[{"price": 8500, "stock": 6, "images": ["david_yurman_box_chain_bracelet_silver_01.webp", "david_yurman_box_chain_bracelet_silver_02.webp"], "material": "Silver"}, {"price": 8800, "stock": 6, "images": ["david_yurman_box_chain_bracelet_black_01.webp", "david_yurman_box_chain_bracelet_black_02.webp"], "material": "Black"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(32, 'Gucci Interlocking G Silver Bracelet', 9200.00, 3, 7, 'Iconic Gucci interlocking G silver bracelet', 'products/gucci_interlocking_g_silver_bracelet_silver_01', '[{"price": 9200, "stock": 10, "images": ["gucci_interlocking_g_silver_bracelet_silver_01.webp", "gucci_interlocking_g_silver_bracelet_silver_02.webp", "gucci_interlocking_g_silver_bracelet_silver_03.webp"], "material": "Silver"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(33, 'Montblanc Meisterstück Collection Steel 3 Rings Bracelet', 7800.00, 3, 7, 'Premium Montblanc Meisterstück steel and leather bracelet', 'products/montblanc_meisterstuck_collection_steel_3_rings_bracelet_white_leather_01', '[{"price": 7800, "stock": 8, "images": ["montblanc_meisterstuck_collection_steel_3_rings_bracelet_white_leather_01.webp"], "material": "Steel with White Leather"}, {"price": 7900, "stock": 8, "images": ["montblanc_meisterstuck_collection_steel_3_rings_bracelet_red_leather_02.webp"], "material": "Steel with Red Leather"}, {"price": 7850, "stock": 8, "images": ["montblanc_meisterstuck_collection_steel_3_rings_bracelet_brown_leather_03.webp"], "material": "Steel with Brown Leather"}, {"price": 7950, "stock": 8, "images": ["montblanc_meisterstuck_collection_steel_3_rings_bracelet_light_blue_leather_04.webp"], "material": "Steel with Light Blue Leather"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-10-13 04:03:51'),
	(34, 'Tateossian Pop Rigato Double Wrap Leather Bracelet', 4500.00, 3, 7, 'Contemporary double wrap leather bracelet by Tateossian', 'products/tateossian_pop_rigato_double_wrap_leather_bracelet_leather_01', '[{"price": 4400, "stock": 5, "images": ["tateossian_pop_rigato_double_wrap_leather_bracelet_black_leather_02.webp"], "material": "Black Leather"}, {"price": 4450, "stock": 5, "images": ["tateossian_pop_rigato_double_wrap_leather_bracelet_brown_leather_03.webp"], "material": "Brown Leather"}, {"price": 4500, "stock": 5, "images": ["tateossian_pop_rigato_double_wrap_leather_bracelet_blue_leather_04.webp", "tateossian_pop_rigato_double_wrap_leather_bracelet_blue_leather_05.webp"], "material": "Blue Leather"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(35, 'Tom Wood Curb M Bracelet', 5200.00, 3, 7, 'Scandinavian design Tom Wood curb bracelet', 'products/tom_wood_curb_m_bracelet_silver_01', '[{"price": 5200, "stock": 9, "images": ["tom_wood_curb_m_bracelet_silver_01.webp", "tom_wood_curb_m_bracelet_silver_02.webp"], "material": "Silver"}, {"price": 5800, "stock": 9, "images": ["tom_wood_curb_m_bracelet_gold_03.webp", "tom_wood_curb_m_bracelet_gold_04.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(36, 'AMYO Tiny Stud Earring', 1800.00, 3, 8, 'Minimalist tiny stud earrings by AMYO', 'products/amyo_tiny_stud_earring_04', '[{"price": 1800, "stock": 10, "images": ["amyo_tiny_stud_earring_gold_01.webp"], "material": "Gold"}, {"price": 1600, "stock": 10, "images": ["amyo_tiny_stud_earring_copper_02.webp"], "material": "Copper"}, {"price": 1700, "stock": 10, "images": ["amyo_tiny_stud_earring_silver_03.webp"], "material": "Silver"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-10-09 12:20:24'),
	(37, 'GLAMIRA Black Stud Earring', 2200.00, 3, 8, 'Elegant stud earrings by GLAMIRA in multiple finishes', 'products/glamira_black_stud_earring_01', '[{"price": 2200, "stock": 8, "images": ["glamira_black_stud_earring_silver_02.webp"], "material": "Silver"}, {"price": 2400, "stock": 9, "images": ["glamira_black_stud_earring_gold_03.webp"], "material": "Gold"}, {"price": 2350, "stock": 8, "images": ["glamira_black_stud_earring_rosegold_04.webp"], "material": "Rose Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-10-09 12:20:24'),
	(38, 'JAXXON Silver Cross Stud Earring', 2800.00, 3, 8, 'Bold silver cross stud earrings by JAXXON', 'products/jaxxon_silver_cross_stud_earring_silver_01', '[{"price": 2800, "stock": 10, "images": ["jaxxon_silver_cross_stud_earring_silver_01.webp", "jaxxon_silver_cross_stud_earring_silver_02.webp", "jaxxon_silver_cross_stud_earring_silver_03.webp", "jaxxon_silver_cross_stud_earring_silver_04.webp"], "material": "Silver"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(39, 'MEJURI Gold Huggie Hoop Earrings', 3200.00, 3, 8, 'Classic gold huggie hoop earrings by MEJURI', 'products/mejuri_gold_huggie_hoop_earrings_gold_01', '[{"price": 3200, "stock": 10, "images": ["mejuri_gold_huggie_hoop_earrings_gold_01.webp", "mejuri_gold_huggie_hoop_earrings_gold_02.webp", "mejuri_gold_huggie_hoop_earrings_gold_03.webp", "mejuri_gold_huggie_hoop_earrings_gold_04.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(40, 'REGALROSE Small Plain Silver Hoop Earring', 2400.00, 3, 8, 'Simple and elegant small silver hoop earrings', 'products/regalrose_small_plain_silver_hoop_earring_silver_01', '[{"price": 2400, "stock": 10, "images": ["regalrose_small_plain_silver_hoop_earring_silver_01.webp", "regalrose_small_plain_silver_hoop_earring_silver_02.webp", "regalrose_small_plain_silver_hoop_earring_silver_03.webp"], "material": "Silver"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-10-09 12:20:24'),
	(41, 'Caitlyn Minimalist Interlocking Circles Necklace', 4800.00, 3, 9, 'Modern minimalist interlocking circles necklace', 'products/caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_01', '[{"price": 4800, "stock": 8, "images": ["caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_01.webp", "caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_02.webp", "caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_03.webp", "caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_04.webp"], "material": "Mixed Metal"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 1, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(42, 'GIVA Anushka Sharma Silver Deer Heart Necklace', 3200.00, 3, 9, 'Elegant deer heart necklace by GIVA featuring Anushka Sharma collection', 'products/giva_anushka_sharma_silver_deer_heart_necklace_silver_01', '[{"price": 3200, "stock": 10, "images": ["giva_anushka_sharma_silver_deer_heart_necklace_silver_01.webp", "giva_anushka_sharma_silver_deer_heart_necklace_silver_02.webp", "giva_anushka_sharma_silver_deer_heart_necklace_silver_03.webp", "giva_anushka_sharma_silver_deer_heart_necklace_silver_04.webp"], "material": "Silver"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(43, 'GLAMIRA Minimalist Necklace', 2800.00, 3, 9, 'Sleek minimalist necklace design by GLAMIRA', 'products/glamira_minimalist_necklaces_gold_01', '[{"price": 2800, "stock": 10, "images": ["glamira_minimalist_necklaces_gold_01.webp", "glamira_minimalist_necklaces_gold_02.webp", "glamira_minimalist_necklaces_gold_03.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(44, 'Minimalist Lab Roman Numerals Diamond Band Necklace', 5500.00, 3, 9, 'Sophisticated roman numerals diamond band necklace', 'products/minimalist_lab_roman_numerals_diamond_band_necklace_gold_01', '[{"price": 5500, "stock": 8, "images": ["minimalist_lab_roman_numerals_diamond_band_necklace_gold_01.webp", "minimalist_lab_roman_numerals_diamond_band_necklace_gold_04.webp"], "material": "Gold with Diamonds"}, {"price": 5400, "stock": 4, "images": ["minimalist_lab_roman_numerals_diamond_band_necklace_rosegold_02.webp"], "material": "Rose Gold with Diamonds"}, {"price": 5200, "stock": 3, "images": ["minimalist_lab_roman_numerals_diamond_band_necklace_silver_03"], "material": "Silver with Diamonds"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01'),
	(45, 'Tiffany T Smile Necklace', 8500.00, 3, 9, 'Iconic Tiffany T Smile collection necklace', 'products/tiffany_t_smile_necklace_gold_01', '[{"price": 8500, "stock": 10, "images": ["tiffany_t_smile_necklace_gold_01.webp", "tiffany_t_smile_necklace_gold_02.webp", "tiffany_t_smile_necklace_gold_03.webp", "tiffany_t_smile_necklace_gold_04.webp"], "material": "Gold"}]', 'in_stock', 10, 3, 0, 0, 0, 0.00, 0, '2025-08-27 20:17:17', '2025-09-18 11:54:01');

CREATE TABLE IF NOT EXISTS `products_promotions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `promotion_id` int NOT NULL,
  `product_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `promotions_products_unique_key` (`promotion_id`,`product_id`),
  KEY `products_promotions_products_product_id_fkey` (`product_id`),
  KEY `promotions_products_index_key` (`promotion_id`,`product_id`),
  CONSTRAINT `products_promotions_cms_promotions_promotion_id_fkey` FOREIGN KEY (`promotion_id`) REFERENCES `cms_promotions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `products_promotions_products_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `product_categories` (`id`, `name`, `description`, `is_active`, `sort_order`, `created_at`, `modified_at`) VALUES
	(1, 'Male', 'Jewelry and accessories for men', 1, 1, '2025-09-03 14:29:17', '2025-09-03 16:43:00'),
	(2, 'Female', 'Jewelry and accessories for women', 1, 2, '2025-09-03 14:29:17', '2025-09-03 14:29:17'),
	(3, 'Unisex', 'Jewelry and accessories suitable for all genders', 1, 3, '2025-09-03 14:29:17', '2025-09-03 14:29:17');

CREATE TABLE IF NOT EXISTS `product_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `display_order` int DEFAULT '0',
  `is_primary` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `product_images` (`id`, `product_id`, `image_url`, `display_order`, `is_primary`, `created_at`) VALUES
	(1, 1, 'products/maxi_pearl_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(2, 1, 'products/maxi_pearl_gold_02', 1, 0, '2025-09-10 18:10:50'),
	(3, 1, 'products/maxi_pearl_gold_03', 2, 0, '2025-09-10 18:10:50'),
	(4, 2, 'products/rigid_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(5, 2, 'products/rigid_gold_02', 1, 0, '2025-09-10 18:10:50'),
	(6, 2, 'products/rigid_gold_03', 2, 0, '2025-09-10 18:10:50'),
	(7, 3, 'products/rigid_interlocking_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(8, 3, 'products/rigid_interlocking_gold_02', 1, 0, '2025-09-10 18:10:50'),
	(9, 3, 'products/rigid_interlocking_gold_03', 2, 0, '2025-09-10 18:10:50'),
	(10, 4, 'products/rigid_with_relief_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(11, 4, 'products/rigid_with_relief_gold_02', 1, 0, '2025-09-10 18:10:50'),
	(12, 4, 'products/rigid_with_relief_gold_03', 2, 0, '2025-09-10 18:10:50'),
	(13, 4, 'products/rigid_with_relief_gold_04', 3, 0, '2025-09-10 18:10:50'),
	(14, 5, 'products/shiny_intertwined_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(15, 5, 'products/shiny_intertwined_gold_02', 1, 0, '2025-09-10 18:10:50'),
	(16, 6, 'products/beaded_drop_mixed_metal_01', 0, 1, '2025-09-10 18:10:50'),
	(17, 6, 'products/beaded_drop_mixed_metal_02', 1, 0, '2025-09-10 18:10:50'),
	(18, 7, 'products/combined_flower_mixed_metal_01', 0, 1, '2025-09-10 18:10:50'),
	(19, 7, 'products/combined_flower_mixed_metal_02', 1, 0, '2025-09-10 18:10:50'),
	(20, 7, 'products/combined_flower_mixed_metal_03', 2, 0, '2025-09-10 18:10:50'),
	(21, 8, 'products/flower_pendant_mixed_metal_01', 0, 1, '2025-09-10 18:10:50'),
	(22, 8, 'products/flower_pendant_mixed_metal_02', 1, 0, '2025-09-10 18:10:50'),
	(23, 8, 'products/flower_pendant_mixed_metal_03', 2, 0, '2025-09-10 18:10:50'),
	(24, 9, 'products/linked_hoop_earrings_mixed_metal_with_crystals_01', 0, 1, '2025-09-10 18:10:50'),
	(25, 10, 'products/long_beaded_mixed_metal_01', 0, 1, '2025-09-10 18:10:50'),
	(26, 10, 'products/long_beaded_mixed_metal_02', 1, 0, '2025-09-10 18:10:50'),
	(27, 10, 'products/long_beaded_mixed_metal_03', 2, 0, '2025-09-10 18:10:50'),
	(28, 11, 'products/bella_madre_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(29, 11, 'products/bella_madre_gold_02', 1, 0, '2025-09-10 18:10:50'),
	(30, 12, 'products/pendant_leather_with_crystal_01', 0, 1, '2025-09-10 18:10:50'),
	(31, 12, 'products/pendant_leather_with_crystal_02', 1, 0, '2025-09-10 18:10:50'),
	(32, 12, 'products/pendant_leather_with_crystal_03', 2, 0, '2025-09-10 18:10:50'),
	(33, 13, 'products/drop_necklace_with_sphere_silver_01', 0, 1, '2025-09-10 18:10:50'),
	(34, 14, 'products/flower_pendant_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(35, 14, 'products/flower_pendant_gold_02', 1, 0, '2025-09-10 18:10:50'),
	(36, 14, 'products/flower_pendant_gold_03', 2, 0, '2025-09-10 18:10:50'),
	(37, 14, 'products/flower_pendant_gold_04', 3, 0, '2025-09-10 18:10:50'),
	(38, 15, 'products/loved_circle_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(39, 15, 'products/loved_circle_gold_02', 1, 0, '2025-09-10 18:10:50'),
	(40, 16, 'products/bancroft_scroll_silver_bracelet_01', 0, 1, '2025-09-10 18:10:50'),
	(41, 16, 'products/bancroft_scroll_silver_bracelet_02', 1, 0, '2025-09-10 18:10:50'),
	(42, 17, 'products/braided_bangle_mixed_metal_bracelet_01', 0, 1, '2025-09-10 18:10:50'),
	(43, 17, 'products/braided_bangle_mixed_metal_bracelet_02', 1, 0, '2025-09-10 18:10:50'),
	(44, 18, 'products/minimal_cuban_steel_bracelet_01', 0, 1, '2025-09-10 18:10:50'),
	(45, 18, 'products/minimal_cuban_steel_bracelet_02', 1, 0, '2025-09-10 18:10:50'),
	(46, 19, 'products/tiffany_lock_bangle_steel_01', 0, 1, '2025-09-10 18:10:50'),
	(47, 19, 'products/tiffany_lock_bangle_steel_02', 1, 0, '2025-09-10 18:10:50'),
	(48, 20, 'products/vesper_chain_bracelet_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(49, 21, 'products/celestial_cross_earrings_mixed_metal_01', 0, 1, '2025-09-10 18:10:50'),
	(50, 21, 'products/celestial_cross_earrings_mixed_metal_02', 1, 0, '2025-09-10 18:10:50'),
	(51, 22, 'products/hammered_silver_stud_01', 0, 1, '2025-09-10 18:10:50'),
	(52, 22, 'products/hammered_silver_stud_02', 1, 0, '2025-09-10 18:10:50'),
	(53, 23, 'products/nyx_ear_silver_stud_01', 0, 1, '2025-09-10 18:10:50'),
	(54, 24, 'products/square_stud_earrings_mixed_metal_01', 0, 1, '2025-09-10 18:10:50'),
	(55, 24, 'products/square_stud_earrings_mixed_metal_02', 1, 0, '2025-09-10 18:10:50'),
	(56, 25, 'products/tiffany_titan_earrings_titanium_01', 0, 1, '2025-09-10 18:10:50'),
	(57, 25, 'products/tiffany_titan_earrings_titanium_02', 1, 0, '2025-09-10 18:10:50'),
	(58, 26, 'products/classic_mens_minimal_box_cuban_chain_silver_01', 0, 1, '2025-09-10 18:10:50'),
	(59, 26, 'products/classic_mens_minimal_box_cuban_chain_silver_02', 1, 0, '2025-09-10 18:10:50'),
	(60, 26, 'products/classic_mens_minimal_box_cuban_chain_silver_03', 2, 0, '2025-09-10 18:10:50'),
	(61, 26, 'products/classic_mens_minimal_box_cuban_chain_gold_01', 3, 0, '2025-09-10 18:10:50'),
	(62, 26, 'products/classic_mens_minimal_box_cuban_chain_gold_02', 4, 0, '2025-09-10 18:10:50'),
	(63, 26, 'products/classic_mens_minimal_box_cuban_chain_gold_03', 5, 0, '2025-09-10 18:10:50'),
	(64, 27, 'products/minimal_pendant_necklace_mixed_metal_01', 0, 1, '2025-09-10 18:10:50'),
	(65, 27, 'products/minimal_pendant_necklace_mixed_metal_02', 1, 0, '2025-09-10 18:10:50'),
	(66, 28, 'products/monieyta_rectangular_spiral_bar_pendant_steel_01', 0, 1, '2025-09-10 18:10:50'),
	(67, 28, 'products/monieyta_rectangular_spiral_bar_pendant_steel_02', 1, 0, '2025-09-10 18:10:50'),
	(68, 29, 'products/n917_curb_necklace_mixed_metal_01', 0, 1, '2025-09-10 18:10:50'),
	(69, 29, 'products/n917_curb_necklace_mixed_metal_02', 1, 0, '2025-09-10 18:10:50'),
	(70, 29, 'products/n917_curb_necklace_mixed_metal_03', 2, 0, '2025-09-10 18:10:50'),
	(71, 30, 'products/sleek_apex_titanium_steel_bar_pendant_01', 0, 1, '2025-09-10 18:10:50'),
	(72, 30, 'products/sleek_apex_titanium_steel_bar_pendant_02', 1, 0, '2025-09-10 18:10:50'),
	(73, 31, 'products/david_yurman_box_chain_bracelet_silver_01', 0, 1, '2025-09-10 18:10:50'),
	(74, 31, 'products/david_yurman_box_chain_bracelet_silver_02', 1, 0, '2025-09-10 18:10:50'),
	(75, 31, 'products/david_yurman_box_chain_bracelet_black_01', 2, 0, '2025-09-10 18:10:50'),
	(76, 31, 'products/david_yurman_box_chain_bracelet_black_02', 3, 0, '2025-09-10 18:10:50'),
	(77, 32, 'products/gucci_interlocking_g_silver_bracelet_silver_01', 0, 1, '2025-09-10 18:10:50'),
	(78, 32, 'products/gucci_interlocking_g_silver_bracelet_silver_02', 1, 0, '2025-09-10 18:10:50'),
	(79, 32, 'products/gucci_interlocking_g_silver_bracelet_silver_03', 2, 0, '2025-09-10 18:10:50'),
	(80, 33, 'products/montblanc_meisterstuck_collection_steel_3_rings_bracelet_white_leather_01', 0, 1, '2025-09-10 18:10:50'),
	(81, 33, 'products/montblanc_meisterstuck_collection_steel_3_rings_bracelet_red_leather_02', 1, 0, '2025-09-10 18:10:50'),
	(82, 33, 'products/montblanc_meisterstuck_collection_steel_3_rings_bracelet_brown_leather_03', 2, 0, '2025-09-10 18:10:50'),
	(83, 33, 'products/montblanc_meisterstuck_collection_steel_3_rings_bracelet_light_blue_leather_04', 3, 0, '2025-09-10 18:10:50'),
	(84, 34, 'products/tateossian_pop_rigato_double_wrap_leather_bracelet_black_leather_02', 0, 1, '2025-09-10 18:10:50'),
	(85, 34, 'products/tateossian_pop_rigato_double_wrap_leather_bracelet_brown_leather_03', 1, 0, '2025-09-10 18:10:50'),
	(86, 34, 'products/tateossian_pop_rigato_double_wrap_leather_bracelet_blue_leather_04', 2, 0, '2025-09-10 18:10:50'),
	(87, 34, 'products/tateossian_pop_rigato_double_wrap_leather_bracelet_blue_leather_05', 3, 0, '2025-09-10 18:10:50'),
	(88, 35, 'products/tom_wood_curb_m_bracelet_silver_01', 0, 1, '2025-09-10 18:10:50'),
	(89, 35, 'products/tom_wood_curb_m_bracelet_silver_02', 1, 0, '2025-09-10 18:10:50'),
	(90, 35, 'products/tom_wood_curb_m_bracelet_gold_03', 2, 0, '2025-09-10 18:10:50'),
	(91, 35, 'products/tom_wood_curb_m_bracelet_gold_04', 3, 0, '2025-09-10 18:10:50'),
	(92, 36, 'products/amyo_tiny_stud_earring_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(93, 36, 'products/amyo_tiny_stud_earring_copper_02', 1, 0, '2025-09-10 18:10:50'),
	(94, 36, 'products/amyo_tiny_stud_earring_silver_03', 2, 0, '2025-09-10 18:10:50'),
	(95, 37, 'products/glamira_black_stud_earring_silver_02', 0, 1, '2025-09-10 18:10:50'),
	(96, 37, 'products/glamira_black_stud_earring_gold_03', 1, 0, '2025-09-10 18:10:50'),
	(97, 37, 'products/glamira_black_stud_earring_rosegold_04', 2, 0, '2025-09-10 18:10:50'),
	(98, 38, 'products/jaxxon_silver_cross_stud_earring_silver_01', 0, 1, '2025-09-10 18:10:50'),
	(99, 38, 'products/jaxxon_silver_cross_stud_earring_silver_02', 1, 0, '2025-09-10 18:10:50'),
	(100, 38, 'products/jaxxon_silver_cross_stud_earring_silver_03', 2, 0, '2025-09-10 18:10:50'),
	(101, 38, 'products/jaxxon_silver_cross_stud_earring_silver_04', 3, 0, '2025-09-10 18:10:50'),
	(102, 39, 'products/mejuri_gold_huggie_hoop_earrings_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(103, 39, 'products/mejuri_gold_huggie_hoop_earrings_gold_02', 1, 0, '2025-09-10 18:10:50'),
	(104, 39, 'products/mejuri_gold_huggie_hoop_earrings_gold_03', 2, 0, '2025-09-10 18:10:50'),
	(105, 39, 'products/mejuri_gold_huggie_hoop_earrings_gold_04', 3, 0, '2025-09-10 18:10:50'),
	(106, 40, 'products/regalrose_small_plain_silver_hoop_earring_silver_01', 0, 1, '2025-09-10 18:10:50'),
	(107, 40, 'products/regalrose_small_plain_silver_hoop_earring_silver_02', 1, 0, '2025-09-10 18:10:50'),
	(108, 40, 'products/regalrose_small_plain_silver_hoop_earring_silver_03', 2, 0, '2025-09-10 18:10:50'),
	(109, 41, 'products/caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_01', 0, 1, '2025-09-10 18:10:50'),
	(110, 41, 'products/caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_02', 1, 0, '2025-09-10 18:10:50'),
	(111, 41, 'products/caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_03', 2, 0, '2025-09-10 18:10:50'),
	(112, 41, 'products/caitlyn_minimalist_interlocking_circles_necklace_mixed_metal_04', 3, 0, '2025-09-10 18:10:50'),
	(113, 42, 'products/giva_anushka_sharma_silver_deer_heart_necklace_silver_01', 0, 1, '2025-09-10 18:10:50'),
	(114, 42, 'products/giva_anushka_sharma_silver_deer_heart_necklace_silver_02', 1, 0, '2025-09-10 18:10:50'),
	(115, 42, 'products/giva_anushka_sharma_silver_deer_heart_necklace_silver_03', 2, 0, '2025-09-10 18:10:50'),
	(116, 42, 'products/giva_anushka_sharma_silver_deer_heart_necklace_silver_04', 3, 0, '2025-09-10 18:10:50'),
	(117, 43, 'products/glamira_minimalist_necklaces_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(118, 43, 'products/glamira_minimalist_necklaces_gold_02', 1, 0, '2025-09-10 18:10:50'),
	(119, 43, 'products/glamira_minimalist_necklaces_gold_03', 2, 0, '2025-09-10 18:10:50'),
	(120, 44, 'products/minimalist_lab_roman_numerals_diamond_band_necklace_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(121, 44, 'products/minimalist_lab_roman_numerals_diamond_band_necklace_gold_04', 1, 0, '2025-09-10 18:10:50'),
	(122, 44, 'products/minimalist_lab_roman_numerals_diamond_band_necklace_rosegold_02', 2, 0, '2025-09-10 18:10:50'),
	(123, 44, 'products/minimalist_lab_roman_numerals_diamond_band_necklace_silver_03', 3, 0, '2025-09-10 18:10:50'),
	(124, 45, 'products/tiffany_t_smile_necklace_gold_01', 0, 1, '2025-09-10 18:10:50'),
	(125, 45, 'products/tiffany_t_smile_necklace_gold_02', 1, 0, '2025-09-10 18:10:50'),
	(126, 45, 'products/tiffany_t_smile_necklace_gold_03', 2, 0, '2025-09-10 18:10:50'),
	(127, 45, 'products/tiffany_t_smile_necklace_gold_04', 3, 0, '2025-09-10 18:10:50');

CREATE TABLE IF NOT EXISTS `product_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` int NOT NULL,
  `review_text` text COLLATE utf8mb4_general_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `review_title` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `product_review_helpful` (
  `id` int NOT NULL AUTO_INCREMENT,
  `review_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `review_id` (`review_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `product_review_helpful_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_review_helpful_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


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
  CONSTRAINT `stocks_history_products_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `wishlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `wishlist_accounts_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_products_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
