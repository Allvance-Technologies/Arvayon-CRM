<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ProcessLeadImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $filePath;
    protected $userId;

    public $tries = 1;
    public $timeout = 300;

    public function __construct($filePath, $userId)
    {
        $this->filePath = $filePath;
        $this->userId = $userId;
    }

    public function handle()
    {
        $successCount = 0;
        $failureCount = 0;
        $errors = [];

        try {
            $file = fopen($this->filePath, 'r');
            $headers = fgetcsv($file);

            while (($row = fgetcsv($file)) !== false) {
                $data = array_combine($headers, $row);

                $validator = Validator::make($data, [
                    'company_name' => 'required|string|max:255',
                    'contact_person' => 'required|string|max:255',
                    'email' => 'required|email',
                    'phone' => 'nullable|string|max:50',
                    'industry' => 'nullable|string|max:100',
                    'budget' => 'nullable|numeric|min:0',
                    'source' => 'nullable|string|max:100',
                ]);

                if ($validator->fails()) {
                    $failureCount++;
                    $errors[] = [
                        'row' => $data,
                        'errors' => $validator->errors()->all(),
                    ];
                    continue;
                }

                Lead::create([
                    'company_name' => $data['company_name'],
                    'contact_person' => $data['contact_person'],
                    'email' => $data['email'],
                    'phone' => $data['phone'] ?? null,
                    'industry' => $data['industry'] ?? null,
                    'budget' => $data['budget'] ?? null,
                    'source' => $data['source'] ?? null,
                    'status' => 'New',
                    'created_by' => $this->userId,
                ]);

                $successCount++;
            }

            fclose($file);

            Log::info("Lead import completed: {$successCount} successful, {$failureCount} failed");

            // TODO: Send email notification to user with import summary

        } catch (\Exception $e) {
            Log::error("Lead import failed: " . $e->getMessage());
            throw $e;
        }
    }

    public function failed(\Throwable $exception)
    {
        Log::error("Lead import job failed: " . $exception->getMessage());
    }
}
