CREATE TABLE IF NOT EXISTS `purchases` (
    `id` INTEGER UNSIGNED NOT NULL auto_increment ,
    `userId` VARCHAR(255) NOT NULL,
    `itemId` VARCHAR(255) NOT NULL,
    `amount` INTEGER UNSIGNED NOT NULL,
    `unitPrice` INTEGER UNSIGNED NOT NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;