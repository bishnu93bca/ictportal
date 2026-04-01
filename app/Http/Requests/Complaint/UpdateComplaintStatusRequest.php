<?php

declare(strict_types=1);

namespace App\Http\Requests\Complaint;

use App\Models\Complaint;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateComplaintStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'     => ['required', Rule::in(Complaint::STATUSES)],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
