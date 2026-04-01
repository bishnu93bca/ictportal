<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use App\Models\SubCategory;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['id' => 1, 'name' => 'Hardware',       'slug' => 'hardware',       'status' => true],
            ['id' => 2, 'name' => 'Peripherals',     'slug' => 'peripherals',    'status' => true],
            ['id' => 3, 'name' => 'Networking',      'slug' => 'networking',     'status' => true],
            ['id' => 4, 'name' => 'Furniture',       'slug' => 'furniture',      'status' => true],
            ['id' => 5, 'name' => 'Software',        'slug' => 'software',       'status' => true],
            ['id' => 6, 'name' => 'Electrical',      'slug' => 'electrical',     'status' => true],
            ['id' => 7, 'name' => 'Miscellaneous',   'slug' => 'miscellaneous',  'status' => true],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(['id' => $category['id']], $category);
        }

        $subCategories = [
            ['id' => 1,  'category_id' => 1, 'name' => 'Computer Desktop',    'slug' => 'computer-desktop',    'status' => true],
            ['id' => 2,  'category_id' => 1, 'name' => 'Thin Client',         'slug' => 'thin-client',         'status' => true],
            ['id' => 3,  'category_id' => 2, 'name' => 'Printer',             'slug' => 'printer',             'status' => true],
            ['id' => 4,  'category_id' => 2, 'name' => 'Web Camera',          'slug' => 'web-camera',          'status' => true],
            ['id' => 5,  'category_id' => 2, 'name' => 'Headphone',           'slug' => 'headphone',           'status' => true],
            ['id' => 6,  'category_id' => 2, 'name' => 'Speaker',             'slug' => 'speaker',             'status' => true],
            ['id' => 7,  'category_id' => 2, 'name' => 'Projector',           'slug' => 'projector',           'status' => true],
            ['id' => 8,  'category_id' => 2, 'name' => 'Interactive Device',  'slug' => 'interactive-device',  'status' => true],
            ['id' => 9,  'category_id' => 3, 'name' => 'VGA Splitter',        'slug' => 'vga-splitter',        'status' => true],
            ['id' => 10, 'category_id' => 3, 'name' => 'Networking Switch',   'slug' => 'network-switch',      'status' => true],
            ['id' => 11, 'category_id' => 3, 'name' => 'WiFi Dongle',         'slug' => 'wifi-dongle',         'status' => true],
            ['id' => 12, 'category_id' => 4, 'name' => 'Computer Table',      'slug' => 'computer-table',      'status' => true],
            ['id' => 13, 'category_id' => 4, 'name' => 'Chair',               'slug' => 'chair',               'status' => true],
            ['id' => 14, 'category_id' => 4, 'name' => 'White Board',         'slug' => 'white-board',         'status' => true],
            ['id' => 15, 'category_id' => 5, 'name' => 'Office Software',     'slug' => 'office-software',     'status' => true],
            ['id' => 16, 'category_id' => 5, 'name' => 'Antivirus',           'slug' => 'antivirus',           'status' => true],
            ['id' => 17, 'category_id' => 6, 'name' => 'UPS',                 'slug' => 'ups',                 'status' => true],
            ['id' => 18, 'category_id' => 6, 'name' => 'Voltage Stabilizer',  'slug' => 'voltage-stabilizer',  'status' => true],
            ['id' => 19, 'category_id' => 7, 'name' => 'Site Preparation',    'slug' => 'site-preparation',    'status' => true],
        ];

        foreach ($subCategories as $sub) {
            SubCategory::updateOrCreate(['id' => $sub['id']], $sub);
        }
    }
}
