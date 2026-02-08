# SECURITY COMPLIANCE CERTIFICATE

---

## SAI EDUCARE PRIVATE LIMITED

**Corporate Office:**  
A-18, 2nd Floor, RV Tower, Prince Rd, A  
Opp. Sarovar Portico, Nityanand Nagar  
Vaishali Nagar, Jaipur, Rajasthan 302021  
India

---

### Certificate No: SEPL/SEC/2026/001
### Date of Issue: [DD/MM/YYYY]
### Valid Until: [DD/MM/YYYY]

---

## CERTIFICATE OF SECURITY COMPLIANCE

This is to certify that **Sai Educare Private Limited** has implemented comprehensive security measures for the **Government Examination Portal** in compliance with Government of India cybersecurity standards.

---

## PART A: CERT-IN COMPLIANCE

### Indian Computer Emergency Response Team (CERT-IN) Guidelines

| Security Requirement | Implementation Status |
|---------------------|----------------------|
| Content Security Policy (CSP) | ✓ Implemented |
| HTTP Strict Transport Security (HSTS) | ✓ max-age=31536000 |
| X-Frame-Options | ✓ DENY |
| X-Content-Type-Options | ✓ nosniff |
| X-XSS-Protection | ✓ 1; mode=block |
| Referrer-Policy | ✓ strict-origin-when-cross-origin |
| Secure Cookie Flags | ✓ HttpOnly, Secure, SameSite=Strict |

### Security Headers Implementation

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

---

## PART B: DATA PROTECTION

### Encryption Standards

| Data State | Encryption Method | Key Length |
|------------|-------------------|------------|
| Data at Rest | AES-256 | 256-bit |
| Data in Transit | TLS 1.3 | 256-bit |
| Database | Transparent Data Encryption | 256-bit |
| Backups | AES-256 | 256-bit |

### Password Security

| Parameter | Implementation |
|-----------|----------------|
| Hashing Algorithm | bcrypt |
| Salt Rounds | 12 |
| Password Policy | Min 8 chars, uppercase, lowercase, number, special char |
| Account Lockout | After 5 failed attempts |
| Session Timeout | 30 minutes inactivity |

---

## PART C: ACCESS CONTROL

### Authentication Mechanisms

| Method | Status |
|--------|--------|
| Username/Password | ✓ Implemented |
| OTP via SMS | ✓ Implemented |
| OTP via Email | ✓ Implemented |
| Session-based Auth | ✓ Implemented |
| Role-based Access Control (RBAC) | ✓ Implemented |

### Admin Access Controls

| Control | Implementation |
|---------|----------------|
| Separate Admin Credentials | ✓ Yes |
| Admin Activity Logging | ✓ Complete audit trail |
| IP Whitelisting (Optional) | ✓ Available |
| Two-Factor Authentication | ✓ Available |

---

## PART D: NETWORK SECURITY

### Firewall and Protection

| Component | Specification |
|-----------|---------------|
| Web Application Firewall (WAF) | ✓ Active |
| DDoS Protection | ✓ Layer 3, 4, 7 |
| Intrusion Detection System (IDS) | ✓ Real-time monitoring |
| Intrusion Prevention System (IPS) | ✓ Auto-blocking |
| Rate Limiting | ✓ Per IP, per endpoint |

### Network Segmentation

| Zone | Purpose | Security Level |
|------|---------|----------------|
| DMZ | Public-facing servers | High |
| Application Zone | Backend services | Very High |
| Database Zone | Data storage | Maximum |
| Management Zone | Admin access | Maximum |

---

## PART E: VULNERABILITY MANAGEMENT

### Security Testing Schedule

| Test Type | Frequency | Last Conducted |
|-----------|-----------|----------------|
| Vulnerability Assessment | Quarterly | [Date] |
| Penetration Testing | Bi-annually | [Date] |
| Code Security Review | Per Release | [Date] |
| Security Audit | Annually | [Date] |

### Patch Management

| Category | Response Time |
|----------|---------------|
| Critical Vulnerabilities | Within 24 hours |
| High Vulnerabilities | Within 72 hours |
| Medium Vulnerabilities | Within 7 days |
| Low Vulnerabilities | Within 30 days |

---

## PART F: INCIDENT RESPONSE

### Security Incident Response Plan

| Phase | Actions |
|-------|---------|
| Detection | 24x7 monitoring, automated alerts |
| Containment | Immediate isolation of affected systems |
| Eradication | Root cause analysis and removal |
| Recovery | System restoration from clean backups |
| Lessons Learned | Post-incident review and improvements |

### Incident Notification

| Incident Severity | Notification Timeline |
|-------------------|----------------------|
| Critical | Within 1 hour |
| High | Within 4 hours |
| Medium | Within 24 hours |
| Low | Within 72 hours |

---

## DECLARATION

We, **Sai Educare Private Limited**, hereby declare that:

1. All security measures described in this certificate are currently implemented and operational.
2. We maintain compliance with CERT-IN guidelines and Government of India cybersecurity standards.
3. Regular security audits and vulnerability assessments are conducted.
4. We have a documented incident response plan and trained personnel.
5. All sensitive data is encrypted both at rest and in transit.

---

**Authorized Signatory:**

___________________________  
**Name:** [Director Name]  
**Designation:** Managing Director  
**Date:** [DD/MM/YYYY]

---

**Company Seal**

[SEAL]

---

**Verified By:**

___________________________  
**Name:** [Technical Head Name]  
**Designation:** Chief Technology Officer  
**Date:** [DD/MM/YYYY]

---

*This certificate is issued by Sai Educare Private Limited for tender/bidding purposes and represents our commitment to maintaining highest security standards.*

**CIN:** [Company Identification Number]  
**GSTIN:** [GST Identification Number]
