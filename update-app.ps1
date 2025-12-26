# PowerShell script to add SangjoConsultationModal to App.tsx

$filePath = "c:\Users\black\Desktop\memorimap\App.tsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

# 1. Add import for SangjoConsultationModal after SubscriptionPlans
$importPattern = "(const SubscriptionPlans = React\.lazy\(\(\) => import\('./components/SubscriptionPlans'\)\.then\(m => \(\{ default: m\.default \}\)\)\);)"
$importReplacement = "`$1`r`nconst SangjoConsultationModal = React.lazy(() => import('./components/Consultation/SangjoConsultationModal').then(m => ({ default: m.SangjoConsultationModal })));"
$content = $content -replace $importPattern, $importReplacement

# 2. Add showSangjoAIConsult state after selectedFuneralCompany
$statePattern = "(const \[selectedFuneralCompany, setSelectedFuneralCompany\] = useState<FuneralCompany \| null>\(null\);)"
$stateReplacement = "`$1`r`n  const [showSangjoAIConsult, setShowSangjoAIConsult] = useState(false);"
$content = $content -replace $statePattern, $stateReplacement

# 3. Change onConsult to onOpenAIConsult in FuneralCompanySheet
$consultPattern = "onConsult=\{\(\) => \{[^}]+showToast\(`"상담 신청이 접수되었습니다\. 곧 연락드리겠습니다\.`"\);[^}]+setSelectedFuneralCompany\(null\);[^}]+\}\}"
$consultReplacement = "onOpenAIConsult={() => {`r`n                    setShowSangjoAIConsult(true);`r`n                  }}"
$content = $content -replace $consultPattern, $consultReplacement

# 4. Add SangjoConsultationModal component before closing divs
$modalPattern = "(\s+\}\s+<\/div\s+>\s+<\/div\s+>\s+<\/HashRouter\s+>)"
$modalReplacement = "`r`n`r`n          {`r`n            showSangjoAIConsult && (`r`n              <Suspense fallback={<div className=`"fixed inset-0 z-50 flex items-center justify-center bg-black/20`"><div className=`"bg-white p-3 rounded-full shadow-lg`"><div className=`"animate-spin rounded-full h-8 w-8 border-b-2 border-primary`"></div></div></div>}>`r`n                <SangjoConsultationModal`r`n                  onClose={() => {`r`n                    setShowSangjoAIConsult(false);`r`n                    setSelectedFuneralCompany(null);`r`n                  }}`r`n                />`r`n              </Suspense>`r`n            )`r`n          }`$1"
$content = $content -replace $modalPattern, $modalReplacement

# Save the file
Set-Content $filePath -Value $content -Encoding UTF8 -NoNewline

Write-Host "✅ App.tsx updated successfully!"
