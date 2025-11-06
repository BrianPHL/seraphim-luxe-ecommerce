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
	(1, 'about', 'About Us Content', 'Driven by Passion, Fueled by Expressions\n\nAt Seraphim Luxe, we believe that every accessory should be meaningful, versatile, and timeless. Whether you\'re expressing your daily style, making a statement, or seeking the perfect complement to your personality, our mission is to provide you with top-quality unisex jewelry and accessories to enhance your personal expression.\n\nWho We Ares\n\nFounded with a passion for inclusive fashion and a commitment to excellence, Seraphim Luxe has grown into a trusted name in the accessories industry. We cater to style enthusiasts of all preferences, offering a wide selection of unisex jewelry and premium accessories to ensure that your personal style shines at its best.', '2025-09-07 14:08:07', '2025-09-30 13:02:39', NULL),
	(2, 'contact', 'Contact Information', 'Contact Seraphim Luxes\n\nWe\'d love to hear from you! Get in touch with our team.\n\nEmail: info@seraphimluxe.com\nPhone: +1 (555) 123-4567\nAddress: 123 Fashion Avenue, Style District, City 10001\n\nBusiness Hours:s\nMonday-Friday: 9AM-6PM\nSaturday: 10AM-4PM\nSunday: Closed', '2025-09-07 14:08:07', '2025-09-17 03:36:26', NULL),
	(3, 'faqs', 'Frequently Asked Questions', 'Frequently Asked Questions\n\nFind answers to common questions about our products, services, and policies.\n\nOrders & Shippings\n\nQ: How long does shipping take?\nA: Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business days.\n\nQ: Do you ship internationally?\nA: Yes, we ship to most countries worldwide. International shipping times vary by location.\n\nReturns & Exchangess\n\nQ: What is your return policy?\nA: We accept returns within 30 days of purchase with original receipt and tags attached.\n\nQ: How do I exchange an item?\nA: Please contact our customer service team to initiate an exchange.', '2025-09-07 14:08:07', '2025-09-16 18:03:28', NULL),
	(4, 'privacy', 'Privacy Policy', 'Privacy Policy\n\nEffective Date: January 1, 2023\n\nIntroductions\n\nAt Seraphim Luxe, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.\n\nInformation We Collects\n\nWe collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This may include your name, email address, shipping address, payment information, and any other details you choose to provide.', '2025-09-07 14:08:07', '2025-09-16 18:03:37', NULL),
	(7, 'home', 'Home', 'FEATURED_TITLE: Featured Products\n\nFEATURED_DESC: Discover our handpicked selection of standout pieces, carefully chosen for their exceptional quality and style.\n\nBESTSELLERS_TITLE: Best Sellers\n\nBESTSELLERS_DESC: Shop our most popular items loved by customers worldwide for their quality and timeless appeal.\n\nNEWARRIVALS_TITLE: New Arrivals\n\nNEWARRIVALS_DESC: Be the first to discover our latest additions – fresh styles and trending pieces just added to our collection.\n\nTRUST_TITLE: Why Style Enthusiasts Trust Seraphim Luxe\n\nTRUST_DESC: At Seraphim Luxe, we go the extra mile to ensure you get the best unisex accessories and jewelry at unbeatable quality. Whether you\'re expressing your daily style or seeking the perfect statement piece, we\'ve got what you need to make every look elegant and authentic.\n\nTRUST_CARD1_ICON: fa-solid fa-truck\nTRUST_CARD1_TITLE: Fast Delivery\nTRUST_CARD1_DESC: Get your accessories delivered quickly and securely anywhere in the Philippines.\n\nTRUST_CARD2_ICON: fa-solid fa-star\nTRUST_CARD2_TITLE: Quality Guaranteed\nTRUST_CARD2_DESC: Every piece is carefully selected and quality-tested for durability and style.\n\nTRUST_CARD3_ICON: fa-solid fa-headset\nTRUST_CARD3_TITLE: Expert Support\nTRUST_CARD3_DESC: Our team is ready to help you find the perfect pieces for your unique style.', '2025-09-15 16:40:50', '2025-09-30 13:45:30', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
