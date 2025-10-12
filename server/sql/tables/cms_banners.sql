/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

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

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
