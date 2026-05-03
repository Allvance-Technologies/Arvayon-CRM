<!DOCTYPE html>
<html>
<head>
    <title>Overdue Invoice Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">Overdue Invoice Notification</h2>
        
        <p>Dear Client,</p>
        
        <p>This is a notification that the following invoice is now overdue:</p>
        
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #991b1b;">Invoice #{{ $invoiceNumber }}</h3>
            
            <p><strong>Project:</strong> {{ $projectName }}</p>
            <p><strong>Amount Due:</strong> ${{ number_format($totalAmount, 2) }}</p>
            <p><strong>Original Due Date:</strong> {{ $dueDate }}</p>
            <p><strong>Days Past Due:</strong> {{ $daysPastDue }} days</p>
        </div>
        
        <p>Please arrange payment at your earliest convenience to avoid any service interruptions.</p>
        
        <p>If you have already made the payment, please disregard this notice.</p>
        
        <p>For any questions, please contact our accounts department.</p>
        
        <p>Best regards,<br>Arvayon</p>
    </div>
</body>
</html>
