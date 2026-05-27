$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host ""
Write-Host "  =================================" -ForegroundColor Cyan
Write-Host "   Patanan Server Running!" -ForegroundColor Green
Write-Host "   http://localhost:$port" -ForegroundColor Yellow
Write-Host "  =================================" -ForegroundColor Cyan
Write-Host "  กด Ctrl+C เพื่อหยุด server" -ForegroundColor Gray
Write-Host ""

# Open browser automatically
Start-Process "http://localhost:$port"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".ico"  = "image/x-icon"
    ".json" = "application/json"
}

while ($listener.IsListening) {
    try {
        $context  = $listener.GetContext()
        $req      = $context.Request
        $res      = $context.Response

        $urlPath  = $req.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        $filePath = Join-Path $root ($urlPath.TrimStart("/").Replace("/", "\"))

        if (Test-Path $filePath -PathType Leaf) {
            $ext     = [IO.Path]::GetExtension($filePath).ToLower()
            $mime    = if ($mimeTypes[$ext]) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $bytes   = [IO.File]::ReadAllBytes($filePath)
            $res.ContentType     = $mime
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host "  OK  $urlPath" -ForegroundColor DarkGray
        } else {
            $res.StatusCode = 404
            Write-Host "  404 $urlPath" -ForegroundColor Red
        }
        $res.Close()
    } catch { }
}
