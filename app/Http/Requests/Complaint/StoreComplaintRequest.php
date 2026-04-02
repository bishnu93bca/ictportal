<?php

declare(strict_types=1);

namespace App\Http\Requests\Complaint;

use App\Models\EquipmentModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreComplaintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'complainant_name' => ['required', 'string', 'max:255'],
            'school_name' => ['required', 'string', 'max:255'],
            'udise_code' => ['required', 'string', 'max:50'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'sub_category_id' => ['nullable', 'integer', 'exists:sub_categories,id'],
            'equipment_model_id' => ['nullable', 'integer', 'exists:equipment_models,id'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => [
                'file',
                'max:10240',
                'mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt,zip',
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $subId = $this->input('sub_category_id');
            $modelId = $this->input('equipment_model_id');

            if ($modelId && ! $subId) {
                $validator->errors()->add('equipment_model_id', 'Select a sub-category when choosing a model.');

                return;
            }

            if (! $modelId || ! $subId) {
                return;
            }

            $model = EquipmentModel::query()->find($modelId);
            if ($model && (int) $model->sub_category_id !== (int) $subId) {
                $validator->errors()->add('equipment_model_id', 'The selected model does not belong to this sub-category.');
            }
        });
    }
}
