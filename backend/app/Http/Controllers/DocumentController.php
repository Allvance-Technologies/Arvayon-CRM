<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function upload(Request $request, Project $project)
    {
        $request->validate([
            'file' => 'required|file|max:51200', // 50MB max
        ]);

        $file = $request->file('file');
        $path = $file->store('documents/' . $project->id, 'public');

        $document = $project->documents()->create([
            'name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'uploaded_by' => auth()->id(),
        ]);

        return response()->json(['data' => $document], 201);
    }

    public function download(Document $document)
    {
        $url = $document->getSignedUrl(60);

        return response()->json([
            'url' => $url,
            'expires_in' => 3600, // seconds
        ]);
    }

    public function destroy(Document $document)
    {
        $document->update(['is_deleted' => true]);

        return response()->json(['message' => 'Document deleted successfully']);
    }
}
