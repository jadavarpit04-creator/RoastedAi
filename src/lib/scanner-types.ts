// AI-Powered Website Vulnerability Scanner Types

// ─── Core Enums ──────────────────────────────────────────────────────────────

export type ScanMode = 'quick' | 'deep'
export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed'

export type VulnCategory =
  | 'xss' | 'sqli' | 'nosqli' | 'csrf' | 'ssrf' | 'xxe' | 'rce'
  | 'lfi' | 'dir_traversal' | 'open_redirect' | 'clickjacking'
  | 'cors' | 'security_headers' | 'csp' | 'ssl_tls' | 'cookie_security'
  | 'auth' | 'idor' | 'cmd_injection' | 'template_injection'
  | 'file_upload' | 'deserialization' | 'exposed_secrets' | 'open_ports'
  | 'dns' | 'subdomain' | 'outdated_libs' | 'broken_links'
  | 'mixed_content' | 'api_security' | 'info_leakage' | 'misconfiguration'

export type VulnSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type VulnStatus = 'open' | 'confirmed' | 'false_positive' | 'accepted' | 'fixed'

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface VulnFinding {
  id: string
  title: string
  category: VulnCategory
  severity: VulnSeverity
  cvssScore: number        // 0.0 - 10.0
  status: VulnStatus
  description: string
  affectedEndpoint: string
  proofOfDetection: string  // Evidence of how we detected it
  rootCause: string
  recommendedFix: string
  exploitability: 'easy' | 'moderate' | 'difficult'
  impact: 'confidentiality' | 'integrity' | 'availability' | 'multiple'
  remediationEffort: 'low' | 'medium' | 'high'
  references: string[]     // OWASP/CVE references
  isFalsePositive: boolean
}

export interface ScanSummary {
  riskScore: number                     // 0-100
  totalVulns: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  infoCount: number
  passedChecks: number
  exploitabilityScore: number           // 0-100
  exposedAttackSurface: number          // 0-100
  categoryBreakdown: Record<VulnCategory, number>
  severityBreakdown: Record<VulnSeverity, number>
  topAttackPaths: string[]
  securityGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface ScanResult {
  id: string
  vulnerabilities: VulnFinding[]
  summary: ScanSummary
  scanMode: ScanMode
  status: ScanStatus
  scannedAt: string
  completedAt: string
  websiteUrl: string
  websiteDomain: string
  scanDuration: number   // seconds
  pagesScanned: number
  checksPerformed: number
}

export type ScannerTabFilter = 'all' | 'critical' | 'high' | 'confirmed' | 'false_positive'

// ─── Display Configuration ───────────────────────────────────────────────────

export const VULN_CATEGORY_CONFIG: Record<VulnCategory, { label: string; icon: string; color: string; gradient: string }> = {
  xss: { label: 'XSS', icon: 'Code', color: 'text-red-400', gradient: 'from-red-500 to-rose-600' },
  sqli: { label: 'SQL Injection', icon: 'Database', color: 'text-red-500', gradient: 'from-red-600 to-orange-600' },
  nosqli: { label: 'NoSQL Injection', icon: 'Database', color: 'text-red-400', gradient: 'from-red-500 to-orange-500' },
  csrf: { label: 'CSRF', icon: 'ShieldAlert', color: 'text-orange-400', gradient: 'from-orange-500 to-amber-500' },
  ssrf: { label: 'SSRF', icon: 'Server', color: 'text-orange-400', gradient: 'from-orange-500 to-red-500' },
  xxe: { label: 'XXE', icon: 'FileText', color: 'text-red-400', gradient: 'from-red-500 to-orange-500' },
  rce: { label: 'RCE', icon: 'Terminal', color: 'text-red-500', gradient: 'from-red-600 to-rose-600' },
  lfi: { label: 'LFI', icon: 'FolderOpen', color: 'text-orange-400', gradient: 'from-orange-500 to-red-500' },
  dir_traversal: { label: 'Dir Traversal', icon: 'FolderSearch', color: 'text-orange-400', gradient: 'from-orange-500 to-amber-500' },
  open_redirect: { label: 'Open Redirect', icon: 'ExternalLink', color: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-500' },
  clickjacking: { label: 'Clickjacking', icon: 'Layers', color: 'text-pink-400', gradient: 'from-pink-500 to-rose-500' },
  cors: { label: 'CORS', icon: 'ArrowLeftRight', color: 'text-indigo-400', gradient: 'from-indigo-500 to-purple-500' },
  security_headers: { label: 'Security Headers', icon: 'Shield', color: 'text-amber-400', gradient: 'from-amber-500 to-yellow-500' },
  csp: { label: 'CSP', icon: 'ShieldCheck', color: 'text-lime-400', gradient: 'from-lime-500 to-green-500' },
  ssl_tls: { label: 'SSL/TLS', icon: 'Lock', color: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-500' },
  cookie_security: { label: 'Cookie Security', icon: 'Cookie', color: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-500' },
  auth: { label: 'Authentication', icon: 'KeyRound', color: 'text-purple-400', gradient: 'from-purple-500 to-violet-500' },
  idor: { label: 'IDOR', icon: 'Fingerprint', color: 'text-sky-400', gradient: 'from-sky-500 to-blue-500' },
  cmd_injection: { label: 'Cmd Injection', icon: 'TerminalSquare', color: 'text-red-500', gradient: 'from-red-600 to-rose-600' },
  template_injection: { label: 'Template Injection', icon: 'Braces', color: 'text-rose-400', gradient: 'from-rose-500 to-pink-500' },
  file_upload: { label: 'File Upload', icon: 'Upload', color: 'text-fuchsia-400', gradient: 'from-fuchsia-500 to-pink-500' },
  deserialization: { label: 'Deserialization', icon: 'FileCode', color: 'text-red-400', gradient: 'from-red-500 to-rose-500' },
  exposed_secrets: { label: 'Exposed Secrets', icon: 'Eye', color: 'text-rose-400', gradient: 'from-rose-500 to-pink-500' },
  open_ports: { label: 'Open Ports', icon: 'Radio', color: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-500' },
  dns: { label: 'DNS', icon: 'Globe', color: 'text-blue-400', gradient: 'from-blue-500 to-indigo-500' },
  subdomain: { label: 'Subdomain', icon: 'Network', color: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' },
  outdated_libs: { label: 'Outdated Libraries', icon: 'Package', color: 'text-teal-400', gradient: 'from-teal-500 to-cyan-500' },
  broken_links: { label: 'Broken Links', icon: 'Unlink', color: 'text-gray-400', gradient: 'from-gray-500 to-slate-500' },
  mixed_content: { label: 'Mixed Content', icon: 'AlertTriangle', color: 'text-orange-400', gradient: 'from-orange-500 to-red-500' },
  api_security: { label: 'API Security', icon: 'Webhook', color: 'text-violet-400', gradient: 'from-violet-500 to-purple-500' },
  info_leakage: { label: 'Info Leakage', icon: 'FileSearch', color: 'text-slate-400', gradient: 'from-slate-500 to-gray-500' },
  misconfiguration: { label: 'Misconfiguration', icon: 'Settings', color: 'text-amber-400', gradient: 'from-amber-500 to-orange-500' },
}

export const VULN_SEVERITY_CONFIG: Record<VulnSeverity, { label: string; color: string; bgColor: string; borderColor: string; cvssRange: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', cvssRange: '9.0-10.0' },
  high: { label: 'High', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20', cvssRange: '7.0-8.9' },
  medium: { label: 'Medium', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20', cvssRange: '4.0-6.9' },
  low: { label: 'Low', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', cvssRange: '1.0-3.9' },
  info: { label: 'Info', color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/20', cvssRange: '0.0' },
}

export const VULN_STATUS_CONFIG: Record<VulnStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  open: { label: 'Open', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', icon: 'AlertCircle' },
  confirmed: { label: 'Confirmed', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: 'CheckCircle2' },
  false_positive: { label: 'False Positive', color: 'text-gray-400', bgColor: 'bg-gray-500/10', icon: 'XCircle' },
  accepted: { label: 'Accepted', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: 'Check' },
  fixed: { label: 'Fixed', color: 'text-green-400', bgColor: 'bg-green-500/10', icon: 'CheckCircle2' },
}

// ─── OWASP / CWE Reference URLs ────────────────────────────────────────────
// All URLs verified — pointing to working OWASP Cheat Sheet Series pages, Top 10 pages, and CWE MITRE

export const REFERENCE_URLS: Record<string, string> = {
  // OWASP Top 10 (2021) — verified working
  'OWASP Top 10 A01:2021 – Broken Access Control': 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/',
  'OWASP Top 10 A02:2021 – Cryptographic Failures': 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
  'OWASP Top 10 A03:2021 – Injection': 'https://owasp.org/Top10/A03_2021-Injection/',
  'OWASP Top 10 A04:2021 – Insecure Design': 'https://owasp.org/Top10/A04_2021-Insecure_Design/',
  'OWASP Top 10 A05:2021 – Security Misconfiguration': 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
  'OWASP Top 10 A06:2021 – Vulnerable Components': 'https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/',
  'OWASP Top 10 A07:2021 – Auth Failures': 'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/',
  'OWASP Top 10 A08:2021 – Software Data Integrity': 'https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/',
  'OWASP Top 10 A10:2021 – SSRF': 'https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/',

  // OWASP Cheat Sheet Series — verified working (cheatsheetseries.owasp.org)
  'OWASP Secure Headers Project': 'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html',
  'OWASP Cookie Security': 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
  'OWASP Content Security Policy': 'https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html',
  'OWASP Transport Layer Protection': 'https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html',
  'OWASP CORS Origin': 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html',
  'OWASP Clickjacking': 'https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html',
  'OWASP Path Traversal': 'https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html',
  'OWASP Unvalidated Redirects': 'https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html',
  'OWASP SSTI': 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Template_Injection_Cheat_Sheet.html',
  'OWASP File Upload': 'https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html',
  'OWASP Configuration Guides': 'https://cheatsheetseries.owasp.org/cheatsheets/Infrastructure_as_Code_Security_Cheat_Sheet.html',
  'OWASP DNS Security': 'https://cheatsheetseries.owasp.org/cheatsheets/DNS_Security_Cheat_Sheet.html',
  'OWASP Reconnaissance': 'https://cheatsheetseries.owasp.org/cheatsheets/Web_Application_Security_Testing_Cheat_Sheet.html',
  'OWASP Information Leakage': 'https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html',
  'OWASP API Security Top 10': 'https://owasp.org/www-project-api-security/',
  'OWASP Web Security Guide': 'https://cheatsheetseries.owasp.org/',

  // CWE References — verified working (cwe.mitre.org)
  'CWE-79: Cross-site Scripting': 'https://cwe.mitre.org/data/definitions/79.html',
  'CWE-89: SQL Injection': 'https://cwe.mitre.org/data/definitions/89.html',
  'CWE-943: NoSQL Injection': 'https://cwe.mitre.org/data/definitions/943.html',
  'CWE-352: CSRF': 'https://cwe.mitre.org/data/definitions/352.html',
  'CWE-918: Server-Side Request Forgery': 'https://cwe.mitre.org/data/definitions/918.html',
  'CWE-611: XXE': 'https://cwe.mitre.org/data/definitions/611.html',
  'CWE-78: OS Command Injection': 'https://cwe.mitre.org/data/definitions/78.html',
  'CWE-98: LFI': 'https://cwe.mitre.org/data/definitions/98.html',
  'CWE-22: Path Traversal': 'https://cwe.mitre.org/data/definitions/22.html',
  'CWE-601: Open Redirect': 'https://cwe.mitre.org/data/definitions/601.html',
  'CWE-451: Clickjacking': 'https://cwe.mitre.org/data/definitions/451.html',
  'CWE-942: CORS': 'https://cwe.mitre.org/data/definitions/942.html',
  'CWE-693: Protection Mechanism Failure': 'https://cwe.mitre.org/data/definitions/693.html',
  'CWE-693: CSP Not Implemented': 'https://cwe.mitre.org/data/definitions/693.html',
  'CWE-326: Weak Encryption': 'https://cwe.mitre.org/data/definitions/326.html',
  'CWE-614: Sensitive Cookie Without Secure Flag': 'https://cwe.mitre.org/data/definitions/614.html',
  'CWE-287: Improper Authentication': 'https://cwe.mitre.org/data/definitions/287.html',
  'CWE-639: IDOR': 'https://cwe.mitre.org/data/definitions/639.html',
  'CWE-1336: Server-Side Template Injection': 'https://cwe.mitre.org/data/definitions/1336.html',
  'CWE-434: Unrestricted File Upload': 'https://cwe.mitre.org/data/definitions/434.html',
  'CWE-502: Deserialization': 'https://cwe.mitre.org/data/definitions/502.html',
  'CWE-200: Information Exposure': 'https://cwe.mitre.org/data/definitions/200.html',
  'CWE-1104: Outdated Components': 'https://cwe.mitre.org/data/definitions/1104.html',
  'CWE-676: Use of Potentially Dangerous Function': 'https://cwe.mitre.org/data/definitions/676.html',
  'CWE-311: Missing Encryption': 'https://cwe.mitre.org/data/definitions/311.html',
  'CWE-306: Missing Authentication': 'https://cwe.mitre.org/data/definitions/306.html',
  'CWE-16: Configuration': 'https://cwe.mitre.org/data/definitions/16.html',
}

/**
 * Get the URL for a reference string. Falls back to OWASP cheat sheet index or CWE
 */
export function getReferenceUrl(ref: string): string {
  if (REFERENCE_URLS[ref]) return REFERENCE_URLS[ref]
  // If it contains CWE number, construct URL
  const cweMatch = ref.match(/CWE-(\d+)/)
  if (cweMatch) return `https://cwe.mitre.org/data/definitions/${cweMatch[1]}.html`
  // If it mentions OWASP, link to cheat sheet index
  if (ref.toLowerCase().includes('owasp')) return 'https://cheatsheetseries.owasp.org/'
  // Generic fallback
  return `https://www.google.com/search?q=${encodeURIComponent(ref + ' security vulnerability')}`
}
