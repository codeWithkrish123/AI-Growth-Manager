$body = @{ shop = "ai-product-optimizer.myshopify.com" } | ConvertTo-Json
$resp = Invoke-WebRequest -Uri "http://localhost:3001/auth/shopify/initiate" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
Write-Output "Status: $($resp.StatusCode)"
Write-Output "Body: $($resp.Content)"
