$headers = @{
    'Origin' = 'http://localhost:5173'
    'Access-Control-Request-Method' = 'POST'
    'Access-Control-Request-Headers' = 'Content-Type'
}
$resp = Invoke-WebRequest -Uri "http://localhost:3001/auth/shopify/initiate" -Method OPTIONS -Headers $headers -UseBasicParsing
Write-Output "Status: $($resp.StatusCode)"
$resp.Headers | Format-Table -AutoSize
