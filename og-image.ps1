Add-Type -AssemblyName System.Drawing
$w=1200; $h=630
$bmp=New-Object System.Drawing.Bitmap($w,$h)
$g=[System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint=[System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::FromArgb(245,240,232))
$band=New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Point(0,0)),(New-Object System.Drawing.Point($w,0)),[System.Drawing.Color]::FromArgb(122,158,126),[System.Drawing.Color]::FromArgb(78,113,83))
$g.FillRectangle($band,0,0,$w,14)
$deepBrush=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(44,62,53))
$sageBrush=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(78,113,83))
$mutedBrush=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(110,101,92))
$title=New-Object System.Drawing.Font("Segoe UI",62,[System.Drawing.FontStyle]::Bold)
$tag=New-Object System.Drawing.Font("Segoe UI",30,[System.Drawing.FontStyle]::Regular)
$sub=New-Object System.Drawing.Font("Segoe UI",26,[System.Drawing.FontStyle]::Regular)
$g.DrawString("Академия Роста",$title,$deepBrush,80,205)
$g.DrawString("психологический центр · Ставрополь",$tag,$sageBrush,82,318)
$g.DrawString("Тренинги · расстановки · 20 лет",$sub,$mutedBrush,82,378)
$bmp.Save("C:\Users\User\Desktop\akademiya-rosta\og-image.png",[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "og-image.png created"
