-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 07, 2025 at 04:18 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `seraphim_luxe`
--

-- --------------------------------------------------------

--
-- Table structure for table `static_pages`
--

CREATE TABLE `static_pages` (
  `id` int(11) NOT NULL,
  `page_slug` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `static_pages`
--

INSERT INTO `static_pages` (`id`, `page_slug`, `title`, `content`, `created_at`, `updated_at`, `last_updated_by`) VALUES
(1, 'about', 'About Us', 'Driven by Style, Fueled by Expression\n\nAt Seraphim Luxe, we believe that every accessory should be meaningful, versatile, and timeless. Whether you\'re expressing your daily style, making a statement, or seeking the perfect complement to your personality, our mission is to provide you with top-quality unisex jewelry and accessories to enhance your personal expression.\n\nWho We Are\n\nFounded with a passion for inclusive fashion and a commitment to excellence, Seraphim Luxe has grown into a trusted name in the accessories industry. We cater to style enthusiasts of all preferences, offering a wide selection of unisex jewelry and premium accessories to ensure that your personal style shines at its best.', '2025-09-07 14:08:07', '2025-09-07 14:08:07', NULL),
(2, 'contact', 'Contact Information', 'Contact Seraphim Luxe\n\nWe\'d love to hear from you! Get in touch with our team.\n\nEmail: info@seraphimluxe.com\nPhone: +1 (555) 123-4567\nAddress: 123 Fashion Avenue, Style District, City 10001\n\nBusiness Hours:\nMonday-Friday: 9AM-6PM\nSaturday: 10AM-4PM\nSunday: Closed', '2025-09-07 14:08:07', '2025-09-07 14:08:07', NULL),
(3, 'faqs', 'Frequently Asked Questions', 'Frequently Asked Questions\n\nFind answers to common questions about our products, services, and policies.\n\nOrders & Shipping\n\nQ: How long does shipping take?\nA: Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business days.\n\nQ: Do you ship internationally?\nA: Yes, we ship to most countries worldwide. International shipping times vary by location.\n\nReturns & Exchanges\n\nQ: What is your return policy?\nA: We accept returns within 30 days of purchase with original receipt and tags attached.\n\nQ: How do I exchange an item?\nA: Please contact our customer service team to initiate an exchange.', '2025-09-07 14:08:07', '2025-09-07 14:08:07', NULL),
(4, 'privacy', 'Privacy Policy', 'Privacy Policy\n\nIntroduction\n\nAt Seraphim Luxe, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our services.\n\nInformation We Collect\n\nWe collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This may include your name, email address, shipping address, payment information, and any other details you choose to provide.', '2025-09-07 14:08:07', '2025-09-07 14:08:07', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `static_pages`
--
ALTER TABLE `static_pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `page_slug` (`page_slug`),
  ADD KEY `idx_page_slug` (`page_slug`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `static_pages`
--
ALTER TABLE `static_pages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
