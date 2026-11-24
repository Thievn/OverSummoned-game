# OverSummoned Desktop — count-only input helper (Windows).
# Increments a number whenever a mouse button or key goes DOWN.
# It never records which key, never records text, never records window titles.
# Godot reads the number in the output file and uses only the delta.

param(
    [string]$OutPath = "$env:TEMP\oversummoned_input_count.txt"
)

Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class OsInputProbe {
    [DllImport("user32.dll")]
    public static extern short GetAsyncKeyState(int vKey);
}
"@

$count = 0
$prev = New-Object 'bool[]' 256
$dir = Split-Path -Parent $OutPath
if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

function Write-Count {
    param([int]$Value)
    $stamp = [int][double]::Parse((Get-Date -UFormat %s))
    [System.IO.File]::WriteAllText($OutPath, "$Value $stamp")
}

Write-Count 0

while ($true) {
    $delta = 0
    # Mouse: LB, RB, MB, X1, X2
    foreach ($vk in 0x01, 0x02, 0x04, 0x05, 0x06) {
        $down = ([OsInputProbe]::GetAsyncKeyState($vk) -band 0x8000) -ne 0
        if ($down -and -not $prev[$vk]) { $delta++ }
        $prev[$vk] = $down
    }
    # Keys: 0x08 (Backspace) through 0xFE. We only count downs, never store the vk.
    for ($vk = 0x08; $vk -le 0xFE; $vk++) {
        if ($vk -eq 0x10 -or $vk -eq 0x11 -or $vk -eq 0x12) {
            # Skip bare Shift/Ctrl/Alt so holding modifiers doesn't farm taps.
            continue
        }
        $down = ([OsInputProbe]::GetAsyncKeyState($vk) -band 0x8000) -ne 0
        if ($down -and -not $prev[$vk]) { $delta++ }
        $prev[$vk] = $down
    }
    if ($delta -gt 0) {
        $count += $delta
        Write-Count $count
    }
    Start-Sleep -Milliseconds 25
}
