# Execute como Administrador!
# Este script configura o RTK Dashboard para iniciar automaticamente ao boot

Write-Host "Configurando RTK Dashboard para autostart..." -ForegroundColor Green

# Criar a tarefa agendada
$trigger = New-ScheduledTaskTrigger -AtStartup
$action = New-ScheduledTaskAction -Execute 'C:\Users\laycr\Documents\asset-management\start-rtk-dashboard.bat' -WorkingDirectory 'C:\Users\laycr\Documents\asset-management'
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest

# Remover tarefa antiga se existir
try {
    Unregister-ScheduledTask -TaskName 'RTK-Dashboard-AutoStart' -Confirm:$false -ErrorAction SilentlyContinue
} catch {}

# Criar nova tarefa
$task = Register-ScheduledTask -TaskName 'RTK-Dashboard-AutoStart' `
    -Trigger $trigger `
    -Action $action `
    -Principal $principal `
    -Force `
    -Description 'Inicia automaticamente o RTK Dashboard (porta 3100) ao boot do sistema'

Write-Host "✓ Tarefa de autostart configurada com sucesso!" -ForegroundColor Green
Write-Host "✓ RTK Dashboard iniciará automaticamente no próximo boot" -ForegroundColor Green
Write-Host ""
Write-Host "Detalhes:" -ForegroundColor Cyan
Write-Host "  - Nome: RTK-Dashboard-AutoStart"
Write-Host "  - Acionador: No boot do sistema"
Write-Host "  - Porta: 3100"
Write-Host "  - Script: start-rtk-dashboard.bat"
Write-Host ""
Write-Host "Para verificar o status, acesse: Tarefas Agendadas > RTK-Dashboard-AutoStart"
