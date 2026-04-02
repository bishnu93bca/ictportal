<?php

declare(strict_types=1);

namespace App\Http\Requests\Complaint;

use App\Models\Complaint;
use App\Models\EquipmentModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateComplaintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'sub_category_id' => ['sometimes', 'nullable', 'integer', 'exists:sub_categories,id'],
            'equipment_model_id' => ['sometimes', 'nullable', 'integer', 'exists:equipment_models,id'],
            'serial_number' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string', 'max:5000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var Complaint|null $complaint */
            $complaint = $this->route('complaint');

            $subId = $this->has('sub_category_id')
                ? $this->input('sub_category_id')
                : $complaint?->sub_category_id;
            $modelId = $this->has('equipment_model_id')
                ? $this->input('equipment_model_id')
                : $complaint?->equipment_model_id;

            if ($modelId && ! $subId) {
                $validator->errors()->add('equipment_model_id', 'Select a sub-category when choosing a model.');
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
