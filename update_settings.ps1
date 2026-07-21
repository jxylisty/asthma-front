$content = Get-Content "src/views/Settings.vue" -Raw -Encoding UTF8

$content = $content -replace 'import \{ ref, watch \} from ''vue''', 'import \{ useSettings \} from ''../composables/useSettings'''

Set-Content "src/views/Settings.vue" -Value $content -Encoding UTF8
Write-Host "Settings.vue updated"