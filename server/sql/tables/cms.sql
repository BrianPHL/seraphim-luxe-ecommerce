/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

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
	(1, 'about', 'About Us Content', 'Driven by Passion, Fueled by Expressions\n\nAt Seraphim Luxe, we believe that every accessory should be meaningful, versatile, and timeless. Whether you\'re expressing your daily style, making a statement, or seeking the perfect complement to your personality, our mission is to provide you with top-quality unisex jewelry and accessories to enhance your personal expression.\n\nWho We Ares\n\nFounded with a passion for inclusive fashion and a commitment to excellence, Seraphim Luxe has grown into a trusted name in the accessories industry. We cater to style enthusiasts of all preferences, offering a wide selection of unisex jewelry and premium accessories to ensure that your personal style shines at its best.', '2025-09-07 14:08:07', '2025-09-17 03:35:58', NULL),
	(2, 'contact', 'Contact Information', 'Contact Seraphim Luxes\n\nWe\'d love to hear from you! Get in touch with our team.\n\nEmail: info@seraphimluxe.com\nPhone: +1 (555) 123-4567\nAddress: 123 Fashion Avenue, Style District, City 10001\n\nBusiness Hours:s\nMonday-Friday: 9AM-6PM\nSaturday: 10AM-4PM\nSunday: Closed', '2025-09-07 14:08:07', '2025-09-17 03:36:26', NULL),
	(3, 'faqs', 'Frequently Asked Questions', 'Frequently Asked Questions\n\nFind answers to common questions about our products, services, and policies.\n\nOrders & Shippings\n\nQ: How long does shipping take?\nA: Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business days.\n\nQ: Do you ship internationally?\nA: Yes, we ship to most countries worldwide. International shipping times vary by location.\n\nReturns & Exchangess\n\nQ: What is your return policy?\nA: We accept returns within 30 days of purchase with original receipt and tags attached.\n\nQ: How do I exchange an item?\nA: Please contact our customer service team to initiate an exchange.', '2025-09-07 14:08:07', '2025-09-16 18:03:28', NULL),
	(4, 'privacy', 'Privacy Policy', 'Privacy Policy\n\nEffective Date: January 1, 2023\n\nIntroductions\n\nAt Seraphim Luxe, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.\n\nInformation We Collects\n\nWe collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This may include your name, email address, shipping address, payment information, and any other details you choose to provide.', '2025-09-07 14:08:07', '2025-09-16 18:03:37', NULL),
	(7, 'home', 'Homepage Content Management', 'Hero Section\r\nTitle: Welcome to Seraphim Luxe\r\nSubtitle: Discover our exclusive collection\r\nButton Text: Shop Now\r\nLink: /collections\r\nImage: /images/home/hero.jpg\r\nActive: Yes\r\nOrder: 1\r\n\r\nFeatured Products Section\r\nTitle: Featured Products\r\nProducts: 101, 102, 103, 104\r\nActive: Yes\r\nOrder: 2\r\n\r\nText Section\r\nTitle: About Our Brand\r\nContent: Seraphim Luxe is dedicated to providing high-quality luxury products that combine style and functionality.\r\nActive: Yes\r\nOrder: 3', '2025-09-15 16:40:50', '2025-09-15 16:51:26', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
