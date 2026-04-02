<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Category;
use App\Models\EquipmentModel;
use App\Models\SubCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /** @var array<int, array{category: string, subcategory: string, model: string|null}> */
    private const CATALOG = [
        ['category' => 'Computer Desktop', 'subcategory' => 'Acer', 'model' => 'Veriton X2680G'],
        ['category' => 'Thin Client', 'subcategory' => 'Acer', 'model' => 'E220 VERITON M26X1G'],
        ['category' => 'Multifunction Printer', 'subcategory' => 'Brother', 'model' => 'DCP-B7535DW'],
        ['category' => 'Web Camera', 'subcategory' => 'Zebronics', 'model' => 'Zeb-Crisp Pro'],
        ['category' => 'Headphone Set', 'subcategory' => 'Zebronics', 'model' => 'ZEB-1000HMV'],
        ['category' => 'External Speaker', 'subcategory' => 'Zebronics', 'model' => 'BT2150UF'],
        ['category' => 'Projector', 'subcategory' => 'Optoma', 'model' => 'X319ST'],
        ['category' => 'White Board', 'subcategory' => 'Standard', 'model' => null],
        ['category' => 'UPS with Battery', 'subcategory' => 'BPE', 'model' => 'MF1103L8'],
        ['category' => 'Interactive Device', 'subcategory' => 'Cybernetyx', 'model' => 'EyeRIS IX-Series'],
        ['category' => 'VGA Splitter', 'subcategory' => 'Standard', 'model' => '4 Port VGA Out'],
        ['category' => 'Voltage Stabilizer', 'subcategory' => 'BPE', 'model' => 'BPAVS-5K'],
        ['category' => 'Software - Office Suite', 'subcategory' => 'Libre Office', 'model' => null],
        ['category' => 'Software - Antivirus', 'subcategory' => 'Quick Heal', 'model' => null],
        ['category' => 'Networking Components', 'subcategory' => 'D-Link', 'model' => 'DGS-1016'],
        ['category' => 'Wi-Fi Dongle', 'subcategory' => 'Standard', 'model' => null],
        ['category' => 'Computer Table', 'subcategory' => 'Standard', 'model' => null],
        ['category' => 'Chair', 'subcategory' => 'Standard', 'model' => null],
        ['category' => 'Site Preparation', 'subcategory' => 'Standard', 'model' => null],
    ];

    public function run(): void
    {
        foreach (self::CATALOG as $row) {
            $category = Category::query()->firstOrCreate(
                ['slug' => Str::slug($row['category'])],
                ['name' => $row['category'], 'status' => true],
            );

            $subSlug = Str::slug($row['category'].' '.$row['subcategory']);

            $subCategory = SubCategory::query()->firstOrCreate(
                ['slug' => $subSlug],
                [
                    'category_id' => $category->id,
                    'name' => $row['subcategory'],
                    'status' => true,
                ],
            );

            if ($subCategory->category_id !== $category->id) {
                $subCategory->update(['category_id' => $category->id]);
            }

            if ($row['model'] === null || $row['model'] === '') {
                continue;
            }

            $modelSlug = Str::slug($row['model']);
            if ($modelSlug === '') {
                continue;
            }

            EquipmentModel::query()->firstOrCreate(
                [
                    'sub_category_id' => $subCategory->id,
                    'slug' => $modelSlug,
                ],
                [
                    'name' => $row['model'],
                    'status' => true,
                ],
            );
        }
    }
}
