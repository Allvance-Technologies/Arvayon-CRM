<!DOCTYPE html>
<html>
<head>
    <title>Task Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Task Reminder</h2>
        
        <p>Hello,</p>
        
        <p>This is a reminder that you have a task due soon:</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">{{ $taskTitle }}</h3>
            
            @if($taskDescription)
                <p><strong>Description:</strong> {{ $taskDescription }}</p>
            @endif
            
            <p><strong>Project:</strong> {{ $projectName }}</p>
            <p><strong>Due Date:</strong> {{ $dueDate }}</p>
            <p><strong>Priority:</strong> <span style="color: {{ $priority === 'Urgent' ? '#dc2626' : ($priority === 'High' ? '#ea580c' : '#6b7280') }};">{{ $priority }}</span></p>
        </div>
        
        <p>Please make sure to complete this task on time.</p>
        
        <p>Best regards,<br>Arvayon</p>
    </div>
</body>
</html>
