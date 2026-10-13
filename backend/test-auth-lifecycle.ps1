$ErrorActionPreference = "Stop"

$ptr = [IntPtr]::Zero
$securePassword = Read-Host "Enter your demo password" -AsSecureString

try {
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR(
        $securePassword
    )

    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
        $ptr
    )

    # 1. Login
    $loginBody = @{
        email = "admin.demo@example.com"
        password = $password
    } | ConvertTo-Json

    $login = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/v1/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody

    Write-Host "`nLOGIN: PASS"

    # 2. Refresh the session
    $refreshBody = @{
        refresh_token = $login.session.refresh_token
    } | ConvertTo-Json

    $refreshed = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/v1/auth/refresh" `
        -Method Post `
        -ContentType "application/json" `
        -Body $refreshBody

    if (-not $refreshed.session.access_token) {
        throw "Refresh did not return an access token."
    }

    Write-Host "TOKEN REFRESH: PASS"

    # 3. Verify the refreshed token
    $me = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/v1/auth/me" `
        -Method Get `
        -Headers @{
            Authorization = "Bearer $($refreshed.session.access_token)"
        }

    Write-Host "PROTECTED ROUTE AFTER REFRESH: PASS"
    Write-Host "Authenticated role: $($me.profile.role)"

    # 4. Logout
    $logout = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/v1/auth/logout" `
        -Method Post `
        -ContentType "application/json" `
        -Headers @{
            Authorization = "Bearer $($refreshed.session.access_token)"
        } `
        -Body "{}"

    Write-Host "LOGOUT: $($logout.success)"
    Write-Host "`nRefresh and logout tests completed."
}
catch {
    Write-Host "`nTEST FAILED:"
    Write-Host $_.Exception.Message

    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}
finally {
    if ($ptr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }

    $password = $null
    $securePassword = $null
}